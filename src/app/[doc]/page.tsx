"use client";

import { useParams } from "next/navigation";
import { Room } from "./Room";
import { Editor } from "./Editor";
import { prompt } from "../actions";
import ThreadSidebar from "../components/ThreadSidebar";
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
    <div className="doc-container flex h-screen">
      {/* Sidebar with threads */}
      <ThreadSidebar />

      {/* Main content */}
      <div className="flex-1 p-4 flex flex-col">
        <h1 className="text-xl font-bold mb-4">
          📝 Collaborative Document: <span className="doc-id">{params.doc}</span>
        </h1>

        <div className="editor-wrapper border rounded p-4 mb-4 flex-1 overflow-auto bg-white shadow">
          <Room doc_name={params.doc}>
            <Editor />
          </Room>
        </div>

        <button
          className="prompt-button mt-auto self-start bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={prompt_handler}
        >
          ✨ Send LLM Request
        </button>
      </div>
    </div>
  );
}
