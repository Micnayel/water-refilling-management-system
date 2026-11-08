import "fastify";

import type { SessionData } from "./lib/sessions";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  roleId: string | null;
  status: string;
  grants: string[];
  template: string;
}

declare module "fastify" {
  interface FastifyRequest {
    authUser: AuthUser | null;
    sessionData: SessionData | null;
    sessionToken: string | null;
  }
}
