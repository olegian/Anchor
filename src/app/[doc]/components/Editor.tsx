"use client";
import { useMutation } from "@liveblocks/react"; // Make sure this is imported
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { HandlesMap } from "../../../../liveblocks.config";
import Title from "./Title";
import FloatingToolbar from "./floating/FloatingToolbar";
import { AnchorLayer } from "./interaction/AnchorLayer";
import { SpansMark } from "./interaction/SpansMark";
import { useDebounce } from "./interaction/useDebounce";
import SkeletonEditor from "./other/SkeletonEditor";

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
  onEditorReady, // Add this new prop
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
  onEditorReady?: (editor: any) => void; // Add this new prop type
}) {
  const liveblocks = useLiveblocksExtension({ field: "maindoc" });

  const updateAttachedAnchors = useMutation(({ storage }) => {
    storage.get("attachPoints").forEach((attachment, spanId) => {
      const anchorId = attachment.get("anchorId");
      const span = document.getElementById(spanId) as HTMLSpanElement;
      if (!span) {
        const anchor = storage.get("docHandles").get(anchorId);
        const attachedSpanId = anchor?.get("attachedSpan");
        if (attachedSpanId) {
          storage.get("attachPoints").delete(attachedSpanId);
        }
        storage.get("docHandles").delete(anchorId);
        return;
      }

      const rect: DOMRect = span.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top - 4 + window.scrollY;

      const anchor = storage.get("docHandles").get(anchorId);
      anchor?.set("x", x - window.innerWidth / 2);
      anchor?.set("y", y);
    });
  }, []);
  const debouncedUpdateAttachedAnchors = useDebounce(updateAttachedAnchors, 20);

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
      SpansMark,
    ],
    immediatelyRender: false,
    editable: !draggingAnchor,
    onUpdate(props) {
      debouncedUpdateAttachedAnchors();
    },
  });

  // Pass editor instance to parent when ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (editor) {
      if (editor.isEmpty || editor.getText().length < 500) {
        editor.commands.focus("end");
      }
    }
  }, [editor]);

  // Rest of your component remains the same...
  return (
    <>
      <DragToDeleteBounds draggingAnchor={draggingAnchor} />
      <div className="relative">
        <SkeletonEditor loaded={loaded} />
        <article
          id="main-editor"
          className={`${
            draggingAnchor
              ? "pointer-events-none select-none"
              : "pointer-events-auto"
          } ${
            loaded ? "" : "hidden"
          } prose max-w-none h-full prose-headings:font-heading prose-headings:tracking-tighter prose-h2:my-4 min-h-screen prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:font-normal prose-p:text-zinc-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-xl prose-img:shadow-lg`}
        >
          <Title title={title} setTitle={setTitle} />
          <EditorContent editor={editor} className="px-2" />
        </article>
      </div>
      <FloatingToolbar editor={editor} draggingAnchor={draggingAnchor} />
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
