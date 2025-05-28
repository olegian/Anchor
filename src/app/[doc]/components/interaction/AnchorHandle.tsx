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
      info: {};
    }
  >[];
  docId: string;
  editor: Editor;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
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
      openHandles: (presence.openHandles || []).filter(
        (handleId) => handleId !== id
      ),
    });
    setShowConversation(false);
  };

  const liveHandleInfo = useStorage((root) => root.docHandles.get(id));
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

  // Interpolate position changes to make it smooth remotely
  useEffect(() => {
    if (dragging) return; // Only interpolate when NOT dragging locally

    let animationFrame: number | null = null;

    function animate() {
      setLocalCoords((prev) => {
        const targetX = liveHandleInfo!.x + window.innerWidth / 2;
        const targetY = liveHandleInfo!.y;
        // Lerp factor: 0.2 is smooth, 1 is instant
        const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
        const newX =
          Math.abs(prev.x - targetX) < 0.5
            ? targetX
            : lerp(prev.x, targetX, 0.2);
        const newY =
          Math.abs(prev.y - targetY) < 0.5
            ? targetY
            : lerp(prev.y, targetY, 0.2);
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
  const writePos = useMutation(
    (
      { storage },
      targetX,
      targetY,
      paragraphIdx = -1,
      wordIdx = -1,
      width = ANCHOR_HANDLE_SIZE,
      height = ANCHOR_HANDLE_SIZE
    ) => {
      const handle = storage.get("docHandles").get(id);
      handle?.set("x", targetX - window.innerWidth / 2); // offset to center of screen, live coords use center as origin for consistency
      handle?.set("y", targetY);
      handle?.set("paragraphIdx", paragraphIdx);
      handle?.set("wordIdx", wordIdx);
      handle?.set("width", width);
      handle?.set("height", height);
    },
    []
  );
  const debouncedWritePos = useDebounce(writePos, 50); // TODO: tune out this parameter to make the sync movement feel nice

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
    localCoords.x < 50 ||
    window.innerWidth - 50 - ANCHOR_HANDLE_SIZE < localCoords.x;

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

  const attachAnchor = useMutation(({ storage }, spanId) => {
    storage.get("attachPoints").set(
      spanId,
      new LiveObject({
        anchorId: id,
      })
    );

    storage.get("docHandles").get(id)?.set("attachedSpan", spanId);
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

      const mainEditor = document.getElementById("main-editor");
      if (!mainEditor) return;
      const paragraphs = mainEditor.querySelectorAll("p");
      if (!paragraphs) return;

      let targetX = e.clientX;
      let targetY = e.clientY + window.scrollY;

      // console.log(e.clientX, e.clientY);

      const editorLeftEdge = paragraphs[0].getBoundingClientRect().x;
      const editorRightEdge = 752 + editorLeftEdge;

      const anchorOnLeft = targetX < editorLeftEdge;
      const anchorOnRight = targetX > editorRightEdge;
      const anchorInEditor =
        targetX >= editorLeftEdge && targetX <= editorRightEdge;

      // Should we snap to the left side of the editor?
      // if (anchorOnLeft && !anchorOnRight) {
      //   if (editorLeftEdge - targetX < editorLeftEdge / 6) {
      //     // console.log("near left side of the editor"); // we should snap to the left side!
      //   } else {
      //     // console.log("on the left side"); // we are outside the editor!
      //   }
      // } else if (anchorOnRight && !anchorOnLeft) {
      //   if (targetX < editorRightEdge + editorRightEdge / 6) {
      //     // console.log("near right side of the editor"); // we should snap to the right side!
      //   } else {
      //     // console.log("on the right side"); // we are outside the editor!
      //   }
      // } else if (anchorInEditor) {
      //   // console.log("inside the editor"); // we are inside the editor!
      // }

      // determine and set wordidx + paraidx
      let paragraphIdx = -1;
      let wordIdx = -1;
      let anchorWidth = ANCHOR_HANDLE_SIZE;
      let anchorHeight = ANCHOR_HANDLE_SIZE;
      if (
        anchorInEditor ||
        (anchorOnLeft && editorLeftEdge - targetX < editorLeftEdge / 6)
      ) {
        // no need to try to identify if we already know we aren't over the editor
        outer: for (let i = 0; i < paragraphs.length; i++) {
          const paragraph = paragraphs[i];
          const spans = paragraph.getElementsByTagName("span");
          const paraRect = paragraph.getBoundingClientRect();
          if (
            targetX < paraRect.right &&
            targetX > paraRect.left - 120 && // buffer allows for paragraph only selection to the left of it
            targetY > paraRect.top &&
            targetY < paraRect.bottom
          ) {
            paragraphIdx = i;
            if (targetX <= paraRect.left) {
              // hovering in the paragraph zone, no need to search for word
              // paragraph.className =
              //   "border-l-4 border-zinc-300 -ml-2 transition-colors";
              // paragraph.after;

              targetX = paraRect.left - 35;
              targetY = paraRect.top + paraRect.height / 2 - 10;

              if (anchorRef.current) {
                anchorRef.current.style.width = `${ANCHOR_HANDLE_SIZE}px`;
                anchorRef.current.style.height = `${ANCHOR_HANDLE_SIZE}px`;

                anchorWidth = ANCHOR_HANDLE_SIZE;
                anchorHeight = ANCHOR_HANDLE_SIZE;
              }

              break outer;
            } else {
              if (anchorRef.current) {
                anchorRef.current.style.width = `${ANCHOR_HANDLE_SIZE}px`;
                anchorRef.current.style.height = `${ANCHOR_HANDLE_SIZE}px`;

                anchorWidth = ANCHOR_HANDLE_SIZE;
                anchorHeight = ANCHOR_HANDLE_SIZE;
              }
            }

            // hovering in the editor, need to search for word
            for (let j = 0; j < spans.length; j++) {
              const word = spans[j];

              const rect = word.getBoundingClientRect();
              if (
                targetX >= rect.left &&
                targetX <= rect.right &&
                targetY >= rect.top &&
                targetY <= rect.bottom
              ) {
                // we found a word to snap to!
                // Snap target is the center of the span
                wordIdx = j;

                // // Highlight the span
                // word.className =
                //   "bg-blue-500 rounded-lg px-2 py-1 text-white/0 -ml-2 transition-colors";

                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height / 2 - 14;

                if (anchorRef.current) {
                  anchorRef.current.style.width = `${rect.width + 2}px`;
                  anchorRef.current.style.height = `${rect.height + 2}px`;

                  anchorWidth = rect.width + 2;
                  anchorHeight = rect.height + 2;
                }

                break outer;
              } else {
                word.className = "transition-colors text-white/0";

                if (anchorRef.current) {
                  anchorRef.current.style.width = `${ANCHOR_HANDLE_SIZE}px`;
                  anchorRef.current.style.height = `${ANCHOR_HANDLE_SIZE}px`;

                  anchorWidth = ANCHOR_HANDLE_SIZE;
                  anchorHeight = ANCHOR_HANDLE_SIZE;
                }
              }
            }
          }
        }
      }

      // Animate toward the target position
      if (animationFrame) cancelAnimationFrame(animationFrame);
      const animate = () => {
        // console.log("animate ", targetX, targetY);
        setLocalCoords({ x: targetX, y: targetY });
        animationFrame = requestAnimationFrame(animate);
      };

      // write new position to live
      debouncedWritePos(
        targetX,
        targetY,
        paragraphIdx,
        wordIdx,
        anchorWidth,
        anchorHeight
      );
      animate();
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
        // gives time for anchor to settle after local movment
        // before we start syncing from live position

        if (dragging) {
          const targetX = e.clientX;
          const targetY = e.clientY;
          console.log("dropped", targetX, targetY);
          const editorPos = editor.view.posAtCoords({
            left: targetX,
            top: targetY,
          });
          if (editorPos) {
            // pos is the pos of the nearest cursor position
            // inside is the pos of the containing node
            let { pos, inside } = editorPos;
            pos--; // dont ask, tiptap stupid

            const paragraphContent = editor
              .$pos(pos)
              .content.content.map((node: any) => node.text)
              .join("");
            const paragraphIdx = pos - inside;
            // anchor dropped not on a space
            if (paragraphContent[paragraphIdx] !== " ") {
              let start = paragraphContent.lastIndexOf(" ", paragraphIdx);
              // also dont ask me why start doesnt need a fallback on -1. it somehow works out with the off-by-one introduced
              // by the weird indexing that `pos` uses in tiptap.

              let end = paragraphContent.indexOf(" ", paragraphIdx);
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
              attachAnchor(spanId);
            }
          }
        }

        setTimeout(() => {
          setDragging(false);
        }, 100);

        setDraggingAnchor(false);
        setAnchorOwner(""); // release ownership, allow others to grab it
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
  }, [dragging, id, debouncedWritePos, localCoords.x]);

  const onMouseDown = (e: React.MouseEvent) => {
    // TODO: change the open popup handler to be a double click, to remove the double handling of stuff here
    if (!dragging) {
      setOpenPopup((prev) => !prev); // close the popup if we are dragging
    } else {
      setOpenPopup(false); // close the popup if we are dragging
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

    // remove old span, if there was a span attached to this anchor
    if (liveHandleInfo.attachedSpan !== "") {
      const spanId = liveHandleInfo.attachedSpan;
      const span = document.getElementById(spanId) as HTMLSpanElement;
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
          console.log("removing span from ", startPos, endPos);
          editor
            .chain()
            .setTextSelection({ from: startPos, to: endPos })
            .unsetMark(SpansMark.name)
            .run();
        }
        dettachAnchor();
      }
    }

    setDragging(true);
    setDraggingAnchor(true);
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

  const title = `${
    owned && !isOwner
      ? ownerData?.name
      : liveHandleInfo.handleName || deleteState
      ? "Delete?"
      : liveHandleInfo.paragraphIdx >= 0 && liveHandleInfo.wordIdx >= 0
      ? "Word"
      : liveHandleInfo.paragraphIdx >= 0 && liveHandleInfo.wordIdx === -1
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

  return (
    <>
      <div
        ref={ref}
        className="absolute anchor-handle origin-center z-40 transition-transform duration-300"
        style={{
          left: localCoords.x,
          top: localCoords.y,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transition: dragging
            ? "none"
            : "transform 0.4s cubic-bezier(.4,2,.6,1)",
        }}
      >
        <div className="flex flex-col items-center justify-center group relative  space-y-2">
          <div
            className={`${
              owned && !isOwner && !deleteState
                ? ""
                : deleteState
                ? "opacity-0"
                : "opacity-0"
            } flex items-center justify-center group-hover:opacity-100 translate-y-0  space-x-1 transition-all font-semibold transform text-xs`}
          >
            <div
              className={`${
                owned && !isOwner && !deleteState
                  ? "text-white"
                  : deleteState
                  ? "text-white border-red-600 bg-red-500"
                  : "text-zinc-700 border-zinc-200 bg-white"
              } px-1.5 py-0.5 border shadow-sm origin-center rounded-md block`}
              style={{
                borderColor:
                  owned && !isOwner && !deleteState ? ownerData?.color : "",
                backgroundColor:
                  owned && !isOwner && !deleteState ? ownerData?.color : "",
                color:
                  owned && !isOwner && !deleteState
                    ? calculateBlackOrWhiteContrast(
                        ownerData?.color ?? "#000000"
                      )
                    : "",
              }}
            >
              {title}
              {liveHandleInfo.isPending ? (
                <ArrowPathIcon className="inline size-3 ml-1 animate-spin" />
              ) : null}
            </div>
          </div>
          <div
            className={`${
              owned && !isOwner
                ? "text-white"
                : deleteState
                ? "text-white bg-red-500"
                : liveHandleInfo.isPending
                ? "from-sky-400 to-pink-400 via-violet-400 animate-pulse bg-gradient-to-r blur-[3px]"
                : `text-zinc-700 ${
                    liveHandleInfo.paragraphIdx >= 0 &&
                    liveHandleInfo.wordIdx >= 0
                      ? "bg-black/10"
                      : "bg-black/10 backdrop-blur-sm"
                  }`
            } flex items-center justify-center rounded-md origin-center transition-all duration-200 ease-in-out cursor-pointer ${
              dragging || owned
                ? "scale-125 opacity-100"
                : "group-hover:scale-125 group-hover:opacity-100"
            }`}
            style={{
              backgroundColor:
                owned && !isOwner && !deleteState
                  ? ownerData?.color +
                    (liveHandleInfo.paragraphIdx >= 0 &&
                    liveHandleInfo.wordIdx >= 0
                      ? "25"
                      : "")
                  : "",
              color:
                owned && !isOwner && !deleteState
                  ? calculateBlackOrWhiteContrast(ownerData?.color ?? "#000000")
                  : "",
              width: `${liveHandleInfo.width ?? ANCHOR_HANDLE_SIZE}px`,
              height: `${liveHandleInfo.height ?? ANCHOR_HANDLE_SIZE}px`,
            }}
            ref={anchorRef}
            onMouseDown={onMouseDown}
          >
            {liveHandleInfo.paragraphIdx >= 0 && liveHandleInfo.wordIdx >= 0
              ? null
              : icon}
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
            close={() => setOpenPopup(false)}
            editor={editor}
          />
        </Transition>
        {/* ) : null} */}
      </div>
    </>
  );
}
