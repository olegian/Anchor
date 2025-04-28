"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { Editor } from "./Editor";
import { prompt } from "../actions";

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
