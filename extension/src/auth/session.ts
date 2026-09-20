import { storage } from 'wxt/utils/storage';

/** A Supabase session, as much of it as the extension needs. */
export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Epoch ms. Refreshed before this, not on a timer -- an MV3 worker is killed between requests. */
  expiresAt: number;
  email?: string;
}

// Its own item rather than a field on Settings: the options page's update() does a shallow
// spread, which would clobber a nested session object.
const sessionItem = storage.defineItem<Session | null>('local:session', { fallback: null });

export const storageSession = {
  get: () => sessionItem.getValue(),
  set: (session: Session) => sessionItem.setValue(session),
  clear: () => sessionItem.setValue(null),
  /** Fires on sign-in and sign-out, including from another extension page. */
  watch: (onChange: (session: Session | null) => void) => sessionItem.watch(onChange),
};
