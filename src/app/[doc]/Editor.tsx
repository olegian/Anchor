"use client"

import { useLiveblocksExtension, FloatingToolbar, Toolbar } from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Threads } from "./Threads";

interface ContextSelection {
    label: string;
}

export function Editor() {
  const liveblocks = useLiveblocksExtension();

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
