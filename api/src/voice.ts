// Supabase Edge Function entry for live dictation (config: supabase/config.toml -> [functions.voice]).
// Its own function because a browser WebSocket can't send an Authorization header, so the gateway's
// verify_jwt can't apply: verify_jwt is off here, and voiceStream opens a session only for a valid
// ticket from POST /voice-session.
import { voiceStream } from './controllers/voiceStream.ts';

// Declared rather than imported: tsc runs with types:["node"] and never sees Deno.
declare const Deno: {
  serve(handler: (req: Request) => Response): void;
  upgradeWebSocket(req: Request): { socket: WebSocket; response: Response };
};

Deno.serve((req) => {
  if (req.headers.get('upgrade')?.toLowerCase() !== 'websocket') return new Response('Expected a WebSocket', { status: 426 });
  const { socket, response } = Deno.upgradeWebSocket(req);
  void voiceStream(socket, new URL(req.url).searchParams.get('ticket'));
  return response;
});
