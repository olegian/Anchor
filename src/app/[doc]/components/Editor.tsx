"use client";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import FloatingToolbar from "./floating/FloatingToolbar";
import { useMyPresence } from "@liveblocks/react";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { useParams } from "next/navigation";
import Title from "./Title";
import SkeletonEditor from "./SkeletonEditor";
import { EditorMirrorLayer, AnchorLayer } from "./InteractionLayer";
import { HandlesMap } from "../../../../liveblocks.config";

export default function Editor({
  title,
  setTitle,
  open,
  loaded,
  anchorHandles,
  addHandle,
}: {
  title: string;
  setTitle: (title: string) => void;
  open: () => void;
  loaded: boolean;
  anchorHandles: HandlesMap;
  addHandle: (newHandleId: string, x: number, y: number) => void;
}) {
  const [draggingAnchor, setDraggingAnchor] = useState(false);
  const liveblocks = useLiveblocksExtension({ field: "maindoc" });
  const params = useParams<{ doc: string }>();
  const [myPresence, updateMyPresence] = useMyPresence();
  const [isEditorReady, setEditorReady] = useState(false);

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        heading: {
          levels: [2],
        },
        history: false,
      }),
      // Placeholder.configure({
      //   placeholder: "Type something...",
      // }),
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
      {editor && loaded ? <EditorMirrorLayer html={editor.getHTML()} /> : null}
      {/* <p className="fixed top-32 left-32">
        {draggingAnchor ? "true" : "false"}
      </p> */}
      <div className="relative">
        <SkeletonEditor loaded={loaded} />
        <article
          className={`${
            draggingAnchor
              ? "pointer-events-none select-none"
              : "pointer-events-auto"
          } ${
            loaded ? "" : "hidden"
          } prose max-w-none h-full min-h-80 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:font-normal prose-p:text-zinc-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg`}
        >
          <Title title={title} setTitle={setTitle} />
          <EditorContent editor={editor} className="px-2" />
        </article>
      </div>
      <FloatingToolbar editor={editor} open={open} />
      <AnchorLayer
        anchorHandles={anchorHandles}
        addHandle={addHandle}
        draggingAnchor={draggingAnchor}
        setDraggingAnchor={setDraggingAnchor}
      />
    </>
  );
}