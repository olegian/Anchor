import { createReadStream } from "fs";
import { signIn, signOut } from "./auth";

export default async function Home() {
  const loginHandler = async (formData: FormData) => {
    "use server";

    await signIn("credentials", {
      redirectTo: "/",
      username: formData.get("username"),
      password: formData.get("password"),
    });
  };

  const signUpHandler = async (formData: FormData) => {
    "use server";
    // what
  };

  const signOutHandler = async () => {
    "use server";

    await signOut();
  };

  return (
    <>
      <div> navigate to /doc_name </div>
      <form action={loginHandler}>
        <input type={"text"} name={"username"} id={"username"} />
        <input type={"text"} name={"password"} id={"password"} />
        <button type="submit"> sign in </button>
      </form>

      <form action={signUpHandler}>
        <input type={"text"} name={"username"} id={"username"} />
        <input type={"text"} name={"username"} id={"username"} />
        <button type="submit"> sign up </button>
      </form>

      <button onClick={signOutHandler}> sign out </button>
    </>
  );
}
