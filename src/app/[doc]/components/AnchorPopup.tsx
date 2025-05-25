import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
  PlusIcon,
} from "@heroicons/react/16/solid";

import { LiveObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react";
import { Editor } from "@tiptap/react";
import { useEffect, useRef, useState } from "react";
import { prompt } from "@/app/actions";

export default function AnchorPopup({
  title,
  handleId,
  docId,
  position,
  liveHandleInfo,
  isOpen,
  close,
  editor,
}: {
  title: string;
  handleId: string;
  docId: string;
  liveHandleInfo?: any; // TODO: this should be better typed, i think theres a type def in liveblocks config.ts
  position: { x: number; y: number };
  isOpen: boolean;
  editor: Editor;
  close: () => void;
}) {
  const popupRef = useRef<HTMLDivElement | null>(null);
  const exchanges = useStorage(
    (root) => root.docHandles.get(handleId)?.exchanges
  );

  if (!exchanges) {
    // TODO: add indicator while synced exchanges load
    return null;
  }

  const [viewedExchange, setViewedExchange] = useState(exchanges.length - 1); // TODO: initialize to last?
  const [isLoading, setIsLoading] = useState(false);

  // TODO: only one popup should be open?

  // // if click outside, close the popup
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !popupRef.current?.contains(target)) {
        close();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, close]);

  // --- Live Storage Mutations ---
  const changeCurrentPrompt = useMutation(({ storage }, newPrompt) => {
    const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");
    exchanges?.get(exchanges.length - 1)?.set("prompt", newPrompt);
  }, []);

  const setPending = useMutation(({ storage }, isPending) => {
    const handleInfo = storage.get("docHandles").get(handleId);

    if (isPending) {
      const handleInfo = storage.get("docHandles").get(handleId);
      if (handleInfo?.get("isPending")) {
        return false;
      } else {
        handleInfo?.set("isPending", true);
      }
      return true;
    } else {
      handleInfo?.set("isPending", false);
      return true;
    }
  }, []);

  const openNewPrompt = useMutation(({ storage }) => {
    const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");
    if (!exchanges?.get(exchanges?.length - 1)?.get("response")) {
      return false;
    } else {
      exchanges.push(new LiveObject({ prompt: "", response: "" }));
      return true;
    }
  }, []);

  const handleSubmit = async () => {
    const promptText = exchanges.at(exchanges.length - 1)?.prompt || "";
    if (promptText.length == 0 || isLoading) return;
    console.log("prompting: ", promptText);

    if (!setPending(true)) {
      setIsLoading(false);
      return;
    }

    try {
      await prompt(docId, handleId);

      if (!openNewPrompt()) {
        console.log("Prompt state is weird!!! Check that out ASAP!");
      }
    } catch (error) {
      console.error("Error sending prompt:", error);
    } finally {
      setPending(false);
      setIsLoading(false);
    }
  };

  // New function to insert response into document
  const insertResponseIntoDocument = () => {
    if (
      !liveHandleInfo ||
      exchanges.length < 2 ||
      viewedExchange == exchanges.length - 1
    )
      return;

    const paragraphIdx = liveHandleInfo.paragraphIdx;

    // TODO: use wordIdx to get a more accurate position
    const wordIdx = liveHandleInfo.wordIdx;
    console.log(paragraphIdx, wordIdx);

    const response = exchanges.at(viewedExchange)?.response || "";
    const formatResponse = response.replaceAll(/([\p{P}])  /gu, "$1 ").trim();
    if (paragraphIdx == -1) {
      // no paragraph is selected, insert to end of document
      editor.commands.insertContentAt(editor.state.doc.content.size, {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: formatResponse,
          },
        ],
      });
    } else {
      const paragraph = editor.state.doc.child(paragraphIdx);
      const insertionPoint =
        (editor.$doc.children.at(paragraphIdx)?.pos || 0) +
        paragraph.content.size;

      editor.commands.insertContentAt(insertionPoint, {
        type: "paragraph",
        content: [
          {
            type: "text",
            text: formatResponse,
          },
        ],
      });
    }

    close();
  };

  return (
    <div
      className="anchor-popup top-14 left-0 -translate-x-1/2 absolute w-xs z-50 bg-white border border-zinc-200 rounded-xl shadow-xl"
      ref={popupRef}
    >
      <div className="p-2">
        <div className="flex items-center justify-start space-x-2">
          <div className="overflow-hidden rounded-full shrink-0 size-7">
            <div
              className={`${
                isLoading
                  ? "animate-spin from-sky-400 to-pink-400 via-violet-400 bg-radial-[at_25%_75%]"
                  : "bg-zinc-300"
              }  size-7 rounded-full shrink-0 blur-xs transition-all`}
            />
          </div>
          <input
            type="text"
            className="disabled:border-zinc-100 w-full border text-sm border-zinc-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask AI about this content..."
            disabled={viewedExchange != exchanges.length - 1}
            value={exchanges.at(viewedExchange)?.prompt}
            // press enter to send
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                setIsLoading(true);
                handleSubmit()
                  .then(() => {
                    setIsLoading(false);
                  })
                  .catch(() => {
                    console.error("error occurred on prompt:", e);
                    setIsLoading(false);
                  });
              }
            }}
            onChange={(e) => changeCurrentPrompt(e.target.value)}
          />
        </div>
      </div>
      <div className="p-2 border-t border-zinc-200 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">
            Response {exchanges.length > 1 ? viewedExchange + 1 : ""}
          </h4>
          <div className="flex items-center space-x-1 justify-end">
            <button
              title="Previous exchange"
              disabled={viewedExchange <= 0}
              onClick={() => {
                // go back to previous exchange
                setViewedExchange((prev) => prev - 1);
              }}
              className="disabled:opacity-25 size-5 flex items-center justify-center shrink-0 disabled:pointer-events-none text-zinc-600 hover:text-zinc-800 cursor-pointer"
            >
              <ChevronLeftIcon className="inline size-5 shrink-0" />
            </button>

            <button
              title={
                exchanges.at(viewedExchange + 1)?.response
                  ? "Next exchange"
                  : "Create new exchange"
              }
              disabled={viewedExchange >= exchanges.length - 1}
              onClick={() => {
                // go to next exchange
                setViewedExchange((prev) => prev + 1);
              }}
              className="disabled:opacity-25 size-5 flex items-center justify-center shrink-0 disabled:pointer-events-none text-zinc-600 hover:text-zinc-800 cursor-pointer"
            >
              {exchanges.at(viewedExchange + 1)?.response ? (
                <ChevronRightIcon className="inline size-5 shrink-0" />
              ) : (
                <PlusIcon className="inline size-4 shrink-0" />
              )}
            </button>
          </div>
        </div>
        <p className="border border-zinc-200 p-2 rounded-lg text-sm text-zinc-700 max-h-64 overflow-y-auto">
          {isLoading ? (
            <div className="">
              <div className="animate-pulse flex flex-wrap items-start justify-start gap-1">
                {Array(6)
                  .fill(null)
                  .map((_, index) => (
                    <>
                      <div className="w-full bg-zinc-200 h-4 rounded" />
                    </>
                  ))}
              </div>
            </div>
          ) : exchanges.at(viewedExchange)?.response ? (
            exchanges.at(viewedExchange)?.response
          ) : (
            <div className="py-6 text-center">
              Ask about the content to get a response.
            </div>
          )}
        </p>
      </div>
      <div className="p-2 border-t border-zinc-200 flex items-end justify-between">
        <div className="space-y-0">
          <h5 className="font-medium font-sans text-sm">Context</h5>
          {/* TODO: chosen context */}
          <div className="relative text-xs text-zinc-700 border inline-block border-zinc-200 px-1 py-0.5 rounded font-medium">
            Use{}
            <select className="text-xs ml-1 p-0 w-auto border-none form-select appearance-none! bg-none pr-4">
              {liveHandleInfo.wordIdx >= 0 &&
              liveHandleInfo.paragraphIdx >= 0 ? (
                <option>Word</option>
              ) : null}
              {liveHandleInfo.paragraphIdx >= 0 ? (
                <option>Paragraph</option>
              ) : null}
              <option>Document</option>
            </select>
            <ChevronUpDownIcon className="absolute size-4 text-zinc-500 top-0.5 right-0.5 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center space-x-2 justify-end">
          <button
            title="Insert response into document"
            disabled={viewedExchange >= exchanges.length - 1} // Replace with actual condition to disable
            onClick={() => {
              insertResponseIntoDocument();
            }}
            className="disabled:opacity-50 disabled:pointer-events-none text-sm px-2 py-1 h-7 inline-flex items-center border border-zinc-200 rounded-lg font-medium hover:bg-zinc-100 cursor-pointer"
          >
            Insert
          </button>
        </div>
      </div>
    </div>
  );
}

