import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { useMutation, useMyPresence, useOthers } from "@liveblocks/react";
import { Users } from "../Users";
import { redirect, useParams } from "next/navigation";

export function MainListItem() {
  const params = useParams<{ doc: string; snapshot: string }>();
  const usersOnMain = useOthers((others) =>
    others.map((other) => other.presence.name)
  );

  const handleNavigate = () => {
    redirect(`/${params.doc}`);
  };

  return (
    <button
      className="bg-amber-100 cursor-pointer group hover:opacity-75 transition-colors w-full rounded-lg p-2 flex items-center justify-between"
      onClick={handleNavigate}
    >
      <div className="font-semibold text-sm px-2 py-1 rounded-lg bg-amber-300 inline-block text-black">
        Main
      </div>
      <div className="flex items-center justify-end gap-1">
        <Users hover={false} usersList={usersOnMain} />
        <ChevronRightIcon className="size-5 shrink-0 text-amber-700" />
      </div>
    </button>
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
    <button className="bg-blue-100 cursor-pointer group hover:opacity-75 transition-colors w-full rounded-lg p-2 flex items-center justify-between">
      <div className="font-semibold text-sm px-2 py-1 rounded-lg bg-blue-500 inline-block text-white">
        {title}
      </div>
      <div className="flex items-center justify-end gap-1">
        <Users hover={false} usersList={usersOnSnapshot} />
        <ChevronRightIcon className="size-5 shrink-0 text-blue-700" />
      </div>
    </button>
  );
}

export function SnapshotListItem({
  id,
  snapshotInfo,
}: {
  id: string;
  snapshotInfo: any; // cheating on this type, as this is a long definition of a readonly copy of the SnapshotEntry type described in the liveblocks config
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
    <li
      className="cursor-pointer group py-2 px-4 hover:bg-zinc-100 transition-colors flex items-center justify-between"
      onClick={handleNavigate}
    >
      <h4 className="font-semibold text-sm text-zinc-700">
        {snapshotInfo.snapshotTitle}
      </h4>

      <div className="flex items-center justify-end gap-1">
        <Users hover={false} usersList={usersOnSnapshot} />
        <button className="text-zinc-700 p-1 hover:text-zinc-500">
          <ChevronRightIcon className="size-5 shrink-0" />
        </button>
      </div>
    </li>
  );
}
