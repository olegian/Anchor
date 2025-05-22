import { liveblocks } from "@/app/liveblocks";
import { createDoc } from "@/app/actions";
import {
  Button,
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { redirect } from "next/navigation";

export default function NewDocDialog({
  tempDocTitle,  // TODO: move away from using any title on doc creation
  setTempDocTitle,
  isOpen,
  close,
}: {
  tempDocTitle: string;
  setTempDocTitle: (title: string) => void;
  isOpen: boolean;
  close: () => void;
}) {
  const createDocHandler = () => {
    // if we want to register some sort of permissions/doc restrictions
    // then call this action and set permissions server side
    // await createDoc(tempDocTitle)

    const newDocId = crypto.randomUUID()
    redirect(`/${newDocId}`);  // auto creates doc on reroute
  };

  return (
    <Dialog
      open={isOpen}
      as="div"
      className="relative z-10 focus:outline-none"
      onClose={close}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full space-y-4 max-w-sm rounded-xl bg-white p-8 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
          >
            <div className="space-y-2">
              <DialogTitle as="h3" className="text-lg font-semibold text-black">
                Create a new document
              </DialogTitle>
              <p className="text-sm/6 text-zinc-600">
                Enter a name for your new document. You can change it later.
              </p>
            </div>

            <input
              type="text"
              value={tempDocTitle}
              onChange={(e) => setTempDocTitle(e.target.value)}
              placeholder="Document name"
              className="w-full border border-zinc-200 rounded-lg px-4 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <Button
              onClick={createDocHandler}
              type="button"
              disabled={tempDocTitle.length < 1}
              className="disabled:opacity-50 border border-zinc-200 inline-flex items-center gap-2 rounded-lg bg-white cursor-pointer px-2 py-1 text-sm font-medium text-black focus:not-data-focus:outline-none data-focus:outline data-hover:bg-zinc-100 data-open:bg-zinc-100"
            >
              Create document
            </Button>

            <CloseButton
              onClick={close}
              className="fixed top-4 right-4 group p-1 cursor-pointer"
            >
              <XMarkIcon className="size-5 text-zinc-500 group-hover:text-zinc-700 transition-colors" />
            </CloseButton>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}
