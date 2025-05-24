import { useEffect, useRef, useState } from "react";
import { HandlesMap } from "../../../../liveblocks.config";
import { useHotkeys } from "react-hotkeys-hook";
import { useMutation, useStorage } from "@liveblocks/react";
import { PlusIcon } from "@heroicons/react/16/solid";
import { useSession } from "next-auth/react";
import { useDebounce } from "./useDebounce";

export function EditorMirrorLayer({ html }: { html: string }) {
  function wrapEveryWordInSpansPreserveHTML(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    function processNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const tokens = text.split(/(\s+)/); // split into words and spaces
        const fragment = document.createDocumentFragment();

        tokens.forEach((token) => {
          if (/\s+/.test(token)) {
            fragment.appendChild(document.createTextNode(token));
          } else {
            const span = document.createElement("span");
            span.textContent = token;
            // span.className = "text-black/25";
            // span.style.background = "red";
            span.className = "text-black/0";
            span.style.whiteSpace = "normal";
            span.style.overflowWrap = "break-word";
            fragment.appendChild(span);
          }
        });

        if (node.parentNode) {
          node.parentNode.replaceChild(fragment, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // recursively process children
        Array.from(node.childNodes).forEach(processNode);
      }
    }

    processNode(doc.body);

    return doc.body.innerHTML;
  }

  return (
    <div
      id="overlay-editor"
      className="absolute max-w-3xl pointer-events-none select-none w-full h-80 mx-auto top-[12.35rem] px-2 prose"
      dangerouslySetInnerHTML={{
        __html: wrapEveryWordInSpansPreserveHTML(
          html.replaceAll("<p></p>", "<p><br /></p>")
        ),
      }}
    />
  );
}

export function AnchorLayer({
  anchorHandles,
  addHandle,
  draggingAnchor,
  setDraggingAnchor,
}: {
  anchorHandles: HandlesMap;
  addHandle: (newHandleId: string, x: number, y: number) => void;
  draggingAnchor: boolean;
  setDraggingAnchor: (dragging: boolean) => void;
}) {
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

  // Handle hotkey "a"
  useHotkeys("a", () => {
    const id = crypto.randomUUID(); // Unique ID for the new anchor
    addHandle(id, mousePos.x - window.innerWidth / 2, mousePos.y);
  });

  return (
    <>
      {anchorHandles?.keys().map((handleId: string) => {
        return (
          <AnchorHandle
            key={handleId}
            id={handleId}
            setDraggingAnchor={setDraggingAnchor}
          />
        );
      })}
    </>
  );
}

