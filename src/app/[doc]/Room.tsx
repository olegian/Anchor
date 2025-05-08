"use client";

import { ReactNode } from "react";
import { LiveblocksProvider, RoomProvider, ClientSideSuspense } from "@liveblocks/react/suspense";
import { Session } from "next-auth";
import { LiveList, LiveObject, LsonObject } from "@liveblocks/client";

const LB_AUTH_ENDPOINT = "/api/auth";
const HARDCODE_USERNAME = "oi";

// Define the storage schema to fix TypeScript errors
interface SnapshotEntry extends LsonObject {
  preview: string;
  snapshotId: string;
}

// Define the storage shape
type Storage = {
  snapshots: LiveList<LiveObject<SnapshotEntry>>;
  // We don't need to store prompt history in LiveMap since we're using server-side memory
};

export function Room({
  children,
  doc_name,
  session,
}: {
  children: ReactNode;
  doc_name: string;
  session: Session;
}) {
  const authHandler = async (roomId: string | undefined) => {
    if (!session.user) {
      console.log("No user id in session");
      return;
    }

    const response = await fetch(LB_AUTH_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomId,
        userId: session.user.name,
      }),
    });

    return await response.json();
  };

  // TODO: increase refresh rate by somehow changing throttle paramater. search through liveblocks docs.
  return (
    <LiveblocksProvider authEndpoint={authHandler}>
      <RoomProvider id={doc_name} initialStorage={{ snapshots: new LiveList([]) }}>
        <ClientSideSuspense fallback={<div>Loading...</div>}>{children}</ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
