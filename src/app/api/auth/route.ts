import { liveblocks } from "@/app/liveblocks";

if (!process.env.LB_KEY) {
  console.log("!!! SET LIVEBLOCKS SECRET ENVIRONMENT VARIABLE (LB_KEY)");
}

interface AuthRequest {
  roomId: string | undefined;
  userId: string,
}

export async function POST(request: Request) {
  // technically, this is where we'd check a name/pass combination
  // and deny the login request if it doesn't match some DB entry
  // before we call prepare session, but right now, I just want to move us
  // to using a secret.
  const authRequest: AuthRequest = await request.json();
  if (!authRequest.roomId) {
    return new Response("Specify roomId in auth request.", { status: 401 });
  }

  const session = liveblocks.prepareSession(authRequest.userId);
  session.allow(`${authRequest.roomId}`, session.FULL_ACCESS); // wild card access to all rooms

  const { status, body } = await session.authorize();

  return new Response(body, { status });
}
