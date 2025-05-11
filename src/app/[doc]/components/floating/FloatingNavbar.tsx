import { useStorage } from "@liveblocks/react";
import DocMenu from "../DocMenu";

export default function FloatingNavbar({
  scrollPosition,
  snapshot,
}: {
  scrollPosition: number;
  snapshot?: string;
}) {
  const title = useStorage((root) => root.docTitle);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-10 transition-opacity p-2 bg-linear-to-b w-full text-center from-white via-white/75 to-transparent">
        <h2
          className={`line-clamp-1 flex items-start justify-center gap-8 overflow-hidden duration-200 text-sm transition-colors rounded-lg ${
            scrollPosition < 180 ? "opacity-0" : "opacity-100"
          } transition-opacity`}
        >
          <div
            className={`${
              snapshot ? "bg-blue-600 text-white" : "bg-amber-300 text-black"
            } relative font-semibold font-sans text-xs px-1 mr-2 py-0.5 rounded-md inline-flex items-center justify-center`}
          >
            {snapshot ? "Snapshot" : "Main"}
          </div>
          <div className="text-center">
            <h4 className="font-semibold line-clamp-1 w-sm font-sans ">
              {title || "No title"}
            </h4>
            <p className="text-zinc-500 text-xs font-semibold font-sans">
              Last updated 2 days ago
            </p>
          </div>
          <DocMenu showText={false} />
        </h2>
      </div>
      <div
        className={`fixed bottom-0 left-0 right-0 z-10 transition-opacity p-4 bg-linear-to-t w-full text-center from-white via-white/75 to-transparent pointer-events-none select-none`}
      />
    </>
  );
}
