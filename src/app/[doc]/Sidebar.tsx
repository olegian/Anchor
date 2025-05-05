"use client";

import { JsonObject, LiveList, LiveObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react";
import { useRoom } from "@liveblocks/react/suspense";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SnapshotEntry extends JsonObject {
  preview: string;
  snapshotId: string;
}

function SidebarSnapshot({
  snapshot,
  id,
}: {
  snapshot: { readonly preview: string; readonly snapshotId: string };
  id: number;
}) {
  return (
    <div key={id} className={"sidebar-snapshot"}>
      ID: {snapshot.snapshotId}
    </div>
  );
}

export function Sidebar({ doc }: { doc: string }) {
  const snapshots = useStorage((root) => root.snapshots);
  const addSnapshot = useMutation(({ storage }, newSnapshotId: string) => {
    const snapshots = storage.get("snapshots");
    snapshots.push(
      new LiveObject<SnapshotEntry>({
        preview: "",
        snapshotId: newSnapshotId,
      })
    );
  }, []);

  const room = useRoom();
  const router = useRouter();

  const prompt_handler = () => {
    const newSnapshotId = crypto.randomUUID();

    addSnapshot(newSnapshotId);
    router.push(`/${doc}/${newSnapshotId}`);

    // still need to populate newsnapshotid editor content
  };

  return (
    <>
      <div className={"sidebar-container"}>
        {snapshots?.map((snapshot, idx) => {
          return <SidebarSnapshot snapshot={snapshot} id={idx} key={idx} />;
        })}
      </div>
      <button onClick={prompt_handler}>Send LLM Request</button>
    </>
  );
}
