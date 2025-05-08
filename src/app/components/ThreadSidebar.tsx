// NOTE: This is the original styling of the threadsidebar code which works fine but doesn't use tailwind - something
// needs to be configured for this to work
// "use client";
// import React, { useEffect } from "react";
// import { Button } from "../components/ui/button";
// import { useThreadStore } from "../lib/threadStore";
// import { Trash2, Eye } from "lucide-react";
// import { cn } from "../lib/utils";

// export default function ThreadSidebar() {
//   const {
//     threads,
//     currentUser,
//     deleteThread,
//     fetchThreads,
//     isThreadInUse,
//   } = useThreadStore();

//   useEffect(() => {
//     fetchThreads();
//   }, []);

//   return (
//     <aside className="w-72 bg-gradient-to-br from-gray-900 to-zinc-800 text-gray-100 shadow-lg rounded-lg overflow-hidden border-r border-zinc-700">
//       <div className="p-6 border-b border-zinc-700">
//         <h2 className="text-xl font-semibold tracking-tight text-white">
//           Project Threads
//         </h2>
//         <p className="text-sm text-gray-400 mt-1">
//           Manage your active discussion threads.
//         </p>
//       </div>
//       <ul className="py-3 divide-y divide-zinc-700">
//         {threads.map((thread) => (
//           <li
//             key={thread.id}
//             className={cn(
//               "px-4 py-3 hover:bg-zinc-700 transition-colors duration-200 ease-in-out",
//               thread.activeUser && "bg-zinc-800" // Subtle highlight for active threads
//             )}
//           >
//             <div className="flex justify-between items-center">
//               <div className="flex flex-col overflow-hidden">
//                 <span className="font-medium text-sm text-gray-200 truncate">
//                   {thread.title}
//                 </span>
//                 {thread.activeUser && (
//                   <span className="text-xs text-gray-500 mt-0.5">
//                     {thread.activeUser === currentUser ? "You are here" : `Active by ${thread.activeUser}`}
//                   </span>
//                 )}
//               </div>
//               <div className="flex items-center space-x-2">
//                 <Button size="icon" variant="ghost" className="text-gray-400 hover:text-gray-300">
//                   <Eye size={16} />
//                 </Button>
//                 <Button
//                   size="icon"
//                   variant="destructive"
//                   disabled={isThreadInUse(thread)}
//                   className="text-red-500 hover:bg-red-700/20"
//                   onClick={() => deleteThread(thread.id)}
//                 >
//                   <Trash2 size={16} />
//                 </Button>
//               </div>
//             </div>
//           </li>
//         ))}
//         {threads.length === 0 && (
//           <li className="px-4 py-3 text-sm text-gray-500 italic">
//             No threads available yet.
//           </li>
//         )}
//       </ul>
//     </aside>
//   );
// }

// NOTE 2: this has a slightly different design, where the user is actually adding threads, and im not sure if this is what we want or to
// combine them somehow
// components/ThreadSidebar.tsx
// "use client";

// import React, { useState } from "react";
// import "../styling/ThreadSidebar.css";

// type Thread = {
//   id: string;
//   title: string;
//   inUse: boolean;
// };

// export default function ThreadSidebar() {
//   const [threads, setThreads] = useState<Thread[]>([]);
//   const [activeId, setActiveId] = useState<string | null>(null);
//   const [newTitle, setNewTitle] = useState("");

//   const addThread = () => {
//     if (!newTitle.trim()) return;
//     const newThread = {
//       id: Date.now().toString(),
//       title: newTitle.trim(),
//       inUse: false,
//     };
//     setThreads([newThread, ...threads]);
//     setNewTitle("");
//   };

//   const deleteThread = (id: string) => {
//     const thread = threads.find((t) => t.id === id);
//     if (thread?.inUse) {
//       alert("Thread is currently in use!");
//       return;
//     }
//     setThreads(threads.filter((t) => t.id !== id));
//     if (activeId === id) setActiveId(null);
//   };

