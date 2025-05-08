import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

export const { auth, signIn, signOut, handlers } = NextAuth({
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 day automatic signout
  },
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "username", type: "text" },
        password: { label: "password", type: "password" },
      },
      authorize: async (credentials, request) => {
        // TODO: make this actually check against a database
        const AUTHORIZED = ["oi", "jk", "rk"];
        if (AUTHORIZED.includes(credentials.username as string)) {
          return { username: credentials.username } as any; // apparently theres a bug that this cast addresses: https://stackoverflow.com/questions/74089665/next-auth-credentials-provider-authorize-type-error
        }

        throw new Error("Invalid Credentials");
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
        };
      }

      return token;
    },
    async session({ session, token }) {
      console.log("session cb", { session, token });
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },
  },
});

// import { authConfig } from "../../auth.config";
// import Credentials from "next-auth/providers/credentials";
// import { z } from "zod";

// interface User {
//   username: string;
//   password: string;
// }

// // TODO: SALTING + HASHING!!
// async function verifyCredentials(
//   username: string,
//   password: string
// ): Promise<User | Error> {
//   if (!username || !password)
//     return new Error("Username or password not specified");

//   return { username, password };
// }

// export const { auth, signIn, signOut } = NextAuth({
//   ...authConfig,
//   secret: process.env.NEXT_PUBLIC_SECRET,
//   providers: [
//     Credentials({
//       name: "credentials",
//       credentials: {
//         username: {label: "Username", type: "text"},
//         password: {label: "Password", type: "password"},
//       },
//       async authorize(credentials, req) {
//         // include check for proper user / pass specification here with z.min , z.email or in general those functions
//         const parsed = z
//           .object({ username: z.string(), password: z.string() })
//           .safeParse(credentials);
//         if (!parsed.success) {
//           return null;
//         }

//         const user = parsed.data;
//         const { username, password } = user;
//         const verified = await verifyCredentials(username, password);
//         if (verified instanceof Error) {
//             return null;
//         } else {
//             return verified as any;  // this cast is to avoid a TS bug. read this: https://stackoverflow.com/questions/74089665/next-auth-credentials-provider-authorize-type-error
//         }
//       },
//     }),
//   ],
// });
