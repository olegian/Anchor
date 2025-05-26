"use client";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import FloatingToolbar from "./floating/FloatingToolbar";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import Title from "./Title";
import SkeletonEditor from "./SkeletonEditor";
import { EditorMirrorLayer, AnchorLayer } from "./InteractionLayer";
import { HandlesMap } from "../../../../liveblocks.config";
import { useStorage } from "@liveblocks/react"; // Make sure this is imported
import Placeholder from "@tiptap/extension-placeholder";

export default function Editor({
  title,
  setTitle,
  open,
  loaded,
  anchorHandles,
  addHandle,
  mousePos,
  draggingAnchor,
  setDraggingAnchor,
  docId,
}: {
  title: string;
  setTitle: (title: string) => void;
  open: () => void;
  loaded: boolean;
  anchorHandles: HandlesMap;
  addHandle: (
    newHandleId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => void;
  mousePos: { x: number; y: number };
  draggingAnchor: boolean;
  setDraggingAnchor: (dragging: boolean) => void;
  docId: string;
}) {
  const liveblocks = useLiveblocksExtension({ field: "maindoc" });

  // Listen for pending insertions

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        heading: {
          levels: [2],
        },
        history: false,
      }),
      Placeholder.configure({
        placeholder: "Type your text here...",
      }),
    ],
    immediatelyRender: false,
    editable: !draggingAnchor,
  });


  useEffect(() => {
    if (editor) {
      if (editor.isEmpty || editor.getText().length < 500) {
        editor.commands.focus("end");
      }
    }
  }, [editor]);

  return (
    <>
      <DragToDeleteBounds draggingAnchor={draggingAnchor} />
      {editor && loaded ? <EditorMirrorLayer html={editor.getHTML()} /> : null}
      <div className="relative">
        <SkeletonEditor loaded={loaded} />
        <article
          className={`${
            draggingAnchor
              ? "pointer-events-none select-none"
              : "pointer-events-auto"
          } ${
            loaded ? "" : "hidden"
          } prose max-w-none h-full min-h-screen prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:font-normal prose-p:text-zinc-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg`}
        >
          <Title title={title} setTitle={setTitle} />
          <EditorContent editor={editor} className="px-2" />
        </article>
      </div>
      <FloatingToolbar editor={editor} open={open} />
      {editor && loaded ? (
        <AnchorLayer
          anchorHandles={anchorHandles}
          addHandle={addHandle}
          draggingAnchor={draggingAnchor}
          setDraggingAnchor={setDraggingAnchor}
          docId={docId}
          editor={editor}
          mousePos={mousePos}
        />
      ) : null}
    </>
  );
}

function DragToDeleteBounds({ draggingAnchor }: { draggingAnchor: boolean }) {
  return (
    <>
      <div
        className={`fixed top-0 left-0 h-screen w-12 border-dashed border-r-2 border-zinc-200 bg-zinc-100 hover:opacity-25 flex flex-col items-center justify-center z-40 select-none pointer-events-none transition-all duration-300 ${
          draggingAnchor ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="-rotate-90 whitespace-nowrap text-sm text-zinc-700 font-medium">
          Drag to delete
        </p>
      </div>
      <div
        className={`fixed top-0 right-0 h-screen w-12 border-dashed border-l-2 border-zinc-200 bg-zinc-100 hover:opacity-25 flex flex-col items-center justify-center z-40 select-none pointer-events-none transition-all duration-300 ${
          draggingAnchor ? "opacity-100" : "opacity-0"
        }`}
      >
        <p className="rotate-90 whitespace-nowrap text-sm text-zinc-700 font-medium">
          Drag to delete
        </p>
      </div>
    </>
  );
}
