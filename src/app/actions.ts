// "use server";

// import { withProsemirrorDocument } from "@liveblocks/node-prosemirror";
// import { GoogleGenerativeAI } from "@google/generative-ai";
// import { liveblocks } from "./liveblocks";
// import { LiveObject } from "@liveblocks/client";

// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");

// // Store conversation history per handle ID
// const conversationHistory = new Map<
//   string,
//   Array<{ role: string; parts: { text: string }[] }>
// >();

// interface PromptResponse {
//   text: string;
//   status: "success" | "error";
//   message?: string;
// }

// interface DocumentContext {
//   content: string;
//   contextType: "word" | "paragraph" | "document";
// }

// // Parse ProseMirror JSON to extract text content and create context mapping
// function parseDocumentContent(docJson: any): {
//   fullText: string;
//   paragraphs: Array<{ content: string; startPos: number; endPos: number; index: number }>;
//   words: Array<{ content: string; startPos: number; endPos: number; paragraphIndex: number }>;
// } {
//   const paragraphs: Array<{ content: string; startPos: number; endPos: number; index: number }> = [];
//   const words: Array<{ content: string; startPos: number; endPos: number; paragraphIndex: number }> = [];
//   let fullText = "";
//   let currentPos = 0;
//   let paragraphIndex = 0;

//   function traverseNode(node: any) {
//     if (node.type === "paragraph") {
//       const paragraphStart = currentPos;
//       let paragraphText = "";
//       let paragraphWords: Array<{ content: string; startPos: number; endPos: number }> = [];

//       if (node.content) {
//         node.content.forEach((child: any) => {
//           if (child.type === "text" && child.text) {
//             const text = child.text;
//             paragraphText += text;
            
//             // Split text into words while preserving positions
//             const wordMatches = [...text.matchAll(/\S+/g)];
//             wordMatches.forEach(match => {
//               if (match.index !== undefined) {
//                 const wordStart = currentPos + match.index;
//                 const wordEnd = wordStart + match[0].length;
//                 paragraphWords.push({
//                   content: match[0],
//                   startPos: wordStart,
//                   endPos: wordEnd
//                 });
//               }
//             });
            
//             currentPos += text.length;
//           }
//         });
//       }

//       if (paragraphText.trim()) {
//         const paragraphEnd = currentPos;
//         paragraphs.push({
//           content: paragraphText.trim(),
//           startPos: paragraphStart,
//           endPos: paragraphEnd,
//           index: paragraphIndex
//         });

//         // Add paragraph words to global words array
//         paragraphWords.forEach(word => {
//           words.push({
//             ...word,
//             paragraphIndex: paragraphIndex
//           });
//         });

//         paragraphIndex++;
//       }

//       fullText += paragraphText + "\n";
//       currentPos += 1; // Account for paragraph break
//     } else if (node.content) {
//       node.content.forEach(traverseNode);
//     }
//   }

//   if (docJson.content) {
//     docJson.content.forEach(traverseNode);
//   }

//   return { fullText: fullText.trim(), paragraphs, words };
// }

// // Updated function to properly map positions to document context
// function getDocumentContext(
//   yPosition: number | undefined,
//   xPosition: number | undefined,
//   contextType: "word" | "paragraph" | "document",
//   parsedDoc: ReturnType<typeof parseDocumentContent>
// ): DocumentContext {
//   console.log(`Getting context for position (${xPosition}, ${yPosition}) with type ${contextType}`);
  
//   if (yPosition === undefined || contextType === "document") {
//     return {
//       content: parsedDoc.fullText,
//       contextType: "document"
//     };
//   }

//   // More accurate paragraph mapping based on actual document structure
//   // Assuming each paragraph has roughly 50px height (you can adjust this based on your UI)
//   const estimatedParagraphHeight = 50;
//   const paragraphIndex = Math.floor(Math.abs(yPosition) / estimatedParagraphHeight);
  
