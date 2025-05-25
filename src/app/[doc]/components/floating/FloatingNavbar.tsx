import { useStorage } from "@liveblocks/react";
import DocMenu from "../DocMenu";

export default function FloatingNavbar({
  scrollPosition,
}: {
  scrollPosition: number;
}) {
  const title = useStorage((root) => root.docTitle);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-10 transition-opacity p-4 bg-linear-to-b w-full text-center from-zinc-50 via-white/75 to-transparent">
        <h2
          className={`line-clamp-1 flex items-start justify-center gap-8 overflow-hidden duration-200 text-sm transition-colors rounded-lg ${
            scrollPosition < 180 ? "opacity-0" : "opacity-100"
          } transition-opacity`}
        >
          <div
            className="text-center group cursor-pointer"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <h4 className="font-semibold line-clamp-1 max-w-md font-sans relative">
              {title || "No title"}
            </h4>
            <p className="text-zinc-500 text-xs font-semibold font-sans opacity-0 group-hover:translate-y-0 transition-all group-hover:opacity-100 -translate-y-5">
              Last updated 2 days ago
            </p>
          </div>
        </h2>
      </div>
      <div
        className={`fixed bottom-0 left-0 right-0 z-10 transition-opacity p-4 bg-linear-to-t w-full text-center from-zinc-50 via-white/75 to-transparent pointer-events-none select-none`}
      />
    </>
  );
}
