"use client";
import React, { useEffect, useState } from "react";
import {Button} from "../components/ui/button";
import {useThreadStore} from "../lib/threadStore";
import { Trash2, Eye } from "lucide-react";

export default function ThreadSidebar() {
  const {
    threads,
    currentUser,
    deleteThread,
    fetchThreads,
    isThreadInUse,
  } = useThreadStore();

  useEffect(() => {
    fetchThreads();
  }, []);

  return (
    <div className="w-80 border-r p-4 space-y-4 bg-gray-100">
      <h2 className="text-lg font-bold">Threads</h2>
      <ul className="space-y-2">
        {threads.map((thread) => (
          <li key={thread.id} className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="font-medium truncate w-48">{thread.title}</span>
              {thread.activeUser && (
                <span className="text-xs text-gray-500">
                  In use by {thread.activeUser === currentUser ? "you" : thread.activeUser}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button size="icon" variant="default"> 
                <Eye size={16} />
              </Button>
              <Button
                size="icon"
                variant="destructive"
                disabled={isThreadInUse(thread)}
                onClick={() => deleteThread(thread.id)}
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}