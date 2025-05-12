"use client";

import { Session } from "next-auth";
import { useParams } from "next/navigation";
import { Room } from "../Room";
import { useScrollPosition } from "@/app/components/hooks/useScrollPosition";
import BackButton from "../components/floating/BackButton";
import FloatingNavbar from "../components/floating/FloatingNavbar";
import FloatingMenu from "../components/floating/FloatingMenu";
import { useMutation, useMyPresence, useStorage } from "@liveblocks/react";
import SnapshotsSidebar from "../components/sidebar/SnapshotsSidebar";
import DocPill from "../components/DocPill";
import DocMenu from "../components/DocMenu";
import Editor from "../components/Editor";
import FloatingEditorView from "./FloatingEditorView";
import { useEffect } from "react";

export default function SnapshotEditorPage({ session }: { session: Session }) {
  const params = useParams<{ doc: string; snapshot: string }>();
  const scrollPosition = useScrollPosition();

  return (
    <>
      <Room doc_name={params.doc} session={session}>
        <BackButton />
        <EditingInterface params={params} />
        <FloatingMenu />
        <FloatingNavbar scrollPosition={scrollPosition} snapshot={params.snapshot} />
      </Room>
    </>
  );
}

function EditingInterface({ params }: { params: { doc: string; snapshot: string } }) {
  const snapshot = useStorage((root) => root.snapshots.get(params.snapshot));
  const title = useStorage((root) => root.docTitle);
  const [myPresence, updateMyPresence] = useMyPresence();
  const setTitle = useMutation(({ storage }, newTitle) => {
    storage.set("docTitle", newTitle);
  }, []);

  useEffect(() => {
    updateMyPresence({ currentSnapshot: params.snapshot });
  }, []);

  return (
    <>
      <SnapshotsSidebar open={() => {}} />
      <div className="py-4 px-2 md:py-8 md:px-6 ">
        <div className="max-w-3xl mx-auto py-16 space-y-4">
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <DocPill
                snapshotTitle={snapshot?.snapshotTitle}
                loaded={title !== null}
              />
              <DocMenu showText={true} />
            </div>
            {title !== null ? (
              <p className="font-semibold text-zinc-500 text-sm">
                Last updated 2 days ago by Greg Heffley
              </p>
            ) : (
              <div className="relative p-2 py-1 rounded-lg bg-zinc-200 animate-pulse h-5 w-56" />
            )}
          </div>
          <Editor
            title={title ?? ""}
            setTitle={setTitle}
            open={open}
            field={params.snapshot}
            loaded={title !== null}
          />
        </div>
      </div>
      <FloatingEditorView field="maindoc" />
    </>
  );
}
