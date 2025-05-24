// import { useEffect, useRef, useState } from "react";
// import { HandlesMap } from "../../../../liveblocks.config";
// import { useHotkeys } from "react-hotkeys-hook";
// import {
//   useMutation,
//   useMyPresence,
//   useOthers,
//   useStorage,
// } from "@liveblocks/react";
// import { PlusIcon } from "@heroicons/react/16/solid";
// import { useSession } from "next-auth/react";
// import { useDebounce } from "./useDebounce";

// export function EditorMirrorLayer({ html }: { html: string }) {
//   function wrapEveryWordInSpansPreserveHTML(html: string) {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, "text/html");

//     function processNode(node: Node) {
//       if (node.nodeType === Node.TEXT_NODE) {
//         const text = node.textContent || "";
//         const tokens = text.split(/(\s+)/); // split into words and spaces
//         const fragment = document.createDocumentFragment();

//         tokens.forEach((token) => {
//           if (/\s+/.test(token)) {
//             fragment.appendChild(document.createTextNode(token));
//           } else {
//             const span = document.createElement("span");
//             span.textContent = token;
//             // span.className = "text-black/25";
//             // span.style.background = "red";
//             span.className = "text-black/0";
//             span.style.whiteSpace = "normal";
//             span.style.overflowWrap = "break-word";
//             fragment.appendChild(span);
//           }
//         });

//         if (node.parentNode) {
//           node.parentNode.replaceChild(fragment, node);
//         }
//       } else if (node.nodeType === Node.ELEMENT_NODE) {
//         // recursively process children
//         Array.from(node.childNodes).forEach(processNode);
//       }
//     }

//     processNode(doc.body);

//     return doc.body.innerHTML;
//   }

//   return (
//     <div
//       id="overlay-editor"
//       className="absolute max-w-3xl pointer-events-none select-none w-full h-80 mx-auto top-[12.35rem] px-2 prose"
//       dangerouslySetInnerHTML={{
//         __html: wrapEveryWordInSpansPreserveHTML(
//           html.replaceAll("<p></p>", "<p><br /></p>")
//         ),
//       }}
//     />
//   );
// }

// export function AnchorLayer({
//   anchorHandles,
//   addHandle,
//   draggingAnchor,
//   setDraggingAnchor,
// }: {
//   anchorHandles: HandlesMap;
//   addHandle: (newHandleId: string, x: number, y: number) => void;
//   draggingAnchor: boolean;
//   setDraggingAnchor: (dragging: boolean) => void;
// }) {
//   const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
//     x: 0,
//     y: 0,
//   });

//   // Track mouse position
//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       setMousePos({ x: e.clientX, y: e.clientY });
//     };
//     window.addEventListener("mousemove", handleMouseMove);
//     return () => window.removeEventListener("mousemove", handleMouseMove);
//   }, []);

//   // Handle hotkey "a"
//   useHotkeys("a", () => {
//     const id = crypto.randomUUID(); // Unique ID for the new anchor
//     addHandle(id, mousePos.x - window.innerWidth / 2, mousePos.y);
//   });

//   return (
//     <>
//       {anchorHandles?.keys().map((handleId: string) => {
//         return (
//           <AnchorHandle
//             key={handleId}
//             id={handleId}
//             setDraggingAnchor={setDraggingAnchor}
//           />
//         );
//       })}
//     </>
//   );
// }

// function AnchorHandle({
//   id,
//   setDraggingAnchor,
// }: {
//   id: string;
//   setDraggingAnchor: (dragging: boolean) => void;
// }) {
//   const ref = useRef<HTMLDivElement>(null);
//   const [dragging, setDragging] = useState(false);
//   const offset = useRef({ x: 0, y: 0 });
//   const session = useSession();
//   const [presence, updatePresense] = useMyPresence();
//   const othersPresense = useOthers();


//   // TODO: make a conversation UI
//   // below are helpers for managing presense for these things
//   // you can also use liveHandleInfo.get("owner") if you want to show
//   // who is currently *dragging* a given handle
//   const openConversation = () => {
//     // add this anchor handle to opened handles by user
//     updatePresense({ openHandles: [...presence.openHandles, id] });

//     // use localCoords.y to determine where to open the actual chat ui
//     // use this to display information on others
//     const otherUsersViewingConversation = othersPresense
//       .filter((userInfo) => userInfo.presence.openHandles.includes(id))
//       .map((userInfo) => {
//         userInfo.id;
//       });
//   };

//   const closeConversation = () => {
//     updatePresense({
//       // on first glance this feels inefficient but also you would need to find the
//       // id in the list anyways to call .pop, so reconstructing via a filter is equally ok
//       openHandles: presence.openHandles.filter((handleId) => handleId !== id),
//     });
//   };

//   // refetch info from id, so that this component reloads only when ***this*** anchor handle is affected
//   const liveHandleInfo = useStorage((root) => root.docHandles.get(id));
//   if (!liveHandleInfo) {
//     return null;
//   }

//   const setAnchorOwner = useMutation(({ storage }, userId: string) => {
//     const handle = storage.get("docHandles").get(id);
//     if (userId === "" && handle?.get("owner") === session.data?.user?.id) {
//       // we previously held the anchor as the owner, and now we want to release it
//       handle?.set("owner", "");
//       return true;
//     } else if (userId !== "" && handle?.get("owner") === "") {
//       // we are trying to become the owner, and no one previously held it
//       handle?.set("owner", userId);
//       return true;
//     }

//     // ignore all other cases, return unsuccesful attempt
//     return false;
//   }, []);

//   // --- Handle Position Tracking ---
//   // local copy of coordinates, for fast access for animations
//   const [localCoords, setLocalCoords] = useState<{ x: number; y: number }>({
//     x: liveHandleInfo.x + window.innerWidth / 2,
//     y: liveHandleInfo.y,
//   });

