import { redirect } from "next/navigation";
import { auth } from "../auth";
import { AuthGuard } from "../components/AuthGuard";
import MainEditorPage from "./MainEditorPage";
import AnchorLogo from "../components/AnchorLogo";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="bg-zinc-50">
      <AuthGuard redirectTo="/">
        <MainEditorPage session={session} />
        <AnchorLogo className="fixed bottom-4 right-4 w-24 h-8 fill-zinc-800/25 z-50" />
      </AuthGuard>
    </div>
  );
}
