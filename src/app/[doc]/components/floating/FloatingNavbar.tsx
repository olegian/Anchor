import DocMenu from "../DocMenu";

export default function FloatingNavbar({
  title,
  scrollPosition,
}: {
  title: string;
  scrollPosition: number;
}) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-10 transition-opacity p-2 bg-linear-to-b w-full text-center from-white via-white/75 to-transparent">
        <h2
          className={`line-clamp-1 flex items-start justify-center gap-8 overflow-hidden duration-200 text-sm transition-colors rounded-lg ${
            scrollPosition < 180 ? "opacity-0" : "opacity-100"
          } transition-opacity`}
        >
          <div className="relative font-semibold font-sans text-xxs px-1 mr-2 py-0.5 rounded-md bg-amber-300 inline-flex items-center justify-center text-black">
            Main
          </div>
          <div className="text-center">
            <h4 className="font-semibold line-clamp-1 max-w-sm font-sans ">
              {title || "No title"}
            </h4>
            <p className="text-gray-500 text-xs font-semibold font-sans">
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
