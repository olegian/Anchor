import {
  FloatingComposer,
  FloatingThreads,
  FloatingToolbar,
  Toolbar,
} from "@liveblocks/react-tiptap";
import {
  Comment,
  ComposerSubmitComment,
} from "@liveblocks/react-ui/primitives";
import { useThreads } from "@liveblocks/react/suspense";
import { type Editor } from "@tiptap/react";
import { deleteAnnotation } from "../actions";
import { useEffect, useState } from "react";

interface Annotation {
  from: number;
  to: number;
  comment: string | undefined;
}

export function Threads({ editor }: { editor: Editor | null }) {
  const { threads } = useThreads({ query: { resolved: false } });
  const [annotations, setAnnotations] = useState<Annotation[]>([]);

  const newAnnotationHandler = () => {
    // pending comment tells composer to open up
    if (!editor) {
      return;
    }
    editor.chain().focus().addPendingComment().run();
  };

  const getSelection = () => {
    if (!editor) return { text: "", from: -1, to: -1 };

    const { view, state } = editor;
    const { from, to } = view.state.selection;
    const text = state.doc.textBetween(from, to, "");
    return { text, from, to };
  };

  const composerSubmitHandler = (
    comment: ComposerSubmitComment,
    event: any
  ) => {
    const { from, to } = getSelection();
    const annotation = comment.body.content[0].children[0].text;

    setAnnotations((old) => [
      ...old,
      {
        from: from,
        to: to,
        comment: annotation,
      },
    ]);
  };

  useEffect(() => {
    console.log(annotations);
  }, [annotations]);

  // populate annotations state on mount
  useEffect(() => {
    let annotations: Annotation[] = threads.map((thread) => {
      const text = thread.comments[0].body?.content[0].children[0].text;

      return {
        comment: text,
        from: thread.metadata["from"],
        to: thread.metadata["to"],
      };
    });

    setAnnotations((old) => {
      return annotations;
    });

    let listener = editor?.on("update", () => {
        console.log("changed")
    })

    return () => {
        listener?.destroy()
    }
  }, []);

  return (
    <>
      <FloatingToolbar editor={editor}>
        {/* you can add an icon here with icon={component} to make it look nicer */}
        <Toolbar.Button
          name={"Annotate"}
          shortcut="CMD-H"
          onClick={newAnnotationHandler}
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
                <div key={comment.id}>
                  <Comment.Body body={comment.body} className={"annotation"} />
                  <button
                    onClick={() => {
                      const response = deleteAnnotation(
                        props.thread.roomId,
                        props.thread.id,
                        comment.id
                      );
                      console.log(response);
                    }}
                  >
                    Delete Annotation
                  </button>
                </div>
              ))}
            </div>
          ),
        }}
      />

      <FloatingComposer
        overrides={{
          COMPOSER_PLACEHOLDER: "Write an annotation...",
        }}
        editor={editor}
        className="floating-composer"
        style={{ width: "350px" }}
        showAttachments={false}
        showFormattingControls={false}
        onComposerSubmit={composerSubmitHandler}
        metadata={{
          // wow this is atrocious with the triple call
          hook: getSelection()["text"],
          from: getSelection()["from"],
          to: getSelection()["to"],
        }}
      />
    </>
  );
}
