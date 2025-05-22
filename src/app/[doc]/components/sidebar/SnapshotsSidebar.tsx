"use client";
import { Transition, TransitionChild } from "@headlessui/react";
import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { useStorage } from "@liveblocks/react";
import { useParams, useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  CurrentSnapshotListItem,
  MainListItem,
  MainListItemLink,
  SnapshotListItem,
} from "./SnapshotListItem";
import Link from "next/link";

export default function SnapshotsSidebar({ open }: { open: () => void }) {
  const [showSidebar, setShowSidebar] = useState(false);
  const params = useParams<{ doc: string; snapshot?: string }>();

  const handleMouseEnter = () => setShowSidebar(true);
  const handleMouseLeave = () => setShowSidebar(false);

  const searchParams = useSearchParams();


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
              <div className="sticky top-0 bg-white z-10 pt-16 border-b border-zinc-200">
                <div>
                  <div className="space-y-2 px-2 pb-2 border-b border-zinc-200">
                    {/* {params.snapshot !== undefined ? ( // only render current thread if youre actually viewing a thread
                      <CurrentSnapshotListItem
                        id={params.snapshot}
                        title={
                          snapshots?.get(params.snapshot)?.snapshotTitle ??
                          "Untitled"
                        }
                      />
                    ) : (
                      <MainListItem />
                    )}
                    <h2 className="font-semibold text-2xl">
                      {params.snapshot === undefined ? (
                        "Document"
                      ) : snapshots?.get(params.snapshot) ? (
                        snapshots.get(params.snapshot)?.snapshotTitle
                      ) : (
                        <div className="h-8 bg-zinc-200 rounded-lg w-1/2 animate-pulse" />
                      )}
                    </h2> */}
                  </div>
                  {/* {params.snapshot !== undefined ? <MainListItemLink /> : null} */}
                </div>
                <div className="flex items-center justify-between p-2">
                  <h3 className="font-semibold text-lg">
                    {/* {snapshots?.size === 0 ? "No snapshots" : "Snapshots"} */}
                  </h3>

                  {params.snapshot === undefined ? (
                    <button
                      onClick={() => {
                        open();
                        setShowSidebar(false);
                      }}
                      className="text-xs bg-white font-semibold text-zinc-700 hover:opacity-75 transition-opacity border border-zinc-200 rounded-lg px-2 py-1 cursor-pointer"
                    >
                      Create
                    </button>
                  ) : null}
                </div>
              </div>
              <ul className="divide-y divide-zinc-200">
                {/* {snapshots
                  ? snapshots
                      .entries()
                      .toArray()
                      .map(([id, snapshotInfo]) => {
                        return (
                          <SnapshotListItem
                            id={id}
                            snapshotInfo={snapshotInfo}
                            key={id}
                            isActive={params.snapshot === id}
                          />
                        );
                      })
                  : Array.from({ length: 7 }, (_, i) => (
                      <li
                        key={i}
                        className="border-b border-zinc-200 cursor-pointer flex items-center justify-between w-full p-2 animate-pulse"
                      >
                        <div className="relative h-3 rounded-sm bg-zinc-200 w-1/2" />
                        <div className="flex items-center justify-end gap-1">
                          <div className="text-zinc-400">
                            <ChevronRightIcon className="size-5 shrink-0" />
                          </div>
                        </div>
                      </li>
                    ))} */}
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
      className="cursor-pointer fixed flex items-center justify-start top-1/2 left-4 transform -translate-y-1/2 gap-2 hover:opacity-75 transition-opacity"
    >
      <div className="rounded-full p-1 bg-white border border-zinc-200">
        <ChevronRightIcon className="size-5 shrink-0" />
      </div>
      <p className="text-zinc-700 font-medium text-sm">Snapshots</p>
    </button>
  );
}
