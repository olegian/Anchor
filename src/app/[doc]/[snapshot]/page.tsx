"use client";

import { useParams } from "next/navigation";

export default function DocPage() {
  const params = useParams<{ doc: string, snapshot: string }>();

  return (
    <div className="div">
      <div> DOC_PAGE: {params.doc}, snapshot: {params.snapshot}</div>
    </div>
  );
}

