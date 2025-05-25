"use server";

import { withProsemirrorDocument } from "@liveblocks/node-prosemirror";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { liveblocks } from "./liveblocks";
import * as Y from "yjs";
import { JsonObject, LiveMap, LiveObject, RoomData } from "@liveblocks/node";
import { PlainLsonObject, toPlainLson } from "@liveblocks/client";
import { allowAccessToRoomId, disallowAccessToRoomId, getAvailableRoomIds } from "./firebase";

const LB_DELETE_COMMENT_URL =
  "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";
const LB_COPY_ROOM =
  "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Store conversation history per snapshot ID
const conversationHistory = new Map<
  string,
  Array<{ role: string; parts: { text: string }[] }>
>();

interface PromptResponse {
  text: string;
  status: "success" | "error";
  message?: string;
}

async function postComment(roomId: string, threadId: string, body: string) {
  const endpoint = `https://api.liveblocks.io/v2/rooms/${roomId}/threads/${threadId}/comments`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.LB_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      body: body,
      metadata: {}, // optional: you could store role here
    }),
  });

  return response.json();
}

async function getConversation(roomId: string, threadId: string) {
  const endpoint = `https://api.liveblocks.io/v2/rooms/${roomId}/threads/${threadId}/comments`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.LB_KEY}`,
    },
  });

  const data = await response.json();
  return data.comments; // array of comments
}

// Function to send a prompt to Gemini and get a response
export async function prompt(
  docId: string,
  handleId: string,
  env?: string
): Promise<PromptResponse> {
  try {
    // lock should have been acquired client side, to stop other clients from sending request
    // TODO: oleg - do the user id association to isPending described in HandleInput.tsx, then update this a little

    // Get document contents to use as context
    // !!! TODO: This call no longer returns just a string, but a JSON string representation of the entire doc contents
    // thats good for keeping all the information within the document, but could complicate the below y-coordinate stuff
    const docContents = await getContents(docId);
    const docStorage = await liveblocks.getStorageDocument(docId, "json");
    const handleInfo = docStorage.docHandles[handleId];
    const { prompt } = handleInfo.exchanges[handleInfo.exchanges.length - 1];
    const y = handleInfo.y; // TODO: write some way to map this y-position to a index into the docContents

    // !!! TODO: This all needs to be rewritten, we no longer have snapshots, just the above information
    // // Get or initialize conversation history for this snapshot
    // if (!conversationHistory.has(snapshotId)) {
    //   conversationHistory.set(snapshotId, []);
    // }

    // const history = conversationHistory.get(snapshotId)!;

    // // Create context string
    // let contextPrompt = `Document Content:\n${docContents}\n\n`;

    // // Add environment variables if provided
    // if (env) {
    //   contextPrompt += `Environment Variables:\n${env}\n\n`;
    // }

    // // Create the complete prompt
    // const fullPrompt = `${contextPrompt}User Query: ${userPrompt}`;

    // // Add user message to history
    // history.push({
    //   role: "user",
    //   parts: [{ text: fullPrompt }],
    // });

    // // Set up Gemini model
    // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // // Create a chat session with history
    // // const chat = model.startChat({
    // //   history,
    // //   generationConfig: {
    // //     maxOutputTokens: 2048,
    // //   },
    // // });
    // const chat = model.startChat({
    //   history,
    //   generationConfig: {
    //     maxOutputTokens: 2048,
    //   },
    //   // Add system instruction to establish persistent context
    //   systemInstruction: {
    //     role: "system",
    //     parts: [
    //       {
    //         text:
    //           `Here is the current document content:\n${docContents}\n\n` +
    //           (env ? `Environment variables:\n${env}\n\n` : ""),
    //       },
    //     ],
    //   },
    // });

    // // Generate response
    // const result = await chat.sendMessage(userPrompt);
    // const response = result.response;
    // const text = response.text();

    // // Add response to history
    // history.push({
    //   role: "model",
    //   parts: [{ text: fullPrompt }],
    // });

    // // Update the conversation history
    // conversationHistory.set(snapshotId, history);

    // // do we need this?
    // // await postComment(doc_name, snapshotId, `User: ${userPrompt}`);
    // // await postComment(doc_name, snapshotId, `Gemini: ${text}`);

    // await liveblocks.mutateStorage(doc_name, ({ root }) => {
    //   const envExchanges = root
    //     .get("snapshots")
    //     .get(snapshotId)
    //     ?.get("conversations")
    //     .get(envId)
    //     ?.get("exchanges");
    //   const exchange = envExchanges?.find((exchange) => {
    //     return exchange.get("prompt") === userPrompt;
    //   }); // this is kind of an inefficient way of finding the associate prompt, it really should be a map but cest la vie for now
    //   if (exchange === undefined) {
    //     throw new Error("Unable to find prompt that resulted in response");
    //   }

    //   exchange.set("response", text);
    // });

    const response = "some sort of LLM response";

    await liveblocks.mutateStorage(docId, ({ root }) => {
      const handleInfo = root.get("docHandles").get(handleId);
      const exchanges = handleInfo?.get("exchanges");

      // this line implies that the exchange object does not change after you hit submit,
      // and therefore you should only append to the exchanges list AFTER the client receives the
      // response from this prompt request
      exchanges?.get(exchanges.length - 1)?.set("response", response);

      // handleInfo?.set("isPending", false);  // oleg: leave this commented out for now, client side should handle it
    });

    return {
      text: response,
      status: "success",
    };
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    return {
      text: "Sorry, there was an error processing your request.",
      status: "error",
      message: (error as Error).message,
    };
  }
}

export async function resetConversation(snapshotId: string): Promise<void> {
  conversationHistory.delete(snapshotId);
}

export async function deleteAnnotation(
  roomId: string,
  threadId: string,
  commentId: string
) {
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
    {
      roomId: roomId,
      field: "maindoc",
      client: liveblocks,
    },
    (api) => {
      const contents = api.toJSON();
      console.log("contents = ");
      return JSON.stringify(contents);
    }
  );
}

// Content updates are now handled directly through the Tiptap editor
// on the client side for better real-time collaboration
export async function invokeAllPrompts(
  doc_name: string,
  snapshotId: string,
  envId: string,
  env?: string
): Promise<string[]> {
  try {
    const docContents = await getContents(doc_name);

    // Match all [[prompt]] blocks with optional following <ai-response>
    const promptRegex =
      /\[\[(.*?)\]\](?:(?!\[\[).)*?(<ai-response>[\s\S]*?<\/ai-response>)?/g;

    const matches = [...docContents.matchAll(promptRegex)];

    const results: string[] = [];

    for (const match of matches) {
      const fullMatch = match[0];
      const promptText = match[1].trim();
      const existingResponse = match[2];

      if (existingResponse) {
        console.log(`Skipping already answered prompt: [[${promptText}]]`);
        continue;
      }

      const response = await prompt(
        doc_name,
        snapshotId
        // promptText,
        // envId,
        // env
      );
      const annotatedResponse = `[[${promptText}]]\n<ai-response>\n${response.text}\n</ai-response>\n`;

      results.push(annotatedResponse);
    }

    return results;
  } catch (error) {
    console.error("Error in invokeAllPrompts:", error);
    return [];
  }
}

export async function deleteSnapshotDoc(roomId: string, snapshotId: string) {
  if (!snapshotId || snapshotId === "maindoc") {
    // just in case cause that would be catastrophic
    return;
  }

  // TODO: this was an attempt to delete the editor contents via the YJS doc stuff. It didnt work, mostly
  // because accessing the actual top level doc is weird, the JsonObject returned by getYjsDocument is just
  // a representation of the actual YDoc. Also the documentation only ever discusses update operations,
  // which means the "delete through nulling" might not even be possible if updates are processed additively.
  //   const oldState = await liveblocks.getYjsDocument(roomId); // could cast into Y.Map and then call .delete, but then how do you construct the binary update with a yDoc object

  //   if (oldState[snapshotId]) {
  //     // again, just in case. Damn am I scared of deletion.
  //     const newYDoc = new Y.Doc(oldState); // create new doc and repopulate?
  //     const yMap = newYDoc.getMap();
  //     Object.keys(oldState)
  //       .filter((id) => id !== snapshotId)
  //       .forEach((id) => {
  //         yMap.set(id, oldState[id])
  //       });

  //     const update = Y.encodeStateAsUpdate(newYDoc);
  //     await liveblocks.sendYjsBinaryUpdate(roomId, update);
  //   }

  // at least this is better than nothing ig, delete contents, but not the doc itself.
  // the UUID entry in the YJS doc will still exist referring to the now empty contents.
  // at least we just leak an empty entry with an ID, as opposed to the whole doc.
  //   await withProsemirrorDocument(
  //     {
  //       roomId: roomId,
  //       field: snapshotId,
  //       client: liveblocks,
  //     },
  //     async (api) => {
  //       // return await api.clearContent(); // TODO: for some reason, this call is erroring out with some internal .set() function being undefined. im baffled.

  //       // return api.update((doc, tr) => {  // You'd think something like this would be the alternative, but same error as above
  //       //   return tr.deleteRange(0, doc.content.size);
  //       // });
  //     }
  //   );
}

export async function createDoc(
  docId: string,
  tempDocTitle: string,
  ownerId: string
) {
  // give access to owner
  await allowAccessToRoomId(ownerId, docId);

  const userPermission: any = {};
  userPermission[ownerId] = ["room:write"];
  const room = await liveblocks.createRoom(docId, {
    defaultAccesses: [],
    usersAccesses: userPermission,
  });

  const initialStorage = toPlainLson(
    new LiveObject({
      docHandles: new LiveMap(),
      docTitle: tempDocTitle,
    })
  ) as PlainLsonObject;

  await liveblocks.initializeStorageDocument(docId, initialStorage);
}

// gives access to userId to access docId
export async function shareDoc(
  docId: string,
  userId: string,
) {
  await allowAccessToRoomId(userId, docId);
}

export async function deleteDoc(docId: string) {
  const room = await liveblocks.getRoom(docId);
  for (const userId in room.usersAccesses) {
    await disallowAccessToRoomId(userId, docId);
  }

  await liveblocks.deleteRoom(docId);
}

export async function getAccessibleRooms(userId: string): Promise<RoomData[]> {
  // TODO: this is not secure lol if anyone can hit this endpoint but idc rn

  // you can filter available rooms via the liveblocks permissions associated with
  // a user id (with liveblocks.getRooms()), but that requires me to fully understand how lb perms work,
  // and I'm not quite there yet, ill swap this shitty work around out later
  const roomIds = await getAvailableRoomIds(userId);
  if (!roomIds) {
    return [];
  }

  const result = await Promise.all(
    roomIds.map(async (roomId: string) => await liveblocks.getRoom(roomId))
  );

  return result;
}

export async function getRoomStorage(roomId: string) {
  const roomStorage = await liveblocks.getStorageDocument(roomId);
  // TODO: bad any type annotation
  const doc: any = await liveblocks.getYjsDocument(roomId, {
    format: true,
  });

  // TODO: Ritesh is REALLY lazy. There's definitely a better way to do this. Hopefully.
  if (doc.maindoc) {
    doc.maindoc = doc.maindoc.replaceAll('<heading level="2">', "<h2>");
    doc.maindoc = doc.maindoc.replaceAll("</heading>", "</h2>");
    doc.maindoc = doc.maindoc.replaceAll("<paragraph>", "<p>");
    doc.maindoc = doc.maindoc.replaceAll("</paragraph>", "</p>");
    doc.maindoc = doc.maindoc.replaceAll("[[", "");
    doc.maindoc = doc.maindoc.replaceAll("]]", "");
    doc.maindoc = doc.maindoc.replaceAll("<p></p>", "");
    doc.maindoc = doc.maindoc.replaceAll(
      '<inlineaicomponent prompt="',
      "<strong>"
    );
    doc.maindoc = doc.maindoc.replaceAll("</inlineaicomponent>", "</strong>");
  }

  return {
    data: roomStorage,
    doc: doc,
  };
}
