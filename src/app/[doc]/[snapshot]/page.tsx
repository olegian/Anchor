"use client";

import { redirect, useParams } from "next/navigation";
import { Room } from "../Room";
import { SnapShotEditor } from "./SnapShotEditor";
import { useSession } from "next-auth/react";
import { auth } from "@/app/auth";

export default async function DocPage() {
  const params = useParams<{ doc: string; snapshot: string }>();

  const session = await auth();
  if (!session) {
    redirect("/");
  }

  return (
    <div className="div">
      <div>
        {" "}
        DOC_PAGE: {params.doc}, snapshot: {params.snapshot}
      </div>
      <Room doc_name={params.doc} session={session}>
        <SnapShotEditor
          doc={params.doc}
          snapshotEntry={{
            isInitialized: false,
            snapshotId: params.snapshot,
          }}
        />
      </Room>
    </div>
  );
}
