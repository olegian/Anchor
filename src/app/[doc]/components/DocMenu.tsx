import { deleteDoc } from "@/app/actions";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ChevronDownIcon,
  TrashIcon
} from "@heroicons/react/16/solid";
import { useMyPresence } from "@liveblocks/react";
import { useParams, useRouter } from "next/navigation";

export default function DocMenu({ showText = false }: { showText?: boolean }) {
  const params = useParams<{ doc: string }>();
  const [myPresence, updateMyPresence] = useMyPresence();
  const router = useRouter();

  const deleteDocHandler = () => {
    deleteDoc(params.doc).then(() => {
      router.push("/home");
    });
  };

  return (
    <Menu>
      <MenuButton
        className={`inline-flex items-center gap-1 text-sm rounded-lg cursor-pointer data-hover:bg-zinc-100 data-open:bg-zinc-100 transition-colors ${
          showText ? "px-2 py-1" : "p-1"
        } font-medium text-zinc-600`}
      >
        {showText && <span>Options</span>}
        <ChevronDownIcon className="size-4" />
      </MenuButton>

      <MenuItems
        transition
        anchor="bottom end"
        className="w-52 z-50 origin-top-right rounded-xl border border-zinc-200 bg-white p-1 text-sm/6 text-zinc-700 shadow-xl transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        <MenuItem>
          <button
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-zinc-100 font-medium cursor-pointer"
            onClick={deleteDocHandler}
          >
            <TrashIcon className="size-4 fill-red-500" />
            Delete Document
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
