import { ArrowRightIcon } from "@heroicons/react/20/solid";

export default function DocPill({ mini }: { mini: boolean }) {
  if (mini) {
    return (
      <div className="relative font-semibold text-sm p-2 py-1 rounded-lg bg-amber-300 inline-flex items-center justify-center text-black">
        Main
      </div>
    );
  } else {
    return (
      <div>
        <div className="relative font-semibold text-sm px-2 py-1 rounded-lg bg-blue-500 inline-block text-white z-20">
          # Threadasjdkashdsakjhsadkjhdask
        </div>
        <div className="relative hover:opacity-75 cursor-pointer font-semibold text-sm pl-6 pr-2 py-1 gap-1.5 rounded-r-lg bg-amber-300 inline-flex items-center justify-center text-black -translate-x-14.5 hover:-translate-x-4 transition-transform duration-200">
          Main
          <ArrowRightIcon className="size-4 shrink-0 text-black " />
        </div>
      </div>
    );
  }
}
