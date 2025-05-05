import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

export function SnapShotEditor({ snapshotId }: { snapshotId: string }) {
  const maindocLB = useLiveblocksExtension();
  const snapshotLB = useLiveblocksExtension({ field: snapshotId });

  const maindocEditor = useEditor({
    extensions: [
      maindocLB,
      StarterKit.configure({
        history: false,
      }),
    ],
    immediatelyRender: true,
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

  return (
    <div className={"snapshot-editors-container"}>
      <EditorContent editor={snapshotEditor} className={"snapshot-editor"} />
      <EditorContent editor={maindocEditor} className={"maindoc-editor"} />
    </div>
  );
}
