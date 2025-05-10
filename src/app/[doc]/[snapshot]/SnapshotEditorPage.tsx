"use client";

import { Session } from "next-auth";
import { useParams } from "next/navigation";
import { Room } from "../Room";
import { SnapShotEditor } from "./SnapShotEditor";

export default function SnapshotEditorPage({ session }: { session: Session }) {
  const params = useParams<{ doc: string; snapshot: string }>();

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
