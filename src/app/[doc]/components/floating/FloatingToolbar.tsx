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

export default function FloatingToolbar({
  editor,
  open,
}: {
  editor: Editor | null;
  open: () => void;
}) {
  if (!editor) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-20 flex items-center justify-center">
      <div className="bg-white border rounded-xl border-zinc-200 relative shadow-xl p-2 flex items-center justify-center space-x-2">
        <TabbarItem
          text="Heading"
          children={
            <p className="text-xl flex items-center justify-center size-5 font-bold font-display">
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
        {/* <TabbarItem
          text="Comment"
          children={<ChatBubbleLeftRightIcon className="size-5 shrink-0" />}
          active={editor.isActive("liveblocksCommentMark")}
          onClick={() => editor.chain().focus().addPendingComment().run()}
        /> */}
        <TabbarItem
          text="Snapshot"
          children={<ViewfinderCircleIcon className="size-5 shrink-0" />}
          active={false}
          onClick={() => {
            open();
          }}
        />
      </div>
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
          active ? "text-gray-700" : "text-gray-500 hover:text-gray-700"
        } focus:outline-none cursor-pointer flex flex-col items-center justify-center space-y-1`}
      >
        <div
          className={`${
            active ? "bg-gray-200" : "bg-white"
          } w-8 h-8 transition-colors rounded-lg group-hover:bg-gray-100 flex items-center justify-center`}
        >
          {children}
        </div>
      </button>
      {text ? (
        <div
          className={`absolute w-full -top-10 hidden group-hover:flex items-center justify-center`}
        >
          <p className="text-center whitespace-nowrap text-xs font-medium text-gray-700 pointer-events-none px-2 py-1 bg-white border shadow rounded-md border-zinc-200">
            {text}
          </p>
        </div>
      ) : null}
    </div>
  );
}
