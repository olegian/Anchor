"use client"

import { ReactNode } from "react";
import {
    LiveblocksProvider,
    RoomProvider,
    ClientSideSuspense
} from "@liveblocks/react/suspense"

const LIVEBLOCKS_PUBLIC_API_KEY = "pk_dev_YlTlbPGNlgkQJSuCMBGw-daIOD8FlaXTk0zhmfkZjILXhPscK37KfZrk-Aq7W3TH";

export function Room({ children, doc_name }: { children: ReactNode, doc_name: string }) {
    return (
        <LiveblocksProvider publicApiKey={LIVEBLOCKS_PUBLIC_API_KEY}>
            <RoomProvider id={doc_name}>
                <ClientSideSuspense fallback={<div>Loading...</div>}> 
                    { children }
                </ClientSideSuspense>
            </RoomProvider>
        </LiveblocksProvider>
    )
}


