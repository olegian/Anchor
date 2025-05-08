"use client";

import { FormEvent, useState } from "react";
import { prompt } from "@/app/actions";

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

      // Format the user prompt to embed in the document
      const formattedUserPrompt = `\n\n<user-prompt>\n${userPrompt}\n</user-prompt>\n\n`;
      
      // Add the user prompt to the document first - insert at the end
      editor.commands.setTextSelection(editor.state.doc.content.size - 2);
      editor.commands.insertContent(formattedUserPrompt);
      
      // Call the Gemini API
      const response = await prompt(docName, snapshotId, userPrompt, environment);
      
      // Format the AI response
      const formattedResponse = `<ai-response>\n${response.text}\n</ai-response>\n\n`;
      
      // Add the AI response to the document - insert at the end
      editor.commands.setTextSelection(editor.state.doc.content.size - 2);
      editor.commands.insertContent(formattedResponse);
      
      // Clear the prompt input
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
        </form>
      </div>
    </div>
  );
}


// "use client";

// import { FormEvent, useState } from "react";
// import { prompt } from "@/app/actions";
// import { Editor } from "@tiptap/react";

// interface PromptEnvironmentProps {
//   docName: string;
//   snapshotId: string;
//   editor: Editor | null;
//   maindocEditor: Editor | null;
// }

// export function PromptEnvironment({
//   docName,
//   snapshotId,
//   editor,
//   maindocEditor,
// }: PromptEnvironmentProps) {
//   const [userPrompt, setUserPrompt] = useState("");
//   const [environment, setEnvironment] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEnvVisible, setIsEnvVisible] = useState(false);
//   const [insertTarget, setInsertTarget] = useState<"snapshot" | "maindoc" | "both">("snapshot");

//   const handleSubmit = async (e: FormEvent) => {
//     e.preventDefault();
//     if (!userPrompt.trim()) return;

//     setIsLoading(true);

//     try {
//       const response = await prompt(docName, snapshotId, userPrompt, environment);
//       const formattedResponse = {
//         type: "paragraph",
//         attrs: { "data-source": "ai" },
//         content: [
//           {
//             type: "text",
//             text: response.text,
//           },
//         ],
//       };

//       // Insert into selected editor(s)
//       if ((insertTarget === "snapshot" || insertTarget === "both") && editor) {
//         editor.commands.focus();
//         editor.commands.insertContent(formattedResponse);
//       }

//       if ((insertTarget === "maindoc" || insertTarget === "both") && maindocEditor) {
//         maindocEditor.commands.focus();
//         maindocEditor.commands.insertContent(formattedResponse);
//       }

//       setUserPrompt("");
//     } catch (error) {
//       console.error("Error submitting prompt:", error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="prompt-environment">
//       <div className="flex flex-col p-4 border-2 rounded-lg bg-white dark:bg-gray-800 w-full max-w-xl">
//         <div className="flex justify-between items-center mb-2">
//           <h3 className="text-lg font-medium">Gemini Prompt</h3>
//           <button
//             onClick={() => setIsEnvVisible(!isEnvVisible)}
//             className="text-sm underline"
//           >
//             {isEnvVisible ? "Hide Environment" : "Show Environment"}
//           </button>
//         </div>

//         {isEnvVisible && (
//           <div className="mb-4">
//             <label className="block text-sm font-medium mb-1">Environment Variables</label>
//             <textarea
//               className="w-full p-2 border rounded-md h-32 text-sm"
//               value={environment}
//               onChange={(e) => setEnvironment(e.target.value)}
//               placeholder="Add environment variables or context here (KEY=VALUE format)"
//             />
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="flex flex-col">
//           <label className="block text-sm font-medium mb-1">Your Prompt</label>
//           <textarea
//             className="w-full p-2 border rounded-md h-24"
//             value={userPrompt}
//             onChange={(e) => setUserPrompt(e.target.value)}
//             placeholder="Enter your prompt for Gemini..."
//             required
//           />

//           <div className="flex items-center gap-4 mt-3">
//             <label className="text-sm font-medium">Insert response into:</label>
//             <select
//               className="border rounded px-2 py-1 text-sm"
//               value={insertTarget}
//               onChange={(e) => setInsertTarget(e.target.value as any)}
//             >
//               <option value="snapshot">Snapshot Only</option>
//               <option value="maindoc">Main Document Only</option>
//               <option value="both">Both</option>
//             </select>
//           </div>

//           <button
//             type="submit"
//             disabled={isLoading || !userPrompt.trim()}
//             className={`mt-4 py-2 px-4 rounded-md ${
//               isLoading ? "bg-gray-300" : "bg-blue-600 hover:bg-blue-700 text-white"
//             }`}
//           >
//             {isLoading ? "Processing..." : "Submit"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }
