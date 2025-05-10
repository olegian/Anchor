import { Node, mergeAttributes } from "@tiptap/core";
import { nodeInputRule } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import InlineAIComponent from "./InlineAIComponent";

export default Node.create({
  name: "inlineAIComponent",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      prompt: {
        default: "",
      },
      envId: {
        default: "default-id"
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "inline-ai-component",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["inline-ai-component", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(InlineAIComponent);
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: /\[\[(.*?)\]\]/g,
        type: this.type,
        getAttributes: (match) => {
          return {
            prompt: match[1],
            envId: crypto.randomUUID(),
          };
        },
      }),
    ];
  },
});
