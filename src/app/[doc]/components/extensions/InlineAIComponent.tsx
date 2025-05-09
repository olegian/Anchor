import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { SparklesIcon } from "@heroicons/react/20/solid";
import { NodeViewWrapper } from "@tiptap/react";
import React, { useState } from "react";
import { prompt } from "@/app/actions";
import { useParams } from "next/navigation";

export default (props: any) => {
  const params = useParams<{ doc: string }>();

  // State to hold AI response, loading, and error
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptLLMHandler = async () => {
    const promptText = props.node.attrs.prompt;
    if (!promptText) {
      setError("Prompt is empty.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      // TODO: replace "test-snap" with actual snapshot ID if available
      const response = await prompt(params.doc, "test-snap", promptText);
      if (response.status === "error") {
        setError(response.message || "Unknown error");
      } else {
        setAiResponse(response.text);
      }
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <NodeViewWrapper className="inline-ai-component bg-white border border-zinc-200 rounded-xl p-4 space-y-4 text-sm max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-800 font-semibold">
          <SparklesIcon className="w-5 h-5 text-pink-500" />
          Inline AI Component
        </div>
        <div className="flex items-center gap-1 text-zinc-500">
          <button className="hover:text-zinc-800 transition">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <p className="text-xs font-medium my-0!">1 of 3</p>
          <button className="hover:text-zinc-800 transition">
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      <hr className="border-zinc-200 my-2!" />
      <div className="space-y-2">
        <label className="block text-zinc-700 font-medium">Prompt</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={props.node.attrs.prompt}
            onChange={(e) => props.updateAttributes({ prompt: e.target.value })}
            className="flex-1 border border-zinc-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your prompt..."
          />
          <button
            onClick={promptLLMHandler}
            className="bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 transition"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-zinc-700 font-medium">Response</label>
        <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50 min-h-[2em]">
          {loading && <p className="text-zinc-500">Generating response...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading && !error && aiResponse && (
            <p className="text-zinc-800 whitespace-pre-line">{aiResponse}</p>
          )}
          {!loading && !error && !aiResponse && (
            <p className="text-zinc-800">This is where the AI-generated response will appear.</p>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {/* <button className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition">
          Insert
        </button> */}
        <button
        onClick={() => {
          if (aiResponse) {
            props.updateAttributes({ response: aiResponse });
          }
        }}
        className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition"
        disabled={!aiResponse}
      >
        Insert
      </button>
        <button className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition">
          Reject
        </button>
      </div>
    </NodeViewWrapper>
  );
};