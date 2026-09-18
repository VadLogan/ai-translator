var background = (function() {
	//#region \0rolldown/runtime.js
	var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
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
	//#region ../node_modules/wxt/dist/utils/define-background.mjs
	function defineBackground(arg) {
		if (arg == null || typeof arg === "function") return { main: arg };
		return arg;
	}
	//#endregion
	//#region src/core/translator.ts
	var TranslationError = class extends Error {
		code;
		constructor(message, code, options) {
			super(message, options);
			this.code = code;
			this.name = "TranslationError";
		}
	};
	//#endregion
	//#region src/core/registry.ts
	var TranslatorRegistry = class {
		factories = /* @__PURE__ */ new Map();
		register(factory) {
			if (this.factories.has(factory.id)) throw new Error(`Translator provider "${factory.id}" is already registered`);
			this.factories.set(factory.id, factory);
			return this;
		}
		get(id) {
			const factory = this.factories.get(id);
			if (!factory) throw new TranslationError(`Translator provider "${id}" is not available. Choose another one in the extension settings.`, "unknown-provider");
			return factory;
		}
		list() {
			return [...this.factories.values()].map(({ id, displayName }) => ({
				id,
				displayName
			}));
		}
	};
	//#endregion
	//#region src/core/translation-service.ts
	var TranslationService = class {
		registry;
		settings;
		constructor(registry, settings) {
			this.registry = registry;
			this.settings = settings;
		}
		async translate(text, targetLang) {
			if (!text.trim()) throw new TranslationError("Nothing to translate", "invalid-input");
			const { activeProviderId, providerConfigs } = await this.settings.get();
			const translator = this.registry.get(activeProviderId).create(providerConfigs[activeProviderId]);
			try {
				return await translator.translate({
					text,
					targetLang
				});
			} catch (error) {
				if (error instanceof TranslationError) throw error;
				throw new TranslationError(`Translation failed: ${error instanceof Error ? error.message : String(error)}`, "provider-failed", { cause: error });
			}
		}
	};
	//#endregion
	//#region src/messaging/messages.ts
	function isMessage(value) {
		return typeof value === "object" && value !== null && typeof value.type === "string";
	}
	//#endregion
	//#region src/providers/api/api-translator.ts
	var BASE_URL = "http://127.0.0.1:8787";
	/** Talks to the backend API; the provider key lives there, never in the extension. */
	var ApiTranslator = class {
		baseUrl;
		constructor(baseUrl) {
			this.baseUrl = baseUrl;
		}
		async translate(request) {
			let response;
			try {
				response = await fetch(`${this.baseUrl}/translate`, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify(request)
				});
			} catch (error) {
				throw new TranslationError(`Cannot reach the translation API at ${this.baseUrl}. Is it running?`, "provider-failed", { cause: error });
			}
			const body = await response.json().catch(() => null);
			if (!response.ok) throw new TranslationError(body?.error?.message ?? `API returned ${response.status}`, response.status === 400 ? "invalid-input" : "provider-failed");
			return body;
		}
	};
	var apiTranslatorFactory = {
		id: "api",
		displayName: "Translation API",
		create: (config) => new ApiTranslator(config?.baseUrl ?? BASE_URL)
	};
	//#endregion
	//#region src/providers/mock/mock-translator.ts
	/** Offline fallback: exercises the UI flow with no API running. */
	var MockTranslator = class {
		delayMs;
		constructor(delayMs = 300) {
			this.delayMs = delayMs;
		}
		async translate({ text, targetLang }) {
			await new Promise((resolve) => setTimeout(resolve, this.delayMs));
			return { text: `[${targetLang}] ${text}` };
		}
	};
	var mockTranslatorFactory = {
		id: "mock",
		displayName: "Mock (for testing)",
		create: () => new MockTranslator()
	};
	//#endregion
	//#region src/providers/index.ts
	/** Composition point: register every available provider here. */
	function registerProviders(registry) {
		return registry.register(apiTranslatorFactory).register(mockTranslatorFactory);
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
	//#region src/entrypoints/background.ts
	var background_default = defineBackground(() => {
		const registry = registerProviders(new TranslatorRegistry());
		const translationService = new TranslationService(registry, storageSettings);
		async function handle(message) {
			try {
				switch (message.type) {
					case "translate": return {
						ok: true,
						data: await translationService.translate(message.text, message.targetLang)
					};
					case "list-providers": return {
						ok: true,
						data: registry.list()
					};
					case "open-options":
						await browser.runtime.openOptionsPage();
						return {
							ok: true,
							data: void 0
						};
				}
			} catch (error) {
				if (error instanceof TranslationError) return {
					ok: false,
					error: {
						message: error.message,
						code: error.code
					}
				};
				return {
					ok: false,
					error: { message: error instanceof Error ? error.message : String(error) }
				};
			}
		}
		browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
			if (!isMessage(message)) return;
			handle(message).then(sendResponse);
			return true;
		});
		browser.action.onClicked.addListener(() => {
			browser.runtime.openOptionsPage();
		});
		reloadPlaygroundWhenReady();
	});
	/**
	* In dev, WXT registers content scripts at runtime, after the start-URL tab has
	* already loaded, so that tab has no content script. Reload it once they exist.
	*/
	async function reloadPlaygroundWhenReady() {
		for (let attempt = 0; attempt < 50; attempt++) {
			if ((await browser.scripting.getRegisteredContentScripts()).length > 0) {
				const tabs = await browser.tabs.query({ url: "http://127.0.0.1:5555/*" });
				await Promise.all(tabs.map((tab) => tab.id !== void 0 && browser.tabs.reload(tab.id)));
				return;
			}
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}
	//#endregion
	//#region ../node_modules/@webext-core/match-patterns/dist/index.mjs
	/**
	* Class for parsing and performing operations on match patterns.
	*
	* @example
	*   const pattern = new MatchPattern('*://google.com/*');
	*
	*   pattern.includes('https://google.com'); // true
	*   pattern.includes('http://youtube.com/watch?v=123'); // false
	*/
	var MatchPattern = class MatchPattern {
		static {
			this.PROTOCOLS = [
				"http",
				"https",
				"file",
				"ftp",
				"urn",
				"ws",
				"wss"
			];
		}
		/**
		* Parse a match pattern string. If it is invalid, the constructor will throw an
		* `InvalidMatchPattern` error.
		*
		* @param matchPattern The match pattern to parse.
		*/
		constructor(matchPattern) {
			if (matchPattern === "<all_urls>") {
				this.isAllUrls = true;
				this.protocolMatches = [...MatchPattern.PROTOCOLS];
				this.hostnameMatch = "*";
				this.pathnameMatch = "*";
			} else {
				const groups = /(.*):\/\/(.*?)(\/.*)/.exec(matchPattern);
				if (groups == null) throw new InvalidMatchPattern(matchPattern, "Incorrect format");
				const [_, protocol, hostname, pathname] = groups;
				validateProtocol(matchPattern, protocol);
				validateHostname(matchPattern, hostname);
				this.protocolMatches = protocol === "*" ? ["http", "https"] : [protocol];
				this.hostnameMatch = hostname;
				this.pathnameMatch = pathname;
			}
		}
		/** Check if a URL is included in a pattern. */
		includes(url) {
			const u = typeof url === "string" ? new URL(url) : url instanceof Location ? new URL(url.href) : url;
			if (this.isAllUrls) return !this.isUnknownProtocol(u);
			return !!this.protocolMatches.find((protocol) => {
				if (protocol === "http") return this.isHttpMatch(u);
				if (protocol === "https") return this.isHttpsMatch(u);
				if (protocol === "file") return this.isFileMatch(u);
				if (protocol === "ftp") return this.isFtpMatch(u);
				if (protocol === "urn") return this.isUrnMatch(u);
			});
		}
		isHttpMatch(url) {
			return url.protocol === "http:" && this.isHostPathMatch(url);
		}
		isHttpsMatch(url) {
			return url.protocol === "https:" && this.isHostPathMatch(url);
		}
		isHostPathMatch(url) {
			if (!this.hostnameMatch || !this.pathnameMatch) return false;
			const hostnameMatchRegexs = [this.convertPatternToRegex(this.hostnameMatch), this.convertPatternToRegex(this.hostnameMatch.replace(/^\*\./, ""))];
			const pathnameMatchRegex = this.convertPatternToRegex(this.pathnameMatch);
			return !!hostnameMatchRegexs.find((regex) => regex.test(url.hostname)) && pathnameMatchRegex.test(url.pathname);
		}
		isUnknownProtocol(url) {
			return !this.protocolMatches.includes(url.protocol.slice(0, -1));
		}
		isPathMatch(url) {
			if (!this.pathnameMatch) return false;
			return this.convertPatternToRegex(this.pathnameMatch).test(url.pathname);
		}
		isFileMatch(url) {
			return url.protocol === "file:" && this.isPathMatch(url);
		}
		isFtpMatch(_url) {
			throw Error("Not implemented: ftp:// pattern matching. Open a PR to add support");
		}
		isUrnMatch(_url) {
			throw Error("Not implemented: urn:// pattern matching. Open a PR to add support");
		}
		convertPatternToRegex(pattern) {
			const starsReplaced = this.escapeForRegex(pattern).replace(/\\\*/g, ".*");
			return RegExp(`^${starsReplaced}$`);
		}
		escapeForRegex(string) {
			return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
	};
	var InvalidMatchPattern = class extends Error {
		constructor(matchPattern, reason) {
			super(`Invalid match pattern "${matchPattern}": ${reason}`);
		}
	};
	function validateProtocol(matchPattern, protocol) {
		if (!MatchPattern.PROTOCOLS.includes(protocol) && protocol !== "*") throw new InvalidMatchPattern(matchPattern, `${protocol} not a valid protocol (${MatchPattern.PROTOCOLS.join(", ")})`);
	}
	function validateHostname(matchPattern, hostname) {
		if (hostname.includes(":")) throw new InvalidMatchPattern(matchPattern, `Hostname cannot include a port`);
		if (hostname.includes("*") && hostname.length > 1 && !hostname.startsWith("*.")) throw new InvalidMatchPattern(matchPattern, `If using a wildcard (*), it must go at the start of the hostname`);
	}
	//#endregion
	//#region \0virtual:wxt-background-entrypoint?/Users/vadympalkin/ai-translator-ext/extension/src/entrypoints/background.ts
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
	var ws;
	/** Connect to the websocket and listen for messages. */
	function getDevServerWebSocket() {
		if (ws == null) {
			const serverUrl = "ws://localhost:3001";
			logger.debug("Connecting to dev server @", serverUrl);
			ws = new WebSocket(serverUrl, "vite-hmr");
			ws.addWxtEventListener = ws.addEventListener.bind(ws);
			ws.sendCustom = (event, payload) => ws?.send(JSON.stringify({
				type: "custom",
				event,
				payload
			}));
			ws.addEventListener("open", () => {
				logger.debug("Connected to dev server");
			});
			ws.addEventListener("close", () => {
				logger.debug("Disconnected from dev server");
			});
			ws.addEventListener("error", (event) => {
				logger.error("Failed to connect to dev server", event);
			});
			ws.addEventListener("message", (e) => {
				try {
					const message = JSON.parse(e.data);
					if (message.type === "custom") ws?.dispatchEvent(new CustomEvent(message.event, { detail: message.data }));
				} catch (err) {
					logger.error("Failed to handle message", err);
				}
			});
		}
		return ws;
	}
	/** https://developer.chrome.com/blog/longer-esw-lifetimes/ */
	function keepServiceWorkerAlive() {
		setInterval(async () => {
			await browser.runtime.getPlatformInfo();
		}, 5e3);
	}
	function reloadContentScript(payload) {
		if (browser.runtime.getManifest().manifest_version == 2) reloadContentScriptMv2(payload);
		else reloadContentScriptMv3(payload);
	}
	async function reloadContentScriptMv3({ registration, contentScript }) {
		if (registration === "runtime") await reloadRuntimeContentScriptMv3(contentScript);
		else await reloadManifestContentScriptMv3(contentScript);
	}
	async function reloadManifestContentScriptMv3(contentScript) {
		const id = `wxt:${contentScript.js[0]}`;
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const existing = registered.find((cs) => cs.id === id);
		if (existing) {
			logger.debug("Updating content script", existing);
			await browser.scripting.updateContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		} else {
			logger.debug("Registering new content script...");
			await browser.scripting.registerContentScripts([{
				...contentScript,
				id,
				css: contentScript.css ?? []
			}]);
		}
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadRuntimeContentScriptMv3(contentScript) {
		logger.log("Reloading content script:", contentScript);
		const registered = await browser.scripting.getRegisteredContentScripts();
		logger.debug("Existing scripts:", registered);
		const matches = registered.filter((cs) => {
			const hasJs = contentScript.js?.find((js) => cs.js?.includes(js));
			const hasCss = contentScript.css?.find((css) => cs.css?.includes(css));
			return hasJs || hasCss;
		});
		if (matches.length === 0) {
			logger.log("Content script is not registered yet, nothing to reload", contentScript);
			return;
		}
		await browser.scripting.updateContentScripts(matches);
		await reloadTabsForContentScript(contentScript);
	}
	async function reloadTabsForContentScript(contentScript) {
		const allTabs = await browser.tabs.query({});
		const matchPatterns = contentScript.matches.map((match) => new MatchPattern(match));
		const matchingTabs = allTabs.filter((tab) => {
			const url = tab.url;
			if (!url) return false;
			return !!matchPatterns.find((pattern) => pattern.includes(url));
		});
		await Promise.all(matchingTabs.map(async (tab) => {
			try {
				await browser.tabs.reload(tab.id);
			} catch (err) {
				logger.warn("Failed to reload tab:", err);
			}
		}));
	}
	async function reloadContentScriptMv2(_payload) {
		throw Error("TODO: reloadContentScriptMv2");
	}
	try {
		const ws = getDevServerWebSocket();
		ws.addWxtEventListener("wxt:reload-extension", () => {
			browser.runtime.reload();
		});
		ws.addWxtEventListener("wxt:reload-content-script", (event) => {
			reloadContentScript(event.detail);
		});
		ws.addEventListener("open", () => ws.sendCustom("wxt:background-initialized"));
		keepServiceWorkerAlive();
	} catch (err) {
		logger.error("Failed to setup web socket connection with dev server", err);
	}
	browser.commands.onCommand.addListener((command) => {
		if (command === "wxt:reload-extension") browser.runtime.reload();
	});
	var result;
	try {
		result = background_default.main();
		if (result instanceof Promise) console.warn("The background's main() function return a promise, but it must be synchronous");
	} catch (err) {
		logger.error("The background crashed on startup!");
		throw err;
	}
	//#endregion
	return result;
})();

//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFja2dyb3VuZC5qcyIsIm5hbWVzIjpbImJyb3dzZXIiLCJicm93c2VyIiwid2l0aExvY2siXSwic291cmNlcyI6WyIuLi8uLi8uLi9ub2RlX21vZHVsZXMvQHd4dC1kZXYvYnJvd3Nlci9zcmMvaW5kZXgubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L2Jyb3dzZXIubWpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3d4dC9kaXN0L3V0aWxzL2RlZmluZS1iYWNrZ3JvdW5kLm1qcyIsIi4uLy4uL3NyYy9jb3JlL3RyYW5zbGF0b3IudHMiLCIuLi8uLi9zcmMvY29yZS9yZWdpc3RyeS50cyIsIi4uLy4uL3NyYy9jb3JlL3RyYW5zbGF0aW9uLXNlcnZpY2UudHMiLCIuLi8uLi9zcmMvbWVzc2FnaW5nL21lc3NhZ2VzLnRzIiwiLi4vLi4vc3JjL3Byb3ZpZGVycy9hcGkvYXBpLXRyYW5zbGF0b3IudHMiLCIuLi8uLi9zcmMvcHJvdmlkZXJzL21vY2svbW9jay10cmFuc2xhdG9yLnRzIiwiLi4vLi4vc3JjL3Byb3ZpZGVycy9pbmRleC50cyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdXBlcmxvY2svc3JjL2NyZWF0ZS5qcyIsIi4uLy4uLy4uL25vZGVfbW9kdWxlcy9zdXBlcmxvY2svc3JjL2luZGV4LmpzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3eHQtZGV2L3N0b3JhZ2UvZGlzdC9pbmRleC5tanMiLCIuLi8uLi9zcmMvc2V0dGluZ3Mvc2V0dGluZ3MudHMiLCIuLi8uLi9zcmMvc2V0dGluZ3Mvc3RvcmFnZS1zZXR0aW5ncy50cyIsIi4uLy4uL3NyYy9lbnRyeXBvaW50cy9iYWNrZ3JvdW5kLnRzIiwiLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0B3ZWJleHQtY29yZS9tYXRjaC1wYXR0ZXJucy9kaXN0L2luZGV4Lm1qcyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyAjcmVnaW9uIHNuaXBwZXRcbmV4cG9ydCBjb25zdCBicm93c2VyID0gZ2xvYmFsVGhpcy5icm93c2VyPy5ydW50aW1lPy5pZFxuICA/IGdsb2JhbFRoaXMuYnJvd3NlclxuICA6IGdsb2JhbFRoaXMuY2hyb21lO1xuLy8gI2VuZHJlZ2lvbiBzbmlwcGV0XG4iLCJpbXBvcnQgeyBicm93c2VyIGFzIGJyb3dzZXIkMSB9IGZyb20gXCJAd3h0LWRldi9icm93c2VyXCI7XG4vLyNyZWdpb24gc3JjL2Jyb3dzZXIudHNcbi8qKlxuKiBDb250YWlucyB0aGUgYGJyb3dzZXJgIGV4cG9ydCB3aGljaCB5b3Ugc2hvdWxkIHVzZSB0byBhY2Nlc3MgdGhlIGV4dGVuc2lvblxuKiBBUElzIGluIHlvdXIgcHJvamVjdDpcbipcbiogYGBgdHNcbiogaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbipcbiogYnJvd3Nlci5ydW50aW1lLm9uSW5zdGFsbGVkLmFkZExpc3RlbmVyKCgpID0+IHtcbiogICAvLyAuLi5cbiogfSk7XG4qIGBgYFxuKlxuKiBAbW9kdWxlIHd4dC9icm93c2VyXG4qL1xuY29uc3QgYnJvd3NlciA9IGJyb3dzZXIkMTtcbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgYnJvd3NlciB9O1xuIiwiLy8jcmVnaW9uIHNyYy91dGlscy9kZWZpbmUtYmFja2dyb3VuZC50c1xuZnVuY3Rpb24gZGVmaW5lQmFja2dyb3VuZChhcmcpIHtcblx0aWYgKGFyZyA9PSBudWxsIHx8IHR5cGVvZiBhcmcgPT09IFwiZnVuY3Rpb25cIikgcmV0dXJuIHsgbWFpbjogYXJnIH07XG5cdHJldHVybiBhcmc7XG59XG4vLyNlbmRyZWdpb25cbmV4cG9ydCB7IGRlZmluZUJhY2tncm91bmQgfTtcbiIsImV4cG9ydCBpbnRlcmZhY2UgVHJhbnNsYXRlUmVxdWVzdCB7XG4gIHRleHQ6IHN0cmluZztcbiAgLyoqIEJDUC00Ny1pc2ggbGFuZ3VhZ2UgY29kZSwgZS5nLiBcImVuXCIsIFwidWtcIiwgXCJkZVwiLiAqL1xuICB0YXJnZXRMYW5nOiBzdHJpbmc7XG4gIC8qKiBPbWl0IHRvIGxldCB0aGUgcHJvdmlkZXIgYXV0by1kZXRlY3QuICovXG4gIHNvdXJjZUxhbmc/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNsYXRlUmVzdWx0IHtcbiAgdGV4dDogc3RyaW5nO1xuICBkZXRlY3RlZFNvdXJjZUxhbmc/OiBzdHJpbmc7XG59XG5cbi8qKiBUaGUgYWJzdHJhY3Rpb24gZXZlcnkgdHJhbnNsYXRpb24gZW5naW5lIGltcGxlbWVudHMuICovXG5leHBvcnQgaW50ZXJmYWNlIFRyYW5zbGF0b3Ige1xuICB0cmFuc2xhdGUocmVxdWVzdDogVHJhbnNsYXRlUmVxdWVzdCk6IFByb21pc2U8VHJhbnNsYXRlUmVzdWx0Pjtcbn1cblxuLyoqXG4gKiBEZXNjcmliZXMgYSBwcm92aWRlciBhbmQgYnVpbGRzIGEgY29uZmlndXJlZCBUcmFuc2xhdG9yLlxuICogYGNvbmZpZ2AgaXMgd2hhdGV2ZXIgdGhlIHByb3ZpZGVyIHN0b3JlcyBpbiBzZXR0aW5ncyAoQVBJIGtleSwgbW9kZWwsIC4uLikuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgVHJhbnNsYXRvckZhY3Rvcnk8VENvbmZpZyA9IHVua25vd24+IHtcbiAgcmVhZG9ubHkgaWQ6IHN0cmluZztcbiAgcmVhZG9ubHkgZGlzcGxheU5hbWU6IHN0cmluZztcbiAgY3JlYXRlKGNvbmZpZzogVENvbmZpZyB8IHVuZGVmaW5lZCk6IFRyYW5zbGF0b3I7XG59XG5cbmV4cG9ydCB0eXBlIFRyYW5zbGF0aW9uRXJyb3JDb2RlID0gJ2ludmFsaWQtaW5wdXQnIHwgJ3Vua25vd24tcHJvdmlkZXInIHwgJ3Byb3ZpZGVyLWZhaWxlZCc7XG5cbmV4cG9ydCBjbGFzcyBUcmFuc2xhdGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihcbiAgICBtZXNzYWdlOiBzdHJpbmcsXG4gICAgcmVhZG9ubHkgY29kZTogVHJhbnNsYXRpb25FcnJvckNvZGUsXG4gICAgb3B0aW9ucz86IHsgY2F1c2U/OiB1bmtub3duIH0sXG4gICkge1xuICAgIHN1cGVyKG1lc3NhZ2UsIG9wdGlvbnMpO1xuICAgIHRoaXMubmFtZSA9ICdUcmFuc2xhdGlvbkVycm9yJztcbiAgfVxufVxuIiwiaW1wb3J0IHsgVHJhbnNsYXRpb25FcnJvciwgdHlwZSBUcmFuc2xhdG9yRmFjdG9yeSB9IGZyb20gJy4vdHJhbnNsYXRvcic7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUHJvdmlkZXJJbmZvIHtcbiAgaWQ6IHN0cmluZztcbiAgZGlzcGxheU5hbWU6IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFRyYW5zbGF0b3JSZWdpc3RyeSB7XG4gIHByaXZhdGUgcmVhZG9ubHkgZmFjdG9yaWVzID0gbmV3IE1hcDxzdHJpbmcsIFRyYW5zbGF0b3JGYWN0b3J5PigpO1xuXG4gIHJlZ2lzdGVyKGZhY3Rvcnk6IFRyYW5zbGF0b3JGYWN0b3J5KTogdGhpcyB7XG4gICAgaWYgKHRoaXMuZmFjdG9yaWVzLmhhcyhmYWN0b3J5LmlkKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBUcmFuc2xhdG9yIHByb3ZpZGVyIFwiJHtmYWN0b3J5LmlkfVwiIGlzIGFscmVhZHkgcmVnaXN0ZXJlZGApO1xuICAgIH1cbiAgICB0aGlzLmZhY3Rvcmllcy5zZXQoZmFjdG9yeS5pZCwgZmFjdG9yeSk7XG4gICAgcmV0dXJuIHRoaXM7XG4gIH1cblxuICBnZXQoaWQ6IHN0cmluZyk6IFRyYW5zbGF0b3JGYWN0b3J5IHtcbiAgICBjb25zdCBmYWN0b3J5ID0gdGhpcy5mYWN0b3JpZXMuZ2V0KGlkKTtcbiAgICBpZiAoIWZhY3RvcnkpIHtcbiAgICAgIHRocm93IG5ldyBUcmFuc2xhdGlvbkVycm9yKFxuICAgICAgICBgVHJhbnNsYXRvciBwcm92aWRlciBcIiR7aWR9XCIgaXMgbm90IGF2YWlsYWJsZS4gQ2hvb3NlIGFub3RoZXIgb25lIGluIHRoZSBleHRlbnNpb24gc2V0dGluZ3MuYCxcbiAgICAgICAgJ3Vua25vd24tcHJvdmlkZXInLFxuICAgICAgKTtcbiAgICB9XG4gICAgcmV0dXJuIGZhY3Rvcnk7XG4gIH1cblxuICBsaXN0KCk6IFByb3ZpZGVySW5mb1tdIHtcbiAgICByZXR1cm4gWy4uLnRoaXMuZmFjdG9yaWVzLnZhbHVlcygpXS5tYXAoKHsgaWQsIGRpc3BsYXlOYW1lIH0pID0+ICh7IGlkLCBkaXNwbGF5TmFtZSB9KSk7XG4gIH1cbn1cbiIsImltcG9ydCB0eXBlIHsgVHJhbnNsYXRvclJlZ2lzdHJ5IH0gZnJvbSAnLi9yZWdpc3RyeSc7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbkVycm9yLCB0eXBlIFRyYW5zbGF0ZVJlc3VsdCB9IGZyb20gJy4vdHJhbnNsYXRvcic7XG5pbXBvcnQgdHlwZSB7IFNldHRpbmdzUmVhZGVyIH0gZnJvbSAnLi4vc2V0dGluZ3Mvc2V0dGluZ3MnO1xuXG5leHBvcnQgY2xhc3MgVHJhbnNsYXRpb25TZXJ2aWNlIHtcbiAgY29uc3RydWN0b3IoXG4gICAgcHJpdmF0ZSByZWFkb25seSByZWdpc3RyeTogVHJhbnNsYXRvclJlZ2lzdHJ5LFxuICAgIHByaXZhdGUgcmVhZG9ubHkgc2V0dGluZ3M6IFNldHRpbmdzUmVhZGVyLFxuICApIHt9XG5cbiAgYXN5bmMgdHJhbnNsYXRlKHRleHQ6IHN0cmluZywgdGFyZ2V0TGFuZzogc3RyaW5nKTogUHJvbWlzZTxUcmFuc2xhdGVSZXN1bHQ+IHtcbiAgICBpZiAoIXRleHQudHJpbSgpKSB7XG4gICAgICB0aHJvdyBuZXcgVHJhbnNsYXRpb25FcnJvcignTm90aGluZyB0byB0cmFuc2xhdGUnLCAnaW52YWxpZC1pbnB1dCcpO1xuICAgIH1cblxuICAgIGNvbnN0IHsgYWN0aXZlUHJvdmlkZXJJZCwgcHJvdmlkZXJDb25maWdzIH0gPSBhd2FpdCB0aGlzLnNldHRpbmdzLmdldCgpO1xuICAgIC8vIEJ1aWx0IHBlciByZXF1ZXN0IHNvIGNvbmZpZyBjaGFuZ2VzIGluIHNldHRpbmdzIGFwcGx5IGltbWVkaWF0ZWx5LlxuICAgIGNvbnN0IHRyYW5zbGF0b3IgPSB0aGlzLnJlZ2lzdHJ5LmdldChhY3RpdmVQcm92aWRlcklkKS5jcmVhdGUocHJvdmlkZXJDb25maWdzW2FjdGl2ZVByb3ZpZGVySWRdKTtcblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgdHJhbnNsYXRvci50cmFuc2xhdGUoeyB0ZXh0LCB0YXJnZXRMYW5nIH0pO1xuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBUcmFuc2xhdGlvbkVycm9yKSB0aHJvdyBlcnJvcjtcbiAgICAgIGNvbnN0IHJlYXNvbiA9IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKTtcbiAgICAgIHRocm93IG5ldyBUcmFuc2xhdGlvbkVycm9yKGBUcmFuc2xhdGlvbiBmYWlsZWQ6ICR7cmVhc29ufWAsICdwcm92aWRlci1mYWlsZWQnLCB7IGNhdXNlOiBlcnJvciB9KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7IGJyb3dzZXIgfSBmcm9tICd3eHQvYnJvd3Nlcic7XG5pbXBvcnQgdHlwZSB7IFByb3ZpZGVySW5mbyB9IGZyb20gJy4uL2NvcmUvcmVnaXN0cnknO1xuaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGVSZXN1bHQsIFRyYW5zbGF0aW9uRXJyb3JDb2RlIH0gZnJvbSAnLi4vY29yZS90cmFuc2xhdG9yJztcblxuZXhwb3J0IHR5cGUgTWVzc2FnZSA9XG4gIHwgeyB0eXBlOiAndHJhbnNsYXRlJzsgdGV4dDogc3RyaW5nOyB0YXJnZXRMYW5nOiBzdHJpbmcgfVxuICB8IHsgdHlwZTogJ2xpc3QtcHJvdmlkZXJzJyB9XG4gIHwgeyB0eXBlOiAnb3Blbi1vcHRpb25zJyB9O1xuXG5leHBvcnQgaW50ZXJmYWNlIFJlc3BvbnNlTWFwIHtcbiAgdHJhbnNsYXRlOiBUcmFuc2xhdGVSZXN1bHQ7XG4gICdsaXN0LXByb3ZpZGVycyc6IFByb3ZpZGVySW5mb1tdO1xuICAnb3Blbi1vcHRpb25zJzogdm9pZDtcbn1cblxuLyoqIEVycm9ycyBkb24ndCBzdXJ2aXZlIHN0cnVjdHVyZWQgY2xvbmluZywgc28gdGhleSB0cmF2ZWwgYXMgcGxhaW4gZGF0YS4gKi9cbmV4cG9ydCB0eXBlIFJlc3BvbnNlPFQ+ID1cbiAgfCB7IG9rOiB0cnVlOyBkYXRhOiBUIH1cbiAgfCB7IG9rOiBmYWxzZTsgZXJyb3I6IHsgbWVzc2FnZTogc3RyaW5nOyBjb2RlPzogVHJhbnNsYXRpb25FcnJvckNvZGUgfSB9O1xuXG5leHBvcnQgZnVuY3Rpb24gaXNNZXNzYWdlKHZhbHVlOiB1bmtub3duKTogdmFsdWUgaXMgTWVzc2FnZSB7XG4gIHJldHVybiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICE9PSBudWxsICYmIHR5cGVvZiAodmFsdWUgYXMgeyB0eXBlPzogdW5rbm93biB9KS50eXBlID09PSAnc3RyaW5nJztcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHNlbmRNZXNzYWdlPE0gZXh0ZW5kcyBNZXNzYWdlPihtZXNzYWdlOiBNKTogUHJvbWlzZTxSZXNwb25zZTxSZXNwb25zZU1hcFtNWyd0eXBlJ11dPj4ge1xuICB0cnkge1xuICAgIHJldHVybiBhd2FpdCBicm93c2VyLnJ1bnRpbWUuc2VuZE1lc3NhZ2UobWVzc2FnZSk7XG4gIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgLy8gVHlwaWNhbGx5IFwiRXh0ZW5zaW9uIGNvbnRleHQgaW52YWxpZGF0ZWRcIiBhZnRlciB0aGUgZXh0ZW5zaW9uIHJlbG9hZHMuXG4gICAgY29uc3QgcmVhc29uID0gZXJyb3IgaW5zdGFuY2VvZiBFcnJvciA/IGVycm9yLm1lc3NhZ2UgOiBTdHJpbmcoZXJyb3IpO1xuICAgIHJldHVybiB7IG9rOiBmYWxzZSwgZXJyb3I6IHsgbWVzc2FnZTogYEV4dGVuc2lvbiB1bmF2YWlsYWJsZTogJHtyZWFzb259LiBSZWxvYWQgdGhlIHBhZ2UuYCB9IH07XG4gIH1cbn1cbiIsImltcG9ydCB0eXBlIHsgVHJhbnNsYXRlRXJyLCBUcmFuc2xhdGVPayB9IGZyb20gJy4uLy4uLy4uLy4uL3NoYXJlZC9jb250cmFjdCc7XG5pbXBvcnQge1xuICBUcmFuc2xhdGlvbkVycm9yLFxuICB0eXBlIFRyYW5zbGF0ZVJlcXVlc3QsXG4gIHR5cGUgVHJhbnNsYXRlUmVzdWx0LFxuICB0eXBlIFRyYW5zbGF0b3IsXG4gIHR5cGUgVHJhbnNsYXRvckZhY3RvcnksXG59IGZyb20gJy4uLy4uL2NvcmUvdHJhbnNsYXRvcic7XG5cbmNvbnN0IEJBU0VfVVJMID0gaW1wb3J0Lm1ldGEuZW52LldYVF9BUElfVVJMID8/ICdodHRwOi8vMTI3LjAuMC4xOjg3ODcnO1xuXG4vKiogVGFsa3MgdG8gdGhlIGJhY2tlbmQgQVBJOyB0aGUgcHJvdmlkZXIga2V5IGxpdmVzIHRoZXJlLCBuZXZlciBpbiB0aGUgZXh0ZW5zaW9uLiAqL1xuZXhwb3J0IGNsYXNzIEFwaVRyYW5zbGF0b3IgaW1wbGVtZW50cyBUcmFuc2xhdG9yIHtcbiAgY29uc3RydWN0b3IocHJpdmF0ZSByZWFkb25seSBiYXNlVXJsOiBzdHJpbmcpIHt9XG5cbiAgYXN5bmMgdHJhbnNsYXRlKHJlcXVlc3Q6IFRyYW5zbGF0ZVJlcXVlc3QpOiBQcm9taXNlPFRyYW5zbGF0ZVJlc3VsdD4ge1xuICAgIGxldCByZXNwb25zZTogUmVzcG9uc2U7XG4gICAgdHJ5IHtcbiAgICAgIHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7dGhpcy5iYXNlVXJsfS90cmFuc2xhdGVgLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdjb250ZW50LXR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkocmVxdWVzdCksXG4gICAgICB9KTtcbiAgICB9IGNhdGNoIChlcnJvcikge1xuICAgICAgdGhyb3cgbmV3IFRyYW5zbGF0aW9uRXJyb3IoXG4gICAgICAgIGBDYW5ub3QgcmVhY2ggdGhlIHRyYW5zbGF0aW9uIEFQSSBhdCAke3RoaXMuYmFzZVVybH0uIElzIGl0IHJ1bm5pbmc/YCxcbiAgICAgICAgJ3Byb3ZpZGVyLWZhaWxlZCcsXG4gICAgICAgIHsgY2F1c2U6IGVycm9yIH0sXG4gICAgICApO1xuICAgIH1cblxuICAgIGNvbnN0IGJvZHk6IHVua25vd24gPSBhd2FpdCByZXNwb25zZS5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCk7XG4gICAgaWYgKCFyZXNwb25zZS5vaykge1xuICAgICAgY29uc3QgbWVzc2FnZSA9IChib2R5IGFzIFRyYW5zbGF0ZUVyciB8IG51bGwpPy5lcnJvcj8ubWVzc2FnZSA/PyBgQVBJIHJldHVybmVkICR7cmVzcG9uc2Uuc3RhdHVzfWA7XG4gICAgICB0aHJvdyBuZXcgVHJhbnNsYXRpb25FcnJvcihtZXNzYWdlLCByZXNwb25zZS5zdGF0dXMgPT09IDQwMCA/ICdpbnZhbGlkLWlucHV0JyA6ICdwcm92aWRlci1mYWlsZWQnKTtcbiAgICB9XG4gICAgcmV0dXJuIGJvZHkgYXMgVHJhbnNsYXRlT2s7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGFwaVRyYW5zbGF0b3JGYWN0b3J5OiBUcmFuc2xhdG9yRmFjdG9yeTx7IGJhc2VVcmw/OiBzdHJpbmcgfT4gPSB7XG4gIGlkOiAnYXBpJyxcbiAgZGlzcGxheU5hbWU6ICdUcmFuc2xhdGlvbiBBUEknLFxuICBjcmVhdGU6IChjb25maWcpID0+IG5ldyBBcGlUcmFuc2xhdG9yKGNvbmZpZz8uYmFzZVVybCA/PyBCQVNFX1VSTCksXG59O1xuIiwiaW1wb3J0IHR5cGUgeyBUcmFuc2xhdGVSZXF1ZXN0LCBUcmFuc2xhdGVSZXN1bHQsIFRyYW5zbGF0b3IsIFRyYW5zbGF0b3JGYWN0b3J5IH0gZnJvbSAnLi4vLi4vY29yZS90cmFuc2xhdG9yJztcblxuLyoqIE9mZmxpbmUgZmFsbGJhY2s6IGV4ZXJjaXNlcyB0aGUgVUkgZmxvdyB3aXRoIG5vIEFQSSBydW5uaW5nLiAqL1xuZXhwb3J0IGNsYXNzIE1vY2tUcmFuc2xhdG9yIGltcGxlbWVudHMgVHJhbnNsYXRvciB7XG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgcmVhZG9ubHkgZGVsYXlNcyA9IDMwMCkge31cblxuICBhc3luYyB0cmFuc2xhdGUoeyB0ZXh0LCB0YXJnZXRMYW5nIH06IFRyYW5zbGF0ZVJlcXVlc3QpOiBQcm9taXNlPFRyYW5zbGF0ZVJlc3VsdD4ge1xuICAgIGF3YWl0IG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiBzZXRUaW1lb3V0KHJlc29sdmUsIHRoaXMuZGVsYXlNcykpO1xuICAgIHJldHVybiB7IHRleHQ6IGBbJHt0YXJnZXRMYW5nfV0gJHt0ZXh0fWAgfTtcbiAgfVxufVxuXG5leHBvcnQgY29uc3QgbW9ja1RyYW5zbGF0b3JGYWN0b3J5OiBUcmFuc2xhdG9yRmFjdG9yeSA9IHtcbiAgaWQ6ICdtb2NrJyxcbiAgZGlzcGxheU5hbWU6ICdNb2NrIChmb3IgdGVzdGluZyknLFxuICBjcmVhdGU6ICgpID0+IG5ldyBNb2NrVHJhbnNsYXRvcigpLFxufTtcbiIsImltcG9ydCB0eXBlIHsgVHJhbnNsYXRvclJlZ2lzdHJ5IH0gZnJvbSAnLi4vY29yZS9yZWdpc3RyeSc7XG5pbXBvcnQgeyBhcGlUcmFuc2xhdG9yRmFjdG9yeSB9IGZyb20gJy4vYXBpL2FwaS10cmFuc2xhdG9yJztcbmltcG9ydCB7IG1vY2tUcmFuc2xhdG9yRmFjdG9yeSB9IGZyb20gJy4vbW9jay9tb2NrLXRyYW5zbGF0b3InO1xuXG4vKiogQ29tcG9zaXRpb24gcG9pbnQ6IHJlZ2lzdGVyIGV2ZXJ5IGF2YWlsYWJsZSBwcm92aWRlciBoZXJlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlZ2lzdGVyUHJvdmlkZXJzKHJlZ2lzdHJ5OiBUcmFuc2xhdG9yUmVnaXN0cnkpOiBUcmFuc2xhdG9yUmVnaXN0cnkge1xuICByZXR1cm4gcmVnaXN0cnkucmVnaXN0ZXIoYXBpVHJhbnNsYXRvckZhY3RvcnkpLnJlZ2lzdGVyKG1vY2tUcmFuc2xhdG9yRmFjdG9yeSk7XG59XG4iLCIndXNlIHN0cmljdCdcblxuY2xhc3MgTm9kZSB7XG4gIGNvbnN0cnVjdG9yIChkYXRhKSB7XG4gICAgdGhpcy5kYXRhID0gZGF0YVxuICB9XG59XG5cbmNsYXNzIExpbmtlZExpc3Qge1xuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgdGhpcy5sZW5ndGggPSAwXG4gIH1cblxuICBlbnF1ZXVlIChkYXRhKSB7XG4gICAgY29uc3Qgbm9kZSA9IG5ldyBOb2RlKGRhdGEpXG4gICAgbm9kZS5wcmV2ID0gdGhpcy50YWlsXG4gICAgaWYgKHRoaXMudGFpbCkgdGhpcy50YWlsLm5leHQgPSBub2RlXG4gICAgZWxzZSB0aGlzLmhlYWQgPSBub2RlXG4gICAgdGhpcy50YWlsID0gbm9kZVxuICAgIHRoaXMubGVuZ3RoKytcbiAgICByZXR1cm4gbm9kZVxuICB9XG5cbiAgZGVxdWV1ZSAoKSB7XG4gICAgaWYgKCF0aGlzLmhlYWQpIHJldHVyblxuICAgIGNvbnN0IHsgZGF0YSB9ID0gdGhpcy5oZWFkXG4gICAgdGhpcy5yZW1vdmUodGhpcy5oZWFkKVxuICAgIHJldHVybiBkYXRhXG4gIH1cblxuICByZW1vdmUgKG5vZGUpIHtcbiAgICBpZiAobm9kZS5wcmV2KSBub2RlLnByZXYubmV4dCA9IG5vZGUubmV4dFxuICAgIGVsc2UgdGhpcy5oZWFkID0gbm9kZS5uZXh0XG4gICAgaWYgKG5vZGUubmV4dCkgbm9kZS5uZXh0LnByZXYgPSBub2RlLnByZXZcbiAgICBlbHNlIHRoaXMudGFpbCA9IG5vZGUucHJldlxuICAgIHRoaXMubGVuZ3RoLS1cbiAgfVxuXG4gIHNpemUgKCkge1xuICAgIHJldHVybiB0aGlzLmxlbmd0aFxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gKHNsb3RzID0gMSkgPT4ge1xuICBjb25zdCBxdWV1ZSA9IG5ldyBMaW5rZWRMaXN0KClcblxuICBjb25zdCByZWxlYXNlID0gKCkgPT4ge1xuICAgICsrc2xvdHNcbiAgICBjb25zdCB3YWl0ZXIgPSBxdWV1ZS5kZXF1ZXVlKClcbiAgICBpZiAod2FpdGVyKSByZXR1cm4gd2FpdGVyLmFjcXVpcmUoKVxuICB9XG5cbiAgY29uc3QgYWNxdWlyZSA9IHJlc29sdmUgPT4ge1xuICAgIC0tc2xvdHNcbiAgICByZXNvbHZlKHJlbGVhc2UpXG4gIH1cblxuICBjb25zdCBsb2NrID0gc2lnbmFsID0+XG4gICAgbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICBpZiAoc2lnbmFsICE9IG51bGwgJiYgdHlwZW9mIHNpZ25hbC5hZGRFdmVudExpc3RlbmVyICE9PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ2BzaWduYWxgIG5lZWRzIHRvIGJlIGFuIEFib3J0U2lnbmFsLicpXG4gICAgICB9XG4gICAgICBpZiAoc2lnbmFsPy5hYm9ydGVkKSByZXR1cm4gcmVzb2x2ZShudWxsKVxuICAgICAgaWYgKCFsb2NrLmlzTG9ja2VkKCkpIHJldHVybiBhY3F1aXJlKHJlc29sdmUpXG5cbiAgICAgIGNvbnN0IHdhaXRlciA9IHsgYWNxdWlyZTogKCkgPT4gYWNxdWlyZShyZXNvbHZlKSB9XG4gICAgICBjb25zdCBub2RlID0gcXVldWUuZW5xdWV1ZSh3YWl0ZXIpXG5cbiAgICAgIGlmIChzaWduYWwgIT0gbnVsbCkge1xuICAgICAgICBjb25zdCBvbkFib3J0ID0gKCkgPT4ge1xuICAgICAgICAgIHF1ZXVlLnJlbW92ZShub2RlKVxuICAgICAgICAgIHJlc29sdmUobnVsbClcbiAgICAgICAgfVxuICAgICAgICB3YWl0ZXIuYWNxdWlyZSA9ICgpID0+IHtcbiAgICAgICAgICBzaWduYWwucmVtb3ZlRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0KVxuICAgICAgICAgIGFjcXVpcmUocmVzb2x2ZSlcbiAgICAgICAgfVxuICAgICAgICBzaWduYWwuYWRkRXZlbnRMaXN0ZW5lcignYWJvcnQnLCBvbkFib3J0LCB7IG9uY2U6IHRydWUgfSlcbiAgICAgIH1cbiAgICB9KVxuXG4gIGxvY2suaXNMb2NrZWQgPSAoKSA9PiBzbG90cyA9PT0gMFxuXG4gIGxvY2suYXdhaXRpbmcgPSAoKSA9PiBxdWV1ZS5zaXplKClcblxuICByZXR1cm4gbG9ja1xufVxuIiwiJ3VzZSBzdHJpY3QnXG5cbmNvbnN0IGNyZWF0ZUxvY2sgPSByZXF1aXJlKCcuL2NyZWF0ZScpXG5cbmNvbnN0IHdpdGhMb2NrID0gb3B0cyA9PiB7XG4gIGNvbnN0IGxvY2sgPSBjcmVhdGVMb2NrKG9wdHMpXG5cbiAgY29uc3Qgd2l0aExvY2sgPSBhc3luYyAoZm4sIHNpZ25hbCkgPT4ge1xuICAgIGNvbnN0IHJlbGVhc2UgPSBhd2FpdCBsb2NrKHNpZ25hbClcbiAgICBpZiAoIXJlbGVhc2UpIHJldHVyblxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gYXdhaXQgZm4oKVxuICAgIH0gZmluYWxseSB7XG4gICAgICByZWxlYXNlKClcbiAgICB9XG4gIH1cblxuICB3aXRoTG9jay5pc0xvY2tlZCA9IGxvY2suaXNMb2NrZWRcbiAgd2l0aExvY2suYXdhaXRpbmcgPSBsb2NrLmF3YWl0aW5nXG5cbiAgcmV0dXJuIHdpdGhMb2NrXG59XG5cbm1vZHVsZS5leHBvcnRzID0geyB3aXRoTG9jaywgY3JlYXRlTG9jayB9XG4iLCJpbXBvcnQgeyBicm93c2VyIH0gZnJvbSBcIkB3eHQtZGV2L2Jyb3dzZXJcIjtcbmltcG9ydCB7IHdpdGhMb2NrIH0gZnJvbSBcInN1cGVybG9ja1wiO1xuLy8jcmVnaW9uIC4uLy4uL25vZGVfbW9kdWxlcy8uYnVuL2RlcXVhbEAyLjAuMy9ub2RlX21vZHVsZXMvZGVxdWFsL2xpdGUvaW5kZXgubWpzXG52YXIgaGFzID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbmZ1bmN0aW9uIGRlcXVhbChmb28sIGJhcikge1xuXHR2YXIgY3RvciwgbGVuO1xuXHRpZiAoZm9vID09PSBiYXIpIHJldHVybiB0cnVlO1xuXHRpZiAoZm9vICYmIGJhciAmJiAoY3RvciA9IGZvby5jb25zdHJ1Y3RvcikgPT09IGJhci5jb25zdHJ1Y3Rvcikge1xuXHRcdGlmIChjdG9yID09PSBEYXRlKSByZXR1cm4gZm9vLmdldFRpbWUoKSA9PT0gYmFyLmdldFRpbWUoKTtcblx0XHRpZiAoY3RvciA9PT0gUmVnRXhwKSByZXR1cm4gZm9vLnRvU3RyaW5nKCkgPT09IGJhci50b1N0cmluZygpO1xuXHRcdGlmIChjdG9yID09PSBBcnJheSkge1xuXHRcdFx0aWYgKChsZW4gPSBmb28ubGVuZ3RoKSA9PT0gYmFyLmxlbmd0aCkgd2hpbGUgKGxlbi0tICYmIGRlcXVhbChmb29bbGVuXSwgYmFyW2xlbl0pKTtcblx0XHRcdHJldHVybiBsZW4gPT09IC0xO1xuXHRcdH1cblx0XHRpZiAoIWN0b3IgfHwgdHlwZW9mIGZvbyA9PT0gXCJvYmplY3RcIikge1xuXHRcdFx0bGVuID0gMDtcblx0XHRcdGZvciAoY3RvciBpbiBmb28pIHtcblx0XHRcdFx0aWYgKGhhcy5jYWxsKGZvbywgY3RvcikgJiYgKytsZW4gJiYgIWhhcy5jYWxsKGJhciwgY3RvcikpIHJldHVybiBmYWxzZTtcblx0XHRcdFx0aWYgKCEoY3RvciBpbiBiYXIpIHx8ICFkZXF1YWwoZm9vW2N0b3JdLCBiYXJbY3Rvcl0pKSByZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gT2JqZWN0LmtleXMoYmFyKS5sZW5ndGggPT09IGxlbjtcblx0XHR9XG5cdH1cblx0cmV0dXJuIGZvbyAhPT0gZm9vICYmIGJhciAhPT0gYmFyO1xufVxuLy8jZW5kcmVnaW9uXG4vLyNyZWdpb24gc3JjL2luZGV4LnRzXG4vKipcbiogU2ltcGxpZmllZCBzdG9yYWdlIEFQSXMgd2l0aCBzdXBwb3J0IGZvciB2ZXJzaW9uZWQgZmllbGRzLCBzbmFwc2hvdHMsXG4qIG1ldGFkYXRhLCBhbmQgaXRlbSBkZWZpbml0aW9ucy5cbipcbiogU2VlIFt0aGUgZ3VpZGVdKGh0dHBzOi8vd3h0LmRldi9zdG9yYWdlLmh0bWwpIGZvciBtb3JlIGluZm9ybWF0aW9uLlxuKlxuKiBAbW9kdWxlIEB3eHQtZGV2L3N0b3JhZ2VcbiovXG5jb25zdCBzdG9yYWdlID0gY3JlYXRlU3RvcmFnZSgpO1xuZnVuY3Rpb24gY3JlYXRlU3RvcmFnZSgpIHtcblx0Y29uc3QgZHJpdmVycyA9IHtcblx0XHRsb2NhbDogY3JlYXRlRHJpdmVyKFwibG9jYWxcIiksXG5cdFx0c2Vzc2lvbjogY3JlYXRlRHJpdmVyKFwic2Vzc2lvblwiKSxcblx0XHRzeW5jOiBjcmVhdGVEcml2ZXIoXCJzeW5jXCIpLFxuXHRcdG1hbmFnZWQ6IGNyZWF0ZURyaXZlcihcIm1hbmFnZWRcIilcblx0fTtcblx0Y29uc3QgZ2V0RHJpdmVyID0gKGFyZWEpID0+IHtcblx0XHRjb25zdCBkcml2ZXIgPSBkcml2ZXJzW2FyZWFdO1xuXHRcdGlmIChkcml2ZXIgPT0gbnVsbCkge1xuXHRcdFx0Y29uc3QgYXJlYU5hbWVzID0gT2JqZWN0LmtleXMoZHJpdmVycykuam9pbihcIiwgXCIpO1xuXHRcdFx0dGhyb3cgRXJyb3IoYEludmFsaWQgYXJlYSBcIiR7YXJlYX1cIi4gT3B0aW9uczogJHthcmVhTmFtZXN9YCk7XG5cdFx0fVxuXHRcdHJldHVybiBkcml2ZXI7XG5cdH07XG5cdGNvbnN0IHJlc29sdmVLZXkgPSAoa2V5KSA9PiB7XG5cdFx0Y29uc3QgZGVsaW1pbmF0b3JJbmRleCA9IGtleS5pbmRleE9mKFwiOlwiKTtcblx0XHRjb25zdCBkcml2ZXJBcmVhID0ga2V5LnN1YnN0cmluZygwLCBkZWxpbWluYXRvckluZGV4KTtcblx0XHRjb25zdCBkcml2ZXJLZXkgPSBrZXkuc3Vic3RyaW5nKGRlbGltaW5hdG9ySW5kZXggKyAxKTtcblx0XHRpZiAoZHJpdmVyS2V5ID09IG51bGwpIHRocm93IEVycm9yKGBTdG9yYWdlIGtleSBzaG91bGQgYmUgaW4gdGhlIGZvcm0gb2YgXCJhcmVhOmtleVwiLCBidXQgcmVjZWl2ZWQgXCIke2tleX1cImApO1xuXHRcdHJldHVybiB7XG5cdFx0XHRkcml2ZXJBcmVhLFxuXHRcdFx0ZHJpdmVyS2V5LFxuXHRcdFx0ZHJpdmVyOiBnZXREcml2ZXIoZHJpdmVyQXJlYSlcblx0XHR9O1xuXHR9O1xuXHRjb25zdCBnZXRNZXRhS2V5ID0gKGtleSkgPT4ga2V5ICsgXCIkXCI7XG5cdGNvbnN0IG1lcmdlTWV0YSA9IChvbGRNZXRhLCBuZXdNZXRhKSA9PiB7XG5cdFx0Y29uc3QgbmV3RmllbGRzID0geyAuLi5vbGRNZXRhIH07XG5cdFx0T2JqZWN0LmVudHJpZXMobmV3TWV0YSkuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG5cdFx0XHRpZiAodmFsdWUgPT0gbnVsbCkgZGVsZXRlIG5ld0ZpZWxkc1trZXldO1xuXHRcdFx0ZWxzZSBuZXdGaWVsZHNba2V5XSA9IHZhbHVlO1xuXHRcdH0pO1xuXHRcdHJldHVybiBuZXdGaWVsZHM7XG5cdH07XG5cdGNvbnN0IGdldFZhbHVlT3JGYWxsYmFjayA9ICh2YWx1ZSwgZmFsbGJhY2spID0+IHZhbHVlID8/IGZhbGxiYWNrID8/IG51bGw7XG5cdGNvbnN0IGdldE1ldGFWYWx1ZSA9IChwcm9wZXJ0aWVzKSA9PiB0eXBlb2YgcHJvcGVydGllcyA9PT0gXCJvYmplY3RcIiAmJiAhQXJyYXkuaXNBcnJheShwcm9wZXJ0aWVzKSA/IHByb3BlcnRpZXMgOiB7fTtcblx0Y29uc3QgZ2V0SXRlbSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSwgb3B0cykgPT4ge1xuXHRcdHJldHVybiBnZXRWYWx1ZU9yRmFsbGJhY2soYXdhaXQgZHJpdmVyLmdldEl0ZW0oZHJpdmVyS2V5KSwgb3B0cz8uZmFsbGJhY2sgPz8gb3B0cz8uZGVmYXVsdFZhbHVlKTtcblx0fTtcblx0Y29uc3QgZ2V0TWV0YSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSkgPT4ge1xuXHRcdGNvbnN0IG1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG5cdFx0cmV0dXJuIGdldE1ldGFWYWx1ZShhd2FpdCBkcml2ZXIuZ2V0SXRlbShtZXRhS2V5KSk7XG5cdH07XG5cdGNvbnN0IHNldEl0ZW0gPSBhc3luYyAoZHJpdmVyLCBkcml2ZXJLZXksIHZhbHVlKSA9PiB7XG5cdFx0YXdhaXQgZHJpdmVyLnNldEl0ZW0oZHJpdmVyS2V5LCB2YWx1ZSA/PyBudWxsKTtcblx0fTtcblx0Y29uc3Qgc2V0TWV0YSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcykgPT4ge1xuXHRcdGNvbnN0IG1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG5cdFx0Y29uc3QgZXhpc3RpbmdGaWVsZHMgPSBnZXRNZXRhVmFsdWUoYXdhaXQgZHJpdmVyLmdldEl0ZW0obWV0YUtleSkpO1xuXHRcdGF3YWl0IGRyaXZlci5zZXRJdGVtKG1ldGFLZXksIG1lcmdlTWV0YShleGlzdGluZ0ZpZWxkcywgcHJvcGVydGllcykpO1xuXHR9O1xuXHRjb25zdCByZW1vdmVJdGVtID0gYXN5bmMgKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKSA9PiB7XG5cdFx0YXdhaXQgZHJpdmVyLnJlbW92ZUl0ZW0oZHJpdmVyS2V5KTtcblx0XHRpZiAob3B0cz8ucmVtb3ZlTWV0YSkge1xuXHRcdFx0Y29uc3QgbWV0YUtleSA9IGdldE1ldGFLZXkoZHJpdmVyS2V5KTtcblx0XHRcdGF3YWl0IGRyaXZlci5yZW1vdmVJdGVtKG1ldGFLZXkpO1xuXHRcdH1cblx0fTtcblx0Y29uc3QgcmVtb3ZlTWV0YSA9IGFzeW5jIChkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcykgPT4ge1xuXHRcdGNvbnN0IG1ldGFLZXkgPSBnZXRNZXRhS2V5KGRyaXZlcktleSk7XG5cdFx0aWYgKHByb3BlcnRpZXMgPT0gbnVsbCkgYXdhaXQgZHJpdmVyLnJlbW92ZUl0ZW0obWV0YUtleSk7XG5cdFx0ZWxzZSB7XG5cdFx0XHRjb25zdCBuZXdGaWVsZHMgPSBnZXRNZXRhVmFsdWUoYXdhaXQgZHJpdmVyLmdldEl0ZW0obWV0YUtleSkpO1xuXHRcdFx0W3Byb3BlcnRpZXNdLmZsYXQoKS5mb3JFYWNoKChmaWVsZCkgPT4gZGVsZXRlIG5ld0ZpZWxkc1tmaWVsZF0pO1xuXHRcdFx0YXdhaXQgZHJpdmVyLnNldEl0ZW0obWV0YUtleSwgbmV3RmllbGRzKTtcblx0XHR9XG5cdH07XG5cdGNvbnN0IHdhdGNoID0gKGRyaXZlciwgZHJpdmVyS2V5LCBjYikgPT4gZHJpdmVyLndhdGNoKGRyaXZlcktleSwgY2IpO1xuXHRyZXR1cm4ge1xuXHRcdGdldEl0ZW06IGFzeW5jIChrZXksIG9wdHMpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdHJldHVybiBhd2FpdCBnZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcblx0XHR9LFxuXHRcdGdldEl0ZW1zOiBhc3luYyAoa2V5cykgPT4ge1xuXHRcdFx0Y29uc3QgYXJlYVRvS2V5TWFwID0gLyogQF9fUFVSRV9fICovIG5ldyBNYXAoKTtcblx0XHRcdGNvbnN0IGtleVRvT3B0c01hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG5cdFx0XHRjb25zdCBvcmRlcmVkS2V5cyA9IFtdO1xuXHRcdFx0a2V5cy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdFx0bGV0IGtleVN0cjtcblx0XHRcdFx0bGV0IG9wdHM7XG5cdFx0XHRcdGlmICh0eXBlb2Yga2V5ID09PSBcInN0cmluZ1wiKSBrZXlTdHIgPSBrZXk7XG5cdFx0XHRcdGVsc2UgaWYgKFwiZ2V0VmFsdWVcIiBpbiBrZXkpIHtcblx0XHRcdFx0XHRrZXlTdHIgPSBrZXkua2V5O1xuXHRcdFx0XHRcdG9wdHMgPSB7IGZhbGxiYWNrOiBrZXkuZmFsbGJhY2sgfTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRrZXlTdHIgPSBrZXkua2V5O1xuXHRcdFx0XHRcdG9wdHMgPSBrZXkub3B0aW9ucztcblx0XHRcdFx0fVxuXHRcdFx0XHRvcmRlcmVkS2V5cy5wdXNoKGtleVN0cik7XG5cdFx0XHRcdGNvbnN0IHsgZHJpdmVyQXJlYSwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleVN0cik7XG5cdFx0XHRcdGNvbnN0IGFyZWFLZXlzID0gYXJlYVRvS2V5TWFwLmdldChkcml2ZXJBcmVhKSA/PyBbXTtcblx0XHRcdFx0YXJlYVRvS2V5TWFwLnNldChkcml2ZXJBcmVhLCBhcmVhS2V5cy5jb25jYXQoZHJpdmVyS2V5KSk7XG5cdFx0XHRcdGtleVRvT3B0c01hcC5zZXQoa2V5U3RyLCBvcHRzKTtcblx0XHRcdH0pO1xuXHRcdFx0Y29uc3QgcmVzdWx0c01hcCA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgTWFwKCk7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChBcnJheS5mcm9tKGFyZWFUb0tleU1hcC5lbnRyaWVzKCkpLm1hcChhc3luYyAoW2RyaXZlckFyZWEsIGtleXNdKSA9PiB7XG5cdFx0XHRcdChhd2FpdCBkcml2ZXJzW2RyaXZlckFyZWFdLmdldEl0ZW1zKGtleXMpKS5mb3JFYWNoKChkcml2ZXJSZXN1bHQpID0+IHtcblx0XHRcdFx0XHRjb25zdCBrZXkgPSBgJHtkcml2ZXJBcmVhfToke2RyaXZlclJlc3VsdC5rZXl9YDtcblx0XHRcdFx0XHRjb25zdCBvcHRzID0ga2V5VG9PcHRzTWFwLmdldChrZXkpO1xuXHRcdFx0XHRcdGNvbnN0IHZhbHVlID0gZ2V0VmFsdWVPckZhbGxiYWNrKGRyaXZlclJlc3VsdC52YWx1ZSwgb3B0cz8uZmFsbGJhY2sgPz8gb3B0cz8uZGVmYXVsdFZhbHVlKTtcblx0XHRcdFx0XHRyZXN1bHRzTWFwLnNldChrZXksIHZhbHVlKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KSk7XG5cdFx0XHRyZXR1cm4gb3JkZXJlZEtleXMubWFwKChrZXkpID0+ICh7XG5cdFx0XHRcdGtleSxcblx0XHRcdFx0dmFsdWU6IHJlc3VsdHNNYXAuZ2V0KGtleSlcblx0XHRcdH0pKTtcblx0XHR9LFxuXHRcdGdldE1ldGE6IGFzeW5jIChrZXkpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdHJldHVybiBhd2FpdCBnZXRNZXRhKGRyaXZlciwgZHJpdmVyS2V5KTtcblx0XHR9LFxuXHRcdGdldE1ldGFzOiBhc3luYyAoYXJncykgPT4ge1xuXHRcdFx0Y29uc3Qga2V5cyA9IGFyZ3MubWFwKChhcmcpID0+IHtcblx0XHRcdFx0Y29uc3Qga2V5ID0gdHlwZW9mIGFyZyA9PT0gXCJzdHJpbmdcIiA/IGFyZyA6IGFyZy5rZXk7XG5cdFx0XHRcdGNvbnN0IHsgZHJpdmVyQXJlYSwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRcdHJldHVybiB7XG5cdFx0XHRcdFx0a2V5LFxuXHRcdFx0XHRcdGRyaXZlckFyZWEsXG5cdFx0XHRcdFx0ZHJpdmVyS2V5LFxuXHRcdFx0XHRcdGRyaXZlck1ldGFLZXk6IGdldE1ldGFLZXkoZHJpdmVyS2V5KVxuXHRcdFx0XHR9O1xuXHRcdFx0fSk7XG5cdFx0XHRjb25zdCBhcmVhVG9Ecml2ZXJNZXRhS2V5c01hcCA9IGtleXMucmVkdWNlKChtYXAsIGtleSkgPT4ge1xuXHRcdFx0XHRtYXBba2V5LmRyaXZlckFyZWFdID8/PSBbXTtcblx0XHRcdFx0bWFwW2tleS5kcml2ZXJBcmVhXS5wdXNoKGtleSk7XG5cdFx0XHRcdHJldHVybiBtYXA7XG5cdFx0XHR9LCB7fSk7XG5cdFx0XHRjb25zdCByZXN1bHRzTWFwID0ge307XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChPYmplY3QuZW50cmllcyhhcmVhVG9Ecml2ZXJNZXRhS2V5c01hcCkubWFwKGFzeW5jIChbYXJlYSwga2V5c10pID0+IHtcblx0XHRcdFx0Y29uc3QgYXJlYVJlcyA9IGF3YWl0IGJyb3dzZXIuc3RvcmFnZVthcmVhXS5nZXQoa2V5cy5tYXAoKGtleSkgPT4ga2V5LmRyaXZlck1ldGFLZXkpKTtcblx0XHRcdFx0a2V5cy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdFx0XHRyZXN1bHRzTWFwW2tleS5rZXldID0gYXJlYVJlc1trZXkuZHJpdmVyTWV0YUtleV0gPz8ge307XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSkpO1xuXHRcdFx0cmV0dXJuIGtleXMubWFwKChrZXkpID0+ICh7XG5cdFx0XHRcdGtleToga2V5LmtleSxcblx0XHRcdFx0bWV0YTogcmVzdWx0c01hcFtrZXkua2V5XVxuXHRcdFx0fSkpO1xuXHRcdH0sXG5cdFx0c2V0SXRlbTogYXN5bmMgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdGNvbnN0IHsgZHJpdmVyLCBkcml2ZXJLZXkgfSA9IHJlc29sdmVLZXkoa2V5KTtcblx0XHRcdGF3YWl0IHNldEl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIHZhbHVlKTtcblx0XHR9LFxuXHRcdHNldEl0ZW1zOiBhc3luYyAoaXRlbXMpID0+IHtcblx0XHRcdGNvbnN0IGFyZWFUb0tleVZhbHVlTWFwID0ge307XG5cdFx0XHRpdGVtcy5mb3JFYWNoKChpdGVtKSA9PiB7XG5cdFx0XHRcdGNvbnN0IHsgZHJpdmVyQXJlYSwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KFwia2V5XCIgaW4gaXRlbSA/IGl0ZW0ua2V5IDogaXRlbS5pdGVtLmtleSk7XG5cdFx0XHRcdGFyZWFUb0tleVZhbHVlTWFwW2RyaXZlckFyZWFdID8/PSBbXTtcblx0XHRcdFx0YXJlYVRvS2V5VmFsdWVNYXBbZHJpdmVyQXJlYV0ucHVzaCh7XG5cdFx0XHRcdFx0a2V5OiBkcml2ZXJLZXksXG5cdFx0XHRcdFx0dmFsdWU6IGl0ZW0udmFsdWVcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHRcdGF3YWl0IFByb21pc2UuYWxsKE9iamVjdC5lbnRyaWVzKGFyZWFUb0tleVZhbHVlTWFwKS5tYXAoYXN5bmMgKFtkcml2ZXJBcmVhLCB2YWx1ZXNdKSA9PiB7XG5cdFx0XHRcdGF3YWl0IGdldERyaXZlcihkcml2ZXJBcmVhKS5zZXRJdGVtcyh2YWx1ZXMpO1xuXHRcdFx0fSkpO1xuXHRcdH0sXG5cdFx0c2V0TWV0YTogYXN5bmMgKGtleSwgcHJvcGVydGllcykgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0YXdhaXQgc2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcyk7XG5cdFx0fSxcblx0XHRzZXRNZXRhczogYXN5bmMgKGl0ZW1zKSA9PiB7XG5cdFx0XHRjb25zdCBhcmVhVG9NZXRhVXBkYXRlc01hcCA9IHt9O1xuXHRcdFx0aXRlbXMuZm9yRWFjaCgoaXRlbSkgPT4ge1xuXHRcdFx0XHRjb25zdCB7IGRyaXZlckFyZWEsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShcImtleVwiIGluIGl0ZW0gPyBpdGVtLmtleSA6IGl0ZW0uaXRlbS5rZXkpO1xuXHRcdFx0XHRhcmVhVG9NZXRhVXBkYXRlc01hcFtkcml2ZXJBcmVhXSA/Pz0gW107XG5cdFx0XHRcdGFyZWFUb01ldGFVcGRhdGVzTWFwW2RyaXZlckFyZWFdLnB1c2goe1xuXHRcdFx0XHRcdGtleTogZHJpdmVyS2V5LFxuXHRcdFx0XHRcdHByb3BlcnRpZXM6IGl0ZW0ubWV0YVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoT2JqZWN0LmVudHJpZXMoYXJlYVRvTWV0YVVwZGF0ZXNNYXApLm1hcChhc3luYyAoW3N0b3JhZ2VBcmVhLCB1cGRhdGVzXSkgPT4ge1xuXHRcdFx0XHRjb25zdCBkcml2ZXIgPSBnZXREcml2ZXIoc3RvcmFnZUFyZWEpO1xuXHRcdFx0XHRjb25zdCBtZXRhS2V5cyA9IHVwZGF0ZXMubWFwKCh7IGtleSB9KSA9PiBnZXRNZXRhS2V5KGtleSkpO1xuXHRcdFx0XHRjb25zdCBleGlzdGluZ01ldGFzID0gYXdhaXQgZHJpdmVyLmdldEl0ZW1zKG1ldGFLZXlzKTtcblx0XHRcdFx0Y29uc3QgZXhpc3RpbmdNZXRhTWFwID0gT2JqZWN0LmZyb21FbnRyaWVzKGV4aXN0aW5nTWV0YXMubWFwKCh7IGtleSwgdmFsdWUgfSkgPT4gW2tleSwgZ2V0TWV0YVZhbHVlKHZhbHVlKV0pKTtcblx0XHRcdFx0Y29uc3QgbWV0YVVwZGF0ZXMgPSB1cGRhdGVzLm1hcCgoeyBrZXksIHByb3BlcnRpZXMgfSkgPT4ge1xuXHRcdFx0XHRcdGNvbnN0IG1ldGFLZXkgPSBnZXRNZXRhS2V5KGtleSk7XG5cdFx0XHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0XHRcdGtleTogbWV0YUtleSxcblx0XHRcdFx0XHRcdHZhbHVlOiBtZXJnZU1ldGEoZXhpc3RpbmdNZXRhTWFwW21ldGFLZXldID8/IHt9LCBwcm9wZXJ0aWVzKVxuXHRcdFx0XHRcdH07XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRhd2FpdCBkcml2ZXIuc2V0SXRlbXMobWV0YVVwZGF0ZXMpO1xuXHRcdFx0fSkpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlSXRlbTogYXN5bmMgKGtleSwgb3B0cykgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0YXdhaXQgcmVtb3ZlSXRlbShkcml2ZXIsIGRyaXZlcktleSwgb3B0cyk7XG5cdFx0fSxcblx0XHRyZW1vdmVJdGVtczogYXN5bmMgKGtleXMpID0+IHtcblx0XHRcdGNvbnN0IGFyZWFUb0tleXNNYXAgPSB7fTtcblx0XHRcdGtleXMuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRcdGxldCBrZXlTdHI7XG5cdFx0XHRcdGxldCBvcHRzO1xuXHRcdFx0XHRpZiAodHlwZW9mIGtleSA9PT0gXCJzdHJpbmdcIikga2V5U3RyID0ga2V5O1xuXHRcdFx0XHRlbHNlIGlmIChcImdldFZhbHVlXCIgaW4ga2V5KSBrZXlTdHIgPSBrZXkua2V5O1xuXHRcdFx0XHRlbHNlIGlmIChcIml0ZW1cIiBpbiBrZXkpIHtcblx0XHRcdFx0XHRrZXlTdHIgPSBrZXkuaXRlbS5rZXk7XG5cdFx0XHRcdFx0b3B0cyA9IGtleS5vcHRpb25zO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGtleVN0ciA9IGtleS5rZXk7XG5cdFx0XHRcdFx0b3B0cyA9IGtleS5vcHRpb25zO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGNvbnN0IHsgZHJpdmVyQXJlYSwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleVN0cik7XG5cdFx0XHRcdGFyZWFUb0tleXNNYXBbZHJpdmVyQXJlYV0gPz89IFtdO1xuXHRcdFx0XHRhcmVhVG9LZXlzTWFwW2RyaXZlckFyZWFdLnB1c2goZHJpdmVyS2V5KTtcblx0XHRcdFx0aWYgKG9wdHM/LnJlbW92ZU1ldGEpIGFyZWFUb0tleXNNYXBbZHJpdmVyQXJlYV0ucHVzaChnZXRNZXRhS2V5KGRyaXZlcktleSkpO1xuXHRcdFx0fSk7XG5cdFx0XHRhd2FpdCBQcm9taXNlLmFsbChPYmplY3QuZW50cmllcyhhcmVhVG9LZXlzTWFwKS5tYXAoYXN5bmMgKFtkcml2ZXJBcmVhLCBrZXlzXSkgPT4ge1xuXHRcdFx0XHRhd2FpdCBnZXREcml2ZXIoZHJpdmVyQXJlYSkucmVtb3ZlSXRlbXMoa2V5cyk7XG5cdFx0XHR9KSk7XG5cdFx0fSxcblx0XHRjbGVhcjogYXN5bmMgKGJhc2UpID0+IHtcblx0XHRcdGF3YWl0IGdldERyaXZlcihiYXNlKS5jbGVhcigpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlTWV0YTogYXN5bmMgKGtleSwgcHJvcGVydGllcykgPT4ge1xuXHRcdFx0Y29uc3QgeyBkcml2ZXIsIGRyaXZlcktleSB9ID0gcmVzb2x2ZUtleShrZXkpO1xuXHRcdFx0YXdhaXQgcmVtb3ZlTWV0YShkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcyk7XG5cdFx0fSxcblx0XHRzbmFwc2hvdDogYXN5bmMgKGJhc2UsIG9wdHMpID0+IHtcblx0XHRcdGNvbnN0IGRhdGEgPSBhd2FpdCBnZXREcml2ZXIoYmFzZSkuc25hcHNob3QoKTtcblx0XHRcdG9wdHM/LmV4Y2x1ZGVLZXlzPy5mb3JFYWNoKChrZXkpID0+IHtcblx0XHRcdFx0ZGVsZXRlIGRhdGFba2V5XTtcblx0XHRcdFx0ZGVsZXRlIGRhdGFbZ2V0TWV0YUtleShrZXkpXTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGRhdGE7XG5cdFx0fSxcblx0XHRyZXN0b3JlU25hcHNob3Q6IGFzeW5jIChiYXNlLCBkYXRhKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXREcml2ZXIoYmFzZSkucmVzdG9yZVNuYXBzaG90KGRhdGEpO1xuXHRcdH0sXG5cdFx0d2F0Y2g6IChrZXksIGNiKSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRyZXR1cm4gd2F0Y2goZHJpdmVyLCBkcml2ZXJLZXksIGNiKTtcblx0XHR9LFxuXHRcdHVud2F0Y2goKSB7XG5cdFx0XHRPYmplY3QudmFsdWVzKGRyaXZlcnMpLmZvckVhY2goKGRyaXZlcikgPT4ge1xuXHRcdFx0XHRkcml2ZXIudW53YXRjaCgpO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRkZWZpbmVJdGVtOiAoa2V5LCBvcHRzKSA9PiB7XG5cdFx0XHRjb25zdCB7IGRyaXZlciwgZHJpdmVyS2V5IH0gPSByZXNvbHZlS2V5KGtleSk7XG5cdFx0XHRjb25zdCB7IHZlcnNpb246IHRhcmdldFZlcnNpb24gPSAxLCBtaWdyYXRpb25zID0ge30sIG9uTWlncmF0aW9uQ29tcGxldGUsIGRlYnVnID0gZmFsc2UgfSA9IG9wdHMgPz8ge307XG5cdFx0XHRpZiAodGFyZ2V0VmVyc2lvbiA8IDEpIHRocm93IEVycm9yKFwiU3RvcmFnZSBpdGVtIHZlcnNpb24gY2Fubm90IGJlIGxlc3MgdGhhbiAxLiBJbml0aWFsIHZlcnNpb25zIHNob3VsZCBiZSBzZXQgdG8gMSwgbm90IDAuXCIpO1xuXHRcdFx0bGV0IG5lZWRzVmVyc2lvblNldCA9IGZhbHNlO1xuXHRcdFx0Y29uc3QgbWlncmF0ZSA9IGFzeW5jICgpID0+IHtcblx0XHRcdFx0Y29uc3QgZHJpdmVyTWV0YUtleSA9IGdldE1ldGFLZXkoZHJpdmVyS2V5KTtcblx0XHRcdFx0Y29uc3QgW3sgdmFsdWUgfSwgeyB2YWx1ZTogbWV0YSB9XSA9IGF3YWl0IGRyaXZlci5nZXRJdGVtcyhbZHJpdmVyS2V5LCBkcml2ZXJNZXRhS2V5XSk7XG5cdFx0XHRcdG5lZWRzVmVyc2lvblNldCA9IHZhbHVlID09IG51bGwgJiYgbWV0YT8udiA9PSBudWxsICYmICEhdGFyZ2V0VmVyc2lvbjtcblx0XHRcdFx0aWYgKHZhbHVlID09IG51bGwpIHJldHVybjtcblx0XHRcdFx0Y29uc3QgY3VycmVudFZlcnNpb24gPSBtZXRhPy52ID8/IDE7XG5cdFx0XHRcdGlmIChjdXJyZW50VmVyc2lvbiA+IHRhcmdldFZlcnNpb24pIHRocm93IEVycm9yKGBWZXJzaW9uIGRvd25ncmFkZSBkZXRlY3RlZCAodiR7Y3VycmVudFZlcnNpb259IC0+IHYke3RhcmdldFZlcnNpb259KSBmb3IgXCIke2tleX1cImApO1xuXHRcdFx0XHRpZiAoY3VycmVudFZlcnNpb24gPT09IHRhcmdldFZlcnNpb24pIHJldHVybjtcblx0XHRcdFx0aWYgKGRlYnVnKSBjb25zb2xlLmRlYnVnKGBbQHd4dC1kZXYvc3RvcmFnZV0gUnVubmluZyBzdG9yYWdlIG1pZ3JhdGlvbiBmb3IgJHtrZXl9OiB2JHtjdXJyZW50VmVyc2lvbn0gLT4gdiR7dGFyZ2V0VmVyc2lvbn1gKTtcblx0XHRcdFx0Y29uc3QgbWlncmF0aW9uc1RvUnVuID0gQXJyYXkuZnJvbSh7IGxlbmd0aDogdGFyZ2V0VmVyc2lvbiAtIGN1cnJlbnRWZXJzaW9uIH0sIChfLCBpKSA9PiBjdXJyZW50VmVyc2lvbiArIGkgKyAxKTtcblx0XHRcdFx0bGV0IG1pZ3JhdGVkVmFsdWUgPSB2YWx1ZTtcblx0XHRcdFx0Zm9yIChjb25zdCBtaWdyYXRlVG9WZXJzaW9uIG9mIG1pZ3JhdGlvbnNUb1J1bikgdHJ5IHtcblx0XHRcdFx0XHRtaWdyYXRlZFZhbHVlID0gYXdhaXQgbWlncmF0aW9ucz8uW21pZ3JhdGVUb1ZlcnNpb25dPy4obWlncmF0ZWRWYWx1ZSkgPz8gbWlncmF0ZWRWYWx1ZTtcblx0XHRcdFx0XHRpZiAoZGVidWcpIGNvbnNvbGUuZGVidWcoYFtAd3h0LWRldi9zdG9yYWdlXSBTdG9yYWdlIG1pZ3JhdGlvbiBwcm9jZXNzZWQgZm9yIHZlcnNpb246IHYke21pZ3JhdGVUb1ZlcnNpb259YCk7XG5cdFx0XHRcdH0gY2F0Y2ggKGVycikge1xuXHRcdFx0XHRcdHRocm93IG5ldyBNaWdyYXRpb25FcnJvcihrZXksIG1pZ3JhdGVUb1ZlcnNpb24sIHsgY2F1c2U6IGVyciB9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRhd2FpdCBkcml2ZXIuc2V0SXRlbXMoW3tcblx0XHRcdFx0XHRrZXk6IGRyaXZlcktleSxcblx0XHRcdFx0XHR2YWx1ZTogbWlncmF0ZWRWYWx1ZVxuXHRcdFx0XHR9LCB7XG5cdFx0XHRcdFx0a2V5OiBkcml2ZXJNZXRhS2V5LFxuXHRcdFx0XHRcdHZhbHVlOiB7XG5cdFx0XHRcdFx0XHQuLi5tZXRhLFxuXHRcdFx0XHRcdFx0djogdGFyZ2V0VmVyc2lvblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fV0pO1xuXHRcdFx0XHRpZiAoZGVidWcpIGNvbnNvbGUuZGVidWcoYFtAd3h0LWRldi9zdG9yYWdlXSBTdG9yYWdlIG1pZ3JhdGlvbiBjb21wbGV0ZWQgZm9yICR7a2V5fSB2JHt0YXJnZXRWZXJzaW9ufWAsIHsgbWlncmF0ZWRWYWx1ZSB9KTtcblx0XHRcdFx0b25NaWdyYXRpb25Db21wbGV0ZT8uKG1pZ3JhdGVkVmFsdWUsIHRhcmdldFZlcnNpb24pO1xuXHRcdFx0fTtcblx0XHRcdGNvbnN0IG1pZ3JhdGlvbnNEb25lID0gb3B0cz8ubWlncmF0aW9ucyA9PSBudWxsID8gUHJvbWlzZS5yZXNvbHZlKCkgOiBtaWdyYXRlKCkuY2F0Y2goKGVycikgPT4ge1xuXHRcdFx0XHRjb25zb2xlLmVycm9yKGBbQHd4dC1kZXYvc3RvcmFnZV0gTWlncmF0aW9uIGZhaWxlZCBmb3IgJHtrZXl9YCwgZXJyKTtcblx0XHRcdH0pO1xuXHRcdFx0Y29uc3QgaW5pdExvY2sgPSB3aXRoTG9jaygpO1xuXHRcdFx0Y29uc3QgZ2V0RmFsbGJhY2sgPSAoKSA9PiBvcHRzPy5mYWxsYmFjayA/PyBvcHRzPy5kZWZhdWx0VmFsdWUgPz8gbnVsbDtcblx0XHRcdGNvbnN0IGdldE9ySW5pdFZhbHVlID0gKCkgPT4gaW5pdExvY2soYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRjb25zdCB2YWx1ZSA9IGF3YWl0IGRyaXZlci5nZXRJdGVtKGRyaXZlcktleSk7XG5cdFx0XHRcdGlmICh2YWx1ZSAhPSBudWxsIHx8IG9wdHM/LmluaXQgPT0gbnVsbCkgcmV0dXJuIHZhbHVlO1xuXHRcdFx0XHRjb25zdCBuZXdWYWx1ZSA9IGF3YWl0IG9wdHMuaW5pdCgpO1xuXHRcdFx0XHRhd2FpdCBkcml2ZXIuc2V0SXRlbShkcml2ZXJLZXksIG5ld1ZhbHVlKTtcblx0XHRcdFx0aWYgKHZhbHVlID09IG51bGwgJiYgdGFyZ2V0VmVyc2lvbiA+IDEpIGF3YWl0IHNldE1ldGEoZHJpdmVyLCBkcml2ZXJLZXksIHsgdjogdGFyZ2V0VmVyc2lvbiB9KTtcblx0XHRcdFx0cmV0dXJuIG5ld1ZhbHVlO1xuXHRcdFx0fSk7XG5cdFx0XHRtaWdyYXRpb25zRG9uZS50aGVuKGdldE9ySW5pdFZhbHVlKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGtleSxcblx0XHRcdFx0Z2V0IGRlZmF1bHRWYWx1ZSgpIHtcblx0XHRcdFx0XHRyZXR1cm4gZ2V0RmFsbGJhY2soKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Z2V0IGZhbGxiYWNrKCkge1xuXHRcdFx0XHRcdHJldHVybiBnZXRGYWxsYmFjaygpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRnZXRWYWx1ZTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdGlmIChvcHRzPy5pbml0KSByZXR1cm4gYXdhaXQgZ2V0T3JJbml0VmFsdWUoKTtcblx0XHRcdFx0XHRlbHNlIHJldHVybiBhd2FpdCBnZXRJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0Z2V0TWV0YTogYXN5bmMgKCkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdHJldHVybiBhd2FpdCBnZXRNZXRhKGRyaXZlciwgZHJpdmVyS2V5KTtcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V0VmFsdWU6IGFzeW5jICh2YWx1ZSkgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdGlmIChuZWVkc1ZlcnNpb25TZXQpIHtcblx0XHRcdFx0XHRcdG5lZWRzVmVyc2lvblNldCA9IGZhbHNlO1xuXHRcdFx0XHRcdFx0YXdhaXQgUHJvbWlzZS5hbGwoW3NldEl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIHZhbHVlKSwgc2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSwgeyB2OiB0YXJnZXRWZXJzaW9uIH0pXSk7XG5cdFx0XHRcdFx0fSBlbHNlIGF3YWl0IHNldEl0ZW0oZHJpdmVyLCBkcml2ZXJLZXksIHZhbHVlKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0c2V0TWV0YTogYXN5bmMgKHByb3BlcnRpZXMpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgc2V0TWV0YShkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHJlbW92ZVZhbHVlOiBhc3luYyAob3B0cykgPT4ge1xuXHRcdFx0XHRcdGF3YWl0IG1pZ3JhdGlvbnNEb25lO1xuXHRcdFx0XHRcdHJldHVybiBhd2FpdCByZW1vdmVJdGVtKGRyaXZlciwgZHJpdmVyS2V5LCBvcHRzKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0cmVtb3ZlTWV0YTogYXN5bmMgKHByb3BlcnRpZXMpID0+IHtcblx0XHRcdFx0XHRhd2FpdCBtaWdyYXRpb25zRG9uZTtcblx0XHRcdFx0XHRyZXR1cm4gYXdhaXQgcmVtb3ZlTWV0YShkcml2ZXIsIGRyaXZlcktleSwgcHJvcGVydGllcyk7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdHdhdGNoOiAoY2IpID0+IHdhdGNoKGRyaXZlciwgZHJpdmVyS2V5LCAobmV3VmFsdWUsIG9sZFZhbHVlKSA9PiBjYihuZXdWYWx1ZSA/PyBnZXRGYWxsYmFjaygpLCBvbGRWYWx1ZSA/PyBnZXRGYWxsYmFjaygpKSksXG5cdFx0XHRcdG1pZ3JhdGVcblx0XHRcdH07XG5cdFx0fVxuXHR9O1xufVxuZnVuY3Rpb24gY3JlYXRlRHJpdmVyKHN0b3JhZ2VBcmVhKSB7XG5cdGNvbnN0IGdldFN0b3JhZ2VBcmVhID0gKCkgPT4ge1xuXHRcdGlmIChicm93c2VyLnJ1bnRpbWUgPT0gbnVsbCkgdGhyb3cgRXJyb3IoYCd3eHQvc3RvcmFnZScgbXVzdCBiZSBsb2FkZWQgaW4gYSB3ZWIgZXh0ZW5zaW9uIGVudmlyb25tZW50XG5cbiAtIElmIHRocm93biBkdXJpbmcgYSBidWlsZCwgc2VlIGh0dHBzOi8vZ2l0aHViLmNvbS93eHQtZGV2L3d4dC9pc3N1ZXMvMzcxXG4gLSBJZiB0aHJvd24gZHVyaW5nIHRlc3RzLCBtb2NrICd3eHQvYnJvd3NlcicgY29ycmVjdGx5LiBTZWUgaHR0cHM6Ly93eHQuZGV2L2d1aWRlL2dvLWZ1cnRoZXIvdGVzdGluZy5odG1sXG5gKTtcblx0XHRpZiAoYnJvd3Nlci5zdG9yYWdlID09IG51bGwpIHRocm93IEVycm9yKFwiWW91IG11c3QgYWRkIHRoZSAnc3RvcmFnZScgcGVybWlzc2lvbiB0byB5b3VyIG1hbmlmZXN0IHRvIHVzZSAnd3h0L3N0b3JhZ2UnXCIpO1xuXHRcdGNvbnN0IGFyZWEgPSBicm93c2VyLnN0b3JhZ2Vbc3RvcmFnZUFyZWFdO1xuXHRcdGlmIChhcmVhID09IG51bGwpIHRocm93IEVycm9yKGBcImJyb3dzZXIuc3RvcmFnZS4ke3N0b3JhZ2VBcmVhfVwiIGlzIHVuZGVmaW5lZGApO1xuXHRcdHJldHVybiBhcmVhO1xuXHR9O1xuXHRjb25zdCB3YXRjaExpc3RlbmVycyA9IC8qIEBfX1BVUkVfXyAqLyBuZXcgU2V0KCk7XG5cdHJldHVybiB7XG5cdFx0Z2V0SXRlbTogYXN5bmMgKGtleSkgPT4ge1xuXHRcdFx0cmV0dXJuIChhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldChrZXkpKVtrZXldO1xuXHRcdH0sXG5cdFx0Z2V0SXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG5cdFx0XHRjb25zdCByZXN1bHQgPSBhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmdldChrZXlzKTtcblx0XHRcdHJldHVybiBrZXlzLm1hcCgoa2V5KSA9PiAoe1xuXHRcdFx0XHRrZXksXG5cdFx0XHRcdHZhbHVlOiByZXN1bHRba2V5XSA/PyBudWxsXG5cdFx0XHR9KSk7XG5cdFx0fSxcblx0XHRzZXRJdGVtOiBhc3luYyAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0aWYgKHZhbHVlID09IG51bGwpIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkucmVtb3ZlKGtleSk7XG5cdFx0XHRlbHNlIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkuc2V0KHsgW2tleV06IHZhbHVlIH0pO1xuXHRcdH0sXG5cdFx0c2V0SXRlbXM6IGFzeW5jICh2YWx1ZXMpID0+IHtcblx0XHRcdGNvbnN0IG1hcCA9IHZhbHVlcy5yZWR1Y2UoKG1hcCwgeyBrZXksIHZhbHVlIH0pID0+IHtcblx0XHRcdFx0bWFwW2tleV0gPSB2YWx1ZTtcblx0XHRcdFx0cmV0dXJuIG1hcDtcblx0XHRcdH0sIHt9KTtcblx0XHRcdGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkuc2V0KG1hcCk7XG5cdFx0fSxcblx0XHRyZW1vdmVJdGVtOiBhc3luYyAoa2V5KSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnJlbW92ZShrZXkpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlSXRlbXM6IGFzeW5jIChrZXlzKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnJlbW92ZShrZXlzKTtcblx0XHR9LFxuXHRcdGNsZWFyOiBhc3luYyAoKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLmNsZWFyKCk7XG5cdFx0fSxcblx0XHRzbmFwc2hvdDogYXN5bmMgKCkgPT4ge1xuXHRcdFx0cmV0dXJuIGF3YWl0IGdldFN0b3JhZ2VBcmVhKCkuZ2V0KCk7XG5cdFx0fSxcblx0XHRyZXN0b3JlU25hcHNob3Q6IGFzeW5jIChkYXRhKSA9PiB7XG5cdFx0XHRhd2FpdCBnZXRTdG9yYWdlQXJlYSgpLnNldChkYXRhKTtcblx0XHR9LFxuXHRcdHdhdGNoKGtleSwgY2IpIHtcblx0XHRcdGNvbnN0IGxpc3RlbmVyID0gKGNoYW5nZXMpID0+IHtcblx0XHRcdFx0Y29uc3QgY2hhbmdlID0gY2hhbmdlc1trZXldO1xuXHRcdFx0XHRpZiAoY2hhbmdlID09IG51bGwgfHwgZGVxdWFsKGNoYW5nZS5uZXdWYWx1ZSwgY2hhbmdlLm9sZFZhbHVlKSkgcmV0dXJuO1xuXHRcdFx0XHRjYihjaGFuZ2UubmV3VmFsdWUgPz8gbnVsbCwgY2hhbmdlLm9sZFZhbHVlID8/IG51bGwpO1xuXHRcdFx0fTtcblx0XHRcdGdldFN0b3JhZ2VBcmVhKCkub25DaGFuZ2VkLmFkZExpc3RlbmVyKGxpc3RlbmVyKTtcblx0XHRcdHdhdGNoTGlzdGVuZXJzLmFkZChsaXN0ZW5lcik7XG5cdFx0XHRyZXR1cm4gKCkgPT4ge1xuXHRcdFx0XHRnZXRTdG9yYWdlQXJlYSgpLm9uQ2hhbmdlZC5yZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcik7XG5cdFx0XHRcdHdhdGNoTGlzdGVuZXJzLmRlbGV0ZShsaXN0ZW5lcik7XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0dW53YXRjaCgpIHtcblx0XHRcdHdhdGNoTGlzdGVuZXJzLmZvckVhY2goKGxpc3RlbmVyKSA9PiB7XG5cdFx0XHRcdGdldFN0b3JhZ2VBcmVhKCkub25DaGFuZ2VkLnJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKTtcblx0XHRcdH0pO1xuXHRcdFx0d2F0Y2hMaXN0ZW5lcnMuY2xlYXIoKTtcblx0XHR9XG5cdH07XG59XG52YXIgTWlncmF0aW9uRXJyb3IgPSBjbGFzcyBleHRlbmRzIEVycm9yIHtcblx0Y29uc3RydWN0b3Ioa2V5LCB2ZXJzaW9uLCBvcHRpb25zKSB7XG5cdFx0c3VwZXIoYHYke3ZlcnNpb259IG1pZ3JhdGlvbiBmYWlsZWQgZm9yIFwiJHtrZXl9XCJgLCBvcHRpb25zKTtcblx0XHR0aGlzLmtleSA9IGtleTtcblx0XHR0aGlzLnZlcnNpb24gPSB2ZXJzaW9uO1xuXHR9XG59O1xuLy8jZW5kcmVnaW9uXG5leHBvcnQgeyBNaWdyYXRpb25FcnJvciwgc3RvcmFnZSB9O1xuIiwiZXhwb3J0IGludGVyZmFjZSBTZXR0aW5ncyB7XG4gIGFjdGl2ZVByb3ZpZGVySWQ6IHN0cmluZztcbiAgLyoqIExhbmd1YWdlIGNvZGVzIHNob3duIGluIHRoZSBpbi1wYWdlIG1lbnUsIGluIG9yZGVyLiAqL1xuICBmYXZvcml0ZUxhbmd1YWdlczogc3RyaW5nW107XG4gIC8qKiBQcm92aWRlci1zcGVjaWZpYyBjb25maWcgKEFQSSBrZXlzLCBtb2RlbHMsIC4uLikga2V5ZWQgYnkgcHJvdmlkZXIgaWQuICovXG4gIHByb3ZpZGVyQ29uZmlnczogUmVjb3JkPHN0cmluZywgdW5rbm93bj47XG59XG5cbmV4cG9ydCBjb25zdCBERUZBVUxUX1NFVFRJTkdTOiBTZXR0aW5ncyA9IHtcbiAgYWN0aXZlUHJvdmlkZXJJZDogJ2FwaScsXG4gIGZhdm9yaXRlTGFuZ3VhZ2VzOiBbJ2VuJywgJ3VrJywgJ2RlJywgJ2VzJywgJ2ZyJ10sXG4gIHByb3ZpZGVyQ29uZmlnczoge30sXG59O1xuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzUmVhZGVyIHtcbiAgZ2V0KCk6IFByb21pc2U8U2V0dGluZ3M+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIFNldHRpbmdzUmVwb3NpdG9yeSBleHRlbmRzIFNldHRpbmdzUmVhZGVyIHtcbiAgdXBkYXRlKHBhdGNoOiBQYXJ0aWFsPFNldHRpbmdzPik6IFByb21pc2U8U2V0dGluZ3M+O1xufVxuIiwiaW1wb3J0IHsgc3RvcmFnZSB9IGZyb20gJ3d4dC91dGlscy9zdG9yYWdlJztcbmltcG9ydCB7IERFRkFVTFRfU0VUVElOR1MsIHR5cGUgU2V0dGluZ3MsIHR5cGUgU2V0dGluZ3NSZXBvc2l0b3J5IH0gZnJvbSAnLi9zZXR0aW5ncyc7XG5cbmNvbnN0IHNldHRpbmdzSXRlbSA9IHN0b3JhZ2UuZGVmaW5lSXRlbTxTZXR0aW5ncz4oJ2xvY2FsOnNldHRpbmdzJywge1xuICBmYWxsYmFjazogREVGQVVMVF9TRVRUSU5HUyxcbn0pO1xuXG5leHBvcnQgY29uc3Qgc3RvcmFnZVNldHRpbmdzOiBTZXR0aW5nc1JlcG9zaXRvcnkgPSB7XG4gIGFzeW5jIGdldCgpIHtcbiAgICAvLyBNZXJnZSBzbyBzZXR0aW5ncyBzYXZlZCBieSBvbGRlciB2ZXJzaW9ucyBwaWNrIHVwIG5ld2x5IGFkZGVkIGZpZWxkcy5cbiAgICByZXR1cm4geyAuLi5ERUZBVUxUX1NFVFRJTkdTLCAuLi4oYXdhaXQgc2V0dGluZ3NJdGVtLmdldFZhbHVlKCkpIH07XG4gIH0sXG4gIGFzeW5jIHVwZGF0ZShwYXRjaCkge1xuICAgIGNvbnN0IG5leHQgPSB7IC4uLihhd2FpdCB0aGlzLmdldCgpKSwgLi4ucGF0Y2ggfTtcbiAgICBhd2FpdCBzZXR0aW5nc0l0ZW0uc2V0VmFsdWUobmV4dCk7XG4gICAgcmV0dXJuIG5leHQ7XG4gIH0sXG59O1xuIiwiaW1wb3J0IHsgYnJvd3NlciB9IGZyb20gJ3d4dC9icm93c2VyJztcbmltcG9ydCB7IGRlZmluZUJhY2tncm91bmQgfSBmcm9tICd3eHQvdXRpbHMvZGVmaW5lLWJhY2tncm91bmQnO1xuaW1wb3J0IHsgVHJhbnNsYXRvclJlZ2lzdHJ5IH0gZnJvbSAnLi4vY29yZS9yZWdpc3RyeSc7XG5pbXBvcnQgeyBUcmFuc2xhdGlvbkVycm9yIH0gZnJvbSAnLi4vY29yZS90cmFuc2xhdG9yJztcbmltcG9ydCB7IFRyYW5zbGF0aW9uU2VydmljZSB9IGZyb20gJy4uL2NvcmUvdHJhbnNsYXRpb24tc2VydmljZSc7XG5pbXBvcnQgeyBpc01lc3NhZ2UsIHR5cGUgTWVzc2FnZSwgdHlwZSBSZXNwb25zZSB9IGZyb20gJy4uL21lc3NhZ2luZy9tZXNzYWdlcyc7XG5pbXBvcnQgeyByZWdpc3RlclByb3ZpZGVycyB9IGZyb20gJy4uL3Byb3ZpZGVycyc7XG5pbXBvcnQgeyBzdG9yYWdlU2V0dGluZ3MgfSBmcm9tICcuLi9zZXR0aW5ncy9zdG9yYWdlLXNldHRpbmdzJztcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQmFja2dyb3VuZCgoKSA9PiB7XG4gIC8vIENvbXBvc2l0aW9uIHJvb3Q6IHRoZSBvbmx5IHBsYWNlIGNvbmNyZXRlIHByb3ZpZGVycyBhbmQgc3RvcmFnZSBhcmUgd2lyZWQgaW4uXG4gIGNvbnN0IHJlZ2lzdHJ5ID0gcmVnaXN0ZXJQcm92aWRlcnMobmV3IFRyYW5zbGF0b3JSZWdpc3RyeSgpKTtcbiAgY29uc3QgdHJhbnNsYXRpb25TZXJ2aWNlID0gbmV3IFRyYW5zbGF0aW9uU2VydmljZShyZWdpc3RyeSwgc3RvcmFnZVNldHRpbmdzKTtcblxuICBhc3luYyBmdW5jdGlvbiBoYW5kbGUobWVzc2FnZTogTWVzc2FnZSk6IFByb21pc2U8UmVzcG9uc2U8dW5rbm93bj4+IHtcbiAgICB0cnkge1xuICAgICAgc3dpdGNoIChtZXNzYWdlLnR5cGUpIHtcbiAgICAgICAgY2FzZSAndHJhbnNsYXRlJzpcbiAgICAgICAgICByZXR1cm4geyBvazogdHJ1ZSwgZGF0YTogYXdhaXQgdHJhbnNsYXRpb25TZXJ2aWNlLnRyYW5zbGF0ZShtZXNzYWdlLnRleHQsIG1lc3NhZ2UudGFyZ2V0TGFuZykgfTtcbiAgICAgICAgY2FzZSAnbGlzdC1wcm92aWRlcnMnOlxuICAgICAgICAgIHJldHVybiB7IG9rOiB0cnVlLCBkYXRhOiByZWdpc3RyeS5saXN0KCkgfTtcbiAgICAgICAgY2FzZSAnb3Blbi1vcHRpb25zJzpcbiAgICAgICAgICBhd2FpdCBicm93c2VyLnJ1bnRpbWUub3Blbk9wdGlvbnNQYWdlKCk7XG4gICAgICAgICAgcmV0dXJuIHsgb2s6IHRydWUsIGRhdGE6IHVuZGVmaW5lZCB9O1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBUcmFuc2xhdGlvbkVycm9yKSB7XG4gICAgICAgIHJldHVybiB7IG9rOiBmYWxzZSwgZXJyb3I6IHsgbWVzc2FnZTogZXJyb3IubWVzc2FnZSwgY29kZTogZXJyb3IuY29kZSB9IH07XG4gICAgICB9XG4gICAgICByZXR1cm4geyBvazogZmFsc2UsIGVycm9yOiB7IG1lc3NhZ2U6IGVycm9yIGluc3RhbmNlb2YgRXJyb3IgPyBlcnJvci5tZXNzYWdlIDogU3RyaW5nKGVycm9yKSB9IH07XG4gICAgfVxuICB9XG5cbiAgYnJvd3Nlci5ydW50aW1lLm9uTWVzc2FnZS5hZGRMaXN0ZW5lcigobWVzc2FnZSwgX3NlbmRlciwgc2VuZFJlc3BvbnNlKSA9PiB7XG4gICAgaWYgKCFpc01lc3NhZ2UobWVzc2FnZSkpIHJldHVybjtcbiAgICBoYW5kbGUobWVzc2FnZSkudGhlbihzZW5kUmVzcG9uc2UpO1xuICAgIHJldHVybiB0cnVlOyAvLyBrZWVwIHRoZSBjaGFubmVsIG9wZW4gZm9yIHRoZSBhc3luYyByZXNwb25zZVxuICB9KTtcblxuICBicm93c2VyLmFjdGlvbi5vbkNsaWNrZWQuYWRkTGlzdGVuZXIoKCkgPT4ge1xuICAgIGJyb3dzZXIucnVudGltZS5vcGVuT3B0aW9uc1BhZ2UoKTtcbiAgfSk7XG5cbiAgaWYgKGltcG9ydC5tZXRhLmVudi5ERVYpIHZvaWQgcmVsb2FkUGxheWdyb3VuZFdoZW5SZWFkeSgpO1xufSk7XG5cbi8qKlxuICogSW4gZGV2LCBXWFQgcmVnaXN0ZXJzIGNvbnRlbnQgc2NyaXB0cyBhdCBydW50aW1lLCBhZnRlciB0aGUgc3RhcnQtVVJMIHRhYiBoYXNcbiAqIGFscmVhZHkgbG9hZGVkLCBzbyB0aGF0IHRhYiBoYXMgbm8gY29udGVudCBzY3JpcHQuIFJlbG9hZCBpdCBvbmNlIHRoZXkgZXhpc3QuXG4gKi9cbmFzeW5jIGZ1bmN0aW9uIHJlbG9hZFBsYXlncm91bmRXaGVuUmVhZHkoKTogUHJvbWlzZTx2b2lkPiB7XG4gIGZvciAobGV0IGF0dGVtcHQgPSAwOyBhdHRlbXB0IDwgNTA7IGF0dGVtcHQrKykge1xuICAgIGlmICgoYXdhaXQgYnJvd3Nlci5zY3JpcHRpbmcuZ2V0UmVnaXN0ZXJlZENvbnRlbnRTY3JpcHRzKCkpLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHRhYnMgPSBhd2FpdCBicm93c2VyLnRhYnMucXVlcnkoeyB1cmw6ICdodHRwOi8vMTI3LjAuMC4xOjU1NTUvKicgfSk7XG4gICAgICBhd2FpdCBQcm9taXNlLmFsbCh0YWJzLm1hcCgodGFiKSA9PiB0YWIuaWQgIT09IHVuZGVmaW5lZCAmJiBicm93c2VyLnRhYnMucmVsb2FkKHRhYi5pZCkpKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgYXdhaXQgbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHNldFRpbWVvdXQocmVzb2x2ZSwgMjAwKSk7XG4gIH1cbn1cbiIsIi8vI3JlZ2lvbiBzcmMvaW5kZXgudHNcbi8qKlxuKiBDbGFzcyBmb3IgcGFyc2luZyBhbmQgcGVyZm9ybWluZyBvcGVyYXRpb25zIG9uIG1hdGNoIHBhdHRlcm5zLlxuKlxuKiBAZXhhbXBsZVxuKiAgIGNvbnN0IHBhdHRlcm4gPSBuZXcgTWF0Y2hQYXR0ZXJuKCcqOi8vZ29vZ2xlLmNvbS8qJyk7XG4qXG4qICAgcGF0dGVybi5pbmNsdWRlcygnaHR0cHM6Ly9nb29nbGUuY29tJyk7IC8vIHRydWVcbiogICBwYXR0ZXJuLmluY2x1ZGVzKCdodHRwOi8veW91dHViZS5jb20vd2F0Y2g/dj0xMjMnKTsgLy8gZmFsc2VcbiovXG52YXIgTWF0Y2hQYXR0ZXJuID0gY2xhc3MgTWF0Y2hQYXR0ZXJuIHtcblx0c3RhdGljIHtcblx0XHR0aGlzLlBST1RPQ09MUyA9IFtcblx0XHRcdFwiaHR0cFwiLFxuXHRcdFx0XCJodHRwc1wiLFxuXHRcdFx0XCJmaWxlXCIsXG5cdFx0XHRcImZ0cFwiLFxuXHRcdFx0XCJ1cm5cIixcblx0XHRcdFwid3NcIixcblx0XHRcdFwid3NzXCJcblx0XHRdO1xuXHR9XG5cdC8qKlxuXHQqIFBhcnNlIGEgbWF0Y2ggcGF0dGVybiBzdHJpbmcuIElmIGl0IGlzIGludmFsaWQsIHRoZSBjb25zdHJ1Y3RvciB3aWxsIHRocm93IGFuXG5cdCogYEludmFsaWRNYXRjaFBhdHRlcm5gIGVycm9yLlxuXHQqXG5cdCogQHBhcmFtIG1hdGNoUGF0dGVybiBUaGUgbWF0Y2ggcGF0dGVybiB0byBwYXJzZS5cblx0Ki9cblx0Y29uc3RydWN0b3IobWF0Y2hQYXR0ZXJuKSB7XG5cdFx0aWYgKG1hdGNoUGF0dGVybiA9PT0gXCI8YWxsX3VybHM+XCIpIHtcblx0XHRcdHRoaXMuaXNBbGxVcmxzID0gdHJ1ZTtcblx0XHRcdHRoaXMucHJvdG9jb2xNYXRjaGVzID0gWy4uLk1hdGNoUGF0dGVybi5QUk9UT0NPTFNdO1xuXHRcdFx0dGhpcy5ob3N0bmFtZU1hdGNoID0gXCIqXCI7XG5cdFx0XHR0aGlzLnBhdGhuYW1lTWF0Y2ggPSBcIipcIjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Y29uc3QgZ3JvdXBzID0gLyguKik6XFwvXFwvKC4qPykoXFwvLiopLy5leGVjKG1hdGNoUGF0dGVybik7XG5cdFx0XHRpZiAoZ3JvdXBzID09IG51bGwpIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgXCJJbmNvcnJlY3QgZm9ybWF0XCIpO1xuXHRcdFx0Y29uc3QgW18sIHByb3RvY29sLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gZ3JvdXBzO1xuXHRcdFx0dmFsaWRhdGVQcm90b2NvbChtYXRjaFBhdHRlcm4sIHByb3RvY29sKTtcblx0XHRcdHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSk7XG5cdFx0XHR0aGlzLnByb3RvY29sTWF0Y2hlcyA9IHByb3RvY29sID09PSBcIipcIiA/IFtcImh0dHBcIiwgXCJodHRwc1wiXSA6IFtwcm90b2NvbF07XG5cdFx0XHR0aGlzLmhvc3RuYW1lTWF0Y2ggPSBob3N0bmFtZTtcblx0XHRcdHRoaXMucGF0aG5hbWVNYXRjaCA9IHBhdGhuYW1lO1xuXHRcdH1cblx0fVxuXHQvKiogQ2hlY2sgaWYgYSBVUkwgaXMgaW5jbHVkZWQgaW4gYSBwYXR0ZXJuLiAqL1xuXHRpbmNsdWRlcyh1cmwpIHtcblx0XHRjb25zdCB1ID0gdHlwZW9mIHVybCA9PT0gXCJzdHJpbmdcIiA/IG5ldyBVUkwodXJsKSA6IHVybCBpbnN0YW5jZW9mIExvY2F0aW9uID8gbmV3IFVSTCh1cmwuaHJlZikgOiB1cmw7XG5cdFx0aWYgKHRoaXMuaXNBbGxVcmxzKSByZXR1cm4gIXRoaXMuaXNVbmtub3duUHJvdG9jb2wodSk7XG5cdFx0cmV0dXJuICEhdGhpcy5wcm90b2NvbE1hdGNoZXMuZmluZCgocHJvdG9jb2wpID0+IHtcblx0XHRcdGlmIChwcm90b2NvbCA9PT0gXCJodHRwXCIpIHJldHVybiB0aGlzLmlzSHR0cE1hdGNoKHUpO1xuXHRcdFx0aWYgKHByb3RvY29sID09PSBcImh0dHBzXCIpIHJldHVybiB0aGlzLmlzSHR0cHNNYXRjaCh1KTtcblx0XHRcdGlmIChwcm90b2NvbCA9PT0gXCJmaWxlXCIpIHJldHVybiB0aGlzLmlzRmlsZU1hdGNoKHUpO1xuXHRcdFx0aWYgKHByb3RvY29sID09PSBcImZ0cFwiKSByZXR1cm4gdGhpcy5pc0Z0cE1hdGNoKHUpO1xuXHRcdFx0aWYgKHByb3RvY29sID09PSBcInVyblwiKSByZXR1cm4gdGhpcy5pc1Vybk1hdGNoKHUpO1xuXHRcdH0pO1xuXHR9XG5cdGlzSHR0cE1hdGNoKHVybCkge1xuXHRcdHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiaHR0cDpcIiAmJiB0aGlzLmlzSG9zdFBhdGhNYXRjaCh1cmwpO1xuXHR9XG5cdGlzSHR0cHNNYXRjaCh1cmwpIHtcblx0XHRyZXR1cm4gdXJsLnByb3RvY29sID09PSBcImh0dHBzOlwiICYmIHRoaXMuaXNIb3N0UGF0aE1hdGNoKHVybCk7XG5cdH1cblx0aXNIb3N0UGF0aE1hdGNoKHVybCkge1xuXHRcdGlmICghdGhpcy5ob3N0bmFtZU1hdGNoIHx8ICF0aGlzLnBhdGhuYW1lTWF0Y2gpIHJldHVybiBmYWxzZTtcblx0XHRjb25zdCBob3N0bmFtZU1hdGNoUmVnZXhzID0gW3RoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaCksIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMuaG9zdG5hbWVNYXRjaC5yZXBsYWNlKC9eXFwqXFwuLywgXCJcIikpXTtcblx0XHRjb25zdCBwYXRobmFtZU1hdGNoUmVnZXggPSB0aGlzLmNvbnZlcnRQYXR0ZXJuVG9SZWdleCh0aGlzLnBhdGhuYW1lTWF0Y2gpO1xuXHRcdHJldHVybiAhIWhvc3RuYW1lTWF0Y2hSZWdleHMuZmluZCgocmVnZXgpID0+IHJlZ2V4LnRlc3QodXJsLmhvc3RuYW1lKSkgJiYgcGF0aG5hbWVNYXRjaFJlZ2V4LnRlc3QodXJsLnBhdGhuYW1lKTtcblx0fVxuXHRpc1Vua25vd25Qcm90b2NvbCh1cmwpIHtcblx0XHRyZXR1cm4gIXRoaXMucHJvdG9jb2xNYXRjaGVzLmluY2x1ZGVzKHVybC5wcm90b2NvbC5zbGljZSgwLCAtMSkpO1xuXHR9XG5cdGlzUGF0aE1hdGNoKHVybCkge1xuXHRcdGlmICghdGhpcy5wYXRobmFtZU1hdGNoKSByZXR1cm4gZmFsc2U7XG5cdFx0cmV0dXJuIHRoaXMuY29udmVydFBhdHRlcm5Ub1JlZ2V4KHRoaXMucGF0aG5hbWVNYXRjaCkudGVzdCh1cmwucGF0aG5hbWUpO1xuXHR9XG5cdGlzRmlsZU1hdGNoKHVybCkge1xuXHRcdHJldHVybiB1cmwucHJvdG9jb2wgPT09IFwiZmlsZTpcIiAmJiB0aGlzLmlzUGF0aE1hdGNoKHVybCk7XG5cdH1cblx0aXNGdHBNYXRjaChfdXJsKSB7XG5cdFx0dGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IGZ0cDovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG5cdH1cblx0aXNVcm5NYXRjaChfdXJsKSB7XG5cdFx0dGhyb3cgRXJyb3IoXCJOb3QgaW1wbGVtZW50ZWQ6IHVybjovLyBwYXR0ZXJuIG1hdGNoaW5nLiBPcGVuIGEgUFIgdG8gYWRkIHN1cHBvcnRcIik7XG5cdH1cblx0Y29udmVydFBhdHRlcm5Ub1JlZ2V4KHBhdHRlcm4pIHtcblx0XHRjb25zdCBzdGFyc1JlcGxhY2VkID0gdGhpcy5lc2NhcGVGb3JSZWdleChwYXR0ZXJuKS5yZXBsYWNlKC9cXFxcXFwqL2csIFwiLipcIik7XG5cdFx0cmV0dXJuIFJlZ0V4cChgXiR7c3RhcnNSZXBsYWNlZH0kYCk7XG5cdH1cblx0ZXNjYXBlRm9yUmVnZXgoc3RyaW5nKSB7XG5cdFx0cmV0dXJuIHN0cmluZy5yZXBsYWNlKC9bLiorP14ke30oKXxbXFxdXFxcXF0vZywgXCJcXFxcJCZcIik7XG5cdH1cbn07XG52YXIgSW52YWxpZE1hdGNoUGF0dGVybiA9IGNsYXNzIGV4dGVuZHMgRXJyb3Ige1xuXHRjb25zdHJ1Y3RvcihtYXRjaFBhdHRlcm4sIHJlYXNvbikge1xuXHRcdHN1cGVyKGBJbnZhbGlkIG1hdGNoIHBhdHRlcm4gXCIke21hdGNoUGF0dGVybn1cIjogJHtyZWFzb259YCk7XG5cdH1cbn07XG5mdW5jdGlvbiB2YWxpZGF0ZVByb3RvY29sKG1hdGNoUGF0dGVybiwgcHJvdG9jb2wpIHtcblx0aWYgKCFNYXRjaFBhdHRlcm4uUFJPVE9DT0xTLmluY2x1ZGVzKHByb3RvY29sKSAmJiBwcm90b2NvbCAhPT0gXCIqXCIpIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYCR7cHJvdG9jb2x9IG5vdCBhIHZhbGlkIHByb3RvY29sICgke01hdGNoUGF0dGVybi5QUk9UT0NPTFMuam9pbihcIiwgXCIpfSlgKTtcbn1cbmZ1bmN0aW9uIHZhbGlkYXRlSG9zdG5hbWUobWF0Y2hQYXR0ZXJuLCBob3N0bmFtZSkge1xuXHRpZiAoaG9zdG5hbWUuaW5jbHVkZXMoXCI6XCIpKSB0aHJvdyBuZXcgSW52YWxpZE1hdGNoUGF0dGVybihtYXRjaFBhdHRlcm4sIGBIb3N0bmFtZSBjYW5ub3QgaW5jbHVkZSBhIHBvcnRgKTtcblx0aWYgKGhvc3RuYW1lLmluY2x1ZGVzKFwiKlwiKSAmJiBob3N0bmFtZS5sZW5ndGggPiAxICYmICFob3N0bmFtZS5zdGFydHNXaXRoKFwiKi5cIikpIHRocm93IG5ldyBJbnZhbGlkTWF0Y2hQYXR0ZXJuKG1hdGNoUGF0dGVybiwgYElmIHVzaW5nIGEgd2lsZGNhcmQgKCopLCBpdCBtdXN0IGdvIGF0IHRoZSBzdGFydCBvZiB0aGUgaG9zdG5hbWVgKTtcbn1cbi8vI2VuZHJlZ2lvblxuZXhwb3J0IHsgSW52YWxpZE1hdGNoUGF0dGVybiwgTWF0Y2hQYXR0ZXJuIH07XG4iXSwieF9nb29nbGVfaWdub3JlTGlzdCI6WzAsMSwyLDEwLDExLDEyLDE2XSwibWFwcGluZ3MiOiI7Ozs7O0NBQ0EsSUFBYUEsWUFBVSxXQUFXLFNBQVMsU0FBUyxLQUNoRCxXQUFXLFVBQ1gsV0FBVzs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0NhZixJQUFNLFVBQVU7OztDQ2ZoQixTQUFTLGlCQUFpQixLQUFLO0VBQzlCLElBQUksT0FBTyxRQUFRLE9BQU8sUUFBUSxZQUFZLE9BQU8sRUFBRSxNQUFNLElBQUk7RUFDakUsT0FBTztDQUNSOzs7Q0MwQkEsSUFBYSxtQkFBYixjQUFzQyxNQUFNO0VBRy9CO0VBRlgsWUFDRSxTQUNBLE1BQ0EsU0FDQTtHQUNBLE1BQU0sU0FBUyxPQUFPO0dBSGIsS0FBQSxPQUFBO0dBSVQsS0FBSyxPQUFPO0VBQ2Q7Q0FDRjs7O0NDaENBLElBQWEscUJBQWIsTUFBZ0M7RUFDOUIsNEJBQTZCLElBQUksSUFBK0I7RUFFaEUsU0FBUyxTQUFrQztHQUN6QyxJQUFJLEtBQUssVUFBVSxJQUFJLFFBQVEsRUFBRSxHQUMvQixNQUFNLElBQUksTUFBTSx3QkFBd0IsUUFBUSxHQUFHLHdCQUF3QjtHQUU3RSxLQUFLLFVBQVUsSUFBSSxRQUFRLElBQUksT0FBTztHQUN0QyxPQUFPO0VBQ1Q7RUFFQSxJQUFJLElBQStCO0dBQ2pDLE1BQU0sVUFBVSxLQUFLLFVBQVUsSUFBSSxFQUFFO0dBQ3JDLElBQUksQ0FBQyxTQUNILE1BQU0sSUFBSSxpQkFDUix3QkFBd0IsR0FBRyxvRUFDM0Isa0JBQ0Y7R0FFRixPQUFPO0VBQ1Q7RUFFQSxPQUF1QjtHQUNyQixPQUFPLENBQUMs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