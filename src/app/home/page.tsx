"use client";
import { useSession } from "next-auth/react";
// import { AuthGuard } from "../components/AuthGuard";
import useSWR from "swr";
import { Room } from "@liveblocks/client";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { PlusIcon } from "@heroicons/react/20/solid";
import { useState } from "react";

import dynamic from "next/dynamic";
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
              <p className="text-lg font-medium text-gray-700">
                {isLoading
                  ? "Figuring out who you are..."
                  : `    Welcome back, ${session?.data?.user?.name}!`}
              </p>
            </div>
            <button
              onClick={open}
              className="border border-zinc-200 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 flex items-center gap-2 cursor-pointer"
            >
              <PlusIcon className="size-5 text-gray-500 hover:text-gray-700" />
              Create Document
            </button>
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
  return (
    <Link href={`/${room.id}`}>
      <div className="overflow-hidden hover:scale-95 transition-all cursor-pointer rounded-xl border border-zinc-200">
        <MiniTextRenderer roomId={room.id} />
        <div className="border-t border-zinc-200 p-4">
          <h2 className="text-sm font-semibold line-clamp-1">{room.id}</h2>
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
  );
}

function MiniTextRenderer({ roomId }: { roomId: string }) {
  const { data, error, isLoading } = useSWR(
    `/api/liveblocks/room/${roomId}/get-storage`,
    fetcher
  );

  if (isLoading && !data) {
    return <div className="w-full h-32 bg-gray-100 animate-pulse"></div>;
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
    return <div className="w-full h-32 bg-gray-200 animate-pulse"></div>;
  }
}
