import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/16/solid";
import { SparklesIcon } from "@heroicons/react/20/solid";
import { NodeViewWrapper } from "@tiptap/react";
import React, { useEffect, useState } from "react";
import { prompt } from "@/app/actions";
import { useParams } from "next/navigation";
import { useMutation, useStorage } from "@liveblocks/react";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

export default (props: any) => {
  const params = useParams<{ doc: string; snapshot: string }>();
  const snapshots = useStorage((root) => root.snapshots);
  const addExchange = useMutation(
    ({ storage }, envId: string, prompt: string) => {
      // this null check should never happen, this component should not be renderable outside of a snapshot that already exists
      const snapshots = storage.get("snapshots");
      if (snapshots.get(params.snapshot) === undefined) {
        snapshots.set(params.snapshot, new LiveObject());
      }
      const snapshotInfo = snapshots.get(params.snapshot);

      // initialize conversation map if necessary
      if (snapshotInfo?.get("conversations") === undefined) {
        snapshotInfo?.set("conversations", new LiveMap());
      }
      const snapshotConversations = snapshotInfo?.get("conversations");

      const exchangesInEnv = snapshotConversations?.get(envId);
      // this is a horrible "lock", its not really atomic, but its serving a reminder for me to make it better later
      const isConversationPending =
        exchangesInEnv !== undefined && exchangesInEnv.get("isPending");
      if (isConversationPending) {
        throw new Error(
          "Someone already prompted the LLM within this environment."
        );
      }
      // if this is the first exchange in this snapshot in general, then initialize memory
      // and in both cases add the new prompt the proper place
      if (exchangesInEnv === undefined) {
        snapshotConversations?.set(
          envId,
          new LiveObject({
            isPending: true,
            exchanges: new LiveList([new LiveObject({ prompt, response: "" })]),
          })
        );
      } else {
        exchangesInEnv?.set("isPending", true);
        exchangesInEnv
          ?.get("exchanges")
          .push(new LiveObject({ prompt, response: "" }));
      }
    },
    []
  );
  const endExchange = useMutation(({ storage }, envId: string) => {
    // cant invoke this mutation without having added the exchange, so null checks are unnecessary
    storage
      .get("snapshots")
      ?.get(params.snapshot)
      ?.get("conversations")
      ?.get(envId)
      ?.set("isPending", false);
  }, []);

  const isConversationPending = (envId: string) => {
    if (!snapshots) {
      return true; // consider unloaded storage as conversations are all pending
    }
    console.log(snapshots);

    // if there are no conversations with the given envId, then no conversation is pending
    return (
      snapshots.get(params.snapshot)?.conversations.get(envId)?.isPending ?? false
    );
  };

  const getConversations = (envId: string) => {
    if (!snapshots) {
      return;
    }

    const conversations = snapshots.get(params.snapshot)?.conversations.get(envId);

    return conversations;
  };

  // State to hold AI response, loading, and error
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const promptLLMHandler = async () => {
    const promptText = props.node.attrs.prompt;
    const envId = props.node.attrs.envId;

    if (!promptText) {
      setError("Prompt is empty.");
      return;
    }

    setLoading(true);
    setError(null);
    setAiResponse(null);

    try {
      // add an entry for this upcoming exchange to the storage
      addExchange(envId, promptText);

      const response = await prompt(params.doc, params.snapshot, envId, promptText);
      endExchange(envId);

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
          {/* {loading && <p className="text-zinc-500">Generating response...</p>}
          {error && <p className="text-red-500">{error}</p>}
          {!loading &&
            !error &&
            aiResponse &&
            snapshots
              ?.get("test-snap")
              ?.conversations.get(props.node.attrs.envid)
              ?.exchanges.map(({ prompt, response }) => {
                return (
                  <p classname="text-zinc-800 whitespace-pre-line">
                    {response}
                  </p>
                );
              })}
          {!loading && !error && !aiResponse && (
            <p className="text-zinc-800">
              This is where the AI-generated response will appear.
            </p>
          )} */}
          {snapshots !== null &&
            snapshots
              .get(params.snapshot)
              ?.conversations.get(props.node.attrs.envId)
              ?.exchanges.map(({ prompt, response }) => {
                return (
                  <p className="text-zinc-800 whitespace-pre-line">
                    {response}
                  </p>
                );
              })}
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => {
            if (aiResponse) {
              props.updateAttributes({ response: aiResponse });
              props.editor.commands.insertContent(aiResponse);
              // props.deleteNode(); -> design choice: if we want to delete the node from props after we accept something
            }
          }}
          className="bg-green-500 text-white px-3 py-1.5 rounded-lg hover:bg-green-600 transition"
          disabled={!aiResponse}
        >
          Insert
        </button>
        <button
          onClick={() => {
            setAiResponse(null); // clear local state
            props.updateAttributes({ response: null }); // clear stored response
            setError(null); // optional: clear any error message
            // TODO: look here at reject -> do we want the node to be deleted or to persist?
            props.deleteNode();
          }}
          className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition"
        >
          Reject
        </button>
      </div>
    </NodeViewWrapper>
  );
};
