export default function FloatingNavbar({
  title,
  scrollPosition,
}: {
  title: string;
  scrollPosition: number;
}) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-10 transition-opacity p-2 bg-linear-to-b w-full text-center from-white to-transparent`}
    >
      <h2
        className={`line-clamp-1 font-semibold overflow-hidden font-sans text-sm transition-colors rounded-lg ${
          scrollPosition < 180 ? "opacity-0" : "opacity-100"
        } transition-opacity`}
      >
        {title || "No title"}
      </h2>
    </div>
  );
}
