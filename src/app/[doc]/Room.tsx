"use client";

import { ArrowPathIcon } from "@heroicons/react/20/solid";
import { LiveMap, LiveObject } from "@liveblocks/client";
import {
  ClientSideSuspense,
  LiveblocksProvider,
  RoomProvider,
} from "@liveblocks/react/suspense";
import { Session } from "next-auth";
import { redirect } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import LoadingState from "../components/LoadingState";

const LB_AUTH_ENDPOINT = "/api/auth";

export function Room({
  children,
  docId,
  session,
}: {
  children: ReactNode;
  docId: string;
  session: Session;
}) {
  const [authFailed, setAuthFailed] = useState(false);
  useEffect(() => {
    if (authFailed) {
      redirect("/home");
    }
  }, [authFailed]);

  const authHandler = async (roomId: string | undefined) => {
    if (!session.user || !session.user.id) {
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
        userId: session.user.id,
      }),
    });

    if (response.status !== 200) {
      setAuthFailed(true);
    }

    return await response.json();
  };

  // TODO: increase refresh rate by changing throttle parameter on provider. search through liveblocks docs.
  return (
    <LiveblocksProvider authEndpoint={authHandler}>
      <RoomProvider
        initialPresence={{
          openHandles: [],
          id: session.user?.id ?? "",
        }} // ?? should be unnecessary?
        id={docId}
        initialStorage={{
          docHandles: new LiveMap(),
          docTitle: "New Document",
        }}
      >
        <ClientSideSuspense fallback={<LoadingState />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
