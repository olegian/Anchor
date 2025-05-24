// "use server";

// import { withProsemirrorDocument } from "@liveblocks/node-prosemirror";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { liveblocks } from "./liveblocks";
// import * as Y from "yjs";
// import { JsonObject } from "@liveblocks/node";

// const LB_DELETE_COMMENT_URL =
//   "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";
// const LB_COPY_ROOM =
//   "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";

// // Initialize Gemini API
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// // Store conversation history per snapshot ID
// const conversationHistory = new Map<
//   string,
//   Array<{ role: string; parts: { text: string }[] }>
// >();

// interface PromptResponse {
//   text: string;
//   status: "success" | "error";
//   message?: string;
// }

// async function postComment(roomId: string, threadId: string, body: string) {
//   const endpoint = `https://api.liveblocks.io/v2/rooms/${roomId}/threads/${threadId}/comments`;

//   const response = await fetch(endpoint, {
//     method: "POST",
//     headers: {
//       Authorization: `Bearer ${process.env.LB_KEY}`,
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       body: body,
//       metadata: {}, // optional: you could store role here
//     }),
//   });

//   return response.json();
// }

// async function getConversation(roomId: string, threadId: string) {
//   const endpoint = `https://api.liveblocks.io/v2/rooms/${roomId}/threads/${threadId}/comments`;

//   const response = await fetch(endpoint, {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer ${process.env.LB_KEY}`,
//     },
//   });

//   const data = await response.json();
//   return data.comments; // array of comments
// }

// // Function to send a prompt to Gemini and get a response
// export async function prompt(
//   docId: string,
//   handleId: string,
//   env?: string
// ): Promise<PromptResponse> {
//   try {
//     // lock should have been acquired client side, to stop other clients from sending request
//     // TODO: oleg - do the user id association to isPending described in HandleInput.tsx, then update this a little 

//     // Get document contents to use as context
//     // !!! TODO: This call no longer returns just a string, but a JSON string representation of the entire doc contents
//     // thats good for keeping all the information within the document, but could complicate the below y-coordinate stuff
//     const docContents = await getContents(docId);
//     const docStorage = await liveblocks.getStorageDocument(docId, "json");
//     const handleInfo = docStorage.docHandles[handleId];
//     const { prompt } = handleInfo.exchanges[handleInfo.exchanges.length - 1];
//     const y = handleInfo.y; // TODO: write some way to map this y-position to a index into the docContents

//     // !!! TODO: This all needs to be rewritten, we no longer have snapshots, just the above information
//     // // Get or initialize conversation history for this snapshot
//     // if (!conversationHistory.has(snapshotId)) {
//     //   conversationHistory.set(snapshotId, []);
//     // }

//     // const history = conversationHistory.get(snapshotId)!;

//     // // Create context string
//     // let contextPrompt = `Document Content:\n${docContents}\n\n`;

//     // // Add environment variables if provided
//     // if (env) {
//     //   contextPrompt += `Environment Variables:\n${env}\n\n`;
//     // }

//     // // Create the complete prompt
//     // const fullPrompt = `${contextPrompt}User Query: ${userPrompt}`;

//     // // Add user message to history
//     // history.push({
//     //   role: "user",
//     //   parts: [{ text: fullPrompt }],
//     // });

//     // // Set up Gemini model
//     // const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

//     // // Create a chat session with history
//     // // const chat = model.startChat({
//     // //   history,
//     // //   generationConfig: {
//     // //     maxOutputTokens: 2048,
//     // //   },
//     // // });
//     // const chat = model.startChat({
//     //   history,
//     //   generationConfig: {
//     //     maxOutputTokens: 2048,
//     //   },
//     //   // Add system instruction to establish persistent context
//     //   systemInstruction: {
//     //     role: "system",
//     //     parts: [
//     //       {
//     //         text:
//     //           `Here is the current document content:\n${docContents}\n\n` +
//     //           (env ? `Environment variables:\n${env}\n\n` : ""),
//     //       },
//     //     ],
//     //   },
//     // });

//     // // Generate response
//     // const result = await chat.sendMessage(userPrompt);
//     // const response = result.response;
//     // const text = response.text();

//     // // Add response to history
//     // history.push({
//     //   role: "model",
//     //   parts: [{ text: fullPrompt }],
//     // });

//     // // Update the conversation history
//     // conversationHistory.set(snapshotId, history);

//     // // do we need this?
//     // // await postComment(doc_name, snapshotId, `User: ${userPrompt}`);
//     // // await postComment(doc_name, snapshotId, `Gemini: ${text}`);

