"use client";

import dynamic from "next/dynamic";

const ShareDialog = dynamic(() => import("../dialog/ShareDialog"));

import { UserCircleIcon } from "@heroicons/react/20/solid";
import { User, Users } from "../Users";

import { useSession } from "next-auth/react";
import { useOthers, useStorage } from "@liveblocks/react";
import { useState } from "react";

export default function FloatingMenu({ docId }: { docId: string }) {
  const session = useSession();
  const usersOnDoc = useOthers((others) =>
    others.map((other) => other.presence.id)
  );

  const [openShareDialog, setOpenShareDialog] = useState<boolean>(false);
  const title = useStorage((root) => root.docTitle);

  return (
    <>
      <div className="fixed flex items-center justify-end top-4 right-4 z-40 space-x-4">
        <Users hover={true} usersList={usersOnDoc} />
        {usersOnDoc !== undefined && usersOnDoc.length > 0 ? (
          <div className="w-px h-8 bg-zinc-200" />
        ) : null}
        {session && session.data && session.data.user ? (
          <User
            id={session!.data!.user!.id ?? "Unknown User"}
            hover={true}
          />
        ) : (
          <UserCircleIcon className="size-6 fill-zinc-500 animate-pulse" />
        )}

        <button
          onClick={() => setOpenShareDialog(true)}
          className="text-sm px-2 py-1 rounded-lg bg-white border-zinc-200 border font-medium hover:bg-zinc-100 transition-colors text-zinc-700 cursor-pointer"
        >
          Share
        </button>
      </div>
      <ShareDialog
        title={title ?? "document"}
        isOpen={openShareDialog}
        close={() => setOpenShareDialog(false)}
        docId={docId}
      />
    </>
  );
}
