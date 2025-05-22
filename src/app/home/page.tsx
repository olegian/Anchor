"use client";
import { useSession } from "next-auth/react";
// import { AuthGuard } from "../components/AuthGuard";
import useSWR from "swr";
import { Room } from "@liveblocks/client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { PlusIcon, UserCircleIcon } from "@heroicons/react/20/solid";
import { useState } from "react";

import dynamic from "next/dynamic";
import UserMenu from "./components/UserMenu";
const NewDocDialog = dynamic(() => import("./components/NewDocDialog"));

const fetcher = (...args: [RequestInfo | URL, RequestInit?]) =>
  fetch(...args).then((res) => res.json());

export default function Home() {
  const session = useSession();

  //   return
  const { data, error, isLoading } = useSWR(
    "/api/liveblocks/get-rooms",
    fetcher
  );

  const [tempDocTitle, setTempDocTitle] = useState("");
  const [newDocDialog, setNewDocDialog] = useState(false);

  function open() {
    setNewDocDialog(true);
  }

  function close() {
    setNewDocDialog(false);
  }

  return (
    <>
      <div className="py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-semibold">Documents</h1>
              <p className="text-lg font-medium text-zinc-700">
                {isLoading
                  ? "Figuring out who you are..."
                  : `    Welcome back, ${session?.data?.user?.name}!`}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={open}
                className="border border-zinc-200 rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 cursor-pointer"
              >
                <PlusIcon className="size-5 text-zinc-500 hover:text-zinc-700" />
                Create Document
              </button>
              <UserMenu user={session?.data?.user ?? null} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
            {isLoading ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <p className="text-center text-zinc-500">Loading...</p>
              </div>
            ) : data ? (
              data?.data.map((room: any) => (
                <DocGridItem key={room.id} room={room} />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <p className="text-center text-zinc-500">No documents found</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <NewDocDialog
        tempDocTitle={tempDocTitle}
        setTempDocTitle={setTempDocTitle}
        isOpen={newDocDialog}
        close={close}
      />
    </>
  );
}

function DocGridItem({ room }: { room: any }) {
  const { data, error, isLoading } = useSWR(
    `/api/liveblocks/room/${room.id}/get-storage`,
    fetcher
  );

  return (
    <>
      <Link href={`/${room.id}`}>
        <div className="overflow-hidden hover:scale-95 transition-all cursor-pointer relative rounded-xl border border-zinc-200">
          {/* {data ? (
            snapshots > 0 ? (
              <div className="absolute right-2 top-2 text-right text-xs font-semibold text-white bg-blue-600 rounded-lg px-2 py-1">
                {snapshots} snapshot{snapshots > 1 ? "s" : ""}
              </div>
            ) : null
          ) : null} */}
          <MiniTextRenderer isLoading={isLoading} data={data} />
          <div className="border-t border-zinc-200 p-4 space-y-1">
            {data ? (
              <h2 className="text-sm font-semibold line-clamp-1">
                {data?.data?.data?.docTitle ?? "Untitled Document"}
              </h2>
            ) : (
              <div className="h-4 bg-zinc-200 rounded-lg w-1/2 animate-pulse" />
            )}
            <p className="text-xs text-zinc-500">
              {room.lastConnectionAt
                ? `Last updated ${new Date(
                    room.lastConnectionAt
                  ).toLocaleString()}`
                : "No update information available"}
            </p>
          </div>
        </div>
      </Link>
    </>
  );
}

function MiniTextRenderer({
  isLoading,
  data,
}: {
  isLoading?: boolean;
  data?: any;
}) {
  if (isLoading && !data) {
    return <div className="w-full h-32 bg-zinc-100 animate-pulse"></div>;
  } else {
    if (data && data.doc) {
      if (data.doc.maindoc) {
        return (
          <div
            className="w-full h-32 overflow-hidden text-xs p-4 prose prose-sm select-none pointer-events-none font-sans leading-5"
            dangerouslySetInnerHTML={{
              __html: data.doc.maindoc,
            }}
          />
        );
      } else {
        return (
          <div className="w-full select-none pointer-events-none h-32 pt-10 overflow-hidden text-sm font-medium p-4 flex items-center justify-center">
            This document is pretty empty.
          </div>
        );
      }
    }
    return <div className="w-full h-32 bg-zinc-200 animate-pulse"></div>;
  }
}