//     // await liveblocks.mutateStorage(doc_name, ({ root }) => {
//     //   const envExchanges = root
//     //     .get("snapshots")
//     //     .get(snapshotId)
//     //     ?.get("conversations")
//     //     .get(envId)
//     //     ?.get("exchanges");
//     //   const exchange = envExchanges?.find((exchange) => {
//     //     return exchange.get("prompt") === userPrompt;
//     //   }); // this is kind of an inefficient way of finding the associate prompt, it really should be a map but cest la vie for now
//     //   if (exchange === undefined) {
//     //     throw new Error("Unable to find prompt that resulted in response");
//     //   }

//     //   exchange.set("response", text);
//     // });


//     const response = "some sort of LLM response";

//     await liveblocks.mutateStorage(docId, ({ root }) => {
//       const handleInfo = root.get("docHandles").get(handleId);
//       const exchanges = handleInfo?.get("exchanges");

//       // this line implies that the exchange object does not change after you hit submit, 
//       // and therefore you should only append to the exchanges list AFTER the client receives the
//       // response from this prompt request
//       exchanges?.get(exchanges.length - 1)?.set("response", response)

//       // handleInfo?.set("isPending", false);  // oleg: leave this commented out for now, client side should handle it
//     });

//     return {
//       text: response,
//       status: "success",
//     };
//   } catch (error) {
//     console.error("Error in Gemini API call:", error);
//     return {
//       text: "Sorry, there was an error processing your request.",
//       status: "error",
//       message: (error as Error).message,
//     };
//   }
// }

// export async function resetConversation(snapshotId: string): Promise<void> {
//   conversationHistory.delete(snapshotId);
// }

// export async function deleteAnnotation(
//   roomId: string,
//   threadId: string,
//   commentId: string
// ) {
//   const endpoint = LB_DELETE_COMMENT_URL.replace("{room_id}", roomId)
//     .replace("{thread_id}", threadId)
//     .replace("{comment_id}", commentId);

//   const response = await fetch(endpoint, {
//     method: "DELETE",
//     headers: {
//       Authorization: `Bearer ${process.env.LB_KEY}`,
//     },
//   });

//   return response;
// }

// export async function getContents(roomId: string) {
//   return await withProsemirrorDocument(
//     {
//       roomId: roomId,
//       field: "maindoc",
//       client: liveblocks,
//     },
//     (api) => {
//       const contents = api.toJSON();
//       console.log("contents = ");
//       return JSON.stringify(contents);
//     }
//   );
// }

// // Content updates are now handled directly through the Tiptap editor
// // on the client side for better real-time collaboration
// export async function invokeAllPrompts(
//   doc_name: string,
//   snapshotId: string,
//   envId: string,
//   env?: string
// ): Promise<string[]> {
//   try {
//     const docContents = await getContents(doc_name);

//     // Match all [[prompt]] blocks with optional following <ai-response>
//     const promptRegex =
//       /\[\[(.*?)\]\](?:(?!\[\[).)*?(<ai-response>[\s\S]*?<\/ai-response>)?/g;

//     const matches = [...docContents.matchAll(promptRegex)];

//     const results: string[] = [];

//     for (const match of matches) {
//       const fullMatch = match[0];
//       const promptText = match[1].trim();
//       const existingResponse = match[2];

//       if (existingResponse) {
//         console.log(`Skipping already answered prompt: [[${promptText}]]`);
//         continue;
//       }

//       const response = await prompt(
//         doc_name,
//         snapshotId,
//         // promptText,
//         // envId,
//         // env
//       );
//       const annotatedResponse = `[[${promptText}]]\n<ai-response>\n${response.text}\n</ai-response>\n`;

//       results.push(annotatedResponse);
//     }

//     return results;
//   } catch (error) {
//     console.error("Error in invokeAllPrompts:", error);
//     return [];
//   }
// }

// export async function deleteSnapshotDoc(roomId: string, snapshotId: string) {
//   if (!snapshotId || snapshotId === "maindoc") {
//     // just in case cause that would be catastrophic
//     return;
//   }

//   // TODO: this was an attempt to delete the editor contents via the YJS doc stuff. It didnt work, mostly
//   // because accessing the actual top level doc is weird, the JsonObject returned by getYjsDocument is just
//   // a representation of the actual YDoc. Also the documentation only ever discusses update operations,
//   // which means the "delete through nulling" might not even be possible if updates are processed additively.
//   //   const oldState = await liveblocks.getYjsDocument(roomId); // could cast into Y.Map and then call .delete, but then how do you construct the binary update with a yDoc object

