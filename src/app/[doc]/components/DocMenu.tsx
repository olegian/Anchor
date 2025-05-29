import { deleteDoc } from "@/app/actions";
import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import {
  ChevronDownIcon,
  TrashIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  DocumentTextIcon,
} from "@heroicons/react/16/solid";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
const DeleteDocDialog = dynamic(() => import("./dialog/DeleteDocDialog"));
const DeleteAnchorsDialog = dynamic(() => import("./dialog/DeleteAnchorsDialog"));
import { useState } from "react";
import { useMutation } from "@liveblocks/react";
import { Editor } from "@tiptap/react";
import { ParaSpansNode } from "./interaction/ParagraphSpanMark";
import { SpansMark } from "./interaction/SpansMark";

// You'll need to install these dependencies:
// npm install jspdf turndown

interface DocMenuProps {
  showText?: boolean;
  editor?: Editor; // TipTap editor instance
  title?: string; // Document title for filename
}

export default function DocMenu({ showText = false, editor, title = "document" }: DocMenuProps) {
  const params = useParams<{ doc: string }>();
  const router = useRouter();

  const deleteDocHandler = () => {
    deleteDoc(params.doc).then(() => {
      router.push("/home");
    });
  };

  const deleteAllAnchors = useMutation(({ storage }) => {
    storage.get("docHandles").forEach((handle, handleId) => {
      const attachedSpanId = handle.get("attachedSpan");
      if (attachedSpanId) {
        storage.get("attachPoints").delete(attachedSpanId);
      }

      storage.get("docHandles").delete(handleId);
    });

    storage.get("attachPoints").forEach((point, spanId) => {
      storage.get("attachPoints").delete(spanId);
    });
  }, []);

  const deleteAnchorsHandler = () => {
    deleteAllAnchors();

    // remove all spans
    const paraNodes = editor?.$nodes("paraAttachedSpan");
    paraNodes?.forEach((node) => {
      editor?.chain().setNodeSelection(node.pos).toggleWrap(ParaSpansNode.name).run();
    })

    editor?.chain().selectAll().unsetMark(SpansMark.name).run()
  };

  const exportToPDF = async () => {
    if (!editor) {
      console.error("Editor not available");
      return;
    }

    try {
      // Dynamic import to reduce bundle size
      const jsPDF = (await import("jspdf")).default;

      // Get JSON content from TipTap editor for better structure parsing
      const jsonContent = editor.getJSON();

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // PDF settings
      let yPosition = 20;
      const pageHeight = 270; // A4 height minus margins
      const leftMargin = 20;
      const rightMargin = 190;
      const maxWidth = rightMargin - leftMargin;

      // Add title
      pdf.setFontSize(18);
      pdf.setFont("helvetica", "bold");
      const titleText = title || "Document";
      pdf.text(titleText, leftMargin, yPosition);
      yPosition += 15;

      // Process TipTap JSON content
      const processContent = (content: any[]) => {
        content.forEach((node: any) => {
          if (yPosition > pageHeight) {
            pdf.addPage();
            yPosition = 20;
          }

          switch (node.type) {
            case "heading":
              const level = node.attrs?.level || 1;
              pdf.setFontSize(level === 1 ? 16 : level === 2 ? 14 : 12);
              pdf.setFont("helvetica", "bold");

              const headingText = extractTextFromNode(node);
              const headingLines = pdf.splitTextToSize(headingText, maxWidth);

              headingLines.forEach((line: string) => {
                if (yPosition > pageHeight) {
                  pdf.addPage();
                  yPosition = 20;
                }
                pdf.text(line, leftMargin, yPosition);
                yPosition += 8;
              });
              yPosition += 5; // Extra space after heading
              break;

            case "paragraph":
              pdf.setFontSize(11);
              pdf.setFont("helvetica", "normal");

              const paragraphText = extractTextFromNode(node);
              if (paragraphText.trim()) {
                const paragraphLines = pdf.splitTextToSize(paragraphText, maxWidth);

                paragraphLines.forEach((line: string) => {
                  if (yPosition > pageHeight) {
                    pdf.addPage();
                    yPosition = 20;
                  }
                  pdf.text(line, leftMargin, yPosition);
                  yPosition += 6;
                });
                yPosition += 3; // Space between paragraphs
              }
              break;

            case "bulletList":
            case "orderedList":
              pdf.setFontSize(11);
              pdf.setFont("helvetica", "normal");

              if (node.content) {
                node.content.forEach((listItem: any, index: number) => {
                  if (yPosition > pageHeight) {
                    pdf.addPage();
                    yPosition = 20;
                  }

                  const bullet = node.type === "bulletList" ? "• " : `${index + 1}. `;
                  const itemText = extractTextFromNode(listItem);
                  const fullText = bullet + itemText;

                  const itemLines = pdf.splitTextToSize(fullText, maxWidth - 10);
                  itemLines.forEach((line: string, lineIndex: number) => {
                    if (yPosition > pageHeight) {
                      pdf.addPage();
                      yPosition = 20;
                    }
                    const xPos = lineIndex === 0 ? leftMargin : leftMargin + 10;
                    pdf.text(line, xPos, yPosition);
                    yPosition += 6;
                  });
                });
              }
              yPosition += 3;
              break;

            default:
              // Handle other node types
              const defaultText = extractTextFromNode(node);
              if (defaultText.trim()) {
                pdf.setFontSize(11);
                pdf.setFont("helvetica", "normal");

                const defaultLines = pdf.splitTextToSize(defaultText, maxWidth);
                defaultLines.forEach((line: string) => {
                  if (yPosition > pageHeight) {
                    pdf.addPage();
                    yPosition = 20;
                  }
                  pdf.text(line, leftMargin, yPosition);
                  yPosition += 6;
                });
                yPosition += 3;
              }
          }
        });
      };

      // Helper function to extract text from TipTap JSON node
      const extractTextFromNode = (node: any): string => {
        if (!node) return "";

        if (node.type === "text") {
          return node.text || "";
        }

        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractTextFromNode).join("");
        }

        return "";
      };

      // Process the document content
      if (jsonContent.content) {
        processContent(jsonContent.content);
      }

      // Download the PDF
      const fileName = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      alert("Failed to export PDF. Please try again.");
    }
  };

  const exportToMarkdown = async () => {
    if (!editor) {
      console.error("Editor not available");
      return;
    }

    try {
      // Get JSON content from TipTap editor
      const jsonContent = editor.getJSON();

      // Convert TipTap JSON to Markdown
      const convertToMarkdown = (content: any[]): string => {
        return content
          .map((node: any) => {
            switch (node.type) {
              case "heading":
                const level = node.attrs?.level || 1;
                const headingPrefix = "#".repeat(level);
                const headingText = extractTextFromNode(node);
                return `${headingPrefix} ${headingText}\n\n`;

              case "paragraph":
                const paragraphText = extractTextFromNode(node);
                return paragraphText.trim() ? `${paragraphText}\n\n` : "";

              case "bulletList":
                if (node.content) {
                  const listItems = node.content
                    .map((item: any) => {
                      const itemText = extractTextFromNode(item);
                      return `- ${itemText}`;
                    })
                    .join("\n");
                  return `${listItems}\n\n`;
                }
                return "";

              case "orderedList":
                if (node.content) {
                  const listItems = node.content
                    .map((item: any, index: number) => {
                      const itemText = extractTextFromNode(item);
                      return `${index + 1}. ${itemText}`;
                    })
                    .join("\n");
                  return `${listItems}\n\n`;
                }
                return "";

              case "codeBlock":
                const codeText = extractTextFromNode(node);
                const language = node.attrs?.language || "";
                return `\`\`\`${language}\n${codeText}\n\`\`\`\n\n`;

              case "blockquote":
                const quoteText = extractTextFromNode(node);
                return `> ${quoteText}\n\n`;

              default:
                const defaultText = extractTextFromNode(node);
                return defaultText.trim() ? `${defaultText}\n\n` : "";
            }
          })
          .join("");
      };

      // Helper function to extract text from TipTap JSON node
      const extractTextFromNode = (node: any): string => {
        if (!node) return "";

        if (node.type === "text") {
          let text = node.text || "";

          // Apply marks (formatting)
          if (node.marks) {
            node.marks.forEach((mark: any) => {
              switch (mark.type) {
                case "bold":
                case "strong":
                  text = `**${text}**`;
                  break;
                case "italic":
                case "em":
                  text = `*${text}*`;
                  break;
                case "code":
                  text = `\`${text}\``;
                  break;
                case "strike":
                  text = `~~${text}~~`;
                  break;
                case "link":
                  const href = mark.attrs?.href || "#";
                  text = `[${text}](${href})`;
                  break;
              }
            });
          }

          return text;
        }

        if (node.content && Array.isArray(node.content)) {
          return node.content.map(extractTextFromNode).join("");
        }

        return "";
      };

      // Convert content to Markdown
      let markdownContent = `# ${title}\n\n`;

      if (jsonContent.content) {
        markdownContent += convertToMarkdown(jsonContent.content);
      }

      // Create and download file
      const blob = new Blob([markdownContent], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting to Markdown:", error);
      alert("Failed to export Markdown. Please try again.");
    }
  };

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteAnchorsDialogOpen, setIsDeleteAnchorsDialogOpen] = useState(false);

  return (
    <>
      <Menu>
        <MenuButton
          className={`inline-flex items-center gap-1 text-sm rounded-xl cursor-pointer data-hover:bg-zinc-100 data-open:bg-zinc-100 transition-colors ${
            showText ? "px-2.5 py-1.5" : "p-1.5"
          } font-medium text-zinc-600`}
        >
          {showText && <span>Options</span>}
          <ChevronDownIcon className="size-4" />
        </MenuButton>

        <MenuItems
          transition
          anchor="bottom end"
          className="w-52 z-50 origin-top-right rounded-xl border border-zinc-200 bg-white p-1 text-sm/6 text-zinc-700 shadow-xl transition duration-100 ease-out [--anchor-gap:--spacing(1)] focus:outline-none data-closed:scale-95 data-closed:opacity-0"
        >
          {/* Export Options */}
          <MenuItem>
            <button
              className="group flex w-full items-center gap-2 rounded-xl px-3 py-1.5 data-focus:bg-zinc-100 font-medium cursor-pointer"
              onClick={exportToPDF}
            >
              <DocumentArrowDownIcon className="size-4 fill-blue-500" />
              Export as PDF
            </button>
          </MenuItem>
          <MenuItem>
            <button
              className="group flex w-full items-center gap-2 rounded-xl px-3 py-1.5 data-focus:bg-zinc-100 font-medium cursor-pointer"
              onClick={exportToMarkdown}
            >
              <DocumentTextIcon className="size-4 fill-green-500" />
              Export as Markdown
            </button>
          </MenuItem>

          {/* Divider */}
          <div className="my-1 h-px bg-zinc-200" />

          {/* Delete Options */}
          <MenuItem>
            <button
              className="group flex w-full items-center gap-2 rounded-xl px-3 py-1.5 data-focus:bg-zinc-100 font-medium cursor-pointer"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <TrashIcon className="size-4 fill-red-500" />
              Delete Document
            </button>
          </MenuItem>
          <MenuItem>
            <button
              className="group flex w-full items-center gap-2 rounded-xl px-3 py-1.5 data-focus:bg-zinc-100 font-medium cursor-pointer"
              onClick={() => setIsDeleteAnchorsDialogOpen(true)}
            >
              <XMarkIcon className="size-4 fill-red-500" />
              Delete all Anchors
            </button>
          </MenuItem>
        </MenuItems>
      </Menu>
      <DeleteDocDialog
        deleteDocHandler={deleteDocHandler}
        isOpen={isDeleteDialogOpen}
        close={() => setIsDeleteDialogOpen(false)}
      />
      <DeleteAnchorsDialog
        deleteAllAnchorsHandler={deleteAnchorsHandler}
        isOpen={isDeleteAnchorsDialogOpen}
        close={() => setIsDeleteAnchorsDialogOpen(false)}
      />
    </>
  );
}
