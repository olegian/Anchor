"use client";

import { useParams } from "next/navigation";
import { Room } from "../Room";
import { SnapShotEditor } from "./SnapShotEditor";

export default function DocPage() {
  const params = useParams<{ doc: string; snapshot: string }>();

  return (
    <div className="div">
      <div>
        {" "}
        DOC_PAGE: {params.doc}, snapshot: {params.snapshot}
      </div>
      <Room doc_name={params.doc}>
        <SnapShotEditor doc={params.doc} snapshotId={params.snapshot} />
      </Room>
    </div>
  );
}
