"use client";

import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Threads } from "./Threads";

export function Editor() {
  const liveblocks = useLiveblocksExtension({ field: "maindoc" });

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        // The Liveblocks extension comes with its own history handling
        history: false,
      }),
    ],
    immediatelyRender: true,
  });

  return (
    <>
      <EditorContent editor={editor} className="editor" />
      <Threads editor={editor} />
    </>
  );
}
