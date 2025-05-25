import { deleteDoc } from "@/app/actions";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ChevronDownIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const DeleteDocDialog = dynamic(() => import("./dialog/DeleteDocDialog"));
const DeleteAnchorsDialog = dynamic(
  () => import("./dialog/DeleteAnchorsDialog")
);
import { useState } from "react";

export default function DocMenu({ showText = false }: { showText?: boolean }) {
  const params = useParams<{ doc: string }>();
  const router = useRouter();

  const deleteDocHandler = () => {
    deleteDoc(params.doc).then(() => {
      router.push("/home");
    });
  };

  const deleteAnchorsHandler = () => {
    // TODO: Delete all anchors
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteAnchorsDialogOpen, setIsDeleteAnchorsDialogOpen] =
    useState(false);

  return (
    <>
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
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <TrashIcon className="size-4 fill-red-500" />
              Delete Document
            </button>
          </MenuItem>
          <MenuItem>
            <button
              className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-zinc-100 font-medium cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <XMarkIcon className="size-4 fill-red-500" />
              Delete all Anchors
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
      <DeleteDocDialog
        deleteDocHandler={deleteDocHandler}
        isOpen={isDeleteDialogOpen}
        close={() => setIsDeleteDialogOpen(false)}
      />
      <DeleteAnchorsDialog
        deleteAllAnchorsHandler={deleteAnchorsHandler}
        isOpen={isDeleteAnchorsDialogOpen}
        close={() => setIsDeleteAnchorsDialogOpen(false)}
      />
    </>
  );
}
