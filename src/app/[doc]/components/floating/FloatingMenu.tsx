"use client";

import { CogIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import { User, Users } from "../Users";

import { useSession } from "next-auth/react";
import { useOthers } from "@liveblocks/react";

export default function FloatingMenu() {
  const session = useSession();
  const usersOnDoc = useOthers((others) =>
    others.map((other) => other.presence.name)
  );

  return (
    <div className="fixed flex items-center justify-end top-4 right-4 z-50 space-x-2">
      <Users hover={true} usersList={usersOnDoc} />
      {usersOnDoc !== undefined && usersOnDoc.length > 0 ? (
        <div className="w-px h-8 bg-zinc-200" />
      ) : null}
      {session && session.data && session.data.user ? (
        <User name={session!.data!.user!.name ?? "Unknown User"} hover={true} />
      ) : (
        <UserCircleIcon className="size-6 fill-zinc-500 animate-pulse" />
      )}
      <div className="bg-white w-8 h-8 transition-colors rounded-lg hover:bg-zinc-100 flex items-center justify-center">
        <CogIcon className="size-5 text-zinc-700" />
      </div>
    </div>
  );
}