function AnchorHandle({
  id,
  setDraggingAnchor,
}: {
  id: string;
  setDraggingAnchor: (dragging: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const session = useSession();

  // refetch info from id, so that this component reloads only when ***this*** anchor handle is affected
  const liveHandleInfo = useStorage((root) => root.docHandles.get(id));
  if (!liveHandleInfo) {
    return null;
  }

  const setAnchorOwner = useMutation(({ storage }, userId: string) => {
    const handle = storage.get("docHandles").get(id);
    if (userId === "" && handle?.get("owner") === session.data?.user?.id) {
      // we previously held the anchor as the owner, and now we want to release it
      handle?.set("owner", "");
      return true;
    } else if (userId !== "" && handle?.get("owner") === "") {
      // we are trying to become the owner, and no one previously held it
      handle?.set("owner", userId);
      return true;
    }

    // ignore all other cases, return unsuccesful attempt
    return false;
  }, []);

  // --- Handle Position Tracking ---
  // local copy of coordinates, for fast access for animations
  const [localCoords, setLocalCoords] = useState<{ x: number; y: number }>({
    x: liveHandleInfo.x + window.innerWidth / 2,
    y: liveHandleInfo.y,
  });

  // syncronize to live position when changed
  useEffect(() => {
    if (!dragging) {
      // we are receiving position changes from someone else's anchor movements
      // so reflect them on our end by updating the local position
      console.log("<<< PULLING:", liveHandleInfo.x, liveHandleInfo.y)
      setLocalCoords({
        x: liveHandleInfo.x + window.innerWidth / 2,
        y: liveHandleInfo.y,
      });
    }
  }, [liveHandleInfo.x, liveHandleInfo.y]);

  useEffect(() => {
    console.log("local coords converted", localCoords.x - window.innerWidth / 2, localCoords.y)
  }, [localCoords.x, localCoords.y])

  // update live position, debounce to not send 20 billion requests
  const writePos = useMutation(({ storage }, targetX, targetY) => {
    const handle = storage.get("docHandles").get(id);
    console.log(">>> PUSHING:", targetX - window.innerWidth / 2, targetY)
    handle?.set("x", targetX - window.innerWidth / 2); // offset to center of screen, live coords use center as origin for consistency
    handle?.set("y", targetY);
  }, []);
  const debouncedWritePos = useDebounce(writePos, 200); // TODO: tune out this parameter to make the sync movement feel nice


  const deleteAnchor = useMutation(({ storage }) => {
    storage.get("docHandles").delete(id);
  }, []);

  const [rotation, setRotation] = useState(0);
  const lastPos = useRef<{ x: number; y: number }>({
    x: localCoords.x,
    y: localCoords.y,
  });
  const animationRef = useRef<number | null>(null);

  // --- Rotation animation effect ---
  useEffect(() => {
    if (!dragging) return;

    function animateRotation() {
      // Calculate velocity
      const dx = localCoords.x - lastPos.current.x;
      const dy = localCoords.y - lastPos.current.y;
      // Use horizontal velocity for rotation (or combine dx/dy for more effect)
      const velocity = dx; // or Math.sqrt(dx*dx + dy*dy)
      // Clamp and scale for effect
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

  // Ease rotation back to zero when not dragging
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

  const [text, setText] = useState("Drag me!");

  useEffect(() => {
    let animationFrame: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;

      const overlayContainer = document.getElementById("overlay-editor");
      if (!overlayContainer) return;
      const paragraphs = overlayContainer.querySelectorAll("p");
      if (!paragraphs) return;

      let targetX = e.clientX;
      let targetY = e.clientY;

      const editorLeftEdge = paragraphs[0].getBoundingClientRect().x;
      const editorRightEdge = 752 + editorLeftEdge;
      // console.log(editorLeftEdge, targetX, editorRightEdge);

      const anchorOnLeft = targetX < editorLeftEdge;
      const anchorOnRight = targetX > editorRightEdge;
      const anchorInEditor =
        targetX >= editorLeftEdge && targetX <= editorRightEdge;

      // Should we snap to the left side of the editor?
      if (anchorOnLeft && !anchorOnRight) {
        if (editorLeftEdge - targetX < editorLeftEdge / 6) {
          // console.log("near left side of the editor"); // we should snap to the left side!
          setText("Paragraph");
        } else {
          // console.log("on the left side"); // we are outside the editor!
          setText("Document");
        }
      } else if (anchorOnRight && !anchorOnLeft) {
        if (targetX < editorRightEdge + editorRightEdge / 6) {
          // console.log("near right side of the editor"); // we should snap to the right side!
          setText("Paragraph");
        } else {
          // console.log("on the right side"); // we are outside the editor!
          setText("Document");
        }
      } else if (anchorInEditor) {
        // console.log("inside the editor"); // we are inside the editor!
        setText("Word");
      }

      // for (let i = 0; i < paragraphs.length; i++) {
      //   const paragraph = paragraphs[i];
      // }

      // let found = false;
      // for (let i = 0; i < paragraphs.length; i++) {
      //   const paragraph = paragraphs[i];
      //   const spans = paragraph.getElementsByTagName("span");
      //   for (let j = 0; j < spans.length; j++) {
      //     const span = spans[j];
      //     const rect = span.getBoundingClientRect();
      //     if (
      //       e.clientX >= rect.left &&
      //       e.clientX <= rect.right &&
      //       e.clientY >= rect.top &&
      //       e.clientY <= rect.bottom
      //     ) {
      //       // Snap target is the center of the span
      //       targetX = rect.left + rect.width / 2;
      //       targetY = rect.top + rect.height / 2;

      //       // Highlight the span
      //       span.className =
      //         "bg-blue-500/10 rounded-lg px-2 py-1 text-white/0 -ml-2 transition-colors";
      //       found = true;
      //     } else {
      //       span.className = "transition-colors";
      //     }
      //   }

      //   // if to the left of the paragraph, highlight the left side
      //   const paraRect = paragraph.getBoundingClientRect();
      //   if (
      //     !found &&
      //     e.clientX < paraRect.left &&
      //     e.clientX > paraRect.left - 120 &&
      //     e.clientY > paraRect.top &&
      //     e.clientY < paraRect.bottom
      //   ) {
      //     // Highlight the left side
      //     paragraph.className =
      //       "border-l-4 border-zinc-300 -ml-2 transition-colors";
      //     paragraph.after;
      //     targetX = paraRect.left - 20;
      //     targetY = paraRect.top + paraRect.height / 2 - 10;
      //   }
      // }

      // Animate toward the target position

      if (animationFrame) cancelAnimationFrame(animationFrame);
      const animate = () => {
        console.log("animate ", targetX, targetY)
        setLocalCoords({ x: targetX, y: targetY });
        animationFrame = requestAnimationFrame(animate);
        // setDraggingAnchor(false);
      };

      // write new position to live
      debouncedWritePos(targetX, targetY);
      animate();

      // setDraggingAnchor(true);
    };

    const onMouseUp = () => {
      if (localCoords.x < 50) {
        // Animate before deleting the anchor
        if (ref.current) {
          ref.current.style.transition = "opacity 0.5s";
          ref.current.style.opacity = "0";
          ref.current.style.pointerEvents = "none";
          setTimeout(() => {
            deleteAnchor();
          }, 500);
        }
      } else {
        setDragging(false);
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
  }, [dragging, id, debouncedWritePos]);

  const onMouseDown = (e: React.MouseEvent) => {
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

    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      // Instead of using `rect.left` and `rect.top` directly,
      // add half the width and height to get the visual center
      offset.current = {
        x: e.clientX - (rect.left + rect.width / 2),
        y: e.clientY - (rect.top + rect.height / 2),
      };
    }
    setDragging(true);
  };

  return (
    <div
      ref={ref}
      className="absolute origin-center z-40 transition-transform duration-300"
      style={{
        left: localCoords.x,
        top: localCoords.y,
        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
        transition: dragging
          ? "none"
          : "transform 0.4s cubic-bezier(.4,2,.6,1)",
      }}
      onMouseDown={onMouseDown}
    >
      <div className="flex flex-col items-center justify-center group relative space-y-2">
        <div
          className={`${
            localCoords.x < 50
              ? "text-white border-red-600 bg-red-500"
              : "text-zinc-700 border-zinc-200 bg-white"
          } select-none opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 font-semibold transform text-xs px-1.5 py-0.5 border shadow-sm origin-center rounded-md`}
        >
          {/* ({x}, {y}) */}
          {localCoords.x < 50 ? "Delete?" : text}
        </div>

        <div className="flex items-center justify-center border bg-white/50 backdrop-blur-sm origin-center border-zinc-200 opacity-50 rounded-full transition-all duration-200 ease-in-out cursor-pointer group-hover:scale-125 group-hover:opacity-100 size-5">
          <PlusIcon
            className={`absolute size-3 text-zinc-500 shrink-0 transition-all group-hover:scale-125 ${
              localCoords.x < 50 ? "rotate-45" : "rotate-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
}