//   console.log(`Calculated paragraph index: ${paragraphIndex} from yPosition: ${yPosition}`);
//   console.log(`Total paragraphs available: ${parsedDoc.paragraphs.length}`);

//   if (contextType === "paragraph") {
//     // Ensure we have a valid paragraph index
//     if (paragraphIndex >= 0 && paragraphIndex < parsedDoc.paragraphs.length) {
//       const targetParagraph = parsedDoc.paragraphs[paragraphIndex];
//       console.log(`Found target paragraph: "${targetParagraph.content}"`);
      
//       return {
//         content: targetParagraph.content,
//         contextType: "paragraph"
//       };
//     } else {
//       console.log(`Paragraph index ${paragraphIndex} out of bounds, falling back to document`);
//       // If paragraph index is out of bounds, fall back to document context
//       return {
//         content: parsedDoc.fullText,
//         contextType: "document"
//       };
//     }
//   }

//   if (contextType === "word" && xPosition !== undefined) {
//     const wordsInParagraph = parsedDoc.words.filter(w => w.paragraphIndex === paragraphIndex);
//     if (wordsInParagraph.length > 0) {
//       // Better word mapping - approximate character width
//       const avgCharWidth = 8; // pixels per character (approximate)
//       const charPosition = Math.floor(Math.abs(xPosition) / avgCharWidth);
      
//       // Find word at character position
//       let targetWord = wordsInParagraph[0]; // default to first word
//       for (const word of wordsInParagraph) {
//         const relativeStart = word.startPos - parsedDoc.paragraphs[paragraphIndex].startPos;
//         const relativeEnd = word.endPos - parsedDoc.paragraphs[paragraphIndex].startPos;
        
//         if (charPosition >= relativeStart && charPosition <= relativeEnd) {
//           targetWord = word;
//           break;
//         }
//       }
      
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

// // Updated main prompt function to accept position parameters
// export async function prompt(
//   docId: string,
//   handleId: string,
//   xPosition?: number,
//   yPosition?: number,
//   env?: string
// ): Promise<PromptResponse> {
//   try {
//     // Get document contents and storage
//     const docContents = await getContents(docId);
//     const docStorage = await liveblocks.getStorageDocument(docId, "json");
//     const handleInfo = docStorage.docHandles[handleId];
    
//     if (!handleInfo) {
//       throw new Error(`Handle ${handleId} not found`);
//     }

//     const { prompt: userPrompt } = handleInfo.exchanges[handleInfo.exchanges.length - 1];
//     // TODO: you have these available now, if theyre helpful, note if the handle is on a paragraph
//     // but not a word, then wordIdx is -1, same reasoning for if the handle is not on anything, then
//     // -1, -1 for both. apologize in advance for it not being undefined, but that plays better with livestorage
//     // (this is to say that you can determine what like granularity you want to focus on)
//     const paragraphIdx = handleInfo.paragraphIdx;  // i think this can directly index the docContents json string
//     const wordIdx = handleInfo.wordIdx;
    
//     // Use passed positions or fall back to stored positions
//     const finalYPosition = yPosition !== undefined ? yPosition : handleInfo.y;
//     const finalXPosition = xPosition !== undefined ? xPosition : handleInfo.x;
    
//     console.log(`Using position: x=${finalXPosition}, y=${finalYPosition}`);
    
//     // Parse document content
//     const docJson = JSON.parse(docContents);
//     const parsedDoc = parseDocumentContent(docJson);
    
//     console.log(`Parsed document with ${parsedDoc.paragraphs.length} paragraphs`);
//     parsedDoc.paragraphs.forEach((p, i) => {
//       console.log(`Paragraph ${i}: "${p.content.substring(0, 50)}..."`);
//     });
    
//     // Determine context type based on handle position
//     let contextType: "word" | "paragraph" | "document" = "document";
//     if (finalYPosition !== undefined) {
//       if (finalXPosition !== undefined && Math.abs(finalXPosition) < 100) {
//         contextType = "word";
//       } else {
//         contextType = "paragraph";
//       }
//     }
    
