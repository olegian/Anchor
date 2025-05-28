import { HandlesMap } from "../../../../../liveblocks.config";
import { useHotkeys } from "react-hotkeys-hook";
import { useMyPresence, useOthers } from "@liveblocks/react";
import { useSession } from "next-auth/react";
import { Editor } from "@tiptap/react";
import { ANCHOR_HANDLE_SIZE } from "./constants";
import AnchorHandle from "./AnchorHandle";

export function AnchorLayer({
  anchorHandles,
  addHandle,
  draggingAnchor,
  setDraggingAnchor,
  docId,
  editor,
  mousePos,
}: {
  anchorHandles: HandlesMap;
  addHandle: (
    newHandleId: string,
    x: number,
    y: number,
    width: number,
    height: number
  ) => void;
  draggingAnchor: boolean;
  setDraggingAnchor: (dragging: boolean) => void;
  mousePos: { x: number; y: number };
  docId: string;
  editor: Editor;
}) {
  // Handle hotkey "a"
  useHotkeys("a", () => {
    if (
      mousePos.x < 50 + ANCHOR_HANDLE_SIZE ||
      mousePos.x > window.innerWidth - 50 - ANCHOR_HANDLE_SIZE ||
      mousePos.y < 50 + ANCHOR_HANDLE_SIZE
    ) {
      return;
    }

    const id = crypto.randomUUID(); // Unique ID for the new anchor
    addHandle(
      id,
      mousePos.x - window.innerWidth / 2,
      mousePos.y + window.scrollY,
      ANCHOR_HANDLE_SIZE,
      ANCHOR_HANDLE_SIZE
    );
  });

  const session = useSession();
  const [presence, updatePresense] = useMyPresence();
  const othersPresense = useOthers();

  return (
    <div id="anchor-layer" className="transition-opacity duration-300">
      {anchorHandles?.keys().map((handleId: string) => {
        return (
          <AnchorHandle
            key={handleId}
            id={handleId}
            setDraggingAnchor={setDraggingAnchor}
            session={session}
            presence={presence} // Only pass the state, not the tuple
            updatePresense={updatePresense}
            othersPresense={othersPresense.slice()}
            docId={docId}
            editor={editor}
          />
        );
      })}
    </div>
  );
}
