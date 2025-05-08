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
  openSnapshotHandler,
}: {
  snapshot: { readonly preview: string; readonly snapshotId: string };
  id: number;
  openSnapshotHandler: (snapshot: string) => void;
}) {
  return (
    <button
      key={id}
      className={"sidebar-snapshot"}
      onClick={() => {
        openSnapshotHandler(snapshot.snapshotId);
      }}
    >
      ID: {snapshot.snapshotId}
    </button>
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

  const router = useRouter();

  const prompt_handler = () => {
    const newSnapshotId = crypto.randomUUID();

    // still need to populate newsnapshotid editor content
    addSnapshot(newSnapshotId);

    router.push(`/${doc}/${newSnapshotId}`);
  };

  const openSnapshotHandler = (snapshot: string) => {
    router.push(`/${doc}/${snapshot}`);
  };

  return (
    <>
      <div className={"sidebar-container"}>
        {snapshots?.map((snapshot, idx) => {
          return (
            <SidebarSnapshot
              openSnapshotHandler={openSnapshotHandler}
              snapshot={snapshot}
              id={idx}
              key={idx}
            />
          );
        })}
      </div>
      <button onClick={prompt_handler}>Send LLM Request</button>
    </>
  );
}
