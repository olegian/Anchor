"use client";
import { Comment } from "@liveblocks/react-ui/primitives";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Editor as EditorType,
  EditorContent,
  Extension,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useRef, useState } from "react";
import InlineAIExtension from "./extensions/InlineAIExtension";
import FloatingToolbar from "./floating/FloatingToolbar";

import { PlusIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { CommentData } from "@liveblocks/core";
import {
  useDeleteComment,
  useMutation,
  useMyPresence,
  useStorage,
  useThreads,
} from "@liveblocks/react";
import {
  AnchoredThreads,
  FloatingComposer,
  useLiveblocksExtension,
} from "@liveblocks/react-tiptap";
import { getContents } from "@/app/actions";
import { useParams } from "next/navigation";
import { useHotkeys } from "react-hotkeys-hook";
import { WordSpan } from "./extensions/WordSpanExtension";

function wrapWordsInSpans(editor: EditorType) {
  const words = editor.getText().split(/\s+/);
  editor.commands.clearContent();

  words.forEach((word, index) => {
    editor.commands.insertContent({
      type: "text",
      text: word,
      marks: [
        {
          type: "wordSpan",
        },
      ],
    });

    if (index < words.length - 1) {
      editor.commands.insertContent(" ");
    }
  });
}

export default function Editor({
  title,
  setTitle,
  open,
  loaded,
  anchorHandles,
  setAnchorHandles,
}: {
  title: string;
  setTitle: (title: string) => void;
  open: () => void;
  loaded: boolean;
  anchorHandles: Map<string, { x: number; y: number }>;
  setAnchorHandles: React.Dispatch<
    React.SetStateAction<Map<string, { x: number; y: number }>>
  >;
}) {
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
      Placeholder.configure({
        placeholder: "Type something...",
      }),
      WordSpan,
    ],
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      if (editor.isEmpty || editor.getText().length < 500) {
        editor.commands.focus("end");
      }
    }
  }, [editor]);

  function wrapEveryWordInSpansPreserveHTML(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    function processNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const tokens = text.split(/(\s+)/); // split into words and spaces
        const fragment = document.createDocumentFragment();

        tokens.forEach((token) => {
          if (/\s+/.test(token)) {
            fragment.appendChild(document.createTextNode(token));
          } else {
            const span = document.createElement("span");
            span.textContent = token;
            span.className = "text-white/0";
            fragment.appendChild(span);
          }
        });

        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // recursively process children
        Array.from(node.childNodes).forEach(processNode);
      }
    }

    processNode(doc.body);

    return doc.body.innerHTML;
  }

  return (
    <>
      {editor && loaded ? (
        <div
          id="overlay-editor"
          className="absolute max-w-3xl pointer-events-none select-none w-full h-80 mx-auto top-[12.35rem] px-2 prose"
          dangerouslySetInnerHTML={{
            __html: wrapEveryWordInSpansPreserveHTML(editor.getHTML()),
          }}
        />
      ) : null}
      <div className="relative">
        <SkeletonEditor loaded={loaded} />
        <article
          className={`${
            loaded ? "" : "hidden"
          } prose max-w-none h-full min-h-80 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:font-normal prose-p:text-zinc-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg`}
        >
          <Title title={title} setTitle={setTitle} />
          <EditorContent editor={editor} className="px-2" />
        </article>
      </div>
      <FloatingToolbar editor={editor} open={open} />
      <InteractionLayer
        anchorHandles={anchorHandles}
        setAnchorHandles={setAnchorHandles}
        editor={editor}
      />
    </>
  );
}

function InteractionLayer({
  anchorHandles,
  setAnchorHandles,
  editor,
}: {
  anchorHandles: Map<string, { x: number; y: number }>;
  setAnchorHandles: React.Dispatch<
    React.SetStateAction<Map<string, { x: number; y: number }>>
  >;
  editor: EditorType | null;
}) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Handle hotkey "a"
  useHotkeys("a", () => {
    const id = crypto.randomUUID(); // Unique ID for the new anchor
    setAnchorHandles((prev) => {
      const next = new Map(prev);
      next.set(id, { x: mousePos.x, y: mousePos.y });
      return next;
    });
  });

  return (
    <>
      {anchorHandles?.keys().map((handleId: string) => {
        const { x, y } = anchorHandles.get(handleId)!;
        return (
          <AnchorHandle
            key={handleId}
            x={x}
            y={y}
            id={handleId}
            setAnchorHandles={setAnchorHandles}
          />
        );
      })}
    </>
  );
}

