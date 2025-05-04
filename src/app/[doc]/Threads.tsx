import {
    FloatingComposer,
    FloatingThreads,
    FloatingToolbar,
    Toolbar,
} from "@liveblocks/react-tiptap";
import { Comment } from "@liveblocks/react-ui/primitives";
import { useThreads } from "@liveblocks/react/suspense";
import { type Editor } from "@tiptap/react";

export function Threads({ editor }: { editor: Editor | null }) {
  const { threads } = useThreads({ query: { resolved: false } });

  const annotationHandler = () => {
    // pending comment tells composer to open up
    editor?.chain().focus().addPendingComment().run();
  };

  return (
    <>
      <FloatingToolbar editor={editor}>
        {/* you can add an icon here with icon={component} to make it look nicer */}
        <Toolbar.Button
          name={"Annotate"}
          shortcut="CMD-H"
          onClick={annotationHandler}
        />
      </FloatingToolbar>

      <FloatingThreads
        threads={threads}
        editor={editor}
        components={{
          Thread: (props) => (
            // TODO: add another button to this div to delete the annotation
            <div className={"annotation-container"}>
              {props.thread.comments.map((comment) => (
                <Comment.Body
                  key={comment.id}
                  body={comment.body}
                  className={"annotation"}
                />
              ))}
            </div>
          ),
        }}
      />

      <FloatingComposer
        overrides={{ COMPOSER_PLACEHOLDER: "Write an annotation..." }}
        editor={editor}
        className="floating-composer"
        style={{ width: "350px" }}
        showAttachments={false}
        showFormattingControls={false}
      />
    </>
  );
}
