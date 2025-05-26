import { getUser } from "@/app/actions";
import { signOut } from "@/app/auth";
import { getUserInfo } from "@/app/firebase";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";

import { UserCircleIcon } from "@heroicons/react/20/solid";
import { User } from "next-auth";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserMenu({ user }: { user: User | null }) {
  const [profile, setProfile] = useState<{
    name: string;
    color: string;
  } | null>(null);
  useEffect(() => {
    if (user && user.id) {
      console.log("getting userID", user.id);
      getUser(user.id).then((res) => {
        console.log("found");
        setProfile(res);
      });
    }
  }, [user]);
  const [first = "", last = ""] = profile?.name.split(" ") || [];

  return (
    <Menu>
      <MenuButton>
        {user && user.name ? (
          <div
            style={{
              backgroundColor: profile?.color,
            }}
            className="uppercase cursor-pointer hover:opacity-75 transition-opacity flex items-center justify-center size-10 rounded-full text-white font-semibold text-base"
          >
            {first.charAt(0)}
            {last.charAt(0)}
          </div>
        ) : (
          <UserCircleIcon className="size-10 fill-zinc-500 animate-pulse" />
        )}
      </MenuButton>
      <MenuItems
        transition
        anchor="bottom end"
        className="w-52 z-50 origin-top-right rounded-xl border border-zinc-200 bg-white p-1 text-sm/6 text-zinc-700 shadow-xl transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
      >
        <MenuItem>
          <button
            onClick={() => {
              // signOut();
              // redirect("/");
            }}
            className="group flex w-full items-center gap-2 rounded-lg px-3 py-1.5 data-focus:bg-zinc-100 font-medium"
          >
            {profile?.name}
          </button>
        </MenuItem>
        <div className="my-1 h-px bg-zinc-200" />
        <MenuItem>
          <button
            onClick={() => {
              signOut();
              redirect("/");
            }}
            className="group flex w-full items-center cursor-pointer gap-2 rounded-lg px-3 py-1.5 data-focus:bg-zinc-100 font-medium"
          >
            {/* <TrashIcon className="size-4 fill-red-500" /> */}
            Sign out
          </button>
        </MenuItem>
      </MenuItems>
    </Menu>
  );
}
