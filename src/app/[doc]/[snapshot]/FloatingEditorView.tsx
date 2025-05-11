"use client";

import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, Extension, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import DocPill from "../components/DocPill";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { Transition, TransitionChild } from "@headlessui/react";
import InlineAIExtension from "../components/extensions/InlineAIExtension";
import { useLocalStorage } from "@uidotdev/usehooks";

export default function FloatingEditorView({ field }: { field: string }) {
  if (field === "null") {
    return null;
  }

  const [showSidebar, setShowSidebar] = useLocalStorage(
    "showFloatingEditorView",
    false
  );

  const liveblocks = useLiveblocksExtension({ field });

  const editor = useEditor({
    editable: false,
    extensions: [
      liveblocks,
      StarterKit.configure({
        heading: {
          levels: [2],
        },
        history: false,
      }),
      Placeholder.configure({
        placeholder: "Type something...",
      }),
    ].concat(
      field !== "maindoc" ? [InlineAIExtension as unknown as Extension] : []
    ),
    immediatelyRender: false,
  });
  return (
    <>
      <Transition show={showSidebar}>
        <TransitionChild
          enter="transition-transform transform duration-200 ease-in-out"
          enterFrom="translate-x-full"
          enterTo="translate-x-0"
          leave="transition-transform transform duration-200 ease-in-out"
          leaveFrom="translate-x-0"
          leaveTo="translate-x-full"
        >
          <div className="z-20 w-96 right-0 top-0 fixed h-full p-4 pt-22">
            <div className="relative h-full w-full bg-white border border-zinc-200 rounded-lg overflow-hidden">
              <article className="prose-sm overflow-y-auto scheme-light-dark max-w-none h-full min-h-80 px-4 pb-28 prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-p:leading-6 prose-p:font-normal prose-p:text-zinc-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg">
                <EditorContent editor={editor} />
              </article>
              <div className="absolute flex items-center justify-between bottom-0 left-0 right-0 p-4 bg-white border-t border-zinc-200">
                <DocPill loaded={editor !== undefined || editor !== null} />
                <SidebarButton
                  type="bottom"
                  showSidebar={showSidebar}
                  setShowSidebar={setShowSidebar}
                  field={field}
                />
              </div>
            </div>
          </div>
        </TransitionChild>
      </Transition>
      <SidebarButton
        type="side"
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
        field={field}
      />
    </>
  );
}

function SidebarButton({
  type,
  showSidebar,
  setShowSidebar,
  field,
}: {
  type: "side" | "bottom";
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
  field: string;
}) {
  return (
    <button
      onClick={() => setShowSidebar(!showSidebar)}
      className={`cursor-pointer ${
        type === "side"
          ? "fixed top-1/2 right-4 transform -translate-y-1/2"
          : ""
      } flex items-center justify-start gap-2 hover:opacity-75 transition-opacity`}
    >
      <p className="text-zinc-700 font-medium text-sm">
        {type == "side" ? "Show" : "Hide"}{" "}
        {field === "maindoc" ? "Main" : "Snapshot"}
      </p>
      <div className="rounded-full p-1 bg-white border border-zinc-200">
        {type === "side" ? (
          <ChevronLeftIcon className="size-5 shrink-0" />
        ) : (
          <ChevronRightIcon className="size-5 shrink-0" />
        )}
      </div>
    </button>
  );
}