//   //   if (oldState[snapshotId]) {
//   //     // again, just in case. Damn am I scared of deletion.
//   //     const newYDoc = new Y.Doc(oldState); // create new doc and repopulate?
//   //     const yMap = newYDoc.getMap();
//   //     Object.keys(oldState)
//   //       .filter((id) => id !== snapshotId)
//   //       .forEach((id) => {
//   //         yMap.set(id, oldState[id])
//   //       });

//   //     const update = Y.encodeStateAsUpdate(newYDoc);
//   //     await liveblocks.sendYjsBinaryUpdate(roomId, update);
//   //   }

//   // at least this is better than nothing ig, delete contents, but not the doc itself.
//   // the UUID entry in the YJS doc will still exist referring to the now empty contents.
//   // at least we just leak an empty entry with an ID, as opposed to the whole doc.
//   //   await withProsemirrorDocument(
//   //     {
//   //       roomId: roomId,
//   //       field: snapshotId,
//   //       client: liveblocks,
//   //     },
//   //     async (api) => {
//   //       // return await api.clearContent(); // TODO: for some reason, this call is erroring out with some internal .set() function being undefined. im baffled.

//   //       // return api.update((doc, tr) => {  // You'd think something like this would be the alternative, but same error as above
//   //       //   return tr.deleteRange(0, doc.content.size);
//   //       // });
//   //     }
//   //   );
// }

// export async function createDoc(tempDocTitle: string) {
//   // if we want to do something with registering user permissions on doc creation
//   // it would have to be done here
// }
"use server";

import { withProsemirrorDocument } from "@liveblocks/node-prosemirror";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { liveblocks } from "./liveblocks";
import { LiveObject } from "@liveblocks/client";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// Store conversation history per handle ID
const conversationHistory = new Map<
  string,
  Array<{ role: string; parts: { text: string }[] }>
>();

interface PromptResponse {
  text: string;
  status: "success" | "error";
  message?: string;
}

interface DocumentContext {
  content: string;
  contextType: "word" | "paragraph" | "document";
}

// Parse ProseMirror JSON to extract text content and create context mapping
function parseDocumentContent(docJson: any): {
  fullText: string;
  paragraphs: Array<{ content: string; startPos: number; endPos: number }>;
  words: Array<{ content: string; startPos: number; endPos: number; paragraphIndex: number }>;
} {
  const paragraphs: Array<{ content: string; startPos: number; endPos: number }> = [];
  const words: Array<{ content: string; startPos: number; endPos: number; paragraphIndex: number }> = [];
  let fullText = "";
  let currentPos = 0;

  function traverseNode(node: any) {
    if (node.type === "paragraph") {
      const paragraphStart = currentPos;
      let paragraphText = "";
      let paragraphWords: Array<{ content: string; startPos: number; endPos: number }> = [];

      if (node.content) {
        node.content.forEach((child: any) => {
          if (child.type === "text" && child.text) {
            const text = child.text;
            paragraphText += text;
            
            // Split text into words while preserving positions
            const wordMatches = [...text.matchAll(/\S+/g)];
            wordMatches.forEach(match => {
              if (match.index !== undefined) {
                const wordStart = currentPos + match.index;
                const wordEnd = wordStart + match[0].length;
                paragraphWords.push({
                  content: match[0],
                  startPos: wordStart,
                  endPos: wordEnd
                });
              }
            });
            
            currentPos += text.length;
          }
        });
      }

      if (paragraphText.trim()) {
        const paragraphEnd = currentPos;
        paragraphs.push({
          content: paragraphText,
          startPos: paragraphStart,
          endPos: paragraphEnd
        });

        // Add paragraph words to global words array
        paragraphWords.forEach(word => {
          words.push({
            ...word,
            paragraphIndex: paragraphs.length - 1
          });
        });
      }

      fullText += paragraphText + "\n";
      currentPos += 1; // Account for paragraph break
    } else if (node.content) {
      node.content.forEach(traverseNode);
    }
  }

  if (docJson.content) {
    docJson.content.forEach(traverseNode);
  }

  return { fullText: fullText.trim(), paragraphs, words };
}

// Map Y position to document context
// function getDocumentContext(
//   yPosition: number | undefined,
//   xPosition: number | undefined,
//   contextType: "word" | "paragraph" | "document",
//   parsedDoc: ReturnType<typeof parseDocumentContent>
// ): DocumentContext {
//   // If no position specified or contextType is document, return full document
//   if (yPosition === undefined || contextType === "document") {
//     return {
//       content: parsedDoc.fullText,
//       contextType: "document"
//     };
//   }

