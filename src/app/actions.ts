"use server";

import { Liveblocks } from "@liveblocks/node";
import { withProsemirrorDocument } from "@liveblocks/node-prosemirror";

const liveblocks = new Liveblocks({
  secret: process.env.LB_KEY ?? "",
});

const LB_DELETE_COMMENT_URL =
  "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";
const LB_COPY_ROOM =
  "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";

// TODO: probably change the data to be of whatever type captures required context,
// then actually invoke the LLM and return something back to the client.
// TODO: connect to liveblocks stored doc data via https://api.liveblocks.io/v2 endpoint.
// this probably requires a private API key, which is cool cause the use server protects us anyways.
// https://liveblocks.io/docs/api-reference/rest-api-endpoints >> Storage section
export async function prompt(doc_name: string, data: string) {
  console.log(`<PROMPT> ${doc_name} => ${data}`);
  return "from server!";
}

export async function deleteAnnotation(roomId: string, threadId: string, commentId: string) {
  const endpoint = LB_DELETE_COMMENT_URL.replace("{room_id}", roomId)
    .replace("{thread_id}", threadId)
    .replace("{comment_id}", commentId);

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.LB_KEY}`,
    },
  });

  return response;
}

export async function getContents(roomId: string) {
  return await withProsemirrorDocument(
    { roomId: roomId, field: "maindoc", client: liveblocks },
    (api) => {
      const contents = api.getText();
      console.log(contents)
      return contents;
    }
  );
}
