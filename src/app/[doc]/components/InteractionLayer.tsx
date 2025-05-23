import { useEffect, useRef, useState } from "react";
import { HandlesMap } from "../../../../liveblocks.config";
import { useHotkeys } from "react-hotkeys-hook";
import { useMutation } from "@liveblocks/react";
import { PlusIcon } from "@heroicons/react/16/solid";

export default function InteractionLayer({
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
        const { x, y } = anchorHandles.get(handleId)!;
        return (
          <AnchorHandle
            key={handleId}
            x={x}
            y={y}
            id={handleId}
            setDraggingAnchor={setDraggingAnchor}
          />
        );
      })}
    </>
  );
}

function AnchorHandle({
  x,
  y,
  id,
  setDraggingAnchor,
}: {
  x: number;
  y: number;
  id: string;
  setDraggingAnchor: (dragging: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const writePos = useMutation(({ storage }, targetX, targetY) => {
    const handle = storage.get("docHandles").get(id);
    const x = (handle?.get("x") || targetX) + window.innerWidth / 2;
    const y = handle?.get("y") || targetY;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const newX = lerp(x, targetX, 0.2);
    const newY = lerp(y, targetY, 0.2);

    handle?.set("x", newX - window.innerWidth / 2);
    handle?.set("y", newY);
  }, []);

  const deleteAnchor = useMutation(({ storage }) => {
    storage.get("docHandles").delete(id);
  }, []);

  const updatePos = (x: number, y: number) => {
    let isThrottled = false;
    const throttleUpdate = (...args: any) => {
      if (isThrottled) return;
      isThrottled = true;
      writePos(x, y);
      setTimeout(() => {
        isThrottled = false;
      }, 50);
    };

    throttleUpdate();
  };

  useEffect(() => {
    let animationFrame: number | null = null;

    const smoothMove = (targetX: number, targetY: number) => {
      setDraggingAnchor(true);
      //   setAnchorHandles((prev) => {
      //     const next = new Map(prev);
      //     const current = next.get(id) || { x: targetX, y: targetY };
      //     // Interpolate towards the target
      //     const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
      //     const newX = lerp(current.x, targetX, 0.2);
      //     const newY = lerp(current.y, targetY, 0.2);
      //     next.set(id, { x: newX, y: newY });
      //     return next;
      //   });

      updatePos(targetX, targetY);
      setDraggingAnchor(false);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!dragging) return;

      setDraggingAnchor(true);

      const overlayContainer = document.getElementById("overlay-editor");
      if (!overlayContainer) return;
      const paragraphs = overlayContainer.querySelectorAll("p");
      if (!paragraphs) return;

      let targetX = e.clientX;
      let targetY = e.clientY;

      let found = false;
      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
        const spans = paragraph.getElementsByTagName("span");
        for (let j = 0; j < spans.length; j++) {
          const span = spans[j];
          const rect = span.getBoundingClientRect();
          if (
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom
          ) {
            // Snap target is the center of the span
            targetX = rect.left + rect.width / 2;
            targetY = rect.top + rect.height / 2;

            // Highlight the span
            span.className =
              "bg-blue-500/10 rounded-lg px-2 py-1 text-white/0 -ml-2 transition-colors";
            found = true;
          } else {
            span.className = "transition-colors";
          }
        }

        // if to the left of the paragraph, highlight the left side
        const paraRect = paragraph.getBoundingClientRect();
        if (
          !found &&
          e.clientX < paraRect.left &&
          e.clientX > paraRect.left - 120 &&
          e.clientY > paraRect.top &&
          e.clientY < paraRect.bottom
        ) {
          // Highlight the left side
          paragraph.className =
            "border-l-4 border-zinc-300 -ml-2 transition-colors";
          targetX = paraRect.left - 20;
          targetY = paraRect.top + paraRect.height / 2 - 10;
        }
      }

      // Animate toward the target position
      if (animationFrame) cancelAnimationFrame(animationFrame);
      const animate = () => {
        smoothMove(targetX, targetY);
        animationFrame = requestAnimationFrame(animate);
        setDraggingAnchor(false);
      };
      animate();
    };

    const onMouseUp = () => {
      const leftToAnchor = x + window.innerWidth / 2;
      if (leftToAnchor < 50) {
        // doesnt matter if state isnt cleaned, about to be destroyed but...
        // TODO: animation before it disappears?
        deleteAnchor();
      } else {
        setDragging(false);
        setDraggingAnchor(false);
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
  }, [dragging, id, updatePos]);

  const onMouseDown = (e: React.MouseEvent) => {
    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      // Instead of using `rect.left` and `rect.top` directly,
      // add half the width and height to get the visual center
      const screenCenter = window.innerWidth / 2;
      const leftToHandle = e.clientX - (rect.left + rect.width / 2);
      const handleToCenter = leftToHandle - screenCenter;

      offset.current = {
        x: handleToCenter,
        y: e.clientY - (rect.top + rect.height / 2),
      };
    }
    setDragging(true);
  };

  const leftToAnchor = x + window.innerWidth / 2;
  return (
    <div
      ref={ref}
      className="absolute origin-center z-40"
      style={{
        left: leftToAnchor,
        top: y,
        transform: "translate(-50%, -50%)",
      }}
      onMouseDown={onMouseDown}
    >
      <div className="flex flex-col items-center justify-center group relative space-y-1.5">
        <div className="select-none opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 font-medium transform text-[8px] px-1.5 py-0.5 border border-zinc-200 bg-white shadow-sm origin-center rounded-md text-zinc-500 transition-all duration-200 ease-in-out">
          {/* ({x}, {y}) */}
          {leftToAnchor > 280 && leftToAnchor < 320
            ? "Paragraph"
            : leftToAnchor > 50 && leftToAnchor < 280
            ? "Document"
            : leftToAnchor < 50
            ? "Delete?"
            : "Word"}
        </div>

        <div className="flex items-center justify-center border bg-white/50 backdrop-blur-sm origin-center border-zinc-200 opacity-50 rounded-full transition-all duration-200 ease-in-out cursor-pointer group-hover:scale-125 group-hover:opacity-100 size-5">
          <PlusIcon className="absolute size-3 text-zinc-500 shrink-0 transition-all group-hover:scale-125" />
        </div>
      </div>
    </div>
  );
}
