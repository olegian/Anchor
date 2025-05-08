import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { SparklesIcon } from "@heroicons/react/20/solid";
import { NodeViewWrapper } from "@tiptap/react";
import React from "react";

export default (props: any) => {
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
          <button className="bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 transition">
            Generate
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="block text-zinc-700 font-medium">Response</label>
        <div className="border border-zinc-300 rounded-lg p-3 bg-zinc-50">
          <p className="text-zinc-800">
            This is where the AI-generated response will appear.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition">
          Insert
        </button>
        <button className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition">
          Reject
        </button>
      </div>
    </NodeViewWrapper>
  );
};
