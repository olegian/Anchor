"use client";
import { useState } from "react";
import { Transition, TransitionChild } from "@headlessui/react";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import { MainThreadListItem, ThreadListItem } from "./ThreadListItem";

export default function ThreadsSidebar() {
  const [showSidebar, setShowSidebar] = useState(false);

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
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-700 font-sans text-sm">
                    This view
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <MainThreadListItem />
                    {/* <MainThreadListItem /> */}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Threads</h3>
                  <p className="text-xs font-medium text-gray-500">
                    30 threads
                  </p>
                </div>
              </div>
              <ul className="divide-y divide-zinc-200">
                {Array.from({ length: 8 }, (_, i) => (
                  <ThreadListItem key={i} />
                ))}
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
      <p className="text-gray-700 font-medium text-sm">Threads</p>
    </button>
  );
}