//   // syncronize to live position when changed
//   useEffect(() => {
//     if (!dragging) {
//       // we are receiving position changes from someone else's anchor movements
//       // so reflect them on our end by updating the local position
//       console.log("<<< PULLING:", liveHandleInfo.x, liveHandleInfo.y);
//       setLocalCoords({
//         x: liveHandleInfo.x + window.innerWidth / 2,
//         y: liveHandleInfo.y,
//       });
//     }
//   }, [liveHandleInfo.x, liveHandleInfo.y]);

//   useEffect(() => {
//     console.log(
//       "local coords converted",
//       localCoords.x - window.innerWidth / 2,
//       localCoords.y
//     );
//   }, [localCoords.x, localCoords.y]);

//   // update live position, debounce to not send 20 billion requests
//   const writePos = useMutation(({ storage }, targetX, targetY) => {
//     const handle = storage.get("docHandles").get(id);
//     console.log(">>> PUSHING:", targetX - window.innerWidth / 2, targetY);
//     handle?.set("x", targetX - window.innerWidth / 2); // offset to center of screen, live coords use center as origin for consistency
//     handle?.set("y", targetY);
//   }, []);
//   const debouncedWritePos = useDebounce(writePos, 20); // TODO: tune out this parameter to make the sync movement feel nice

//   const deleteAnchor = useMutation(({ storage }) => {
//     storage.get("docHandles").delete(id);
//   }, []);

//   const [rotation, setRotation] = useState(0);
//   const lastPos = useRef<{ x: number; y: number }>({
//     x: localCoords.x,
//     y: localCoords.y,
//   });
//   const animationRef = useRef<number | null>(null);

//   // --- Rotation animation effect ---
//   useEffect(() => {
//     if (!dragging) return;

//     function animateRotation() {
//       // Calculate velocity
//       const dx = localCoords.x - lastPos.current.x;
//       const dy = localCoords.y - lastPos.current.y;
//       // Use horizontal velocity for rotation (or combine dx/dy for more effect)
//       const velocity = dx; // or Math.sqrt(dx*dx + dy*dy)
//       // Clamp and scale for effect
//       const maxDeg = 30;
//       const newRotation = Math.max(-maxDeg, Math.min(maxDeg, velocity * 2));
//       setRotation(newRotation);

//       lastPos.current = { x: localCoords.x, y: localCoords.y };

//       animationRef.current = requestAnimationFrame(animateRotation);
//     }

//     animationRef.current = requestAnimationFrame(animateRotation);

//     return () => {
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//     };
//   }, [dragging, localCoords.x, localCoords.y]);

//   // Ease rotation back to zero when not dragging
//   useEffect(() => {
//     if (dragging) return;
//     let raf: number;
//     function easeBack() {
//       setRotation((r) => {
//         if (Math.abs(r) < 0.5) return 0;
//         return r * 0.85;
//       });
//       raf = requestAnimationFrame(easeBack);
//     }
//     easeBack();
//     return () => cancelAnimationFrame(raf);
//   }, [dragging]);

//   const [text, setText] = useState("Drag me!");

//   useEffect(() => {
//     let animationFrame: number | null = null;

//     const onMouseMove = (e: MouseEvent) => {
//       if (!dragging) return;

//       const overlayContainer = document.getElementById("overlay-editor");
//       if (!overlayContainer) return;
//       const paragraphs = overlayContainer.querySelectorAll("p");
//       if (!paragraphs) return;

//       let targetX = e.clientX;
//       let targetY = e.clientY;

//       const editorLeftEdge = paragraphs[0].getBoundingClientRect().x;
//       const editorRightEdge = 752 + editorLeftEdge;
//       // console.log(editorLeftEdge, targetX, editorRightEdge);

//       const anchorOnLeft = targetX < editorLeftEdge;
//       const anchorOnRight = targetX > editorRightEdge;
//       const anchorInEditor =
//         targetX >= editorLeftEdge && targetX <= editorRightEdge;

//       // Should we snap to the left side of the editor?
//       if (anchorOnLeft && !anchorOnRight) {
//         if (editorLeftEdge - targetX < editorLeftEdge / 6) {
//           // console.log("near left side of the editor"); // we should snap to the left side!
//           setText("Paragraph");
//         } else {
//           // console.log("on the left side"); // we are outside the editor!
//           setText("Document");
//         }
//       } else if (anchorOnRight && !anchorOnLeft) {
//         if (targetX < editorRightEdge + editorRightEdge / 6) {
//           // console.log("near right side of the editor"); // we should snap to the right side!
//           setText("Paragraph");
//         } else {
//           // console.log("on the right side"); // we are outside the editor!
//           setText("Document");
//         }
//       } else if (anchorInEditor) {
//         // console.log("inside the editor"); // we are inside the editor!
//         setText("Word");
//       }

//       // for (let i = 0; i < paragraphs.length; i++) {
//       //   const paragraph = paragraphs[i];
//       // }

//       // let found = false;
//       // for (let i = 0; i < paragraphs.length; i++) {
//       //   const paragraph = paragraphs[i];
//       //   const spans = paragraph.getElementsByTagName("span");
//       //   for (let j = 0; j < spans.length; j++) {
//       //     const span = spans[j];
//       //     const rect = span.getBoundingClientRect();
//       //     if (
//       //       e.clientX >= rect.left &&
//       //       e.clientX <= rect.right &&
//       //       e.clientY >= rect.top &&
//       //       e.clientY <= rect.bottom
//       //     ) {
//       //       // Snap target is the center of the span
//       //       targetX = rect.left + rect.width / 2;
//       //       targetY = rect.top + rect.height / 2;

//       //       // Highlight the span
//       //       span.className =
//       //         "bg-blue-500/10 rounded-lg px-2 py-1 text-white/0 -ml-2 transition-colors";
//       //       found = true;
//       //     } else {
//       //       span.className = "transition-colors";
//       //     }
//       //   }

//       //   // if to the left of the paragraph, highlight the left side
//       //   const paraRect = paragraph.getBoundingClientRect();
//       //   if (
//       //     !found &&
//       //     e.clientX < paraRect.left &&
//       //     e.clientX > paraRect.left - 120 &&
//       //     e.clientY > paraRect.top &&
//       //     e.clientY < paraRect.bottom
//       //   ) {
//       //     // Highlight the left side
//       //     paragraph.className =
//       //       "border-l-4 border-zinc-300 -ml-2 transition-colors";
//       //     paragraph.after;
//       //     targetX = paraRect.left - 20;
//       //     targetY = paraRect.top + paraRect.height / 2 - 10;
//       //   }
//       // }

