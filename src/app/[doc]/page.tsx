import { redirect } from "next/navigation";
import { auth } from "../auth";
import { AuthGuard } from "../components/AuthGuard";
import MainEditorPage from "./MainEditorPage";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <AuthGuard redirectTo="/">
      <MainEditorPage session={session} />;
    </AuthGuard>
  );
}
