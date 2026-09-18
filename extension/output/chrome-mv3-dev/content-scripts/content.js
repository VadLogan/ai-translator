(function() {
	//#region \0rolldown/runtime.js
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
	//#endregion
	//#region ../node_modules/wxt/dist/utils/define-content-script.mjs
	function defineContentScript(definition) {
		return definition;
	}
	//#endregion
	//#region src/core/languages.ts
	var LANGUAGES = [
		{
			code: "ar",
			name: "Arabic"
		},
		{
			code: "bg",
			name: "Bulgarian"
		},
		{
			code: "zh",
			name: "Chinese"
		},
		{
			code: "cs",
			name: "Czech"
		},
		{
			code: "da",
			name: "Danish"
		},
		{
			code: "nl",
			name: "Dutch"
		},
		{
			code: "en",
			name: "English"
		},
		{
			code: "et",
			name: "Estonian"
		},
		{
			code: "fi",
			name: "Finnish"
		},
		{
			code: "fr",
			name: "French"
		},
		{
			code: "de",
			name: "German"
		},
		{
			code: "el",
			name: "Greek"
		},
		{
			code: "he",
			name: "Hebrew"
		},
		{
			code: "hi",
			name: "Hindi"
		},
		{
			code: "hu",
			name: "Hungarian"
		},
		{
			code: "id",
			name: "Indonesian"
		},
		{
			code: "it",
			name: "Italian"
		},
		{
			code: "ja",
			name: "Japanese"
		},
		{
			code: "ko",
			name: "Korean"
		},
		{
			code: "lv",
			name: "Latvian"
		},
		{
			code: "lt",
			name: "Lithuanian"
		},
		{
			code: "no",
			name: "Norwegian"
		},
		{
			code: "pl",
			name: "Polish"
		},
		{
			code: "pt",
			name: "Portuguese"
		},
		{
			code: "ro",
			name: "Romanian"
		},
		{
			code: "sk",
			name: "Slovak"
		},
		{
			code: "es",
			name: "Spanish"
		},
		{
			code: "sv",
			name: "Swedish"
		},
		{
			code: "tr",
			name: "Turkish"
		},
		{
			code: "uk",
			name: "Ukrainian"
		},
		{
			code: "vi",
			name: "Vietnamese"
		}
	];
	function findLanguage(code) {
		return LANGUAGES.find((language) => language.code === code);
	}
	//#endregion
	//#region src/content/replace.ts
	/**
	* Replaces the selected text. Prefers execCommand('insertText') because it
	* keeps the browser undo stack and is picked up by React/Vue/editor frameworks;
	* falls back to direct DOM edits plus a synthetic input event.
	*/
	function replaceSelection(selection, replacement) {
		if (selection.kind === "text-control") replaceInTextControl(selection, replacement);
		else replaceInContentEditable(selection, replacement);
	}
	function tryInsertText(doc, text) {
		try {
			return typeof doc.execCommand === "function" && doc.execCommand("insertText", false, text);
		} catch {
			return false;
		}
	}
	function dispatchInput(element, data) {
		element.dispatchEvent(new InputEvent("input", {
			bubbles: true,
			inputType: "insertReplacementText",
			data
		}));
	}
	function replaceInTextControl({ element, start, end }, replacement) {
		element.focus();
		element.setSelectionRange(start, end);
		if (tryInsertText(element.ownerDocument, replacement)) return;
		element.setRangeText(replacement, start, end, "end");
		dispatchInput(element, replacement);
	}
	function replaceInContentEditable({ element, range }, replacement) {
		const doc = element.ownerDocument;
		element.focus();
		const selection = doc.getSelection();
		selection?.removeAllRanges();
		selection?.addRange(range);
		if (tryInsertText(doc, replacement)) return;
		range.deleteContents();
		const node = doc.createTextNode(replacement);
		range.insertNode(node);
		range.setStartAfter(node);
		range.collapse(true);
		selection?.removeAllRanges();
		selection?.addRange(range);
		dispatchInput(element, replacement);
	}
	//#endregion
	//#region src/content/selection.ts
	var SELECTABLE_INPUT_TYPES = /* @__PURE__ */ new Set([
		"text",
		"search",
		"url",
		"tel"
	]);
	function isTextControl(element) {
		if (!element) return false;
		if (element instanceof HTMLTextAreaElement) return !element.readOnly && !element.disabled;
		return element instanceof HTMLInputElement && SELECTABLE_INPUT_TYPES.has(element.type) && !element.readOnly && !element.disabled;
	}
	function isEditableHost(element) {
		if (!(element instanceof HTMLElement)) return false;
		const attr = element.getAttribute("contenteditable");
		return element.isContentEditable || attr === "" || attr === "true" || attr === "plaintext-only";
	}
	function findContentEditableHost(node) {
		let element = node instanceof Element ? node : node?.parentElement ?? null;
		let host = null;
		while (element) {
			if (isEditableHost(element)) host = element;
			else if (host) break;
			element = element.parentElement;
		}
		return host;
	}
	/** Follows focus into open shadow roots (web-component editors). */
	function deepActiveElement(doc) {
		let active = doc.activeElement;
		while (active?.shadowRoot?.activeElement) active = active.shadowRoot.activeElement;
		return active;
	}
	function getEditableSelection(doc = document) {
		const active = deepActiveElement(doc);
		if (isTextControl(active)) {
			const { selectionStart: start, selectionEnd: end } = active;
			if (start === null || end === null || start === end) return null;
			const text = active.value.slice(start, end);
			return text.trim() ? {
				kind: "text-control",
				element: active,
				start,
				end,
				text
			} : null;
		}
		const selection = doc.getSelection();
		if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;
		const range = selection.getRangeAt(0);
		const host = findContentEditableHost(range.commonAncestorContainer);
		if (!host) return null;
		const text = range.toString();
		return text.trim() ? {
			kind: "content-editable",
			element: host,
			range: range.cloneRange(),
			text
		} : null;
	}
	/** False if the page changed the selected text since the snapshot was taken. */
	function isSelectionUnchanged(snapshot) {
		if (!snapshot.element.isConnected) return false;
		if (snapshot.kind === "text-control") return snapshot.element.value.slice(snapshot.start, snapshot.end) === snapshot.text;
		return snapshot.range.toString() === snapshot.text;
	}
	/** Viewport point just below the end of the selection. */
	function getSelectionAnchorPoint(snapshot) {
		const rect = snapshot.kind === "content-editable" ? snapshot.range.getBoundingClientRect() : snapshot.element.getBoundingClientRect();
		return {
			x: rect.right,
			y: rect.bottom
		};
	}
	//#endregion
	//#region src/content/ui/styles.ts
	var WIDGET_CSS = `
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
	//#endregion
	//#region src/content/ui/translator-widget.ts
	var ICON_SVG = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 8 6 6"/><path d="m4 14 6-6 2-3"/><path d="M2 5h12"/><path d="M7 2h1"/><path d="m22 22-5-10-5 10"/><path d="M14 18h6"/></svg>`;
	var ICON_SIZE = 26;
	var GAP = 6;
	var VIEWPORT_MARGIN = 8;
	/** Floating icon + language menu, isolated from page CSS in a closed shadow root. */
	var TranslatorWidget = class {
		callbacks;
		doc;
		host;
		icon;
		panel;
		anchor = {
			x: 0,
			y: 0
		};
		constructor(callbacks, doc = document) {
			this.callbacks = callbacks;
			this.doc = doc;
			this.host = doc.createElement("ai-translator-widget");
			this.host.style.cssText = "all: initial; position: fixed; top: 0; left: 0; z-index: 2147483647;";
			const shadow = this.host.attachShadow({ mode: "closed" });
			const style = doc.createElement("style");
			style.textContent = WIDGET_CSS;
			const root = doc.createElement("div");
			root.className = "widget";
			this.icon = doc.createElement("button");
			this.icon.className = "icon";
			this.icon.type = "button";
			this.icon.title = "Translate selection";
			this.icon.setAttribute("aria-label", "Translate selection");
			this.icon.innerHTML = ICON_SVG;
			this.icon.addEventListener("click", () => this.callbacks.onIconClick());
			this.panel = doc.createElement("div");
			this.panel.className = "panel";
			this.panel.setAttribute("role", "menu");
			root.append(this.icon, this.panel);
			shadow.append(style, root);
			shadow.addEventListener("mousedown", (event) => event.preventDefault());
			for (const type of [
				"mousedown",
				"mouseup",
				"click",
				"pointerdown",
				"pointerup"
			]) this.host.addEventListener(type, (event) => event.stopPropagation());
			this.hide();
		}
		mount() {
			if (!this.host.isConnected) this.doc.documentElement.append(this.host);
		}
		destroy() {
			this.host.remove();
		}
		get isMenuOpen() {
			return !this.panel.hidden;
		}
		get isVisible() {
			return !this.icon.hidden || !this.panel.hidden;
		}
		owns(event) {
			return event.composedPath().includes(this.host);
		}
		showIcon(point) {
			this.mount();
			this.anchor = point;
			this.panel.hidden = true;
			this.icon.hidden = false;
			const viewport = this.viewport();
			this.icon.style.left = `${clamp(point.x + GAP, VIEWPORT_MARGIN, viewport.width - ICON_SIZE - VIEWPORT_MARGIN)}px`;
			this.icon.style.top = `${clamp(point.y + GAP, VIEWPORT_MARGIN, viewport.height - ICON_SIZE - VIEWPORT_MARGIN)}px`;
		}
		showLanguages(languages) {
			const title = this.element("div", "title", "Translate to");
			const items = languages.map((language) => {
				const item = this.element("button", "item");
				item.type = "button";
				item.setAttribute("role", "menuitem");
				item.append(this.element("span", "", language.name), this.element("span", "code", language.code));
				item.addEventListener("click", () => this.callbacks.onLanguagePick(language.code));
				return item;
			});
			const empty = languages.length === 0 ? [this.element("div", "status", "No favorite languages yet.")] : [];
			this.showPanel(title, ...items, ...empty, this.divider(), this.settingsLink());
		}
		showBusy(languageName) {
			const status = this.element("div", "status");
			status.append(this.element("div", "spinner"), this.element("span", "", `Translating to ${languageName}…`));
			this.showPanel(status);
		}
		showError(message, onBack) {
			const back = this.element("button", "item", "← Back");
			back.type = "button";
			back.addEventListener("click", onBack);
			this.showPanel(this.element("div", "error", message), this.divider(), back, this.settingsLink());
		}
		hide() {
			this.icon.hidden = true;
			this.panel.hidden = true;
		}
		showPanel(...children) {
			this.mount();
			this.panel.replaceChildren(...children);
			this.icon.hidden = true;
			this.panel.hidden = false;
			this.positionPanel();
		}
		positionPanel() {
			const viewport = this.viewport();
			const { width, height } = this.panel.getBoundingClientRect();
			let top = this.anchor.y + GAP;
			if (top + height > viewport.height - VIEWPORT_MARGIN) top = this.anchor.y - height - GAP;
			this.panel.style.left = `${clamp(this.anchor.x + GAP, VIEWPORT_MARGIN, viewport.width - width - VIEWPORT_MARGIN)}px`;
			this.panel.style.top = `${clamp(top, VIEWPORT_MARGIN, viewport.height - height - VIEWPORT_MARGIN)}px`;
		}
		settingsLink() {
			const link = this.element("button", "item link", "Settings…");
			link.type = "button";
			link.addEventListener("click", () => this.callbacks.onOpenSettings());
			return link;
		}
		divider() {
			return this.element("div", "divider");
		}
		element(tag, className, text) {
			const element = this.doc.createElement(tag);
			if (className) element.className = className;
			if (text !== void 0) element.textContent = text;
			return element;
		}
		viewport() {
			const { clientWidth, clientHeight } = this.doc.documentElement;
			return {
				width: clientWidth,
				height: clientHeight
			};
		}
	};
	function clamp(value, min, max) {
		return Math.max(min, Math.min(value, Math.max(min, max)));
	}
	//#endregion
	//#region ../node_modules/@wxt-dev/browser/src/index.mjs
	var browser$1 = globalThis.browser?.runtime?.id ? globalThis.browser : globalThis.chrome;
	//#endregion
	//#region ../node_modules/wxt/dist/browser.mjs
	/**
	* Contains the `browser` export which you should use to access the extension
	* APIs in your project:
	*
	* ```ts
	* import { browser } from 'wxt/browser';
	*
	* browser.runtime.onInstalled.addListener(() => {
	*   // ...
	* });
	* ```
	*
	* @module wxt/browser
	*/
	var browser = browser$1;
	//#endregion
	//#region src/messaging/messages.ts
	async function sendMessage(message) {
		try {
			return await browser.runtime.sendMessage(message);
		} catch (error) {
			return {
				ok: false,
				error: { message: `Extension unavailable: ${error instanceof Error ? error.message : String(error)}. Reload the page.` }
			};
		}
	}
	//#endregion
	//#region ../node_modules/superlock/src/create.js
	var require_create = /* @__PURE__ */ __commonJSMin(((exports, module) => {
		var Node = class {
			constructor(data) {
				this.data = data;
			}
		};
		var LinkedList = class {
			constructor() {
				this.length = 0;
			}
			enqueue(data) {
				const node = new Node(data);
				node.prev = this.tail;
				if (this.tail) this.tail.next = node;
				else this.head = node;
				this.tail = node;
				this.length++;
				return node;
			}
			dequeue() {
				if (!this.head) return;
				const { data } = this.head;
				this.remove(this.head);
				return data;
			}
			remove(node) {
				if (node.prev) node.prev.next = node.next;
				else this.head = node.next;
				if (node.next) node.next.prev = node.prev;
				else this.tail = node.prev;
				this.length--;
			}
			size() {
				return this.length;
			}
		};
		module.exports = (slots = 1) => {
			const queue = new LinkedList();
			const release = () => {
				++slots;
				const waiter = queue.dequeue();
				if (waiter) return waiter.acquire();
			};
			const acquire = (resolve) => {
				--slots;
				resolve(release);
			};
			const lock = (signal) => new Promise((resolve) => {
				if (signal != null && typeof signal.addEventListener !== "function") throw new TypeError("`signal` needs to be an AbortSignal.");
				if (signal?.aborted) return resolve(null);
				if (!lock.isLocked()) return acquire(resolve);
				const waiter = { acquire: () => acquire(resolve) };
				const node = queue.enqueue(waiter);
				if (signal != null) {
					const onAbort = () => {
						queue.remove(node);
						resolve(null);
					};
					waiter.acquire = () => {
						signal.removeEventListener("abort", onAbort);
						acquire(resolve);
					};
					signal.addEventListener("abort", onAbort, { once: true });
				}
			});
			lock.isLocked = () => slots === 0;
			lock.awaiting = () => queue.size();
			return lock;
		};
	}));
	//#endregion
	//#region ../node_modules/@wxt-dev/storage/dist/index.mjs
	var import_src = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
		var createLock = require_create();
		var withLock = (opts) => {
			const lock = createLock(opts);
			const withLock = async (fn, signal) => {
				const release = await lock(signal);
				if (!release) return;
				try {
					return await fn();
				} finally {
					release();
				}
			};
			withLock.isLocked = lock.isLocked;
			withLock.awaiting = lock.awaiting;
			return withLock;
		};
		module.exports = {
			withLock,
			createLock
		};
	})))();
	var has = Object.prototype.hasOwnProperty;
	function dequal(foo, bar) {
		var ctor, len;
		if (foo === bar) return true;
		if (foo && bar && (ctor = foo.constructor) === bar.constructor) {
			if (ctor === Date) return foo.getTime() === bar.getTime();
			if (ctor === RegExp) return foo.toString() === bar.toString();
			if (ctor === Array) {
				if ((len = foo.length) === bar.length) while (len-- && dequal(foo[len], bar[len]));
				return len === -1;
			}
			if (!ctor || typeof foo === "object") {
				len = 0;
				for (ctor in foo) {
					if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
					if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
				}
				return Object.keys(bar).length === len;
			}
		}
		return foo !== foo && bar !== bar;
	}
	/**
	* Simplified storage APIs with support for versioned fields, snapshots,
	* metadata, and item definitions.
	*
	* See [the guide](https://wxt.dev/storage.html) for more information.
	*
	* @module @wxt-dev/storage
	*/
	var storage = createStorage();
	function createStorage() {
		const drivers = {
			local: createDriver("local"),
			session: createDriver("session"),
			sync: createDriver("sync"),
			managed: createDriver("managed")
		};
		const getDriver = (area) => {
			const driver = drivers[area];
			if (driver == null) {
				const areaNames = Object.keys(drivers).join(", ");
				throw Error(`Invalid area "${area}". Options: ${areaNames}`);
			}
			return driver;
		};
		const resolveKey = (key) => {
			const deliminatorIndex = key.indexOf(":");
			const driverArea = key.substring(0, deliminatorIndex);
			const driverKey = key.substring(deliminatorIndex + 1);
			if (driverKey == null) throw Error(`Storage key should be in the form of "area:key", but received "${key}"`);
			return {
				driverArea,
				driverKey,
				driver: getDriver(driverArea)
			};
		};
		const getMetaKey = (key) => key + "$";
		const mergeMeta = (oldMeta, newMeta) => {
			const newFields = { ...oldMeta };
			Object.entries(newMeta).forEach(([key, value]) => {
				if (value == null) delete newFields[key];
				else newFields[key] = value;
			});
			return newFields;
		};
		const getValueOrFallback = (value, fallback) => value ?? fallback ?? null;
		const getMetaValue = (properties) => typeof properties === "object" && !Array.isArray(properties) ? properties : {};
		const getItem = async (driver, driverKey, opts) => {
			return getValueOrFallback(await driver.getItem(driverKey), opts?.fallback ?? opts?.defaultValue);
		};
		const getMeta = async (driver, driverKey) => {
			const metaKey = getMetaKey(driverKey);
			return getMetaValue(await driver.getItem(metaKey));
		};
		const setItem = async (driver, driverKey, value) => {
			await driver.setItem(driverKey, value ?? null);
		};
		const setMeta = async (driver, driverKey, properties) => {
			const metaKey = getMetaKey(driverKey);
			const existingFields = getMetaValue(await driver.getItem(metaKey));
			await driver.setItem(metaKey, mergeMeta(existingFields, properties));
		};
		const removeItem = async (driver, driverKey, opts) => {
			await driver.removeItem(driverKey);
			if (opts?.removeMeta) {
				const metaKey = getMetaKey(driverKey);
				await driver.removeItem(metaKey);
			}
		};
		const removeMeta = async (driver, driverKey, properties) => {
			const metaKey = getMetaKey(driverKey);
			if (properties == null) await driver.removeItem(metaKey);
			else {
				const newFields = getMetaValue(await driver.getItem(metaKey));
				[properties].flat().forEach((field) => delete newFields[field]);
				await driver.setItem(metaKey, newFields);
			}
		};
		const watch = (driver, driverKey, cb) => driver.watch(driverKey, cb);
		return {
			getItem: async (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				return await getItem(driver, driverKey, opts);
			},
			getItems: async (keys) => {
				const areaToKeyMap = /* @__PURE__ */ new Map();
				const keyToOptsMap = /* @__PURE__ */ new Map();
				const orderedKeys = [];
				keys.forEach((key) => {
					let keyStr;
					let opts;
					if (typeof key === "string") keyStr = key;
					else if ("getValue" in key) {
						keyStr = key.key;
						opts = { fallback: key.fallback };
					} else {
						keyStr = key.key;
						opts = key.options;
					}
					orderedKeys.push(keyStr);
					const { driverArea, driverKey } = resolveKey(keyStr);
					const areaKeys = areaToKeyMap.get(driverArea) ?? [];
					areaToKeyMap.set(driverArea, areaKeys.concat(driverKey));
					keyToOptsMap.set(keyStr, opts);
				});
				const resultsMap = /* @__PURE__ */ new Map();
				await Promise.all(Array.from(areaToKeyMap.entries()).map(async ([driverArea, keys]) => {
					(await drivers[driverArea].getItems(keys)).forEach((driverResult) => {
						const key = `${driverArea}:${driverResult.key}`;
						const opts = keyToOptsMap.get(key);
						const value = getValueOrFallback(driverResult.value, opts?.fallback ?? opts?.defaultValue);
						resultsMap.set(key, value);
					});
				}));
				return orderedKeys.map((key) => ({
					key,
					value: resultsMap.get(key)
				}));
			},
			getMeta: async (key) => {
				const { driver, driverKey } = resolveKey(key);
				return await getMeta(driver, driverKey);
			},
			getMetas: async (args) => {
				const keys = args.map((arg) => {
					const key = typeof arg === "string" ? arg : arg.key;
					const { driverArea, driverKey } = resolveKey(key);
					return {
						key,
						driverArea,
						driverKey,
						driverMetaKey: getMetaKey(driverKey)
					};
				});
				const areaToDriverMetaKeysMap = keys.reduce((map, key) => {
					map[key.driverArea] ??= [];
					map[key.driverArea].push(key);
					return map;
				}, {});
				const resultsMap = {};
				await Promise.all(Object.entries(areaToDriverMetaKeysMap).map(async ([area, keys]) => {
					const areaRes = await browser$1.storage[area].get(keys.map((key) => key.driverMetaKey));
					keys.forEach((key) => {
						resultsMap[key.key] = areaRes[key.driverMetaKey] ?? {};
					});
				}));
				return keys.map((key) => ({
					key: key.key,
					meta: resultsMap[key.key]
				}));
			},
			setItem: async (key, value) => {
				const { driver, driverKey } = resolveKey(key);
				await setItem(driver, driverKey, value);
			},
			setItems: async (items) => {
				const areaToKeyValueMap = {};
				items.forEach((item) => {
					const { driverArea, driverKey } = resolveKey("key" in item ? item.key : item.item.key);
					areaToKeyValueMap[driverArea] ??= [];
					areaToKeyValueMap[driverArea].push({
						key: driverKey,
						value: item.value
					});
				});
				await Promise.all(Object.entries(areaToKeyValueMap).map(async ([driverArea, values]) => {
					await getDriver(driverArea).setItems(values);
				}));
			},
			setMeta: async (key, properties) => {
				const { driver, driverKey } = resolveKey(key);
				await setMeta(driver, driverKey, properties);
			},
			setMetas: async (items) => {
				const areaToMetaUpdatesMap = {};
				items.forEach((item) => {
					const { driverArea, driverKey } = resolveKey("key" in item ? item.key : item.item.key);
					areaToMetaUpdatesMap[driverArea] ??= [];
					areaToMetaUpdatesMap[driverArea].push({
						key: driverKey,
						properties: item.meta
					});
				});
				await Promise.all(Object.entries(areaToMetaUpdatesMap).map(async ([storageArea, updates]) => {
					const driver = getDriver(storageArea);
					const metaKeys = updates.map(({ key }) => getMetaKey(key));
					const existingMetas = await driver.getItems(metaKeys);
					const existingMetaMap = Object.fromEntries(existingMetas.map(({ key, value }) => [key, getMetaValue(value)]));
					const metaUpdates = updates.map(({ key, properties }) => {
						const metaKey = getMetaKey(key);
						return {
							key: metaKey,
							value: mergeMeta(existingMetaMap[metaKey] ?? {}, properties)
						};
					});
					await driver.setItems(metaUpdates);
				}));
			},
			removeItem: async (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				await removeItem(driver, driverKey, opts);
			},
			removeItems: async (keys) => {
				const areaToKeysMap = {};
				keys.forEach((key) => {
					let keyStr;
					let opts;
					if (typeof key === "string") keyStr = key;
					else if ("getValue" in key) keyStr = key.key;
					else if ("item" in key) {
						keyStr = key.item.key;
						opts = key.options;
					} else {
						keyStr = key.key;
						opts = key.options;
					}
					const { driverArea, driverKey } = resolveKey(keyStr);
					areaToKeysMap[driverArea] ??= [];
					areaToKeysMap[driverArea].push(driverKey);
					if (opts?.removeMeta) areaToKeysMap[driverArea].push(getMetaKey(driverKey));
				});
				await Promise.all(Object.entries(areaToKeysMap).map(async ([driverArea, keys]) => {
					await getDriver(driverArea).removeItems(keys);
				}));
			},
			clear: async (base) => {
				await getDriver(base).clear();
			},
			removeMeta: async (key, properties) => {
				const { driver, driverKey } = resolveKey(key);
				await removeMeta(driver, driverKey, properties);
			},
			snapshot: async (base, opts) => {
				const data = await getDriver(base).snapshot();
				opts?.excludeKeys?.forEach((key) => {
					delete data[key];
					delete data[getMetaKey(key)];
				});
				return data;
			},
			restoreSnapshot: async (base, data) => {
				await getDriver(base).restoreSnapshot(data);
			},
			watch: (key, cb) => {
				const { driver, driverKey } = resolveKey(key);
				return watch(driver, driverKey, cb);
			},
			unwatch() {
				Object.values(drivers).forEach((driver) => {
					driver.unwatch();
				});
			},
			defineItem: (key, opts) => {
				const { driver, driverKey } = resolveKey(key);
				const { version: targetVersion = 1, migrations = {}, onMigrationComplete, debug = false } = opts ?? {};
				if (targetVersion < 1) throw Error("Storage item version cannot be less than 1. Initial versions should be set to 1, not 0.");
				let needsVersionSet = false;
				const migrate = async () => {
					const driverMetaKey = getMetaKey(driverKey);
					const [{ value }, { value: meta }] = await driver.getItems([driverKey, driverMetaKey]);
					needsVersionSet = value == null && meta?.v == null && !!targetVersion;
					if (value == null) return;
					const currentVersion = meta?.v ?? 1;
					if (currentVersion > targetVersion) throw Error(`Version downgrade detected (v${currentVersion} -> v${targetVersion}) for "${key}"`);
					if (currentVersion === targetVersion) return;
					if (debug) console.debug(`[@wxt-dev/storage] Running storage migration for ${key}: v${currentVersion} -> v${targetVersion}`);
					const migrationsToRun = Array.from({ length: targetVersion - currentVersion }, (_, i) => currentVersion + i + 1);
					let migratedValue = value;
					for (const migrateToVersion of migrationsToRun) try {
						migratedValue = await migrations?.[migrateToVersion]?.(migratedValue) ?? migratedValue;
						if (debug) console.debug(`[@wxt-dev/storage] Storage migration processed for version: v${migrateToVersion}`);
					} catch (err) {
						throw new MigrationError(key, migrateToVersion, { cause: err });
					}
					await driver.setItems([{
						key: driverKey,
						value: migratedValue
					}, {
						key: driverMetaKey,
						value: {
							...meta,
							v: targetVersion
						}
					}]);
					if (debug) console.debug(`[@wxt-dev/storage] Storage migration completed for ${key} v${targetVersion}`, { migratedValue });
					onMigrationComplete?.(migratedValue, targetVersion);
				};
				const migrationsDone = opts?.migrations == null ? Promise.resolve() : migrate().catch((err) => {
					console.error(`[@wxt-dev/storage] Migration failed for ${key}`, err);
				});
				const initLock = (0, import_src.withLock)();
				const getFallback = () => opts?.fallback ?? opts?.defaultValue ?? null;
				const getOrInitValue = () => initLock(async () => {
					const value = await driver.getItem(driverKey);
					if (value != null || opts?.init == null) return value;
					const newValue = await opts.init();
					await driver.setItem(driverKey, newValue);
					if (value == null && targetVersion > 1) await setMeta(driver, driverKey, { v: targetVersion });
					return newValue;
				});
				migrationsDone.then(getOrInitValue);
				return {
					key,
					get defaultValue() {
						return getFallback();
					},
					get fallback() {
						return getFallback();
					},
					getValue: async () => {
						await migrationsDone;
						if (opts?.init) return await getOrInitValue();
						else return await getItem(driver, driverKey, opts);
					},
					getMeta: async () => {
						await migrationsDone;
						return await getMeta(driver, driverKey);
					},
					setValue: async (value) => {
						await migrationsDone;
						if (needsVersionSet) {
							needsVersionSet = false;
							await Promise.all([setItem(driver, driverKey, value), setMeta(driver, driverKey, { v: targetVersion })]);
						} else await setItem(driver, driverKey, value);
					},
					setMeta: async (properties) => {
						await migrationsDone;
						return await setMeta(driver, driverKey, properties);
					},
					removeValue: async (opts) => {
						await migrationsDone;
						return await removeItem(driver, driverKey, opts);
					},
					removeMeta: async (properties) => {
						await migrationsDone;
						return await removeMeta(driver, driverKey, properties);
					},
					watch: (cb) => watch(driver, driverKey, (newValue, oldValue) => cb(newValue ?? getFallback(), oldValue ?? getFallback())),
					migrate
				};
			}
		};
	}
	function createDriver(storageArea) {
		const getStorageArea = () => {
			if (browser$1.runtime == null) throw Error(`'wxt/storage' must be loaded in a web extension environment

 - If thrown during a build, see https://github.com/wxt-dev/wxt/issues/371
 - If thrown during tests, mock 'wxt/browser' correctly. See https://wxt.dev/guide/go-further/testing.html
`);
			if (browser$1.storage == null) throw Error("You must add the 'storage' permission to your manifest to use 'wxt/storage'");
			const area = browser$1.storage[storageArea];
			if (area == null) throw Error(`"browser.storage.${storageArea}" is undefined`);
			return area;
		};
		const watchListeners = /* @__PURE__ */ new Set();
		return {
			getItem: async (key) => {
				return (await getStorageArea().get(key))[key];
			},
			getItems: async (keys) => {
				const result = await getStorageArea().get(keys);
				return keys.map((key) => ({
					key,
					value: result[key] ?? null
				}));
			},
			setItem: async (key, value) => {
				if (value == null) await getStorageArea().remove(key);
				else await getStorageArea().set({ [key]: value });
			},
			setItems: async (values) => {
				const map = values.reduce((map, { key, value }) => {
					map[key] = value;
					return map;
				}, {});
				await getStorageArea().set(map);
			},
			removeItem: async (key) => {
				await getStorageArea().remove(key);
			},
			removeItems: async (keys) => {
				await getStorageArea().remove(keys);
			},
			clear: async () => {
				await getStorageArea().clear();
			},
			snapshot: async () => {
				return await getStorageArea().get();
			},
			restoreSnapshot: async (data) => {
				await getStorageArea().set(data);
			},
			watch(key, cb) {
				const listener = (changes) => {
					const change = changes[key];
					if (change == null || dequal(change.newValue, change.oldValue)) return;
					cb(change.newValue ?? null, change.oldValue ?? null);
				};
				getStorageArea().onChanged.addListener(listener);
				watchListeners.add(listener);
				return () => {
					getStorageArea().onChanged.removeListener(listener);
					watchListeners.delete(listener);
				};
			},
			unwatch() {
				watchListeners.forEach((listener) => {
					getStorageArea().onChanged.removeListener(listener);
				});
				watchListeners.clear();
			}
		};
	}
	var MigrationError = class extends Error {
		constructor(key, version, options) {
			super(`v${version} migration failed for "${key}"`, options);
			this.key = key;
			this.version = version;
		}
	};
	//#endregion
	//#region src/settings/settings.ts
	var DEFAULT_SETTINGS = {
		activeProviderId: "api",
		favoriteLanguages: [
			"en",
			"uk",
			"de",
			"es",
			"fr"
		],
		providerConfigs: {}
	};
	//#endregion
	//#region src/settings/storage-settings.ts
	var settingsItem = storage.defineItem("local:settings", { fallback: DEFAULT_SETTINGS });
	var storageSettings = {
		async get() {
			return {
				...DEFAULT_SETTINGS,
				...await settingsItem.getValue()
			};
		},
		async update(patch) {
			const next = {
				...await this.get(),
				...patch
			};
			await settingsItem.setValue(next);
			return next;
		}
	};
	//#endregion
	//#region src/entrypoints/content.ts
	var content_default = defineContentScript({
		matches: ["<all_urls>"],
		allFrames: true,
		runAt: "document_idle",
		main(ctx) {
			/** Selection captured when the icon appeared; the menu acts on this. */
			let snapshot = null;
			/** Bumped on every close/new request so stale responses are ignored. */
			let requestId = 0;
			const widget = new TranslatorWidget({
				onIconClick: () => void showLanguages(),
				onLanguagePick: (code) => void translate(code),
				onOpenSettings: () => {
					close();
					sendMessage({ type: "open-options" });
				}
			});
			ctx.onInvalidated(() => widget.destroy());
			function close() {
				requestId++;
				snapshot = null;
				widget.hide();
			}
			function refresh(pointer) {
				if (widget.isMenuOpen) return;
				const selection = getEditableSelection();
				if (!selection) {
					close();
					return;
				}
				snapshot = selection;
				widget.showIcon(pointer ?? getSelectionAnchorPoint(selection));
			}
			async function showLanguages() {
				const { favoriteLanguages } = await storageSettings.get();
				widget.showLanguages(favoriteLanguages.map(findLanguage).filter((l) => l !== void 0));
			}
			async function translate(targetLang) {
				const current = snapshot;
				if (!current) return;
				const id = ++requestId;
				widget.showBusy(findLanguage(targetLang)?.name ?? targetLang);
				const response = await sendMessage({
					type: "translate",
					text: current.text,
					targetLang
				});
				if (id !== requestId) return;
				if (!response.ok) widget.showError(response.error.message, () => void showLanguages());
				else if (!isSelectionUnchanged(current)) widget.showError("The text changed while translating. Select it again.", () => void showLanguages());
				else {
					replaceSelection(current, response.data.text);
					close();
				}
			}
			ctx.addEventListener(document, "mousedown", (event) => {
				if (!widget.owns(event)) close();
			});
			ctx.addEventListener(document, "mouseup", (event) => {
				if (widget.owns(event)) return;
				const pointer = {
					x: event.clientX,
					y: event.clientY
				};
				setTimeout(() => refresh(pointer), 0);
			});
			ctx.addEventListener(document, "keydown", (event) => {
				if (event.key === "Escape" && widget.isVisible) close();
			});
			ctx.addEventListener(document, "keyup", (event) => {
				if (event.key !== "Escape") refresh();
			});
			ctx.addEventListener(window, "scroll", () => widget.isVisible && close(), {
				capture: true,
				passive: true
			});
			ctx.addEventListener(window, "resize", () => widget.isVisible && close());
		}
	});
	//#endregion
	//#region ../node_modules/wxt/dist/utils/internal/logger.mjs
	function print$1(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger$1 = {
		debug: (...args) => print$1(console.debug, ...args),
		log: (...args) => print$1(console.log, ...args),
		warn: (...args) => print$1(console.warn, ...args),
		error: (...args) => print$1(console.error, ...args)
	};
	//#endregion
	//#region ../node_modules/wxt/dist/utils/internal/custom-events.mjs
	var WxtLocationChangeEvent = class WxtLocationChangeEvent extends Event {
		static EVENT_NAME = getUniqueEventName("wxt:locationchange");
		constructor(newUrl, oldUrl) {
			super(WxtLocationChangeEvent.EVENT_NAME, {});
			this.newUrl = newUrl;
			this.oldUrl = oldUrl;
		}
	};
	/**
	* Returns an event name unique to the extension and content script that's
	* running.
	*/
	function getUniqueEventName(eventName) {
		return `${browser?.runtime?.id}:content:${eventName}`;
	}
	//#endregion
	//#region ../node_modules/wxt/dist/utils/internal/location-watcher.mjs
	var supportsNavigationApi = typeof globalThis.navigation?.addEventListener === "function";
	/**
	* Create a util that watches for URL changes, dispatching the custom event when
	* detected. Stops watching when content script is invalidated. Uses Navigation
	* API when available, otherwise falls back to polling.
	*/
	function createLocationWatcher(ctx) {
		let lastUrl;
		let watching = false;
		return { run() {
			if (watching) return;
			watching = true;
			lastUrl = new URL(location.href);
			if (supportsNavigationApi) globalThis.navigation.addEventListener("navigate", (event) => {
				const newUrl = new URL(event.destination.url);
				if (newUrl.href === lastUrl.href) return;
				window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
				lastUrl = newUrl;
			}, { signal: ctx.signal });
			else ctx.setInterval(() => {
				const newUrl = new URL(location.href);
				if (newUrl.href !== lastUrl.href) {
					window.dispatchEvent(new WxtLocationChangeEvent(newUrl, lastUrl));
					lastUrl = newUrl;
				}
			}, 1e3);
		} };
	}
	//#endregion
	//#region ../node_modules/wxt/dist/utils/content-script-context.mjs
	/**
	* Implements
	* [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController).
	* Used to detect and stop content script code when the script is invalidated.
	*
	* It also provides several utilities like `ctx.setTimeout` and
	* `ctx.setInterval` that should be used in content scripts instead of
	* `window.setTimeout` or `window.setInterval`.
	*
	* To create context for testing, you can use the class's constructor:
	*
	* ```ts
	* import { ContentScriptContext } from 'wxt/utils/content-scripts-context';
	*
	* test('storage listener should be removed when context is invalidated', () => {
	*   const ctx = new ContentScriptContext('test');
	*   const item = storage.defineItem('local:count', { defaultValue: 0 });
	*   const watcher = vi.fn();
	*
	*   const unwatch = item.watch(watcher);
	*   ctx.onInvalidated(unwatch); // Listen for invalidate here
	*
	*   await item.setValue(1);
	*   expect(watcher).toBeCalledTimes(1);
	*   expect(watcher).toBeCalledWith(1, 0);
	*
	*   ctx.notifyInvalidated(); // Use this function to invalidate the context
	*   await item.setValue(2);
	*   expect(watcher).toBeCalledTimes(1);
	* });
	* ```
	*/
	var ContentScriptContext = class ContentScriptContext {
		static SCRIPT_STARTED_MESSAGE_TYPE = getUniqueEventName("wxt:content-script-started");
		id;
		abortController;
		locationWatcher = createLocationWatcher(this);
		constructor(contentScriptName, options) {
			this.contentScriptName = contentScriptName;
			this.options = options;
			this.id = Math.random().toString(36).slice(2);
			this.abortController = new AbortController();
			this.stopOldScripts();
			this.listenForNewerScripts();
		}
		get signal() {
			return this.abortController.signal;
		}
		abort(reason) {
			return this.abortController.abort(reason);
		}
		get isInvalid() {
			if (browser.runtime?.id == null) this.notifyInvalidated();
			return this.signal.aborted;
		}
		get isValid() {
			return !this.isInvalid;
		}
		/**
		* Add a listener that is called when the content script's context is
		* invalidated.
		*
		* @example
		*   browser.runtime.onMessage.addListener(cb);
		*   const removeInvalidatedListener = ctx.onInvalidated(() => {
		*     browser.runtime.onMessage.removeListener(cb);
		*   });
		*   // ...
		*   removeInvalidatedListener();
		*
		* @returns A function to remove the listener.
		*/
		onInvalidated(cb) {
			this.signal.addEventListener("abort", cb);
			return () => this.signal.removeEventListener("abort", cb);
		}
		/**
		* Return a promise that never resolves. Useful if you have an async function
		* that shouldn't run after the context is expired.
		*
		* @example
		*   const getValueFromStorage = async () => {
		*     if (ctx.isInvalid) return ctx.block();
		*
		*     // ...
		*   };
		*/
		block() {
			return new Promise(() => {});
		}
		/**
		* Wrapper around `window.setInterval` that automatically clears the interval
		* when invalidated.
		*
		* Intervals can be cleared by calling the normal `clearInterval` function.
		*/
		setInterval(handler, timeout) {
			const id = setInterval(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearInterval(id));
			return id;
		}
		/**
		* Wrapper around `window.setTimeout` that automatically clears the interval
		* when invalidated.
		*
		* Timeouts can be cleared by calling the normal `setTimeout` function.
		*/
		setTimeout(handler, timeout) {
			const id = setTimeout(() => {
				if (this.isValid) handler();
			}, timeout);
			this.onInvalidated(() => clearTimeout(id));
			return id;
		}
		/**
		* Wrapper around `window.requestAnimationFrame` that automatically cancels
		* the request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelAnimationFrame`
		* function.
		*/
		requestAnimationFrame(callback) {
			const id = requestAnimationFrame((...args) => {
				if (this.isValid) callback(...args);
			});
			this.onInvalidated(() => cancelAnimationFrame(id));
			return id;
		}
		/**
		* Wrapper around `window.requestIdleCallback` that automatically cancels the
		* request when invalidated.
		*
		* Callbacks can be canceled by calling the normal `cancelIdleCallback`
		* function.
		*/
		requestIdleCallback(callback, options) {
			const id = requestIdleCallback((...args) => {
				if (!this.signal.aborted) callback(...args);
			}, options);
			this.onInvalidated(() => cancelIdleCallback(id));
			return id;
		}
		addEventListener(target, type, handler, options) {
			if (type === "wxt:locationchange") {
				if (this.isValid) this.locationWatcher.run();
			}
			target.addEventListener?.(type.startsWith("wxt:") ? getUniqueEventName(type) : type, handler, {
				...options,
				signal: this.signal
			});
		}
		/**
		* @internal
		* Abort the abort controller and execute all `onInvalidated` listeners.
		*/
		notifyInvalidated() {
			this.abort("Content script context invalidated");
			logger$1.debug(`Content script "${this.contentScriptName}" context invalidated`);
		}
		stopOldScripts() {
			document.dispatchEvent(new CustomEvent(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, { detail: {
				contentScriptName: this.contentScriptName,
				messageId: this.id
			} }));
			if (!this.options?.noScriptStartedPostMessage) window.postMessage({
				type: ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE,
				contentScriptName: this.contentScriptName,
				messageId: this.id
			}, "*");
		}
		verifyScriptStartedEvent(event) {
			const isSameContentScript = event.detail?.contentScriptName === this.contentScriptName;
			const isFromSelf = event.detail?.messageId === this.id;
			return isSameContentScript && !isFromSelf;
		}
		listenForNewerScripts() {
			const cb = (event) => {
				if (!(event instanceof CustomEvent) || !this.verifyScriptStartedEvent(event)) return;
				this.notifyInvalidated();
			};
			document.addEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb);
			this.onInvalidated(() => document.removeEventListener(ContentScriptContext.SCRIPT_STARTED_MESSAGE_TYPE, cb));
		}
	};
	//#endregion
	//#region \0virtual:wxt-content-script-isolated-world-entrypoint?/Users/vadympalkin/ai-translator-ext/extension/src/entrypoints/content.ts
	function print(method, ...args) {
		if (typeof args[0] === "string") method(`[wxt] ${args.shift()}`, ...args);
		else method("[wxt]", ...args);
	}
	/** Wrapper around `console` with a "[wxt]" prefix */
	var logger = {
		debug: (...args) => print(console.debug, ...args),
		log: (...args) => print(console.log, ...args),
		warn: (...args) => print(console.warn, ...args),
		error: (...args) => print(console.error, ...args)
	};
	//#endregion
	return (async () => {
		try {
			const { main, ...options } = content_default;
			return await main(new ContentScriptContext("content", options));
		} catch (err) {
			logger.error(`The content script "content" crashed on startup!`, err);
			throw err;
		}
	})();
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29udGVudC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJicm93c2VyIiwid2l0aExvY2siLCJwcmludCIsImxvZ2dlciJdLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9kZWZpbmUtY29udGVudC1zY3JpcHQubWpzIiwiLi4vLi4vLi4vc3JjL2NvcmUvbGFuZ3VhZ2VzLnRzIiwiLi4vLi4vLi4vc3JjL2NvbnRlbnQvcmVwbGFjZS50cyIsIi4uLy4uLy4uL3NyYy9jb250ZW50L3NlbGVjdGlvbi50cyIsIi4uLy4uLy4uL3NyYy9jb250ZW50L3VpL3N0eWxlcy50cyIsIi4uLy4uLy4uL3NyYy9jb250ZW50L3VpL3RyYW5zbGF0b3Itd2lkZ2V0LnRzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L2Jyb3dzZXIvc3JjL2luZGV4Lm1qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC9icm93c2VyLm1qcyIsIi4uLy4uLy4uL3NyYy9tZXNzYWdpbmcvbWVzc2FnZXMudHMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3VwZXJsb2NrL3NyYy9jcmVhdGUuanMiLCIuLi8uLi8uLi8uLi9ub2RlX21vZHVsZXMvc3VwZXJsb2NrL3NyYy9pbmRleC5qcyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Ad3h0LWRldi9zdG9yYWdlL2Rpc3QvaW5kZXgubWpzIiwiLi4vLi4vLi4vc3JjL3NldHRpbmdzL3NldHRpbmdzLnRzIiwiLi4vLi4vLi4vc3JjL3NldHRpbmdzL3N0b3JhZ2Utc2V0dGluZ3MudHMiLCIuLi8uLi8uLi9zcmMvZW50cnlwb2ludHMvY29udGVudC50cyIsIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy93eHQvZGlzdC91dGlscy9pbnRlcm5hbC9sb2dnZXIubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzIiwiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQubWpzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vI3JlZ2lvbiBzcmMvdXRpbHMvZGVmaW5lLWNvbnRlbnQtc2NyaXB0LnRzXG5mdW5jdGlvbiBkZWZpbmVDb250ZW50U2NyaXB0KGRlZmluaXRpb24pIHtcblx0cmV0dXJuIGRlZmluaXRpb247XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUNvbnRlbnRTY3JpcHQgfTtcbiIsImV4cG9ydCBpbnRlcmZhY2UgTGFuZ3VhZ2Uge1xuICBjb2RlOiBzdHJpbmc7XG4gIG5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNvbnN0IExBTkdVQUdFUzogcmVhZG9ubHkgTGFuZ3VhZ2VbXSA9IFtcbiAgeyBjb2RlOiAnYXInLCBuYW1lOiAnQXJhYmljJyB9LFxuICB7IGNvZGU6ICdiZycsIG5hbWU6ICdCdWxnYXJpYW4nIH0sXG4gIHsgY29kZTogJ3poJywgbmFtZTogJ0NoaW5lc2UnIH0sXG4gIHsgY29kZTogJ2NzJywgbmFtZTogJ0N6ZWNoJyB9LFxuICB7IGNvZGU6ICdkYScsIG5hbWU6ICdEYW5pc2gnIH0sXG4gIHsgY29kZTogJ25sJywgbmFtZTogJ0R1dGNoJyB9LFxuICB7IGNvZGU6ICdlbicsIG5hbWU6ICdFbmdsaXNoJyB9LFxuICB7IGNvZGU6ICdldCcsIG5hbWU6ICdFc3RvbmlhbicgfSxcbiAgeyBjb2RlOiAnZmknLCBuYW1lOiAnRmlubmlzaCcgfSxcbiAgeyBjb2RlOiAnZnInLCBuYW1lOiAnRnJlbmNoJyB9LFxuICB7IGNvZGU6ICdkZScsIG5hbWU6ICdHZXJtYW4nIH0sXG4gIHsgY29kZTogJ2VsJywgbmFtZTogJ0dyZWVrJyB9LFxuICB7IGNvZGU6ICdoZScsIG5hbWU6ICdIZWJyZXcnIH0sXG4gIHsgY29kZTogJ2hpJywgbmFtZTogJ0hpbmRpJyB9LFxuICB7IGNvZGU6ICdodScsIG5hbWU6ICdIdW5nYXJpYW4nIH0sXG4gIHsgY29kZTogJ2lkJywgbmFtZTogJ0luZG9uZXNpYW4nIH0sXG4gIHsgY29kZTogJ2l0JywgbmFtZTogJ0l0YWxpYW4nIH0sXG4gIHsgY29kZTogJ2phJywgbmFtZTogJ0phcGFuZXNlJyB9LFxuICB7IGNvZGU6ICdrbycsIG5hbWU6ICdLb3JlYW4nIH0sXG4gIHsgY29kZTogJ2x2JywgbmFtZTogJ0xhdHZpYW4nIH0sXG4gIHsgY29kZTogJ2x0JywgbmFtZTogJ0xpdGh1YW5pYW4nIH0sXG4gIHsgY29kZTogJ25vJywgbmFtZTogJ05vcndlZ2lhbicgfSxcbiAgeyBjb2RlOiAncGwnLCBuYW1lOiAnUG9saXNoJyB9LFxuICB7IGNvZGU6ICdwdCcsIG5hbWU6ICdQb3J0dWd1ZXNlJyB9LFxuICB7IGNvZGU6ICdybycsIG5hbWU6ICdSb21hbmlhbicgfSxcbiAgeyBjb2RlOiAnc2snLCBuYW1lOiAnU2xvdmFrJyB9LFxuICB7IGNvZGU6ICdlcycsIG5hbWU6ICdTcGFuaXNoJyB9LFxuICB7IGNvZGU6ICdzdicsIG5hbWU6ICdTd2VkaXNoJyB9LFxuICB7IGNvZGU6ICd0cicsIG5hbWU6ICdUdXJraXNoJyB9LFxuICB7IGNvZGU6ICd1aycsIG5hbWU6ICdVa3JhaW5pYW4nIH0sXG4gIHsgY29kZTogJ3ZpJywgbmFtZTogJ1ZpZXRuYW1lc2UnIH0sXG5dO1xuXG5leHBvcnQgZnVuY3Rpb24gZmluZExhbmd1YWdlKGNvZGU6IHN0cmluZyk6IExhbmd1YWdlIHwgdW5kZWZpbmVkIHtcbiAgcmV0dXJuIExBTkdVQUdFUy5maW5kKChsYW5ndWFnZSkgPT4gbGFuZ3VhZ2UuY29kZSA9PT0gY29kZSk7XG59XG4iLCJpbXBvcnQgdHlwZSB7IEVkaXRhYmxlU2VsZWN0aW9uIH0gZnJvbSAnLi9zZWxlY3Rpb24nO1xuXG4vKipcbiAqIFJlcGxhY2VzIHRoZSBzZWxlY3RlZCB0ZXh0LiBQcmVmZXJzIGV4ZWNDb21tYW5kKCdpbnNlcnRUZXh0JykgYmVjYXVzZSBpdFxuICoga2VlcHMgdGhlIGJyb3dzZXIgdW5kbyBzdGFjayBhbmQgaXMgcGlja2VkIHVwIGJ5IFJlYWN0L1Z1ZS9lZGl0b3IgZnJhbWV3b3JrcztcbiAqIGZhbGxzIGJhY2sgdG8gZGlyZWN0IERPTSBlZGl0cyBwbHVzIGEgc3ludGhldGljIGlucHV0IGV2ZW50LlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVwbGFjZVNlbGVjdGlvbihzZWxlY3Rpb246IEVkaXRhYmxlU2VsZWN0aW9uLCByZXBsYWNlbWVudDogc3RyaW5nKTogdm9pZCB7XG4gIGlmIChzZWxlY3Rpb24ua2luZCA9PT0gJ3RleHQtY29udHJvbCcpIHJlcGxhY2VJblRleHRDb250cm9sKHNlbGVjdGlvbiwgcmVwbGFjZW1lbnQpO1xuICBlbHNlIHJlcGxhY2VJbkNvbnRlbnRFZGl0YWJsZShzZWxlY3Rpb24sIHJlcGxhY2VtZW50KTtcbn1cblxuZnVuY3Rpb24gdHJ5SW5zZXJ0VGV4dChkb2M6IERvY3VtZW50LCB0ZXh0OiBzdHJpbmcpOiBib29sZWFuIHtcbiAgdHJ5IHtcbiAgICByZXR1cm4gdHlwZW9mIGRvYy5leGVjQ29tbWFuZCA9PT0gJ2Z1bmN0aW9uJyAmJiBkb2MuZXhlY0NvbW1hbmQoJ2luc2VydFRleHQnLCBmYWxzZSwgdGV4dCk7XG4gIH0gY2F0Y2gge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxufVxuXG5mdW5jdGlvbiBkaXNwYXRjaElucHV0KGVsZW1lbnQ6IEhUTUxFbGVtZW50LCBkYXRhOiBzdHJpbmcpOiB2b2lkIHtcbiAgZWxlbWVudC5kaXNwYXRjaEV2ZW50KG5ldyBJbnB1dEV2ZW50KCdpbnB1dCcsIHsgYnViYmxlczogdHJ1ZSwgaW5wdXRUeXBlOiAnaW5zZXJ0UmVwbGFjZW1lbnRUZXh0JywgZGF0YSB9KSk7XG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VJblRleHRDb250cm9sKFxuICB7IGVsZW1lbnQsIHN0YXJ0LCBlbmQgfTogRXh0cmFjdDxFZGl0YWJsZVNlbGVjdGlvbiwgeyBraW5kOiAndGV4dC1jb250cm9sJyB9PixcbiAgcmVwbGFjZW1lbnQ6IHN0cmluZyxcbik6IHZvaWQge1xuICBlbGVtZW50LmZvY3VzKCk7XG4gIGVsZW1lbnQuc2V0U2VsZWN0aW9uUmFuZ2Uoc3RhcnQsIGVuZCk7XG5cbiAgaWYgKHRyeUluc2VydFRleHQoZWxlbWVudC5vd25lckRvY3VtZW50LCByZXBsYWNlbWVudCkpIHJldHVybjtcblxuICBlbGVtZW50LnNldFJhbmdlVGV4dChyZXBsYWNlbWVudCwgc3RhcnQsIGVuZCwgJ2VuZCcpO1xuICBkaXNwYXRjaElucHV0KGVsZW1lbnQsIHJlcGxhY2VtZW50KTtcbn1cblxuZnVuY3Rpb24gcmVwbGFjZUluQ29udGVudEVkaXRhYmxlKFxuICB7IGVsZW1lbnQsIHJhbmdlIH06IEV4dHJhY3Q8RWRpdGFibGVTZWxlY3Rpb24sIHsga2luZDogJ2NvbnRlbnQtZWRpdGFibGUnIH0+LFxuICByZXBsYWNlbWVudDogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGNvbnN0IGRvYyA9IGVsZW1lbnQub3duZXJEb2N1bWVudDtcbiAgZWxlbWVudC5mb2N1cygpO1xuICBjb25zdCBzZWxlY3Rpb24gPSBkb2MuZ2V0U2VsZWN0aW9uKCk7XG4gIHNlbGVjdGlvbj8ucmVtb3ZlQWxsUmFuZ2VzKCk7XG4gIHNlbGVjdGlvbj8uYWRkUmFuZ2UocmFuZ2UpO1xuXG4gIGlmICh0cnlJbnNlcnRUZXh0KGRvYywgcmVwbGFjZW1lbnQpKSByZXR1cm47XG5cbiAgcmFuZ2UuZGVsZXRlQ29udGVudHMoKTtcbiAgY29uc3Qgbm9kZSA9IGRvYy5jcmVhdGVUZXh0Tm9kZShyZXBsYWNlbWVudCk7XG4gIHJhbmdlLmluc2VydE5vZGUobm9kZSk7XG4gIHJhbmdlLnNldFN0YXJ0QWZ0ZXIobm9kZSk7XG4gIHJhbmdlLmNvbGxhcHNlKHRydWUpO1xuICBzZWxlY3Rpb24/LnJlbW92ZUFsbFJhbmdlcygpO1xuICBzZWxlY3Rpb24/LmFkZFJhbmdlKHJhbmdlKTtcbiAgZGlzcGF0Y2hJbnB1dChlbGVtZW50LCByZXBsYWNlbWVudCk7XG59XG4iLCJleHBvcnQgdHlwZSBFZGl0YWJsZVNlbGVjdGlvbiA9XG4gIHwge1xuICAgICAga2luZDogJ3RleHQtY29udHJvbCc7XG4gICAgICBlbGVtZW50OiBIVE1MSW5wdXRFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudDtcbiAgICAgIHN0YXJ0OiBudW1iZXI7XG4gICAgICBlbmQ6IG51bWJlcjtcbiAgICAgIHRleHQ6IHN0cmluZztcbiAgICB9XG4gIHwge1xuICAgICAga2luZDogJ2NvbnRlbnQtZWRpdGFibGUnO1xuICAgICAgZWxlbWVudDogSFRNTEVsZW1lbnQ7XG4gICAgICByYW5nZTogUmFuZ2U7XG4gICAgICB0ZXh0OiBzdHJpbmc7XG4gICAgfTtcblxuLy8gSW5wdXQgdHlwZXMgdGhhdCBzdXBwb3J0IHRoZSBzZWxlY3Rpb25TdGFydC9zZWxlY3Rpb25FbmQgQVBJLlxuY29uc3QgU0VMRUNUQUJMRV9JTlBVVF9UWVBFUyA9IG5ldyBTZXQoWyd0ZXh0JywgJ3NlYXJjaCcsICd1cmwnLCAndGVsJ10pO1xuXG5leHBvcnQgZnVuY3Rpb24gaXNUZXh0Q29udHJvbChlbGVtZW50OiBFbGVtZW50IHwgbnVsbCk6IGVsZW1lbnQgaXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxUZXh0QXJlYUVsZW1lbnQge1xuICBpZiAoIWVsZW1lbnQpIHJldHVybiBmYWxzZTtcbiAgaWYgKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MVGV4dEFyZWFFbGVtZW50KSByZXR1cm4gIWVsZW1lbnQucmVhZE9ubHkgJiYgIWVsZW1lbnQuZGlzYWJsZWQ7XG4gIHJldHVybiAoXG4gICAgZWxlbWVudCBpbnN0YW5jZW9mIEhUTUxJbnB1dEVsZW1lbnQgJiZcbiAgICBTRUxFQ1RBQkxFX0lOUFVUX1RZUEVTLmhhcyhlbGVtZW50LnR5cGUpICYmXG4gICAgIWVsZW1lbnQucmVhZE9ubHkgJiZcbiAgICAhZWxlbWVudC5kaXNhYmxlZFxuICApO1xufVxuXG5mdW5jdGlvbiBpc0VkaXRhYmxlSG9zdChlbGVtZW50OiBFbGVtZW50KTogZWxlbWVudCBpcyBIVE1MRWxlbWVudCB7XG4gIGlmICghKGVsZW1lbnQgaW5zdGFuY2VvZiBIVE1MRWxlbWVudCkpIHJldHVybiBmYWxzZTtcbiAgY29uc3QgYXR0ciA9IGVsZW1lbnQuZ2V0QXR0cmlidXRlKCdjb250ZW50ZWRpdGFibGUnKTtcbiAgcmV0dXJuIGVsZW1lbnQuaXNDb250ZW50RWRpdGFibGUgfHwgYXR0ciA9PT0gJycgfHwgYXR0ciA9PT0gJ3RydWUnIHx8IGF0dHIgPT09ICdwbGFpbnRleHQtb25seSc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQ29udGVudEVkaXRhYmxlSG9zdChub2RlOiBOb2RlIHwgbnVsbCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gIGxldCBlbGVtZW50ID0gbm9kZSBpbnN0YW5jZW9mIEVsZW1lbnQgPyBub2RlIDogKG5vZGU/LnBhcmVudEVsZW1lbnQgPz8gbnVsbCk7XG4gIGxldCBob3N0OiBIVE1MRWxlbWVudCB8IG51bGwgPSBudWxsO1xuICAvLyBXYWxrIHRvIHRoZSBvdXRlcm1vc3QgZWRpdGFibGUgYW5jZXN0b3I6IHRoYXQncyB0aGUgZWRpdG9yIHJvb3QuXG4gIHdoaWxlIChlbGVtZW50KSB7XG4gICAgaWYgKGlzRWRpdGFibGVIb3N0KGVsZW1lbnQpKSBob3N0ID0gZWxlbWVudDtcbiAgICBlbHNlIGlmIChob3N0KSBicmVhaztcbiAgICBlbGVtZW50ID0gZWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICB9XG4gIHJldHVybiBob3N0O1xufVxuXG4vKiogRm9sbG93cyBmb2N1cyBpbnRvIG9wZW4gc2hhZG93IHJvb3RzICh3ZWItY29tcG9uZW50IGVkaXRvcnMpLiAqL1xuZnVuY3Rpb24gZGVlcEFjdGl2ZUVsZW1lbnQoZG9jOiBEb2N1bWVudCk6IEVsZW1lbnQgfCBudWxsIHtcbiAgbGV0IGFjdGl2ZSA9IGRvYy5hY3RpdmVFbGVtZW50O1xuICB3aGlsZSAoYWN0aXZlPy5zaGFkb3dSb290Py5hY3RpdmVFbGVtZW50KSBhY3RpdmUgPSBhY3RpdmUuc2hhZG93Um9vdC5hY3RpdmVFbGVtZW50O1xuICByZXR1cm4gYWN0aXZlO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0RWRpdGFibGVTZWxlY3Rpb24oZG9jOiBEb2N1bWVudCA9IGRvY3VtZW50KTogRWRpdGFibGVTZWxlY3Rpb24gfCBudWxsIHtcbiAgY29uc3QgYWN0aXZlID0gZGVlcEFjdGl2ZUVsZW1lbnQoZG9jKTtcblxuICBpZiAoaXNUZXh0Q29udHJvbChhY3RpdmUpKSB7XG4gICAgY29uc3QgeyBzZWxlY3Rpb25TdGFydDogc3RhcnQsIHNlbGVjdGlvbkVuZDogZW5kIH0gPSBhY3RpdmU7XG4gICAgaWYgKHN0YXJ0ID09PSBudWxsIHx8IGVuZCA9PT0gbnVsbCB8fCBzdGFydCA9PT0gZW5kKSByZXR1cm4gbnVsbDtcbiAgICBjb25zdCB0ZXh0ID0gYWN0aXZlLnZhbHVlLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICAgIHJldHVybiB0ZXh0LnRyaW0oKSA/IHsga2luZDogJ3RleHQtY29udHJvbCcsIGVsZW1lbnQ6IGFjdGl2ZSwgc3RhcnQsIGVuZCwgdGV4dCB9IDogbnVsbDtcbiAgfVxuXG4gIGNvbnN0IHNlbGVjdGlvbiA9IGRvYy5nZXRTZWxlY3Rpb24oKTtcbiAgaWYgKCFzZWxlY3Rpb24gfHwgc2VsZWN0aW9uLnJhbmdlQ291bnQgPT09IDAgfHwgc2VsZWN0aW9uLmlzQ29sbGFwc2VkKSByZXR1cm4gbnVsbDtcbiAgY29uc3QgcmFuZ2UgPSBzZWxlY3Rpb24uZ2V0UmFuZ2VBdCgwKTtcbiAgY29uc3QgaG9zdCA9IGZpbmRDb250ZW50RWRpdGFibGVIb3N0KHJhbmdlLmNvbW1vbkFuY2VzdG9yQ29udGFpbmVyKTtcbiAgaWYgKCFob3N0KSByZXR1cm4gbnVsbDtcbiAgY29uc3QgdGV4dCA9IHJhbmdlLnRvU3RyaW5nKCk7XG4gIHJldHVybiB0ZXh0LnRyaW0oKSA/IHsga2luZDogJ2NvbnRlbnQtZWRpdGFibGUnLCBlbGVtZW50OiBob3N0LCByYW5nZTogcmFuZ2UuY2xvbmVSYW5nZSgpLCB0ZXh0IH0gOiBudWxsO1xufVxuXG4vKiogRmFsc2UgaWYgdGhlIHBhZ2UgY2hhbmdlZCB0aGUgc2VsZWN0ZWQgdGV4dCBzaW5jZSB0aGUgc25hcHNob3Qgd2FzIHRha2VuLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzU2VsZWN0aW9uVW5jaGFuZ2VkKHNuYXBzaG90OiBFZGl0YWJsZVNlbGVjdGlvbik6IGJvb2xlYW4ge1xuICBpZiAoIXNuYXBzaG90LmVsZW1lbnQuaXNDb25uZWN0ZWQpIHJldHVybiBmYWxzZTtcbiAgaWYgKHNuYXBzaG90LmtpbmQgPT09ICd0ZXh0LWNvbnRyb2wnKSB7XG4gICAgcmV0dXJuIHNuYXBzaG90LmVsZW1lbnQudmFsdWUuc2xpY2Uoc25hcHNob3Quc3RhcnQsIHNuYXBzaG90LmVuZCkgPT09IHNuYXBzaG90LnRleHQ7XG4gIH1cbiAgcmV0dXJuIHNuYXBzaG90LnJhbmdlLnRvU3RyaW5nKCkgPT09IHNuYXBzaG90LnRleHQ7XG59XG5cbi8qKiBWaWV3cG9ydCBwb2ludCBqdXN0IGJlbG93IHRoZSBlbmQgb2YgdGhlIHNlbGVjdGlvbi4gKi9cbmV4cG9ydCBmdW5jdGlvbiBnZXRTZWxlY3Rpb25BbmNob3JQb2ludChzbmFwc2hvdDogRWRpdGFibGVTZWxlY3Rpb24pOiB7IHg6IG51bWJlcjsgeTogbnVtYmVyIH0ge1xuICBjb25zdCByZWN0ID1cbiAgICBzbmFwc2hvdC5raW5kID09PSAnY29udGVudC1lZGl0YWJsZSdcbiAgICAgID8gc25hcHNob3QucmFuZ2UuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KClcbiAgICAgIDogc25hcHNob3QuZWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgcmV0dXJuIHsgeDogcmVjdC5yaWdodCwgeTogcmVjdC5ib3R0b20gfTtcbn1cbiIsImV4cG9ydCBjb25zdCBXSURHRVRfQ1NTID0gLyogY3NzICovIGBcbjpob3N0IHsgYWxsOiBpbml0aWFsOyB9XG4qIHsgYm94LXNpemluZzogYm9yZGVyLWJveDsgfVxuXG4ud2lkZ2V0IHtcbiAgLS1iZzogI2ZmZmZmZjtcbiAgLS1mZzogIzFmMjMyODtcbiAgLS1tdXRlZDogIzY1NmQ3NjtcbiAgLS1ib3JkZXI6ICNkMGQ3ZGU7XG4gIC0taG92ZXI6ICNmM2Y0ZjY7XG4gIC0tYWNjZW50OiAjNGY0NmU1O1xuICAtLWRhbmdlcjogI2NmMjIyZTtcbiAgZm9udDogMTNweC8xLjQgc3lzdGVtLXVpLCAtYXBwbGUtc3lzdGVtLCAnU2Vnb2UgVUknLCBSb2JvdG8sIHNhbnMtc2VyaWY7XG4gIGNvbG9yOiB2YXIoLS1mZyk7XG59XG5AbWVkaWEgKHByZWZlcnMtY29sb3Itc2NoZW1lOiBkYXJrKSB7XG4gIC53aWRnZXQge1xuICAgIC0tYmc6ICMxZjIzMjg7XG4gICAgLS1mZzogI2U2ZWRmMztcbiAgICAtLW11dGVkOiAjOTE5OGExO1xuICAgIC0tYm9yZGVyOiAjM2Q0NDRkO1xuICAgIC0taG92ZXI6ICMyZDMzM2I7XG4gICAgLS1hY2NlbnQ6ICM4MThjZjg7XG4gICAgLS1kYW5nZXI6ICNmZjdiNzI7XG4gIH1cbn1cblxuLmljb24sIC5wYW5lbCB7IHBvc2l0aW9uOiBmaXhlZDsgfVxuW2hpZGRlbl0geyBkaXNwbGF5OiBub25lICFpbXBvcnRhbnQ7IH1cblxuLmljb24ge1xuICB3aWR0aDogMjZweDtcbiAgaGVpZ2h0OiAyNnB4O1xuICBwYWRkaW5nOiAwO1xuICBkaXNwbGF5OiBncmlkO1xuICBwbGFjZS1pdGVtczogY2VudGVyO1xuICBib3JkZXI6IDFweCBzb2xpZCB2YXIoLS1ib3JkZXIpO1xuICBib3JkZXItcmFkaXVzOiA3cHg7XG4gIGJhY2tncm91bmQ6IHZhcigtLWJnKTtcbiAgY29sb3I6IHZhcigtLWFjY2VudCk7XG4gIGJveC1zaGFkb3c6IDAgMnB4IDhweCByZ2IoMCAwIDAgLyAwLjE4KTtcbiAgY3Vyc29yOiBwb2ludGVyO1xufVxuLmljb246aG92ZXIgeyBiYWNrZ3JvdW5kOiB2YXIoLS1ob3Zlcik7IH1cbi5pY29uIHN2ZyB7IHdpZHRoOiAxNnB4OyBoZWlnaHQ6IDE2cHg7IH1cblxuLnBhbmVsIHtcbiAgbWluLXdpZHRoOiAxODBweDtcbiAgbWF4LXdpZHRoOiAyNjBweDtcbiAgbWF4LWhlaWdodDogMzIwcHg7XG4gIG92ZXJmbG93OiBhdXRvO1xuICBwYWRkaW5nOiA0cHg7XG4gIGJvcmRlcjogMXB4IHNvbGlkIHZhcigtLWJvcmRlcik7XG4gIGJvcmRlci1yYWRpdXM6IDhweDtcbiAgYmFja2dyb3VuZDogdmFyKC0tYmcpO1xuICBib3gtc2hhZG93OiAwIDhweCAyNHB4IHJnYigwIDAgMCAvIDAuMik7XG59XG5cbi50aXRsZSB7XG4gIHBhZGRpbmc6IDZweCA4cHggNHB4O1xuICBmb250LXNpemU6IDExcHg7XG4gIGZvbnQtd2VpZ2h0OiA2MDA7XG4gIGxldHRlci1zcGFjaW5nOiAwLjA0ZW07XG4gIHRleHQtdHJhbnNmb3JtOiB1cHBlcmNhc2U7XG4gIGNvbG9yOiB2YXIoLS1tdXRlZCk7XG59XG5cbi5pdGVtIHtcbiAgZGlzcGxheTogZmxleDtcbiAgd2lkdGg6IDEwMCU7XG4gIGp1c3RpZnktY29udGVudDogc3BhY2UtYmV0d2VlbjtcbiAgZ2FwOiAxMnB4O1xuICBwYWRkaW5nOiA2cHggOHB4O1xuICBib3JkZXI6IDA7XG4gIGJvcmRlci1yYWRpdXM6IDVweDtcbiAgYmFja2dyb3VuZDogdHJhbnNwYXJlbnQ7XG4gIGNvbG9yOiBpbmhlcml0O1xuICBmb250OiBpbmhlcml0O1xuICB0ZXh0LWFsaWduOiBsZWZ0O1xuICBjdXJzb3I6IHBvaW50ZXI7XG59XG4uaXRlbTpob3ZlciB7IGJhY2tncm91bmQ6IHZhcigtLWhvdmVyKTsgfVxuLmNvZGUgeyBjb2xvcjogdmFyKC0tbXV0ZWQpOyBmb250LXNpemU6IDEycHg7IH1cblxuLmRpdmlkZXIgeyBoZWlnaHQ6IDFweDsgbWFyZ2luOiA0cHggMDsgYmFja2dyb3VuZDogdmFyKC0tYm9yZGVyKTsgfVxuLmxpbmsgeyBjb2xvcjogdmFyKC0tbXV0ZWQpOyB9XG5cbi5zdGF0dXMgeyBkaXNwbGF5OiBmbGV4OyBhbGlnbi1pdGVtczogY2VudGVyOyBnYXA6IDhweDsgcGFkZGluZzogOHB4OyB9XG4uZXJyb3IgeyBwYWRkaW5nOiA4cHg7IGNvbG9yOiB2YXIoLS1kYW5nZXIpOyB9XG5cbi5zcGlubmVyIHtcbiAgd2lkdGg6IDE0cHg7XG4gIGhlaWdodDogMTRweDtcbiAgYm9yZGVyOiAycHggc29saWQgdmFyKC0tYm9yZGVyKTtcbiAgYm9yZGVyLXRvcC1jb2xvcjogdmFyKC0tYWNjZW50KTtcbiAgYm9yZGVyLXJhZGl1czogNTAlO1xuICBhbmltYXRpb246IHNwaW4gMC43cyBsaW5lYXIgaW5maW5pdGU7XG59XG5Aa2V5ZnJhbWVzIHNwaW4geyB0byB7IHRyYW5zZm9ybTogcm90YXRlKDM2MGRlZyk7IH0gfVxuYDtcbiIsImltcG9ydCB0eXBlIHsgTGFuZ3VhZ2UgfSBmcm9tICcuLi8uLi9jb3JlL2xhbmd1YWdlcyc7XG5pbXBvcnQgeyBXSURHRVRfQ1NTIH0gZnJvbSAnLi9zdHlsZXMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdpZGdldENhbGxiYWNrcyB7XG4gIG9uSWNvbkNsaWNrKCk6IHZvaWQ7XG4gIG9uTGFuZ3VhZ2VQaWNrKGNvZGU6IHN0cmluZyk6IHZvaWQ7XG4gIG9uT3BlblNldHRpbmdzKCk6IHZvaWQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUG9pbnQge1xuICB4OiBudW1iZXI7XG4gIHk6IG51bWJlcjtcbn1cblxuY29uc3QgSUNPTl9TVkcgPSBgPHN2ZyB2aWV3Qm94PVwiMCAwIDI0IDI0XCIgZmlsbD1cIm5vbmVcIiBzdHJva2U9XCJjdXJyZW50Q29sb3JcIiBzdHJva2Utd2lkdGg9XCIyXCIgc3Ryb2tlLWxpbmVjYXA9XCJyb3VuZFwiIHN0cm9rZS1saW5lam9pbj1cInJvdW5kXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PHBhdGggZD1cIm01IDggNiA2XCIvPjxwYXRoIGQ9XCJtNCAxNCA2LTYgMi0zXCIvPjxwYXRoIGQ9XCJNMiA1aDEyXCIvPjxwYXRoIGQ9XCJNNyAyaDFcIi8+PHBhdGggZD1cIm0yMiAyMi01LTEwLTUgMTBcIi8+PHBhdGggZD1cIk0xNCAxOGg2XCIvPjwvc3ZnPmA7XG5jb25zdCBJQ09OX1NJWkUgPSAyNjtcbmNvbnN0IEdBUCA9IDY7XG5jb25zdCBWSUVXUE9SVF9NQVJHSU4gPSA4O1xuXG4vKiogRmxvYXRpbmcgaWNvbiArIGxhbmd1YWdlIG1lbnUsIGlzb2xhdGVkIGZyb20gcGFnZSBDU1MgaW4gYSBjbG9zZWQgc2hhZG93IHJvb3QuICovXG5leHBvcnQgY2xhc3MgVHJhbnNsYXRvcldpZGdldCB7XG4gIHByaXZhdGUgcmVhZG9ubHkgaG9zdDogSFRNTEVsZW1lbnQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgaWNvbjogSFRNTEJ1dHRvbkVsZW1lbnQ7XG4gIHByaXZhdGUgcmVhZG9ubHkgcGFuZWw6IEhUTUxEaXZFbGVtZW50O1xuICBwcml2YXRlIGFuY2hvcjogUG9pbnQgPSB7IHg6IDAsIHk6IDAgfTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBwcml2YXRlIHJlYWRvbmx5IGNhbGxiYWNrczogV2lkZ2V0Q2FsbGJhY2tzLFxuICAgIHByaXZhdGUgcmVhZG9ubHkgZG9jOiBEb2N1bWVudCA9IGRvY3VtZW50LFxuICApIHtcbiAgICB0aGlzLmhvc3QgPSBkb2MuY3JlYXRlRWxlbWVudCgnYWktdHJhbnNsYXRvci13aWRnZXQnKTtcbiAgICB0aGlzLmhvc3Quc3R5bGUuY3NzVGV4dCA9ICdhbGw6IGluaXRpYWw7IHBvc2l0aW9uOiBmaXhlZDsgdG9wOiAwOyBsZWZ0OiAwOyB6LWluZGV4OiAyMTQ3NDgzNjQ3Oyc7XG4gICAgY29uc3Qgc2hhZG93ID0gdGhpcy5ob3N0LmF0dGFjaFNoYWRvdyh7IG1vZGU6ICdjbG9zZWQnIH0pO1xuXG4gICAgY29uc3Qgc3R5bGUgPSBkb2MuY3JlYXRlRWxlbWVudCgnc3R5bGUnKTtcbiAgICBzdHlsZS50ZXh0Q29udGVudCA9IFdJREdFVF9DU1M7XG5cbiAgICBjb25zdCByb290ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHJvb3QuY2xhc3NOYW1lID0gJ3dpZGdldCc7XG5cbiAgICB0aGlzLmljb24gPSBkb2MuY3JlYXRlRWxlbWVudCgnYnV0dG9uJyk7XG4gICAgdGhpcy5pY29uLmNsYXNzTmFtZSA9ICdpY29uJztcbiAgICB0aGlzLmljb24udHlwZSA9ICdidXR0b24nO1xuICAgIHRoaXMuaWNvbi50aXRsZSA9ICdUcmFuc2xhdGUgc2VsZWN0aW9uJztcbiAgICB0aGlzLmljb24uc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgJ1RyYW5zbGF0ZSBzZWxlY3Rpb24nKTtcbiAgICB0aGlzLmljb24uaW5uZXJIVE1MID0gSUNPTl9TVkc7XG4gICAgdGhpcy5pY29uLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4gdGhpcy5jYWxsYmFja3Mub25JY29uQ2xpY2soKSk7XG5cbiAgICB0aGlzLnBhbmVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xuICAgIHRoaXMucGFuZWwuY2xhc3NOYW1lID0gJ3BhbmVsJztcbiAgICB0aGlzLnBhbmVsLnNldEF0dHJpYnV0ZSgncm9sZScsICdtZW51Jyk7XG5cbiAgICByb290LmFwcGVuZCh0aGlzLmljb24sIHRoaXMucGFuZWwpO1xuICAgIHNoYWRvdy5hcHBlbmQoc3R5bGUsIHJvb3QpO1xuXG4gICAgLy8gS2VlcCBmb2N1cyBhbmQgdGhlIHRleHQgc2VsZWN0aW9uIGluIHRoZSBwYWdlJ3MgaW5wdXQgd2hpbGUgY2xpY2tpbmcgdGhlIHdpZGdldC5cbiAgICBzaGFkb3cuYWRkRXZlbnRMaXN0ZW5lcignbW91c2Vkb3duJywgKGV2ZW50KSA9PiBldmVudC5wcmV2ZW50RGVmYXVsdCgpKTtcbiAgICAvLyBEb24ndCBsZXQgdGhlIHBhZ2UgdHJlYXQgY2xpY2tzIG9uIHRoZSB3aWRnZXQgYXMgXCJvdXRzaWRlIGNsaWNrc1wiLlxuICAgIGZvciAoY29uc3QgdHlwZSBvZiBbJ21vdXNlZG93bicsICdtb3VzZXVwJywgJ2NsaWNrJywgJ3BvaW50ZXJkb3duJywgJ3BvaW50ZXJ1cCddKSB7XG4gICAgICB0aGlzLmhvc3QuYWRkRXZlbnRMaXN0ZW5lcih0eXBlLCAoZXZlbnQpID0+IGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpKTtcbiAgICB9XG5cbiAgICB0aGlzLmhpZGUoKTtcbiAgfVxuXG4gIG1vdW50KCk6IHZvaWQge1xuICAgIGlmICghdGhpcy5ob3N0LmlzQ29ubmVjdGVkKSB0aGlzLmRvYy5kb2N1bWVudEVsZW1lbnQuYXBwZW5kKHRoaXMuaG9zdCk7XG4gIH1cblxuICBkZXN0cm95KCk6IHZvaWQge1xuICAgIHRoaXMuaG9zdC5yZW1vdmUoKTtcbiAgfVxuXG4gIGdldCBpc01lbnVPcGVuKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5wYW5lbC5oaWRkZW47XG4gIH1cblxuICBnZXQgaXNWaXNpYmxlKCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiAhdGhpcy5pY29uLmhpZGRlbiB8fCAhdGhpcy5wYW5lbC5oaWRkZW47XG4gIH1cblxuICBvd25zKGV2ZW50OiBFdmVudCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiBldmVudC5jb21wb3NlZFBhdGgoKS5pbmNsdWRlcyh0aGlzLmhvc3QpO1xuICB9XG5cbiAgc2hvd0ljb24ocG9pbnQ6IFBvaW50KTogdm9pZCB7XG4gICAgdGhpcy5tb3VudCgpO1xuICAgIHRoaXMuYW5jaG9yID0gcG9pbnQ7XG4gICAgdGhpcy5wYW5lbC5oaWRkZW4gPSB0cnVlO1xuICAgIHRoaXMuaWNvbi5oaWRkZW4gPSBmYWxzZTtcbiAgICBjb25zdCB2aWV3cG9ydCA9IHRoaXMudmlld3BvcnQoKTtcbiAgICB0aGlzLmljb24uc3R5bGUubGVmdCA9IGAke2NsYW1wKHBvaW50LnggKyBHQVAsIFZJRVdQT1JUX01BUkdJTiwgdmlld3BvcnQud2lkdGggLSBJQ09OX1NJWkUgLSBWSUVXUE9SVF9NQVJHSU4pfXB4YDtcbiAgICB0aGlzLmljb24uc3R5bGUudG9wID0gYCR7Y2xhbXAocG9pbnQueSArIEdBUCwgVklFV1BPUlRfTUFSR0lOLCB2aWV3cG9ydC5oZWlnaHQgLSBJQ09OX1NJWkUgLSBWSUVXUE9SVF9NQVJHSU4pfXB4YDtcbiAgfVxuXG4gIHNob3dMYW5ndWFnZXMobGFuZ3VhZ2VzOiByZWFkb25seSBMYW5ndWFnZVtdKTogdm9pZCB7XG4gICAgY29uc3QgdGl0bGUgPSB0aGlzLmVsZW1lbnQoJ2RpdicsICd0aXRsZScsICdUcmFuc2xhdGUgdG8nKTtcbiAgICBjb25zdCBpdGVtcyA9IGxhbmd1YWdlcy5tYXAoKGxhbmd1YWdlKSA9PiB7XG4gICAgICBjb25zdCBpdGVtID0gdGhpcy5lbGVtZW50KCdidXR0b24nLCAnaXRlbScpO1xuICAgICAgaXRlbS50eXBlID0gJ2J1dHRvbic7XG4gICAgICBpdGVtLnNldEF0dHJpYnV0ZSgncm9sZScsICdtZW51aXRlbScpO1xuICAgICAgaXRlbS5hcHBlbmQodGhpcy5lbGVtZW50KCdzcGFuJywgJycsIGxhbmd1YWdlLm5hbWUpLCB0aGlzLmVsZW1lbnQoJ3NwYW4nLCAnY29kZScsIGxhbmd1YWdlLmNvZGUpKTtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vbkxhbmd1YWdlUGljayhsYW5ndWFnZS5jb2RlKSk7XG4gICAgICByZXR1cm4gaXRlbTtcbiAgICB9KTtcbiAgICBjb25zdCBlbXB0eSA9IGxhbmd1YWdlcy5sZW5ndGggPT09IDAgPyBbdGhpcy5lbGVtZW50KCdkaXYnLCAnc3RhdHVzJywgJ05vIGZhdm9yaXRlIGxhbmd1YWdlcyB5ZXQuJyldIDogW107XG4gICAgdGhpcy5zaG93UGFuZWwodGl0bGUsIC4uLml0ZW1zLCAuLi5lbXB0eSwgdGhpcy5kaXZpZGVyKCksIHRoaXMuc2V0dGluZ3NMaW5rKCkpO1xuICB9XG5cbiAgc2hvd0J1c3kobGFuZ3VhZ2VOYW1lOiBzdHJpbmcpOiB2b2lkIHtcbiAgICBjb25zdCBzdGF0dXMgPSB0aGlzLmVsZW1lbnQoJ2RpdicsICdzdGF0dXMnKTtcbiAgICBzdGF0dXMuYXBwZW5kKHRoaXMuZWxlbWVudCgnZGl2JywgJ3NwaW5uZXInKSwgdGhpcy5lbGVtZW50KCdzcGFuJywgJycsIGBUcmFuc2xhdGluZyB0byAke2xhbmd1YWdlTmFtZX3igKZgKSk7XG4gICAgdGhpcy5zaG93UGFuZWwoc3RhdHVzKTtcbiAgfVxuXG4gIHNob3dFcnJvcihtZXNzYWdlOiBzdHJpbmcsIG9uQmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgIGNvbnN0IGJhY2sgPSB0aGlzLmVsZW1lbnQoJ2J1dHRvbicsICdpdGVtJywgJ+KGkCBCYWNrJyk7XG4gICAgYmFjay50eXBlID0gJ2J1dHRvbic7XG4gICAgYmFjay5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsIG9uQmFjayk7XG4gICAgdGhpcy5zaG93UGFuZWwodGhpcy5lbGVtZW50KCdkaXYnLCAnZXJyb3InLCBtZXNzYWdlKSwgdGhpcy5kaXZpZGVyKCksIGJhY2ssIHRoaXMuc2V0dGluZ3NMaW5rKCkpO1xuICB9XG5cbiAgaGlkZSgpOiB2b2lkIHtcbiAgICB0aGlzLmljb24uaGlkZGVuID0gdHJ1ZTtcbiAgICB0aGlzLnBhbmVsLmhpZGRlbiA9IHRydWU7XG4gIH1cblxuICBwcml2YXRlIHNob3dQYW5lbCguLi5jaGlsZHJlbjogTm9kZVtdKTogdm9pZCB7XG4gICAgdGhpcy5tb3VudCgpO1xuICAgIHRoaXMucGFuZWwucmVwbGFjZUNoaWxkcmVuKC4uLmNoaWxkcmVuKTtcbiAgICB0aGlzLmljb24uaGlkZGVuID0gdHJ1ZTtcbiAgICB0aGlzLnBhbmVsLmhpZGRlbiA9IGZhbHNlO1xuICAgIHRoaXMucG9zaXRpb25QYW5lbCgpO1xuICB9XG5cbiAgcHJpdmF0ZSBwb3NpdGlvblBhbmVsKCk6IHZvaWQge1xuICAgIGNvbnN0IHZpZXdwb3J0ID0gdGhpcy52aWV3cG9ydCgpO1xuICAgIGNvbnN0IHsgd2lkdGgsIGhlaWdodCB9ID0gdGhpcy5wYW5lbC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICBsZXQgdG9wID0gdGhpcy5hbmNob3IueSArIEdBUDtcbiAgICBpZiAodG9wICsgaGVpZ2h0ID4gdmlld3BvcnQuaGVpZ2h0IC0gVklFV1BPUlRfTUFSR0lOKSB7XG4gICAgICB0b3AgPSB0aGlzLmFuY2hvci55IC0gaGVpZ2h0IC0gR0FQOyAvLyBmbGlwIGFib3ZlIHRoZSBzZWxlY3Rpb25cbiAgICB9XG4gICAgdGhpcy5wYW5lbC5zdHlsZS5sZWZ0ID0gYCR7Y2xhbXAodGhpcy5hbmNob3IueCArIEdBUCwgVklFV1BPUlRfTUFSR0lOLCB2aWV3cG9ydC53aWR0aCAtIHdpZHRoIC0gVklFV1BPUlRfTUFSR0lOKX1weGA7XG4gICAgdGhpcy5wYW5lbC5zdHlsZS50b3AgPSBgJHtjbGFtcCh0b3AsIFZJRVdQT1JUX01BUkdJTiwgdmlld3BvcnQuaGVpZ2h0IC0gaGVpZ2h0IC0gVklFV1BPUlRfTUFSR0lOKX1weGA7XG4gIH1cblxuICBwcml2YXRlIHNldHRpbmdzTGluaygpOiBIVE1MQnV0dG9uRWxlbWVudCB7XG4gICAgY29uc3QgbGluayA9IHRoaXMuZWxlbWVudCgnYnV0dG9uJywgJ2l0ZW0gbGluaycsICdTZXR0aW5nc+KApicpO1xuICAgIGxpbmsudHlwZSA9ICdidXR0b24nO1xuICAgIGxpbmsuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB0aGlzLmNhbGxiYWNrcy5vbk9wZW5TZXR0aW5ncygpKTtcbiAgICByZXR1cm4gbGluaztcbiAgfVxuXG4gIHByaXZhdGUgZGl2aWRlcigpOiBIVE1MRGl2RWxlbWVudCB7XG4gICAgcmV0dXJuIHRoaXMuZWxlbWVudCgnZGl2JywgJ2RpdmlkZXInKTtcbiAgfVxuXG4gIHByaXZhdGUgZWxlbWVudDxLIGV4dGVuZHMga2V5b2YgSFRNTEVsZW1lbnRUYWdOYW1lTWFwPih0YWc6IEssIGNsYXNzTmFtZTogc3RyaW5nLCB0ZXh0Pzogc3RyaW5nKTogSFRNTEVsZW1lbnRUYWdOYW1lTWFwW0tdIHtcbiAgICBjb25zdCBlbGVtZW50ID0gdGhpcy5kb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xuICAgIGlmIChjbGFzc05hbWUpIGVsZW1lbnQuY2xhc3NOYW1lID0gY2xhc3NOYW1lO1xuICAgIGlmICh0ZXh0ICE9PSB1bmRlZmluZWQpIGVsZW1lbnQudGV4dENvbnRlbnQgPSB0ZXh0O1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgcHJpdmF0ZSB2aWV3cG9ydCgpOiB7IHdpZHRoOiBudW1iZXI7IGhlaWdodDogbnVtYmVyIH0ge1xuICAgIGNvbnN0IHsgY2xpZW50V2lkdGgsIGNsaWVudEhlaWdodCB9ID0gdGhpcy5kb2MuZG9jdW1lbnRFbGVtZW50O1xuICAgIHJldHVybiB7IHdpZHRoOiBjbGllbnRXaWR0aCwgaGVpZ2h0OiBjbGllbnRIZWlnaHQgfTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjbGFtcCh2YWx1ZTogbnVtYmVyLCBtaW46IG51bWJlciwgbWF4OiBudW1iZXIpOiBudW1iZXIge1xuICByZXR1cm4gTWF0aC5tYXgobWluLCBNYXRoLm1pbih2YWx1ZSwgTWF0aC5tYXgobWluLCBtYXgpKSk7XG59XG4iLCIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbmltcG9ydCB0eXBlIHsgUHJvdmlkZXJJbmZvIH0gZnJvbSAnLi4vY29yZS9yZWdpc3RyeSc7XG5pbXBvcnQgdHlwZSB7IFRyYW5zbGF0ZVJlc3VsdCwgVHJhbnNsYXRpb25FcnJvckNvZGUgfSBmcm9tICcuLi9jb3JlL3RyYW5zbGF0b3InO1xuXG5leHBvcnQgdHlwZSBNZXNzYWdlID1cbiAgfCB7IHR5cGU6ICd0cmFuc2xhdGUnOyB0ZXh0OiBzdHJpbmc7IHRhcmdldExhbmc6IHN0cmluZyB9XG4gIHwgeyB0eXBlOiAnbGlzdC1wcm92aWRlcnMnIH1cbiAgfCB7IHR5cGU6ICdvcGVuLW9wdGlvbnMnIH07XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzcG9uc2VNYXAge1xuICB0cmFuc2xhdGU6IFRyYW5zbGF0ZVJlc3VsdDtcbiAgJ2xpc3QtcHJvdmlkZXJzJzogUHJvdmlkZXJJbmZvW107XG4gICdvcGVuLW9wdGlvbnMnOiB2b2lkO1xufVxuXG4vKiogRXJyb3JzIGRvbid0IHN1cnZpdmUgc3RydWN0dXJlZCBjbG9uaW5nLCBzbyB0aGV5IHRyYXZlbCBhcyBwbGFpbiBkYXRhLiAqL1xuZXhwb3J0IHR5cGUgUmVzcG9uc2U8VD4gPVxuICB8IHsgb2s6IHRydWU7IGRhdGE6IFQgfVxuICB8IHsgb2s6IGZhbHNlOyBlcnJvcjogeyBtZXNzYWdlOiBzdHJpbmc7IGNvZGU/OiBUcmFuc2xhdGlvbkVycm9yQ29kZSB9IH07XG5cbmV4cG9ydCBmdW5jdGlvbiBpc01lc3NhZ2UodmFsdWU6IHVua25vd24pOiB2YWx1ZSBpcyBNZXNzYWdlIHtcbiAgcmV0dXJuIHR5cGVvZiB2YWx1ZSA9PT0gJ29iamVjdCcgJiYgdmFsdWUgIT09IG51bGwgJiYgdHlwZW9mICh2YWx1ZSBhcyB7IHR5cGU/OiB1bmtub3duIH0pLnR5cGUgPT09ICdzdHJpbmcnO1xufVxuXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gc2VuZE1lc3NhZ2U8TSBleHRlbmRzIE1lc3NhZ2U+KG1lc3NhZ2U6IE0pOiBQcm9taXNlPFJlc3BvbnNlPFJlc3BvbnNlTWFwW01bJ3R5cGUnXV0+PiB7XG4gIHRyeSB7XG4gICAgcmV0dXJuIGF3YWl0IGJyb3dzZXIucnVudGltZS5zZW5kTWVzc2FnZShtZXNzYWdlKTtcbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAvLyBUeXBpY2FsbHkgXCJFeHRlbnNpb24gY29udGV4dCBpbnZhbGlkYXRlZFwiIGFmdGVyIHRoZSBleHRlbnNpb24gcmVsb2Fkcy5cbiAgICBjb25zdCByZWFzb24gPSBlcnJvciBpbnN0YW5jZW9mIEVycm9yID8gZXJyb3IubWVzc2FnZSA6IFN0cmluZyhlcnJvcik7XG4gICAgcmV0dXJuIHsgb2s6IGZhbHNlLCBlcnJvcjogeyBtZXNzYWdlOiBgRXh0ZW5zaW9uIHVuYXZhaWxhYmxlOiAke3JlYXNvbn0uIFJlbG9hZCB0aGUgcGFnZS5gIH0gfTtcbiAgfVxufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNsYXNzIE5vZGUge1xuICBjb25zdHJ1Y3RvciAoZGF0YSkge1xuICAgIHRoaXMuZGF0YSA9IGRhdGFcbiAgfVxufVxuXG5jbGFzcyBMaW5rZWRMaXN0IHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMubGVuZ3RoID0gMFxuICB9XG5cbiAgZW5xdWV1ZSAoZGF0YSkge1xuICAgIGNvbnN0IG5vZGUgPSBuZXcgTm9kZShkYXRhKVxuICAgIG5vZGUucHJldiA9IHRoaXMudGFpbFxuICAgIGlmICh0aGlzLnRhaWwpIHRoaXMudGFpbC5uZXh0ID0gbm9kZVxuICAgIGVsc2UgdGhpcy5oZWFkID0gbm9kZVxuICAgIHRoaXMudGFpbCA9IG5vZGVcbiAgICB0aGlzLmxlbmd0aCsrXG4gICAgcmV0dXJuIG5vZGVcbiAgfVxuXG4gIGRlcXVldWUgKCkge1xuICAgIGlmICghdGhpcy5oZWFkKSByZXR1cm5cbiAgICBjb25zdCB7IGRhdGEgfSA9IHRoaXMuaGVhZFxuICAgIHRoaXMucmVtb3ZlKHRoaXMuaGVhZClcbiAgICByZXR1cm4gZGF0YVxuICB9XG5cbiAgcmVtb3ZlIChub2RlKSB7XG4gICAgaWYgKG5vZGUucHJldikgbm9kZS5wcmV2Lm5leHQgPSBub2RlLm5leHRcbiAgICBlbHNlIHRoaXMuaGVhZCA9IG5vZGUubmV4dFxuICAgIGlmIChub2RlLm5leHQpIG5vZGUubmV4dC5wcmV2ID0gbm9kZS5wcmV2XG4gICAgZWxzZSB0aGlzLnRhaWwgPSBub2RlLnByZXZcbiAgICB0aGlzLmxlbmd0aC0tXG4gIH1cblxuICBzaXplICgpIHtcbiAgICByZXR1cm4gdGhpcy5sZW5ndGhcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IChzbG90cyA9IDEpID0+IHtcbiAgY29uc3QgcXVldWUgPSBuZXcgTGlua2VkTGlzdCgpXG5cbiAgY29uc3QgcmVsZWFzZSA9ICgpID0+IHtcbiAgICArK3Nsb3RzXG4gICAgY29uc3Qgd2FpdGVyID0gcXVldWUuZGVxdWV1ZSgpXG4gICAgaWYgKHdhaXRlcikgcmV0dXJuIHdhaXRlci5hY3F1aXJlKClcbiAgfVxuXG4gIGNvbnN0IGFjcXVpcmUgPSByZXNvbHZlID0+IHtcbiAgICAtLXNsb3RzXG4gICAgcmVzb2x2ZShyZWxlYXNlKVxuICB9XG5cbiAgY29uc3QgbG9jayA9IHNpZ25hbCA9PlxuICAgIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgaWYgKHNpZ25hbCAhPSBudWxsICYmIHR5cGVvZiBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdgc2lnbmFsYCBuZWVkcyB0byBiZSBhbiBBYm9ydFNpZ25hbC4nKVxuICAgICAgfVxuICAgICAgaWYgKHNpZ25hbD8uYWJvcnRlZCkgcmV0dXJuIHJlc29sdmUobnVsbClcbiAgICAgIGlmICghbG9jay5pc0xvY2tlZCgpKSByZXR1cm4gYWNxdWlyZShyZXNvbHZlKVxuXG4gICAgICBjb25zdCB3YWl0ZXIgPSB7IGFjcXVpcmU6ICgpID0+IGFjcXVpcmUocmVzb2x2ZSkgfVxuICAgICAgY29uc3Qgbm9kZSA9IHF1ZXVlLmVucXVldWUod2FpdGVyKVxuXG4gICAgICBpZiAoc2lnbmFsICE9IG51bGwpIHtcbiAgICAgICAgY29uc3Qgb25BYm9ydCA9ICgpID0+IHtcbiAgICAgICAgICBxdWV1ZS5yZW1vdmUobm9kZSlcbiAgICAgICAgICByZXNvbHZlKG51bGwpXG4gICAgICAgIH1cbiAgICAgICAgd2FpdGVyLmFjcXVpcmUgPSAoKSA9PiB7XG4gICAgICAgICAgc2lnbmFsLnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydClcbiAgICAgICAgICBhY3F1aXJlKHJlc29sdmUpXG4gICAgICAgIH1cbiAgICAgICAgc2lnbmFsLmFkZEV2ZW50TGlzdGVuZXIoJ2Fib3J0Jywgb25BYm9ydCwgeyBvbmNlOiB0cnVlIH0pXG4gICAgICB9XG4gICAgfSlcblxuICBsb2NrLmlzTG9ja2VkID0gKCkgPT4gc2xvdHMgPT09IDBcblxuICBsb2NrLmF3YWl0aW5nID0gKCkgPT4gcXVldWUuc2l6ZSgpXG5cbiAgcmV0dXJuIGxvY2tcbn1cbiIsIid1c2Ugc3RyaWN0J1xuXG5jb25zdCBjcmVhdGVMb2NrID0gcmVxdWlyZSgnLi9jcmVhdGUnKVxuXG5jb25zdCB3aXRoTG9jayA9IG9wdHMgPT4ge1xuICBjb25zdCBsb2NrID0gY3JlYXRlTG9jayhvcHRzKVxuXG4gIGNvbnN0IHdpdGhMb2NrID0gYXN5bmMgKGZuLCBzaWduYWwpID0+IHtcbiAgICBjb25zdCByZWxlYXNlID0gYXdhaXQgbG9jayhzaWduYWwpXG4gICAgaWYgKCFyZWxlYXNlKSByZXR1cm5cbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGF3YWl0IGZuKClcbiAgICB9IGZpbmFsbHkge1xuICAgICAgcmVsZWFzZSgpXG4gICAgfVxuICB9XG5cbiAgd2l0aExvY2suaXNMb2NrZWQgPSBsb2NrLmlzTG9ja2VkXG4gIHdpdGhMb2NrLmF3YWl0aW5nID0gbG9jay5hd2FpdGluZ1xuXG4gIHJldHVybiB3aXRoTG9ja1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHsgd2l0aExvY2ssIGNyZWF0ZUxvY2sgfVxuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG5pbXBvcnQgeyB3aXRoTG9jayB9IGZyb20gXCJzdXBlcmxvY2tcIjtcbi8vI3JlZ2lvbiAuLi8uLi9ub2RlX21vZHVsZXMvLmJ1bi9kZXF1YWxAMi4wLjMvbm9kZV9tb2R1bGVzL2RlcXVhbC9saXRlL2luZGV4Lm1qc1xudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5mdW5jdGlvbiBkZXF1YWwoZm9vLCBiYXIpIHtcblx0dmFyIGN0b3IsIGxlbjtcblx0aWYgKGZvbyA9PT0gYmFyKSByZXR1cm4gdHJ1ZTtcblx0aWYgKGZvbyAmJiBiYXIgJiYgKGN0b3IgPSBmb28uY29uc3RydWN0b3IpID09PSBiYXIuY29uc3RydWN0b3IpIHtcblx0XHRpZiAoY3RvciA9PT0gRGF0ZSkgcmV0dXJuIGZvby5nZXRUaW1lKCkgPT09IGJhci5nZXRUaW1lKCk7XG5cdFx0aWYgKGN0b3IgPT09IFJlZ0V4cCkgcmV0dXJuIGZvby50b1N0cmluZygpID09PSBiYXIudG9TdHJpbmcoKTtcblx0XHRpZiAoY3RvciA9PT0gQXJyYXkpIHtcblx0XHRcdGlmICgobGVuID0gZm9vLmxlbmd0aCkgPT09IGJhci5sZW5ndGgpIHdoaWxlIChsZW4tLSAmJiBkZXF1YWwoZm9vW2xlbl0sIGJhcltsZW5dKSk7XG5cdFx0XHRyZXR1cm4gbGVuID09PSAtMTtcblx0XHR9XG5cdFx0aWYgKCFjdG9yIHx8IHR5cGVvZiBmb28gPT09IFwib2JqZWN0XCIpIHtcblx0XHRcdGxlbiA9IDA7XG5cdFx0XHRmb3IgKGN0b3IgaW4gZm9vKSB7XG5cdFx0XHRcdGlmIChoYXMuY2FsbChmb28sIGN0b3IpICYmICsrbGVuICYmICFoYXMuY2FsbChiYXIsIGN0b3IpKSByZXR1cm4gZmFsc2U7XG5cdFx0XHRcdGlmICghKGN0b3IgaW4gYmFyKSB8fCAhZGVxdWFsKGZvb1tjdG9yXSwgYmFyW2N0b3JdKSkgcmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIE9iamVjdC5rZXlzKGJhcikubGVuZ3RoID09PSBsZW47XG5cdFx0fVxuXHR9XG5cdHJldHVybiBmb28gIT09IGZvbyAmJiBiYXIgIT09IGJhcjtcbn1cbi8vI2VuZHJlZ2lvblxuLy8jcmVnaW9uIHNyYy9pbmRleC50c1xuLyoqXG4qIFNpbXBsaWZpZWQgc3RvcmFnZSBBUElzIHdpdGggc3VwcG9ydCBmb3IgdmVyc2lvbmVkIGZpZWxkcywgc25hcHNob3RzLFxuKiBtZXRhZGF0YSwgYW5kIGl0ZW0gZGVmaW5pdGlvbnMuXG4qXG4qIFNlZSBbdGhlIGd1aWRlXShodHRwczovL3d4dC5kZXYvc3RvcmFnZS5odG1sKSBmb3IgbW9yZSBpbmZvcm1hdGlvbi5cbipcbiogQG1vZHVsZSBAd3h0LWRldi9zdG9yYWdlXG4qL1xuY29uc3Qgc3RvcmFnZSA9IGNyZWF0ZVN0b3JhZ2UoKTtcbmZ1bmN0aW9uIGNyZWF0ZVN0b3JhZ2UoKSB7XG5cdGNvbnN0IGRyaXZlcnMgPSB7XG5cdFx0bG9jYWw6IGNyZWF0ZURyaXZlcihcImxvY2FsXCIpLFxuXHRcdHNlc3Npb246IGNyZWF0ZURyaXZlcihcInNlc3Npb25cIiksXG5cdFx0c3luYzogY3JlYXRlRHJpdmVyKFwic3luY1wiKSxcblx0XHRtYW5hZ2VkOiBjcmVhdGVEcml2ZXIoXCJtYW5hZ2VkXCIpXG5cdH07XG5cdGNvbnN0IGdldERyaXZlciA9IChhcmVhKSA9PiB7XG5cdFx0Y29uc3QgZHJpdmVyID0gZHJpdmVyc1thcmVhXTtcblx0XHRpZiAoZHJpdmVyID09IG51bGwpIHtcblx0XHRcdGNvbnN0IGFyZWFOYW1lcyA9IE9iamVjdC5rZXlzKGRyaXZlcnMpLmpvaW4oXCIsIFwiKTtcblx0XHRcdHRocm93IEVycm9yKGBJbnZhbGlkIGFyZWEgXCIke2FyZWF9XCIuIE9wdGlvbnM6ICR7YXJlYU5hbWVzfWApO1xuXHRcdH1cblx0XHRyZXR1cm4gZHJpdmVyO1xuXHR9O1xuXHRjb25zdCByZXNvbHZlS2V5ID0gKGtleSkgPT4ge1xuXHRcdGNvbnN0IGRlbGltaW5hdG9ySW5kZXggPSBrZXkuaW5kZXhPZihcIjpcIik7XG5cdFx0Y29uc3QgZHJpdmVyQXJlYSA9IGtleS5zdWJzdHJpbmcoMCwgZGVsaW1pbmF0b3JJbmRleCk7XG5cdFx0Y29uc3QgZHJpdmVyS2V5ID0ga2V5LnN1YnN0cmluZyhkZWxpbWluYXRvckluZGV4ICsgMSk7XG5cdFx0aWYgKGRyaXZlcktleSA9PSBudWxsKSB0aHJvdyBFcnJvcihgU3RvcmFnZSBrZXkgc2hvdWxkIGJlIGluIHRoZSBmb3JtIG9mIFwiYXJlYTprZXlcIiwgYnV0IHJlY2VpdmVkIFwiJHtrZXl9XCJgKTtcblx0XHRyZXR1cm4ge1xuXHRcdFx0ZHJpdmVyQXJlYSxcblx0XHRcdGRyaXZlcktleSxcblx0XHRcdGRyaXZlcjogZ2V0RHJpdmVyKGRyaXZlckFyZWEpXG5cdFx0fTtcblx0fTtcblx0Y29uc3QgZ2V0TWV0YUtleSA9IChrZXkpID0+IGtleSArIFwiJFwiO1xuXHRjb25zdCBtZXJnZU1ldGEgPSAob2xkTWV0YSwgbmV3TWV0YSkgPT4ge1xuXHRcdGNvbnN0IG5ld0ZpZWxkcyA9IHsgLi4ub2xkTWV0YSB9O1xuXHRcdE9iamVjdC5lbnRyaWVzKG5ld01ldGEpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuXHRcdFx0aWYgKHZhbHVlID09IG51bGwpIGRlbGV0ZSBuZXdGaWVsZHNba2V5XTtcblx0XHRcdGVsc2UgbmV3RmllbGRzW2tleV0gPSB2YWx1ZTtcblx0XHR9KTtcblx0XHRyZXR1cm4gbmV3RmllbGRzO1xuXHR9O1xuXHRjb25zdCBnZXRWYWx1ZU9yRmFsbGJhY2sgPSAodmFsdWUsIGZhbGxiYWNrKSA9PiB2YWx1ZSA/PyBmYWxsYmFjayA/PyBudWxsO1xuXHRjb25zdCBnZXRNZXRhVmFsdWUgPSAocHJvcGVydGllcykgPT4gdHlwZW9mIHByb3BlcnRpZXMgPT09IFwib2JqZWN0XCIgJiYgIUFycmF5LmlzQXJyYXkocHJvcGVydGllcykgPyBwcm9wZXJ0aWVzIDoge307XG5cdGNvbnN0IGdldEl0ZW0gPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXksIG9wdHMpID0+IHtcblx0XHRyZXR1cm4gZ2V0VmFsdWVPckZhbGxiYWNrKGF3YWl0IGRyaXZlci5nZXRJdGVtKGRyaXZlcktleSksIG9wdHM/LmZhbGxiYWNrID8/IG9wdHM/LmRlZmF1bHRWYWx1ZSk7XG5cdH07XG5cdGNvbnN0IGdldE1ldGEgPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXkpID0+IHtcblx0XHRjb25zdCBtZXRhS2V5ID0gZ2V0TWV0YUtleShkcml2ZXJLZXkpO1xuXHRcdHJldHVybiBnZXRNZXRhVmFsdWUoYXdhaXQgZHJpdmVyLmdldEl0ZW0obWV0YUtleSkpO1xuXHR9O1xuXHRjb25zdCBzZXRJdGVtID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5LCB2YWx1ZSkgPT4ge1xuXHRcdGF3YWl0IGRyaXZlci5zZXRJdGVtKGRyaXZlcktleSwgdmFsdWUgPz8gbnVsbCk7XG5cdH07XG5cdGNvbnN0IHNldE1ldGEgPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpID0+IHtcblx0XHRjb25zdCBtZXRhS2V5ID0gZ2V0TWV0YUtleShkcml2ZXJLZXkpO1xuXHRcdGNvbnN0IGV4aXN0aW5nRmllbGRzID0gZ2V0TWV0YVZhbHVlKGF3YWl0IGRyaXZlci5nZXRJdGVtKG1ldGFLZXkpKTtcblx0XHRhd2FpdCBkcml2ZXIuc2V0SXRlbShtZXRhS2V5LCBtZXJnZU1ldGEoZXhpc3RpbmdGaWVsZHMsIHByb3BlcnRpZXMpKTtcblx0fTtcblx0Y29uc3QgcmVtb3ZlSXRlbSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSwgb3B0cykgPT4ge1xuXHRcdGF3YWl0IGRyaXZlci5yZW1vdmVJdGVtKGRyaXZlcktleSk7XG5cdFx0aWYgKG9wdHM/LnJlbW92ZU1ldGEpIHtcblx0XHRcdGNvbnN0IG1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG5cdFx0XHRhd2FpdCBkcml2ZXIucmVtb3ZlSXRlbShtZXRhS2V5KTtcblx0XHR9XG5cdH07XG5cdGNvbnN0IHJlbW92ZU1ldGEgPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpID0+IHtcblx0XHRjb25zdCBtZXRhS2V5ID0gZ2V0TWV0YUtleShkcml2ZXJLZXkpO1xuXHRcdGlmIChwcm9wZXJ0aWVzID09IG51bGwpIGF3YWl0IGRyaXZlci5yZW1vdmVJdGVtKG1ldGFLZXkpO1xuXHRcdGVsc2Uge1xuXHRcdFx0Y29uc3QgbmV3RmllbGRzID0gZ2V0TWV0YVZhbHVlKGF3YWl0IGRyaXZlci5nZXRJdGVtKG1ldGFLZXkpKTtcblx0XHRcdFtwcm9wZXJ0aWVzXS5mbGF0KCkuZm9yRWFjaCgoZmllbGQpID0+IGRlbGV0ZSBuZXdGaWVsZHNbZmllbGRdKTtcblx0XHRcdGF3YWl0IGRyaXZlci5zZXRJdGVtKG1ldGFLZXksIG5ld0ZpZWxkcyk7XG5cdFx0fVxuXHR9O1xuXHRjb25zdCB3YXRjaCA9IChkcml2ZXIsIGRyaXZlcktleSwgY2IpID0+IGRyaXZlci53YXRjaChkcml2ZXJLZXksIGNiKTtcblx0cmV0dXJuIHtcblx0XHRnZXRJdGVtOiBhc3luYyAoa2V5LCBvcHRzKSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRyZXR1cm4gYXdhaXQgZ2V0SXRlbShkcml2ZXIsIGRyaXZlcktleSwgb3B0cyk7XG5cdFx0fSxcblx0XHRnZXRJdGVtczogYXN5bmMgKGtleXMpID0+IHtcblx0XHRcdGNvbnN0IGFyZWFUb0tleU1hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG5cdFx0XHRjb25zdCBrZXlUb09wdHNNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuXHRcdFx0Y29uc3Qgb3JkZXJlZEtleXMgPSBbXTtcblx0XHRcdGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRcdGxldCBrZXlTdHI7XG5cdFx0XHRcdGxldCBvcHRzO1xuXHRcdFx0XHRpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikga2V5U3RyID0ga2V5O1xuXHRcdFx0XHRlbHNlIGlmIChcImdldFZhbHVlXCIgaW4ga2V5KSB7XG5cdFx0XHRcdFx0a2V5U3RyID0ga2V5LmtleTtcblx0XHRcdFx0XHRvcHRzID0geyBmYWxsYmFjazoga2V5LmZhbGxiYWNrIH07XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0a2V5U3RyID0ga2V5LmtleTtcblx0XHRcdFx0XHRvcHRzID0ga2V5Lm9wdGlvbnM7XG5cdFx0XHRcdH1cblx0XHRcdFx0b3JkZXJlZEtleXMucHVzaChrZXlTdHIpO1xuXHRcdFx0XHRjb25zdCB7IGRyaXZlckFyZWEsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXlTdHIpO1xuXHRcdFx0XHRjb25zdCBhcmVhS2V5cyA9IGFyZWFUb0tleU1hcC5nZXQoZHJpdmVyQXJlYSkgPz8gW107XG5cdFx0XHRcdGFyZWFUb0tleU1hcC5zZXQoZHJpdmVyQXJlYSwgYXJlYUtleXMuY29uY2F0KGRyaXZlcktleSkpO1xuXHRcdFx0XHRrZXlUb09wdHNNYXAuc2V0KGtleVN0ciwgb3B0cyk7XG5cdFx0XHR9KTtcblx0XHRcdGNvbnN0IHJlc3VsdHNNYXAgPSAvKiBAX19QVVJFX18gKi8gbmV3IE1hcCgpO1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoQXJyYXkuZnJvbShhcmVhVG9LZXlNYXAuZW50cmllcygpKS5tYXAoYXN5bmMgKFtkcml2ZXJBcmVhLCBrZXlzXSkgPT4ge1xuXHRcdFx0XHQoYXdhaXQgZHJpdmVyc1tkcml2ZXJBcmVhXS5nZXRJdGVtcyhrZXlzKSkuZm9yRWFjaCgoZHJpdmVyUmVzdWx0KSA9PiB7XG5cdFx0XHRcdFx0Y29uc3Qga2V5ID0gYCR7ZHJpdmVyQXJlYX06JHtkcml2ZXJSZXN1bHQua2V5fWA7XG5cdFx0XHRcdFx0Y29uc3Qgb3B0cyA9IGtleVRvT3B0c01hcC5nZXQoa2V5KTtcblx0XHRcdFx0XHRjb25zdCB2YWx1ZSA9IGdldFZhbHVlT3JGYWxsYmFjayhkcml2ZXJSZXN1bHQudmFsdWUsIG9wdHM/LmZhbGxiYWNrID8/IG9wdHM/LmRlZmF1bHRWYWx1ZSk7XG5cdFx0XHRcdFx0cmVzdWx0c01hcC5zZXQoa2V5LCB2YWx1ZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSkpO1xuXHRcdFx0cmV0dXJuIG9yZGVyZWRLZXlzLm1hcCgoa2V5KSA9PiAoe1xuXHRcdFx0XHRrZXksXG5cdFx0XHRcdHZhbHVlOiByZXN1bHRzTWFwLmdldChrZXkpXG5cdFx0XHR9KSk7XG5cdFx0fSxcblx0XHRnZXRNZXRhOiBhc3luYyAoa2V5KSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRyZXR1cm4gYXdhaXQgZ2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSk7XG5cdFx0fSxcblx0XHRnZXRNZXRhczogYXN5bmMgKGFyZ3MpID0+IHtcblx0XHRcdGNvbnN0IGtleXMgPSBhcmdzLm1hcCgoYXJnKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGtleSA9IHR5cGVvZiBhcmcgPT09IFwic3RyaW5nXCIgPyBhcmcgOiBhcmcua2V5O1xuXHRcdFx0XHRjb25zdCB7IGRyaXZlckFyZWEsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdGtleSxcblx0XHRcdFx0XHRkcml2ZXJBcmVhLFxuXHRcdFx0XHRcdGRyaXZlcktleSxcblx0XHRcdFx0XHRkcml2ZXJNZXRhS2V5OiBnZXRNZXRhS2V5KGRyaXZlcktleSlcblx0XHRcdFx0fTtcblx0XHRcdH0pO1xuXHRcdFx0Y29uc3QgYXJlYVRvRHJpdmVyTWV0YUtleXNNYXAgPSBrZXlzLnJlZHVjZSgobWFwLCBrZXkpID0+IHtcblx0XHRcdFx0bWFwW2tleS5kcml2ZXJBcmVhXSA/Pz0gW107XG5cdFx0XHRcdG1hcFtrZXkuZHJpdmVyQXJlYV0ucHVzaChrZXkpO1xuXHRcdFx0XHRyZXR1cm4gbWFwO1xuXHRcdFx0fSwge30pO1xuXHRcdFx0Y29uc3QgcmVzdWx0c01hcCA9IHt9O1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LmVudHJpZXMoYXJlYVRvRHJpdmVyTWV0YUtleXNNYXApLm1hcChhc3luYyAoW2FyZWEsIGtleXNdKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGFyZWFSZXMgPSBhd2FpdCBicm93c2VyLnN0b3JhZ2VbYXJlYV0uZ2V0KGtleXMubWFwKChrZXkpID0+IGtleS5kcml2ZXJNZXRhS2V5KSk7XG5cdFx0XHRcdGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRcdFx0cmVzdWx0c01hcFtrZXkua2V5XSA9IGFyZWFSZXNba2V5LmRyaXZlck1ldGFLZXldID8/IHt9O1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pKTtcblx0XHRcdHJldHVybiBrZXlzLm1hcCgoa2V5KSA9PiAoe1xuXHRcdFx0XHRrZXk6IGtleS5rZXksXG5cdFx0XHRcdG1ldGE6IHJlc3VsdHNNYXBba2V5LmtleV1cblx0XHRcdH0pKTtcblx0XHR9LFxuXHRcdHNldEl0ZW06IGFzeW5jIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRhd2FpdCBzZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCB2YWx1ZSk7XG5cdFx0fSxcblx0XHRzZXRJdGVtczogYXN5bmMgKGl0ZW1zKSA9PiB7XG5cdFx0XHRjb25zdCBhcmVhVG9LZXlWYWx1ZU1hcCA9IHt9O1xuXHRcdFx0aXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuXHRcdFx0XHRjb25zdCB7IGRyaXZlckFyZWEsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShcImtleVwiIGluIGl0ZW0gPyBpdGVtLmtleSA6IGl0ZW0uaXRlbS5rZXkpO1xuXHRcdFx0XHRhcmVhVG9LZXlWYWx1ZU1hcFtkcml2ZXJBcmVhXSA/Pz0gW107XG5cdFx0XHRcdGFyZWFUb0tleVZhbHVlTWFwW2RyaXZlckFyZWFdLnB1c2goe1xuXHRcdFx0XHRcdGtleTogZHJpdmVyS2V5LFxuXHRcdFx0XHRcdHZhbHVlOiBpdGVtLnZhbHVlXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChPYmplY3QuZW50cmllcyhhcmVhVG9LZXlWYWx1ZU1hcCkubWFwKGFzeW5jIChbZHJpdmVyQXJlYSwgdmFsdWVzXSkgPT4ge1xuXHRcdFx0XHRhd2FpdCBnZXREcml2ZXIoZHJpdmVyQXJlYSkuc2V0SXRlbXModmFsdWVzKTtcblx0XHRcdH0pKTtcblx0XHR9LFxuXHRcdHNldE1ldGE6IGFzeW5jIChrZXksIHByb3BlcnRpZXMpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdGF3YWl0IHNldE1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpO1xuXHRcdH0sXG5cdFx0c2V0TWV0YXM6IGFzeW5jIChpdGVtcykgPT4ge1xuXHRcdFx0Y29uc3QgYXJlYVRvTWV0YVVwZGF0ZXNNYXAgPSB7fTtcblx0XHRcdGl0ZW1zLmZvckVhY2goKGl0ZW0pID0+IHtcblx0XHRcdFx0Y29uc3QgeyBkcml2ZXJBcmVhLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoXCJrZXlcIiBpbiBpdGVtID8gaXRlbS5rZXkgOiBpdGVtLml0ZW0ua2V5KTtcblx0XHRcdFx0YXJlYVRvTWV0YVVwZGF0ZXNNYXBbZHJpdmVyQXJlYV0gPz89IFtdO1xuXHRcdFx0XHRhcmVhVG9NZXRhVXBkYXRlc01hcFtkcml2ZXJBcmVhXS5wdXNoKHtcblx0XHRcdFx0XHRrZXk6IGRyaXZlcktleSxcblx0XHRcdFx0XHRwcm9wZXJ0aWVzOiBpdGVtLm1ldGFcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5lbnRyaWVzKGFyZWFUb01ldGFVcGRhdGVzTWFwKS5tYXAoYXN5bmMgKFtzdG9yYWdlQXJlYSwgdXBkYXRlc10pID0+IHtcblx0XHRcdFx0Y29uc3QgZHJpdmVyID0gZ2V0RHJpdmVyKHN0b3JhZ2VBcmVhKTtcblx0XHRcdFx0Y29uc3QgbWV0YUtleXMgPSB1cGRhdGVzLm1hcCgoeyBrZXkgfSkgPT4gZ2V0TWV0YUtleShrZXkpKTtcblx0XHRcdFx0Y29uc3QgZXhpc3RpbmdNZXRhcyA9IGF3YWl0IGRyaXZlci5nZXRJdGVtcyhtZXRhS2V5cyk7XG5cdFx0XHRcdGNvbnN0IGV4aXN0aW5nTWV0YU1hcCA9IE9iamVjdC5mcm9tRW50cmllcyhleGlzdGluZ01ldGFzLm1hcCgoeyBrZXksIHZhbHVlIH0pID0+IFtrZXksIGdldE1ldGFWYWx1ZSh2YWx1ZSldKSk7XG5cdFx0XHRcdGNvbnN0IG1ldGFVcGRhdGVzID0gdXBkYXRlcy5tYXAoKHsga2V5LCBwcm9wZXJ0aWVzIH0pID0+IHtcblx0XHRcdFx0XHRjb25zdCBtZXRhS2V5ID0gZ2V0TWV0YUtleShrZXkpO1xuXHRcdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0XHRrZXk6IG1ldGFLZXksXG5cdFx0XHRcdFx0XHR2YWx1ZTogbWVyZ2VNZXRhKGV4aXN0aW5nTWV0YU1hcFttZXRhS2V5XSA/PyB7fSwgcHJvcGVydGllcylcblx0XHRcdFx0XHR9O1xuXHRcdFx0XHR9KTtcblx0XHRcdFx0YXdhaXQgZHJpdmVyLnNldEl0ZW1zKG1ldGFVcGRhdGVzKTtcblx0XHRcdH0pKTtcblx0XHR9LFxuXHRcdHJlbW92ZUl0ZW06IGFzeW5jIChrZXksIG9wdHMpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdGF3YWl0IHJlbW92ZUl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIG9wdHMpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlSXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG5cdFx0XHRjb25zdCBhcmVhVG9LZXlzTWFwID0ge307XG5cdFx0XHRrZXlzLmZvckVhY2goKGtleSkgPT4ge1xuXHRcdFx0XHRsZXQga2V5U3RyO1xuXHRcdFx0XHRsZXQgb3B0cztcblx0XHRcdFx0aWYgKHR5cGVvZiBrZXkgPT09IFwic3RyaW5nXCIpIGtleVN0ciA9IGtleTtcblx0XHRcdFx0ZWxzZSBpZiAoXCJnZXRWYWx1ZVwiIGluIGtleSkga2V5U3RyID0ga2V5LmtleTtcblx0XHRcdFx0ZWxzZSBpZiAoXCJpdGVtXCIgaW4ga2V5KSB7XG5cdFx0XHRcdFx0a2V5U3RyID0ga2V5Lml0ZW0ua2V5O1xuXHRcdFx0XHRcdG9wdHMgPSBrZXkub3B0aW9ucztcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRrZXlTdHIgPSBrZXkua2V5O1xuXHRcdFx0XHRcdG9wdHMgPSBrZXkub3B0aW9ucztcblx0XHRcdFx0fVxuXHRcdFx0XHRjb25zdCB7IGRyaXZlckFyZWEsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXlTdHIpO1xuXHRcdFx0XHRhcmVhVG9LZXlzTWFwW2RyaXZlckFyZWFdID8/PSBbXTtcblx0XHRcdFx0YXJlYVRvS2V5c01hcFtkcml2ZXJBcmVhXS5wdXNoKGRyaXZlcktleSk7XG5cdFx0XHRcdGlmIChvcHRzPy5yZW1vdmVNZXRhKSBhcmVhVG9LZXlzTWFwW2RyaXZlckFyZWFdLnB1c2goZ2V0TWV0YUtleShkcml2ZXJLZXkpKTtcblx0XHRcdH0pO1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LmVudHJpZXMoYXJlYVRvS2V5c01hcCkubWFwKGFzeW5jIChbZHJpdmVyQXJlYSwga2V5c10pID0+IHtcblx0XHRcdFx0YXdhaXQgZ2V0RHJpdmVyKGRyaXZlckFyZWEpLnJlbW92ZUl0ZW1zKGtleXMpO1xuXHRcdFx0fSkpO1xuXHRcdH0sXG5cdFx0Y2xlYXI6IGFzeW5jIChiYXNlKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXREcml2ZXIoYmFzZSkuY2xlYXIoKTtcblx0XHR9LFxuXHRcdHJlbW92ZU1ldGE6IGFzeW5jIChrZXksIHByb3BlcnRpZXMpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdGF3YWl0IHJlbW92ZU1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpO1xuXHRcdH0sXG5cdFx0c25hcHNob3Q6IGFzeW5jIChiYXNlLCBvcHRzKSA9PiB7XG5cdFx0XHRjb25zdCBkYXRhID0gYXdhaXQgZ2V0RHJpdmVyKGJhc2UpLnNuYXBzaG90KCk7XG5cdFx0XHRvcHRzPy5leGNsdWRlS2V5cz8uZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV07XG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2dldE1ldGFLZXkoa2V5KV07XG5cdFx0XHR9KTtcblx0XHRcdHJldHVybiBkYXRhO1xuXHRcdH0sXG5cdFx0cmVzdG9yZVNuYXBzaG90OiBhc3luYyAoYmFzZSwgZGF0YSkgPT4ge1xuXHRcdFx0YXdhaXQgZ2V0RHJpdmVyKGJhc2UpLnJlc3RvcmVTbmFwc2hvdChkYXRhKTtcblx0XHR9LFxuXHRcdHdhdGNoOiAoa2V5LCBjYikgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0cmV0dXJuIHdhdGNoKGRyaXZlciwgZHJpdmVyS2V5LCBjYik7XG5cdFx0fSxcblx0XHR1bndhdGNoKCkge1xuXHRcdFx0T2JqZWN0LnZhbHVlcyhkcml2ZXJzKS5mb3JFYWNoKChkcml2ZXIpID0+IHtcblx0XHRcdFx0ZHJpdmVyLnVud2F0Y2goKTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0ZGVmaW5lSXRlbTogKGtleSwgb3B0cykgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0Y29uc3QgeyB2ZXJzaW9uOiB0YXJnZXRWZXJzaW9uID0gMSwgbWlncmF0aW9ucyA9IHt9LCBvbk1pZ3JhdGlvbkNvbXBsZXRlLCBkZWJ1ZyA9IGZhbHNlIH0gPSBvcHRzID8/IHt9O1xuXHRcdFx0aWYgKHRhcmdldFZlcnNpb24gPCAxKSB0aHJvdyBFcnJvcihcIlN0b3JhZ2UgaXRlbSB2ZXJzaW9uIGNhbm5vdCBiZSBsZXNzIHRoYW4gMS4gSW5pdGlhbCB2ZXJzaW9ucyBzaG91bGQgYmUgc2V0IHRvIDEsIG5vdCAwLlwiKTtcblx0XHRcdGxldCBuZWVkc1ZlcnNpb25TZXQgPSBmYWxzZTtcblx0XHRcdGNvbnN0IG1pZ3JhdGUgPSBhc3luYyAoKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGRyaXZlck1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG5cdFx0XHRcdGNvbnN0IFt7IHZhbHVlIH0sIHsgdmFsdWU6IG1ldGEgfV0gPSBhd2FpdCBkcml2ZXIuZ2V0SXRlbXMoW2RyaXZlcktleSwgZHJpdmVyTWV0YUtleV0pO1xuXHRcdFx0XHRuZWVkc1ZlcnNpb25TZXQgPSB2YWx1ZSA9PSBudWxsICYmIG1ldGE/LnYgPT0gbnVsbCAmJiAhIXRhcmdldFZlcnNpb247XG5cdFx0XHRcdGlmICh2YWx1ZSA9PSBudWxsKSByZXR1cm47XG5cdFx0XHRcdGNvbnN0IGN1cnJlbnRWZXJzaW9uID0gbWV0YT8udiA/PyAxO1xuXHRcdFx0XHRpZiAoY3VycmVudFZlcnNpb24gPiB0YXJnZXRWZXJzaW9uKSB0aHJvdyBFcnJvcihgVmVyc2lvbiBkb3duZ3JhZGUgZGV0ZWN0ZWQgKHYke2N1cnJlbnRWZXJzaW9ufSAtPiB2JHt0YXJnZXRWZXJzaW9ufSkgZm9yIFwiJHtrZXl9XCJgKTtcblx0XHRcdFx0aWYgKGN1cnJlbnRWZXJzaW9uID09PSB0YXJnZXRWZXJzaW9uKSByZXR1cm47XG5cdFx0XHRcdGlmIChkZWJ1ZykgY29uc29sZS5kZWJ1ZyhgW0B3eHQtZGV2L3N0b3JhZ2VdIFJ1bm5pbmcgc3RvcmFnZSBtaWdyYXRpb24gZm9yICR7a2V5fTogdiR7Y3VycmVudFZlcnNpb259IC0+IHYke3RhcmdldFZlcnNpb259YCk7XG5cdFx0XHRcdGNvbnN0IG1pZ3JhdGlvbnNUb1J1biA9IEFycmF5LmZyb20oeyBsZW5ndGg6IHRhcmdldFZlcnNpb24gLSBjdXJyZW50VmVyc2lvbiB9LCAoXywgaSkgPT4gY3VycmVudFZlcnNpb24gKyBpICsgMSk7XG5cdFx0XHRcdGxldCBtaWdyYXRlZFZhbHVlID0gdmFsdWU7XG5cdFx0XHRcdGZvciAoY29uc3QgbWlncmF0ZVRvVmVyc2lvbiBvZiBtaWdyYXRpb25zVG9SdW4pIHRyeSB7XG5cdFx0XHRcdFx0bWlncmF0ZWRWYWx1ZSA9IGF3YWl0IG1pZ3JhdGlvbnM/LlttaWdyYXRlVG9WZXJzaW9uXT8uKG1pZ3JhdGVkVmFsdWUpID8/IG1pZ3JhdGVkVmFsdWU7XG5cdFx0XHRcdFx0aWYgKGRlYnVnKSBjb25zb2xlLmRlYnVnKGBbQHd4dC1kZXYvc3RvcmFnZV0gU3RvcmFnZSBtaWdyYXRpb24gcHJvY2Vzc2VkIGZvciB2ZXJzaW9uOiB2JHttaWdyYXRlVG9WZXJzaW9ufWApO1xuXHRcdFx0XHR9IGNhdGNoIChlcnIpIHtcblx0XHRcdFx0XHR0aHJvdyBuZXcgTWlncmF0aW9uRXJyb3Ioa2V5LCBtaWdyYXRlVG9WZXJzaW9uLCB7IGNhdXNlOiBlcnIgfSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0YXdhaXQgZHJpdmVyLnNldEl0ZW1zKFt7XG5cdFx0XHRcdFx0a2V5OiBkcml2ZXJLZXksXG5cdFx0XHRcdFx0dmFsdWU6IG1pZ3JhdGVkVmFsdWVcblx0XHRcdFx0fSwge1xuXHRcdFx0XHRcdGtleTogZHJpdmVyTWV0YUtleSxcblx0XHRcdFx0XHR2YWx1ZToge1xuXHRcdFx0XHRcdFx0Li4ubWV0YSxcblx0XHRcdFx0XHRcdHY6IHRhcmdldFZlcnNpb25cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1dKTtcblx0XHRcdFx0aWYgKGRlYnVnKSBjb25zb2xlLmRlYnVnKGBbQHd4dC1kZXYvc3RvcmFnZV0gU3RvcmFnZSBtaWdyYXRpb24gY29tcGxldGVkIGZvciAke2tleX0gdiR7dGFyZ2V0VmVyc2lvbn1gLCB7IG1pZ3JhdGVkVmFsdWUgfSk7XG5cdFx0XHRcdG9uTWlncmF0aW9uQ29tcGxldGU/LihtaWdyYXRlZFZhbHVlLCB0YXJnZXRWZXJzaW9uKTtcblx0XHRcdH07XG5cdFx0XHRjb25zdCBtaWdyYXRpb25zRG9uZSA9IG9wdHM/Lm1pZ3JhdGlvbnMgPT0gbnVsbCA/IFByb21pc2UucmVzb2x2ZSgpIDogbWlncmF0ZSgpLmNhdGNoKChlcnIpID0+IHtcblx0XHRcdFx0Y29uc29sZS5lcnJvcihgW0B3eHQtZGV2L3N0b3JhZ2VdIE1pZ3JhdGlvbiBmYWlsZWQgZm9yICR7a2V5fWAsIGVycik7XG5cdFx0XHR9KTtcblx0XHRcdGNvbnN0IGluaXRMb2NrID0gd2l0aExvY2soKTtcblx0XHRcdGNvbnN0IGdldEZhbGxiYWNrID0gKCkgPT4gb3B0cz8uZmFsbGJhY2sgPz8gb3B0cz8uZGVmYXVsdFZhbHVlID8/IG51bGw7XG5cdFx0XHRjb25zdCBnZXRPckluaXRWYWx1ZSA9ICgpID0+IGluaXRMb2NrKGFzeW5jICgpID0+IHtcblx0XHRcdFx0Y29uc3QgdmFsdWUgPSBhd2FpdCBkcml2ZXIuZ2V0SXRlbShkcml2ZXJLZXkpO1xuXHRcdFx0XHRpZiAodmFsdWUgIT0gbnVsbCB8fCBvcHRzPy5pbml0ID09IG51bGwpIHJldHVybiB2YWx1ZTtcblx0XHRcdFx0Y29uc3QgbmV3VmFsdWUgPSBhd2FpdCBvcHRzLmluaXQoKTtcblx0XHRcdFx0YXdhaXQgZHJpdmVyLnNldEl0ZW0oZHJpdmVyS2V5LCBuZXdWYWx1ZSk7XG5cdFx0XHRcdGlmICh2YWx1ZSA9PSBudWxsICYmIHRhcmdldFZlcnNpb24gPiAxKSBhd2FpdCBzZXRNZXRhKGRyaXZlciwgZHJpdmVyS2V5LCB7IHY6IHRhcmdldFZlcnNpb24gfSk7XG5cdFx0XHRcdHJldHVybiBuZXdWYWx1ZTtcblx0XHRcdH0pO1xuXHRcdFx0bWlncmF0aW9uc0RvbmUudGhlbihnZXRPckluaXRWYWx1ZSk7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRrZXksXG5cdFx0XHRcdGdldCBkZWZhdWx0VmFsdWUoKSB7XG5cdFx0XHRcdFx0cmV0dXJuIGdldEZhbGxiYWNrKCk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGdldCBmYWxsYmFjaygpIHtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0RmFsbGJhY2soKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Z2V0VmFsdWU6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRpZiAob3B0cz8uaW5pdCkgcmV0dXJuIGF3YWl0IGdldE9ySW5pdFZhbHVlKCk7XG5cdFx0XHRcdFx0ZWxzZSByZXR1cm4gYXdhaXQgZ2V0SXRlbShkcml2ZXIsIGRyaXZlcktleSwgb3B0cyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGdldE1ldGE6IGFzeW5jICgpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgZ2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNldFZhbHVlOiBhc3luYyAodmFsdWUpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRpZiAobmVlZHNWZXJzaW9uU2V0KSB7XG5cdFx0XHRcdFx0XHRuZWVkc1ZlcnNpb25TZXQgPSBmYWxzZTtcblx0XHRcdFx0XHRcdGF3YWl0IFByb21pc2UuYWxsKFtzZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCB2YWx1ZSksIHNldE1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHsgdjogdGFyZ2V0VmVyc2lvbiB9KV0pO1xuXHRcdFx0XHRcdH0gZWxzZSBhd2FpdCBzZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCB2YWx1ZSk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHNldE1ldGE6IGFzeW5jIChwcm9wZXJ0aWVzKSA9PiB7XG5cdFx0XHRcdFx0YXdhaXQgbWlncmF0aW9uc0RvbmU7XG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IHNldE1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRyZW1vdmVWYWx1ZTogYXN5bmMgKG9wdHMpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgcmVtb3ZlSXRlbShkcml2ZXIsIGRyaXZlcktleSwgb3B0cyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHJlbW92ZU1ldGE6IGFzeW5jIChwcm9wZXJ0aWVzKSA9PiB7XG5cdFx0XHRcdFx0YXdhaXQgbWlncmF0aW9uc0RvbmU7XG5cdFx0XHRcdFx0cmV0dXJuIGF3YWl0IHJlbW92ZU1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHByb3BlcnRpZXMpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHR3YXRjaDogKGNiKSA9PiB3YXRjaChkcml2ZXIsIGRyaXZlcktleSwgKG5ld1ZhbHVlLCBvbGRWYWx1ZSkgPT4gY2IobmV3VmFsdWUgPz8gZ2V0RmFsbGJhY2soKSwgb2xkVmFsdWUgPz8gZ2V0RmFsbGJhY2soKSkpLFxuXHRcdFx0XHRtaWdyYXRlXG5cdFx0XHR9O1xuXHRcdH1cblx0fTtcbn1cbmZ1bmN0aW9uIGNyZWF0ZURyaXZlcihzdG9yYWdlQXJlYSkge1xuXHRjb25zdCBnZXRTdG9yYWdlQXJlYSA9ICgpID0+IHtcblx0XHRpZiAoYnJvd3Nlci5ydW50aW1lID09IG51bGwpIHRocm93IEVycm9yKGAnd3h0L3N0b3JhZ2UnIG11c3QgYmUgbG9hZGVkIGluIGEgd2ViIGV4dGVuc2lvbiBlbnZpcm9ubWVudFxuXG4gLSBJZiB0aHJvd24gZHVyaW5nIGEgYnVpbGQsIHNlZSBodHRwczovL2dpdGh1Yi5jb20vd3h0LWRldi93eHQvaXNzdWVzLzM3MVxuIC0gSWYgdGhyb3duIGR1cmluZyB0ZXN0cywgbW9jayAnd3h0L2Jyb3dzZXInIGNvcnJlY3RseS4gU2VlIGh0dHBzOi8vd3h0LmRldi9ndWlkZS9nby1mdXJ0aGVyL3Rlc3RpbmcuaHRtbFxuYCk7XG5cdFx0aWYgKGJyb3dzZXIuc3RvcmFnZSA9PSBudWxsKSB0aHJvdyBFcnJvcihcIllvdSBtdXN0IGFkZCB0aGUgJ3N0b3JhZ2UnIHBlcm1pc3Npb24gdG8geW91ciBtYW5pZmVzdCB0byB1c2UgJ3d4dC9zdG9yYWdlJ1wiKTtcblx0XHRjb25zdCBhcmVhID0gYnJvd3Nlci5zdG9yYWdlW3N0b3JhZ2VBcmVhXTtcblx0XHRpZiAoYXJlYSA9PSBudWxsKSB0aHJvdyBFcnJvcihgXCJicm93c2VyLnN0b3JhZ2UuJHtzdG9yYWdlQXJlYX1cIiBpcyB1bmRlZmluZWRgKTtcblx0XHRyZXR1cm4gYXJlYTtcblx0fTtcblx0Y29uc3Qgd2F0Y2hMaXN0ZW5lcnMgPSAvKiBAX19QVVJFX18gKi8gbmV3IFNldCgpO1xuXHRyZXR1cm4ge1xuXHRcdGdldEl0ZW06IGFzeW5jIChrZXkpID0+IHtcblx0XHRcdHJldHVybiAoYXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5nZXQoa2V5KSlba2V5XTtcblx0XHR9LFxuXHRcdGdldEl0ZW1zOiBhc3luYyAoa2V5cykgPT4ge1xuXHRcdFx0Y29uc3QgcmVzdWx0ID0gYXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5nZXQoa2V5cyk7XG5cdFx0XHRyZXR1cm4ga2V5cy5tYXAoKGtleSkgPT4gKHtcblx0XHRcdFx0a2V5LFxuXHRcdFx0XHR2YWx1ZTogcmVzdWx0W2tleV0gPz8gbnVsbFxuXHRcdFx0fSkpO1xuXHRcdH0sXG5cdFx0c2V0SXRlbTogYXN5bmMgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdGlmICh2YWx1ZSA9PSBudWxsKSBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnJlbW92ZShrZXkpO1xuXHRcdFx0ZWxzZSBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnNldCh7IFtrZXldOiB2YWx1ZSB9KTtcblx0XHR9LFxuXHRcdHNldEl0ZW1zOiBhc3luYyAodmFsdWVzKSA9PiB7XG5cdFx0XHRjb25zdCBtYXAgPSB2YWx1ZXMucmVkdWNlKChtYXAsIHsga2V5LCB2YWx1ZSB9KSA9PiB7XG5cdFx0XHRcdG1hcFtrZXldID0gdmFsdWU7XG5cdFx0XHRcdHJldHVybiBtYXA7XG5cdFx0XHR9LCB7fSk7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnNldChtYXApO1xuXHRcdH0sXG5cdFx0cmVtb3ZlSXRlbTogYXN5bmMgKGtleSkgPT4ge1xuXHRcdFx0YXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5yZW1vdmUoa2V5KTtcblx0XHR9LFxuXHRcdHJlbW92ZUl0ZW1zOiBhc3luYyAoa2V5cykgPT4ge1xuXHRcdFx0YXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5yZW1vdmUoa2V5cyk7XG5cdFx0fSxcblx0XHRjbGVhcjogYXN5bmMgKCkgPT4ge1xuXHRcdFx0YXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5jbGVhcigpO1xuXHRcdH0sXG5cdFx0c25hcHNob3Q6IGFzeW5jICgpID0+IHtcblx0XHRcdHJldHVybiBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldCgpO1xuXHRcdH0sXG5cdFx0cmVzdG9yZVNuYXBzaG90OiBhc3luYyAoZGF0YSkgPT4ge1xuXHRcdFx0YXdhaXQgZ2V0U3RvcmFnZUFyZWEoKS5zZXQoZGF0YSk7XG5cdFx0fSxcblx0XHR3YXRjaChrZXksIGNiKSB7XG5cdFx0XHRjb25zdCBsaXN0ZW5lciA9IChjaGFuZ2VzKSA9PiB7XG5cdFx0XHRcdGNvbnN0IGNoYW5nZSA9IGNoYW5nZXNba2V5XTtcblx0XHRcdFx0aWYgKGNoYW5nZSA9PSBudWxsIHx8IGRlcXVhbChjaGFuZ2UubmV3VmFsdWUsIGNoYW5nZS5vbGRWYWx1ZSkpIHJldHVybjtcblx0XHRcdFx0Y2IoY2hhbmdlLm5ld1ZhbHVlID8/IG51bGwsIGNoYW5nZS5vbGRWYWx1ZSA/PyBudWxsKTtcblx0XHRcdH07XG5cdFx0XHRnZXRTdG9yYWdlQXJlYSgpLm9uQ2hhbmdlZC5hZGRMaXN0ZW5lcihsaXN0ZW5lcik7XG5cdFx0XHR3YXRjaExpc3RlbmVycy5hZGQobGlzdGVuZXIpO1xuXHRcdFx0cmV0dXJuICgpID0+IHtcblx0XHRcdFx0Z2V0U3RvcmFnZUFyZWEoKS5vbkNoYW5nZWQucmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpO1xuXHRcdFx0XHR3YXRjaExpc3RlbmVycy5kZWxldGUobGlzdGVuZXIpO1xuXHRcdFx0fTtcblx0XHR9LFxuXHRcdHVud2F0Y2goKSB7XG5cdFx0XHR3YXRjaExpc3RlbmVycy5mb3JFYWNoKChsaXN0ZW5lcikgPT4ge1xuXHRcdFx0XHRnZXRTdG9yYWdlQXJlYSgpLm9uQ2hhbmdlZC5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG5cdFx0XHR9KTtcblx0XHRcdHdhdGNoTGlzdGVuZXJzLmNsZWFyKCk7XG5cdFx0fVxuXHR9O1xufVxudmFyIE1pZ3JhdGlvbkVycm9yID0gY2xhc3MgZXh0ZW5kcyBFcnJvciB7XG5cdGNvbnN0cnVjdG9yKGtleSwgdmVyc2lvbiwgb3B0aW9ucykge1xuXHRcdHN1cGVyKGB2JHt2ZXJzaW9ufSBtaWdyYXRpb24gZmFpbGVkIGZvciBcIiR7a2V5fVwiYCwgb3B0aW9ucyk7XG5cdFx0dGhpcy5rZXkgPSBrZXk7XG5cdFx0dGhpcy52ZXJzaW9uID0gdmVyc2lvbjtcblx0fVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgTWlncmF0aW9uRXJyb3IsIHN0b3JhZ2UgfTtcbiIsImV4cG9ydCBpbnRlcmZhY2UgU2V0dGluZ3Mge1xuICBhY3RpdmVQcm92aWRlcklkOiBzdHJpbmc7XG4gIC8qKiBMYW5ndWFnZSBjb2RlcyBzaG93biBpbiB0aGUgaW4tcGFnZSBtZW51LCBpbiBvcmRlci4gKi9cbiAgZmF2b3JpdGVMYW5ndWFnZXM6IHN0cmluZ1tdO1xuICAvKiogUHJvdmlkZXItc3BlY2lmaWMgY29uZmlnIChBUEkga2V5cywgbW9kZWxzLCAuLi4pIGtleWVkIGJ5IHByb3ZpZGVyIGlkLiAqL1xuICBwcm92aWRlckNvbmZpZ3M6IFJlY29yZDxzdHJpbmcsIHVua25vd24+O1xufVxuXG5leHBvcnQgY29uc3QgREVGQVVMVF9TRVRUSU5HUzogU2V0dGluZ3MgPSB7XG4gIGFjdGl2ZVByb3ZpZGVySWQ6ICdhcGknLFxuICBmYXZvcml0ZUxhbmd1YWdlczogWydlbicsICd1aycsICdkZScsICdlcycsICdmciddLFxuICBwcm92aWRlckNvbmZpZ3M6IHt9LFxufTtcblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc1JlYWRlciB7XG4gIGdldCgpOiBQcm9taXNlPFNldHRpbmdzPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBTZXR0aW5nc1JlcG9zaXRvcnkgZXh0ZW5kcyBTZXR0aW5nc1JlYWRlciB7XG4gIHVwZGF0ZShwYXRjaDogUGFydGlhbDxTZXR0aW5ncz4pOiBQcm9taXNlPFNldHRpbmdzPjtcbn1cbiIsImltcG9ydCB7IHN0b3JhZ2UgfSBmcm9tICd3eHQvdXRpbHMvc3RvcmFnZSc7XG5pbXBvcnQgeyBERUZBVUxUX1NFVFRJTkdTLCB0eXBlIFNldHRpbmdzLCB0eXBlIFNldHRpbmdzUmVwb3NpdG9yeSB9IGZyb20gJy4vc2V0dGluZ3MnO1xuXG5jb25zdCBzZXR0aW5nc0l0ZW0gPSBzdG9yYWdlLmRlZmluZUl0ZW08U2V0dGluZ3M+KCdsb2NhbDpzZXR0aW5ncycsIHtcbiAgZmFsbGJhY2s6IERFRkFVTFRfU0VUVElOR1MsXG59KTtcblxuZXhwb3J0IGNvbnN0IHN0b3JhZ2VTZXR0aW5nczogU2V0dGluZ3NSZXBvc2l0b3J5ID0ge1xuICBhc3luYyBnZXQoKSB7XG4gICAgLy8gTWVyZ2Ugc28gc2V0dGluZ3Mgc2F2ZWQgYnkgb2xkZXIgdmVyc2lvbnMgcGljayB1cCBuZXdseSBhZGRlZCBmaWVsZHMuXG4gICAgcmV0dXJuIHsgLi4uREVGQVVMVF9TRVRUSU5HUywgLi4uKGF3YWl0IHNldHRpbmdzSXRlbS5nZXRWYWx1ZSgpKSB9O1xuICB9LFxuICBhc3luYyB1cGRhdGUocGF0Y2gpIHtcbiAgICBjb25zdCBuZXh0ID0geyAuLi4oYXdhaXQgdGhpcy5nZXQoKSksIC4uLnBhdGNoIH07XG4gICAgYXdhaXQgc2V0dGluZ3NJdGVtLnNldFZhbHVlKG5leHQpO1xuICAgIHJldHVybiBuZXh0O1xuICB9LFxufTtcbiIsImltcG9ydCB7IGRlZmluZUNvbnRlbnRTY3JpcHQgfSBmcm9tICd3eHQvdXRpbHMvZGVmaW5lLWNvbnRlbnQtc2NyaXB0JztcbmltcG9ydCB7IGZpbmRMYW5ndWFnZSwgdHlwZSBMYW5ndWFnZSB9IGZyb20gJy4uL2NvcmUvbGFuZ3VhZ2VzJztcbmltcG9ydCB7IHJlcGxhY2VTZWxlY3Rpb24gfSBmcm9tICcuLi9jb250ZW50L3JlcGxhY2UnO1xuaW1wb3J0IHtcbiAgZ2V0RWRpdGFibGVTZWxlY3Rpb24sXG4gIGdldFNlbGVjdGlvbkFuY2hvclBvaW50LFxuICBpc1NlbGVjdGlvblVuY2hhbmdlZCxcbiAgdHlwZSBFZGl0YWJsZVNlbGVjdGlvbixcbn0gZnJvbSAnLi4vY29udGVudC9zZWxlY3Rpb24nO1xuaW1wb3J0IHsgVHJhbnNsYXRvcldpZGdldCwgdHlwZSBQb2ludCB9IGZyb20gJy4uL2NvbnRlbnQvdWkvdHJhbnNsYXRvci13aWRnZXQnO1xuaW1wb3J0IHsgc2VuZE1lc3NhZ2UgfSBmcm9tICcuLi9tZXNzYWdpbmcvbWVzc2FnZXMnO1xuaW1wb3J0IHsgc3RvcmFnZVNldHRpbmdzIH0gZnJvbSAnLi4vc2V0dGluZ3Mvc3RvcmFnZS1zZXR0aW5ncyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbnRlbnRTY3JpcHQoe1xuICBtYXRjaGVzOiBbJzxhbGxfdXJscz4nXSxcbiAgYWxsRnJhbWVzOiB0cnVlLFxuICBydW5BdDogJ2RvY3VtZW50X2lkbGUnLFxuXG4gIG1haW4oY3R4KSB7XG4gICAgLyoqIFNlbGVjdGlvbiBjYXB0dXJlZCB3aGVuIHRoZSBpY29uIGFwcGVhcmVkOyB0aGUgbWVudSBhY3RzIG9uIHRoaXMuICovXG4gICAgbGV0IHNuYXBzaG90OiBFZGl0YWJsZVNlbGVjdGlvbiB8IG51bGwgPSBudWxsO1xuICAgIC8qKiBCdW1wZWQgb24gZXZlcnkgY2xvc2UvbmV3IHJlcXVlc3Qgc28gc3RhbGUgcmVzcG9uc2VzIGFyZSBpZ25vcmVkLiAqL1xuICAgIGxldCByZXF1ZXN0SWQgPSAwO1xuXG4gICAgY29uc3Qgd2lkZ2V0ID0gbmV3IFRyYW5zbGF0b3JXaWRnZXQoe1xuICAgICAgb25JY29uQ2xpY2s6ICgpID0+IHZvaWQgc2hvd0xhbmd1YWdlcygpLFxuICAgICAgb25MYW5ndWFnZVBpY2s6IChjb2RlKSA9PiB2b2lkIHRyYW5zbGF0ZShjb2RlKSxcbiAgICAgIG9uT3BlblNldHRpbmdzOiAoKSA9PiB7XG4gICAgICAgIGNsb3NlKCk7XG4gICAgICAgIHZvaWQgc2VuZE1lc3NhZ2UoeyB0eXBlOiAnb3Blbi1vcHRpb25zJyB9KTtcbiAgICAgIH0sXG4gICAgfSk7XG4gICAgY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4gd2lkZ2V0LmRlc3Ryb3koKSk7XG5cbiAgICBmdW5jdGlvbiBjbG9zZSgpOiB2b2lkIHtcbiAgICAgIHJlcXVlc3RJZCsrO1xuICAgICAgc25hcHNob3QgPSBudWxsO1xuICAgICAgd2lkZ2V0LmhpZGUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiByZWZyZXNoKHBvaW50ZXI/OiBQb2ludCk6IHZvaWQge1xuICAgICAgaWYgKHdpZGdldC5pc01lbnVPcGVuKSByZXR1cm47XG4gICAgICBjb25zdCBzZWxlY3Rpb24gPSBnZXRFZGl0YWJsZVNlbGVjdGlvbigpO1xuICAgICAgaWYgKCFzZWxlY3Rpb24pIHtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgc25hcHNob3QgPSBzZWxlY3Rpb247XG4gICAgICB3aWRnZXQuc2hvd0ljb24ocG9pbnRlciA/PyBnZXRTZWxlY3Rpb25BbmNob3JQb2ludChzZWxlY3Rpb24pKTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiBzaG93TGFuZ3VhZ2VzKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgY29uc3QgeyBmYXZvcml0ZUxhbmd1YWdlcyB9ID0gYXdhaXQgc3RvcmFnZVNldHRpbmdzLmdldCgpO1xuICAgICAgd2lkZ2V0LnNob3dMYW5ndWFnZXMoZmF2b3JpdGVMYW5ndWFnZXMubWFwKGZpbmRMYW5ndWFnZSkuZmlsdGVyKChsKTogbCBpcyBMYW5ndWFnZSA9PiBsICE9PSB1bmRlZmluZWQpKTtcbiAgICB9XG5cbiAgICBhc3luYyBmdW5jdGlvbiB0cmFuc2xhdGUodGFyZ2V0TGFuZzogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICBjb25zdCBjdXJyZW50ID0gc25hcHNob3Q7XG4gICAgICBpZiAoIWN1cnJlbnQpIHJldHVybjtcbiAgICAgIGNvbnN0IGlkID0gKytyZXF1ZXN0SWQ7XG4gICAgICB3aWRnZXQuc2hvd0J1c3koZmluZExhbmd1YWdlKHRhcmdldExhbmcpPy5uYW1lID8/IHRhcmdldExhbmcpO1xuXG4gICAgICBjb25zdCByZXNwb25zZSA9IGF3YWl0IHNlbmRNZXNzYWdlKHsgdHlwZTogJ3RyYW5zbGF0ZScsIHRleHQ6IGN1cnJlbnQudGV4dCwgdGFyZ2V0TGFuZyB9KTtcbiAgICAgIGlmIChpZCAhPT0gcmVxdWVzdElkKSByZXR1cm47IC8vIGNsb3NlZCBvciBzdXBlcnNlZGVkIG1lYW53aGlsZVxuXG4gICAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XG4gICAgICAgIHdpZGdldC5zaG93RXJyb3IocmVzcG9uc2UuZXJyb3IubWVzc2FnZSwgKCkgPT4gdm9pZCBzaG93TGFuZ3VhZ2VzKCkpO1xuICAgICAgfSBlbHNlIGlmICghaXNTZWxlY3Rpb25VbmNoYW5nZWQoY3VycmVudCkpIHtcbiAgICAgICAgd2lkZ2V0LnNob3dFcnJvcignVGhlIHRleHQgY2hhbmdlZCB3aGlsZSB0cmFuc2xhdGluZy4gU2VsZWN0IGl0IGFnYWluLicsICgpID0+IHZvaWQgc2hvd0xhbmd1YWdlcygpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlcGxhY2VTZWxlY3Rpb24oY3VycmVudCwgcmVzcG9uc2UuZGF0YS50ZXh0KTtcbiAgICAgICAgY2xvc2UoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjdHguYWRkRXZlbnRMaXN0ZW5lcihkb2N1bWVudCwgJ21vdXNlZG93bicsIChldmVudCkgPT4ge1xuICAgICAgaWYgKCF3aWRnZXQub3ducyhldmVudCkpIGNsb3NlKCk7XG4gICAgfSk7XG4gICAgY3R4LmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdtb3VzZXVwJywgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAod2lkZ2V0Lm93bnMoZXZlbnQpKSByZXR1cm47XG4gICAgICBjb25zdCBwb2ludGVyID0geyB4OiBldmVudC5jbGllbnRYLCB5OiBldmVudC5jbGllbnRZIH07XG4gICAgICAvLyBMZXQgdGhlIGJyb3dzZXIgZmluYWxpemUgdGhlIHNlbGVjdGlvbiBmaXJzdC5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4gcmVmcmVzaChwb2ludGVyKSwgMCk7XG4gICAgfSk7XG4gICAgY3R4LmFkZEV2ZW50TGlzdGVuZXIoZG9jdW1lbnQsICdrZXlkb3duJywgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZXZlbnQua2V5ID09PSAnRXNjYXBlJyAmJiB3aWRnZXQuaXNWaXNpYmxlKSBjbG9zZSgpO1xuICAgIH0pO1xuICAgIGN0eC5hZGRFdmVudExpc3RlbmVyKGRvY3VtZW50LCAna2V5dXAnLCAoZXZlbnQpID0+IHtcbiAgICAgIGlmIChldmVudC5rZXkgIT09ICdFc2NhcGUnKSByZWZyZXNoKCk7XG4gICAgfSk7XG4gICAgY3R4LmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAnc2Nyb2xsJywgKCkgPT4gd2lkZ2V0LmlzVmlzaWJsZSAmJiBjbG9zZSgpLCB7IGNhcHR1cmU6IHRydWUsIHBhc3NpdmU6IHRydWUgfSk7XG4gICAgY3R4LmFkZEV2ZW50TGlzdGVuZXIod2luZG93LCAncmVzaXplJywgKCkgPT4gd2lkZ2V0LmlzVmlzaWJsZSAmJiBjbG9zZSgpKTtcbiAgfSxcbn0pO1xuIiwiLy8jcmVnaW9uIHNyYy91dGlscy9pbnRlcm5hbC9sb2dnZXIudHNcbmZ1bmN0aW9uIHByaW50KG1ldGhvZCwgLi4uYXJncykge1xuXHRpZiAoaW1wb3J0Lm1ldGEuZW52Lk1PREUgPT09IFwicHJvZHVjdGlvblwiKSByZXR1cm47XG5cdGlmICh0eXBlb2YgYXJnc1swXSA9PT0gXCJzdHJpbmdcIikgbWV0aG9kKGBbd3h0XSAke2FyZ3Muc2hpZnQoKX1gLCAuLi5hcmdzKTtcblx0ZWxzZSBtZXRob2QoXCJbd3h0XVwiLCAuLi5hcmdzKTtcbn1cbi8qKiBXcmFwcGVyIGFyb3VuZCBgY29uc29sZWAgd2l0aCBhIFwiW3d4dF1cIiBwcmVmaXggKi9cbmNvbnN0IGxvZ2dlciA9IHtcblx0ZGVidWc6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmRlYnVnLCAuLi5hcmdzKSxcblx0bG9nOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS5sb2csIC4uLmFyZ3MpLFxuXHR3YXJuOiAoLi4uYXJncykgPT4gcHJpbnQoY29uc29sZS53YXJuLCAuLi5hcmdzKSxcblx0ZXJyb3I6ICguLi5hcmdzKSA9PiBwcmludChjb25zb2xlLmVycm9yLCAuLi5hcmdzKVxufTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgbG9nZ2VyIH07XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2ludGVybmFsL2N1c3RvbS1ldmVudHMudHNcbnZhciBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50ID0gY2xhc3MgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCBleHRlbmRzIEV2ZW50IHtcblx0c3RhdGljIEVWRU5UX05BTUUgPSBnZXRVbmlxdWVFdmVudE5hbWUoXCJ3eHQ6bG9jYXRpb25jaGFuZ2VcIik7XG5cdGNvbnN0cnVjdG9yKG5ld1VybCwgb2xkVXJsKSB7XG5cdFx0c3VwZXIoV3h0TG9jYXRpb25DaGFuZ2VFdmVudC5FVkVOVF9OQU1FLCB7fSk7XG5cdFx0dGhpcy5uZXdVcmwgPSBuZXdVcmw7XG5cdFx0dGhpcy5vbGRVcmwgPSBvbGRVcmw7XG5cdH1cbn07XG4vKipcbiogUmV0dXJucyBhbiBldmVudCBuYW1lIHVuaXF1ZSB0byB0aGUgZXh0ZW5zaW9uIGFuZCBjb250ZW50IHNjcmlwdCB0aGF0J3NcbiogcnVubmluZy5cbiovXG5mdW5jdGlvbiBnZXRVbmlxdWVFdmVudE5hbWUoZXZlbnROYW1lKSB7XG5cdHJldHVybiBgJHticm93c2VyPy5ydW50aW1lPy5pZH06JHtpbXBvcnQubWV0YS5lbnYuRU5UUllQT0lOVH06JHtldmVudE5hbWV9YDtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgV3h0TG9jYXRpb25DaGFuZ2VFdmVudCwgZ2V0VW5pcXVlRXZlbnROYW1lIH07XG4iLCJpbXBvcnQgeyBXeHRMb2NhdGlvbkNoYW5nZUV2ZW50IH0gZnJvbSBcIi4vY3VzdG9tLWV2ZW50cy5tanNcIjtcbi8vI3JlZ2lvbiBzcmMvdXRpbHMvaW50ZXJuYWwvbG9jYXRpb24td2F0Y2hlci50c1xuY29uc3Qgc3VwcG9ydHNOYXZpZ2F0aW9uQXBpID0gdHlwZW9mIGdsb2JhbFRoaXMubmF2aWdhdGlvbj8uYWRkRXZlbnRMaXN0ZW5lciA9PT0gXCJmdW5jdGlvblwiO1xuLyoqXG4qIENyZWF0ZSBhIHV0aWwgdGhhdCB3YXRjaGVzIGZvciBVUkwgY2hhbmdlcywgZGlzcGF0Y2hpbmcgdGhlIGN1c3RvbSBldmVudCB3aGVuXG4qIGRldGVjdGVkLiBTdG9wcyB3YXRjaGluZyB3aGVuIGNvbnRlbnQgc2NyaXB0IGlzIGludmFsaWRhdGVkLiBVc2VzIE5hdmlnYXRpb25cbiogQVBJIHdoZW4gYXZhaWxhYmxlLCBvdGhlcndpc2UgZmFsbHMgYmFjayB0byBwb2xsaW5nLlxuKi9cbmZ1bmN0aW9uIGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcihjdHgpIHtcblx0bGV0IGxhc3RVcmw7XG5cdGxldCB3YXRjaGluZyA9IGZhbHNlO1xuXHRyZXR1cm4geyBydW4oKSB7XG5cdFx0aWYgKHdhdGNoaW5nKSByZXR1cm47XG5cdFx0d2F0Y2hpbmcgPSB0cnVlO1xuXHRcdGxhc3RVcmwgPSBuZXcgVVJMKGxvY2F0aW9uLmhyZWYpO1xuXHRcdGlmIChzdXBwb3J0c05hdmlnYXRpb25BcGkpIGdsb2JhbFRoaXMubmF2aWdhdGlvbi5hZGRFdmVudExpc3RlbmVyKFwibmF2aWdhdGVcIiwgKGV2ZW50KSA9PiB7XG5cdFx0XHRjb25zdCBuZXdVcmwgPSBuZXcgVVJMKGV2ZW50LmRlc3RpbmF0aW9uLnVybCk7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgPT09IGxhc3RVcmwuaHJlZikgcmV0dXJuO1xuXHRcdFx0d2luZG93LmRpc3BhdGNoRXZlbnQobmV3IFd4dExvY2F0aW9uQ2hhbmdlRXZlbnQobmV3VXJsLCBsYXN0VXJsKSk7XG5cdFx0XHRsYXN0VXJsID0gbmV3VXJsO1xuXHRcdH0sIHsgc2lnbmFsOiBjdHguc2lnbmFsIH0pO1xuXHRcdGVsc2UgY3R4LnNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGNvbnN0IG5ld1VybCA9IG5ldyBVUkwobG9jYXRpb24uaHJlZik7XG5cdFx0XHRpZiAobmV3VXJsLmhyZWYgIT09IGxhc3RVcmwuaHJlZikge1xuXHRcdFx0XHR3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgV3h0TG9jYXRpb25DaGFuZ2VFdmVudChuZXdVcmwsIGxhc3RVcmwpKTtcblx0XHRcdFx0bGFzdFVybCA9IG5ld1VybDtcblx0XHRcdH1cblx0XHR9LCAxZTMpO1xuXHR9IH07XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9O1xuIiwiaW1wb3J0IHsgbG9nZ2VyIH0gZnJvbSBcIi4vaW50ZXJuYWwvbG9nZ2VyLm1qc1wiO1xuaW1wb3J0IHsgZ2V0VW5pcXVlRXZlbnROYW1lIH0gZnJvbSBcIi4vaW50ZXJuYWwvY3VzdG9tLWV2ZW50cy5tanNcIjtcbmltcG9ydCB7IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlciB9IGZyb20gXCIuL2ludGVybmFsL2xvY2F0aW9uLXdhdGNoZXIubWpzXCI7XG5pbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcInd4dC9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL3V0aWxzL2NvbnRlbnQtc2NyaXB0LWNvbnRleHQudHNcbi8qKlxuKiBJbXBsZW1lbnRzXG4qIFtgQWJvcnRDb250cm9sbGVyYF0oaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9XZWIvQVBJL0Fib3J0Q29udHJvbGxlcikuXG4qIFVzZWQgdG8gZGV0ZWN0IGFuZCBzdG9wIGNvbnRlbnQgc2NyaXB0IGNvZGUgd2hlbiB0aGUgc2NyaXB0IGlzIGludmFsaWRhdGVkLlxuKlxuKiBJdCBhbHNvIHByb3ZpZGVzIHNldmVyYWwgdXRpbGl0aWVzIGxpa2UgYGN0eC5zZXRUaW1lb3V0YCBhbmRcbiogYGN0eC5zZXRJbnRlcnZhbGAgdGhhdCBzaG91bGQgYmUgdXNlZCBpbiBjb250ZW50IHNjcmlwdHMgaW5zdGVhZCBvZlxuKiBgd2luZG93LnNldFRpbWVvdXRgIG9yIGB3aW5kb3cuc2V0SW50ZXJ2YWxgLlxuKlxuKiBUbyBjcmVhdGUgY29udGV4dCBmb3IgdGVzdGluZywgeW91IGNhbiB1c2UgdGhlIGNsYXNzJ3MgY29uc3RydWN0b3I6XG4qXG4qIGBgYHRzXG4qIGltcG9ydCB7IENvbnRlbnRTY3JpcHRDb250ZXh0IH0gZnJvbSAnd3h0L3V0aWxzL2NvbnRlbnQtc2NyaXB0cy1jb250ZXh0JztcbipcbiogdGVzdCgnc3RvcmFnZSBsaXN0ZW5lciBzaG91bGQgYmUgcmVtb3ZlZCB3aGVuIGNvbnRleHQgaXMgaW52YWxpZGF0ZWQnLCAoKSA9PiB7XG4qICAgY29uc3QgY3R4ID0gbmV3IENvbnRlbnRTY3JpcHRDb250ZXh0KCd0ZXN0Jyk7XG4qICAgY29uc3QgaXRlbSA9IHN0b3JhZ2UuZGVmaW5lSXRlbSgnbG9jYWw6Y291bnQnLCB7IGRlZmF1bHRWYWx1ZTogMCB9KTtcbiogICBjb25zdCB3YXRjaGVyID0gdmkuZm4oKTtcbipcbiogICBjb25zdCB1bndhdGNoID0gaXRlbS53YXRjaCh3YXRjaGVyKTtcbiogICBjdHgub25JbnZhbGlkYXRlZCh1bndhdGNoKTsgLy8gTGlzdGVuIGZvciBpbnZhbGlkYXRlIGhlcmVcbipcbiogICBhd2FpdCBpdGVtLnNldFZhbHVlKDEpO1xuKiAgIGV4cGVjdCh3YXRjaGVyKS50b0JlQ2FsbGVkVGltZXMoMSk7XG4qICAgZXhwZWN0KHdhdGNoZXIpLnRvQmVDYWxsZWRXaXRoKDEsIDApO1xuKlxuKiAgIGN0eC5ub3RpZnlJbnZhbGlkYXRlZCgpOyAvLyBVc2UgdGhpcyBmdW5jdGlvbiB0byBpbnZhbGlkYXRlIHRoZSBjb250ZXh0XG4qICAgYXdhaXQgaXRlbS5zZXRWYWx1ZSgyKTtcbiogICBleHBlY3Qod2F0Y2hlcikudG9CZUNhbGxlZFRpbWVzKDEpO1xuKiB9KTtcbiogYGBgXG4qL1xudmFyIENvbnRlbnRTY3JpcHRDb250ZXh0ID0gY2xhc3MgQ29udGVudFNjcmlwdENvbnRleHQge1xuXHRzdGF0aWMgU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFID0gZ2V0VW5pcXVlRXZlbnROYW1lKFwid3h0OmNvbnRlbnQtc2NyaXB0LXN0YXJ0ZWRcIik7XG5cdGlkO1xuXHRhYm9ydENvbnRyb2xsZXI7XG5cdGxvY2F0aW9uV2F0Y2hlciA9IGNyZWF0ZUxvY2F0aW9uV2F0Y2hlcih0aGlzKTtcblx0Y29uc3RydWN0b3IoY29udGVudFNjcmlwdE5hbWUsIG9wdGlvbnMpIHtcblx0XHR0aGlzLmNvbnRlbnRTY3JpcHROYW1lID0gY29udGVudFNjcmlwdE5hbWU7XG5cdFx0dGhpcy5vcHRpb25zID0gb3B0aW9ucztcblx0XHR0aGlzLmlkID0gTWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc2xpY2UoMik7XG5cdFx0dGhpcy5hYm9ydENvbnRyb2xsZXIgPSBuZXcgQWJvcnRDb250cm9sbGVyKCk7XG5cdFx0dGhpcy5zdG9wT2xkU2NyaXB0cygpO1xuXHRcdHRoaXMubGlzdGVuRm9yTmV3ZXJTY3JpcHRzKCk7XG5cdH1cblx0Z2V0IHNpZ25hbCgpIHtcblx0XHRyZXR1cm4gdGhpcy5hYm9ydENvbnRyb2xsZXIuc2lnbmFsO1xuXHR9XG5cdGFib3J0KHJlYXNvbikge1xuXHRcdHJldHVybiB0aGlzLmFib3J0Q29udHJvbGxlci5hYm9ydChyZWFzb24pO1xuXHR9XG5cdGdldCBpc0ludmFsaWQoKSB7XG5cdFx0aWYgKGJyb3dzZXIucnVudGltZT8uaWQgPT0gbnVsbCkgdGhpcy5ub3RpZnlJbnZhbGlkYXRlZCgpO1xuXHRcdHJldHVybiB0aGlzLnNpZ25hbC5hYm9ydGVkO1xuXHR9XG5cdGdldCBpc1ZhbGlkKCkge1xuXHRcdHJldHVybiAhdGhpcy5pc0ludmFsaWQ7XG5cdH1cblx0LyoqXG5cdCogQWRkIGEgbGlzdGVuZXIgdGhhdCBpcyBjYWxsZWQgd2hlbiB0aGUgY29udGVudCBzY3JpcHQncyBjb250ZXh0IGlzXG5cdCogaW52YWxpZGF0ZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcihjYik7XG5cdCogICBjb25zdCByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyID0gY3R4Lm9uSW52YWxpZGF0ZWQoKCkgPT4ge1xuXHQqICAgICBicm93c2VyLnJ1bnRpbWUub25NZXNzYWdlLnJlbW92ZUxpc3RlbmVyKGNiKTtcblx0KiAgIH0pO1xuXHQqICAgLy8gLi4uXG5cdCogICByZW1vdmVJbnZhbGlkYXRlZExpc3RlbmVyKCk7XG5cdCpcblx0KiBAcmV0dXJucyBBIGZ1bmN0aW9uIHRvIHJlbW92ZSB0aGUgbGlzdGVuZXIuXG5cdCovXG5cdG9uSW52YWxpZGF0ZWQoY2IpIHtcblx0XHR0aGlzLnNpZ25hbC5hZGRFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHRcdHJldHVybiAoKSA9PiB0aGlzLnNpZ25hbC5yZW1vdmVFdmVudExpc3RlbmVyKFwiYWJvcnRcIiwgY2IpO1xuXHR9XG5cdC8qKlxuXHQqIFJldHVybiBhIHByb21pc2UgdGhhdCBuZXZlciByZXNvbHZlcy4gVXNlZnVsIGlmIHlvdSBoYXZlIGFuIGFzeW5jIGZ1bmN0aW9uXG5cdCogdGhhdCBzaG91bGRuJ3QgcnVuIGFmdGVyIHRoZSBjb250ZXh0IGlzIGV4cGlyZWQuXG5cdCpcblx0KiBAZXhhbXBsZVxuXHQqICAgY29uc3QgZ2V0VmFsdWVGcm9tU3RvcmFnZSA9IGFzeW5jICgpID0+IHtcblx0KiAgICAgaWYgKGN0eC5pc0ludmFsaWQpIHJldHVybiBjdHguYmxvY2soKTtcblx0KlxuXHQqICAgICAvLyAuLi5cblx0KiAgIH07XG5cdCovXG5cdGJsb2NrKCkge1xuXHRcdHJldHVybiBuZXcgUHJvbWlzZSgoKSA9PiB7fSk7XG5cdH1cblx0LyoqXG5cdCogV3JhcHBlciBhcm91bmQgYHdpbmRvdy5zZXRJbnRlcnZhbGAgdGhhdCBhdXRvbWF0aWNhbGx5IGNsZWFycyB0aGUgaW50ZXJ2YWxcblx0KiB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogSW50ZXJ2YWxzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgY2xlYXJJbnRlcnZhbGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldEludGVydmFsKGhhbmRsZXIsIHRpbWVvdXQpIHtcblx0XHRjb25zdCBpZCA9IHNldEludGVydmFsKCgpID0+IHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIGhhbmRsZXIoKTtcblx0XHR9LCB0aW1lb3V0KTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2xlYXJJbnRlcnZhbChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnNldFRpbWVvdXRgIHRoYXQgYXV0b21hdGljYWxseSBjbGVhcnMgdGhlIGludGVydmFsXG5cdCogd2hlbiBpbnZhbGlkYXRlZC5cblx0KlxuXHQqIFRpbWVvdXRzIGNhbiBiZSBjbGVhcmVkIGJ5IGNhbGxpbmcgdGhlIG5vcm1hbCBgc2V0VGltZW91dGAgZnVuY3Rpb24uXG5cdCovXG5cdHNldFRpbWVvdXQoaGFuZGxlciwgdGltZW91dCkge1xuXHRcdGNvbnN0IGlkID0gc2V0VGltZW91dCgoKSA9PiB7XG5cdFx0XHRpZiAodGhpcy5pc1ZhbGlkKSBoYW5kbGVyKCk7XG5cdFx0fSwgdGltZW91dCk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNsZWFyVGltZW91dChpZCkpO1xuXHRcdHJldHVybiBpZDtcblx0fVxuXHQvKipcblx0KiBXcmFwcGVyIGFyb3VuZCBgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZWAgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHNcblx0KiB0aGUgcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbEFuaW1hdGlvbkZyYW1lYFxuXHQqIGZ1bmN0aW9uLlxuXHQqL1xuXHRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUoY2FsbGJhY2spIHtcblx0XHRjb25zdCBpZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSgoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKHRoaXMuaXNWYWxpZCkgY2FsbGJhY2soLi4uYXJncyk7XG5cdFx0fSk7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGNhbmNlbEFuaW1hdGlvbkZyYW1lKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdC8qKlxuXHQqIFdyYXBwZXIgYXJvdW5kIGB3aW5kb3cucmVxdWVzdElkbGVDYWxsYmFja2AgdGhhdCBhdXRvbWF0aWNhbGx5IGNhbmNlbHMgdGhlXG5cdCogcmVxdWVzdCB3aGVuIGludmFsaWRhdGVkLlxuXHQqXG5cdCogQ2FsbGJhY2tzIGNhbiBiZSBjYW5jZWxlZCBieSBjYWxsaW5nIHRoZSBub3JtYWwgYGNhbmNlbElkbGVDYWxsYmFja2Bcblx0KiBmdW5jdGlvbi5cblx0Ki9cblx0cmVxdWVzdElkbGVDYWxsYmFjayhjYWxsYmFjaywgb3B0aW9ucykge1xuXHRcdGNvbnN0IGlkID0gcmVxdWVzdElkbGVDYWxsYmFjaygoLi4uYXJncykgPT4ge1xuXHRcdFx0aWYgKCF0aGlzLnNpZ25hbC5hYm9ydGVkKSBjYWxsYmFjayguLi5hcmdzKTtcblx0XHR9LCBvcHRpb25zKTtcblx0XHR0aGlzLm9uSW52YWxpZGF0ZWQoKCkgPT4gY2FuY2VsSWRsZUNhbGxiYWNrKGlkKSk7XG5cdFx0cmV0dXJuIGlkO1xuXHR9XG5cdGFkZEV2ZW50TGlzdGVuZXIodGFyZ2V0LCB0eXBlLCBoYW5kbGVyLCBvcHRpb25zKSB7XG5cdFx0aWYgKHR5cGUgPT09IFwid3h0OmxvY2F0aW9uY2hhbmdlXCIpIHtcblx0XHRcdGlmICh0aGlzLmlzVmFsaWQpIHRoaXMubG9jYXRpb25XYXRjaGVyLnJ1bigpO1xuXHRcdH1cblx0XHR0YXJnZXQuYWRkRXZlbnRMaXN0ZW5lcj8uKHR5cGUuc3RhcnRzV2l0aChcInd4dDpcIikgPyBnZXRVbmlxdWVFdmVudE5hbWUodHlwZSkgOiB0eXBlLCBoYW5kbGVyLCB7XG5cdFx0XHQuLi5vcHRpb25zLFxuXHRcdFx0c2lnbmFsOiB0aGlzLnNpZ25hbFxuXHRcdH0pO1xuXHR9XG5cdC8qKlxuXHQqIEBpbnRlcm5hbFxuXHQqIEFib3J0IHRoZSBhYm9ydCBjb250cm9sbGVyIGFuZCBleGVjdXRlIGFsbCBgb25JbnZhbGlkYXRlZGAgbGlzdGVuZXJzLlxuXHQqL1xuXHRub3RpZnlJbnZhbGlkYXRlZCgpIHtcblx0XHR0aGlzLmFib3J0KFwiQ29udGVudCBzY3JpcHQgY29udGV4dCBpbnZhbGlkYXRlZFwiKTtcblx0XHRsb2dnZXIuZGVidWcoYENvbnRlbnQgc2NyaXB0IFwiJHt0aGlzLmNvbnRlbnRTY3JpcHROYW1lfVwiIGNvbnRleHQgaW52YWxpZGF0ZWRgKTtcblx0fVxuXHRzdG9wT2xkU2NyaXB0cygpIHtcblx0XHRkb2N1bWVudC5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudChDb250ZW50U2NyaXB0Q29udGV4dC5TQ1JJUFRfU1RBUlRFRF9NRVNTQUdFX1RZUEUsIHsgZGV0YWlsOiB7XG5cdFx0XHRjb250ZW50U2NyaXB0TmFtZTogdGhpcy5jb250ZW50U2NyaXB0TmFtZSxcblx0XHRcdG1lc3NhZ2VJZDogdGhpcy5pZFxuXHRcdH0gfSkpO1xuXHRcdGlmICghdGhpcy5vcHRpb25zPy5ub1NjcmlwdFN0YXJ0ZWRQb3N0TWVzc2FnZSkgd2luZG93LnBvc3RNZXNzYWdlKHtcblx0XHRcdHR5cGU6IENvbnRlbnRTY3JpcHRDb250ZXh0LlNDUklQVF9TVEFSVEVEX01FU1NBR0VfVFlQRSxcblx0XHRcdGNvbnRlbnRTY3JpcHROYW1lOiB0aGlzLmNvbnRlbnRTY3JpcHROYW1lLFxuXHRcdFx0bWVzc2FnZUlkOiB0aGlzLmlkXG5cdFx0fSwgXCIqXCIpO1xuXHR9XG5cdHZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkge1xuXHRcdGNvbnN0IGlzU2FtZUNvbnRlbnRTY3JpcHQgPSBldmVudC5kZXRhaWw/LmNvbnRlbnRTY3JpcHROYW1lID09PSB0aGlzLmNvbnRlbnRTY3JpcHROYW1lO1xuXHRcdGNvbnN0IGlzRnJvbVNlbGYgPSBldmVudC5kZXRhaWw/Lm1lc3NhZ2VJZCA9PT0gdGhpcy5pZDtcblx0XHRyZXR1cm4gaXNTYW1lQ29udGVudFNjcmlwdCAmJiAhaXNGcm9tU2VsZjtcblx0fVxuXHRsaXN0ZW5Gb3JOZXdlclNjcmlwdHMoKSB7XG5cdFx0Y29uc3QgY2IgPSAoZXZlbnQpID0+IHtcblx0XHRcdGlmICghKGV2ZW50IGluc3RhbmNlb2YgQ3VzdG9tRXZlbnQpIHx8ICF0aGlzLnZlcmlmeVNjcmlwdFN0YXJ0ZWRFdmVudChldmVudCkpIHJldHVybjtcblx0XHRcdHRoaXMubm90aWZ5SW52YWxpZGF0ZWQoKTtcblx0XHR9O1xuXHRcdGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYik7XG5cdFx0dGhpcy5vbkludmFsaWRhdGVkKCgpID0+IGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoQ29udGVudFNjcmlwdENvbnRleHQuU0NSSVBUX1NUQVJURURfTUVTU0FHRV9UWVBFLCBjYikpO1xuXHR9XG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBDb250ZW50U2NyaXB0Q29udGV4dCB9O1xuIl0sInhfZ29vZ2xlX2lnbm9yZUxpc3QiOlswLDYsNyw5LDEwLDExLDE1LDE2LDE3LDE4XSwibWFwcGluZ3MiOiI7Ozs7O0NBQ0EsU0FBUyxvQkFBb0IsWUFBWTtFQUN4QyxPQUFPO0NBQ1I7OztDQ0VBLElBQWEsWUFBaUM7RUFDNUM7R0FBRSxNQUFNO0dBQU0sTUFBTTtFQUFTO0VBQzdCO0dBQUUsTUFBTTtHQUFNLE1BQU07RUFBWTtFQUNoQztHQUFFLE1BQU07R0FBTSxNQUFNO0VBQVU7RUFDOUI7R0FBRSxNQUFNO0dBQU0sTUFBTTtFQUFRO0VBQzVCO0dBQUUsTUFBTTtHQUFNLE1BQU07RUFBUztFQUM3QjtHQUFFLE1BQU07R0FBTSxNQUFNO0VBQVE7RUFDNUI7R0FBRSxNQUFNO0dBQU0sTUFBTTtFQUFVO0VBQzlCO0dBQUUsTUFBTTtHQUFNLE1BQU07RUFBVztFQUMvQjtHQUFFLE1BQU07R0FBTSxNQUFNO0VBQVU7RUFDOUI7R0FBRSxNQUFNO0dBQU0sTUFBTTtFQUFTO0VBQzdCO0dBQUUsTUFBTTtHQUFNLE1BQU07RUFBUztFQUM3QjtHQUFFLE1BQU07R0FBTSxNQUFNO0VBQVE7RUFDNUI7R0FBRSxNQUFNO0dBQU0sTUFBTTtFQUFTO0VBQzdCO0dBQUUsTUFBTTtHQUFNLE1BQU07RUFBUTtFQUM1QjtHQUFFLE1BQU07R0FBTSxNQUFNO0VBQVk7RUFDaEM7R0FBRSxNQUFNO0dBQU0sTUFBTTtFQUFhO0VB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