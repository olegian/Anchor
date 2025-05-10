import { Liveblocks } from "@liveblocks/node";

// THIS SHOULD ONLY BE USED SERVER SIDE!
export const liveblocks = new Liveblocks({
  secret: process.env.LB_KEY ?? "",
});
