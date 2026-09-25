import { HOSTNAME } from '../../../shared/contract';

/** True when `host` is a listed site or a subdomain of one: example.com covers mail.example.com. */
export function isSiteDisabled(host: string, disabledSites: readonly string[]): boolean {
  const lower = host.toLowerCase();
  return disabledSites.some((site) => lower === site || lower.endsWith(`.${site}`));
}

/**
 * The hostnames typed into the options page, one per line or comma separated. A pasted url is
 * reduced to its hostname; anything that isn't one is returned in `invalid`.
 */
export function parseSites(input: string): { sites: string[]; invalid: string[] } {
  const sites = new Set<string>();
  const invalid: string[] = [];
  for (const entry of input.split(/[\s,]+/).filter(Boolean)) {
    let host = '';
    try {
      host = new URL(entry.includes('://') ? entry : `https://${entry}`).hostname.replace(/^www\./, '');
    } catch {
      // Not a url at all; reported below.
    }
    if (HOSTNAME.test(host)) sites.add(host);
    else invalid.push(entry);
  }
  return { sites: [...sites], invalid };
}
