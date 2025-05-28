import { useMutation } from "@liveblocks/react";
import { Mark, mergeAttributes } from "@tiptap/core";

export interface SpansMarkOptions {
  /**
   * HTML attributes to add to the span element.
   * @default {}
   * @example { class: 'foo' }
   */
  HTMLAttributes: Record<string, any>;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    textStyle: {
      /**
       * Remove spans without inline style attributes.
       * @example editor.commands.removeEmptyTextStyle()
       */
      removeEmptyTextStyle: () => ReturnType;
    };
  }
}

export const SpansMark = Mark.create<SpansMarkOptions>({
  name: "attachedSpan",

  priority: 101,

  addOptions() {
    return {
      HTMLAttributes: { },
    };
  },

  addAttributes() {
    return {
      id: {
        default: crypto.randomUUID(),
        parseHTML(element: HTMLElement) {
            return element.hasAttribute("id") ? element.getAttribute("id") : null;
        }
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element: HTMLElement) => {
          return {
            id: element.getAttribute("id")
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },
});
