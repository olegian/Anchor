import { getUser } from "@/app/actions";
import { calculateBlackOrWhiteContrast } from "@/app/lib/utils";
import { NEXT_CACHE_TAG_MAX_LENGTH } from "next/dist/lib/constants";
import { useEffect, useState } from "react";

export function Users({
  hover = false,
  usersList,
}: {
  hover?: boolean;
  usersList: string[] | undefined;
}) {
  return (
    <div
      className={`flex items-center justify-end transition-(--spacing) transform ${
        hover ? "hover:space-x-1" : ""
      } -space-x-2`}
    >
      {usersList !== undefined &&
        usersList.slice(0, 3).map((id, idx) => {
          if (id === undefined) return <></>;
          return <User id={id} hover={hover} key={idx} />;
        })}
      {usersList !== undefined && usersList?.length > 3 ? (
        <div className="flex items-center justify-center size-6 rounded-full bg-white z-20  text-zinc-600 font-semibold text-xs">
          {(usersList?.length ?? -1) + 1}
        </div>
      ) : null}
    </div>
  );
}

export function User({ id, hover }: { id: string; hover?: boolean }) {
  const [profile, setProfile] = useState<{
    name: string;
    color: string;
  } | null>(null);
  useEffect(() => {
    if (id) {
      getUser(id).then((res) => {
        setProfile(res);
      });
    }
  }, [id]);
  const [first = "", last = ""] = profile?.name.includes(" ")
    ? profile.name.split(" ")
    : [profile?.name || "", ""];

  return (
    <div className="group relative w-6">
      <div
        className="uppercase flex items-center justify-center size-6 rounded-full bg-zinc-800  text-white font-semibold text-xs"
        style={{
          backgroundColor: profile?.color,
          color: calculateBlackOrWhiteContrast(profile?.color ?? "#000000"),
        }}
      >
        {first.charAt(0)}
        {last.charAt(0) ? last.charAt(0) : ""}
      </div>
      {hover ? (
        <div
          className={`absolute w-full top-8 hidden group-hover:flex items-center justify-center`}
        >
          <p className="text-center whitespace-nowrap text-xs font-medium text-zinc-700 pointer-events-none px-2 py-1 bg-white border shadow rounded-md border-zinc-200">
            {profile?.name}
          </p>
        </div>
      ) : null}
    </div>
  );
}
