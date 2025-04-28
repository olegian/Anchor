"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { Editor } from "./Editor";
import { prompt } from "../actions";

// !FIX: fix the YJS error, there's a double import for YJS somewhere which
// apparently leads to some really shit memory errors. probably add a console.trace
// to the node_modules file and then see where the imports are happening, and resolve that.
// it might also have something to do with server side / client side rendering. if ^ doesnt
// work, look at this.
// TODO: CSS styling
export default function DocPage() {
  const params = useParams<{ doc: string }>();

  const prompt_handler = () => {
    console.log("sending prompt");
    prompt(params.doc, "from client!")
      .then((response) => {
        console.log(`got response: ${response}`);
      })
      .catch((e) => {
        console.error(e);
      });
  };

  return (
    <div className="div">
      <div> DOC_PAGE: {params.doc} </div>
      <Room doc_name={params.doc}>
        <Editor />
      </Room>
      <button onClick={prompt_handler}>Send LLM Request</button>
    </div>
  );
}
