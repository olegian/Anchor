"use client";

import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import ThreadsSidebar from "./components/ThreadsSidebar";
import Editor from "./components/Editor";
import FloatingMenu from "./components/FloatingMenu";
import { useEffect, useState } from "react";
import FloatingNavbar from "./components/FloatingNavbar";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import DocMenu from "./components/DocMenu";

export default function Page({}) {
  const [title, setTitle] = useState(
    "Garlic bread with cheese: What the science tells us"
  );

  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <BackButton />
      <ThreadsSidebar />
      <div className="py-4 px-2 md:py-8 md:px-6 ">
        <div className="max-w-3xl mx-auto py-16 space-y-4">
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <DocPill mini={false} />
              <DocMenu showText={true} />
            </div>
            <p className="font-semibold text-zinc-500 text-sm">
              Last updated 2 days ago by Greg Heffley
            </p>
          </div>
          <Editor title={title} setTitle={setTitle} />
        </div>
      </div>
      <FloatingMenu />
      <FloatingNavbar title={title} scrollPosition={scrollPosition} />
    </>
  );
}

function BackButton() {
  return (
    <button className="fixed cursor-pointer hover:text-gray-400 top-4 left-4 z-50 flex items-center justify-start text-sm gap-1 text-zinc-600">
      <ChevronLeftIcon className="size-6 shrink-0" />
      <p className="font-medium text-sm">Back</p>
    </button>
  );
}

function DocPill({ mini }: { mini: boolean }) {
  if (mini) {
    return (
      <div className="relative font-semibold text-sm p-2 py-1 rounded-lg bg-amber-300 inline-flex items-center justify-center text-black">
        Main
      </div>
    );
  } else {
    return (
      <div>
        <div className="relative font-semibold text-sm px-2 py-1 rounded-lg bg-blue-500 inline-block text-white z-20">
          # Threadasjdkashdsakjhsadkjhdask
        </div>
        <div className="relative hover:opacity-75 cursor-pointer font-semibold text-sm pl-6 pr-2 py-1 gap-1.5 rounded-r-lg bg-amber-300 inline-flex items-center justify-center text-black -translate-x-14.5 hover:-translate-x-4 transition-transform duration-200">
          Main
          <ArrowRightIcon className="size-4 shrink-0 text-black " />
        </div>
      </div>
    );
  }
}
