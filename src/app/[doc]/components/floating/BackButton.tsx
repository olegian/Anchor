import { ChevronLeftIcon } from "@heroicons/react/20/solid";
import Link from "next/link";

export default function BackButton() {
  return (
    <Link
      href="/home"
      className="fixed cursor-pointer hover:text-zinc-400 top-4 left-4 z-50 flex items-center justify-start text-sm gap-1 text-zinc-600"
    >
      <ChevronLeftIcon className="size-6 shrink-0" />
      <p className="font-medium text-sm">Back</p>
    </Link>
  );
}
