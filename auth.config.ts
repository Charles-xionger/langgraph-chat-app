import type { NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";

// Auth config for edge runtime (middleware)
export const authConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLogin = nextUrl.pathname.startsWith("/login");
      const isOnAuth = nextUrl.pathname.startsWith("/api/auth");

      if (isOnAuth) {
        return true; // Always allow auth API routes
      }

      if (isOnLogin) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true; // Allow login page for non-authenticated users
      }

      return isLoggedIn; // Require authentication for all other routes
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;
