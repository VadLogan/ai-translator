import { createMiddleware } from 'hono/factory';
import { fail, requestId, type AppEnv } from '../utils/http.ts';
import { mask } from '../utils/exceptions.ts';
import type { VocabException } from '../../../shared/contract.ts';
import { scopedLogger } from '../resources/logger.ts';
import { GUARD_MESSAGES, validateGuard, type GuardVerdict } from '../resources/aiClient/requests/validateGuard.ts';

/**
 * 422s a text that is no language -- a wrong keyboard layout or random keystrokes -- before the
 * provider call it would waste. The one middleware allowed to call an AI request. Runs after
 * validate(), which put `text` on the body. Fails open: a guard outage must not block translating.
 */
export const guardText = createMiddleware<AppEnv>(async (c, next) => {
  const { text, sourceLang, guarded, exceptions } = c.get('body') as { text: string; sourceLang?: string; guarded?: boolean; exceptions?: VocabException[] };
  // A translate with sourceLang follows a /detect, a fix marked guarded a /check, that already
  // guarded this text: skip the second guard call (0.3-0.9 s). A client could skip it on purpose,
  // but that only spends its own rate limit.
  if (sourceLang || guarded) return next();
  let verdict: GuardVerdict | null = null;
  try {
    // Masked, so a code term like `kubectl` can't read as random keystrokes.
    verdict = await validateGuard(mask(text, exceptions).text, c.req.raw.signal);
  } catch (error) {
    scopedLogger('guard', requestId().id).error('guard failed, letting the text through', error);
  }
  if (verdict) return fail(c, 422, verdict, GUARD_MESSAGES[verdict]);

  await next();
});
