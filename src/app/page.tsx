import { signIn } from "./auth";
import { isRedirectError } from "next/dist/client/components/redirect-error";

import AuthForm from "./components/AuthForm";
import { registerUser } from "./firebase";

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
    try {
      await registerUser(
        formData.get("username") as string,
        formData.get("password") as string,
        formData.get("name") as string,
        formData.get("color") as string
      );

      // After registering the user, we can sign them in
      await loginHandler(formData);
    } catch (e) {
      if (isRedirectError(e)) {
        throw e;
      }
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-zinc-50">
      <div className="mx-auto max-w-xl p-8 bg-white border rounded-2xl border-zinc-200 w-full space-y-4">
        <AuthForm loginHandler={loginHandler} signUpHandler={signUpHandler} />
      </div>
    </div>
  );
}
