"use client";

import { Session } from "next-auth";
import { useParams, useRouter } from "next/navigation";
import DocMenu from "./components/DocMenu";
import Editor from "./components/Editor";
import FloatingMenu from "./components/floating/FloatingMenu";
import FloatingNavbar from "./components/floating/FloatingNavbar";
import { Room } from "./Room";

import { LiveList, LiveObject } from "@liveblocks/client";
import { useMutation, useMyPresence, useStorage } from "@liveblocks/react";
import { useScrollPosition } from "../components/hooks/useScrollPosition";
import BackButton from "./components/floating/BackButton";
import { useEffect, useRef, useState } from "react";
import { ANCHOR_HANDLE_SIZE } from "./components/interaction/constants";
import { getRoom, getRoomStorage } from "../actions";
import { RoomData } from "@liveblocks/node";

export default function MainEditorPage({ session }: { session: Session }) {
  const params = useParams<{ doc: string }>();

  const scrollPosition = useScrollPosition();

  return (
    <>
      <Room docId={params.doc} session={session}>
        <BackButton />
        <EditingInterface docId={params.doc} />
        <FloatingMenu docId={params.doc} />
        <FloatingNavbar scrollPosition={scrollPosition} />
      </Room>
    </>
  );
}

function EditingInterface({ docId }: { docId: string }) {
  const title = useStorage((root) => root.docTitle);
  const setTitle = useMutation(({ storage }, newTitle) => {
    storage.set("docTitle", newTitle);
  }, []);

  const handles = useStorage((root) => root.docHandles);
  const addHandle = useMutation(
    (
      { storage },
      newHandleId: string,
      x: number,
      y: number,
      width: number,
      height: number
    ) => {
      const handles = storage.get("docHandles");
      handles.set(
        newHandleId,
        new LiveObject({
          isPending: false,
          exchanges: new LiveList([
            new LiveObject({ prompt: "", response: "" }),
          ]),
          owner: "",
          wordIdx: -1,
          paragraphIdx: -1,
          handleName: "",
          x: x,
          y: y,
          width: width,
          height: height,
          attachedSpan: "",
          title: "",
        })
      );
    },
    []
  );

  // Add state to store editor instance
  const [editorInstance, setEditorInstance] = useState<any>(null);

  // Ref for the white border element
  const borderRef = useRef<HTMLDivElement>(null);

  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const [draggingAnchor, setDraggingAnchor] = useState(false);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (draggingAnchor) {
        return;
      }

      if (
        document.getElementById("delete-doc-dialog") ||
        document.getElementById("share-doc-dialog")
      ) {
        return;
      }

      if (
        borderRef.current &&
        !borderRef.current.contains(event.target as Node)
      ) {
        if (
          mousePos.x < 50 + ANCHOR_HANDLE_SIZE ||
          mousePos.x > window.innerWidth - 50 - ANCHOR_HANDLE_SIZE ||
          mousePos.y + window.scrollY < 200 + ANCHOR_HANDLE_SIZE
        ) {
          return;
        }

        const potentialX = mousePos.x - window.innerWidth / 2;
        const potentialY = mousePos.y + window.scrollY;

        const existsNearby = handles
          ? Array.from(handles.values()).some(
              (handle) =>
                Math.abs(handle.x - potentialX) < ANCHOR_HANDLE_SIZE &&
                Math.abs(handle.y - potentialY) < ANCHOR_HANDLE_SIZE
            )
          : false;

        if (existsNearby) {
          return;
        }

        const id = crypto.randomUUID();
        addHandle(
          id,
          potentialX,
          potentialY,
          ANCHOR_HANDLE_SIZE,
          ANCHOR_HANDLE_SIZE
        );
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [addHandle, mousePos, borderRef, handles, draggingAnchor]);

  const [roomInfo, setRoomInfo] = useState<RoomData | null>(null);
  useEffect(() => {
    if (docId && !roomInfo) {
      getRoom(docId)
        .then((room) => {
          setRoomInfo(room);
        })
        .catch((error) => {
          console.error("Error fetching room info:", error);
        });
    }
  }, [docId]);

  return (
    <>
      <div className="pt-4 px-2 md:pt-16 md:px-6 select-none">
        <div
          ref={borderRef}
          className="border-x border-t bg-white border-zinc-100 mx-auto max-w-4xl overflow-x-hidden shadow-lg"
        >
          <div className="max-w-3xl mx-auto py-16 space-y-4">
            <div className="space-y-4 px-2">
              <div className="flex items-center justify-between">
                {roomInfo !== null ? (
                  <p className="font-semibold text-zinc-500 text-sm">
                    Last updated{" "}
                    {roomInfo.lastConnectionAt
                      ? (() => {
                          const diffMs =
                            Date.now() -
                            new Date(roomInfo.lastConnectionAt).getTime();
                          const diffMins = Math.round(diffMs / 60000);
                          const diffHours = Math.round(diffMs / 3600000);
                          const diffDays = Math.round(diffMs / 86400000);

                          if (diffMins < 60) {
                            return new Intl.RelativeTimeFormat("en", {
                              numeric: "auto",
                            }).format(-diffMins, "minute");
                          } else if (diffHours < 24) {
                            return new Intl.RelativeTimeFormat("en", {
                              numeric: "auto",
                            }).format(-diffHours, "hour");
                          } else {
                            return new Intl.RelativeTimeFormat("en", {
                              numeric: "auto",
                            }).format(-diffDays, "day");
                          }
                        })()
                      : "just now"}
                  </p>
                ) : (
                  <div className="relative p-2 py-1 rounded-lg bg-zinc-200 animate-pulse h-5 w-56" />
                )}
                <DocMenu
                  showText={true}
                  editor={editorInstance}
                  title={title || "Untitled Document"}
                />
              </div>
            </div>
            <Editor
              title={title ?? ""}
              setTitle={setTitle}
              open={open}
              loaded={title !== null && handles !== null}
              anchorHandles={handles}
              addHandle={addHandle}
              mousePos={mousePos}
              draggingAnchor={draggingAnchor}
              setDraggingAnchor={setDraggingAnchor}
              docId={docId}
              onEditorReady={setEditorInstance} // Add this prop
            />
          </div>
        </div>
      </div>
    </>
  );
}