//   // For paragraph context
//   if (contextType === "paragraph") {
//     // Find the paragraph that contains this Y position
//     // This is a simplified mapping - in real implementation, you'd need to map
//     // Y coordinates to actual paragraph positions in the rendered document
//     const paragraphIndex = Math.floor(yPosition / 50); // Approximate line height
//     const targetParagraph = parsedDoc.paragraphs[paragraphIndex];
    
//     if (targetParagraph) {
//       return {
//         content: targetParagraph.content,
//         contextType: "paragraph"
//       };
//     }
//   }

//   // For word context
//   if (contextType === "word" && xPosition !== undefined) {
//     // Find the word at the given position
//     // This would need more sophisticated mapping in real implementation
//     const paragraphIndex = Math.floor(yPosition / 50);
//     const wordsInParagraph = parsedDoc.words.filter(w => w.paragraphIndex === paragraphIndex);
    
//     if (wordsInParagraph.length > 0) {
//       // Simple approximation - map X position to word index
//       const wordIndex = Math.floor((xPosition / 10)) % wordsInParagraph.length;
//       const targetWord = wordsInParagraph[wordIndex];
      
//       if (targetWord) {
//         return {
//           content: targetWord.content,
//           contextType: "word"
//         };
//       }
//     }
//   }

//   // Fallback to document context
//   return {
//     content: parsedDoc.fullText,
//     contextType: "document"
//   };
// }
function getDocumentContext(
  yPosition: number | undefined,
  xPosition: number | undefined,
  contextType: "word" | "paragraph" | "document",
  parsedDoc: ReturnType<typeof parseDocumentContent>
): DocumentContext {
  if (yPosition === undefined || contextType === "document") {
    return {
      content: parsedDoc.fullText,
      contextType: "document"
    };
  }

  const paragraphIndex = Math.floor(yPosition / 50); // Simplified mapping

  if (contextType === "paragraph") {
    const targetParagraph = parsedDoc.paragraphs[paragraphIndex];
    console.log("target paragraph = " + targetParagraph);
    if (targetParagraph) {
      return {
        content: targetParagraph.content,
        contextType: "paragraph"
      };
    }
  }

  if (contextType === "word" && xPosition !== undefined) {
    const wordsInParagraph = parsedDoc.words.filter(w => w.paragraphIndex === paragraphIndex);
    if (wordsInParagraph.length > 0) {
      const wordIndex = Math.floor(xPosition / 10) % wordsInParagraph.length;
      const targetWord = wordsInParagraph[wordIndex];
      if (targetWord) {
        return {
          content: targetWord.content,
          contextType: "word"
        };
      }
    }
  }

  return {
    content: parsedDoc.fullText,
    contextType: "document"
  };
}


