import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

interface Thread {
  id: string;
  title: string;
  activeUser: string | null;
}

interface ThreadStore {
  threads: Thread[];
  currentUser: string;
  fetchThreads: () => void;
  deleteThread: (id: string) => void;
  isThreadInUse: (thread: Thread) => boolean;
}

export const useThreadStore = create<ThreadStore>((set, get) => ({
  threads: [],
  currentUser: "Olena", // mock user rn
  fetchThreads: () => {
    // we have an example data fetch (but we'll replace w/ an api call)
    set({
      threads: [
        { id: "1", title: "Intro Expansion", activeUser: "Olena" },
        { id: "2", title: "Abstract v3", activeUser: null },
        { id: "3", title: "Method Edits", activeUser: "Igor" },
      ],
    });
  },
  deleteThread: (id) => {
    const thread = get().threads.find((t) => t.id === id);
    if (thread && !thread.activeUser) {
      set({ threads: get().threads.filter((t) => t.id !== id) });
    } else {
      alert("Thread is in use and cannot be deleted.");
    }
  },
  isThreadInUse: (thread) => !!thread.activeUser,
}));