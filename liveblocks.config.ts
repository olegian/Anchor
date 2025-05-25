// Define Liveblocks types for your application

import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";

export type Conversation = LiveObject<{
  isPending: boolean; // whether there is a request that is currently outstanding
  exchanges: LiveList<LiveObject<{ prompt: string; response: string }>>; // in order
  owner: string; //  userid of person who is currently moving a specific anchor, or "" for no owner
  handleName: string; // optional name for the handle
  wordIdx: number; // -1 if not handle is not hooked onto any word
  paragraphIdx: number; // same as ^
  x: number; // on screen x-position
  y: number; // on screen y-position
  width: number; // width of the handle
  height: number; // height of the handle
}>;

export type Handles = LiveMap<
  string, // handleId
  Conversation
>;

export type HandlesMap = ReadonlyMap<
  string,
  {
    readonly isPending: boolean;
    readonly exchanges: readonly {
      readonly prompt: string;
      readonly response: string;
    }[];
    readonly handleName: string;
    readonly owner: string;
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
  }
> | null;

// https://liveblocks.io/docs/api-reference/liveblocks-react#Typing-your-data
declare global {
  interface Liveblocks {
    // Each user's Presence, for useMyPresence, useOthers, etc.
    Presence: {
      // Example, real-time cursor coordinates
      // cursor: { x: number; y: number };
      openHandles: string[]; // ids of all actively opened handles
      name: string;
    };

    // The Storage tree for the room, for useMutation, useStorage, etc.
    Storage: {
      // Example, a conflict-free list
      // animals: LiveList<string>;

      docHandles: Handles; // snapshotId -> snapshot information
      docTitle: string;
    };

    // Custom user info set when authenticating with a secret key
    UserMeta: {
      id: string;
      info: {
        // Example properties, for useSelf, useUser, useOthers, etc.
        // name: string;
        // avatar: string;
      };
    };

    // Custom events, for useBroadcastEvent, useEventListener
    RoomEvent: {};
    // Example has two events, using a union
    // | { type: "PLAY" }
    // | { type: "REACTION"; emoji: "🔥" };

    // Custom metadata set on threads, for useThreads, useCreateThread, etc.
    ThreadMetadata: {
      // Example, attaching coordinates to a thread
      // x: number;
      // y: number;
    };

    // Custom room info set with resolveRoomsInfo, for useRoomInfo
    RoomInfo: {
      // Example, rooms with a title and url
      // title: string;
      // url: string;
    };
  }
}
