"use client";
import { prompt } from "@/app/actions";
import { LiveObject } from "@liveblocks/client";
import { useMutation, useStorage } from "@liveblocks/react";
import { Session } from "next-auth";

export default function HandleInput({
  docId,
  handleId,
}: {
  docId: string;
  handleId: string;
}) {
    // use this to access any storage data associated with this handle
  const handleInfo = useStorage((root) => {
    root.docHandles.get(handleId);
  });

  // This isn't an ideal solution, cursors won't show up in prompt boxes, and concurrent edits (probably)
  // wont look that clean, but the alternative is to use a whole ass editor as the prompt box,
  // and I would rather not do that for now. I think we can pivot to that if this
  // doesnt work too well
  const changeCurrentPrompt = useMutation(({ storage }, newPrompt) => {
    const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");

    // note that the first element of exchanges should have been initialized when the handle was created
    // so this is actually a safe access. Typescript moment in having to type this comment out.
    exchanges?.get(exchanges.length - 1)?.set("prompt", newPrompt);
  }, []);

  const openNewPrompt = useMutation(({ storage }) => {
    const exchanges = storage.get("docHandles").get(handleId)?.get("exchanges");
    if (!exchanges?.get(exchanges?.length - 1)?.get("response")) {
      // trying to open new a prompt without getting response from previous one
      return false;
    } else {
      exchanges.push(new LiveObject({ prompt: "", response: "" }));
      return true;
    }
  }, []);

  const deleteHandle = useMutation(({storage}) => {
    storage.get("docHandles").delete(handleId); // this is all the state cleanup we should need to do!
  }, [])

  // if you want a default name to be set when the handle is created, do that in the createHandleHandler
  // otherwise, its currently an empty string
  const setHandleName = useMutation(({ storage }, newName) => {
    storage.get("docHandles").get(handleId)?.set("handleName", newName);
  }, []);

  const setHandlePosition = useMutation(({ storage }, x, y) => {
    const handleInfo = storage.get("docHandles").get(handleId);

    handleInfo?.set("x", x);
    handleInfo?.set("y", y);
  }, []);

  // lock out other users from making requests
  // TODO: change this so that userid is also stored, so that the server can vett that 
  // only the user that acquired locked can actually make the request.
  const setPending = useMutation(({ storage }, isPending) => {
    const handleInfo = storage.get("docHandles").get(handleId);

    if (isPending) {
      // trying to acquire lock
      const handleInfo = storage.get("docHandles").get(handleId);
      if (handleInfo?.get("isPending")) {
        // someone already grabbed it
        return false;
      } else {
        handleInfo?.set("isPending", true);
      }

      return true;
    } else {
      // trying to release lock, just do it unconditionally.
      // i've written this comment a bunch -- this is not that cool to do from a concurrency standpoint but eh

      handleInfo?.set("isPending", false);
      return true;
    }
  }, []);

  // PROMPT HANDLERS
  const onPromptBoxChange = () => {
    const promptText = "fetch this from the input box";

    changeCurrentPrompt(promptText);
  };

  const onPromptSubmit = () => {
    // TODO: lock out user from making input to the prompt box (btw, this might be easier to do just with isPending in storage)
    // as in dont allow people to type in the chat box if the llm is currently trying to respond

    if (!setPending(true)) {
      // TODO: report that there is already a prompt pending
      return;
    }

    // TODO: theres a choice here of either sending the prompt to the server from the client
    // or having the server fetch the state of the prompt held in live storage, which if the
    // onChange is working well, maybe thats better?
    // TODO: My current idea is to do the handle -> doc position conversion server side.
    // look for that there, but maybe its better to do it here instead?
    prompt(docId, handleId);

    if (!openNewPrompt()) {
        // TODO: this should never happen, but just in case leave this for now
        // its for if somehow we end up trying to start a new prompt without resolving the previous one
        console.log("Prompt state is weird!!! Check that out ASAP!")
    }

    setPending(false);

    // TODO: allow user to make input to the prompt box
  };

  // HANDLE HANDLERS (haha)
  const onChangePosition = () => {
    const x = 0; // probably fetch these from the movement event or from the mouse position
    const y = 0; // or state or wherever you decide to store the position

    // note, most of this logic can also be moved into the dependancy array of setHandlePosition,
    // the above useMutation takes a second dependancy list parameter, and that can be used to run the mutation
    // on change of the above x, y values. Read https://liveblocks.io/docs/api-reference/liveblocks-react
    setHandlePosition(x, y);
  };

  const onChangeTitle = () => {
    const newTitle = "fetch from the input box";

    setHandleName(newTitle);
  };

  return <></>;
}
