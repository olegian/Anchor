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
        // TODO: populate more user information to use in application 
        const AUTHORIZED = ["oi", "jk", "rk"];
        if (AUTHORIZED.includes(credentials.username as string)) {
          return { name: credentials.username } as any; // apparently theres a bug that this cast addresses: https://stackoverflow.com/questions/74089665/next-auth-credentials-provider-authorize-type-error
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
          name: user.name,
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
