import { CogIcon } from "@heroicons/react/20/solid";
import { User, Users } from "./Users";

export default function FloatingMenu() {
  return (
    <div className="fixed flex items-center justify-end top-4 right-4 z-20 bg-white  border border-zinc-200 p-2 rounded-xl space-x-2">
      <Users hover={true} />
      <div className="w-px h-8 bg-zinc-200" />
      <User first="Greg" last="Heffley" hover={true} />
      <div
        className={`bg-white w-8 h-8 transition-colors rounded-lg hover:bg-gray-100 flex items-center justify-center`}
      >
        <CogIcon className="size-5 text-gray-700" />
      </div>
    </div>
  );
}
