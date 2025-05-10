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
