export const SCHEMA = {
  nodes: {
    paragraph: {
      content: "inline*",
      group: "block",
      attrs: {
        ychange: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag: "p",
        },
      ],
    },
    liveblocksMention: {
      group: "inline",
      inline: true,
      atom: true,
      selectable: true,
      attrs: {
        id: {
          default: null,
        },
        notificationId: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag: "liveblocks-mention",
        },
      ],
    },
    blockquote: {
      content: "block+",
      group: "block",
      defining: true,
      parseDOM: [
        {
          tag: "blockquote",
        },
      ],
    },
    bulletList: {
      content: "listItem+",
      group: "block list",
      parseDOM: [
        {
          tag: "ul",
        },
      ],
    },
    codeBlock: {
      content: "text*",
      marks: "",
      group: "block",
      code: true,
      defining: true,
      attrs: {
        language: {
          default: null,
        },
      },
    },
    doc: {
      content: "block+",
    },
    hardBreak: {
      group: "inline",
      inline: true,
      selectable: false,
      linebreakReplacement: true,
      parseDOM: [
        {
          tag: "br",
        },
      ],
    },
    heading: {
      content: "inline*",
      group: "block",
      defining: true,
      attrs: {
        ychange: {
          default: null,
        },
        level: {
          default: 1,
        },
      },
      parseDOM: [
        {
          tag: "h2",
          attrs: {
            level: 2,
          },
        },
      ],
    },
    horizontalRule: {
      group: "block",
      parseDOM: [
        {
          tag: "hr",
        },
      ],
    },
    listItem: {
      content: "paragraph block*",
      defining: true,
      parseDOM: [
        {
          tag: "li",
        },
      ],
    },
    orderedList: {
      content: "listItem+",
      group: "block list",
      attrs: {
        start: {
          default: 1,
        },
        type: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag: "ol",
        },
      ],
    },
    text: {
      group: "inline",
    },
  },
  marks: {
    paraAttachedSpan: {
      attrs: {
        id: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag: "span",
        },
      ],
    },
    attachedSpan: {
      attrs: {
        id: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag: "span",
        },
      ],
    },
    ychange: {
      inclusive: false,
      attrs: {
        user: {
          default: null,
        },
        type: {
          default: null,
        },
        color: {
          default: null,
        },
      },
      parseDOM: [
        {
          tag: "ychange",
        },
      ],
    },
    liveblocksCommentMark: {
      inclusive: false,
      excludes: "",
      attrs: {
        orphan: {
          default: false,
        },
        threadId: {
          default: "",
        },
      },
      parseDOM: [
        {
          tag: "span",
        },
      ],
    },
    bold: {
      parseDOM: [
        {
          tag: "strong",
        },
        {
          tag: "b",
        },
        {
          style: "font-weight=400",
        },
        {
          style: "font-weight",
        },
      ],
    },
    code: {
      excludes: "_",
      code: true,
      parseDOM: [
        {
          tag: "code",
        },
      ],
    },
    italic: {
      parseDOM: [
        {
          tag: "em",
        },
        {
          tag: "i",
        },
        {
          style: "font-style=normal",
        },
        {
          style: "font-style=italic",
        },
      ],
    },
    strike: {
      parseDOM: [
        {
          tag: "s",
        },
        {
          tag: "del",
        },
        {
          tag: "strike",
        },
        {
          style: "text-decoration",
          consuming: false,
        },
      ],
    },
  },
};
