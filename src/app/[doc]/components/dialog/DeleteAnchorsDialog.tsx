import {
  Button,
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/16/solid";

export default function DeleteAnchorsDialog({
  deleteAllAnchorsHandler,
  isOpen,
  close,
}: {
  deleteAllAnchorsHandler: () => void;
  isOpen: boolean;
  close: () => void;
}) {
  return (
    <Dialog
      id="delete-doc-dialog"
      open={isOpen}
      as="div"
      className="relative z-40 focus:outline-none"
      onClose={() => {}}
    >
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <DialogPanel
            transition
            className="w-full space-y-4 max-w-sm rounded-xl bg-white p-8 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
          >
            <div className="space-y-2">
              <DialogTitle
                as="h3"
                className="text-xl font-semibold text-black font-heading tracking-tight"
              >
                Delete all anchors?
              </DialogTitle>
              <p className="text-sm/6 text-zinc-600 text-balance">
                Are you sure you want to delete all anchors? This action cannot
                be undone.
              </p>
            </div>

            <div className="flex items-center justify-start gap-2">
              <Button
                onClick={close}
                type="button"
                className="border border-zinc-200 inline-flex items-center gap-2 rounded-xl bg-white cursor-pointer px-2.5 py-1.5 text-sm font-medium text-black focus:not-data-focus:outline-none data-focus:outline data-hover:bg-zinc-100 data-open:bg-zinc-100"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  deleteAllAnchorsHandler();
                  close();
                }}
                className="border border-red-700 inline-flex items-center gap-2 rounded-xl bg-red-500 cursor-pointer px-2.5 py-1.5 text-sm font-medium text-white focus:not-data-focus:outline-none data-focus:outline data-hover:bg-red-600 data-open:bg-red-600"
              >
                Delete
              </Button>
            </div>

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
