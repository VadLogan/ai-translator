// Local development entrypoint. Production runs index.ts (and voice.ts) on Supabase Edge Functions
// instead; everything that differs between the two lives in dev-gateway.ts and here, never in app.ts.
// Env comes from node --env-file-if-exists (see the `dev` script), so there is no dotenv
// import-order rule to get wrong.
import { serve } from '@hono/node-server';
import { WebSocketServer } from 'ws';
import { gateway } from '../dev/dev-gateway.ts';
import { voiceStream } from './controllers/voiceStream.ts';

const port = Number(process.env.PORT ?? 8787);

// /voice-session signs the live-dictation tickets and the voice socket checks them; here both run in
// this one process, so a per-process secret works when none is configured. The edge needs a real one.
process.env.VOICE_TICKET_SECRET ??= crypto.randomUUID();

const server = serve({ fetch: gateway.fetch, port }, ({ port }) => {
  console.info(`AI Translator API (local) on http://127.0.0.1:${port}/functions/v1/api`);
});

// [functions.voice]: the live-dictation socket. Node's HTTP server hands upgrades to us, not to Hono.
const sockets = new WebSocketServer({ noServer: true });
server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  if (url.pathname !== '/functions/v1/voice') return socket.destroy();
  sockets.handleUpgrade(req, socket, head, (ws) => void voiceStream(ws, url.searchParams.get('ticket')));
});
