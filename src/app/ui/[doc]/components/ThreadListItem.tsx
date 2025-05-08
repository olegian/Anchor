import { TrashIcon } from "@heroicons/react/16/solid";
export default function ThreadListItem() {
  return (
    <li className="flex items-center justify-between border-b pb-2 border-zinc-200">
      <div className="flex items-center gap-2">
        <div className="p-1.5 font-semibold bg-teal-400 text-white text-sm rounded-full">
          GH
        </div>
        <div>
          <h3 className="font-semibold">Thread Title</h3>
          <p className="text-xs text-gray-500">Last message preview...</p>
        </div>
      </div>
      <button className="p-1 rounded-full bg-red-500">
        <TrashIcon className="size-4 text-white" />
      </button>
    </li>
  );
}
