import { Node, Mark, mergeAttributes } from "@tiptap/core";

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

export const ParaSpansNode = Node.create<SpansMarkOptions>({
  name: "paraAttachedSpan",

  content: 'block+',

  group: 'block',

  defining: true,
  
  priority: 1000, // same as paragraph

  addOptions() {
    return {
      HTMLAttributes: { },
    };
  },

  addAttributes() {
    return {
      id: {
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
