import { getContents } from "@/app/actions";
import { JsonObject } from "@liveblocks/client";
import { useMutation, useRoom, useStorage } from "@liveblocks/react";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";

interface SnapshotEntry extends JsonObject {
  preview: string;
  snapshotId: string;
}

export function SnapShotEditor({ doc, snapshotId }: { doc: string; snapshotId: string }) {
  const maindocLB = useLiveblocksExtension({
    field: "maindoc",
  });
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
      .catch(() => {
        console.log("fuck dude");
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

  useEffect(() => {
    if (!snapshots){
      return
    }

    const snapshot = snapshots?.find((element) => {
      return element["snapshotId"] === snapshotId;
    });
    console.log(`snapshot: ${snapshot}`)
    if (snapshot?.preview.length == 0) {
      console.log("taking snapshot")
      setCreatedSnapshot(snapshotEditor);
    } else {
      console.log("snapshot already created")
    }
  }, [snapshots]);

  if (!snapshots) {
    return;
  }

  return (
    <div className={"snapshot-editors-container"}>
      <EditorContent editor={snapshotEditor} className={"snapshot-editor"} />
      <EditorContent editor={maindocEditor} className={"maindoc-editor"} />
    </div>
  );
}
