# GitGPT (better name pending)
To run, specify the following three environment variables in `.env.local`:
- `LB_KEY`, a LiveBlocks secret key.
- `AUTH_SECRET`, a random string used to encrypt authentication tokens, created by running `npx auth secret`.
- `GEMINI_API_KEY`, you guessed it, a Gemini API key.

Then, run `npm install`, followed by `npm run dev`, and the application should start on port 3000.


**Course Staff**: if you want to run this on your own, you can either use a brand new [LiveBlocks](https://liveblocks.io/) account (with a brand new project setup), or if you'd like to have your account added to the dev project, please let one of us know. This will really only determine the "bank" of documents shown to users, and as it stands right now, all users can access all documents under one LiveBlocks project.

Note that two people can run this application on their own local machines, and document access and content is still synced between them, given they use the same LiveBlocks key. You can also just use two tabs to explore what realtime editing with other users looks like, if you don't have any friends :(.

### A Note on Authentication
Currently, authentication is kind of spoofed, there is no actual way to signup with a new user, but feel free to use the three dev user profiles (any of our initials as the username, with any password). While the authentication management is setup, we have not gotten around to adding a users database, as there were bigger priorities.
