"use client";

import { Session } from "next-auth";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DocMenu from "./components/DocMenu";
import Editor from "./components/Editor";
import FloatingMenu from "./components/floating/FloatingMenu";
import FloatingNavbar from "./components/floating/FloatingNavbar";
import { Room } from "./Room";

import { LiveList, LiveObject } from "@liveblocks/client";
import { useMutation, useMyPresence, useStorage } from "@liveblocks/react";
import { useScrollPosition } from "../components/hooks/useScrollPosition";
import BackButton from "./components/floating/BackButton";
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
  const [myPresence, updateMyPresence] = useMyPresence();

  const title = useStorage((root) => root.docTitle);
  const setTitle = useMutation(({ storage }, newTitle) => {
    storage.set("docTitle", newTitle);
  }, []);

  const handles = useStorage((root) => root.docHandles);
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
          owner: "",
          handleName: "",
          x: x,
          y: y,
        })
      );
    },
    []
  );

  return (
    <>
      <div className="py-4 px-2 md:py-8 md:px-6 ">
        <div className="max-w-3xl mx-auto py-16 space-y-4">
          <div className="space-y-4 px-2">
            <div className="flex items-center justify-between">
              {title !== null ? (
                <p className="font-semibold text-zinc-500 text-sm">
                  Last updated 2 days ago by Greg Heffley
                </p>
              ) : (
                <div className="relative p-2 py-1 rounded-lg bg-zinc-200 animate-pulse h-5 w-56" />
              )}
              <DocMenu showText={true} />
            </div>
          </div>
          <Editor
            title={title ?? ""}
            setTitle={setTitle}
            open={open}
            loaded={title !== null && handles !== null}
            anchorHandles={handles}
            addHandle={addHandle}
          />
        </div>
      </div>
    </>
  );
}
