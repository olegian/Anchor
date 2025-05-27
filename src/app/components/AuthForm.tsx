"use client";

import { useState } from "react";
import AnchorLogo from "./AnchorLogo";
import { log } from "console";

export default function AuthForm({
  loginHandler,
  signUpHandler,
}: {
  loginHandler: (formData: FormData) => Promise<void>;
  signUpHandler: (formData: FormData) => Promise<void>;
}) {
  const [formState, setFormState] = useState<"login" | "signup">("login");

  return (
    <div className="space-y-4">
      {formState === "login" ? (
        <LoginForm loginHandler={loginHandler} />
      ) : (
        <SignUpForm signUpHandler={signUpHandler} />
      )}
      <p className="text-sm text-zinc-600 font-medium">
        {formState === "login" ? (
          <>
            Don't have an account?{" "}
            <button
              type="button"
              className="text-blue-500 underline cursor-pointer"
              onClick={() => setFormState("signup")}
            >
              Sign Up
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              className="text-blue-500 underline cursor-pointer"
              onClick={() => setFormState("login")}
            >
              Sign In
            </button>
          </>
        )}
      </p>
    </div>
  );
}

function LoginForm({
  loginHandler,
}: {
  loginHandler: (formData: FormData) => Promise<void>;
}) {
  return (
    <>
      <div className="space-y-2">
        <AnchorLogo className="w-24 h-8 fill-zinc-800" />
        <h1 className="text-3xl tracking-tighter font-semibold">
          Welcome back!
        </h1>
      </div>
      <hr className="border-zinc-200" />
      <form action={loginHandler} className="w-full space-y-4">
        <div className="space-y-2">
          <label
            className="block text-zinc-700 text-sm font-semibold tracking-tight"
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
            className="block text-zinc-700 text-sm font-semibold tracking-tight"
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

        <button
          type="submit"
          className="text-sm px-2 py-1 rounded-lg bg-white border-zinc-200 border font-medium hover:bg-zinc-100 transition-colors text-zinc-700 cursor-pointer"
        >
          Sign In
        </button>
      </form>
    </>
  );
}

function SignUpForm({
  signUpHandler,
}: {
  signUpHandler: (formData: FormData) => Promise<void>;
}) {
  return (
    <>
      <div className="space-y-2">
        <AnchorLogo className="w-24 h-8 fill-zinc-800" />
        <h1 className="text-3xl tracking-tighter font-semibold">
          Create an account
        </h1>
      </div>
      <hr className="border-zinc-200" />
      <form action={signUpHandler} className="w-full space-y-4">
        <div className="space-y-2">
          <label
            className="block text-zinc-700 text-sm font-semibold tracking-tight"
            htmlFor="username"
          >
            Username
          </label>
          <input
            className="appearance-none border border-zinc-200 rounded-lg w-full py-2 px-3 text-zinc-700"
            id="username"
            type="text"
            placeholder="Choose a username"
            name="username"
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-zinc-700 text-sm font-semibold tracking-tight"
            htmlFor="name"
          >
            Name
          </label>
          <input
            className="appearance-none border border-zinc-200 rounded-lg w-full py-2 px-3 text-zinc-700"
            id="name"
            type="text"
            placeholder="Enter your name"
            name="name"
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-zinc-700 text-sm font-semibold tracking-tight"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="appearance-none border border-zinc-200 rounded-lg w-full py-2 px-3 text-zinc-700"
            id="password"
            type="password"
            placeholder="Choose a password"
            name="password"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="color"
            className="block text-zinc-700 text-sm font-semibold tracking-tight"
          >
            Choose a color
          </label>
          <div className="w-8 h-8 cursor-pointer border border-zinc-200 rounded-full flex items-center justify-center overflow-hidden relative bg-red-50">
            <input
              type="color"
              name="color"
              className="w-12 h-12 shrink-0 rounded-full overflow-hidden"
              defaultValue="#000000"
            />
          </div>
        </div>

        <button
          type="submit"
          className="text-sm px-2 py-1 rounded-lg bg-white border-zinc-200 border font-medium hover:bg-zinc-100 transition-colors text-zinc-700 cursor-pointer"
        >
          Sign Up
        </button>
      </form>
      {/* <form action={loginHandler} className="w-full space-y-4" method="post">
      <div className="space-y-2">
        <label
          className="block text-zinc-700 text-sm font-semibold tracking-tight"
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
          className="block text-zinc-700 text-sm font-semibold tracking-tight"
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

      <button
        type="submit"
        className="text-sm px-2 py-1 rounded-lg bg-white border-zinc-200 border font-medium hover:bg-zinc-100 transition-colors text-zinc-700 cursor-pointer"
      >
        Sign In
      </button>
    </form> */}
    </>
  );
}