//     console.log(`Determined context type: ${contextType}`);
    
//     // Get appropriate context
//     const documentContext = getDocumentContext(finalYPosition, finalXPosition, contextType, parsedDoc);
    
//     console.log(`Final context: ${documentContext.contextType} - "${documentContext.content.substring(0, 100)}..."`);
    
//     // Get or initialize conversation history for this handle
//     if (!conversationHistory.has(handleId)) {
//       conversationHistory.set(handleId, []);
//     }
//     const history = conversationHistory.get(handleId)!;

//     // Create context-aware prompt
//     let contextPrompt = "";
//     switch (documentContext.contextType) {
//       case "word":
//         contextPrompt = `Focus on this word: "${documentContext.content}"`;
//         break;
//       case "paragraph":
//         contextPrompt = `Focus specifically on this paragraph:\n"${documentContext.content}"`;
//         break;
//       case "document":
//         contextPrompt = `Document content:\n${documentContext.content}`;
//         break;
//     }

//     if (env) {
//       contextPrompt += `\n\nEnvironment Variables:\n${env}`;
//     }

//     const fullPrompt = `${contextPrompt}\n\nUser Query: ${userPrompt}`;

//     // Add user message to history
//     history.push({
//       role: "user",
//       parts: [{ text: fullPrompt }],
//     });

//     // Set up Gemini model with system instruction
//     const model = genAI.getGenerativeModel({
//       model: "gemini-1.5-flash",
//       systemInstruction: {
//         role: "system",
//         parts: [{
//           text: `You are a helpful AI assistant analyzing a document. When responding to queries, consider the specific context provided (word, paragraph, or full document) and tailor your response accordingly. 

// When focusing on a paragraph, discuss only that specific paragraph and its content. When focusing on a word, discuss that word in the context of its paragraph. When given the full document, you can discuss the entire document.

// Be concise but thorough in your analysis.`
//         }]
//       }
//     });

//     // Create chat session with history
//     const chat = model.startChat({
//       history,
//       generationConfig: {
//         maxOutputTokens: 2048,
//       },
//     });

//     // Generate response
//     const result = await chat.sendMessage(userPrompt);
//     const response = result.response;
//     const text = response.text();
//     console.log("response text = " + text);

//     // Add response to history
//     history.push({
//       role: "model",
//       parts: [{ text }],
//     });

//     // Update conversation history
//     conversationHistory.set(handleId, history);

//     // Update storage with response
//     await liveblocks.mutateStorage(docId, ({ root }) => {
//       const handleInfo = root.get("docHandles").get(handleId);
//       const exchanges = handleInfo?.get("exchanges");
      
//       if (exchanges && exchanges.length > 0) {
//         exchanges.get(exchanges.length - 1)?.set("response", text);
//       }
//     });

//     return {
//       text,
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

// // Rest of the functions remain the same...
// export async function resetConversation(handleId: string): Promise<void> {
//   conversationHistory.delete(handleId);
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
//       return JSON.stringify(contents);
//     }
//   );
// }

// export async function createExchange(
//   docId: string,
//   handleId: string,
//   promptText: string
// ): Promise<void> {
//   docId = "bc8eb889-6d61-4bd9-9389-7d84558c8685"
//   await liveblocks.mutateStorage(docId, ({ root }) => {
//     const handleInfo = root.get("docHandles").get(handleId);
//     const exchanges = handleInfo?.get("exchanges");

//     if (exchanges) {
//       exchanges.push(
//         new LiveObject({
//           prompt: promptText,
//           response: "",
//           timestamp: Date.now(),
//         })
//       );
//     }
//   });
// }

// export async function cleanupOldConversations(): Promise<void> {
//   const maxAge = 24 * 60 * 60 * 1000; // 24 hours
//   const cutoff = Date.now() - maxAge;
  
