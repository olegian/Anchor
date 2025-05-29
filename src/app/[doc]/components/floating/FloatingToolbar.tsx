import {
  BoldIcon,
  ChatBubbleLeftRightIcon,
  CodeBracketIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  StrikethroughIcon,
  ViewfinderCircleIcon,
} from "@heroicons/react/20/solid";
import { Editor } from "@tiptap/react";
import { useState } from "react";

import { SparklesIcon as SparklesIconOutline } from "@heroicons/react/24/outline";
import { SparklesIcon } from "@heroicons/react/24/solid";

export default function FloatingToolbar({
  editor,
  draggingAnchor,
}: {
  editor: Editor | null;
  draggingAnchor: boolean;
}) {
  if (!editor) {
    return null;
  }

  const [anchorHandlesInteractivity, setAnchorHandlesInteractivity] =
    useState<boolean>(true);

  return (
    <div
      className={`fixed bottom-4 left-0 right-0 z-50 flex items-center justify-center transition-opacity ${
        draggingAnchor ? "pointer-events-none opacity-25" : "opacity-100"
      }`}
    >
      <div className="bg-white border rounded-2xl border-zinc-200 relative shadow-2xl p-2 flex items-center justify-center space-x-2">
        <TabbarItem
          text="Heading"
          children={
            <p className="text-xl flex items-center justify-center size-5 font-bold">
              H
            </p>
          }
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <Divider />
        <TabbarItem
          text="Bold"
          children={<BoldIcon className="size-5 shrink-0" />}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />
        <TabbarItem
          text="Italic"
          children={<ItalicIcon className="size-5 shrink-0" />}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <TabbarItem
          text="Strikethrough"
          children={<StrikethroughIcon className="size-5 shrink-0" />}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        />
        <Divider />
        <TabbarItem
          text="Bullet List"
          children={<ListBulletIcon className="size-5 shrink-0" />}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
        <TabbarItem
          text="Ordered List"
          children={<NumberedListIcon className="size-5 shrink-0" />}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />
        <Divider />
        <TabbarItem
          text="Code Block"
          children={<CodeBracketIcon className="size-5 shrink-0" />}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
        <Divider />
        <TabbarItem
          text={`AI Anchors ${
            anchorHandlesInteractivity ? "Enabled" : "Disabled"
          } `}
          children={
            anchorHandlesInteractivity ? (
              <SparklesIcon className="size-5 shrink-0" />
            ) : (
              <SparklesIconOutline className="size-5 shrink-0" />
            )
          }
          active={anchorHandlesInteractivity}
          onClick={() => {
            const anchorLayer = document.getElementById("anchor-layer");
            if (anchorLayer) {
              if (anchorHandlesInteractivity) {
                setAnchorHandlesInteractivity(false);
                (anchorLayer as HTMLElement).style.pointerEvents = "none";
                (anchorLayer as HTMLElement).style.opacity = "0.25";
              } else {
                setAnchorHandlesInteractivity(true);
                (anchorLayer as HTMLElement).style.pointerEvents = "auto";
                (anchorLayer as HTMLElement).style.opacity = "1";
              }
            }
          }}
        />
      </div>
      <p
        className={`${
          anchorHandlesInteractivity && !draggingAnchor
            ? "opacity-100"
            : "opacity-0 pointer-events-none select-none"
        } transition-opacity absolute -bottom-6 text-xs text-center font-medium text-zinc-400 tracking-tight`}
      >
        Click outside the page to create an Anchor
      </p>
    </div>
  );

  function Divider() {
    return <div className="w-px h-8 bg-zinc-200" />;
  }
}

function TabbarItem({
  children,
  text,
  active,
  onClick,
}: {
  children?: React.ReactNode;
  text?: string;
  active: boolean;
  onClick?: () => void;
}) {
  return (
    <div className="group relative w-8">
      <button
        onClick={onClick}
        className={`${
          active ? "text-zinc-700" : "text-zinc-500 hover:text-zinc-700"
        } focus:outline-none cursor-pointer flex flex-col items-center justify-center space-y-1`}
      >
        <div
          className={`${
            active ? "bg-zinc-200" : "bg-white"
          } w-8 h-8 transition-colors rounded-xl group-hover:bg-zinc-100 flex items-center justify-center`}
        >
          {children}
        </div>
      </button>
      {text ? (
        <div
          className={`absolute w-full -top-10 hidden group-hover:flex items-center justify-center`}
        >
          <p className="text-center whitespace-nowrap text-xs font-medium text-zinc-700 pointer-events-none px-2 py-1 bg-white border shadow rounded-lg border-zinc-200">
            {text}
          </p>
        </div>
      ) : null}
    </div>
  );
}
