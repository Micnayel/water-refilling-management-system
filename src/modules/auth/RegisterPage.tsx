import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { apiMessage } from "@/lib/api-client";
import { AuthLayout } from "./AuthLayout";
import { useRegisterMutation } from "./hooks";
import { registerSchema, type RegisterValues } from "./schemas";
import { useTurnstile } from "./use-turnstile";

export function RegisterPage() {
  const register = useRegisterMutation();
  const [turnstileToken, setTurnstileToken] = useState("");
  const turnstile = useTurnstile(setTurnstileToken);
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      username: "",
      password: "",
      confirmPassword: "",
      turnstileToken: "",
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await register.mutateAsync({ ...values, turnstileToken: turnstileToken || undefined });
      form.reset();
    } catch {
      // Rendered from mutation state.
    }
  });

  if (register.isSuccess) {
    return (
      <AuthLayout
        title="Registration received"
        description="Your account is pending administrator approval."
        footer={
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to sign in
          </Link>
        }
      >
        <Alert tone="success">
          An administrator will review your registration and assign access. You cannot sign in until
          the account is approved.
        </Alert>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create an account"
      description="Self-registered accounts stay inactive until an administrator approves them."
      footer={
        <>
          Already approved?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </>
      }
    >
      <form className="space-y-3" onSubmit={onSubmit} noValidate>
        {register.isError ? <Alert tone="destructive">{apiMessage(register.error)}</Alert> : null}
        <Field label="Full name" htmlFor="fullName" error={form.formState.errors.fullName?.message} required>
          <Input id="fullName" autoComplete="name" autoFocus {...form.register("fullName")} />
        </Field>
        <Field label="Email" htmlFor="email" error={form.formState.errors.email?.message} required>
          <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        </Field>
        <Field label="Username" htmlFor="username" error={form.formState.errors.username?.message} required>
          <Input id="username" autoComplete="username" {...form.register("username")} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Password" htmlFor="password" error={form.formState.errors.password?.message} required>
            <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
          </Field>
          <Field
            label="Confirm password"
            htmlFor="confirmPassword"
            error={form.formState.errors.confirmPassword?.message}
            required
          >
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              {...form.register("confirmPassword")}
            />
          </Field>
        </div>
        <div ref={turnstile.containerRef} />
        <Button type="submit" className="w-full" loading={register.isPending}>
          Register
        </Button>
        <p className="text-xs text-muted-foreground">
          Passwords are hashed on the server and never logged. Never share your password.
        </p>
      </form>
    </AuthLayout>
  );
}
