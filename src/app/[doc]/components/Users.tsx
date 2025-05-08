export function Users({ hover = false }: { hover?: boolean }) {
  return (
    <div
      className={`flex items-center justify-end transition-(--spacing) transform ${
        hover ? "hover:space-x-1" : ""
      } -space-x-2`}
    >
      <User first="Gustavo" last="Henrique" hover={hover} />
      <User first="Filipe" last="Figueiredo" hover={hover} />
      <User first="Rafael" last="Júnior" hover={hover} />
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-200  z-20  text-zinc-600 font-semibold text-xs">
        33
      </div>
    </div>
  );
}
export function User({
  first,
  last,
  hover,
}: {
  first: string;
  last: string;
  hover?: boolean;
}) {
  return (
    <div className="group relative w-6">
      <div className="uppercase flex items-center justify-center w-6 h-6 rounded-full bg-teal-500 border border-white/50 text-white font-semibold text-xs">
        {first[0]}
        {last[0]}
      </div>
      {hover ? (
        <div
          className={`absolute w-full top-8 hidden group-hover:flex items-center justify-center`}
        >
          <p className="text-center whitespace-nowrap text-xs font-medium text-gray-700 pointer-events-none px-2 py-1 bg-white border shadow rounded-md border-zinc-200">
            {first} {last}
          </p>
        </div>
      ) : null}
    </div>
  );
}
