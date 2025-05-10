"use client";
import { Comment } from "@liveblocks/react-ui/primitives";
import Placeholder from "@tiptap/extension-placeholder";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import InlineAIExtension from "./extensions/InlineAIExtension";
import FloatingToolbar from "./floating/FloatingToolbar";

import { XMarkIcon } from "@heroicons/react/16/solid";
import { CommentData } from "@liveblocks/core";
import {
    useDeleteComment,
    useMyPresence,
    useThreads
} from "@liveblocks/react";
import {
    AnchoredThreads,
    FloatingComposer,
    useLiveblocksExtension,
} from "@liveblocks/react-tiptap";

export default function Editor({
  title,
  setTitle,
  open,
}: {
  title: string;
  setTitle: (title: string) => void;
  open: () => void;
}) {
  const liveblocks = useLiveblocksExtension({ field: "maindoc" });
  const [myPresence, updateMyPresence] = useMyPresence();

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

  useEffect(() => {
    updateMyPresence({ currentSnapshot: null });
  }, []);

  const { threads } = useThreads();

  return (
    <>
      <article className="prose max-w-none h-full min-h-80 prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl prose-p:leading-7 prose-p:font-normal prose-p:text-zinc-700 prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline prose-img:rounded-lg prose-img:shadow-lg">
        <Title title={title} setTitle={setTitle} />
        <EditorContent editor={editor} className="px-2" />
      </article>

      <>
        {/* <AnchoredThreads editor={editor} /> */}
        <FloatingComposer editor={editor} />
        <AnchoredThreads
          editor={editor}
          threads={threads || []}
          className="fixed top-20 w-full right-0 z-20 h-32"
          // style={{ width: "300px" }}
          components={{
            Thread: (props) => (
              <div className="flex items-center justify-end gap-2 -mr-80">
                {props.thread.comments.map((comment) => (
                  <CommentBlock key={comment.id} comment={comment} />
                ))}
              </div>
            ),
          }}
        />
        {/* <FloatingThreads editor={editor} threads={threads || []} /> */}
      </>
      <FloatingToolbar editor={editor} open={open} />
    </>
  );
}

function CommentBlock({ comment }: { comment: CommentData }) {
  const deleteComment = useDeleteComment();

  return (
    <div
      key={comment.id}
      className="p-4 space-y-4 w-full relative max-w-72 border border-zinc-200 bg-white rounded-xl hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center justify-start gap-2">
          <div className="uppercase flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 border border-white/50 text-white font-semibold text-sm">
            GH
          </div>
          <div>
            <h4 className="font-semibold text-sm">Greg Heffley</h4>
            <p className="text-xs text-zinc-500">
              {new Date(comment.createdAt).toLocaleDateString("en-US")}
            </p>
          </div>
        </div>
        <button
          className="bg-white border cursor-pointer hover:opacity-75 transition-opacity border-zinc-200 p-1 rounded-full text-xs font-medium text-zinc-700"
          onClick={() =>
            deleteComment({
              threadId: comment.threadId,
              commentId: comment.id,
            })
          }
        >
          <XMarkIcon className="size-4 shrink-0" />
        </button>
      </div>
      <div className="text-zinc-700">
        <Comment.Body body={comment.body} />
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