function AnchorHandle({
  x,
  y,
  id,
  setAnchorHandles,
}: {
  x: number;
  y: number;
  id: string;
  setAnchorHandles: React.Dispatch<
    React.SetStateAction<Map<string, { x: number; y: number }>>
  >;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;
      const newX = e.clientX - offset.current.x;
      const newY = e.clientY - offset.current.y;

      setAnchorHandles((prev) => {
        const next = new Map(prev);
        next.set(id, { x: newX, y: newY });
        return next;
      });

      const centerX = newX;
      const centerY = newY;

      const overlayContainer = document.getElementById("overlay-editor");
      if (!overlayContainer) return;
      const paragraphs = overlayContainer.querySelectorAll("p");
      if (!paragraphs) return;

      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const spans = paragraph.getElementsByTagName("span");
        for (let j = 0; j < spans.length; j++) {
          const span = spans[j];
          const rect = span.getBoundingClientRect();
          if (
            centerX >= rect.left &&
            centerX <= rect.right &&
            centerY >= rect.top &&
            centerY <= rect.bottom
          ) {
            console.log(
              `Over Paragraph: ${i + 1}, Word: ${j + 1} - ${span.textContent}`
            );
            span.className =
              "bg-blue-500/10 rounded-lg px-2 py-1 text-white/0 -ml-2 transition-colorsa";

            return;
          } else {
            span.className = "transition-colors";
          }
        }
      }
    };

    const onMouseUp = () => setDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragging]);

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      // Instead of using `rect.left` and `rect.top` directly,
      // add half the width and height to get the visual center
      offset.current = {
        x: e.clientX - (rect.left + rect.width / 2),
        y: e.clientY - (rect.top + rect.height / 2),
      };
    }
    setDragging(true);
  };

  return (
    <div
      ref={ref}
      className="absolute origin-center z-40 "
      style={{
        left: x,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={onMouseDown}
    >
      <div className="flex flex-col items-center justify-center group relative space-y-1.5">
        <div className="select-none opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 font-medium transform text-[8px] px-1.5 py-0.5 border border-zinc-200 bg-white shadow-sm origin-center rounded-md text-zinc-500 transition-all duration-200 ease-in-out">
          Anchor
        </div>

        <div className="flex items-center justify-center border bg-white/50 backdrop-blur-sm origin-center border-zinc-200 opacity-50 rounded-full transition-all duration-200 ease-in-out cursor-pointer group-hover:scale-125 group-hover:opacity-100 size-5">
          <PlusIcon className="absolute size-3 text-zinc-500 shrink-0 transition-all group-hover:scale-125" />
        </div>
      </div>
    </div>
  );
}

function SkeletonEditor({ loaded }: { loaded: boolean }) {
  return (
    <div className={`${loaded ? "hidden" : "block"} w-full px-2`}>
      <div className="space-y-4">
        <div className="w-3/4 h-10 bg-zinc-200 animate-pulse rounded-lg" />
        <div className="space-y-4">
          {Array.from({ length: 12 }, (_, i) =>
            i % 2 === 0 ? (
              <div
                key={i}
                className="w-full h-20 bg-zinc-200 animate-pulse rounded-lg"
              />
            ) : (
              <div
                key={i}
                className="w-full h-8 bg-zinc-200 animate-pulse rounded-lg"
              />
            )
          )}
        </div>
      </div>
    </div>
  );
}

function Title({
  title,
  setTitle,
}: {
  title: string;
  setTitle: (title: string) => void;
}) {
  const placeholder = "Enter a title...";

  return (
    <h1
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => setTitle(e.target.textContent || "")}
      className="w-full text-3xl mb-4 border-b-2 transition-colors rounded-lg border-transparent hover:bg-zinc-100 inline px-2 py-1 focus:outline-none focus:border-none focus:bg-zinc-100"
    >
      {title || placeholder}
    </h1>
  );
}
