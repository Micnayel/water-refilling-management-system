import type { FastifyInstance, FastifyRequest } from "fastify";
import { and, eq } from "drizzle-orm";
import type { AppContext } from "../../context";
import { customers } from "../../db/schema";
import { newId, randomToken } from "../../lib/crypto";
import { errors, parseBody } from "../../lib/errors";
import {
  createCustomerSchema,
  geocodeSchema,
  queryCustomersSchema,
  updateCustomerSchema,
} from "./schemas";
import {
  approximateArea,
  findCustomer,
  maskCustomer,
  queryCustomers,
  revealCustomer,
} from "./service";

export async function registerCustomerRoutes(app: FastifyInstance, ctx: AppContext): Promise<void> {
  const hooks = { preHandler: [ctx.authenticate] };

  app.post("/customers/query", hooks, async (request) => {
    ctx.assertGrant(request, "customers:view");
    const input = parseBody(queryCustomersSchema, request.body ?? {});
    return queryCustomers(ctx.db, input);
  });

  app.get<{ Params: { id: string } }>("/customers/:id", hooks, async (request) => {
    ctx.assertGrant(request, "customers:view");
    const row = await findCustomer(ctx.db, request.params.id);
    if (!row) throw errors.notFound();
    return { ...maskCustomer(row), ...(await approximateArea(ctx.db, row.barangay)) };
  });

  app.post<{ Params: { id: string } }>("/customers/:id/reveal", hooks, async (request) => {
    ctx.assertGrant(request, "customers:reveal");
    const actor = ctx.requireUser(request);
    const row = await findCustomer(ctx.db, request.params.id);
    if (!row) throw errors.notFound();
    await ctx.audit({
      actorId: actor.id,
      event: "ACCESS",
      entityType: "customer",
      entityId: row.id,
      detail: "reveal",
    });
    return revealCustomer(row);
  });

  app.post("/customers", hooks, async (request, reply) => {
    ctx.assertGrant(request, "customers:add");
    const actor = ctx.requireUser(request);
    const input = parseBody(createCustomerSchema, request.body);
    const id = newId();
    const code = `CUS-${randomToken(3).toUpperCase()}`;
    await ctx.db.insert(customers).values({
      id,
      code,
      name: input.name,
      contact: input.contact,
      email: input.email ?? "",
      address: input.address,
      barangay: input.barangay,
      latitude: input.latitude !== undefined && input.latitude !== null ? String(input.latitude) : null,
      longitude:
        input.longitude !== undefined && input.longitude !== null ? String(input.longitude) : null,
    });
    await ctx.audit({
      actorId: actor.id,
      event: "CUSTOMER_CREATE",
      entityType: "customer",
      entityId: id,
    });
    const row = await findCustomer(ctx.db, id);
    if (!row) throw errors.notFound();
    reply.code(201);
    return maskCustomer(row);
  });

  app.patch<{ Params: { id: string } }>("/customers/:id", hooks, async (request) => {
    ctx.assertGrant(request, "customers:edit");
    const actor = ctx.requireUser(request);
    const input = parseBody(updateCustomerSchema, request.body);
    const existing = await findCustomer(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();

    const [result] = await ctx.db
      .update(customers)
      .set({
        name: input.name ?? existing.name,
        contact: input.contact ?? existing.contact,
        email: input.email ?? existing.email,
        address: input.address ?? existing.address,
        barangay: input.barangay ?? existing.barangay,
        latitude:
          input.latitude === undefined
            ? existing.latitude
            : input.latitude === null
              ? null
              : String(input.latitude),
        longitude:
          input.longitude === undefined
            ? existing.longitude
            : input.longitude === null
              ? null
              : String(input.longitude),
        version: existing.version + 1,
      })
      .where(and(eq(customers.id, existing.id), eq(customers.version, input.version)));
    if (!result.affectedRows) throw errors.conflict();

    await ctx.audit({
      actorId: actor.id,
      event: "CUSTOMER_UPDATE",
      entityType: "customer",
      entityId: existing.id,
    });
    const row = await findCustomer(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return maskCustomer(row);
  });

  const setStatus = async (
    request: FastifyRequest<{ Params: { id: string } }>,
    status: "active" | "archived",
  ) => {
    const actor = ctx.requireUser(request);
    ctx.assertGrant(request, "customers:delete");
    const existing = await findCustomer(ctx.db, request.params.id);
    if (!existing) throw errors.notFound();
    await ctx.db
      .update(customers)
      .set({ status, version: existing.version + 1 })
      .where(eq(customers.id, existing.id));
    await ctx.audit({
      actorId: actor.id,
      event: "CUSTOMER_DELETE",
      entityType: "customer",
      entityId: existing.id,
      detail: status,
    });
    const row = await findCustomer(ctx.db, existing.id);
    if (!row) throw errors.notFound();
    return maskCustomer(row);
  };

  app.post<{ Params: { id: string } }>("/customers/:id/archive", hooks, (request) =>
    setStatus(request, "archived"),
  );
  app.post<{ Params: { id: string } }>("/customers/:id/restore", hooks, (request) =>
    setStatus(request, "active"),
  );

  app.post("/customers/geocode", hooks, async (request) => {
    ctx.assertGrant(request, "customers:add");
    const input = parseBody(geocodeSchema, request.body);
    const key = ctx.config.google.geocodeKey;
    if (!key) throw errors.invalid("Geocoding is not configured.");
    const url = new URL("https://maps.googleapis.com/maps/api/geocode/json");
    url.searchParams.set("address", input.address);
    url.searchParams.set("key", key);
    const response = await fetch(url);
    if (!response.ok) throw errors.invalid("Geocoding is unavailable.");
    const payload = (await response.json()) as {
      status?: string;
      results?: Array<{ geometry?: { location?: { lat?: number; lng?: number } } }>;
    };
    const location = payload.results?.[0]?.geometry?.location;
    if (payload.status !== "OK" || !location?.lat || !location?.lng) {
      throw errors.notFound();
    }
    return { latitude: location.lat, longitude: location.lng };
  });

  app.get("/customers/export", hooks, async (request, reply) => {
    ctx.assertGrant(request, "customers:export");
    const actor = ctx.requireUser(request);
    const page = await queryCustomers(ctx.db, { pageSize: 100 });
    await ctx.audit({
      actorId: actor.id,
      event: "CUSTOMER_EXPORT",
      entityType: "customer",
    });
    const header = "code,name,contact,barangay,status\n";
    const body = page.items
      .map((customer) => `${customer.code},"${customer.name}","${customer.contact}",${customer.barangay},${customer.status}`)
      .join("\n");
    reply.header("content-type", "text/csv; charset=utf-8");
    reply.header("content-disposition", "attachment; filename=customers.csv");
    return `${header}${body}`;
  });
}
