import { ChevronRightIcon } from "@heroicons/react/16/solid";
import { Users } from "../Users";

export function MainThreadListItem() {
  return (
    <button className="bg-amber-100 cursor-pointer group hover:opacity-75 transition-colors w-full rounded-lg p-2 flex items-center justify-between">
      <div className="font-semibold text-sm px-2 py-1 rounded-lg bg-amber-300 inline-block text-black">
        Main
      </div>
      <div className="flex items-center justify-end gap-1">
        <Users hover={false} />
        <ChevronRightIcon className="size-5 shrink-0 text-amber-700" />
      </div>
    </button>
  );
}

export function CurrentThreadListItem() {
  return (
    <button className="bg-blue-100 cursor-pointer group hover:opacity-75 transition-colors w-full rounded-lg p-2 flex items-center justify-between">
      <div className="font-semibold text-sm px-2 py-1 rounded-lg bg-blue-500 inline-block text-white">
        # Thread Title
      </div>
      <div className="flex items-center justify-end gap-1">
        <Users hover={false} />
        <ChevronRightIcon className="size-5 shrink-0 text-blue-700" />
      </div>
    </button>
  );
}

export function ThreadListItem() {
  return (
    <li className="cursor-pointer group py-2 px-4 hover:bg-zinc-100 transition-colors flex items-center justify-between">
      <h4 className="font-semibold text-sm text-gray-700">
        <span className="text-gray-500">#</span> Thread Title
      </h4>
      <div className="flex items-center justify-end gap-1">
        <Users hover={false} />
        <button className="text-gray-700 p-1 hover:text-gray-500">
          <ChevronRightIcon className="size-5 shrink-0" />
        </button>
      </div>
    </li>
  );
}
