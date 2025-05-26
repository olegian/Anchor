import { createReadStream } from "fs";
import { signIn, signOut } from "./auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { AuthError } from "next-auth";

export default async function Home() {
  const loginHandler = async (formData: FormData) => {
    "use server";

    try {
      await signIn("credentials", {
        redirectTo: "/home",
        username: formData.get("username"),
        password: formData.get("password"),
      });
    } catch (e) {
      if (isRedirectError(e)) {
        throw e;
      }
    }
  };

  const signUpHandler = async (formData: FormData) => {
    "use server";
    // what
    // we gotta do this at some point....
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-white">
      <div className="mx-auto max-w-3xl px-4 py-8 w-full">
        <div className="w-full space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">Anchor</h1>
            <p className="text-lg">Please sign in to continue</p>
          </div>
          <form action={loginHandler} className="w-full space-y-4">
            <div className="grid md:grid-cols-2 md:space-x-4 space-y-2 md:space-y-0">
              <div className="space-y-2">
                <label
                  className="block text-zinc-700 text-sm font-bold"
                  htmlFor="username"
                >
                  Username
                </label>
                <input
                  className="appearance-none border border-zinc-200 rounded-lg w-full py-2 px-3 text-zinc-700"
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  name="username"
                />
              </div>
              <div className="space-y-2">
                <label
                  className="block text-zinc-700 text-sm font-bold"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  className="appearance-none border border-zinc-200 rounded-lg w-full py-2 px-3 text-zinc-700"
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  name="password"
                />
              </div>
            </div>

            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-sm cursor-pointer"
              type="submit"
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
