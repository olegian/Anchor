import { ChevronRightIcon } from "@heroicons/react/16/solid";

export function MainThreadListItem() {
  return (
    <button className="bg-amber-100 cursor-pointer group hover:opacity-75 transition-colors w-full rounded-lg p-2 flex items-center justify-between">
      <div className="font-semibold text-sm px-2 py-1 rounded-lg bg-amber-300 inline-block text-black">
        Main
      </div>
      <ChevronRightIcon className="size-5 text-amber-700 p-1" />
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
        <div className="flex items-center justify-end -space-x-2">
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 border border-white/50 text-white font-semibold text-xs">
            GH
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-pink-500 border border-white/50 text-white font-semibold text-xs">
            FF
          </div>
          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 border border-white/50 text-white font-semibold text-xs">
            RJ
          </div>
        </div>
        <button className="text-gray-700 p-1 hover:text-gray-500">
          <ChevronRightIcon className="size-5" />
        </button>
        {/* <button className="text-xs bg-white border border-zinc-200 text-black rounded-lg font-medium px-2 py-1 hover:text-gray-700 flex items-center gap-1">
          <PlusIcon className="size-4 text-gray-700" />
          Thread
        </button> */}
      </div>
    </li>
  );
}
