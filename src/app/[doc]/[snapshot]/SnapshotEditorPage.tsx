"use client";

import { Session } from "next-auth";
import { useParams } from "next/navigation";
import { Room } from "../Room";
import { useScrollPosition } from "@/app/components/hooks/useScrollPosition";
import BackButton from "../components/floating/BackButton";
import FloatingNavbar from "../components/floating/FloatingNavbar";
import FloatingMenu from "../components/floating/FloatingMenu";
import { useMutation, useStorage } from "@liveblocks/react";
import SnapshotsSidebar from "../components/sidebar/SnapshotsSidebar";
import DocPill from "../components/DocPill";
import DocMenu from "../components/DocMenu";
import Editor from "../components/Editor";
import FloatingEditorView from "./FloatingEditorView";

export default function SnapshotEditorPage({ session }: { session: Session }) {
  const params = useParams<{ doc: string; snapshot: string }>();
  const scrollPosition = useScrollPosition();

  return (
    <>
      <Room doc_name={params.doc} session={session}>
        <BackButton />
        <EditingInterface params={params} />
        <FloatingMenu />
        <FloatingNavbar
          scrollPosition={scrollPosition}
          snapshot={params.snapshot}
        />
      </Room>
    </>
  );
}

function EditingInterface({
  params,
}: {
  params: { doc: string; snapshot: string };
}) {
  const snapshot = useStorage((root) => root.snapshots.get(params.snapshot));

  const title = useStorage((root) => root.docTitle);
  const setTitle = useMutation(({ storage }, newTitle) => {
    storage.set("docTitle", newTitle);
  }, []);

  return (
    <>
      <SnapshotsSidebar open={() => {}} />
      <div className="py-4 px-2 md:py-8 md:px-6 ">
        <div className="max-w-3xl mx-auto py-16 space-y-4">
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <DocPill snapshotTitle={snapshot?.snapshotTitle} />
              <DocMenu showText={true} />
            </div>
            <p className="font-semibold text-zinc-500 text-sm">
              Last updated 2 days ago by Greg Heffley
            </p>
          </div>
          <Editor
            title={title ?? ""}
            setTitle={setTitle}
            open={open}
            field={params.doc}
          />
        </div>
      </div>
      <FloatingEditorView field="maindoc" />
    </>
  );
}
