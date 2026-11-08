import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiMessage } from "@/lib/api-client";
import { useSessionStore } from "@/stores/session-store";
import { AuthLayout } from "./AuthLayout";
import { useLoginMutation } from "./hooks";
import { loginSchema, type LoginValues } from "./schemas";
import { useTurnstile } from "./use-turnstile";

export function LoginPage() {
  const status = useSessionStore((state) => state.status);
  const navigate = useNavigate();
  const location = useLocation();
  const login = useLoginMutation();
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstile = useTurnstile(setTurnstileToken);
  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "", turnstileToken: "" },
  });

  const from =
    (location.state as { from?: string } | null)?.from && (location.state as { from?: string }).from !== "/login"
      ? (location.state as { from: string }).from
      : "/";

  if (status === "authenticated") {
    return <Navigate to={from} replace />;
  }

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await login.mutateAsync({ ...values, turnstileToken: turnstileToken || undefined });
      navigate(from, { replace: true });
    } catch {
      // The error is rendered from the mutation state.
    }
  });

  return (
    <AuthLayout
      title="Sign in"
      description="Use your staff account to open the workspace."
      footer={
        <>
          Need an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">
            Register for approval
          </Link>
        </>
      }
    >
      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        {login.isError ? <Alert tone="destructive">{apiMessage(login.error)}</Alert> : null}
        <Field label="Username or email" htmlFor="identifier" error={form.formState.errors.identifier?.message} required>
          <Input
            id="identifier"
            autoComplete="username"
            autoFocus
            aria-invalid={Boolean(form.formState.errors.identifier)}
            {...form.register("identifier")}
          />
        </Field>
        <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message} required>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
            {...form.register("password")}
          />
        </Field>
        <div ref={turnstile.containerRef} />
        {turnstile.unavailable ? (
          <p className="text-xs text-muted-foreground">
            The verification widget could not load. You can still try signing in.
          </p>
        ) : null}
        <Button type="submit" className="w-full" loading={login.isPending}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
