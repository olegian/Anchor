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

import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import { useMutation, useMyPresence, useStorage } from "@liveblocks/react";
import NewSnapshotDialog from "./components/dialog/NewSnapshotDialog";
import { useScrollPosition } from "../components/hooks/useScrollPosition";
import BackButton from "./components/floating/BackButton";
import DocPill from "./components/DocPill";
import FloatingEditorView from "./[snapshot]/FloatingEditorView";
import HandleInput from "./components/dialog/HandleInput";
import { Conversation } from "../../../liveblocks.config";

export default function MainEditorPage({ session }: { session: Session }) {
  const params = useParams<{ doc: string }>();

  const scrollPosition = useScrollPosition();
  return (
    <>
      <Room docId={params.doc} session={session}>
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
  const handles = useStorage((root) => root.docHandles);

  const setTitle = useMutation(({ storage }, newTitle) => {
    storage.set("docTitle", newTitle);
  }, []);

  const addHandle = useMutation(
    ({ storage }, newHandleId: string, x: number, y: number) => {
      const handles = storage.get("docHandles");
      handles.set(
        newHandleId,
        new LiveObject({
          isPending: false,
          exchanges: new LiveList([
            // initialize first prompt structure
            new LiveObject({ prompt: "", response: "" }),
          ]),
          handleName: "",
          x: x,
          y: y,
        })
      );
    },
    []
  );

  // funny ass name!
  const createHandleHandler = () => {
    const x = 0; // TODO: set these values to be wherever we want to hook the new handle to
    const y = 0;
    const newHandleId = crypto.randomUUID();

    addHandle(newHandleId, x, y);
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
              <DocPill loaded={title !== null} />
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
            field="maindoc"
            loaded={title !== null}
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
        handleCreateSnapshot={createHandleHandler}
      />

      {/* TODO: style and attach handlers inside this component */}
      {handles?.keys().map((handleId: string) => {
        return <HandleInput docId={doc} handleId={handleId} />;
      })}
    </>
  );
}
