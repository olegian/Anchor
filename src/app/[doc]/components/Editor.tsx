"use client";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import FloatingToolbar from "./FloatingToolbar";
import InlineAIExtension from "./extensions/InlineAIExtension";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";

export default function Editor({
  title,
  setTitle,
}: {
  title: string;
  setTitle: (title: string) => void;
}) {
  const liveblocks = useLiveblocksExtension({ field: "maindoc" });

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
      InlineAIExtension,
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

  return (
    <>
      <article className="prose max-w-none h-full min-h-80 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:font-normal prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg">
        <Title title={title} setTitle={setTitle} />
        <EditorContent editor={editor} className="px-2" />
      </article>
      <FloatingToolbar editor={editor} />
    </>
  );
}

function Title({ title, setTitle }: { title: string; setTitle: (title: string) => void }) {
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