//   return (
//     <div className="thread-sidebar">
//       <div className="sidebar-header">
//         <h2>🧵 Threads</h2>
//         <div className="new-thread-form">
//           <input
//             value={newTitle}
//             onChange={(e) => setNewTitle(e.target.value)}
//             placeholder="New thread title"
//           />
//           <button onClick={addThread}>➕</button>
//         </div>
//       </div>
//       <div className="thread-list">
//         {threads.length === 0 && (
//           <p className="empty-text">No threads yet.</p>
//         )}
//         {threads.map((thread) => (
//           <div
//             key={thread.id}
//             className={`thread-item ${thread.id === activeId ? "active" : ""}`}
//             onClick={() => setActiveId(thread.id)}
//           >
//             <span>{thread.title}</span>
//             <div className="thread-actions">
//               {thread.inUse && <small className="in-use">in use</small>}
//               <button onClick={(e) => {
//                 e.stopPropagation();
//                 deleteThread(thread.id);
//               }}>🗑</button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// NOTE 3: This code has a better UI i would say, but the user cannot add threads
// "use client";

// import React, { useEffect } from "react";
// import { Button } from "../components/ui/button";
// import { useThreadStore } from "../lib/threadStore";
// import { Trash2, Eye } from "lucide-react";
// import "../styling/ThreadSidebar.css";

// export default function ThreadSidebar() {
//   const { threads, currentUser, deleteThread, fetchThreads, isThreadInUse } = useThreadStore();

//   useEffect(() => {
//     fetchThreads();
//   }, []);

//   return (
//     <div className="sidebar-container">
//       <h2 className="sidebar-header">Threads</h2>
//       <ul className="thread-list">
//         {threads.map((thread) => (
//           <li key={thread.id} className="thread-item">
//             <div>
//               <span className="thread-title">{thread.title}</span>
//               {thread.activeUser && (
//                 <span className="thread-user">
//                   In use by {thread.activeUser === currentUser ? "you" : thread.activeUser}
//                 </span>
//               )}
//             </div>
//             <div className="button-group">
//               <Button size="icon" variant="default" className="button view">
//                 <Eye size={18} />
//               </Button>
//               <Button
//                 size="icon"
//                 variant="destructive"
//                 disabled={isThreadInUse(thread)}
//                 onClick={() => deleteThread(thread.id)}
//                 className="button delete"
//               >
//                 <Trash2 size={18} />
//               </Button>
//             </div>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }

"use client";

import React, { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
// import { Trash2, Eye, Plus } from "lucide-react";
import { useThreadStore } from "../lib/threadStore";
import "../styling/ThreadSidebar.css";

export default function ThreadSidebar() {
  const {
    threads,
    currentUser,
    deleteThread,
    fetchThreads,
    isThreadInUse,
    addThread, // Make sure this exists in your threadStore
  } = useThreadStore();

  const [newTitle, setNewTitle] = useState("");

  useEffect(() => {
    fetchThreads();
  }, []);

  const handleAddThread = () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    addThread(trimmed);
    setNewTitle("");
  };

  return (
    <div className="sidebar-container">
      <h2 className="sidebar-header">Threads</h2>

      {/* New thread input */}
      <div className="new-thread-form">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="New thread title"
          className="new-thread-input"
        />
        <Button size="icon" onClick={handleAddThread}>
          {/* <Plus size={18} /> */}
        </Button>
      </div>

      <ul className="thread-list">
        {threads.length === 0 && <p className="empty-text">No threads yet.</p>}
        {threads.map((thread) => (
          <li key={thread.id} className="thread-item">
            <div>
              <span className="thread-title">{thread.title}</span>
              {thread.activeUser && (
                <span className="thread-user">
                  In use by{" "}
                  {thread.activeUser === currentUser
                    ? "you"
                    : thread.activeUser}
                </span>
              )}
            </div>
            <div className="button-group">
              <Button size="icon" variant="default" className="button view">
                {/* <Eye size={18} /> */}
              </Button>
              <Button
                size="icon"
                variant="destructive"
                disabled={isThreadInUse(thread)}
                onClick={() => deleteThread(thread.id)}
                className="button delete"
              >
                {/* <Trash2 size={18} /> */}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