//   for (const [handleId, history] of conversationHistory.entries()) {
//     if (history.length === 0) {
//       conversationHistory.delete(handleId);
//     }
//   }
// }

// export async function deleteAnnotation(
//   roomId: string,
//   threadId: string,
//   commentId: string
// ) {
//   const endpoint = `https://api.liveblocks.io/v2/rooms/${roomId}/threads/${threadId}/comments/${commentId}`;

//   const response = await fetch(endpoint, {
//     method: "DELETE",
//     headers: {
//       Authorization: `Bearer ${process.env.LB_KEY}`,
//     },
//   });

//   return response;
// }

// export async function invokeAllPrompts(
//   docId: string,
//   handleId: string,
//   env?: string
// ): Promise<string[]> {
//   try {
//     const response = await prompt(docId, handleId, undefined, undefined, env);
//     return response.status === "success" ? [response.text] : [];
//   } catch (error) {
//     console.error("Error in invokeAllPrompts:", error);
//     return [];
//   }
// }

// export async function createDoc(tempDocTitle: string) {
//   // Document creation logic would go here
// }

// // export async function insertTextAtPosition(
// //   docId: string,
// //   text: string,
// //   xPosition: number,
// //   yPosition: number,
// //   contextType: "word" | "paragraph" | "document"
// // ): Promise<void> {
// //   try {
// //     docId = "bc8eb889-6d61-4bd9-9389-7d84558c8685"; // Your hardcoded docId
    
// //     // Get the current document content
// //     const docContents = await getContents(docId);
// //     const docJson = JSON.parse(docContents);
// //     const parsedDoc = parseDocumentContent(docJson);
    
// //     // Calculate insertion position based on context type and coordinates
// //     let insertionPos = 0;
    
// //     if (contextType === "document") {
// //       // Insert at the end of the document
// //       insertionPos = docJson.size || 0;
// //     } else if (contextType === "paragraph") {
// //       // Find the paragraph based on Y position
// //       const estimatedParagraphHeight = 50;
// //       const paragraphIndex = Math.floor(Math.abs(yPosition) / estimatedParagraphHeight);
      
// //       if (paragraphIndex >= 0 && paragraphIndex < parsedDoc.paragraphs.length) {
// //         // Insert after the paragraph
// //         insertionPos = parsedDoc.paragraphs[paragraphIndex].endPos + 1;
// //       } else {
// //         // Fallback to end of document
// //         insertionPos = docJson.size || 0;
// //       }
// //     } else if (contextType === "word") {
// //       // Find the specific word position
// //       const estimatedParagraphHeight = 50;
// //       const paragraphIndex = Math.floor(Math.abs(yPosition) / estimatedParagraphHeight);
      
// //       if (paragraphIndex >= 0 && paragraphIndex < parsedDoc.paragraphs.length) {
// //         const wordsInParagraph = parsedDoc.words.filter(w => w.paragraphIndex === paragraphIndex);
        
// //         if (wordsInParagraph.length > 0) {
// //           const avgCharWidth = 8;
// //           const charPosition = Math.floor(Math.abs(xPosition) / avgCharWidth);
          
// //           // Find the word at the approximate position
// //           let targetWord = wordsInParagraph[0];
// //           for (const word of wordsInParagraph) {
// //             const relativeStart = word.startPos - parsedDoc.paragraphs[paragraphIndex].startPos;
// //             const relativeEnd = word.endPos - parsedDoc.paragraphs[paragraphIndex].startPos;
            
// //             if (charPosition >= relativeStart && charPosition <= relativeEnd) {
// //               targetWord = word;
// //               break;
// //             }
// //           }
          
// //           // Insert after the word
// //           insertionPos = targetWord.endPos + 1;
// //         } else {
// //           // Fallback to paragraph end
// //           insertionPos = parsedDoc.paragraphs[paragraphIndex].endPos + 1;
// //         }
// //       } else {
// //         // Fallback to end of document
// //         insertionPos = docJson.size || 0;
// //       }
// //     }
    
