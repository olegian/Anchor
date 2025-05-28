"use server";

import { withProsemirrorDocument } from "@liveblocks/node-prosemirror";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { liveblocks } from "./liveblocks";
import {
  LiveObject,
  LiveList,
  toPlainLson,
  LiveMap,
  PlainLsonObject,
} from "@liveblocks/client";
import {
  allowAccessToRoomId,
  disallowAccessToRoomId,
  getAllUsers,
  getAvailableRoomIds,
  getUserInfo,
} from "./firebase";
import { RoomData } from "@liveblocks/node";

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
  paragraphs: Array<{
    content: string;
    startPos: number;
    endPos: number;
    index: number;
  }>;
  words: Array<{
    content: string;
    startPos: number;
    endPos: number;
    paragraphIndex: number;
  }>;
} {
  const paragraphs: Array<{
    content: string;
    startPos: number;
    endPos: number;
    index: number;
  }> = [];
  const words: Array<{
    content: string;
    startPos: number;
    endPos: number;
    paragraphIndex: number;
  }> = [];
  let fullText = "";
  let currentPos = 0;
  let paragraphIndex = 0;

  function traverseNode(node: any) {
    if (node.type === "paragraph") {
      const paragraphStart = currentPos;
      let paragraphText = "";
      let paragraphWords: Array<{
        content: string;
        startPos: number;
        endPos: number;
      }> = [];

      if (node.content) {
        node.content.forEach((child: any) => {
          if (child.type === "text" && child.text) {
            const text = child.text;
            paragraphText += text;

            // Split text into words while preserving positions
            const wordMatches = [...text.matchAll(/\S+/g)];
            wordMatches.forEach((match) => {
              if (match.index !== undefined) {
                const wordStart = currentPos + match.index;
                const wordEnd = wordStart + match[0].length;
                paragraphWords.push({
                  content: match[0],
                  startPos: wordStart,
                  endPos: wordEnd,
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
          index: paragraphIndex,
        });

        // Add paragraph words to global words array
        paragraphWords.forEach((word) => {
          words.push({
            ...word,
            paragraphIndex: paragraphIndex,
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

// Updated function to use contextMode override or fall back to index-based detection
function getDocumentContext(
  contextMode: "doc" | "paragraph" | "word",
  paragraphIdx: number,
  wordIdx: number,
  parsedDoc: ReturnType<typeof parseDocumentContent>
): DocumentContext {
  console.log(`Getting context with mode: ${contextMode}, paragraphIdx: ${paragraphIdx}, wordIdx: ${wordIdx}`);
  
  // Use the explicit contextMode to determine context type
  switch (contextMode) {
    case "doc":
      console.log("Using document context (explicit mode)");
      return {
        content: parsedDoc.fullText,
        contextType: "document"
      };
      
    case "paragraph":
      // Use paragraph context if valid paragraph index exists
      if (paragraphIdx >= 0 && paragraphIdx < parsedDoc.paragraphs.length) {
        const targetParagraph = parsedDoc.paragraphs[paragraphIdx];
        console.log(`Using paragraph context: "${targetParagraph.content.substring(0, 50)}..."`);
        
        return {
          content: targetParagraph.content,
          contextType: "paragraph"
        };
      } else {
        // Fall back to document if no valid paragraph
        console.log("No valid paragraph found, falling back to document context");
        return {
          content: parsedDoc.fullText,
          contextType: "document"
        };
      }
      
    case "word":
      // Use word context if valid indices exist
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
          // Word index out of bounds, fall back to paragraph if available
          console.log(`Word index ${wordIdx} out of bounds, falling back to paragraph context`);
          if (paragraphIdx >= 0 && paragraphIdx < parsedDoc.paragraphs.length) {
            const targetParagraph = parsedDoc.paragraphs[paragraphIdx];
            
            return {
              content: targetParagraph.content,
              contextType: "paragraph"
            };
          }
        }
      }
      
      // Fall back to document context if word context is not available
      console.log("Word context not available, falling back to document context");
      return {
        content: parsedDoc.fullText,
        contextType: "document"
      };
      
    default:
      // Fallback to document context
      console.log("Unknown context mode, falling back to document context");
      return {
        content: parsedDoc.fullText,
        contextType: "document"
      };
  }
}

// Updated main prompt function to use contextMode parameter
export async function prompt(
  docId: string,
  handleId: string,
  contextMode: "doc" | "paragraph" | "word",
  xPosition?: number,
  yPosition?: number,
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

    if (!handleInfo) {
      throw new Error(`Handle ${handleId} not found`);
    }

    const { prompt: userPrompt } =
      handleInfo.exchanges[handleInfo.exchanges.length - 1];

    // Use the paragraph and word indices from handle info
    const paragraphIdx = handleInfo.paragraphIdx;
    const wordIdx = handleInfo.wordIdx;
    
    console.log(`Handle info - paragraphIdx: ${paragraphIdx}, wordIdx: ${wordIdx}, contextMode: ${contextMode}`);
    
    // Parse document content
    const docJson = JSON.parse(docContents);
    const parsedDoc = parseDocumentContent(docJson);

    console.log(
      `Parsed document with ${parsedDoc.paragraphs.length} paragraphs`
    );
    parsedDoc.paragraphs.forEach((p, i) => {
      console.log(`Paragraph ${i}: "${p.content.substring(0, 50)}..."`);
    });
    
    // Get appropriate context using the explicit contextMode
    const documentContext = getDocumentContext(contextMode, paragraphIdx, wordIdx, parsedDoc);
    
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
        parts: [
          {
            text: `You are a helpful AI assistant analyzing a document. When responding to queries, consider the specific context provided (word, paragraph, or full document) and tailor your response accordingly. 

When focusing on a paragraph, discuss only that specific paragraph and its content. When focusing on a word, discuss that word in the context of its paragraph. When given the full document, you can discuss the entire document.

Be concise but thorough in your analysis.

When focusing on a word, you may be asked to provide a synonym, which will be indicated by the user passing the word \"synonym\" into the model. If you 
receive this prompt, you should provide a sample synonym for the word. You would not need any additional context in this situation, and should therefore not discuss this.
For example: if the user enters "was", a synonym could be "existed". 

This will be similar for other instances in which the context is only the word. You will only consider the word, and not focus on other context.

If the context is a paragraph, you will also discuss only that specific paragraph and its content, while thinking through your reasoning. If the user asks you to provide
additional text for that paragraph, only provide the additional text.

For instance, if the paragraph is "\We want to remind you that midnight today, May 25, is the deadline for you to register/order cap and gown to attend the Commencement ceremony in Husky Stadium on June 14! 
It is easy to sign up to share this special day with your friends and family.\",
additional text for that paragraph may be \"Don't miss your chance to join us on this special day! We hope to see you there, and we are excited to have you join us. More information will be revealed shortly\";
the user is also able to request for specific sentence lengths or for more information after this point. 

If the context is the document, analyze the document fully, being sure to consider the perspective of the user and what goals they want, while thinking
through your thought process.
`,
          },
        ],
      },
    });

    const conversationTitle = await generateConversationTitle(userPrompt, documentContext.contextType);
    console.log(`Generated conversation title: ${conversationTitle}`);
    await setConversationTitle(docId, handleId, conversationTitle);

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

export async function regenerateResponse(
  docId: string,
  handleId: string,
  contextMode: "doc" | "paragraph" | "word",
  exchangeIndex?: number, // NEW: Add optional exchange index parameter
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

    if (handleInfo.exchanges.length === 0) {
      throw new Error("No exchanges found to regenerate");
    }

    // FIXED: Get the specific exchange to regenerate (default to last if not specified)
    const targetExchangeIndex = exchangeIndex !== undefined ? exchangeIndex : handleInfo.exchanges.length - 1;
    
    // Validate the exchange index
    if (targetExchangeIndex < 0 || targetExchangeIndex >= handleInfo.exchanges.length) {
      throw new Error(`Invalid exchange index: ${targetExchangeIndex}`);
    }

    const targetExchange = handleInfo.exchanges[targetExchangeIndex];
    const userPrompt = targetExchange.prompt;

    // Use the paragraph and word indices from handle info
    const paragraphIdx = handleInfo.paragraphIdx;
    const wordIdx = handleInfo.wordIdx;
    
    // Parse document content
    const docJson = JSON.parse(docContents);
    const parsedDoc = parseDocumentContent(docJson);
    
    // Get appropriate context
    const documentContext = getDocumentContext(contextMode, paragraphIdx, wordIdx, parsedDoc);
    
    // FIXED: Get conversation history and properly reset for regeneration
    if (!conversationHistory.has(handleId)) {
      conversationHistory.set(handleId, []);
    }
    const history = conversationHistory.get(handleId)!;
    
    // FIXED: Create conversation history up to the target exchange
    const historyForRegeneration = [];
    
    // Add all exchanges up to (but not including) the target exchange
    for (let i = 0; i < targetExchangeIndex; i++) {
      const exchange = handleInfo.exchanges[i];
      // Add user message
      historyForRegeneration.push({
        role: "user",
        parts: [{ text: exchange.prompt }],
      });
      // Add model response if it exists
      if (exchange.response) {
        historyForRegeneration.push({
          role: "model",
          parts: [{ text: exchange.response }],
        });
      }
    }
    
    // Add the current user prompt (but not the response we're regenerating)
    historyForRegeneration.push({
      role: "user",
      parts: [{ text: userPrompt }],
    });

    // Generate new response with increased temperature for more variation
    const text = await generateLLMResponseWithVariation(
      userPrompt, 
      documentContext, 
      historyForRegeneration,
      env
    );
    console.log("regenerated response text = " + text);

    // FIXED: Update the conversation history correctly
    // Rebuild the entire history to match the new state
    const newHistory = [];
    
    // Add all exchanges up to the target exchange
    for (let i = 0; i < handleInfo.exchanges.length; i++) {
      const exchange = handleInfo.exchanges[i];
      // Add user message
      newHistory.push({
        role: "user",
        parts: [{ text: exchange.prompt }],
      });
      
      // Add response - use the new regenerated text for the target exchange
      if (i === targetExchangeIndex) {
        newHistory.push({
          role: "model",
          parts: [{ text }],
        });
      } else if (exchange.response) {
        newHistory.push({
          role: "model",
          parts: [{ text: exchange.response }],
        });
      }
    }

    // Update conversation history
    conversationHistory.set(handleId, newHistory);

    // FIXED: Update storage with new response at the correct exchange index
    await liveblocks.mutateStorage(docId, ({ root }) => {
      const handleInfo = root.get("docHandles").get(handleId);
      const exchanges = handleInfo?.get("exchanges");

      if (exchanges && targetExchangeIndex < exchanges.length) {
        // Update the specific exchange, not necessarily the last one
        exchanges.get(targetExchangeIndex)?.set("response", text);
        // Optional: Update timestamp to indicate regeneration
        exchanges.get(targetExchangeIndex)?.set("timestamp", Date.now());
      }
    });

    return {
      text,
      status: "success",
    };
  } catch (error) {
    console.error("Error regenerating response:", error);
    return {
      text: "Sorry, there was an error regenerating the response.",
      status: "error",
      message: (error as Error).message,
    };
  }
}

// ALSO FIXED: The generateLLMResponseWithVariation function
async function generateLLMResponseWithVariation(
  userPrompt: string,
  documentContext: DocumentContext,
  history: Array<{ role: string; parts: { text: string }[] }>,
  env?: string
): Promise<string> {
  // Create context-aware prompt with slight variation for regeneration
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

  // Add a slight variation to the prompt to encourage different responses
  const regenerationNote = "\n\nPlease provide an alternative perspective or approach in your response.";
  const fullPrompt = `${contextPrompt}\n\nUser Query: ${userPrompt}${regenerationNote}`;

  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: {
      role: "system",
      parts: [
        {
          text: `You are a helpful AI assistant analyzing a document. When responding to queries, consider the specific context provided (word, paragraph, or full document) and tailor your response accordingly. 

When focusing on a paragraph, discuss only that specific paragraph and its content. When focusing on a word, discuss that word in the context of its paragraph. When given the full document, you can discuss the entire document.

Be concise but thorough in your analysis.

When focusing on a word, you may be asked to provide a synonym, which will be indicated by the user passing the word "synonym" into the model. If you 
receive this prompt, you should provide a sample synonym for the word. You would not need any additional context in this situation, and should therefore not discuss this.
For example: if the user enters "was", a synonym could be "existed". 

This will be similar for other instances in which the context is only the word. You will only consider the word, and not focus on other context.

If the context is a paragraph, you will also discuss only that specific paragraph and its content, while thinking through your reasoning. If the user asks you to provide
additional text for that paragraph, only provide the additional text.

For instance, if the paragraph is "We want to remind you that midnight today, May 25, is the deadline for you to register/order cap and gown to attend the Commencement ceremony in Husky Stadium on June 14! 
It is easy to sign up to share this special day with your friends and family.",
additional text for that paragraph may be "Don't miss your chance to join us on this special day! We hope to see you there, and we are excited to have you join us. More information will be revealed shortly";
the user is also able to request for specific sentence lengths or for more information after this point. 

If the context is the document, analyze the document fully, being sure to consider the perspective of the user and what goals they want, while thinking
through your thought process.

When regenerating responses, try to provide alternative perspectives or different approaches while maintaining accuracy and relevance.
`,
        },
      ],
    },
  });

  // Create chat session with the existing history (excluding the current prompt)
  const chat = model.startChat({
    history: history.slice(0, -1), // Remove the last user message since we'll send it separately
    generationConfig: {
      temperature: 1.0, // Increased temperature for more variation in regeneration
      maxOutputTokens: 2048,
      topP: 0.9, // Add top-p sampling for more diversity
      topK: 40, // Add top-k sampling for more diversity
    },
  });

  // Generate response with the new prompt
  const result = await chat.sendMessage(fullPrompt);
  const response = result.response;
  const text = response.text();

  return text;
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

export async function createExchange(
  docId: string,
  handleId: string,
  promptText: string
): Promise<void> {
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
    const response = await prompt(docId, handleId, "doc", undefined, undefined, env);
    return response.status === "success" ? [response.text] : [];
  } catch (error) {
    console.error("Error in invokeAllPrompts:", error);
    return [];
  }
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
export async function shareDoc(docId: string, userId: string) {
  // technically, this throws an error is the userid doesnt exist, but
  // like screw handling it rn
  await allowAccessToRoomId(userId, docId);
}

export async function deleteDoc(docId: string) {
  // I really wish i could do something like this, and I think if I read up on liveblocks permission systems more
  // I can find a way to do it, but for now imma use a workaround.

  // const room = await liveblocks.getRoom(docId);
  // for (const userId in room.usersAccesses) {

  // Or i could just also store a reverse map of room -> [allowed userid]

  await disallowAccessToRoomId(docId);
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

// include this ALL

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

export async function getUser(username: string) {
  return await getUserInfo(username);
}

export async function getUserColor(username: string) {
  const res = await getUserInfo(username);
  return res.color;
}

export async function getUsers() {
  return await getAllUsers();
}

async function generateConversationTitle(
  firstPrompt: string,
  contextType: string
): Promise<string> {
  try {
    const titleModel = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: {
        role: "system",
        parts: [
          {
            text: `You are a helpful assistant that generates concise, descriptive titles for conversations. 
            Based on the user's first prompt and the context type (word, paragraph, or document), create a brief title (2-6 words) that captures the essence of what the user is asking about.
            
            Examples:
            - For "What does this word mean?" with word context → "Word Definition"
            - For "Summarize this paragraph" with paragraph context → "Paragraph Summary"
            - For "What are the main themes?" with document context → "Document Themes"
            - For "synonym" with word context → "Word Synonym"
            - For "Can you expand on this?" with paragraph context → "Paragraph Expansion"
            
            Keep titles concise, clear, and relevant to the query.`,
          },
        ],
      },
    });

    const prompt = `Context type: ${contextType}\nUser prompt: ${firstPrompt}\n\nGenerate a concise title (2-6 words):`;
    const result = await titleModel.generateContent(prompt);
    const title = result.response.text().trim();
    
    // Clean up the title (remove quotes if present, limit length)
    const cleanTitle = title.replace(/['"]/g, '').substring(0, 50);
    return cleanTitle || "AI Conversation";
  } catch (error) {
    console.error("Error generating conversation title:", error);
    return "AI Conversation";
  }
}

async function setConversationTitle(docId: string, handleId: string, newTitle: string) {
  await liveblocks.mutateStorage(docId, ({ root }) => {
    const handleInfo = root.get("docHandles").get(handleId);
    if (handleInfo) {
      handleInfo.set("title", newTitle);
    }
  });
}