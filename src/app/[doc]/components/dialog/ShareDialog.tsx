"use client";
import { getUsers, shareDoc } from "@/app/actions";

import {
  Button,
  CloseButton,
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/16/solid";
import { useEffect, useState } from "react";

export default function ShareDialog({
  isOpen,
  close,
  title,
  docId,
}: {
  isOpen: boolean;
  close: () => void;
  title: string;
  docId: string;
}) {
  type User = { fullname: string; name: string; color?: string };
  const [user, setUser] = useState<User | null>(null);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [query, setQuery] = useState("");

  const handleShareDocument = () => {
    // TODO: share document handler
    if (!user) return;
    console.log("Sharing document with user:", user);
    shareDoc(docId, user.name);
    setUser(null);
    close();
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const users = await getUsers();
      if (users) {
        setUsersList(users as User[]);
      }
    };
    fetchUsers();
  }, [isOpen, docId]);

  const filteredPeople =
    query.length === 0
      ? usersList
      : usersList.filter((user) => {
          return user.fullname.toLowerCase().includes(query.toLowerCase());
        });

  return (
    <Dialog
      id="share-doc-dialog"
      open={isOpen}
      as="div"
      className="relative z-40 focus:outline-none"
      onClose={() => {
        setUser(null);
        setQuery("");
        close();
      }}
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
                Share "{title}"
              </DialogTitle>
              <p className="text-sm/6 text-zinc-600 text-balance">
                Who would you like to share this document with?
              </p>
            </div>

            <Combobox
              value={user}
              onChange={(selectedUser) => {
                setUser(selectedUser); // selectedUser is the user's object
              }}
              onClose={() => setQuery("")}
              disabled={usersList.length === 0}
            >
              <ComboboxInput
                disabled={usersList.length === 0}
                aria-label="Select user to share document with"
                className="z-50 w-full border disabled:opacity-50 disabled:pointer-events-none border-zinc-200 rounded-xl px-4 py-2 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Start typing to search for users..."
                onChange={(e) => setQuery(e.target.value)}
                displayValue={(u: User | null) => u?.fullname || ""}
              />
              <ComboboxOptions
                anchor="bottom"
                className="z-50 mt-2 bg-white border border-zinc-200 rounded-xl shadow-lg max-h-60 overflow-y-auto w-full relative"
                style={{ width: "384px" }} // Adjust width as needed
              >
                {filteredPeople.map((u) => (
                  <ComboboxOption
                    key={u.name}
                    value={u}
                    className="cursor-pointer relative border-t first:border-0 border-zinc-200 select-none px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100"
                  >
                    {u.fullname}
                  </ComboboxOption>
                ))}
                {filteredPeople.length === 0 && (
                  <ComboboxOption
                    value=""
                    className="cursor-default select-none px-4 py-2 text-sm font-medium text-zinc-500"
                  >
                    No users found
                  </ComboboxOption>
                )}
              </ComboboxOptions>
            </Combobox>
            <Button
              onClick={() => handleShareDocument()}
              type="button"
              disabled={!user || !usersList.includes(user)}
              className="disabled:opacity-50 border border-zinc-200 inline-flex items-center gap-2 rounded-xl bg-white cursor-pointer px-2.5 py-1.5 text-sm font-medium text-black focus:not-data-focus:outline-none data-focus:outline data-hover:bg-zinc-100 data-open:bg-zinc-100"
            >
              Share document
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