// //     // Use Liveblocks to insert the text at the calculated position
// //     await liveblocks.mutateDocument(docId, "maindoc", (api) => {
// //       // Create a new paragraph with the inserted text
// //       const insertText = contextType === "word" ? ` ${text}` : `\n\n${text}\n\n`;
      
// //       // Insert the text at the calculated position
// //       api.insertText(insertionPos, insertText);
// //     });
    
// //     console.log(`Inserted text at position ${insertionPos} with context ${contextType}`);
    
// //   } catch (error) {
// //     console.error("Error inserting text:", error);
// //     throw error;
// //   }
// // }
// export async function insertTextAtPosition(
//   docId: string,
//   text: string,
//   xPosition: number,
//   yPosition: number,
//   contextType: "word" | "paragraph" | "document"
// ): Promise<void> {
//   try {
//     // Get the current document content
//     const docContents = await getContents(docId);
//     const docJson = JSON.parse(docContents);
//     const parsedDoc = parseDocumentContent(docJson);

//     // Calculate insertion position based on context type and coordinates
//     let insertionPos: number;

//     switch (contextType) {
//       case "word": {
//         // For word context, insert at the word position
//         const estimatedParagraphHeight = 50;
//         const paragraphIndex = Math.floor(Math.abs(yPosition) / estimatedParagraphHeight);
        
//         if (paragraphIndex >= 0 && paragraphIndex < parsedDoc.paragraphs.length) {
//           const paragraph = parsedDoc.paragraphs[paragraphIndex];
//           const wordsInParagraph = parsedDoc.words.filter(w => w.paragraphIndex === paragraphIndex);
          
//           if (wordsInParagraph.length > 0) {
//             // Find approximate word position based on x coordinate
//             const avgCharWidth = 8;
//             const charPosition = Math.floor(Math.abs(xPosition) / avgCharWidth);
            
//             // Find the closest word
//             let targetWord = wordsInParagraph[0];
//             for (const word of wordsInParagraph) {
//               const relativeStart = word.startPos - paragraph.startPos;
//               if (charPosition >= relativeStart) {
//                 targetWord = word;
//               } else {
//                 break;
//               }
//             }
            
//             // Insert after the target word
//             insertionPos = targetWord.endPos + 1;
//           } else {
//             // Fallback to end of paragraph
//             insertionPos = paragraph.endPos;
//           }
//         } else {
//           // Fallback to end of document
//           insertionPos = parsedDoc.fullText.length;
//         }
//         break;
//       }

//       case "paragraph": {
//         // For paragraph context, insert at the end of the paragraph
//         const estimatedParagraphHeight = 50;
//         const paragraphIndex = Math.floor(Math.abs(yPosition) / estimatedParagraphHeight);
        
//         if (paragraphIndex >= 0 && paragraphIndex < parsedDoc.paragraphs.length) {
//           const paragraph = parsedDoc.paragraphs[paragraphIndex];
//           insertionPos = paragraph.endPos;
//         } else {
//           // Fallback to end of document
//           insertionPos = parsedDoc.fullText.length;
//         }
//         break;
//       }

//       case "document":
//       default: {
//         // For document context, insert at the end
//         insertionPos = parsedDoc.fullText.length;
//         break;
//       }
//     }

//     // Use Liveblocks ProseMirror integration to insert text
//     await liveblocks.mutateDocument(docId, "maindoc", (tr, schema) => {
//       // Create a text node with the AI response
//       const textNode = schema.text(text);
      
//       // Insert the text at the calculated position
//       // Note: You might need to adjust this based on your ProseMirror schema
//       tr.insert(insertionPos, textNode);
      
//       return tr;
//     });

