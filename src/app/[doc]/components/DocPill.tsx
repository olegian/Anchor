import { ArrowLeftIcon } from "@heroicons/react/16/solid";
import { ArrowRightIcon } from "@heroicons/react/20/solid";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";

export default function DocPill({
  snapshotTitle,
  loaded,
}: {
  snapshotTitle?: string;
  loaded: boolean;
}) {
  const params = useParams<{ doc: string; snapshot: string }>();
  const searchParams = useSearchParams();

  if (!loaded) {
    return (
      <div className="relative p-2 py-1 rounded-lg bg-zinc-200 animate-pulse h-7 w-32" />
    );
  }

  if (!snapshotTitle) {
    if (searchParams.get("from")) {
      return (
        <div className="rounded-lg overflow-hidden">
          <div className="relative font-semibold text-sm px-2 py-1 rounded-lg bg-amber-300 inline-block text-black z-20">
            Main
          </div>
          <Link href={`/${params.doc}/${searchParams.get("from")}`}>
            <div className="relative hover:opacity-75 cursor-pointer font-semibold text-sm pl-6 pr-2 py-1 gap-1.5 rounded-r-lg bg-blue-500 inline-flex items-center justify-center text-white -translate-x-14.5 hover:-translate-x-4 transition-transform duration-200">
              Back
              <ArrowLeftIcon className="size-4 shrink-0 text-white " />
            </div>
          </Link>
        </div>
      );
    } else {
      return (
        <div className="relative font-semibold text-sm p-2 py-1 rounded-lg bg-amber-300 inline-flex items-center justify-center text-black">
          Main
        </div>
      );
    }
  } else {
    return (
      <div className="rounded-lg overflow-hidden">
        <div className="relative font-semibold text-sm px-2 py-1 rounded-lg bg-blue-500 inline-block text-white z-20">
          {snapshotTitle}
        </div>
        <Link href={`/${params.doc}?from=${params.snapshot}`}>
          <div className="relative hover:opacity-75 cursor-pointer font-semibold text-sm pl-6 pr-2 py-1 gap-1.5 rounded-r-lg bg-amber-300 inline-flex items-center justify-center text-black -translate-x-14.5 hover:-translate-x-4 transition-transform duration-200">
            Main
            <ArrowRightIcon className="size-4 shrink-0 text-black " />
          </div>
        </Link>
      </div>
    );
  }
}
