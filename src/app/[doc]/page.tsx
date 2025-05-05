"use client";

import { useParams, useRouter } from "next/navigation";
import { Room } from "./Room";
import { Editor } from "./Editor";
import { prompt, takeSnapshot } from "../actions";
import { useRoom } from "@liveblocks/react";
import { Sidebar } from "./Sidebar";

export default function DocPage() {
  const params = useParams<{ doc: string }>();
  return (
    <>
        <div className="editor-container">
            <div> DOC_PAGE: {params.doc} </div>
            <Room doc_name={params.doc}>
                <Editor />
                <Sidebar doc={params.doc} />
            </Room>
        </div>
    </>
  );
}
