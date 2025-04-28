"use server"


// TODO: probably change the data to be of whatever type captures required context,
// then actually invoke the LLM and return something back to the client
export async function prompt(doc_name: string, data: string) {
    console.log(`<PROMPT> ${doc_name} => ${data}`)
    return "from server!"
}