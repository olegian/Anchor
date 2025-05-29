import { Transition } from "@headlessui/react";
import AnchorPopup from "./AnchorPopup";
import { ANCHOR_HANDLE_SIZE } from "./constants";
import {
  ArrowPathIcon,
  ArrowsPointingOutIcon,
  MinusIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/16/solid";
import { useEffect, useRef, useState } from "react";
import { getUser } from "@/app/actions";
import { SpansMark } from "./SpansMark";
import { useMutation, useStorage } from "@liveblocks/react";
import { useDebounce } from "./useDebounce";
import { LiveObject, User } from "@liveblocks/client";
import { useSession } from "next-auth/react";
import { Editor } from "@tiptap/react";
import { calculateBlackOrWhiteContrast } from "@/app/lib/utils";
import { ParaSpansNode } from "./ParagraphSpanMark";

export default function AnchorHandle({
  id,
  setDraggingAnchor,
  session,
  presence,
  updatePresense,
  othersPresense,
  docId,
  editor,
}: {
  id: string;
  setDraggingAnchor: (dragging: boolean) => void;
  session: ReturnType<typeof useSession>;
  presence: {
    openHandles: string[];
    id: string;
  };
  updatePresense: (presence: any) => void;
  othersPresense: User<
    {
      openHandles: string[];
      id: string;
    },
    {
      id: string;
      info: {
        color: string;
        [key: string]: any;
      };
    }
  >[];
  docId: string;
  editor: Editor;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showConversation, setShowConversation] = useState(false);

  const openConversation = () => {
    // add this anchor handle to opened handles by user
    updatePresense({ openHandles: [...presence.openHandles, id] });

    // use localCoords.y to determine where to open the actual chat ui
    // use this to display information on others
    const otherUsersViewingConversation = othersPresense
      .filter((userInfo) => userInfo.presence.openHandles.includes(id))
      .map((userInfo) => userInfo.id);
  };

  const closeConversation = () => {
    updatePresense({
      openHandles: (presence.openHandles || []).filter((handleId) => handleId !== id),
    });
    setShowConversation(false);
  };

  const liveHandleInfo = useStorage((root) => root.docHandles.get(id));
  const liveAnchorPoints = useStorage((root) => root.attachPoints);
  if (!liveHandleInfo) return null;

  const setAnchorOwner = useMutation(({ storage }, userId: string) => {
    const handle = storage.get("docHandles").get(id);
    if (userId === "" && handle?.get("owner") === session.data?.user?.id) {
      handle?.set("owner", "");
      return true;
    } else if (userId !== "" && handle?.get("owner") === "") {
      handle?.set("owner", userId);
      return true;
    }
    return false;
  }, []);

  const [localCoords, setLocalCoords] = useState<{ x: number; y: number }>({
    x: liveHandleInfo.x + window.innerWidth / 2,
    y: liveHandleInfo.y,
  });

  const [syncToLive, setSyncToLive] = useState(true);

  // Interpolate position changes to make it smooth remotely
  // THIS SECTION IS LIVE SYNC <--- im sick of losing where this useeffect is -oleg
  useEffect(() => {
    if (dragging || !syncToLive) return; // Only interpolate when NOT dragging locally

    let animationFrame: number | null = null;
    // console.log("a", showConversation);
    // setOpenPopup(false);
    // closeConversation();

    function animate() {
      setLocalCoords((prev) => {
        const targetX = liveHandleInfo!.x + window.innerWidth / 2;
        const targetY = liveHandleInfo!.y;
        // Lerp factor: 0.2 is smooth, 1 is instant
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const newX = Math.abs(prev.x - targetX) < 0.5 ? targetX : lerp(prev.x, targetX, 0.2);
        const newY = Math.abs(prev.y - targetY) < 0.5 ? targetY : lerp(prev.y, targetY, 0.2);
        return { x: newX, y: newY };
      });
      animationFrame = requestAnimationFrame(animate);
    }

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [liveHandleInfo.x, liveHandleInfo.y, dragging]);

  // update live position, debounce to not send 20 billion requests
  const writePos = useMutation(({ storage }, targetX, targetY) => {
    const handle = storage.get("docHandles").get(id);
    handle?.set("x", targetX - window.innerWidth / 2); // offset to center of screen, live coords use center as origin for consistency
    handle?.set("y", targetY);
  }, []);
  const debouncedWritePos = useDebounce(writePos, 20); // TODO: tune out this parameter to make the sync movement feel nice

  const writeInfo = useMutation(({ storage }, paragraphIdx, wordIdx, anchorWidth, anchorHeight) => {
    const handle = storage.get("docHandles").get(id);
    if (paragraphIdx !== undefined) {
      handle?.set("paragraphIdx", paragraphIdx);
    }
    if (wordIdx !== undefined) {
      handle?.set("wordIdx", wordIdx);
    }
    if (anchorHeight !== undefined) {
      handle?.set("height", anchorHeight);
    }
    if (anchorWidth !== undefined) {
      handle?.set("width", anchorWidth);
    }
  }, []);
  const debouncedWriteInfo = useDebounce(writeInfo, 20);

  const deleteAnchor = useMutation(({ storage }) => {
    const anchor = storage.get("docHandles").get(id);
    const attachedSpanId = anchor?.get("attachedSpan");
    if (attachedSpanId) {
      storage.get("attachPoints").delete(attachedSpanId);
    }

    storage.get("docHandles").delete(id);
  }, []);

  const [rotation, setRotation] = useState(0);
  const lastPos = useRef<{ x: number; y: number }>({
    x: localCoords.x,
    y: localCoords.y,
  });
  const animationRef = useRef<number | null>(null);

  const deleteState =
    localCoords.x < 50 || window.innerWidth - 50 - ANCHOR_HANDLE_SIZE < localCoords.x;

  // --- Rotation animation effect ---
  useEffect(() => {
    if (!dragging) return;

    function animateRotation() {
      const dx = localCoords.x - lastPos.current.x;
      const velocity = dx;
      const maxDeg = 30;
      const newRotation = Math.max(-maxDeg, Math.min(maxDeg, velocity * 2));
      setRotation(newRotation);
      lastPos.current = { x: localCoords.x, y: localCoords.y };
      animationRef.current = requestAnimationFrame(animateRotation);
    }

    animationRef.current = requestAnimationFrame(animateRotation);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [dragging, localCoords.x, localCoords.y]);

  const attachAnchor = useMutation(({ storage }, spanId, attachmentType) => {
    if (spanId) {
      storage.get("attachPoints").set(
        spanId,
        new LiveObject({
          anchorId: id,
          type: attachmentType,
        })
      );
      
      storage.get("docHandles").get(id)?.set("attachedSpan", spanId);
    }
  }, []);

  const dettachAnchor = useMutation(({ storage }) => {
    const anchor = storage.get("docHandles").get(id);
    const attachedSpan = anchor?.get("attachedSpan");
    if (attachedSpan) {
      storage.get("attachPoints").delete(attachedSpan);
      anchor?.set("attachedSpan", "");
    }
  }, []);

  useEffect(() => {
    if (dragging) return;
    let raf: number;
    function easeBack() {
      setRotation((r) => {
        if (Math.abs(r) < 0.5) return 0;
        return r * 0.85;
      });
      raf = requestAnimationFrame(easeBack);
    }
    easeBack();
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  useEffect(() => {
    let animationFrame: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;

      let targetX = e.clientX;
      let targetY = e.clientY + window.scrollY;

      // determine and set wordidx + paraidx
      // write new position to live
      setLocalCoords({ x: targetX, y: targetY });
      debouncedWritePos(targetX, targetY + window.scrollY);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (deleteState) {
        // Animate before deleting the anchor
        if (ref.current) {
          ref.current.style.transition = "opacity 0.5s";
          ref.current.style.opacity = "0";
          ref.current.style.pointerEvents = "none";
          setDraggingAnchor(false);
          setTimeout(() => {
            deleteAnchor();
          }, 500);
        }
      } else {
        if (dragging) {
          setDragging(false);
          setTimeout(() => {
            setSyncToLive(true);
          }, 10);
          setDraggingAnchor(false);
          setOpenPopup(false);
          closeConversation();

          // mouse up position
          const targetX = e.clientX;
          const targetY = e.clientY;

          const editorPos = editor.view.posAtCoords({
            left: targetX,
            top: targetY,
          });
          // attempt to find word to snap to
          if (editorPos) {
            // pos is the pos of the nearest cursor position
            // inside is the pos of the containing node
            let { pos, inside } = editorPos;
            pos--; // dont ask, tiptap stupid

            const paragraphContent = editor
              .$pos(pos)
              .content.content.map((node: any) => node.text)
              .join("");
            const idxInParagraph = pos - inside;
            // anchor dropped not on a space
            if (
              paragraphContent[idxInParagraph] !== " " &&
              paragraphContent[idxInParagraph] !== undefined
            ) {
              let start = paragraphContent.lastIndexOf(" ", idxInParagraph);
              // also dont ask me why start doesnt need a fallback on -1. it somehow works out with the off-by-one introduced
              // by the weird indexing that `pos` uses in tiptap.

              let end = paragraphContent.indexOf(" ", idxInParagraph);
              if (end === -1) {
                // no space before end of paragraph, so use the end of the para
                end = paragraphContent.length;
              }

              editor
                .chain()
                .setTextSelection({
                  from: inside + start + 2,
                  to: inside + end + 1,
                })
                .setMark(SpansMark.name, { id: crypto.randomUUID() })
                .run();

              const spanId = editor.getAttributes(SpansMark.name)["id"];
              attachAnchor(spanId, "word");
            }
            setAnchorOwner(""); // release ownership, allow others to grab it
            if (animationFrame) cancelAnimationFrame(animationFrame);
            return;
          } // end word snap

          const paragraphEditorPos = editor.view.posAtCoords({
            left: targetX + 50,
            top: targetY,
          });
          if (paragraphEditorPos) {
            let { pos, inside } = paragraphEditorPos;
            const snappedPara = (editor.$pos(pos) as any).resolvedPos.path[3];
            const end = inside + snappedPara.content.size;

            editor
              .chain()
              .setTextSelection({
                from: inside,
                to: end,
              })
              .wrapIn(ParaSpansNode.name, { id: crypto.randomUUID() })
              .run();

            const spanId = editor.getAttributes(ParaSpansNode.name)["id"];
            attachAnchor(spanId, "paragraph");
          }

          setAnchorOwner(""); // release ownership, allow others to grab it
        } // end if dragging
        if (animationFrame) cancelAnimationFrame(animationFrame);
      }
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [dragging, id, debouncedWritePos, localCoords.x, localCoords.y]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.detail >= 2) {
      // we double clicked the thing, treat the mouse down as not a drag event but an open dialog
      setOpenPopup(true);
      openConversation();
      return;
    }

    if (liveHandleInfo.owner !== "") {
      // someone is already moving the handle, need to disallow concurrent grab and just
      // wait till they release it
      return;
    }

    if (
      session.data &&
      session.data.user &&
      session.data.user.id &&
      !setAnchorOwner(session.data.user.id)
    ) {
      // unable to get ownership of the anchor, someone else is already moving it, even if the position
      // changes are yet to propogate
      return;
    }

    setDragging(true);
    setSyncToLive(false);
    setDraggingAnchor(true);

    // remove old span, if there was a span attached to this anchor
    if (liveHandleInfo.attachedSpan !== "") {
      const spanId = liveHandleInfo.attachedSpan;
      const span = document.getElementById(spanId) as HTMLSpanElement;

      const anchorPoint = liveAnchorPoints?.get(spanId);
      const aType = anchorPoint?.type;
      if (span) {
        const rect = span.getBoundingClientRect();

        const start = editor.view.posAtCoords({
          left: rect.left,
          top: rect.top,
        });
        const end = editor.view.posAtCoords({
          left: rect.right,
          top: rect.top,
        });
        if (start && end) {
          const startPos = start.pos;
          const endPos = end.pos;
          if (aType === "paragraph") {
            editor
              .chain()
              .setTextSelection({ from: startPos, to: endPos })
              .toggleWrap(ParaSpansNode.name)
              .run();
          } else if (aType === "word") {
            editor
              .chain()
              .setTextSelection({ from: startPos, to: endPos })
              .unsetMark(SpansMark.name)
              .run();
          }
        }
        dettachAnchor();
        debouncedWriteInfo(undefined, undefined, 24, 24);
      }
    }
  };

  const owned = liveHandleInfo.owner != "";
  const isOwner = liveHandleInfo.owner === session.data?.user?.id;
  const [ownerData, setOwnerData] = useState<{
    name: string;
    color: string;
  } | null>(null);
  useEffect(() => {
    if (liveHandleInfo.owner) {
      getUser(liveHandleInfo.owner)
        .then((res) => {
          setOwnerData(res);
        })
        .catch((e) => {
          setOwnerData(null);
        });
    }
  }, [liveHandleInfo]);

  const currentAttachedPoint = liveAnchorPoints?.get(liveHandleInfo.attachedSpan);

  const title = `${
    owned && !isOwner
      ? ownerData?.name
      : liveHandleInfo.handleName || deleteState
      ? "Delete?"
      : currentAttachedPoint?.type === "word"
      ? "Word"
      : currentAttachedPoint?.type === "paragraph"
      ? "Paragraph"
      : "Document"
  }`;

  const [openPopup, setOpenPopup] = useState<boolean>(false);
  const showPopup = openPopup && !dragging && !deleteState;

  const icon = deleteState ? (
    <XMarkIcon className="absolute size-3.5 shrink-0 transition-all group-hover:scale-125" />
  ) : liveHandleInfo.isPending ? (
    <ArrowPathIcon className="absolute size-3.5 shrink-0 animate-spin" />
  ) : dragging || owned ? (
    <ArrowsPointingOutIcon className="absolute shrink-0 size-3 transition-all group-hover:scale-125 rotate-45" />
  ) : showPopup ? (
    <MinusIcon className="absolute size-3.5 shrink-0 transition-all group-hover:scale-125" />
  ) : (
    <PlusIcon className="absolute size-3.5 shrink-0 transition-all group-hover:scale-125" />
  );

  const activeOtherUsers =
    othersPresense.length > 0
      ? othersPresense.filter((user) => user.presence.openHandles.includes(id))
      : [];

  return (
    <>
      <div
        ref={ref}
        className="absolute anchor-handle origin-center z-40 transition-transform duration-300"
        style={{
          left: localCoords.x,
          top: localCoords.y,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transition: dragging ? "none" : "transform 0.4s cubic-bezier(.4,2,.6,1)",
        }}
      >
        <div className="flex flex-col items-center justify-center group relative  space-y-2">
          <div className="relative">
            <div
              className={`${
                owned && !isOwner && !deleteState ? "" : deleteState ? "opacity-0" : "opacity-0"
              } flex items-center justify-center group-hover:opacity-100 translate-y-0  space-x-1 transition-all font-semibold transform text-xs`}
            >
              <div
                className={`${
                  owned && !isOwner && !deleteState
                    ? "text-white"
                    : deleteState
                    ? "text-white border-red-600 bg-red-500"
                    : "text-zinc-700 border-zinc-200 bg-white"
                } px-1.5 py-0.5 border shadow-sm origin-center rounded-lg block tracking-tight`}
                style={{
                  borderColor: owned && !isOwner && !deleteState ? ownerData?.color : "",
                  backgroundColor: owned && !isOwner && !deleteState ? ownerData?.color : "",
                  color:
                    owned && !isOwner && !deleteState
                      ? calculateBlackOrWhiteContrast(ownerData?.color ?? "#000000")
                      : "",
                }}
              >
                {liveHandleInfo?.title || title}
                {liveHandleInfo.isPending ? (
                  <ArrowPathIcon className="inline size-3 ml-1 animate-spin" />
                ) : null}
              </div>
            </div>
            <div className="absolute -bottom-3 z-10 left-1/2 -translate-x-1/2 flex items-center justify-center -space-x-0.5 w-full">
              {activeOtherUsers.length > 0
                ? activeOtherUsers.slice(0, 3).map((user) => (
                    <div
                      className="size-2 rounded-full"
                      key={user.id}
                      style={{
                        backgroundColor: user.info.color, // TODO fix error
                      }}
                    />
                  ))
                : null}
            </div>
          </div>
          <div
            className={`${
              owned && !isOwner
                ? "text-white"
                : deleteState
                ? "text-white bg-red-500"
                : liveHandleInfo.isPending
                ? `from-sky-400 to-pink-400 via-violet-400 animate-pulse bg-gradient-to-r ${
                    currentAttachedPoint?.type == "word" ? "blur-[3px]" : "text-white"
                  }`
                : `text-zinc-700 bg-black/10`
            } flex items-center justify-center rounded-lg origin-center transition-all duration-200 ease-in-out cursor-pointer ${
              dragging || owned
                ? "scale-125 opacity-100"
                : "group-hover:scale-125 group-hover:opacity-100"
            }`}
            // TODO: fix bg and icon for paragraph
            style={{
              backgroundColor:
                owned && !isOwner && !deleteState
                  ? ownerData?.color + (currentAttachedPoint?.type === "word" ? "25" : "")
                  : "",
              color:
                owned && !isOwner && !deleteState
                  ? calculateBlackOrWhiteContrast(ownerData?.color ?? "#000000")
                  : "",
              width: `${liveHandleInfo.width ?? ANCHOR_HANDLE_SIZE}px`,
              height: `${liveHandleInfo.height ?? ANCHOR_HANDLE_SIZE}px`,
            }}
            onMouseDown={onMouseDown}
          >
            {currentAttachedPoint?.type === "word" ? null : icon}
          </div>
        </div>
        {/* {openPopup && !deleteState && !dragging ? ( */}
        <Transition show={showPopup} as="div">
          <AnchorPopup
            title={title}
            handleId={id}
            docId={docId}
            liveHandleInfo={liveHandleInfo}
            position={{ x: localCoords.x, y: localCoords.y }}
            isOpen={showPopup}
            close={() => {
              setOpenPopup(false);
              closeConversation();
            }}
            editor={editor}
            presence={presence}
            othersPresense={activeOtherUsers}
          />
        </Transition>
        {/* ) : null} */}
      </div>
    </>
  );
}
