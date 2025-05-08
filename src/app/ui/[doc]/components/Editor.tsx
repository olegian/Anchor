"use client";
import Placeholder from "@tiptap/extension-placeholder";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import Tabbar from "./Tabbar";

export default function Editor({}) {
  const [title, setTitle] = useState(
    "Garlic bread with cheese: What the science tells us"
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2],
        },
      }),
      Placeholder.configure({
        placeholder: "Type something...",
      }),
    ],
    content: "",
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor) {
      editor.commands.focus("end");
    }
  }, [editor]);

  return (
    <>
      <article className="prose max-w-none h-full min-h-80 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:font-normal prose-p:text-gray-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg">
        <Title title={title} setTitle={setTitle} />
        <EditorContent editor={editor} className="px-2" />
      </article>
      <Tabbar editor={editor} />
    </>
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
      className="w-full text-3xl font-bold mb-4 border-b-2 transition-colors rounded-lg border-transparent hover:bg-zinc-100 inline px-2 py-1 focus:outline-none focus:border-none focus:bg-zinc-100"
    >
      {title || placeholder}
    </h1>
  );
}
