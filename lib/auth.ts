import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

const extensionId = process.env.CHROME_EXTENSION_ID;

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, {
    provider: "sqlite",
  }),
  trustedOrigins: extensionId ? [`chrome-extension://${extensionId}`] : [],
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/sign-up") && ctx.context.newSession) {
        await db.group.create({
          data: {
            name: "Bookmarks",
            color: "#74B06F",
            userId: ctx.context.newSession.user.id,
          },
        });
      }
    }),
  },
});