// function ConversationUI({
//   handleId,
//   docId,
//   onClose,
//   position,
//   editor,
// }: {
//   handleId: string;
//   docId: string;
//   onClose: () => void;
//   position: { x: number; y: number };
//   editor: Editor;
// }) {
//   const [isLoading, setIsLoading] = useState(false);
//   const exchanges = useStorage(
//     (root) => root.docHandles.get(handleId)?.exchanges
//   );
//   const handleInfo = useStorage((root) => root.docHandles.get(handleId));
//   const currentExchange = exchanges?.at(exchanges.length - 1);

//   if (!exchanges) {
//     return null;
//   }

//   const messagesEndRef = useRef<HTMLDivElement>(null);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   // --- Live Storage Mutations ---
//   const changeCurrentPrompt = useMutation(({ storage }, newPrompt) => {
//     const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");
//     exchanges?.get(exchanges.length - 1)?.set("prompt", newPrompt);
//   }, []);

//   const setPending = useMutation(({ storage }, isPending) => {
//     const handleInfo = storage.get("docHandles").get(handleId);

//     if (isPending) {
//       const handleInfo = storage.get("docHandles").get(handleId);
//       if (handleInfo?.get("isPending")) {
//         return false;
//       } else {
//         handleInfo?.set("isPending", true);
//       }
//       return true;
//     } else {
//       handleInfo?.set("isPending", false);
//       return true;
//     }
//   }, []);

