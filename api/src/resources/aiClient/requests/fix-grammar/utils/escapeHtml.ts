export const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
