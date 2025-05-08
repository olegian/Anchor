// import { getContents } from "@/app/actions";
// import { JsonObject } from "@liveblocks/client";
// import { useMutation, useRoom, useStorage } from "@liveblocks/react";
// import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
// import { Editor, EditorContent, useEditor } from "@tiptap/react";
// import StarterKit from "@tiptap/starter-kit";
// import { useEffect } from "react";

// interface SnapshotEntry extends JsonObject {
//   preview: string;
//   snapshotId: string;
// }

// export function SnapShotEditor({ doc, snapshotId }: { doc: string; snapshotId: string }) {
//   const maindocLB = useLiveblocksExtension({
//     field: "maindoc",
//   });
//   const snapshots = useStorage((root) => root.snapshots);
//   const setCreatedSnapshot = useMutation(({ storage }, snapshotEditor: Editor) => {
//     getContents(doc)
//       .then((contents) => {
//         snapshotEditor.commands.setContent(contents);

//         const snapshots = storage.get("snapshots");
//         const snapshot = snapshots.find((element) => {
//           return element.toImmutable().snapshotId === snapshotId;
//         });
//         snapshot?.set("preview", "set"); // raise flag to stop resnapping
//       })
//       .catch(() => {
//         console.log("fuck dude");
//       });
//   }, []);


//   const maindocEditor = useEditor({
//     extensions: [
//       maindocLB,
//       StarterKit.configure({
//         history: false,
//       }),
//     ],
//     immediatelyRender: true,
//   });

//   const snapshotLB = useLiveblocksExtension({
//     field: snapshotId,
//   });

//   const snapshotEditor = useEditor({
//     extensions: [
//       snapshotLB,
//       StarterKit.configure({
//         history: false,
//       }),
//     ],
//     immediatelyRender: true,
//   });

//   useEffect(() => {
//     if (!snapshots){
//       return
//     }

//     const snapshot = snapshots?.find((element) => {
//       return element["snapshotId"] === snapshotId;
//     });
//     console.log(`snapshot: ${snapshot}`)
//     if (snapshot?.preview.length == 0) {
//       console.log("taking snapshot")
//       setCreatedSnapshot(snapshotEditor);
//     } else {
//       console.log("snapshot already created")
//     }
//   }, [snapshots]);

//   if (!snapshots) {
//     return;
//   }

//   return (
//     <div className={"snapshot-editors-container"}>
//       <EditorContent editor={snapshotEditor} className={"snapshot-editor"} />
//       <EditorContent editor={maindocEditor} className={"maindoc-editor"} />
//     </div>
//   );
// }

// use this one
import { getContents } from "@/app/actions";
import { JsonObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useState } from "react";
import { PromptEnvironment } from "./PromptEnvironment";

interface SnapshotEntry extends JsonObject {
  preview: string;
  snapshotId: string;
}

export function SnapShotEditor({ doc, snapshotId }: { doc: string; snapshotId: string }) {
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  
  const maindocLB = useLiveblocksExtension({
    field: "maindoc",
  });
  // TODO: This is how to populate populate the initial snapshot contents
  const snapshots = useStorage((root) => root.snapshots);
  const setCreatedSnapshot = useMutation(({ storage }, snapshotEditor: Editor) => {
    getContents(doc)
      .then((contents) => {
        snapshotEditor.commands.setContent(contents);

        const snapshots = storage.get("snapshots");
        const snapshot = snapshots.find((element) => {
          return element.toImmutable().snapshotId === snapshotId;
        });
        snapshot?.set("preview", "set"); // raise flag to stop resnapping
      })
      .catch((error) => {
        console.error("Error getting contents:", error);
      });
  }, []);


  const maindocEditor = useEditor({
    extensions: [
      maindocLB,
      StarterKit.configure({
        history: false,
      }),
    ],
    immediatelyRender: true,
  });

  const snapshotLB = useLiveblocksExtension({
    field: snapshotId,
  });

  const snapshotEditor = useEditor({
    extensions: [
      snapshotLB,
      StarterKit.configure({
        history: false,
      }),
    ],
    immediatelyRender: true,
  });

  // TODO: alongside this use effect, to populate the snapshot contents
  // when a new snapshot is loaded (especially if its yet to be initialized
  // with the maindoc contents).
  useEffect(() => {
    if (!snapshots){
      return;
    }

    const snapshot = snapshots?.find((element) => {
      return element["snapshotId"] === snapshotId;
    });
    console.log(`snapshot: ${snapshot}`);

    // TODO: replace the preview tag with a isInitialized boolean, and use that
    if (snapshot?.preview.length == 0) {
      console.log("taking snapshot");
      setCreatedSnapshot(snapshotEditor);
    } else {
      console.log("snapshot already created");
    }
  }, [snapshots, snapshotEditor]);

  if (!snapshots) {
    return null;
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full flex justify-end mb-4 px-4">
        <button
          onClick={() => setIsPromptOpen(!isPromptOpen)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isPromptOpen ? "Close Prompt" : "Open Gemini Prompt"}
        </button>
      </div>
      
      {isPromptOpen && (
        <div className="w-full flex justify-center mb-6">
          <PromptEnvironment docName={doc} snapshotId={snapshotId} editor={snapshotEditor} />
        </div>
      )}
      
      <div className="snapshot-editors-container">
        <div className="relative w-1/2">
          <div className="absolute top-0 left-0 bg-gray-200 dark:bg-gray-700 px-2 py-1 text-sm rounded-br-md">
            Snapshot Editor
          </div>
          <EditorContent editor={snapshotEditor} className="snapshot-editor" />
        </div>
        <div className="relative w-1/2">
          <div className="absolute top-0 left-0 bg-gray-200 dark:bg-gray-700 px-2 py-1 text-sm rounded-br-md">
            Main Document
          </div>
          <EditorContent editor={maindocEditor} className="maindoc-editor" />
        </div>
      </div>
    </div>
  );
}