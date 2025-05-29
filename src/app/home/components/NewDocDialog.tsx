import { createDoc } from "@/app/actions";
import {
  Button,
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { ArrowPathIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function NewDocDialog({
  isOpen,
  close,
}: {
  isOpen: boolean;
  close: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const [tempDocTitle, setTempDocTitle] = useState("");
  const session = useSession();
  const createDocHandler = async () => {
    const newDocId = crypto.randomUUID();

    setLoading(true);
    if (session && session.data && session.data.user && session.data.user.id) {
      await createDoc(newDocId, tempDocTitle, session.data.user.id);
      redirect(`/${newDocId}`); // auto creates doc on reroute
    }
    setLoading(false);
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
            className="w-full space-y-4 max-w-md rounded-xl bg-white p-8 backdrop-blur-2xl duration-300 ease-out data-closed:transform-[scale(95%)] data-closed:opacity-0"
          >
            <div className="space-y-2">
              <DialogTitle
                as="h3"
                className="text-xl font-semibold text-black font-heading tracking-tight"
              >
                Create a new document
              </DialogTitle>
              <p className="text-sm/6 text-zinc-600 text-balance">
                Enter a name for your new document. You can change it later.
              </p>
            </div>

            <input
              type="text"
              disabled={loading}
              value={tempDocTitle}
              onChange={(e) => setTempDocTitle(e.target.value)}
              placeholder="Document name"
              className="w-full border disabled:opacity-50 disabled:pointer-events-none border-zinc-200 rounded-xl px-4 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <Button
              onClick={createDocHandler}
              type="button"
              disabled={tempDocTitle.length < 1 || loading}
              className="disabled:opacity-50 disabled:pointer-events-none border border-zinc-200 inline-flex items-center gap-2 rounded-xl bg-white cursor-pointer px-2.5 py-1.5 text-sm font-medium text-black focus:not-data-focus:outline-none data-focus:outline data-hover:bg-zinc-100 data-open:bg-zinc-100"
            >
              {loading ? (
                <>
                  Creating document{" "}
                  <ArrowPathIcon className="animate-spin size-4 text-zinc-600" />
                </>
              ) : (
                "Create Document"
              )}
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
