# Anchor (formerly GitGPT)
To run, specify the following three environment variables in `.env.local`:
- `LB_KEY`, a LiveBlocks secret key.
- `AUTH_SECRET`, a random string used to encrypt authentication tokens, created by running `npx auth secret`.
- `GEMINI_API_KEY`, you guessed it, a Gemini API key.
- `FIREBASE_API_KEY`, I value the readers intellect in knowing what this is.
- `FIREBASE_PROJECT_ID`, this currently must be the Firebase project used by the current maintainers, as without a signup page, there's no way to directly add new users at the moment, and an empty users database won't do anyone good. Contact the developers for this value.

Then, run `npm install`, followed by `npm run dev`, and the application should start on port 3000.


**Course Staff**: if you want to run this on your own, you can either use a brand new [LiveBlocks](https://liveblocks.io/) account (with a brand new project setup), or if you'd like to have your account added to the dev project, please let one of us know. This will really only determine the "bank" of documents shown to users, and as it stands right now, all users can access all documents under one LiveBlocks project. Its more important to have the correct Firebase project connected, as that determines who can sign in to even use the application.

Note that two people can run this application on their own local machines, and document access and content is still synced between them, given they use the same LiveBlocks key. You can also just use two tabs to explore what realtime editing with other users looks like, if you don't have any friends :(.

