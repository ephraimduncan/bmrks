import { ORPCError, os } from "@orpc/server";
import { headers } from "next/headers";
import { auth, type Session } from "@/lib/auth";

export const base = os.use(async ({ next }) => {
  const headersList = await headers();
  const session: Session | null = await auth.api.getSession({
    headers: headersList,
  });

  return next({
    context: {
      session,
      user: session?.user ?? null,
    },
  });
});

export const authed = base.use(({ context, next }) => {
  if (!context.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      ...context,
      user: context.user,
    },
  });
});
