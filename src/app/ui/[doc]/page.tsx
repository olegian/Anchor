import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import Tabbar from "./components/Tabbar";
import ThreadsSidebar from "./components/ThreadsSidebar";
import Editor from "./components/Editor";

export default function Page({}) {
  return (
    <>
      <BackButton />
      <ThreadsSidebar />
      <div className="py-4 px-2 md:py-8 md:px-6 ">
        <div className="max-w-3xl mx-auto py-16 space-y-4">
          <div className="space-y-4 px-2">
            <div className="font-semibold text-sm px-2 py-1 rounded-lg bg-amber-300 inline-block text-black">
              Main
            </div>
            <p className="font-semibold text-zinc-500 text-sm">
              Last updated 2 days ago by Greg Heffley
            </p>
          </div>
          <Editor />
        </div>
      </div>
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
