"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { OAuthButton } from "@/components/oauth-button";
import { signUp } from "@/lib/auth-client";
import { signupSchema, type SignupFormData } from "@/lib/schema";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();

  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Handle password manager autofill
  // Password managers inject values directly into DOM, bypassing React events
  useEffect(() => {
    const checkAutofill = () => {
      if (!formRef.current) return;

      const fields = [
        { name: "name", id: "name" },
        { name: "email", id: "email" },
        { name: "password", id: "password" },
        { name: "confirmPassword", id: "confirm-password" },
      ] as const;

      fields.forEach(({ name, id }) => {
        const input = formRef.current?.querySelector<HTMLInputElement>(
          `#${id}`
        );
        if (input?.value) {
          setValue(name, input.value, { shouldValidate: true });
        }
      });
    };

    // Check after a short delay to allow password managers to fill
    const timeoutId = setTimeout(checkAutofill, 100);

    // Also listen for input events which some password managers trigger
    const form = formRef.current;
    form?.addEventListener("input", checkAutofill);

    return () => {
      clearTimeout(timeoutId);
      form?.removeEventListener("input", checkAutofill);
    };
  }, [setValue]);

  const onSubmit = async (data: SignupFormData) => {
    const { error } = await signUp.email({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    if (error) {
      setError("root", { message: error.message ?? "An error occurred" });
      return;
    }

    router.push("/");
  };

  return (
    <div className={cn("flex flex-col gap-2", className)} {...props}>
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold">Sign up</h1>
        <p className="text-sm text-muted-foreground">
          Create an account to get started
        </p>
      </div>

      <OAuthButton provider="google" mode="signup" />

      <div className="relative my-3">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            or continue with email
          </span>
        </div>
      </div>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup className="gap-4">
          <Field>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              type="text"
              placeholder="Ephraim Duncan"
              autoComplete="name"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="email">Email</FieldLabel>
            <Input
              id="email"
              type="email"
              placeholder="hello@ephraimduncan.com"
              autoComplete="email"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="password">Password</FieldLabel>
            <Input
              id="password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </Field>
          <Field>
            <FieldLabel htmlFor="confirm-password">Confirm Password</FieldLabel>
            <Input
              id="confirm-password"
              type="password"
              placeholder="********"
              autoComplete="new-password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </Field>
          {errors.root && (
            <p className="text-sm text-red-500">{errors.root.message}</p>
          )}
          <Field>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Loading..." : "Sign up"}
            </Button>

            <FieldDescription className="text-center">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
