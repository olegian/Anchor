"use client";
import { useSession } from "next-auth/react";
// import { AuthGuard } from "../components/AuthGuard";
import { PlusIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useEffect, useState } from "react";

import { JsonObject, PlainLsonObject, RoomData } from "@liveblocks/node";
import dynamic from "next/dynamic";
import { getAccessibleRooms, getRoomStorage } from "../actions";
import UserMenu from "./components/UserMenu";
import LoadingState from "../components/LoadingState";
import AnchorLogo from "../components/AnchorLogo";
import { notFound } from "next/navigation";
import { InboxIcon } from "@heroicons/react/24/outline";
const NewDocDialog = dynamic(() => import("./components/NewDocDialog"));

export default function Home() {
  const session = useSession();

  if (!session) {
    notFound();
    return null; // This line is just to satisfy TypeScript, not actually reached
  }

  const [isLoading, setIsLoading] = useState(true);
  const [rooms, setRooms] = useState<RoomData[]>([]);

  useEffect(() => {
    if (
      !session ||
      !session.data ||
      !session.data.user ||
      !session.data.user.id ||
      rooms.length > 0
    ) {
      return;
    }

    getAccessibleRooms(session.data.user.id)
      .then((res) => {
        setRooms(res);
        setIsLoading(false);
      })
      .catch((e) => {
        console.log(e);
      });
  }, [session]);

  const [newDocDialog, setNewDocDialog] = useState(false);

  function open() {
    setNewDocDialog(true);
  }

  function close() {
    setNewDocDialog(false);
  }

  return isLoading || !session ? (
    <LoadingState />
  ) : (
    <>
      <div className="bg-zinc-50 px-4 w-screen min-h-screen py-32">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex items-end justify-between">
            <div className="space-y-4">
              <h1 className="font-heading tracking-tighter text-5xl text-balance">
                Welcome back
                {session.data?.user?.name
                  ? `, ${session.data.user.name.split(" ")[0]}`
                  : ""}
              </h1>
              <p className="text-zinc-500 tracking-tight text-lg font-semibold">
                {rooms.length == 0
                  ? "Create a new document to get started."
                  : `${rooms.length} ${
                      rooms.length === 1 ? "document" : "documents"
                    }`}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={open}
                className="border border-zinc-200 bg-white rounded-xl px-2.5 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 cursor-pointer"
              >
                <PlusIcon className="size-5 text-zinc-500 hover:text-zinc-700" />
                Create Document
              </button>
              <UserMenu user={session?.data?.user ?? null} />
            </div>
          </div>
          <hr className="border-zinc-200 w-4xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {isLoading ? (
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <p className="text-center text-zinc-500">Loading...</p>
              </div>
            ) : rooms.length > 0 ? (
              rooms
                .sort(
                  (a, b) =>
                    new Date(b?.lastConnectionAt ?? 0).getTime() -
                    new Date(a?.lastConnectionAt ?? 0).getTime()
                )
                .map((room: any) => <DocGridItem key={room.id} room={room} />)
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-4 flex flex-col items-center justify-center space-y-2 py-16">
                <InboxIcon className="size-12 text-zinc-300" />
                <p className="text-center font-semibold tracking-tight text-zinc-400">
                  No documents found!
                </p>
              </div>
            )}
          </div>
          <hr className="border-zinc-200 w-4xl" />
          <div className="flex flex-col items-end justify-start space-y-1">
            <AnchorLogo className="w-24 h-8 fill-zinc-800/25 z-50 float-right" />
            <p className="text-xs text-zinc-800/25 text-right font-heading w-45 tracking-tighter">
              A collaborative writing platform with context-aware and assistive
              AI
            </p>
          </div>
        </div>
      </div>
      {/* <div className="py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="space-y-2">
                <AnchorLogo className="w-16 h-6 fill-zinc-800" />
                <h1 className="text-4xl font-heading tracking-tight font-semibold">
                  Documents
                </h1>
              </div>
              <p className="text-lg font-semibold text-zinc-700 tracking-tight">
                {isLoading
                  ? "Figuring out who you are..."
                  : `    Welcome back, ${session?.data?.user?.name}!`}
              </p>
            </div>
            <div className="flex items-center justify-end space-x-4">
              <button
                onClick={open}
                className="border border-zinc-200 rounded-xl px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 flex items-center gap-2 cursor-pointer"
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
            ) : rooms.length > 0 ? (
              rooms.map((room: any) => (
                <DocGridItem key={room.id} room={room} />
              ))
            ) : (
              <div className="col-span-1 md:col-span-2 lg:col-span-4">
                <p className="text-center text-zinc-500">No documents found</p>
              </div>
            )}
          </div>
        </div>
      </div> */}
      <NewDocDialog isOpen={newDocDialog} close={close} />
    </>
  );
}

function DocGridItem({ room }: { room: RoomData }) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<{
    data: PlainLsonObject;
    doc: JsonObject;
  }>();

  useEffect(() => {
    getRoomStorage(room.id)
      .then((res) => {
        setData(res);
        setIsLoading(false);
      })
      .catch((e) => {
        console.log(e);
      });
  }, []);

  return (
    <Link
      href={`/${room.id}`}
      className="overflow-hidden hover:scale-95 transition-all cursor-pointer relative rounded-xl border border-zinc-200"
    >
      <MiniTextRenderer isLoading={isLoading} data={data} />

      <div className="border-t border-zinc-200 p-4 space-y-1 bg-zinc-100">
        {data ? (
          <h2 className="font-semibold line-clamp-1 font-heading">
            {(data?.data?.data?.docTitle as string) ?? "Untitled Document"}
          </h2>
        ) : (
          <div className="h-4 bg-zinc-200 rounded w-1/2 animate-pulse" />
        )}
        <p className="text-xs text-zinc-500">
          {room.lastConnectionAt
            ? `Last updated ${new Date(room.lastConnectionAt).toLocaleString()}`
            : "No update information available"}
        </p>
      </div>
    </Link>
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
    return <div className="w-full h-34 bg-white animate-pulse"></div>;
  } else {
    if (data && data.doc) {
      if (data.doc.maindoc) {
        return (
          <div className=" bg-white h-32 w-full overflow-hidden p-4">
            <div
              className="text-xs prose-h2:my-2 prose-headings:font-heading prose-headings:tracking-tight prose prose-sm select-none pointer-events-none font-sans leading-5"
              dangerouslySetInnerHTML={{
                __html: data.doc.maindoc,
              }}
            />
          </div>
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
