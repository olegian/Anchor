"use client";

import { CogIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import { User, Users } from "../Users";

import { useSession } from "next-auth/react";
import { useOthers } from "@liveblocks/react";

export default function FloatingMenu() {
  const session = useSession();
  const usersOnMain = useOthers((others) =>
    others.map((other) => other.presence.name)
  );

  return (
    <div className="fixed flex items-center justify-end top-4 right-4 z-20 bg-white  border border-zinc-200 p-2 rounded-xl space-x-2">
      <Users hover={true} usersList={usersOnMain} />
      <div className="w-px h-8 bg-zinc-200" />
      {session && session.data && session.data.user ? (
        <User
          first={session.data!.user!.name!.charAt(0)}
          last={session.data!.user!.name!.charAt(1)}
          hover={true}
        />
      ) : (
        // <div className="flex animate-pulse items-center justify-center w-6 h-6 rounded-full bg-zinc-200" />
        <UserCircleIcon className="size-6 fill-gray-500 animate-pulse" />
      )}
      <div className="bg-white w-8 h-8 transition-colors rounded-lg hover:bg-gray-100 flex items-center justify-center">
        <CogIcon className="size-5 text-gray-700" />
      </div>
    </div>
  );
}