//     console.log(`Successfully inserted text at position ${insertionPos} with context: ${contextType}`);
//   } catch (error) {
//     console.error("Error inserting text:", error);
//     throw error;
//   }
// }

// export async function insertTextAtPositionAlternative(
//   docId: string,
//   text: string,
//   xPosition: number,
//   yPosition: number,
//   contextType: "word" | "paragraph" | "document"
// ): Promise<void> {
//   try {
//     await withProsemirrorDocument(
//       {
//         roomId: docId,
//         field: "maindoc",
//         client: liveblocks,
//       },
//       (api) => {
//         const { tr, schema } = api;
        
//         // Get current document content to calculate position
//         const docContent = api.toJSON();
//         const parsedDoc = parseDocumentContent(docContent);
        
//         // Calculate insertion position (same logic as above)
//         let insertionPos: number;
        
//         switch (contextType) {
//           case "word": {
//             const estimatedParagraphHeight = 50;
//             const paragraphIndex = Math.floor(Math.abs(yPosition) / estimatedParagraphHeight);
            
//             if (paragraphIndex >= 0 && paragraphIndex < parsedDoc.paragraphs.length) {
//               const paragraph = parsedDoc.paragraphs[paragraphIndex];
//               const wordsInParagraph = parsedDoc.words.filter(w => w.paragraphIndex === paragraphIndex);
              
//               if (wordsInParagraph.length > 0) {
//                 const avgCharWidth = 8;
//                 const charPosition = Math.floor(Math.abs(xPosition) / avgCharWidth);
                
//                 let targetWord = wordsInParagraph[0];
//                 for (const word of wordsInParagraph) {
//                   const relativeStart = word.startPos - paragraph.startPos;
//                   if (charPosition >= relativeStart) {
//                     targetWord = word;
//                   } else {
//                     break;
//                   }
//                 }
                
//                 insertionPos = targetWord.endPos + 1;
//               } else {
//                 insertionPos = paragraph.endPos;
//               }
//             } else {
//               insertionPos = parsedDoc.fullText.length;
//             }
//             break;
//           }

//           case "paragraph": {
//             const estimatedParagraphHeight = 50;
//             const paragraphIndex = Math.floor(Math.abs(yPosition) / estimatedParagraphHeight);
            
//             if (paragraphIndex >= 0 && paragraphIndex < parsedDoc.paragraphs.length) {
//               const paragraph = parsedDoc.paragraphs[paragraphIndex];
//               insertionPos = paragraph.endPos;
//             } else {
//               insertionPos = parsedDoc.fullText.length;
//             }
//             break;
//           }

//           case "document":
//           default: {
//             insertionPos = parsedDoc.fullText.length;
//             break;
//           }
//         }

//         // Create text node and insert
//         const textNode = schema.text(" " + text); // Add space before inserted text
//         tr.insert(Math.min(insertionPos, tr.doc.content.size), textNode);
        
//         return tr;
//       }
//     );

//     console.log(`Successfully inserted text with context: ${contextType}`);
//   } catch (error) {
//     console.error("Error inserting text (alternative method):", error);
//     throw error;
//   }
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
  paragraphs: Array<{ content: string; startPos: number; endPos: number; index: number }>;
  words: Array<{ content: string; startPos: number; endPos: number; paragraphIndex: number }>;
} {
  const paragraphs: Array<{ content: string; startPos: number; endPos: number; index: number }> = [];
  const words: Array<{ content: string; startPos: number; endPos: number; paragraphIndex: number }> = [];
  let fullText = "";
  let currentPos = 0;
  let paragraphIndex = 0;

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
          content: paragraphText.trim(),
          startPos: paragraphStart,
          endPos: paragraphEnd,
          index: paragraphIndex
        });

        // Add paragraph words to global words array
        paragraphWords.forEach(word => {
          words.push({
            ...word,
            paragraphIndex: paragraphIndex
          });
        });

        paragraphIndex++;
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

