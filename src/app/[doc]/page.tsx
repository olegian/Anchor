"use client";

import { ClientPageRoot } from "next/dist/client/components/client-page";
import { db, fetchDocument } from "../firebase";
import { BaseSyntheticEvent } from "react";
import { useParams } from "next/navigation";
import { Room } from "./Room";
import { Editor } from "./Editor";

export default function DocPage() {
  const params = useParams<{ doc: string }>();

  const get_document = (e: BaseSyntheticEvent) => {
    console.log(e.currentTarget);
    fetchDocument(params.doc).then((a) => {
        console.log(a)
    }).catch((e) => {
        console.log(e)
    })
  };

  return (
    <div className="div">
      <div> DOC_PAGE: {params.doc} </div>
      <Room doc_name={params.doc}>
        <Editor />
      </Room>
    </div>
  );
}
