import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpDownIcon,
} from "@heroicons/react/16/solid";
import { useEffect, useRef } from "react";

export default function AnchorPopup({
  title,
  handleId,
  docId,
  position,
  liveHandleInfo,
  isOpen,
  close,
}: {
  title: string;
  handleId: string;
  docId: string;
  liveHandleInfo?: any;
  position: { x: number; y: number };
  isOpen: boolean;
  close: () => void;
}) {
  const popupRef = useRef<HTMLDivElement | null>(null);

  // if click outside, close the popup
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

  return (
    <div
      className="top-14 left-0 -translate-x-1/2 absolute w-xs z-50 bg-white border border-zinc-200 rounded-xl shadow-xl"
      ref={popupRef}
    >
      <div className="p-2">
        <div className="flex items-center justify-start space-x-2">
          <div className="overflow-hidden rounded-full shrink-0 size-7">
            <div className="animate-spin from-sky-400 to-pink-400 via-violet-400 bg-radial-[at_25%_75%] size-7 rounded-full shrink-0 blur-xs" />
          </div>
          <input
            type="text"
            className="w-full border text-sm border-zinc-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask AI about this content..."
            // press enter to send
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();

                console.log(`Popup ${handleId} clicked in doc ${docId}`);
              }
            }}
          />
        </div>
      </div>
      <div className="p-2 border-t border-zinc-200 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="font-medium text-sm">Response</h4>
          <div className="flex items-center space-x-1 justify-end">
            <button
              title="Previous exchange"
              disabled={false} // Replace with actual condition to disable
              onClick={() => {
                // go back to previous exchange
              }}
              className="disabled:opacity-50 disabled:pointer-events-none text-zinc-600 hover:text-zinc-800 cursor-pointer"
            >
              <ChevronLeftIcon className="inline size-5" />
            </button>
            <button
              title="Next exchange"
              disabled={false} // Replace with actual condition to disable
              onClick={() => {
                // go to next exchange
              }}
              className="disabled:opacity-50 disabled:pointer-events-none text-zinc-600 hover:text-zinc-800 cursor-pointer"
            >
              <ChevronRightIcon className="inline size-5" />
            </button>
          </div>
        </div>
        <p className="border border-zinc-200 p-2 rounded-lg text-sm text-zinc-700 max-h-64 overflow-y-auto">
          orem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus vel
          est blandit turpis sollicitudin sollicitudin. Donec sed elit vitae
          nibh fermentum congue. Praesent quis lectus mollis, sagittis sem sed,
          mattis nisl. Maecenas a leo vehicula, semper arcu interdum, interdum
          elit. Integer quis bibendum leo. Maecenas sed tellus vitae lectus
          bibendum cursus eget sit amet orci. Aenean ultrices blandit nisi, vel
          accumsan libero laoreet non. Phasellus magna enim, faucibus et mauris
          non, scelerisque tristique metus. Fusce mollis risus pellentesque erat
          venenatis, non maximus arcu blandit. Cras lacinia tempus odio at
          fermentum. Aenean vel commodo quam. Mauris fermentum, nisi sit amet
          viverra mattis, nisl quam gravida justo, quis iaculis sem mi id nunc.
          In a felis viverra, dignissim tellus id, consequat dui. Vestibulum
          dictum purus scelerisque magna consectetur rutrum. Praesent et velit
          magna. Suspendisse potenti. Praesent vehicula ex lacus, eget egestas
          lectus mattis ut. Nullam id nisi sollicitudin, sollicitudin enim sed,
          hendrerit eros. Ut consectetur maximus molestie. Nam finibus fermentum
          dui, ac sagittis nunc varius in. Donec elementum odio nibh, vitae
          convallis turpis fringilla sit amet. Sed rhoncus venenatis nunc
          posuere lobortis. Nullam scelerisque quis eros hendrerit luctus.
          Vestibulum ante ipsum primis in faucibus orci luctus et ultrices
          posuere cubilia curae; Quisque lectus mi, tincidunt a neque vel,
          vulputate suscipit orci. Vivamus porta sed dui quis pulvinar. Ut
          sodales lobortis sapien eget dapibus. Aliquam venenatis tristique
          libero nec tristique. Suspendisse in lacus ac nulla laoreet dignissim
          eu at turpis. Integer ante ris
        </p>
      </div>
      <div className="p-2 border-t border-zinc-200 flex items-end justify-between">
        <div className="space-y-0">
          <h5 className="font-medium font-sans text-sm">Context</h5>
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
            disabled={false} // Replace with actual condition to disable
            onClick={() => {
              // insert
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