// Updated function to use paragraph and word indices instead of position calculations
function getDocumentContextByIndex(
  paragraphIdx: number,
  wordIdx: number,
  parsedDoc: ReturnType<typeof parseDocumentContent>
): DocumentContext {
  console.log(`Getting context for paragraphIdx: ${paragraphIdx}, wordIdx: ${wordIdx}`);
  
  // If both indices are -1, use document context
  if (paragraphIdx === -1 && wordIdx === -1) {
    console.log("Using document context (both indices are -1)");
    return {
      content: parsedDoc.fullText,
      contextType: "document"
    };
  }

  // If paragraph index is valid but word index is -1, use paragraph context
  if (paragraphIdx >= 0 && paragraphIdx < parsedDoc.paragraphs.length && wordIdx === -1) {
    const targetParagraph = parsedDoc.paragraphs[paragraphIdx];
    console.log(`Using paragraph context: "${targetParagraph.content.substring(0, 50)}..."`);
    
    return {
      content: targetParagraph.content,
      contextType: "paragraph"
    };
  }

  // If both indices are valid, use word context
  if (paragraphIdx >= 0 && paragraphIdx < parsedDoc.paragraphs.length && wordIdx >= 0) {
    const wordsInParagraph = parsedDoc.words.filter(w => w.paragraphIndex === paragraphIdx);
    
    if (wordIdx < wordsInParagraph.length) {
      const targetWord = wordsInParagraph[wordIdx];
      console.log(`Using word context: "${targetWord.content}"`);
      
      return {
        content: targetWord.content,
        contextType: "word"
      };
    } else {
      // Word index out of bounds, fall back to paragraph
      console.log(`Word index ${wordIdx} out of bounds, falling back to paragraph context`);
      const targetParagraph = parsedDoc.paragraphs[paragraphIdx];
      
      return {
        content: targetParagraph.content,
        contextType: "paragraph"
      };
    }
  }

  // Fallback to document context if indices are invalid
  console.log("Falling back to document context due to invalid indices");
  return {
    content: parsedDoc.fullText,
    contextType: "document"
  };
}

