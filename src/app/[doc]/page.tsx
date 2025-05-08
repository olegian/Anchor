import { redirect } from "next/navigation";
import { auth } from "../auth";
import DocPage from "./DocPage";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return <DocPage session={session} />;
}
