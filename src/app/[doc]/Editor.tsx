"use client";

import {
  useLiveblocksExtension,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Threads } from "./Threads";
import { Annotation, AnnotationMagic } from "tiptap-annotation-magic";
import "../globals.css";

interface ContextSelection {
  label: string;
}

export function Editor() {
  const liveblocks = useLiveblocksExtension();

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        // The Liveblocks extension comes with its own history handling
        history: false,
      }),
      // TODO: This extension is providing more import problems with package annotations-magic
      // and some other package (potentially) both using decorations for different things (i feel like its
      // something in live blocks or one of the other Toolbar things) resulting in cannot read undefined
      // errors. Solution probably inovlves changing some configurations in package.json and locking versions
      // [https://github.com/ueberdosis/tiptap/issues/3869]

      // ? UPDATE: I would pivot to using the mark extension for tiptap, easier to toggle selected highlights,
      // but no way to directly associate data, so just create a map and attach a data-id attribute to the
      // highlight to relate it to some other info. Pop up can include an input box plus a "mark" button,
      // which then turns on the highlight and associates the input content with the highlight color?
      AnnotationMagic<ContextSelection>().configure({
        onAnnotationListChange: (
          annotations: Annotation<ContextSelection>[]
        ) => {
          // on context creation / deletion / mutation
          console.log(`Annotation List Changed: ${annotations}`);
          editor.chain().focus().run();
        },
        onSelectionChange: (
          selectedAnnotations: Annotation<ContextSelection>[]
        ) => {
          // on context creation / deletion / mutation
          // console.log(`Annotation Selection Changed: ${selectedAnnotations}`)
        },
        styles: {
          leftFragment: "fragment-left",
          rightFragment: "fragment-right",
          middleFragment: "fragment-middle",
          normal: "annotation-normal",
        },
      }),
    ],
    immediatelyRender: true,
  });

  const addAnnotationHandler = () => {
    editor
      .chain()
      .focus()
      .addAnnotation({
        label: "test",
      })
      .run();
  };

  return (
    <>
      <div>
        <EditorContent editor={editor} className="editor" />
        <Threads editor={editor} />
        {/* <FloatingToolbar editor={editor} /> */}
      </div>
      <button
        onClick={addAnnotationHandler}
        disabled={!editor.can().addAnnotation({})}
      >
        Add annotation
      </button>
    </>
  );
}
