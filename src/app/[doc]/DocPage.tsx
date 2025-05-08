"use client";

import { useParams, useRouter } from "next/navigation";
import { Room } from "./Room";
import { Editor } from "./Editor";
import { prompt } from "../actions";
import { Session } from "next-auth";

export default function DocPage({ session }: { session: Session }) {
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
      <div> DOC_PAGE: {params.doc}, AUTHED AS {session.user?.id} </div>
      <Room doc_name={params.doc} session={session}>
        <Editor />
      </Room>
      <button onClick={prompt_handler}>Send LLM Request</button>
    </div>
  );
}
