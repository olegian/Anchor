"use client";
import { useState } from "react";
import { Transition, TransitionChild } from "@headlessui/react";
import { ChevronLeftIcon } from "@heroicons/react/16/solid";
import ThreadListItem from "./ThreadListItem";

export default function ThreadsSidebar() {
  const [showSidebar, setShowSidebar] = useState(true);

  const handleMouseEnter = () => setShowSidebar(true);
  const handleMouseLeave = () => setShowSidebar(false);

  return (
    <>
      <SidebarButton
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        onMouseEnter={handleMouseEnter}
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
            className={`z-50 w-80 left-0 top-0 fixed h-full space-y-4`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <div className="h-[calc(100vh)] w-full bg-white shadow-2xl border-r border-zinc-200 p-4 overflow-hidden">
              <h2 className="font-semibold text-2xl">Threads</h2>
              <ul className="space-y-2 mt-4">
                {Array.from({ length: 10 }, (_, i) => (
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
