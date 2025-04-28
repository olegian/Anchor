"use server"

// TODO: probably change the data to be of whatever type captures required context,
// then actually invoke the LLM and return something back to the client.
// TODO: connect to liveblocks stored doc data via https://api.liveblocks.io/v2 endpoint.
// this probably requires a private API key, which is cool cause the use server protects us anyways.
// https://liveblocks.io/docs/api-reference/rest-api-endpoints >> Storage section
export async function prompt(doc_name: string, data: string) {
    console.log(`<PROMPT> ${doc_name} => ${data}`)
    return "from server!"
}