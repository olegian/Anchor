"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { Editor } from "./Editor";
import { prompt } from "../actions";
import './styles.css';

// !FIX: fix the YJS error, there's a double import for YJS somewhere which
// ?UPDATE: I think I did this ^^ but I'm really not sure, there wasn't a lot of documentation on the
//          the fix, which involved editing ../next.config.ts to have the serverExternalPackages set for "yjs"
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
    <div className="doc-container">
      <h1 className="doc-title">📝 Collaborative Document: <span className="doc-id">{params.doc}</span></h1>
      
      <div className="editor-wrapper">
        <Room doc_name={params.doc}>
          <Editor />
        </Room>
      </div>

      <button className="prompt-button" onClick={prompt_handler}>
        ✨ Send LLM Request
      </button>
    </div>
  );
}
