import { deleteSnapshotDoc } from "@/app/actions";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { ChevronDownIcon, TrashIcon, ArrowUpOnSquareIcon } from "@heroicons/react/16/solid";
import { useMutation, useMyPresence, useOthers } from "@liveblocks/react";
import { redirect, useParams } from "next/navigation";

export default function DocMenu({ showText = false }: { showText?: boolean }) {
  const params = useParams<{ doc: string; snapshot: string }>();
  const [myPresence, updateMyPresence] = useMyPresence();
  const usersOnSnapshot = useOthers((others) =>
    others
      .filter((other) => {
        return other.presence.currentSnapshot === params.snapshot;
      })
      .map((other) => other.presence.name)
  );

  const deleteSnapshot = useMutation(({ storage, others }) => {
    if (others.filter((other) => other.presence.currentSnapshot === params.snapshot).length !== 0) {
      // TODO: report unable to delete snapshot with a user currently on the snapshot?
      console.log("blocked");
      return;
    }

    // TODO: maybe add some loading animation if this deletion takes a while
    // TODO: This call currenty does nothing, and auto resolves. Go to the function to see why.
    deleteSnapshotDoc(params.doc, params.snapshot).then(() => {
        // delete snapshot entry in live storage
        storage.get("snapshots").delete(params.snapshot);
    }).catch((e) => {
        // TODO: report unable to delete snapshot
        // im honestly not sure if this will ever fail, unless the doc
        // has already been deleted, in which case I'm not sure how
        // someone would even be viewing this page. Nonetheless, something
        // defenseive here would be a good idea.
        console.log(e)
    });

    redirect(`/${params.doc}`);
  }, []);

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
          <button className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-zinc-100 font-medium">
            <ArrowUpOnSquareIcon className="size-4 fill-blue-500" />
            Share
          </button>
        </MenuItem>

        {!!params.snapshot && (
          <>
            <div className="my-1 h-px bg-zinc-200" />
            <MenuItem>
              <button
                className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-zinc-100 font-medium"
                onClick={deleteSnapshot}
              >
                <TrashIcon className="size-4 fill-red-500" />
                Delete Thread
              </button>
            </MenuItem>
          </>
        )}
      </MenuItems>
    </Menu>
  );
}