//       // Animate toward the target position

//       if (animationFrame) cancelAnimationFrame(animationFrame);
//       const animate = () => {
//         console.log("animate ", targetX, targetY);
//         setLocalCoords({ x: targetX, y: targetY });
//         animationFrame = requestAnimationFrame(animate);
//         // setDraggingAnchor(false);
//       };

//       // write new position to live
//       debouncedWritePos(targetX, targetY);
//       animate();

//       // setDraggingAnchor(true);
//     };

//     const onMouseUp = () => {
//       if (localCoords.x < 50) {
//         // Animate before deleting the anchor
//         if (ref.current) {
//           ref.current.style.transition = "opacity 0.5s";
//           ref.current.style.opacity = "0";
//           ref.current.style.pointerEvents = "none";
//           setTimeout(() => {
//             deleteAnchor();
//           }, 500);
//         }
//       } else {
//         setDragging(false);
//         setDraggingAnchor(false);
//         setAnchorOwner(""); // release ownership, allow others to grab it
//         if (animationFrame) cancelAnimationFrame(animationFrame);
//       }
//     };

//     window.addEventListener("mousemove", onMouseMove);
//     window.addEventListener("mouseup", onMouseUp);
//     return () => {
//       window.removeEventListener("mousemove", onMouseMove);
//       window.removeEventListener("mouseup", onMouseUp);
//       if (animationFrame) cancelAnimationFrame(animationFrame);
//     };
//   }, [dragging, id, debouncedWritePos]);

//   const onMouseDown = (e: React.MouseEvent) => {
//     if (liveHandleInfo.owner !== "") {
//       // someone is already moving the handle, need to disallow concurrent grab and just
//       // wait till they release it
//       return;
//     }

//     if (
//       session.data &&
//       session.data.user &&
//       session.data.user.id &&
//       !setAnchorOwner(session.data.user.id)
//     ) {
//       // unable to get ownership of the anchor, someone else is already moving it, even if the position
//       // changes are yet to propogate
//       return;
//     }

//     const rect = ref.current?.getBoundingClientRect();
//     if (rect) {
//       // Instead of using `rect.left` and `rect.top` directly,
//       // add half the width and height to get the visual center
//       offset.current = {
//         x: e.clientX - (rect.left + rect.width / 2),
//         y: e.clientY - (rect.top + rect.height / 2),
//       };
//     }
//     setDragging(true);
//   };

//   return (
//     <div
//       ref={ref}
//       className="absolute origin-center z-40 transition-transform duration-300"
//       style={{
//         left: localCoords.x,
//         top: localCoords.y,
//         transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
//         transition: dragging
//           ? "none"
//           : "transform 0.4s cubic-bezier(.4,2,.6,1)",
//       }}
//       onMouseDown={onMouseDown}
//     >
//       <div className="flex flex-col items-center justify-center group relative space-y-2">
//         <div
//           className={`${
//             localCoords.x < 50
//               ? "text-white border-red-600 bg-red-500"
//               : "text-zinc-700 border-zinc-200 bg-white"
//           } select-none opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 font-semibold transform text-xs px-1.5 py-0.5 border shadow-sm origin-center rounded-md`}
//         >
//           {/* ({x}, {y}) */}
//           {localCoords.x < 50 ? "Delete?" : text}
//         </div>

//         <div className="flex items-center justify-center border bg-white/50 backdrop-blur-sm origin-center border-zinc-200 opacity-50 rounded-full transition-all duration-200 ease-in-out cursor-pointer group-hover:scale-125 group-hover:opacity-100 size-5">
//           <PlusIcon
//             className={`absolute size-3 text-zinc-500 shrink-0 transition-all group-hover:scale-125 ${
//               localCoords.x < 50 ? "rotate-45" : "rotate-0"
//             }`}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }








