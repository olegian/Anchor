"use client";

import { useState } from "react";
import AnchorLogo from "./AnchorLogo";

export default function AuthForm({
  loginHandler,
  signUpHandler,
}: {
  loginHandler: (formData: FormData) => Promise<void>;
  signUpHandler: (formData: FormData) => Promise<void>;
}) {
  const [formState, setFormState] = useState<"login" | "signup">("login");

  const states = {
    login: {
      title: "Sign In",
      description: "Welcome back! Please enter your credentials to continue.",
    },
    signup: {
      title: "Create an account",
      description:
        "Nice to meet you! Please fill in the details below to create your account.",
    },
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="mx-auto max-w-4xl space-y-4">
        <h1 className="font-heading tracking-tighter text-5xl">
          {states[formState].title}
        </h1>
        <p className="text-zinc-500 tracking-tight text-lg font-semibold">
          {states[formState].description}{" "}
        </p>
        <hr className="border-zinc-200 w-4xl" />
        {formState === "login" ? (
          <LoginForm loginHandler={loginHandler} />
        ) : (
          <SignUpForm signUpHandler={signUpHandler} />
        )}
        <hr className="border-zinc-200 w-4xl" />
        <div className="flex items-start justify-between">
          <p className="text-sm text-zinc-600 font-medium">
            {formState === "login" ? "Don't h" : "H"}ave an account?{" "}
            <button
              type="button"
              className="text-black underline cursor-pointer hover:opacity-75 transition-opacity"
              onClick={() =>
                setFormState((prev) => (prev === "login" ? "signup" : "login"))
              }
            >
              {formState === "login" ? "Create an account" : "Log in"}
            </button>
          </p>
          <div className="flex flex-col items-end justify-start space-y-1">
            <AnchorLogo className="w-24 h-8 fill-zinc-800/25 z-50 float-right" />
            <p className="text-xs text-zinc-800/25 text-right font-heading w-45 tracking-tighter">
              A collaborative writing platform with context-aware and assistive
              AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({
  loginHandler,
}: {
  loginHandler: (formData: FormData) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        if (!username || !password) {
          e.preventDefault();
          return;
        }
      }}
      action={loginHandler}
      className="w-full space-y-4 py-4"
    >
      <div className="flex items-end justify-end w-full space-x-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="space-y-2">
            <label
              className="block text-zinc-700 text-base font-semibold tracking-tight font-heading"
              htmlFor="username"
            >
              Username
            </label>
            <input
              className="text-sm appearance-none border border-zinc-200 rounded-xl w-full py-2 px-3 text-zinc-700"
              id="username"
              type="text"
              placeholder="Enter your username"
              name="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label
              className="block text-zinc-700 text-base font-semibold tracking-tight font-heading"
              htmlFor="password"
            >
              Password
            </label>
            <input
              className="text-sm appearance-none border border-zinc-200 rounded-xl w-full py-2 px-3 text-zinc-700"
              id="password"
              type="password"
              placeholder="Enter your password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <button
          type="submit"
          className="disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap flex items-center justify-center text-sm h-[38px] w-[95px] rounded-xl bg-white border-zinc-200 border font-medium hover:bg-zinc-100 transition-colors text-zinc-700 cursor-pointer"
          disabled={!username || !password}
        >
          Sign In
        </button>
      </div>
    </form>
  );
}

function SignUpForm({
  signUpHandler,
}: {
  signUpHandler: (formData: FormData) => Promise<void>;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState(
    `#${Math.floor(Math.random() * 16777215).toString(16)}`
  );
  return (
    <form action={signUpHandler} className="w-full space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="space-y-2">
          <label
            className="block text-zinc-700 text-base font-semibold tracking-tight font-heading"
            htmlFor="username"
          >
            Username
          </label>
          <input
            className="text-sm appearance-none border border-zinc-200 rounded-xl w-full py-2 px-3 text-zinc-700"
            id="username"
            type="text"
            placeholder="Enter your username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-zinc-700 text-base font-semibold tracking-tight font-heading"
            htmlFor="name"
          >
            Name
          </label>
          <input
            className="text-sm appearance-none border border-zinc-200 rounded-xl w-full py-2 px-3 text-zinc-700"
            id="name"
            type="text"
            placeholder="Enter your name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <label
            className="block text-zinc-700 text-base font-semibold tracking-tight font-heading"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className="text-sm appearance-none border border-zinc-200 rounded-xl w-full py-2 px-3 text-zinc-700"
            id="password"
            type="password"
            placeholder="Enter your password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-end justify-between w-full space-x-4">
          <div className="space-y-2 w-full">
            <label
              htmlFor="color"
              className="block text-zinc-700 text-base font-semibold tracking-tight font-heading whitespace-nowrap"
            >
              Choose a color
            </label>
            <div className="flex items-start space-x-2">
              {[
                { color: "#FB3640", name: "Red" },
                { color: "#FAC937", name: "Yellow" },
                { color: "#37FA6B", name: "Green" },
                { color: "#3768FA", name: "Blue" },
                { color: "#FA7B37", name: "Orange" },
                { color: "#8537FA", name: "Purple" },
              ].map((c) => (
                <label
                  key={c.name}
                  className="relative cursor-pointer space-y-1 w-8"
                >
                  <input
                    type="radio"
                    name="color"
                    value={c.color}
                    className="sr-only peer"
                    onChange={(e) => setColor(e.target.value)}
                    checked={c.color === color}
                  />
                  <span
                    className="size-8 rounded-full border border-zinc-300 inline-block peer-checked:ring-2 peer-checked:ring-zinc-300 transition"
                    style={{ backgroundColor: c.color }}
                  />
                </label>
              ))}

              <label className="flex flex-col items-center justify-between h-full space-y-1.5 w-8">
                <div className="relative cursor-pointer overflow-hidden rounded-full w-8 h-8 border border-zinc-300 flex items-center justify-center shrink-0">
                  <input
                    type="color"
                    name="color"
                    id="color"
                    className="w-14 h-12 p-0 appearance-none cursor-pointer scale-125"
                    onClick={() => {
                      // Clear selected radios when color picker is clicked
                      const radios = document.querySelectorAll(
                        'input[type="radio"][name="color"]'
                      );
                      radios.forEach((radio) => {
                        (radio as HTMLInputElement).checked = false;
                      });
                    }}
                    onChange={(e) => setColor(e.target.value)}
                    value={color}
                  />
                </div>
                <p className="text-xs text-zinc-600 font-medium text-center">
                  Custom
                </p>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={!username || !password || !name || !color}
            className="disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap flex items-center justify-center shrink-0 text-sm h-[38px] w-[95px] rounded-xl bg-white border-zinc-200 border font-medium hover:bg-zinc-100 transition-colors text-zinc-700 cursor-pointer"
          >
            Sign Up
          </button>
        </div>
      </div>
    </form>
  );
}
