import { mulberry32, type Random } from "./random.ts";
import { seedFrom } from "./seeds.ts";
import { dailySeed } from "./daily.ts";
import { sample, shuffled, weightedIndex } from "./draws.ts";
import { embedDay } from "./embed-day.ts";
const ElementBase = typeof HTMLElement === "undefined" ? class {} as typeof HTMLElement : HTMLElement;
const isOn = (value: string | null, fallback = true): boolean => value === null ? fallback : !["off", "false", "no", "0"].includes(value.trim().toLowerCase());
/**
 * Reads a bounded list, one item per line or a JSON string array.
 * @param text - The list, or null for the example list.
 * @returns Trimmed nonempty items, or null for malformed, empty or oversized input.
 * @example
 * ```ts
 * import { parsePickerItems } from "@johnmorrisdotca/tane/element";
 * console.log(parsePickerItems("A\nB\nC"));
 * ```
 */
export function parsePickerItems(text: string | null): string[] | null {
  if (text === null) return ["A", "B", "C"];
  if (text.length > 20000) return null;
  try {
    const value: unknown = text.trim().startsWith("[") ? JSON.parse(text) : text.split(/\r?\n/).map(item => item.trim()).filter(Boolean);
    if (!Array.isArray(value) || value.length < 1 || value.length > 200 || !value.every(item => typeof item === "string" && item.trim() !== "" && item.length <= 200)) return null;
    return value.map(item => String(item).trim());
  } catch { return null; }
}
/**
 * The picker modes: sample without replacement, shuffled list or balanced groups.
 * @example
 * ```ts
 * import type { TanePickerMode } from "@johnmorrisdotca/tane/element";
 * const mode: TanePickerMode = "groups";
 * console.log(mode);
 * ```
 */
export type TanePickerMode = "pick" | "shuffle" | "groups";
/**
 * Native event detail: list indices instead of names or other item text.
 * @example
 * ```ts
 * import type { TanePickDetail } from "@johnmorrisdotca/tane/element";
 * const result: TanePickDetail = { seed: 1, mode: "pick", indices: [0], groups: [] };
 * console.log(result.indices);
 * ```
 */
export type TanePickDetail = { seed: number | null; mode: TanePickerMode; indices: number[]; groups: number[][] };
/**
 * Host data, a native random stream, optional weights and a result callback.
 * @example
 * ```ts
 * import type { TanePickerOptions } from "@johnmorrisdotca/tane/element";
 * const options: TanePickerOptions = { items: ["A", "B"], seed: 42 };
 * console.log(options.items?.length);
 * ```
 */
export type TanePickerOptions = {
  /** Host items when the items attribute is absent. */
  items?: readonly string[];
  /** Host seed when the seed attribute is absent; daily takes priority. */
  seed?: string | number;
  /** A host stream when no seed or daily attribute is supplied. */
  random?: Random;
  /** Nonnegative weights for picking; shuffles and groups remain uniform. */
  weights?: readonly number[];
  /** Called with the same index-only detail as the native event. */
  onPick?: (detail: TanePickDetail) => void;
};
/**
 * Actual host option keys, checked by the builder.
 * @example
 * ```ts
 * import { TANE_EMBED_OPTION_KEYS } from "@johnmorrisdotca/tane/element";
 * console.log(TANE_EMBED_OPTION_KEYS);
 * ```
 */
export const TANE_EMBED_OPTION_KEYS = Object.keys({ items: true, seed: true, random: true, weights: true, onPick: true } satisfies Record<keyof TanePickerOptions, boolean>);
/**
 * A seeded item picker and group maker, using the native random and draw functions.
 * @example
 * ```ts
 * import { TanePicker } from "@johnmorrisdotca/tane/element";
 * console.log(TanePicker.observedAttributes.includes("items"));
 * ```
 */