import { useEffect, useRef, useState } from "react";
import { HandlesMap } from "../../../../liveblocks.config";
import { useHotkeys } from "react-hotkeys-hook";
import {
  useMutation,
  useMyPresence,
  useOthers,
  useStorage,
} from "@liveblocks/react";
import { PlusIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { useSession } from "next-auth/react";
import { useDebounce } from "./useDebounce";
import { prompt, createExchange } from "../../actions";

export function EditorMirrorLayer({ html }: { html: string }) {
  function wrapEveryWordInSpansPreserveHTML(html: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    function processNode(node: Node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || "";
        const tokens = text.split(/(\s+)/);
        const fragment = document.createDocumentFragment();

        tokens.forEach((token) => {
          if (/\s+/.test(token)) {
            fragment.appendChild(document.createTextNode(token));
          } else {
            const span = document.createElement("span");
            span.textContent = token;
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
  docId,
}: {
  anchorHandles: HandlesMap;
  addHandle: (newHandleId: string, x: number, y: number) => void;
  draggingAnchor: boolean;
  setDraggingAnchor: (dragging: boolean) => void;
  docId: string;
}) {
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useHotkeys("a", () => {
    const id = crypto.randomUUID();
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
            docId={docId}
          />
        );
      })}
    </>
  );
}

// Conversation UI Component
function ConversationUI({
  handleId,
  docId,
  onClose,
  position,
}: {
  handleId: string;
  docId: string;
  onClose: () => void;
  position: { x: number; y: number };
}) {
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const liveHandleInfo = useStorage((root) => root.docHandles.get(handleId));
  const exchanges = liveHandleInfo?.exchanges || [];
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [exchanges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const promptText = inputValue.trim();
    setInputValue("");
    setIsLoading(true);

    try {
      // Create new exchange
      await createExchange(docId, handleId, promptText);
      
      // Send prompt to LLM
      await prompt(docId, handleId);
    } catch (error) {
      console.error("Error sending prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md w-80"
      style={{
        left: Math.min(position.x, window.innerWidth - 320),
        top: Math.min(position.y, window.innerHeight - 400),
        maxHeight: "400px",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="font-semibold text-sm">AI Assistant</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="h-64 overflow-y-auto p-3 space-y-3">
        {exchanges.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            Start a conversation with the AI assistant
          </div>
        ) : (
          exchanges.map((exchange: any, index: number) => (
            <div key={index} className="space-y-2">
              <div className="bg-blue-50 p-2 rounded-lg">
                <div className="text-xs text-blue-600 font-medium mb-1">You</div>
                <div className="text-sm">{exchange.prompt}</div>
              </div>
              {exchange.response && (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium mb-1">AI</div>
                  <div className="text-sm whitespace-pre-wrap">{exchange.response}</div>
                </div>
              )}
              {!exchange.response && isLoading && index === exchanges.length - 1 && (
                <div className="bg-gray-50 p-2 rounded-lg">
                  <div className="text-xs text-gray-600 font-medium mb-1">AI</div>
                  <div className="text-sm text-gray-500">Thinking...</div>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask the AI about this content..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function AnchorHandle({
  id,
  setDraggingAnchor,
  docId,
}: {
  id: string;
  setDraggingAnchor: (dragging: boolean) => void;
  docId: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [showConversation, setShowConversation] = useState(false);
  const offset = useRef({ x: 0, y: 0 });
  const session = useSession();
  const [presence, updatePresense] = useMyPresence();
  const othersPresense = useOthers();

  const openConversation = () => {
    updatePresense({ openHandles: [...(presence.openHandles || []), id] });
    setShowConversation(true);
  };

  const closeConversation = () => {
    updatePresense({
      openHandles: (presence.openHandles || []).filter((handleId) => handleId !== id),
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

  useEffect(() => {
    if (!dragging) {
      setLocalCoords({
        x: liveHandleInfo.x + window.innerWidth / 2,
        y: liveHandleInfo.y,
      });
    }
  }, [liveHandleInfo.x, liveHandleInfo.y, dragging]);

  const writePos = useMutation(({ storage }, targetX, targetY) => {
    const handle = storage.get("docHandles").get(id);
    handle?.set("x", targetX - window.innerWidth / 2);
    handle?.set("y", targetY);
  }, []);
  const debouncedWritePos = useDebounce(writePos, 20);

  const deleteAnchor = useMutation(({ storage }) => {
    storage.get("docHandles").delete(id);
  }, []);

  const [rotation, setRotation] = useState(0);
  const lastPos = useRef<{ x: number; y: number }>({
    x: localCoords.x,
    y: localCoords.y,
  });
  const animationRef = useRef<number | null>(null);

  // Determine context type based on position
  const getContextType = (): "word" | "paragraph" | "document" => {
    const overlayContainer = document.getElementById("overlay-editor");
    if (!overlayContainer) return "document";
    
    const paragraphs = overlayContainer.querySelectorAll("p");
    if (!paragraphs.length) return "document";

    const editorLeftEdge = paragraphs[0].getBoundingClientRect().x;
    const editorRightEdge = 752 + editorLeftEdge;

    const anchorOnLeft = localCoords.x < editorLeftEdge;
    const anchorOnRight = localCoords.x > editorRightEdge;
    const anchorInEditor = localCoords.x >= editorLeftEdge && localCoords.x <= editorRightEdge;

    if (anchorInEditor) return "word";
    if ((anchorOnLeft && editorLeftEdge - localCoords.x < editorLeftEdge / 6) ||
        (anchorOnRight && localCoords.x < editorRightEdge + editorRightEdge / 6)) {
      return "paragraph";
    }
    return "document";
  };

  const [text, setText] = useState("Drag me!");
  const contextType = getContextType();

  useEffect(() => {
    const contextLabels = {
      word: "Word",
      paragraph: "Paragraph", 
      document: "Document"
    };
    setText(contextLabels[contextType]);
  }, [contextType, localCoords.x]);

  // Rotation animation and drag handling
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

      const overlayContainer = document.getElementById("overlay-editor");
      if (!overlayContainer) return;
      const paragraphs = overlayContainer.querySelectorAll("p");
      if (!paragraphs) return;

      let targetX = e.clientX;
      let targetY = e.clientY;

      const editorLeftEdge = paragraphs[0].getBoundingClientRect().x;
      const editorRightEdge = 752 + editorLeftEdge;

      const anchorOnLeft = targetX < editorLeftEdge;
      const anchorOnRight = targetX > editorRightEdge;
      const anchorInEditor = targetX >= editorLeftEdge && targetX <= editorRightEdge;

      // Update text based on position
      if (anchorOnLeft && !anchorOnRight) {
        if (editorLeftEdge - targetX < editorLeftEdge / 6) {
          setText("Paragraph");
        } else {
          setText("Document");
        }
      } else if (anchorOnRight && !anchorOnLeft) {
        if (targetX < editorRightEdge + editorRightEdge / 6) {
          setText("Paragraph");
        } else {
          setText("Document");
        }
      } else if (anchorInEditor) {
        setText("Word");
      }

      if (animationFrame) cancelAnimationFrame(animationFrame);
      const animate = () => {
        setLocalCoords({ x: targetX, y: targetY });
        animationFrame = requestAnimationFrame(animate);
      };

      debouncedWritePos(targetX, targetY);
      animate();
    };

    const onMouseUp = () => {
      if (localCoords.x < 50) {
        if (ref.current) {
          ref.current.style.transition = "opacity 0.5s";
          ref.current.style.opacity = "0";
          ref.current.style.pointerEvents = "none";
          setTimeout(() => deleteAnchor(), 500);
        }
      } else {
        setDragging(false);
        setDraggingAnchor(false);
        setAnchorOwner("");
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
    if (liveHandleInfo.owner !== "") return;
    
    if (session.data?.user?.id && !setAnchorOwner(session.data.user.id)) {
      return;
    }

    const rect = ref.current?.getBoundingClientRect();
    if (rect) {
      offset.current = {
        x: e.clientX - (rect.left + rect.width / 2),
        y: e.clientY - (rect.top + rect.height / 2),
      };
    }
    setDragging(true);
  };

  const handleDoubleClick = () => {
    if (!dragging) {
      openConversation();
    }
  };

  return (
    <>
      <div
        ref={ref}
        className="absolute origin-center z-40 transition-transform duration-300"
        style={{
          left: localCoords.x,
          top: localCoords.y,
          transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
          transition: dragging ? "none" : "transform 0.4s cubic-bezier(.4,2,.6,1)",
        }}
        onMouseDown={onMouseDown}
        onDoubleClick={handleDoubleClick}
      >
        <div className="flex flex-col items-center justify-center group relative space-y-2">
          <div
            className={`${
              localCoords.x < 50
                ? "text-white border-red-600 bg-red-500"
                : "text-zinc-700 border-zinc-200 bg-white"
            } select-none opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 font-semibold transform text-xs px-1.5 py-0.5 border shadow-sm origin-center rounded-md`}
          >
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

      {/* Conversation UI */}
      {showConversation && (
        <ConversationUI
          handleId={id}
          docId={docId}
          onClose={closeConversation}
          position={{ x: localCoords.x, y: localCoords.y }}
        />
      )}
    </>
  );
}


// attempting to add button 
// import { useEffect, useRef, useState } from "react";
// import { HandlesMap } from "../../../../liveblocks.config";
// import { useHotkeys } from "react-hotkeys-hook";
// import {
//   useMutation,
//   useMyPresence,
//   useOthers,
//   useStorage,
// } from "@liveblocks/react";
// import { PlusIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/16/solid";
// import { useSession } from "next-auth/react";
// import { useDebounce } from "./useDebounce";
// import { prompt, createExchange } from "../../actions";

// export function EditorMirrorLayer({ html }: { html: string }) {
//   function wrapEveryWordInSpansPreserveHTML(html: string) {
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(html, "text/html");

//     function processNode(node: Node) {
//       if (node.nodeType === Node.TEXT_NODE) {
//         const text = node.textContent || "";
//         const tokens = text.split(/(\s+)/);
//         const fragment = document.createDocumentFragment();

//         tokens.forEach((token) => {
//           if (/\s+/.test(token)) {
//             fragment.appendChild(document.createTextNode(token));
//           } else {
//             const span = document.createElement("span");
//             span.textContent = token;
//             span.className = "text-black/0";
//             span.style.whiteSpace = "normal";
//             span.style.overflowWrap = "break-word";
//             fragment.appendChild(span);
//           }
//         });

//         if (node.parentNode) {
//           node.parentNode.replaceChild(fragment, node);
//         }
//       } else if (node.nodeType === Node.ELEMENT_NODE) {
//         Array.from(node.childNodes).forEach(processNode);
//       }
//     }

//     processNode(doc.body);
//     return doc.body.innerHTML;
//   }

//   return (
//     <div
//       id="overlay-editor"
//       className="absolute max-w-3xl pointer-events-none select-none w-full h-80 mx-auto top-[12.35rem] px-2 prose"
//       dangerouslySetInnerHTML={{
//         __html: wrapEveryWordInSpansPreserveHTML(
//           html.replaceAll("<p></p>", "<p><br /></p>")
//         ),
//       }}
//     />
//   );
// }

// export function AnchorLayer({
//   anchorHandles,
//   addHandle,
//   draggingAnchor,
//   setDraggingAnchor,
//   docId,
// }: {
//   anchorHandles: HandlesMap;
//   addHandle: (newHandleId: string, x: number, y: number) => void;
//   draggingAnchor: boolean;
//   setDraggingAnchor: (dragging: boolean) => void;
//   docId: string;
// }) {
//   const [mousePos, setMousePos] = useState<{ x: number; y: number }>({
//     x: 0,
//     y: 0,
//   });

//   useEffect(() => {
//     const handleMouseMove = (e: MouseEvent) => {
//       setMousePos({ x: e.clientX, y: e.clientY });
//     };
//     window.addEventListener("mousemove", handleMouseMove);
//     return () => window.removeEventListener("mousemove", handleMouseMove);
//   }, []);

//   useHotkeys("a", () => {
//     const id = crypto.randomUUID();
//     addHandle(id, mousePos.x - window.innerWidth / 2, mousePos.y);
//   });

//   return (
//     <>
//       {anchorHandles?.keys().map((handleId: string) => {
//         return (
//           <AnchorHandle
//             key={handleId}
//             id={handleId}
//             setDraggingAnchor={setDraggingAnchor}
//             docId={docId}
//           />
//         );
//       })}
//     </>
//   );
// }

// // Conversation UI Component
// function ConversationUI({
//   handleId,
//   docId,
//   onClose,
//   position,
//   onUseResponse, //was onINsertrespinse
// }: {
//   handleId: string;
//   docId: string;
//   onClose: () => void;
//   position: { x: number; y: number };
//   //onInsertResponse: (responseText: string) => void; // New prop type
//   onUseResponse: (text: string) => void; // 👈 Add this
// }) {
//   const [inputValue, setInputValue] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const liveHandleInfo = useStorage((root) => root.docHandles.get(handleId));
//   const exchanges = liveHandleInfo?.exchanges || [];
//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const latestResponse = exchanges[exchanges.length - 1]?.response;

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [exchanges]);

//   const insertResponseIntoDoc = useMutation(({ storage }, response: string) => {
//     const doc = storage.get("doc");
//     if (!doc || typeof doc.get !== "function") return;
  
//     const currentContent = doc.get("content");
//     if (!Array.isArray(currentContent)) return;
  
//     // Create a new paragraph node for the response
//     const newParagraph = {
//       type: "paragraph",
//       content: [
//         {
//           type: "text",
//           text: response,
//         },
//       ],
//     };
  
//     // Append it to the content array
//     doc.set("content", [...currentContent, newParagraph]);
//   }, []);
  

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!inputValue.trim() || isLoading) return;

//     const promptText = inputValue.trim();
//     setInputValue("");
//     setIsLoading(true);

//     try {
//       // Create new exchange
//       await createExchange(docId, handleId, promptText);

//       // Send prompt to LLM
//       await prompt(docId, handleId);
//     } catch (error) {
//       console.error("Error sending prompt:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div
//       className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md w-80"
//       style={{
//         left: Math.min(position.x, window.innerWidth - 320),
//         top: Math.min(position.y, window.innerHeight - 400),
//         maxHeight: "400px",
//       }}
//     >
//       {/* Header */}
//       <div className="flex items-center justify-between p-3 border-b">
//         <h3 className="font-semibold text-sm">AI Assistant</h3>
//         <button
//           onClick={onClose}
//           className="p-1 hover:bg-gray-100 rounded"
//         >
//           <XMarkIcon className="w-4 h-4" />
//         </button>
//       </div>

//       {/* Messages */}
//       <div className="h-64 overflow-y-auto p-3 space-y-3">
//         {exchanges.length === 0 ? (
//           <div className="text-gray-500 text-sm text-center py-8">
//             Start a conversation with the AI assistant
//           </div>
//         ) : (
//           exchanges.map((exchange: any, index: number) => (
//             <div key={index} className="space-y-2">
//               <div className="bg-blue-50 p-2 rounded-lg">
//                 <div className="text-xs text-blue-600 font-medium mb-1">You</div>
//                 <div className="text-sm">{exchange.prompt}</div>
//               </div>
//               {/* {exchange.response && (
//                 <div className="bg-gray-50 p-2 rounded-lg">
//                   <div className="flex items-center justify-between mb-1">
//                     <div className="text-xs text-gray-600 font-medium">AI</div>
//                     <button
//                       //onClick={() => onInsertResponse(exchange.response)}
//                       onClick={() => onUseResponse(exchange.response)}
//                       className="text-xs text-blue-500 hover:underline px-2 py-1 rounded-md"
//                     >
//                       Insert
//                     </button>
//                   </div>
//                   <div className="text-sm whitespace-pre-wrap">{exchange.response}</div>
//                 </div> */}
//                 {exchange.response && (
//                   <div className="bg-gray-50 p-2 rounded-lg">
//                     <div className="text-xs text-gray-600 font-medium mb-1">AI</div>
//                     <div className="text-sm whitespace-pre-wrap mb-2">{exchange.response}</div>
//                     {/* <button
//                       onClick={() => insertResponseIntoDoc(exchange.response)}
//                       className="text-xs text-blue-600 hover:underline"
//                     >
//                       ➕ Insert to Doc
//                     </button> */}
//                     <button
//                     onClick={() => insertResponseIntoDoc(exchange.response)}
//                     className="text-xs text-blue-600 hover:underline"
//                   >
//                     ➕ Insert to Doc
//                   </button>

//                   </div>
//               )}
//               {!exchange.response && isLoading && index === exchanges.length - 1 && (
//                 <div className="bg-gray-50 p-2 rounded-lg">
//                   <div className="text-xs text-gray-600 font-medium mb-1">AI</div>
//                   <div className="text-sm text-gray-500">Thinking...</div>
//                 </div>
//               )}
//             </div>
//           ))
//         )}
//         <div ref={messagesEndRef} />
//       </div>

//       {/* Input */}
//       <div className="p-3 border-t">
//         <form onSubmit={handleSubmit} className="flex space-x-2">
//           <input
//             type="text"
//             value={inputValue}
//             onChange={(e) => setInputValue(e.target.value)}
//             placeholder="Ask the AI about this content..."
//             className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             disabled={isLoading}
//           />
//           <button
//             type="submit"
//             disabled={!inputValue.trim() || isLoading}
//             className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <PaperAirplaneIcon className="w-4 h-4" />
//           </button>
//         </form>
//         <button
//           type="button"
//           disabled={!latestResponse}
//           onClick={() => onUseResponse(latestResponse)}
//           className="w-full text-sm px-3 py-2 text-center bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
//         >
//           Use Response
//       </button>
//       </div>
//     </div>
//   );
// }

// function AnchorHandle({
//   id,
//   setDraggingAnchor,
//   docId,
// }: {
//   id: string;
//   setDraggingAnchor: (dragging: boolean) => void;
//   docId: string;
// }) {
//   const ref = useRef<HTMLDivElement>(null);
//   const [dragging, setDragging] = useState(false);
//   const [showConversation, setShowConversation] = useState(false);
//   const offset = useRef({ x: 0, y: 0 });
//   const session = useSession();
//   const [presence, updatePresense] = useMyPresence();
//   const othersPresense = useOthers();

//   const onUseResponse = (text: string) => {
//     const overlay = document.getElementById("overlay-editor");
//     if (!overlay) return;
  
//     const paragraphs = Array.from(overlay.querySelectorAll("p"));
//     if (paragraphs.length === 0) return;
  
//     // Find the closest paragraph based on y distance
//     const closestParagraph = paragraphs.reduce((prev, curr) => {
//       const currTop = curr.getBoundingClientRect().top;
//       const prevTop = prev.getBoundingClientRect().top;
//       return Math.abs(currTop - localCoords.y) < Math.abs(prevTop - localCoords.y)
//         ? curr
//         : prev;
//     });
  
//     const newNode = document.createElement("div");
//     newNode.innerText = text;
//     newNode.className = "mt-2 p-2 text-sm bg-yellow-100 border rounded";
  
//     closestParagraph.insertAdjacentElement("afterend", newNode);
//   };
  

//   const openConversation = () => {
//     updatePresense({ openHandles: [...(presence.openHandles || []), id] });
//     setShowConversation(true);
//   };

//   const closeConversation = () => {
//     updatePresense({
//       openHandles: (presence.openHandles || []).filter((handleId) => handleId !== id),
//     });
//     setShowConversation(false);
//   };

//   const liveHandleInfo = useStorage((root) => root.docHandles.get(id));
//   if (!liveHandleInfo) return null;

//   const setAnchorOwner = useMutation(({ storage }, userId: string) => {
//     const handle = storage.get("docHandles").get(id);
//     if (userId === "" && handle?.get("owner") === session.data?.user?.id) {
//       handle?.set("owner", "");
//       return true;
//     } else if (userId !== "" && handle?.get("owner") === "") {
//       handle?.set("owner", userId);
//       return true;
//     }
//     return false;
//   }, []);

//   const [localCoords, setLocalCoords] = useState<{ x: number; y: number }>({
//     x: liveHandleInfo.x + window.innerWidth / 2,
//     y: liveHandleInfo.y,
//   });

//   useEffect(() => {
//     if (!dragging) {
//       setLocalCoords({
//         x: liveHandleInfo.x + window.innerWidth / 2,
//         y: liveHandleInfo.y,
//       });
//     }
//   }, [liveHandleInfo.x, liveHandleInfo.y, dragging]);

//   const writePos = useMutation(({ storage }, targetX, targetY) => {
//     const handle = storage.get("docHandles").get(id);
//     handle?.set("x", targetX - window.innerWidth / 2);
//     handle?.set("y", targetY);
//   }, []);
//   const debouncedWritePos = useDebounce(writePos, 20);

//   const deleteAnchor = useMutation(({ storage }) => {
//     storage.get("docHandles").delete(id);
//   }, []);

//   // New mutation to insert text into the document
//   const insertTextAtHandle = useMutation(({ storage }, responseText: string) => {
//     const currentHtml = storage.get("docHandles").get("content");
//     console.log("currentHtml = " + currentHtml);
//    // const currentHtml = storage.get("bc8eb889-6d61-4bd9-9389-7d84558c8685").get("content");
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(currentHtml, "text/html");

//     const paragraphNodes = Array.from(doc.body.querySelectorAll("p"));
//     let inserted = false;

//     // Find the closest paragraph to the handle's Y position
//     for (let i = 0; i < paragraphNodes.length; i++) {
//       const paragraph = paragraphNodes[i];
//       const pRect = paragraph.getBoundingClientRect(); // This won't work correctly in a mutation where the DOM isn't live.

//       // A more robust approach for insertion within Liveblocks would be to
//       // insert at the end of the document, or use a more sophisticated
//       // rich text editor that maps screen coordinates to document positions.
//       // For this example, we'll simplify and just insert into the nearest paragraph by index.
//       // In a real application, you'd need to consider the actual rendered positions.

//       // For demonstration, let's insert after the paragraph if the handle's Y
//       // is roughly below its center, or append to the paragraph if the handle
//       // is roughly within its bounds. This is a simplification.
//       const editorMirrorLayer = document.getElementById("overlay-editor");
//       if (editorMirrorLayer) {
//         const paragraphElements = Array.from(editorMirrorLayer.querySelectorAll("p"));
//         if (paragraphElements.length > 0) {
//           // Find the paragraph that is closest to the handle's y position
//           let closestParagraphIndex = -1;
//           let minDistance = Infinity;

//           for (let j = 0; j < paragraphElements.length; j++) {
//             const rect = paragraphElements[j].getBoundingClientRect();
//             const distance = Math.abs(localCoords.y - (rect.top + rect.height / 2));
//             if (distance < minDistance) {
//               minDistance = distance;
//               closestParagraphIndex = j;
//             }
//           }

//           if (closestParagraphIndex !== -1) {
//             const targetParagraph = paragraphNodes[closestParagraphIndex];
//             const newParagraph = doc.createElement("p");
//             newParagraph.textContent = responseText;
//             targetParagraph.parentNode?.insertBefore(newParagraph, targetParagraph.nextSibling);
//             inserted = true;
//             break;
//           }
//         }
//       }
//     }

//     if (!inserted && doc.body.children.length > 0) {
//       // If no suitable paragraph was found, append to the end of the body
//       const newParagraph = doc.createElement("p");
//       newParagraph.textContent = responseText;
//       doc.body.appendChild(newParagraph);
//     } else if (!inserted) {
//       // If the body is empty, create the first paragraph
//       const newParagraph = doc.createElement("p");
//       newParagraph.textContent = responseText;
//       doc.body.appendChild(newParagraph);
//     }

//     storage.get("docHandles").set("content", doc.body.innerHTML);
//   }, [localCoords.y]); // Depend on localCoords.y for insertion logic

//   const [rotation, setRotation] = useState(0);
//   const lastPos = useRef<{ x: number; y: number }>({
//     x: localCoords.x,
//     y: localCoords.y,
//   });
//   const animationRef = useRef<number | null>(null);

//   // Determine context type based on position
//   const getContextType = (): "word" | "paragraph" | "document" => {
//     const overlayContainer = document.getElementById("overlay-editor");
//     if (!overlayContainer) return "document";

//     const paragraphs = overlayContainer.querySelectorAll("p");
//     if (!paragraphs.length) return "document";

//     const editorLeftEdge = paragraphs[0].getBoundingClientRect().x;
//     const editorRightEdge = 752 + editorLeftEdge;

//     const anchorOnLeft = localCoords.x < editorLeftEdge;
//     const anchorOnRight = localCoords.x > editorRightEdge;
//     const anchorInEditor = localCoords.x >= editorLeftEdge && localCoords.x <= editorRightEdge;

//     if (anchorInEditor) return "word";
//     if ((anchorOnLeft && editorLeftEdge - localCoords.x < editorLeftEdge / 6) ||
//         (anchorOnRight && localCoords.x < editorRightEdge + editorRightEdge / 6)) {
//       return "paragraph";
//     }
//     return "document";
//   };

//   const [text, setText] = useState("Drag me!");
//   const contextType = getContextType();

//   useEffect(() => {
//     const contextLabels = {
//       word: "Word",
//       paragraph: "Paragraph",
//       document: "Document"
//     };
//     setText(contextLabels[contextType]);
//   }, [contextType, localCoords.x]);

//   // Rotation animation and drag handling
//   useEffect(() => {
//     if (!dragging) return;

//     function animateRotation() {
//       const dx = localCoords.x - lastPos.current.x;
//       const velocity = dx;
//       const maxDeg = 30;
//       const newRotation = Math.max(-maxDeg, Math.min(maxDeg, velocity * 2));
//       setRotation(newRotation);
//       lastPos.current = { x: localCoords.x, y: localCoords.y };
//       animationRef.current = requestAnimationFrame(animateRotation);
//     }

//     animationRef.current = requestAnimationFrame(animateRotation);
//     return () => {
//       if (animationRef.current) cancelAnimationFrame(animationRef.current);
//     };
//   }, [dragging, localCoords.x, localCoords.y]);

//   useEffect(() => {
//     if (dragging) return;
//     let raf: number;
//     function easeBack() {
//       setRotation((r) => {
//         if (Math.abs(r) < 0.5) return 0;
//         return r * 0.85;
//       });
//       raf = requestAnimationFrame(easeBack);
//     }
//     easeBack();
//     return () => cancelAnimationFrame(raf);
//   }, [dragging]);

//   useEffect(() => {
//     let animationFrame: number | null = null;

//     const onMouseMove = (e: MouseEvent) => {
//       if (!dragging) return;

//       const overlayContainer = document.getElementById("overlay-editor");
//       if (!overlayContainer) return;
//       const paragraphs = overlayContainer.querySelectorAll("p");
//       if (!paragraphs) return;

//       let targetX = e.clientX;
//       let targetY = e.clientY;

//       const editorLeftEdge = paragraphs[0].getBoundingClientRect().x;
//       const editorRightEdge = 752 + editorLeftEdge;

//       const anchorOnLeft = targetX < editorLeftEdge;
//       const anchorOnRight = targetX > editorRightEdge;
//       const anchorInEditor = targetX >= editorLeftEdge && targetX <= editorRightEdge;

//       // Update text based on position
//       if (anchorOnLeft && !anchorOnRight) {
//         if (editorLeftEdge - targetX < editorLeftEdge / 6) {
//           setText("Paragraph");
//         } else {
//           setText("Document");
//         }
//       } else if (anchorOnRight && !anchorOnLeft) {
//         if (targetX < editorRightEdge + editorRightEdge / 6) {
//           setText("Paragraph");
//         } else {
//           setText("Document");
//         }
//       } else if (anchorInEditor) {
//         setText("Word");
//       }

//       if (animationFrame) cancelAnimationFrame(animationFrame);
//       const animate = () => {
//         setLocalCoords({ x: targetX, y: targetY });
//         animationFrame = requestAnimationFrame(animate);
//       };

//       debouncedWritePos(targetX, targetY);
//       animate();
//     };

//     const onMouseUp = () => {
//       if (localCoords.x < 50) {
//         if (ref.current) {
//           ref.current.style.transition = "opacity 0.5s";
//           ref.current.style.opacity = "0";
//           ref.current.style.pointerEvents = "none";
//           setTimeout(() => deleteAnchor(), 500);
//         }
//       } else {
//         setDragging(false);
//         setDraggingAnchor(false);
//         setAnchorOwner("");
//         if (animationFrame) cancelAnimationFrame(animationFrame);
//       }
//     };

//     window.addEventListener("mousemove", onMouseMove);
//     window.addEventListener("mouseup", onMouseUp);
//     return () => {
//       window.removeEventListener("mousemove", onMouseMove);
//       window.removeEventListener("mouseup", onMouseUp);
//       if (animationFrame) cancelAnimationFrame(animationFrame);
//     };
//   }, [dragging, id, debouncedWritePos, localCoords.x, deleteAnchor, setAnchorOwner, setDraggingAnchor]);

//   const onMouseDown = (e: React.MouseEvent) => {
//     if (liveHandleInfo.owner !== "") return;

//     if (session.data?.user?.id && !setAnchorOwner(session.data.user.id)) {
//       return;
//     }

//     const rect = ref.current?.getBoundingClientRect();
//     if (rect) {
//       offset.current = {
//         x: e.clientX - (rect.left + rect.width / 2),
//         y: e.clientY - (rect.top + rect.height / 2),
//       };
//     }
//     setDragging(true);
//     setDraggingAnchor(true); // Indicate that an anchor is being dragged
//   };

//   const handleDoubleClick = () => {
//     if (!dragging) {
//       openConversation();
//     }
//   };

//   return (
//     <>
//       <div
//         ref={ref}
//         className="absolute origin-center z-40 transition-transform duration-300"
//         style={{
//           left: localCoords.x,
//           top: localCoords.y,
//           transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
//           transition: dragging ? "none" : "transform 0.4s cubic-bezier(.4,2,.6,1)",
//         }}
//         onMouseDown={onMouseDown}
//         onDoubleClick={handleDoubleClick}
//       >
//         <div className="flex flex-col items-center justify-center group relative space-y-2">
//           <div
//             className={`
//               ${localCoords.x < 50
//                 ? "text-white border-red-600 bg-red-500"
//                 : "text-zinc-700 border-zinc-200 bg-white"
//             } select-none opacity-0 group-hover:opacity-100 translate-y-5 group-hover:translate-y-0 font-semibold transform text-xs px-1.5 py-0.5 border shadow-sm origin-center rounded-md`}
//           >
//             {localCoords.x < 50 ? "Delete?" : text}
//           </div>

//           <div className="flex items-center justify-center border bg-white/50 backdrop-blur-sm origin-center border-zinc-200 opacity-50 rounded-full transition-all duration-200 ease-in-out cursor-pointer group-hover:scale-125 group-hover:opacity-100 size-5">
//             <PlusIcon
//               className={`absolute size-3 text-zinc-500 shrink-0 transition-all group-hover:scale-125 ${
//                 localCoords.x < 50 ? "rotate-45" : "rotate-0"
//               }`}
//             />
//           </div>
//         </div>
//       </div>

//       {/* Conversation UI */}
//       {showConversation && (
//         <ConversationUI
//           handleId={id}
//           docId={docId}
//           onClose={closeConversation}
//           position={{ x: localCoords.x, y: localCoords.y }}
//           //onInsertResponse={insertTextAtHandle} // Pass the new mutation
//           onUseResponse={onUseResponse}
//         />
//       )}
//     </>
//   );
// }