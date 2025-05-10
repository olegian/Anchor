"use client";
import { Transition, TransitionChild } from "@headlessui/react";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { useStorage } from "@liveblocks/react";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
    CurrentSnapshotListItem,
    MainListItem,
    SnapshotListItem,
} from "./SnapshotListItem";

export default function SnapshotsSidebar({ open }: { open: () => void }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const params = useParams<{ doc: string; snapshot?: string }>();

  const snapshots = useStorage((root) => root.snapshots);

  const handleMouseEnter = () => setShowSidebar(true);
  const handleMouseLeave = () => setShowSidebar(false);

  return (
    <>
      <SidebarButton
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        onMouseEnter={handleMouseEnter}
      />
      <div
        className={`fixed inset-0 bg-black/30 z-30 ease-in-out duration-200 transition-opacity ${
          showSidebar ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <Transition show={showSidebar}>
        <TransitionChild
          enter="transition-transform transform duration-200 ease-in-out"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition-transform transform duration-200 ease-in-out"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div
            className="z-40 w-80 left-0 top-0 fixed h-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="h-[calc(100vh)] space-y-0  w-full bg-white shadow-2xl border-r border-zinc-200 overflow-auto">
              <div className="sticky top-0 bg-white z-10 pt-16 border-b border-zinc-200 p-4 space-y-4">
                <h2 className="font-semibold text-2xl">Document</h2>
                {params.snapshot !== undefined && ( // only render current thread if youre actually viewing a thread
                  <div className="space-y-2">
                    <h3 className="font-medium text-zinc-700 font-sans text-sm">
                      This view
                    </h3>
                    <div className="flex items-center justify-between gap-2">
                      <CurrentSnapshotListItem id={params.snapshot} />
                    </div>
                  </div>
                )}
                <hr className="border-zinc-200 w-full" />
                <MainListItem />
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">
                    {snapshots?.size ?? 0} Snapshot{snapshots?.size ? "" : "s"}
                  </h3>

                  <button
                    onClick={() => {
                      open();
                      setShowSidebar(false);
                    }}
                    className="text-xs bg-white font-medium text-zinc-700 hover:opacity-75 transition-opacity border border-zinc-200 rounded-lg px-2 py-1 cursor-pointer"
                  >
                    Create
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-zinc-200">
                {snapshots
                  ?.entries()
                  .toArray()
                  .map(([id, snapshotInfo]) => {
                    return (
                      <SnapshotListItem
                        id={id}
                        snapshotInfo={snapshotInfo}
                        key={id}
                      />
                    );
                  })}
              </ul>
            </div>
          </div>
        </TransitionChild>
      </Transition>
    </>
  );
}

function SidebarButton({
  showSidebar,
  setShowSidebar,
  onMouseEnter,
}: {
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  onMouseEnter: () => void;
}) {
  return (
    <button
      onMouseEnter={onMouseEnter}
      onClick={() => setShowSidebar(!showSidebar)}
      className="cursor-pointer fixed flex items-center justify-start top-1/2 translate-x-4 transform -translate-y-1/2 gap-2 hover:opacity-75 transition-opacity"
    >
      <div
        className={`rounded-full p-1 bg-white border border-zinc-200 hover:shadow-lg transition-all`}
      >
        <ChevronLeftIcon className="size-5 shrink-0" />
      </div>
      <p className="text-zinc-700 font-medium text-sm">Snapshots</p>
    </button>
  );
}
