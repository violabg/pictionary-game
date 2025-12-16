import GitHub from "@auth/core/providers/github";
import { defineAuth } from "@convex-dev/auth/server";

export const { auth, signIn, signOut, store } = defineAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    }),
  ],
});
