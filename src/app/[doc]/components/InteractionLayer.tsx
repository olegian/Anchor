import { useEffect, useRef, useState } from "react";
import { HandlesMap } from "../../../../liveblocks.config";
import { useHotkeys } from "react-hotkeys-hook";
import { useMutation, useMyPresence, useOthers, useStorage } from "@liveblocks/react";
import { PlusIcon, PaperAirplaneIcon, XMarkIcon } from "@heroicons/react/16/solid";
import { useSession } from "next-auth/react";
import { useDebounce } from "./useDebounce";
import { prompt, createExchange } from "../../actions";
import { LiveObject } from "@liveblocks/client";

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
        __html: wrapEveryWordInSpansPreserveHTML(html.replaceAll("<p></p>", "<p><br /></p>")),
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
  const [isLoading, setIsLoading] = useState(false);
  const exchanges = useStorage((root) => root.docHandles.get(handleId)?.exchanges);
  const currentExchange = exchanges?.at(exchanges.length - 1);

  if (!exchanges) {
    return null;
  }

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Live Storage Mutations ---
  // This isn't an ideal solution, cursors won't show up in prompt boxes, and concurrent edits (probably)
  // wont look that clean, but the alternative is to use a whole ass editor as the prompt box,
  // and I would rather not do that for now. I think we can pivot to that if this
  // doesnt work too well
  const changeCurrentPrompt = useMutation(({ storage }, newPrompt) => {
    const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");

    // note that the first element of exchanges should have been initialized when the handle was created
    // so this is actually a safe access. Typescript moment in having to type this comment out.
    exchanges?.get(exchanges.length - 1)?.set("prompt", newPrompt);
  }, []);

  const setPending = useMutation(({ storage }, isPending) => {
    const handleInfo = storage.get("docHandles").get(handleId);

    if (isPending) {
      // trying to acquire lock
      const handleInfo = storage.get("docHandles").get(handleId);
      if (handleInfo?.get("isPending")) {
        // someone already grabbed it
        return false;
      } else {
        handleInfo?.set("isPending", true);
      }

      return true;
    } else {
      // trying to release lock, just do it unconditionally.
      // i've written this comment a bunch -- this is not that cool to do from a concurrency standpoint but eh

      handleInfo?.set("isPending", false);
      return true;
    }
  }, []);

  const openNewPrompt = useMutation(({ storage }) => {
    const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");
    if (!exchanges?.get(exchanges?.length - 1)?.get("response")) {
      // trying to open new a prompt without getting response from previous one
      return false;
    } else {
      exchanges.push(new LiveObject({ prompt: "", response: "" }));
      return true;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [exchanges]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptText = currentExchange?.prompt || "";
    if (promptText.length == 0 || isLoading) return;
    setIsLoading(true);

    if (!setPending(true)) {
      // TODO: report that there is already a prompt pending from some other client
      setIsLoading(false)
      return;
    }

    try {
      // Send prompt to LLM
      await prompt(docId, handleId);

      // create new exchange after response is received
      if (!openNewPrompt()) {
          // TODO: this should never happen, but just in case leave this for now
          // its for if somehow we end up trying to start a new prompt without resolving the previous one
          console.log("Prompt state is weird!!! Check that out ASAP!")
      }
    } catch (error) {
      console.error("Error sending prompt:", error);
    } finally {
      setPending(false);
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
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
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
            value={currentExchange?.prompt || ""}
            onChange={(e) => changeCurrentPrompt(e.target.value)}
            placeholder="Ask the AI about this content..."
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={(currentExchange?.prompt || "").length == 0 || isLoading} // Theres gotta be a better way to express that length check
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

  const writePos = useMutation(
    (
      { storage },
      targetX: number,
      targetY: number,
      wordIdx: number = -1,
      paragraphIdx: number = -1, 
    ) => {
      const handle = storage.get("docHandles").get(id);
      handle?.set("x", targetX - window.innerWidth / 2);
      handle?.set("y", targetY);
      handle?.set("wordIdx", wordIdx);
      handle?.set("paragraphIdx", paragraphIdx);
    },
    []
  );
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
    if (
      (anchorOnLeft && editorLeftEdge - localCoords.x < editorLeftEdge / 6) ||
      (anchorOnRight && localCoords.x < editorRightEdge + editorRightEdge / 6)
    ) {
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
      document: "Document",
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

      for (let i = 0; i < paragraphs.length; i++) {
        const paragraph = paragraphs[i];
      }

      let found = false;
      let paragraphIdx: number | undefined = undefined;
      let wordIdx: number | undefined = undefined;
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
            wordIdx = j
            paragraphIdx = i;
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
          paragraph.after;

          paragraphIdx = i;
          targetX = paraRect.left - 20;
          targetY = paraRect.top + paraRect.height / 2 - 10;
        }
      }

      if (animationFrame) cancelAnimationFrame(animationFrame);
      const animate = () => {
        setLocalCoords({ x: targetX, y: targetY });
        animationFrame = requestAnimationFrame(animate);
      };

      debouncedWritePos(targetX, targetY, wordIdx, paragraphIdx);
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
