"use client";

import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { Session } from "next-auth";
import { ReactNode } from "react";

const LB_AUTH_ENDPOINT = "/api/auth";

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
    if (!session.user || !session.user.name) {
      console.log("No user id in session: ", session);
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
      <RoomProvider
        initialPresence={{ currentSnapshot: null, name: session.user?.name ?? "" }}   // ?? should be unnecessary?
        id={doc_name}
        initialStorage={{ snapshots: new LiveMap() }}
      >
        <ClientSideSuspense
          fallback={
            <div className="w-screen h-screen flex items-center justify-center gap-2">
              <ArrowPathIcon className="size-5 animate-spin text-gray-500" />
              <p className="text-gray-500">Loading...</p>
            </div>
          }
        >
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
