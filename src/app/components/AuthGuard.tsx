import { redirect } from "next/navigation";
import { auth } from "../auth";
import React from "react";

export async function AuthGuard({
  children,
  redirectTo,
}: {
  children: React.ReactNode;
  redirectTo: string;
}) {
  const session = await auth();
  if (!session) {
    redirect(redirectTo);
  }

  return <> {children} </>;
}
