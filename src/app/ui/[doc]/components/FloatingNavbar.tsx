export default function FloatingNavbar({
  title,
  scrollPosition,
}: {
  title: string;
  scrollPosition: number;
}) {
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-10 transition-opacity p-2 bg-linear-to-b w-full text-center from-white to-transparent">
        <h2
          className={`line-clamp-1 font-semibold overflow-hidden font-sans duration-200 text-sm transition-colors rounded-lg ${
            scrollPosition < 180 ? "opacity-0" : "opacity-100"
          } transition-opacity`}
        >
          <div className="relative font-semibold text-xxs p-1 mr-2 py-0.5 rounded-md bg-amber-300 inline-flex items-center justify-center text-black">
            Main
          </div>
          {title || "No title"}
        </h2>
      </div>
      <div
        className={`fixed bottom-0 left-0 right-0 z-10 transition-opacity p-4 bg-linear-to-t w-full text-center from-white to-transparent pointer-events-none select-none`}
      />
    </>
  );
}
