import { ArrowPathIcon } from "@heroicons/react/16/solid";

export default function LoadingState() {
  return (
    <div className="w-screen h-screen flex items-center justify-center gap-2">
      <ArrowPathIcon className="size-5 animate-spin text-zinc-500" />
      <p className="text-zinc-500">Loading...</p>
    </div>
  );
}
