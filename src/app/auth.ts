import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { findUser, registerUser } from "@/app/firebase";

const users = [
  {
    username: "oi",
    color: "#E76B5D",
    name: "Oleg Ianchenko",
  },
  {
    username: "jk",
    color: "#50FFB1",
    name: "Julia Kharchenko",
  },
  {
    username: "rk",
    color: "#3800BA",
    name: "Ritesh Kanchi",
  },
];

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
        if (!credentials || !credentials.username || !credentials.password) {
          return null;
        }

        const res = await findUser(
          credentials.username as string,
          credentials.password as string
        );

        // unable to authenticate
        if (res.status === 401) {
          return null;
        }

        // found user, successful auth
        return {
          id: credentials.username,
          name: res.fullname,
          color: res.color,
        } as any; // TODO: fix this type
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
