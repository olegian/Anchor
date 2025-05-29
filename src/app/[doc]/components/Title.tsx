export default function Title({
  title,
  setTitle,
}: {
  title: string;
  setTitle: (title: string) => void;
}) {
  const placeholder = "Enter a title...";

  return (
    <h1
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => setTitle(e.target.textContent || "")}
      className="w-full text-4xl! font-heading tracking-tight mb-4 border-b-2 transition-colors rounded-xl border-transparent hover:bg-zinc-100 inline px-2 py-1 focus:outline-none focus:border-none focus:bg-zinc-100"
    >
      {title || placeholder}
    </h1>
  );
}
