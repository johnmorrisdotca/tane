// The seed explorer. Everything it shows is made by the package, from the seed in the box.
import { STRINGS, dailySeed, deriveSeed, fillIn, freshSeed, fromJSON, fromText, int, mulberry32, nextDayStart, pick, randomAt, seedFrom, shuffled, stateAt, toCSV, toJSON, toText } from "./dist/index.js";

const $ = (id) => document.getElementById(id);
const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
const MOST_ROWS = 100;
const ITEMS = "Ada Grace Alan Edsger Barbara Donald";

// The page's words are the package's own table, under the names the shared header and footer ask for.
const words = (lang) => ({ ...STRINGS[lang], pageApi: lang === "en" ? "API reference" : "API（英語）", pitch: STRINGS[lang].pagePitch, name: STRINGS[lang].pageName, nameLink: STRINGS[lang].pageNameLink, foot: STRINGS[lang].pageFoot });
const language = familyLanguage({ id: "tane", words: { en: words("en"), ja: words("ja") }, onChange: () => draw() });
const t = () => STRINGS[language.lang];

// What the address says, or today's seed.
const asked = new URLSearchParams(location.search);
const state = {
  typed: asked.get("seed") ?? String(dailySeed(new Date())),
  items: asked.get("items") ?? ITEMS,
  skip: 0,
  shown: 5,
  form: "text",
};
{
  const draws = Number(asked.get("draws"));
  if (Number.isSafeInteger(draws) && draws > 0) place(draws);
}

/** Show the rows that end at a number of draws: all of them while they fit, the last ten past that. */
function place(draws) {
  if (draws <= MOST_ROWS) [state.skip, state.shown] = [0, Math.max(draws, 1)];
  else [state.skip, state.shown] = [draws - 10, 10];
}

const el = (tag, text, attributes = {}) => {
  const made = document.createElement(tag);
  made.textContent = text;
  for (const [name, value] of Object.entries(attributes)) made.setAttribute(name, value);
  return made;
};
const left = (until) => {
  const ms = Math.max(0, until.getTime() - Date.now());
  const two = (n) => String(n).padStart(2, "0");
  return `${Math.floor(ms / 3_600_000)}:${two(Math.floor(ms / 60_000) % 60)}:${two(Math.floor(ms / 1000) % 60)}`;
};

function draw() {
  const seed = seedFrom(state.typed);
  const position = { seed, draws: state.skip + state.shown };
  if ($("seed").value !== state.typed) $("seed").value = state.typed;
  if ($("items").value !== state.items) $("items").value = state.items;
  $("seed-number").textContent = seed;
  $("seed-says").textContent = String(seed) === state.typed.trim() ? fillIn(t().pageSeedNumber, { seed }) : fillIn(t().pageSeedText, { text: state.typed.trim(), seed });

  // Its numbers, from where the rows start.
  const random = randomAt(seed, state.skip);
  $("numbers").replaceChildren(
    ...Array.from({ length: state.shown }, (_, i) => {
      const row = document.createElement("tr");
      row.append(el("td", state.skip + i + 1, { "data-number": "true" }), el("td", random()), el("td", stateAt(seed, state.skip + i + 1), { "data-number": "true" }));
      return row;
    }),
  );
  $("position").textContent = fillIn(t().pagePosition, { draws: position.draws });
  $("more").disabled = state.shown >= MOST_ROWS;

  // A shuffle and a pick, each from the seed's own start.
  const items = state.items.split(/[\s,]+/).filter((item) => item !== "");
  $("shuffled").replaceChildren(...shuffled(mulberry32(seed), items).map((item) => el("li", item, { class: "fam-chip" })));
  $("picked").textContent = items.length === 0 ? "" : fillIn(t().pagePicked, { item: pick(mulberry32(seed), items) });

  // A part of its own.
  const dice = mulberry32(deriveSeed(seed, "dice"));
  $("dice").replaceChildren(...Array.from({ length: 8 }, () => el("span", int(dice, 1, 6), { class: "die" })));

  // The position, three ways.
  for (const tab of document.querySelectorAll("[data-form]")) tab.setAttribute("aria-selected", String(tab.dataset.form === state.form));
  $("kept").textContent = state.form === "text" ? toText(position) : state.form === "json" ? toJSON(position) : toCSV({ seed, draws: state.skip }, state.shown).replaceAll("\r\n", "\n");

  $("zone-note").textContent = fillIn(t().pageTodayHereNote, { zone: zone.replaceAll("_", " ") });
  $("zone-code").textContent = `dailySeed(new Date(), "${zone}")`;
  tick();

  // The address is the link: the seed, and whatever differs from a first visit.
  const query = new URLSearchParams();
  if (language.asked !== null) query.set("lang", language.asked);
  query.set("seed", state.typed.trim());
  if (state.items !== ITEMS) query.set("items", state.items);
  if (position.draws !== 5) query.set("draws", position.draws);
  history.replaceState(null, "", `?${query}`);
}

function tick() {
  const now = new Date();
  $("utc-seed").textContent = dailySeed(now);
  $("utc-left").textContent = left(nextDayStart(now));
  $("zone-seed").textContent = dailySeed(now, zone);
  $("zone-left").textContent = left(nextDayStart(now, zone));
}

function setSeed(typed) {
  state.typed = String(typed);
  state.skip = 0;
  state.shown = 5;
  draw();
}

/** Put text on the clipboard and say so on the button for a moment. */
async function copy(button, text, label) {
  let said = t().pageCopied;
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    said = t().pageCopyFailed;
  }
  button.textContent = said;
  button.dataset.said = "true";
  setTimeout(() => {
    button.textContent = t()[label];
    delete button.dataset.said;
  }, 1500);
}

$("seed").addEventListener("input", () => setSeed($("seed").value));
$("items").addEventListener("input", () => {
  state.items = $("items").value;
  draw();
});
$("today").addEventListener("click", () => setSeed(dailySeed(new Date())));
$("fresh").addEventListener("click", () => setSeed(freshSeed()));
$("share").addEventListener("click", () => copy($("share"), location.href, "pageCopyLink"));
$("more").addEventListener("click", () => {
  state.shown = Math.min(MOST_ROWS, state.shown + 10);
  draw();
});
for (const tab of document.querySelectorAll("[data-form]")) {
  tab.addEventListener("click", () => {
    state.form = tab.dataset.form;
    draw();
  });
}
$("copy").addEventListener("click", () => copy($("copy"), $("kept").textContent, "pageCopy"));
const read = () => {
  const text = $("paste").value;
  const position = fromText(text) ?? fromJSON(text);
  $("read-error").textContent = position === null ? t().pageReadBad : "";
  $("paste").setAttribute("aria-invalid", String(position === null));
  if (position === null) return;
  state.typed = String(position.seed);
  place(position.draws);
  $("paste").value = "";
  draw();
};
$("read").addEventListener("click", read);
$("paste").addEventListener("keydown", (event) => event.key === "Enter" && read());

draw();
setInterval(tick, 1000);
