import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { NextAuthConfig } from "next-auth"

export const config = {
  theme: {
    logo: "https://next-auth.js.org/img/logo/logo-sm.png",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text", placeholder: "admin" },
        password: { label: "Password", type: "password", placeholder: "password" },
      },
      authorize: async (credentials) => {
        // For MVP, hardcode a user
        if (
          (credentials.username === "admin" && credentials.password === "password") || 
          (credentials.username === "student" && credentials.password === "sat")
        ) {
          return { id: "1", name: credentials.username as string, email: `${credentials.username}@example.com` }
        }
        return null
      },
    }),
  ],
  callbacks: {
    authorized({ request, auth }) {
      const { pathname } = request.nextUrl
      if (pathname === "/login") {
        return true // Always allow access to login page
      }
      return !!auth // Allow access if authenticated
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(config)

