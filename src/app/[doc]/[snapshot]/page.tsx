import { auth } from "@/app/auth";
import { AuthGuard } from "@/app/components/AuthGuard";
import { redirect } from "next/navigation";
import SnapshotEditorPage from "./SnapshotEditorPage";

export default async function Page() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <AuthGuard redirectTo="/">
      <SnapshotEditorPage session={session} />
    </AuthGuard>
  );
}