// Updated main prompt function to use index-based context determination
export async function prompt(
  docId: string,
  handleId: string,
  xPosition?: number,
  yPosition?: number,
  env?: string
): Promise<PromptResponse> {
  try {
    // Get document contents and storage
    const docContents = await getContents(docId);
    const docStorage = await liveblocks.getStorageDocument(docId, "json");
    const handleInfo = docStorage.docHandles[handleId];
    
    if (!handleInfo) {
      throw new Error(`Handle ${handleId} not found`);
    }

    const { prompt: userPrompt } = handleInfo.exchanges[handleInfo.exchanges.length - 1];
    
    // Use the paragraph and word indices from handle info
    const paragraphIdx = handleInfo.paragraphIdx;
    const wordIdx = handleInfo.wordIdx;
    
    console.log(`Handle info - paragraphIdx: ${paragraphIdx}, wordIdx: ${wordIdx}`);
    
    // Parse document content
    const docJson = JSON.parse(docContents);
    const parsedDoc = parseDocumentContent(docJson);
    
    console.log(`Parsed document with ${parsedDoc.paragraphs.length} paragraphs`);
    parsedDoc.paragraphs.forEach((p, i) => {
      console.log(`Paragraph ${i}: "${p.content.substring(0, 50)}..."`);
    });
    
    // Get appropriate context using indices
    const documentContext = getDocumentContextByIndex(paragraphIdx, wordIdx, parsedDoc);
    
    console.log(`Final context: ${documentContext.contextType} - "${documentContext.content.substring(0, 100)}..."`);
    
    // Get or initialize conversation history for this handle
    if (!conversationHistory.has(handleId)) {
      conversationHistory.set(handleId, []);
    }
    const history = conversationHistory.get(handleId)!;

    // Create context-aware prompt
    let contextPrompt = "";
    switch (documentContext.contextType) {
      case "word":
        contextPrompt = `Focus on this word: "${documentContext.content}"`;
        break;
      case "paragraph":
        contextPrompt = `Focus specifically on this paragraph:\n"${documentContext.content}"`;
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
          text: `You are a helpful AI assistant analyzing a document. When responding to queries, consider the specific context provided (word, paragraph, or full document) and tailor your response accordingly. 

When focusing on a paragraph, discuss only that specific paragraph and its content. When focusing on a word, discuss that word in the context of its paragraph. When given the full document, you can discuss the entire document.

Be concise but thorough in your analysis.`
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

// Rest of the functions remain the same...
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

export async function createExchange(
  docId: string,
  handleId: string,
  promptText: string
): Promise<void> {
  //docId = "bc8eb889-6d61-4bd9-9389-7d84558c8685"
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

export async function cleanupOldConversations(): Promise<void> {
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  const cutoff = Date.now() - maxAge;
  
  for (const [handleId, history] of conversationHistory.entries()) {
    if (history.length === 0) {
      conversationHistory.delete(handleId);
    }
  }
}

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
    const response = await prompt(docId, handleId, undefined, undefined, env);
    return response.status === "success" ? [response.text] : [];
  } catch (error) {
    console.error("Error in invokeAllPrompts:", error);
    return [];
  }
}

export async function createDoc(tempDocTitle: string) {
  // Document creation logic would go here
}
export async function insertContentIntoDocument(
  docId: string,
  content: string,
  paragraphIdx: number,
  wordIdx: number
): Promise<{ success: boolean; message?: string }> {
  try {
    // Get current document contents
    const docContents = await getContents(docId);
    const docJson = JSON.parse(docContents);

    // Parse the document to understand structure
    const parsedDoc = parseDocumentContent(docJson);

    // Determine insertion logic based on context
    let insertionPosition: number;
    let insertionType: 'paragraph' | 'word' | 'document';

    if (paragraphIdx === -1 && wordIdx === -1) {
      // Document context - insert at the end
      insertionType = 'document';
      insertionPosition = docJson.content ? docJson.content.length : 0;
    } else if (paragraphIdx >= 0 && wordIdx === -1) {
      // Paragraph context - insert after the specified paragraph
      insertionType = 'paragraph';
      insertionPosition = paragraphIdx + 1;
    } else if (paragraphIdx >= 0 && wordIdx >= 0) {
      // Word context - insert after the paragraph containing the word
      insertionType = 'word';
      insertionPosition = paragraphIdx + 1;
    } else {
      // Fallback to document end
      insertionType = 'document';
      insertionPosition = docJson.content ? docJson.content.length : 0;
    }

    // Create new paragraph with the AI response
    const newParagraph = {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: content
        }
      ]
    };

    // Insert the content
    if (!docJson.content) {
      docJson.content = [];
    }

    if (insertionType === 'document') {
      // Insert at the end of document
      docJson.content.push(newParagraph);
    } else {
      // Insert after specified paragraph
      docJson.content.splice(insertionPosition, 0, newParagraph);
    }

    // Update the document using Liveblocks
    await liveblocks.mutateStorage(docId, ({ root }) => {
      // This approach updates the ProseMirror document directly
      // Note: This is a simplified approach - you might need to use ProseMirror commands
      // for more complex document manipulation
      
      // For now, we'll trigger a document update by updating a timestamp
      // The actual document update would need to be handled through ProseMirror's API
      const timestamp = Date.now();
      
      // Store insertion request in temporary storage for the editor to pick up
      root.set("pendingInsertion", {
        content: content,
        paragraphIdx: paragraphIdx,
        wordIdx: wordIdx,
        timestamp: timestamp
      });
    });

    return { success: true };
  } catch (error) {
    console.error("Error inserting content into document:", error);
    return { 
      success: false, 
      message: (error as Error).message 
    };
  }
}