//   const openNewPrompt = useMutation(({ storage }) => {
//     const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");
//     if (!exchanges?.get(exchanges?.length - 1)?.get("response")) {
//       return false;
//     } else {
//       exchanges.push(new LiveObject({ prompt: "", response: "" }));
//       return true;
//     }
//   }, []);

//   // New function to insert response into document
//   const insertResponseIntoDocument = () => {
//     if (!handleInfo || exchanges.length < 2) return;

//     const paragraphIdx = handleInfo.paragraphIdx;

//     // TODO: use wordIdx to get a more accurate position
//     const wordIdx = handleInfo.wordIdx;

//     const insertionPoint =
//       paragraphIdx == -1
//         ? editor.$doc.children.at(-1)?.pos || 0
//         : editor.$doc.children.at(paragraphIdx + 1)?.pos ||
//           editor.$doc.children.at(-1)?.pos || 0;

//     const response = exchanges.at(exchanges.length - 2)?.response;

//     editor.commands.insertContentAt(insertionPoint, {
//       type: "paragraph",
//       content: [
//         {
//           type: "text",
//           text: response,
//         },
//       ],
//     });
//   };

//   useEffect(() => {
//     scrollToBottom();
//   }, [exchanges]);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const promptText = currentExchange?.prompt || "";
//     if (promptText.length == 0 || isLoading) return;
//     setIsLoading(true);

//     if (!setPending(true)) {
//       setIsLoading(false);
//       return;
//     }

//     try {
//       await prompt(docId, handleId);

//       if (!openNewPrompt()) {
//         console.log("Prompt state is weird!!! Check that out ASAP!");
//       }
//     } catch (error) {
//       console.error("Error sending prompt:", error);
//     } finally {
//       setPending(false);
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
//         <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
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
//                 <div className="text-xs text-blue-600 font-medium mb-1">
//                   You
//                 </div>
//                 <div className="text-sm">{exchange.prompt}</div>
//               </div>
//               {exchange.response && (
//                 <div className="bg-gray-50 p-2 rounded-lg">
//                   <div className="flex items-center justify-between mb-1">
//                     <div className="text-xs text-gray-600 font-medium">AI</div>
//                     <button
//                       onClick={() =>
//                         insertResponseIntoDocument(exchange.response)
//                       }
//                       className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
//                       title="Insert this response into the document"
//                     >
//                       Insert
//                     </button>
//                   </div>
//                   <div className="text-sm whitespace-pre-wrap">
//                     {exchange.response}
//                   </div>
//                 </div>
//               )}
//               {!exchange.response &&
//                 isLoading &&
//                 index === exchanges.length - 1 && (
//                   <div className="bg-gray-50 p-2 rounded-lg">
//                     <div className="text-xs text-gray-600 font-medium mb-1">
//                       AI
//                     </div>
//                     <div className="text-sm text-gray-500">Thinking...</div>
//                   </div>
//                 )}
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
//             value={currentExchange?.prompt || ""}
//             onChange={(e) => changeCurrentPrompt(e.target.value)}
//             placeholder="Ask the AI about this content..."
//             className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//             disabled={isLoading}
//           />
//           <button
//             type="submit"
//             disabled={(currentExchange?.prompt || "").length == 0 || isLoading}
//             className="px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             <PaperAirplaneIcon className="w-4 h-4" />
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
