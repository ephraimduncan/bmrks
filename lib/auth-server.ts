import "server-only";

import { headers } from "next/headers";
import { auth, type Session } from "./auth";

export async function getSession(): Promise<Session | null> {
  const headersList = await headers();
  return auth.api.getSession({ headers: headersList });
}