export class TanePicker extends ElementBase {
  static observedAttributes = ["items", "seed", "daily", "mode", "count", "group-count", "controls", "lang", "theme", "size", "width", "label"];
  #options: TanePickerOptions = {};
  #items: string[] = [];
  #stream: Random = mulberry32(1);
  #seed = 1;
  #hostStream = false;
  #mode: TanePickerMode = "pick";
  #count = 1;
  #groupCount = 2;
  #result: TanePickDetail | null = null;
  #key = "";
  #root: HTMLDivElement | null = null;
  #output: HTMLDivElement | null = null;
  #button: HTMLButtonElement | null = null;
  #widthBefore: string | null = null;
  #widthOwned = false;
  #labelBefore: { role: string | null; label: string | null } | null = null;
  /** Host items, weights, stream and callbacks. Callback changes preserve the stream. */
  get options(): TanePickerOptions { return this.#options; }
  set options(value: TanePickerOptions) { if (value?.random !== this.#options.random) this.#key = ""; this.#options = value ?? {}; if (this.isConnected) this.#refresh(); }
  /** A copy of the structured index-only result, or null after invalid input. */
  get result(): TanePickDetail | null { return this.#result === null ? null : JSON.parse(JSON.stringify(this.#result)) as TanePickDetail; }
  /** Chosen item text, available locally to trusted host code. */
  get selection(): string[] | string[][] { const result = this.#result; return result === null ? [] : result.mode === "groups" ? result.groups.map(group => group.map(index => this.#items[index]!)) : result.indices.map(index => this.#items[index]!); }
  connectedCallback(): void { this.#refresh(); }
  attributeChangedCallback(): void { if (this.isConnected) this.#refresh(); }
  #write(name: string, value: unknown): void { if (value === null || value === undefined) this.removeAttribute(name); else this.setAttribute(name, String(value)); }
  /** The list attribute, reflected. Assigning an array serializes it as JSON. */
  get items(): string | null { return this.getAttribute("items"); }
  set items(value: string | readonly string[] | null) { this.#write("items", Array.isArray(value) ? JSON.stringify(value) : value); }
  /** The `seed` attribute, reflected. */
  get seed(): string | null { return this.getAttribute("seed"); }
  set seed(value: string | number | boolean | null | undefined) { this.#write("seed", value); }
  /** The `daily` attribute, reflected. */
  get daily(): string | null { return this.getAttribute("daily"); }
  set daily(value: string | number | boolean | null | undefined) { this.#write("daily", value); }
  /** The `mode` attribute, reflected. */
  get mode(): string | null { return this.getAttribute("mode"); }
  set mode(value: string | number | boolean | null | undefined) { this.#write("mode", value); }
  /** The `count` attribute, reflected. */
  get count(): string | null { return this.getAttribute("count"); }
  set count(value: string | number | boolean | null | undefined) { this.#write("count", value); }
  /** The `group-count` attribute, reflected. */
  get groupCount(): string | null { return this.getAttribute("group-count"); }
  set groupCount(value: string | number | boolean | null | undefined) { this.#write("group-count", value); }
  /** The `controls` attribute, reflected. */
  get controls(): string | null { return this.getAttribute("controls"); }
  set controls(value: string | number | boolean | null | undefined) { this.#write("controls", value); }
  /** The `theme` attribute, reflected. */
  get theme(): string | null { return this.getAttribute("theme"); }
  set theme(value: string | number | boolean | null | undefined) { this.#write("theme", value); }
  /** The `size` attribute, reflected. */
  get size(): string | null { return this.getAttribute("size"); }
  set size(value: string | number | boolean | null | undefined) { this.#write("size", value); }
  /** The `width` attribute, reflected. */
  get width(): string | null { return this.getAttribute("width"); }
  set width(value: string | number | boolean | null | undefined) { this.#write("width", value); }
  /** The `label` attribute, reflected. */
  get label(): string | null { return this.getAttribute("label"); }
  set label(value: string | number | boolean | null | undefined) { this.#write("label", value); }
  #frame(): void {
    this.style.display = "block"; this.style.maxWidth = "100%";
    const width = Number(this.getAttribute("width")), size = this.getAttribute("size");
    const pixels = this.hasAttribute("width") && width > 0 && Number.isFinite(width) ? Math.min(width, 2000) : size === "small" ? 320 : size === "medium" ? 480 : size === "large" ? 640 : null;
    if (pixels !== null) { if (!this.#widthOwned) this.#widthBefore = this.style.width; this.#widthOwned = true; this.style.width = `${pixels}px`; }
    else if (this.#widthOwned) { this.style.width = this.#widthBefore ?? ""; this.#widthOwned = false; }
    const theme = this.getAttribute("theme"); this.style.colorScheme = theme === "light" || theme === "dark" ? theme : "light dark";
    this.setAttribute("data-tane-embed", "");
    if (this.hasAttribute("label")) { this.#labelBefore ??= { role: this.getAttribute("role"), label: this.getAttribute("aria-label") }; this.setAttribute("role", "group"); this.setAttribute("aria-label", this.getAttribute("label")!); }
    else if (this.#labelBefore !== null) { for (const [name, value] of [["role", this.#labelBefore.role], ["aria-label", this.#labelBefore.label]]) { if (value === null) this.removeAttribute(name!); else this.setAttribute(name!, value!); } this.#labelBefore = null; }
  }
  #configure(): boolean {
    const items = this.hasAttribute("items") ? parsePickerItems(this.getAttribute("items")) : this.#options.items === undefined ? parsePickerItems(null) : parsePickerItems(JSON.stringify(this.#options.items));
    if (items === null) throw new RangeError("Use 1–200 nonempty items, one per line or in a JSON string array.");
    const mode = this.getAttribute("mode") ?? "pick"; if (mode !== "pick" && mode !== "shuffle" && mode !== "groups") throw new RangeError("Choose pick, shuffle or groups.");
    const n = (name: string, fallback: number): number => this.hasAttribute(name) ? Number(this.getAttribute(name)) : fallback;
    const count = n("count", 1), groups = n("group-count", 2);
    if (!Number.isInteger(count) || count < 1 || count > 200 || !Number.isInteger(groups) || groups < 1 || groups > 20) throw new RangeError("Use a whole pick count from 1–200 and group count from 1–20.");
    const day = embedDay(this.getAttribute("daily")), seed = day === null ? seedFrom(this.getAttribute("seed") ?? this.#options.seed ?? 1) : dailySeed(new Date(`${day}T00:00:00Z`));
    const weights = this.#options.weights;
    if (weights !== undefined && (weights.length !== items.length || !weights.every(value => Number.isFinite(value) && value >= 0) || !Number.isFinite(weights.reduce((sum, value) => sum + value, 0)))) throw new RangeError("Weights must be nonnegative finite numbers, one per item.");
    const key = JSON.stringify([items, mode, count, groups, seed, day, weights]); if (key === this.#key) return false;
    this.#key = key; this.#items = items; this.#mode = mode; this.#count = count; this.#groupCount = groups; this.#seed = seed;
    this.#hostStream = this.#options.random !== undefined && this.#options.seed === undefined && !this.hasAttribute("seed") && day === null;
    this.#stream = this.#hostStream ? this.#options.random! : mulberry32(seed);
    return true;
  }
  #take(): void {
    const indices = this.#items.map((_item, index) => index); let selected: number[], groups: number[][] = [];
    if (this.#mode === "pick") {
      if (this.#options.weights === undefined) selected = sample(this.#stream, indices, this.#count);
      else {
        selected = []; const pool = [...indices], weights = [...this.#options.weights];
        for (let i = 0; i < Math.min(this.#count, indices.length); i++) { const at = weightedIndex(this.#stream, weights); selected.push(pool.splice(at, 1)[0]!); weights.splice(at, 1); }
      }
    } else {
      selected = shuffled(this.#stream, indices);
      if (this.#mode === "groups") { groups = Array.from({ length: Math.min(this.#groupCount, indices.length) }, () => [] as number[]); selected.forEach((index, at) => groups[at % groups.length]!.push(index)); }
    }
    this.#result = { seed: this.#hostStream ? null : this.#seed, mode: this.#mode, indices: selected, groups }; this.#render(); const detail = this.result!;
    this.dispatchEvent(new CustomEvent("tane-pick", { bubbles: true, composed: true, detail: this.result })); this.#options.onPick?.(detail);
  }
  /** Advances the native stream and displays the next selection or groups. */
  pick(): TanePickDetail | null { try { this.#configure(); this.#take(); } catch (error) { this.#problem(error); } return this.result; }
  /** Restarts the current seed and displays its first draw again. Host streams remain host-owned. */
  reset(): void { this.#key = ""; this.#refresh(); }
  #render(): void {
    this.#frame(); const doc = this.ownerDocument;
    if (this.#root === null || this.#root.parentNode !== this) {
      const style = doc.createElement("style"); style.textContent = '[data-tane-embed] .tn-picker{font:18px/1.6 system-ui,sans-serif;color:light-dark(#1f2320,#ece8dc);background:light-dark(#fbf8f1,#1d201e);border:1px solid light-dark(#ddd6c6,#3a3d38);border-radius:12px;padding:16px;box-sizing:border-box;overflow-wrap:anywhere}[data-tane-embed] .tn-picker button{min-width:44px;min-height:44px;font:inherit;padding:8px 16px}[data-tane-embed] .tn-picker ol{padding-left:1.5em}[data-tane-embed] .tn-picker h3{font-size:1em;margin:12px 0}[data-tane-embed] .tn-picker [hidden]{display:none}';
      this.#root = doc.createElement("div"); this.#root.className = "tn-picker"; this.#button = doc.createElement("button"); this.#button.type = "button"; this.#button.addEventListener("click", () => this.pick()); this.#output = doc.createElement("div"); this.#output.setAttribute("role", "status"); this.#output.setAttribute("aria-live", "polite"); this.#root.append(this.#button, this.#output); this.replaceChildren(style, this.#root);
    }
    const ja = (this.getAttribute("lang") ?? doc.documentElement.lang) === "ja";
    this.#button!.textContent = this.#mode === "pick" ? ja ? "選ぶ" : "Pick" : this.#mode === "shuffle" ? ja ? "シャッフル" : "Shuffle" : ja ? "グループ分け" : "Make groups"; this.#button!.hidden = !isOn(this.getAttribute("controls"));
    this.#output!.replaceChildren();
    const list = (indices: readonly number[]): HTMLOListElement => { const ol = doc.createElement("ol"); for (const index of indices) { const li = doc.createElement("li"); li.textContent = this.#items[index]!; ol.append(li); } return ol; };
    if (this.#result?.mode === "groups") this.#result.groups.forEach((group, at) => { const title = doc.createElement("h3"); title.textContent = ja ? `グループ${at + 1}` : `Group ${at + 1}`; this.#output!.append(title, list(group)); });
    else if (this.#result !== null) this.#output!.append(list(this.#result.indices));
  }
  #problem(error: unknown): void { this.#result = null; this.#key = ""; this.#root = null; const message = error instanceof Error ? error.message : String(error), status = this.ownerDocument.createElement("p"); status.setAttribute("role", "status"); status.textContent = message; this.replaceChildren(status); this.dispatchEvent(new CustomEvent("tane-error", { bubbles: true, composed: true, detail: { message } })); }
  #refresh(): void {
    try { const changed = this.#configure(); if (changed || this.#result === null) this.#take(); else this.#render(); this.dispatchEvent(new CustomEvent("tane-load", { bubbles: true, composed: true, detail: this.result })); }
    catch (error) { this.#problem(error); }
  }
}
/**
 * Defines the picker or a subclass under a host's tag; safe on a server.
 * @param tagName - The tag name, tane-picker by default.
 * @param registry - The page registry, or undefined on a server.
 * @returns Nothing; existing definitions are left alone.
 * @example
 * ```ts
 * import { definePicker } from "@johnmorrisdotca/tane/element";
 * definePicker();
 * console.log(typeof definePicker);
 * ```
 */
export function definePicker(tagName = "tane-picker", registry: CustomElementRegistry | undefined = typeof customElements === "undefined" ? undefined : customElements): void { if (registry !== undefined && registry.get(tagName) === undefined) registry.define(tagName, tagName === "tane-picker" ? TanePicker : class extends TanePicker {}); }
