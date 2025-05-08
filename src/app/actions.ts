"use server";

import { liveblocks } from "@/app/liveblocks";
import { withProsemirrorDocument } from "@liveblocks/node-prosemirror";
import { GoogleGenerativeAI } from "@google/generative-ai";

const LB_DELETE_COMMENT_URL =
  "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";
const LB_COPY_ROOM =
  "https://api.liveblocks.io/v2/rooms/{room_id}/threads/{thread_id}/comments/{comment_id}";

// Initialize Gemini API
const genAI = new GoogleGenerativeAI("");

// Store conversation history per snapshot ID
const conversationHistory = new Map<string, Array<{ role: string; parts: string[] }>>();

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
  doc_name: string, 
  snapshotId: string, 
  userPrompt: string, 
  env?: string
): Promise<PromptResponse> {
  try {
    console.log(`<PROMPT> ${doc_name}/${snapshotId} => ${userPrompt}`);
    
    // Get document contents to use as context
    const docContents = await getContents(doc_name);
    
    // Get or initialize conversation history for this snapshot
    if (!conversationHistory.has(snapshotId)) {
      conversationHistory.set(snapshotId, []);
    }
    
    const history = conversationHistory.get(snapshotId)!;
    
    // Create context string
    let contextPrompt = `Document Content:\n${docContents}\n\n`;
    
    // Add environment variables if provided
    if (env) {
      contextPrompt += `Environment Variables:\n${env}\n\n`;
    }
    
    // Create the complete prompt
    const fullPrompt = `${contextPrompt}User Query: ${userPrompt}`;
    
    // Add user message to history
    history.push({
      role: "user",
      parts: [fullPrompt],
    });
    
    // Set up Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    // Create a chat session with history
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
    
    // Add response to history
    history.push({
      role: "model",
      parts: [text],
    });
    
    // Update the conversation history
    conversationHistory.set(snapshotId, history);

    // do we need this?
    await postComment(doc_name, snapshotId, `User: ${userPrompt}`);
    await postComment(doc_name, snapshotId, `Gemini: ${text}`);
    
    return {
      text,
      status: "success"
    };
  } catch (error) {
    console.error("Error in Gemini API call:", error);
    return {
      text: "Sorry, there was an error processing your request.",
      status: "error",
      message: (error as Error).message
    };
  }
}

export async function resetConversation(snapshotId: string): Promise<void> {
  conversationHistory.delete(snapshotId);
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
      console.log(contents);
      return contents;
    }
  );
}

export async function getSnapshotContents(roomId: string, field: string) {
  return await withProsemirrorDocument(
    { roomId: roomId, field: field, client: liveblocks },
    (api) => {
      const contents = api.getText();
      return contents;
    }
  );
}

// Content updates are now handled directly through the Tiptap editor
// on the client side for better real-time collaboration