// Main prompt function
export async function prompt(
  docId: string,
  handleId: string,
  env?: string
): Promise<PromptResponse> {
  try {
    docId = "bc8eb889-6d61-4bd9-9389-7d84558c8685";
    // Get document contents and storage
    //const docContents = await getContents(docId);
    const docContents = await getContents("bc8eb889-6d61-4bd9-9389-7d84558c8685");
    const docStorage = await liveblocks.getStorageDocument(docId, "json");
    const handleInfo = docStorage.docHandles[handleId];
    
    if (!handleInfo) {
      throw new Error(`Handle ${handleId} not found`);
    }

    const { prompt: userPrompt } = handleInfo.exchanges[handleInfo.exchanges.length - 1];
    const yPosition = handleInfo.y;
    const xPosition = handleInfo.x;
    
    // Parse document content
    const docJson = JSON.parse(docContents);
    const parsedDoc = parseDocumentContent(docJson);
    
    // Determine context type based on handle position (this would come from client)
    // For now, using a simple heuristic based on position
    let contextType: "word" | "paragraph" | "document" = "document";
    if (yPosition !== undefined) {
      if (xPosition !== undefined && Math.abs(xPosition) < 50) {
        contextType = "word";
      } else if (Math.abs(xPosition || 0) < 200) {
        contextType = "paragraph";
      }
    }
    console.log("context type = " + contextType);
    
    // Get appropriate context
    const documentContext = getDocumentContext(yPosition, xPosition, contextType, parsedDoc);
    
    // Get or initialize conversation history for this handle
    if (!conversationHistory.has(handleId)) {
      conversationHistory.set(handleId, []);
    }
    const history = conversationHistory.get(handleId)!;

    // Create context-aware prompt
    // let contextPrompt = "";
    // switch (documentContext.contextType) {
    //   case "word":
    //     contextPrompt = `Focus on this word: "${documentContext.content}"\n\nFull document context:\n${parsedDoc.fullText}\n\n`;
    //     break;
    //   case "paragraph":
    //     contextPrompt = `Focus on this paragraph:\n"${documentContext.content}"\n\nFull document context:\n${parsedDoc.fullText}\n\n`;
    //     break;
    //   case "document":
    //     contextPrompt = `Document content:\n${documentContext.content}\n\n`;
    //     break;
    // }

    // // Add environment variables if provided
    // if (env) {
    //   contextPrompt += `Environment Variables:\n${env}\n\n`;
    // }

    // // Create the complete prompt
    // const fullPrompt = `${contextPrompt}User Query: ${userPrompt}`;
    let contextPrompt = "";
    switch (documentContext.contextType) {
      case "word":
        contextPrompt = `Focus on this word: "${documentContext.content}"`;
        break;
      case "paragraph":
        contextPrompt = `Focus only on this paragraph:\n"${documentContext.content}"`;
        break;
      case "document":
        contextPrompt = `Document content:\n${documentContext.content}`;
        break;
    }

    if (env) {
      contextPrompt += `\n\nEnvironment Variables:\n${env}`;
    }

    const fullPrompt = `${contextPrompt}\n\nUser Query: ${userPrompt}`;


    // Add user message to history
    history.push({
      role: "user",
      parts: [{ text: fullPrompt }],
    });

    // Set up Gemini model with system instruction
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: {
        role: "system",
        parts: [{
          text: `You are a helpful AI assistant analyzing a document. When responding to queries, consider the specific context provided (word, paragraph, or full document) and tailor your response accordingly. Be concise but thorough.`
        }]
      }
    });

    // Create chat session with history
    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 2048,
      },
    });

    // Generate response
    const result = await chat.sendMessage(userPrompt);
    const response = result.response;
    const text = response.text();
    console.log("response text = " + text);

    // Add response to history
    history.push({
      role: "model",
      parts: [{ text }],
    });

    // Update conversation history
    conversationHistory.set(handleId, history);

    // Update storage with response
    await liveblocks.mutateStorage(docId, ({ root }) => {
      const handleInfo = root.get("docHandles").get(handleId);
      const exchanges = handleInfo?.get("exchanges");
      
      if (exchanges && exchanges.length > 0) {
        exchanges.get(exchanges.length - 1)?.set("response", text);
      }
    });

    return {
      text,
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

export async function resetConversation(handleId: string): Promise<void> {
  conversationHistory.delete(handleId);
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
      return JSON.stringify(contents);
    }
  );
}

// Helper function to create a new conversation exchange
export async function createExchange(
  docId: string,
  handleId: string,
  promptText: string
): Promise<void> {
  docId = "bc8eb889-6d61-4bd9-9389-7d84558c8685"
  await liveblocks.mutateStorage(docId, ({ root }) => {
    const handleInfo = root.get("docHandles").get(handleId);
    const exchanges = handleInfo?.get("exchanges");

    if (exchanges) {
      exchanges.push(
        new LiveObject({
          prompt: promptText,
          response: "",
          timestamp: Date.now(),
        })
      );
    }
  });
}

// Clean up old conversations to prevent memory leaks
export async function cleanupOldConversations(): Promise<void> {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const cutoff = Date.now() - maxAge;
  
  for (const [handleId, history] of conversationHistory.entries()) {
    // Simple cleanup - remove conversations older than 24 hours
    // In a real app, you might want to store timestamps with conversations
    if (history.length === 0) {
      conversationHistory.delete(handleId);
    }
  }
}

// Legacy functions for compatibility
export async function deleteAnnotation(
  roomId: string,
  threadId: string,
  commentId: string
) {
  const endpoint = `https://api.liveblocks.io/v2/rooms/${roomId}/threads/${threadId}/comments/${commentId}`;

  const response = await fetch(endpoint, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${process.env.LB_KEY}`,
    },
  });

  return response;
}

export async function invokeAllPrompts(
  docId: string,
  handleId: string,
  env?: string
): Promise<string[]> {
  try {
    const response = await prompt(docId, handleId, env);
    return response.status === "success" ? [response.text] : [];
  } catch (error) {
    console.error("Error in invokeAllPrompts:", error);
    return [];
  }
}

export async function createDoc(tempDocTitle: string) {
  // Document creation logic would go here
  // This might involve setting up initial storage structure, permissions, etc.
}