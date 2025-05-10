"use client";

import { FormEvent, useState } from "react";
import { prompt, invokeAllPrompts } from "@/app/actions";

import { Editor } from "@tiptap/react";

interface PromptEnvironmentProps {
  docName: string;
  snapshotId: string;
  editor: Editor | null;
}

export function PromptEnvironment({ docName, snapshotId, editor }: PromptEnvironmentProps) {
  const [userPrompt, setUserPrompt] = useState("");
  const [environment, setEnvironment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isEnvVisible, setIsEnvVisible] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userPrompt.trim()) return;
  
    setIsLoading(true);
    
    try {
      if (!editor) {
        throw new Error("Editor is not available");
      }
  
      // Generate a prompt ID (timestamp-based)
      const promptId = `id-${Date.now()}`;
  
      const formattedUserPrompt = `\n\n<user-prompt id="${promptId}">\n${userPrompt}\n</user-prompt>\n\n`;
      
      editor.commands.setTextSelection(editor.state.doc.content.size - 2);
      editor.commands.insertContent(formattedUserPrompt);
  
      const response = await prompt(docName, snapshotId, userPrompt, environment);
      
      const formattedResponse = `<ai-response id="${promptId}">\n${response.text}\n</ai-response>\n\n`;
      
      editor.commands.setTextSelection(editor.state.doc.content.size - 2);
      editor.commands.insertContent(formattedResponse);
  
      setUserPrompt("");
    } catch (error) {
      console.error("Error submitting prompt:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="prompt-environment">
      <div className="flex flex-col p-4 border-2 rounded-lg bg-white dark:bg-gray-800 w-full max-w-xl">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium">Gemini Prompt</h3>
          <button 
            onClick={() => setIsEnvVisible(!isEnvVisible)} 
            className="text-sm underline"
          >
            {isEnvVisible ? "Hide Environment" : "Show Environment"}
          </button>
        </div>
        
        {isEnvVisible && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Environment Variables</label>
            <textarea
              className="w-full p-2 border rounded-md h-32 text-sm"
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              placeholder="Add environment variables or context here (KEY=VALUE format)"
            />
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className="block text-sm font-medium mb-1">Your Prompt</label>
          <textarea
            className="w-full p-2 border rounded-md h-24"
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Enter your prompt for Gemini..."
            required
          />
          
          <button
            type="submit"
            disabled={isLoading || !userPrompt.trim()}
            className={`mt-3 py-2 px-4 rounded-md ${
              isLoading ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700 text-white"
            }`}
          >
            {isLoading ? "Processing..." : "Submit"}
          </button>
          
          {/* Only show the "Invoke All Prompts" button in snapshot view */}
          {snapshotId && (
            <button
              type="button"
              onClick={async () => {
                setIsLoading(true);
                try {
                  const responses = await invokeAllPrompts(docName, snapshotId, environment);
                  if (!editor) return;

                  for (const [i, response] of responses.entries()) {
                    const promptId = `auto-${Date.now()}-${i}`;
                    editor.commands.insertContentAt(
                      editor.state.doc.content.size - 2,
                      `\n\n<ai-response id="${promptId}">\n${response}\n</ai-response>\n`
                    );
                  }
                } catch (err) {
                  console.error("Error invoking all prompts:", err);
                } finally {
                  setIsLoading(false);
                }
              }}
              disabled={isLoading}
              className="mt-2 py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            >
              {isLoading ? "Processing All..." : "✨ Invoke All [[ Prompts ]]"}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
