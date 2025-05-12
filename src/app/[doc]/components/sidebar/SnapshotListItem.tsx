import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { useMutation, useMyPresence, useOthers } from "@liveblocks/react";
import { Users } from "../Users";
import { redirect, useParams } from "next/navigation";
import Link from "next/link";

export function MainListItemLink() {
  const params = useParams<{ doc: string; snapshot: string }>();
  const usersOnMain = useOthers((others) =>
    others.map((other) => other.presence.name)
  );

  return (
    <Link
      href={`/${params.doc}`}
      className="border-b border-zinc-200 cursor-pointer flex items-center justify-between w-full hover:bg-zinc-100 p-2"
    >
      <div className="relative font-semibold text-sm p-2 py-1 rounded-lg bg-amber-300 text-black">
        Main
      </div>
      <div className="flex items-center justify-end gap-1">
        <Users hover={false} usersList={usersOnMain} />
        <div className="text-zinc-700 p-1 hover:text-zinc-500">
          <ChevronRightIcon className="size-5 shrink-0" />
        </div>
      </div>
    </Link>
  );
}

export function MainListItem() {
  const usersOnMain = useOthers((others) =>
    others
      .filter((other) => other.presence.currentSnapshot === null)
      .map((other) => other.presence.name)
  );

  return (
    <div className="flex items-center justify-between w-full">
      <div className="relative font-semibold text-sm p-2 py-1 rounded-lg bg-amber-300 text-black">
        Main
      </div>
      <Users hover={false} usersList={usersOnMain} />
    </div>
  );
}

export function CurrentSnapshotListItem({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const usersOnSnapshot = useOthers((others) =>
    others
      .filter((other) => {
        return other.presence.currentSnapshot === id;
      })
      .map((other) => other.presence.name)
  );

  return (
    <div className="flex items-center justify-between w-full">
      <div className="relative font-semibold text-sm p-2 py-1 rounded-lg bg-blue-600 inline-flex items-center justify-center text-white">
        Snapshot
      </div>
      <Users hover={false} usersList={usersOnSnapshot} />
    </div>
  );
}

export function SnapshotListItem({
  id,
  snapshotInfo,
  isActive,
}: {
  id: string;
  snapshotInfo: any; // cheating on this type, as this is a long definition of a readonly copy of the SnapshotEntry type described in the liveblocks config
  isActive: boolean;
}) {
  const params = useParams<{ doc: string; snapshot: string }>();
  const usersOnSnapshot = useOthers((others) =>
    others
      .filter((other) => {
        return other.presence.currentSnapshot === id;
      })
      .map((other) => other.presence.name)
  );

  const handleNavigate = () => {
    redirect(`/${params.doc}/${id}`);
  };

  return (
    <li>
      <Link
        href={`/${params.doc}/${id}`}
        className={`cursor-pointer group p-2 ${
          isActive ? "bg-zinc-100" : "hover:bg-zinc-100"
        } transition-colors flex items-center justify-between`}
      >
        <h4 className="font-semibold text-sm text-zinc-700">
          {snapshotInfo.snapshotTitle}
        </h4>
        <div className="flex items-center justify-end gap-1">
          <Users hover={false} usersList={usersOnSnapshot} />
          <div className="text-zinc-700 p-1 hover:text-zinc-500">
            <ChevronRightIcon className="size-5 shrink-0" />
          </div>
        </div>
      </Link>
    </li>
  );
}
