// "use client";

// import { ReactNode } from "react";
// import {
//   LiveblocksProvider,
//   RoomProvider,
//   ClientSideSuspense,
// } from "@liveblocks/react/suspense";
// import { LiveList, LiveObject } from "@liveblocks/client";

// const LIVEBLOCKS_PUBLIC_API_KEY =
//   "pk_dev_YlTlbPGNlgkQJSuCMBGw-daIOD8FlaXTk0zhmfkZjILXhPscK37KfZrk-Aq7W3TH";

// export function Room({
//   children,
//   doc_name,
// }: {
//   children: ReactNode;
//   doc_name: string;
// }) {
//   // TODO: increase refresh rate by somehow changing throttle paramater. search through liveblocks docs.
//   return (
//     <LiveblocksProvider publicApiKey={LIVEBLOCKS_PUBLIC_API_KEY}>
//       <RoomProvider
//         id={doc_name}
//         initialStorage={{
//           snapshots: new LiveList([ ]),
//         }}
//       >
//         <ClientSideSuspense fallback={<div>Loading...</div>}>
//           {children}
//         </ClientSideSuspense>
//       </RoomProvider>
//     </LiveblocksProvider>
//   );
// }
"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { LiveList, LiveMap, LiveObject } from "@liveblocks/client";
import type { LsonObject } from "@liveblocks/client";

const LIVEBLOCKS_PUBLIC_API_KEY =
  "pk_dev_YlTlbPGNlgkQJSuCMBGw-daIOD8FlaXTk0zhmfkZjILXhPscK37KfZrk-Aq7W3TH";

// Define the storage schema to fix TypeScript errors
interface SnapshotEntry extends LsonObject {
  preview: string;
  snapshotId: string;
}

// Define the storage shape
type Storage = {
  snapshots: LiveList<LiveObject<SnapshotEntry>>;
  // We don't need to store prompt history in LiveMap since we're using server-side memory
};

export function Room({
  children,
  doc_name,
}: {
  children: ReactNode;
  doc_name: string;
}) {
  return (
    <LiveblocksProvider publicApiKey={LIVEBLOCKS_PUBLIC_API_KEY}>
      <RoomProvider
        id={doc_name}
        initialStorage={{
          snapshots: new LiveList([]),
          // Remove promptHistory from initial storage since we're handling it server-side
        }}
      >
        <ClientSideSuspense fallback={<div>Loading...</div>}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}