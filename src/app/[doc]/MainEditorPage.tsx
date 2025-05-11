"use client";

import { Session } from "next-auth";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import DocMenu from "./components/DocMenu";
import Editor from "./components/Editor";
import FloatingMenu from "./components/floating/FloatingMenu";
import FloatingNavbar from "./components/floating/FloatingNavbar";
import SnapshotsSidebar from "./components/sidebar/SnapshotsSidebar";
import { Room } from "./Room";

import { LiveMap, LiveObject } from "@liveblocks/client";
import { useMutation, useMyPresence, useStorage } from "@liveblocks/react";
import NewSnapshotDialog from "./components/dialog/NewSnapshotDialog";
import { useScrollPosition } from "../components/hooks/useScrollPosition";
import BackButton from "./components/floating/BackButton";
import DocPill from "./components/DocPill";
import FloatingEditorView from "./[snapshot]/FloatingEditorView";

export default function MainEditorPage({ session }: { session: Session }) {
  const params = useParams<{ doc: string }>();

  const scrollPosition = useScrollPosition();
  return (
    <>
      <Room doc_name={params.doc} session={session}>
        <BackButton />
        <EditingInterface doc={params.doc} />
        <FloatingMenu />
        <FloatingNavbar scrollPosition={scrollPosition} />
      </Room>
    </>
  );
}

function EditingInterface({ doc }: { doc: string }) {
  const router = useRouter();
  const [newSnapshotDialog, setNewSnapshotDialog] = useState(false);
  const [myPresence, updateMyPresence] = useMyPresence();

  const title = useStorage((root) => root.docTitle);
  const setTitle = useMutation(({ storage }, newTitle) => {
    storage.set("docTitle", newTitle);
  }, []);
  const addSnapshot = useMutation(
    ({ storage }, newSnapshotId: string, title: string) => {
      const snapshots = storage.get("snapshots");
      snapshots.set(
        newSnapshotId,
        new LiveObject({
          isInitialized: false,
          snapshotTitle: title,
          conversations: new LiveMap(),
        })
      );
    },
    []
  );

  useEffect(() => {
    console.log("A ", myPresence)
    updateMyPresence({currentSnapshot: null})
  }, [])

  const handleCreateSnapshot = (title: string) => {
    const newSnapshotId = crypto.randomUUID();

    // note this just populates storage, it does not redirect the user
    // or populate the snapshot contents yet. populating the contents
    // can happen when the snapshot is loaded, as it requires a handle
    // to the snapshot editor.
    addSnapshot(newSnapshotId, title);
    router.push(`/${doc}/${newSnapshotId}`);
  };

  function open() {
    setNewSnapshotDialog(true);
  }

  function close() {
    setNewSnapshotDialog(false);
  }

  return (
    <>
      <SnapshotsSidebar open={open} />
      <div className="py-4 px-2 md:py-8 md:px-6 ">
        <div className="max-w-3xl mx-auto py-16 space-y-4">
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              <DocPill />
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
            field="maindoc"
          />
        </div>
      </div>
      {/* TODO: maybe we have a preview back and forth? */}
      {/* {searchParams.get("from") ? (
        <FloatingEditorView field={searchParams.get("from") ?? "null"} />
      ) : null} */}
      <NewSnapshotDialog
        isOpen={newSnapshotDialog}
        close={close}
        handleCreateSnapshot={handleCreateSnapshot}
      />
    </>
  );
}
