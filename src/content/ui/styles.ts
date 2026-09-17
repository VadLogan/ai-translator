export const WIDGET_CSS = /* css */ `
:host { all: initial; }
* { box-sizing: border-box; }

.widget {
  --bg: #ffffff;
  --fg: #1f2328;
  --muted: #656d76;
  --border: #d0d7de;
  --hover: #f3f4f6;
  --accent: #4f46e5;
  --danger: #cf222e;
  font: 13px/1.4 system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  color: var(--fg);
}
@media (prefers-color-scheme: dark) {
  .widget {
    --bg: #1f2328;
    --fg: #e6edf3;
    --muted: #9198a1;
    --border: #3d444d;
    --hover: #2d333b;
    --accent: #818cf8;
    --danger: #ff7b72;
  }
}

.icon, .panel { position: fixed; }
[hidden] { display: none !important; }

.icon {
  width: 26px;
  height: 26px;
  padding: 0;
  display: grid;
  place-items: center;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--bg);
  color: var(--accent);
  box-shadow: 0 2px 8px rgb(0 0 0 / 0.18);
  cursor: pointer;
}
.icon:hover { background: var(--hover); }
.icon svg { width: 16px; height: 16px; }

.panel {
  min-width: 180px;
  max-width: 260px;
  max-height: 320px;
  overflow: auto;
  padding: 4px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  box-shadow: 0 8px 24px rgb(0 0 0 / 0.2);
}

.title {
  padding: 6px 8px 4px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--muted);
}

.item {
  display: flex;
  width: 100%;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 8px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.item:hover { background: var(--hover); }
.code { color: var(--muted); font-size: 12px; }

.divider { height: 1px; margin: 4px 0; background: var(--border); }
.link { color: var(--muted); }

.status { display: flex; align-items: center; gap: 8px; padding: 8px; }
.error { padding: 8px; color: var(--danger); }

.spinner {
  width: 14px;
  height: 14px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
`;
