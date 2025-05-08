import {
  BoldIcon,
  CodeBracketIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
} from "@heroicons/react/20/solid";
import { Editor } from "@tiptap/react";

export default function Tabbar({ editor }: { editor: Editor | null }) {
  if (!editor) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-0 right-0 z-20 flex items-center justify-center">
      <div className="bg-white border rounded-xl border-zinc-200 relative shadow-xl p-2 flex items-center justify-center space-x-4">
        <TabbarItem
          text="Heading"
          children={<p className="text-xl">H</p>}
          active={editor.isActive("heading", { level: 2 })}
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
        />
        <div className="w-px h-8 bg-zinc-200" />
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

        <div className="w-px h-8 bg-zinc-200" />
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
        <div className="w-px h-8 bg-zinc-200" />
        <TabbarItem
          text="Code Block"
          children={<CodeBracketIcon className="size-5 shrink-0" />}
          active={editor.isActive("codeBlock")}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        />
      </div>
    </div>
  );
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
        } focus:outline-none flex flex-col items-center justify-center space-y-1`}
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
          className={`absolute w-full -top-10 ${
            active ? "flex z-0" : "hidden group-hover:flex z-10"
          } items-center justify-center`}
        >
          <p className="text-center whitespace-nowrap text-xs font-medium text-gray-700 pointer-events-none px-2 py-1 bg-white border shadow rounded-md border-zinc-200">
            {text}
          </p>
        </div>
      ) : null}
    </div>
  );
}
