/**
 * EMFI check-in — PC Zilverlinde · afdeling De Meander
 * ------------------------------------------------------------------
 * Prototype van een dagelijkse check-in voor patiënten van een
 * psychiatrische afdeling, met een werkplek voor de begeleiding.
 * Ziekenhuis, afdeling, patiënten en "HErOS+" zijn fictief.
 *
 *  • Patiënt-app    — mobiel ontworpen: Vandaag, Verloop en Rust, met een
 *                     check-in in vijf korte stappen
 *  • Eenvoudig      — één vraag per scherm, grote pictogrammen, voorlezen;
 *                     voor mensen met ASS of een verstandelijke beperking
 *  • Begeleiding    — desktopwerkplek: prioriteitenlijst, detailpaneel,
 *                     rapportering en overdracht
 *
 * Eén bestand, enkel React als afhankelijkheid. `npm run build` maakt
 * er een standalone index.html van.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

/* ════════════════════════════════════════════════════════════════
   Inhoud & data
   ════════════════════════════════════════════════════════════════ */

const ORG = {
  hospital: "PC Zilverlinde",
  ward: "De Meander",
  wardType: "Opname & behandeling volwassenen",
  epd: "HErOS+",
};

const SELF = { id: "robin", firstName: "Robin", name: "Robin L.", room: "Kamer 9" };
const STAFF_USER = { name: "Sofie V.", firstName: "Sofie", role: "Begeleider" };

const MOODS = ["Heel slecht", "Niet goed", "Gaat wel", "Goed", "Heel goed"];
const SLEEP = ["", "Heel slecht", "Slecht", "Gaat wel", "Goed", "Heel goed"];
const DONT_KNOW = "Weet ik niet";
const NOTE_MAX = 500;

/* Elke optie heeft een gewone tekst (value). Opties met `simple` worden ook
   in de eenvoudige modus getoond, met kortere woorden en een pictogram. */
const EMFI = [
  {
    key: "E", name: "Emoties", hint: "Gevoelens", icon: "heart",
    question: "Welk gevoel is nu het sterkst?",
    simpleName: "Gevoel", simpleQuestion: "Welk gevoel heb je nu?", simplePicto: "❤️",
    options: [
      { value: "Blij", simple: "Blij", picto: "😊" },
      { value: "Rustig", simple: "Rustig", picto: "😌" },
      { value: "Hoopvol" },
      { value: "Angstig", simple: "Bang", picto: "😨" },
      { value: "Verdrietig", simple: "Verdrietig", picto: "😢" },
      { value: "Boos", simple: "Boos", picto: "😠" },
      { value: "Verward", simple: "In de war", picto: "😕" },
    ],
  },
  {
    key: "M", name: "Mentaal", hint: "Gedachten & focus", icon: "bulb",
    question: "Hoe is het in je hoofd?",
    simpleName: "Hoofd", simpleQuestion: "Hoe voelt je hoofd?", simplePicto: "💭",
    options: [
      { value: "Helder", simple: "Helder", picto: "💡" },
      { value: "Geconcentreerd" },
      { value: "Piekeren", simple: "Veel piekeren", picto: "🌀" },
      { value: "Vermoeid", simple: "Moe in mijn hoofd", picto: "🥱" },
      { value: "Somber", simple: "Sombere gedachten", picto: "🌧️" },
      { value: "Leeg", simple: "Leeg", picto: "😶" },
      { value: "Overprikkeld", simple: "Te veel prikkels", picto: "😖" },
    ],
  },
  {
    key: "F", name: "Fysiek", hint: "Lichaam & energie", icon: "body",
    question: "Hoe voelt je lichaam?",
    simpleName: "Lichaam", simpleQuestion: "Hoe voelt je lichaam?", simplePicto: "🧍",
    options: [
      { value: "Energiek", simple: "Veel energie", picto: "⚡" },
      { value: "Ontspannen", simple: "Ontspannen", picto: "🧘" },
      { value: "Moe", simple: "Moe", picto: "😴" },
      { value: "Gespannen", simple: "Gespannen", picto: "😬" },
      { value: "Zwaar", simple: "Zwaar", picto: "🪨" },
      { value: "Pijn", simple: "Pijn", picto: "🤕" },
    ],
  },
  {
    key: "I", name: "Interactie", hint: "Contact met anderen", icon: "users",
    question: "Hoe gaat het contact met anderen?",
    simpleName: "Anderen", simpleQuestion: "Hoe gaat het met andere mensen?", simplePicto: "👥",
    options: [
      { value: "Verbonden", simple: "Fijn samen", picto: "🤝" },
      { value: "Sociaal" },
      { value: "Ondersteund", simple: "Ik krijg hulp", picto: "🤗" },
      { value: "Teruggetrokken", simple: "Liever alleen", picto: "🚪" },
      { value: "Eenzaam", simple: "Eenzaam", picto: "😔" },
      { value: "Prikkelbaar", simple: "Snel geïrriteerd", picto: "😤" },
    ],
  },
];

const ACTIVITIES = [
  { value: "Wandelen", icon: "walk" },
  { value: "Groepsactiviteit", icon: "users" },
  { value: "Gesprek", icon: "chat" },
  { value: "Lezen", icon: "book" },
  { value: "Rusten", icon: "bed" },
  { value: "Creatief", icon: "palette" },
  { value: "Samen eten", icon: "utensils" },
  { value: "Muziek", icon: "music" },
];

const FLOW_STEPS = [
  { id: "mood", label: "Stemming", title: "Hoe gaat het met je?", sub: "Alles samen bekeken, op dit moment." },
  { id: "emfi", label: "EMFI", title: "Wat past vandaag bij jou?", sub: "Kies minstens 2 van de 4 gebieden." },
  { id: "day", label: "Je dag", title: "Hoe was je dag tot nu?", sub: "Je nachtrust en wat je gedaan hebt." },
  { id: "note", label: "Begeleider", title: "Wil je nog iets kwijt?", sub: "Dat mag, het hoeft niet." },
  { id: "review", label: "Nakijken", title: "Klopt dit?", sub: "Kijk het even na. Daarna gaat het naar je dossier." },
];

const SIMPLE_STEPS = [
  { id: "mood", name: "Hoe gaat het?", picto: "🙂" },
  ...EMFI.map((d) => ({ id: d.key, name: d.simpleName, picto: d.simplePicto })),
  { id: "sleep", name: "Slapen", picto: "🌙" },
  { id: "talk", name: "Praten", picto: "💬" },
];

/* Vaste dagstructuur van de afdeling: voorspelbaarheid helpt iedereen,
   en zeker mensen met ASS. */
const SCHEDULE = [
  { time: "08:00", title: "Ontbijt", icon: "utensils" },
  { time: "09:30", title: "Bewegingstherapie", sub: "Sportzaal", icon: "walk" },
  { time: "12:00", title: "Middagmaal", icon: "utensils" },
  { time: "13:00", title: "Rustmoment", sub: "Op je kamer", icon: "bed" },
  { time: "14:30", title: "Gesprek met Sofie", sub: "Individueel gesprek", icon: "chat" },
  { time: "16:00", title: "Vrij moment of bezoek", icon: "users" },
  { time: "18:00", title: "Avondmaal", icon: "utensils" },
  { time: "19:30", title: "Spelavond", sub: "Leefruimte", icon: "palette" },
  { time: "21:30", title: "Avondrust", icon: "moon" },
];

/* Uit Robins signaleringsplan, opgesteld samen met de begeleiding. */
const HELPS = [
  { icon: "walk", text: "Even naar buiten, een rondje in de tuin" },
  { icon: "music", text: "Muziek luisteren met mijn koptelefoon" },
  { icon: "chat", text: "Praten met Sofie of iemand anders van het team" },
  { icon: "book", text: "Een paar bladzijden lezen op mijn kamer" },
];

const EMPTY_DRAFT = {
  mood: null, emfi: {}, sleep: 0, activities: [],
  talk: null, thought: "", thoughtPrivate: false,
};

/* Robins check-ins van de voorbije 13 dagen (dagen geleden, stemming, E, M, F, I, slaap, activiteiten). */
const ROBIN_SEED = [
  [13, 1, "Angstig", "Piekeren", "Gespannen", "Teruggetrokken", 2, ["Rusten"]],
  [12, 1, "Verdrietig", "Somber", "Moe", "Teruggetrokken", 2, ["Rusten", "Gesprek"]],
  [11, 2, "Verward", "Piekeren", "Gespannen", "Ondersteund", 3, ["Gesprek", "Lezen"]],
  [10, 2, "Rustig", "Vermoeid", "Moe", "Ondersteund", 3, ["Wandelen"]],
  [9, 1, "Angstig", "Overprikkeld", "Gespannen", "Prikkelbaar", 2, ["Rusten"]],
  [8, 2, "Rustig", "Helder", "Moe", "Verbonden", 3, ["Wandelen", "Muziek"]],
  [7, 3, "Hoopvol", "Helder", "Ontspannen", "Verbonden", 4, ["Wandelen", "Groepsactiviteit"]],
  [6, 2, "Rustig", "Piekeren", "Moe", "Ondersteund", 3, ["Creatief"]],
  [5, 2, "Verdrietig", "Vermoeid", "Zwaar", "Teruggetrokken", 2, ["Rusten", "Lezen"]],
  [4, 3, "Rustig", "Helder", "Energiek", "Sociaal", 4, ["Wandelen", "Samen eten"]],
  [3, 2, "Angstig", "Piekeren", "Gespannen", "Ondersteund", 3, ["Gesprek", "Muziek"]],
  [2, 3, "Blij", "Helder", "Ontspannen", "Verbonden", 4, ["Wandelen", "Creatief"]],
  [1, 2, "Rustig", "Vermoeid", "Moe", "Ondersteund", 3, ["Lezen", "Muziek"]],
];

/* Fictieve afdeling. `history` = stemming van de 6 vorige dagen (0–4),
   `ago` = hoeveel minuten geleden de check-in van vandaag binnenkwam. */
const SEED = [
  { id: "kevin", name: "Kevin D.", room: "Kamer 3", history: [2, 2, 1, 1, 0, 1],
    checkin: { ago: 12, mood: 0, emfi: { E: "Verdrietig", M: "Leeg", F: "Zwaar", I: "Eenzaam" }, sleep: 1,
      activities: ["Rusten"], talk: false, thought: "Wil niet praten vandaag.", mode: "regular" } },
  { id: "thomas", name: "Thomas V.", room: "Kamer 12", history: [3, 3, 3, 2, 2, 1],
    checkin: { ago: 26, mood: 1, emfi: { E: "Angstig", M: "Piekeren", F: "Gespannen", I: "Teruggetrokken" }, sleep: 2,
      activities: ["Rusten", "Lezen"], talk: false, thought: "Sliep slecht, maak me zorgen over morgen.", mode: "regular" } },
  { id: "yasmina", name: "Yasmina B.", room: "Kamer 5", history: [2, 3, 2, 2, 2, 3],
    checkin: { ago: 41, mood: 2, emfi: { E: DONT_KNOW, M: "Overprikkeld", F: "Gespannen", I: "Teruggetrokken" }, sleep: 3,
      activities: [], talk: true, thought: "", mode: "simple" } },
  { id: "jonas", name: "Jonas P.", room: "Kamer 2", history: [3, 3, 4, 3, 4, 4],
    checkin: { ago: 58, mood: 4, emfi: { E: "Blij", M: "Helder", F: "Energiek", I: "Sociaal" }, sleep: 3,
      activities: ["Wandelen", "Gesprek", "Samen eten"], talk: true, thought: "Ik wil graag mijn ontslagplanning bespreken.", mode: "regular" } },
  { id: "sara", name: "Sara M.", room: "Kamer 7", history: [2, 2, 3, 3, 4, 3],
    checkin: { ago: 73, mood: 3, emfi: { E: "Hoopvol", M: "Helder", F: "Energiek", I: "Verbonden" }, sleep: 4,
      activities: ["Wandelen", "Groepsactiviteit"], talk: false, thought: "", mode: "regular" } },
  { id: "lotte", name: "Lotte H.", room: "Kamer 14", history: [1, 2, 2, 3, 3, 3],
    checkin: { ago: 95, mood: 3, emfi: { E: "Rustig", M: "Geconcentreerd", F: "Ontspannen", I: "Ondersteund" }, sleep: 4,
      activities: ["Creatief", "Muziek", "Lezen"], talk: false, thought: "Morgen komt mijn zus op bezoek. Ik kijk ernaar uit.", mode: "regular" } },
  { id: "mehmet", name: "Mehmet A.", room: "Kamer 10", history: [2, 3, 3, 2, 3, 3], checkin: null },
  { id: SELF.id, name: SELF.name, room: SELF.room, isSelf: true },
];

const LEVELS = {
  critical: { label: "Direct opvolgen", icon: "alert", rank: 0 },
  attention: { label: "Opvolgen", icon: "eye", rank: 1 },
  stable: { label: "Stabiel", icon: "check", rank: 2 },
  none: { label: "Geen check-in", icon: "clock", rank: 3 },
};

const FILTERS = [
  { id: "all", label: "Iedereen", test: () => true },
  { id: "signals", label: "Signalen", test: (p) => p.a.level === "critical" || p.a.level === "attention" },
  { id: "talk", label: "Wil een gesprek", test: (p) => !!p.checkin?.talk || (!!p.callAt && !p.callAck) },
  { id: "open", label: "Nog geen check-in", test: (p) => !p.checkin },
];

/* ════════════════════════════════════════════════════════════════
   Domeinlogica
   ════════════════════════════════════════════════════════════════ */

/* Signalen zijn bewust eenvoudige, uitlegbare regels: ze helpen de
   begeleiding prioriteren, maar vervangen het klinisch oordeel niet. */
function assess(p) {
  const signals = [];
  if (p.callAt && !p.callAck) signals.push({ level: "critical", text: `Vraagt nu een begeleider (${fmtTime(p.callAt)})` });
  const c = p.checkin;
  if (!c) return { level: signals.length ? "critical" : "none", signals, streak: 0 };

  const series = [...p.history, c.mood];
  let streak = 0;
  for (let i = series.length - 1; i >= 0 && series[i] != null && series[i] <= 1; i--) streak++;
  const prev = p.history.slice(-3).filter((v) => v != null);
  const prevAvg = average(prev);

  if (c.mood === 0) signals.push({ level: "critical", text: "Heel lage stemming" });
  if (streak >= 3) signals.push({ level: "critical", text: `Lage stemming, ${streak} dagen op rij` });
  else if (streak === 2) signals.push({ level: "attention", text: "Lage stemming, 2 dagen op rij" });
  if (prevAvg !== null && prevAvg - c.mood >= 1.5) signals.push({ level: "attention", text: "Stemming duidelijk gedaald" });
  if (c.sleep && c.sleep <= 2) signals.push({ level: "attention", text: "Slechte nachtrust" });
  if (c.emfi.I === "Eenzaam" || c.emfi.I === "Teruggetrokken") signals.push({ level: "attention", text: "Weinig sociaal contact" });
  if (c.emfi.E === "Angstig" && c.emfi.M === "Piekeren") signals.push({ level: "attention", text: "Angst en piekeren" });
  if (c.emfi.M === "Overprikkeld") signals.push({ level: "attention", text: "Overprikkeld" });
  if (c.emfi.F === "Pijn") signals.push({ level: "attention", text: "Meldt pijn" });

  const level = signals.some((s) => s.level === "critical") ? "critical" : signals.length ? "attention" : "stable";
  return { level, signals, streak };
}

function buildSelfLog(submissions, now) {
  const byDay = new Map();
  ROBIN_SEED.forEach(([ago, mood, E, M, F, I, sleep, activities]) => {
    const at = daysAgo(ago, now);
    at.setHours(16, 20 + ago, 0, 0);
    byDay.set(dayKey(at), { at, mood, emfi: { E, M, F, I }, sleep, activities, talk: false, thought: "", thoughtPrivate: false, mode: "regular", seed: true });
  });
  submissions.forEach((s) => byDay.set(dayKey(s.at), s));
  return [...byDay.values()].sort((a, b) => a.at - b.at);
}

function buildWard(store, selfLog, now, bootTime) {
  const today = selfLog.find((e) => !e.seed && isToday(e.at, now)) || null;
  return SEED.map((p) => {
    if (p.isSelf) {
      const history = [6, 5, 4, 3, 2, 1].map((n) => selfLog.find((e) => dayKey(e.at) === dayKey(daysAgo(n, now)))?.mood ?? null);
      return {
        ...p, history, checkin: today,
        callAt: isToday(store.callAt, now) ? store.callAt : null,
        callAck: isToday(store.callAck, now) ? store.callAck : null,
      };
    }
    return { ...p, checkin: p.checkin && { ...p.checkin, at: new Date(bootTime - p.checkin.ago * 60000) } };
  });
}

function findInsight(entries) {
  if (entries.length < 4) return null;
  let best = null;
  ACTIVITIES.forEach(({ value }) => {
    const w = entries.filter((e) => e.activities.includes(value)).map((e) => e.mood);
    const wo = entries.filter((e) => !e.activities.includes(value)).map((e) => e.mood);
    if (w.length < 2 || wo.length < 2) return;
    const d = average(w) - average(wo);
    if (d >= 0.5 && (!best || d > best.d)) best = { d, value, w: average(w), wo: average(wo) };
  });
  if (best) {
    return {
      title: `Op dagen met ${best.value.toLowerCase()} ging het vaak beter`,
      text: `Je stemming was dan gemiddeld “${MOODS[Math.round(best.w)].toLowerCase()}”. Op de andere dagen was dat “${MOODS[Math.round(best.wo)].toLowerCase()}”.`,
    };
  }
  const good = entries.filter((e) => e.sleep >= 4).map((e) => e.mood);
  const bad = entries.filter((e) => e.sleep && e.sleep <= 2).map((e) => e.mood);
  if (good.length >= 2 && bad.length >= 2 && average(good) - average(bad) >= 0.5) {
    return { title: "Na een goede nacht ging het vaak beter", text: "Op dagen dat je goed sliep, was je stemming meestal hoger." };
  }
  return null;
}

function buildHandover(rows) {
  const lines = (p) => {
    const out = [];
    const c = p.checkin;
    if (p.a.signals.length) out.push(p.a.signals.map((s) => s.text).join(" · "));
    if (c) {
      const e = EMFI.filter((d) => c.emfi[d.key]).map((d) => `${d.key}: ${c.emfi[d.key].toLowerCase()}`);
      if (e.length) out.push(`EMFI — ${e.join(", ")}`);
      if (c.thought && !c.thoughtPrivate) out.push(`“${c.thought}”`);
      if (c.talk) out.push("Vraagt een gesprek.");
    } else {
      out.push(p.remindedAt ? `Herinnering verstuurd om ${fmtTime(p.remindedAt)}.` : "Nog geen herinnering verstuurd.");
    }
    if (p.callAck) out.push(`Vroeg een begeleider om ${fmtTime(p.callAt)}, opgevolgd om ${fmtTime(p.callAck)}.`);
    p.notes.forEach((n) => out.push(`Rapportering ${fmtTime(n.at)} (${n.author}): ${n.text}`));
    if (p.followedAt) out.push(`Opgevolgd om ${fmtTime(p.followedAt)}.`);
    return out;
  };
  const item = (p) => ({ id: p.id, name: p.name, room: p.room, mood: p.checkin?.mood ?? null, lines: lines(p) });
  return [
    { id: "critical", title: "Direct opvolgen", items: rows.filter((r) => r.a.level === "critical").map(item) },
    { id: "attention", title: "Opvolgen", items: rows.filter((r) => r.a.level === "attention").map(item) },
    { id: "none", title: "Nog geen check-in", items: rows.filter((r) => r.a.level === "none").map(item) },
    { id: "stable", title: "Stabiel", items: rows.filter((r) => r.a.level === "stable").map(item) },
  ];
}

function handoverText(sections, now) {
  const head = `Overdracht ${ORG.ward} (${ORG.hospital}) — ${shiftName(now).toLowerCase()}, ${fmtDateLong(now)}, ${fmtTime(now)}`;
  const body = sections.map((s) => {
    const items = s.items.length
      ? s.items.map((it) => [`- ${it.name} (${it.room})${it.mood != null ? ` — ${MOODS[it.mood]}` : ""}`, ...it.lines.map((l) => `  ${l}`)].join("\n")).join("\n")
      : "- Niemand";
    return `${s.title.toUpperCase()}\n${items}`;
  });
  return [head, ...body].join("\n\n");
}

/* ════════════════════════════════════════════════════════════════
   Hulpfuncties
   ════════════════════════════════════════════════════════════════ */

const cx = (...a) => a.filter(Boolean).join(" ");
const DAY_SHORT = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const fmtTime = (d) => d.toLocaleTimeString("nl-BE", { hour: "2-digit", minute: "2-digit" });
const fmtDateLong = (d) => d.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" });
const fmtDayShort = (d) => d.toLocaleDateString("nl-BE", { weekday: "short", day: "numeric", month: "short" });
const fmtNumber = (n, digits = 1) => n.toLocaleString("nl-BE", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const initials = (name) => name.replace(/\./g, "").split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
const firstName = (name) => name.split(" ")[0];
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const average = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null);
const joinNl = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} en ${xs[xs.length - 1]}`);
const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
const isToday = (d, now) => !!d && dayKey(d) === dayKey(now);
const toMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };

function daysAgo(n, now) {
  const d = new Date(now);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return d;
}
const lastDays = (n, now) => Array.from({ length: n }, (_, i) => daysAgo(n - 1 - i, now));

function relTime(date, now) {
  const min = Math.round((now - date) / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  return `${Math.round(min / 60)} uur geleden`;
}

function daypart(d) {
  const h = d.getHours();
  if (h < 12) return { greeting: "Goedemorgen", part: "ochtend" };
  if (h < 18) return { greeting: "Goedemiddag", part: "middag" };
  return { greeting: "Goedenavond", part: "avond" };
}

function shiftName(d) {
  const h = d.getHours();
  if (h >= 7 && h < 15) return "Vroege dienst";
  if (h >= 15 && h < 22) return "Late dienst";
  return "Nachtdienst";
}
function nextShiftName(d) {
  const s = shiftName(d);
  return s === "Vroege dienst" ? "late dienst" : s === "Late dienst" ? "nachtdienst" : "vroege dienst";
}

function focusables(root) {
  return [...root.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), select, [tabindex]:not([tabindex="-1"])')]
    .filter((el) => !el.closest("[inert]") && el.offsetParent !== null);
}
function trapTab(e) {
  if (e.key !== "Tab") return;
  const els = focusables(e.currentTarget);
  if (!els.length) return;
  const first = els[0], last = els[els.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ════════════════════════════════════════════════════════════════
   Hooks
   ════════════════════════════════════════════════════════════════ */

function usePersistentState(key, initial) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw === null ? initial : JSON.parse(raw);
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(key, JSON.stringify(value)); } catch { /* privémodus: niet erg */ }
  }, [key, value]);
  return [value, setValue];
}

const STORE_KEY = "zilverlinde.demo.v2";
const freshStore = () => ({ draft: EMPTY_DRAFT, submissions: [], callAt: null, callAck: null, followed: {}, reminded: {}, notes: {} });

function reviveStore(raw) {
  const date = (v) => (v ? new Date(v) : null);
  const dates = (o) => Object.fromEntries(Object.entries(o || {}).filter(([, v]) => v).map(([k, v]) => [k, new Date(v)]));
  return {
    ...freshStore(),
    draft: { ...EMPTY_DRAFT, ...(raw.draft || {}) },
    submissions: (raw.submissions || []).map((s) => ({ ...s, at: new Date(s.at) })),
    callAt: date(raw.callAt),
    callAck: date(raw.callAck),
    followed: dates(raw.followed),
    reminded: dates(raw.reminded),
    notes: Object.fromEntries(Object.entries(raw.notes || {}).map(([k, list]) => [k, list.map((n) => ({ ...n, at: new Date(n.at) }))])),
  };
}

/* Alles wat de patiënt en de begeleiding doen, blijft op dit toestel bewaard. */
function useStore() {
  const [store, setStore] = useState(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      return raw ? reviveStore(JSON.parse(raw)) : freshStore();
    } catch {
      return freshStore();
    }
  });
  useEffect(() => {
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch { /* niet erg */ }
  }, [store]);
  const patch = useCallback((p) => setStore((s) => ({ ...s, ...(typeof p === "function" ? p(s) : p) })), []);
  return [store, patch, setStore];
}

function useNow(interval = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
}

function useMediaQuery(query) {
  const [match, setMatch] = useState(() => typeof window !== "undefined" && !!window.matchMedia?.(query).matches);
  useEffect(() => {
    const mq = window.matchMedia?.(query);
    if (!mq) return undefined;
    const on = () => setMatch(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, [query]);
  return match;
}

function useInert(ref, inert) {
  useEffect(() => { if (ref.current) ref.current.inert = inert; }, [ref, inert]);
}

/* De terugknop van de telefoon en Escape sluiten eerst het bovenste
   paneel (of gaan een stap terug), in plaats van de app te verlaten.
   Een handler geeft `true` terug als hij open blijft. */
const backStack = [];
let skipPop = 0;
let backListening = false;
function listenBack() {
  if (backListening || typeof window === "undefined") return;
  backListening = true;
  window.addEventListener("popstate", () => {
    if (skipPop > 0) { skipPop--; return; }
    const top = backStack[backStack.length - 1];
    if (!top) return;
    const keep = top.ref.current("back") === true;
    if (keep) { try { window.history.pushState({ zl: backStack.length }, ""); } catch { /* */ } }
    else top.popped = true;
  });
  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape" || e.defaultPrevented) return;
    const top = backStack[backStack.length - 1];
    if (!top) return;
    e.preventDefault();
    top.ref.current("escape");
  });
}
function useBackHandler(active, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!active) return undefined;
    listenBack();
    const entry = { ref, popped: false };
    backStack.push(entry);
    try { window.history.pushState({ zl: backStack.length }, ""); } catch { /* */ }
    return () => {
      const i = backStack.indexOf(entry);
      if (i >= 0) backStack.splice(i, 1);
      if (!entry.popped) {
        skipPop++;
        try { window.history.back(); } catch { skipPop--; }
      }
    };
  }, [active]);
}

/* Voorlezen met de ingebouwde spraak van het toestel (Web Speech API). */
function useSpeech() {
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const [speaking, setSpeaking] = useState(false);
  const stop = useCallback(() => {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);
  const speak = useCallback((text) => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    const voice = voices.find((v) => /^nl[-_]BE/i.test(v.lang)) || voices.find((v) => /^nl/i.test(v.lang));
    if (voice) u.voice = voice;
    u.lang = voice?.lang || "nl-BE";
    u.rate = 0.9;
    u.onend = () => setSpeaking(false);
    u.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(u);
  }, [supported]);
  useEffect(() => () => { if (supported) window.speechSynthesis.cancel(); }, [supported]);
  return { supported, speaking, speak, stop };
}

/* ════════════════════════════════════════════════════════════════
   Iconen & beeldtaal
   ════════════════════════════════════════════════════════════════ */

const ICONS = {
  heart: <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />,
  bulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" /><path d="M9 18h6" /><path d="M10 22h4" /></>,
  body: <><circle cx="12" cy="4.5" r="1.6" /><path d="m9 20 3-6 3 6" /><path d="m6 8 6 2 6-2" /><path d="M12 10v4" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
  walk: <><path d="M4 16v-2.38C4 11.5 2.97 10.5 3 8c.03-2.72 1.49-6 4.5-6C9.37 2 10 3.8 10 5.5c0 3.11-2 5.66-2 8.68V16a2 2 0 1 1-4 0Z" /><path d="M20 20v-2.38c0-2.12 1.03-3.12 1-5.62-.03-2.72-1.49-6-4.5-6C14.63 6 14 7.8 14 9.5c0 3.11 2 5.66 2 8.68V20a2 2 0 1 0 4 0Z" /><path d="M16 17h4" /><path d="M4 13h4" /></>,
  chat: <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />,
  book: <><path d="M12 7v14" /><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" /></>,
  bed: <><path d="M2 4v16" /><path d="M2 8h18a2 2 0 0 1 2 2v10" /><path d="M2 17h20" /><path d="M6 8v9" /></>,
  palette: <><circle cx="13.5" cy="6.5" r="1" fill="currentColor" /><circle cx="17.5" cy="10.5" r="1" fill="currentColor" /><circle cx="8.5" cy="7.5" r="1" fill="currentColor" /><circle cx="6.5" cy="12.5" r="1" fill="currentColor" /><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.93 0 1.65-.75 1.65-1.69 0-.44-.18-.84-.44-1.13-.29-.29-.44-.65-.44-1.13a1.64 1.64 0 0 1 1.67-1.67h2c3.05 0 5.55-2.5 5.55-5.55C21.97 6.01 17.46 2 12 2z" /></>,
  utensils: <><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" /><path d="M7 2v20" /><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" /></>,
  music: <><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></>,
  check: <path d="M20 6 9 17l-5-5" />,
  checkCircle: <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>,
  arrowRight: <><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></>,
  arrowLeft: <><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></>,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></>,
  eye: <><path d="M2.06 12.35a1 1 0 0 1 0-.7 10.75 10.75 0 0 1 19.88 0 1 1 0 0 1 0 .7 10.75 10.75 0 0 1-19.88 0" /><circle cx="12" cy="12" r="3" /></>,
  calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4" /><path d="M8 2v4" /><path d="M3 10h18" /></>,
  clock: <><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></>,
  alert: <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></>,
  sync: <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></>,
  volume: <><path d="M11 5 6 9H2v6h4l5 4V5Z" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></>,
  stop: <rect x="6" y="6" width="12" height="12" rx="2" />,
  pencil: <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />,
  search: <><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></>,
  x: <><path d="M18 6 6 18" /><path d="m6 6 12 12" /></>,
  user: <><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
  clipboard: <><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="M12 11h4" /><path d="M12 16h4" /><path d="M8 11h.01" /><path d="M8 16h.01" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><path d="M12 17h.01" /></>,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" /><path d="m9 12 2 2 4-4" /></>,
  activity: <path d="M22 12h-4l-3 9L9 3l-3 9H2" />,
  moon: <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />,
  bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" /></>,
  info: <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>,
  simple: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  home: <><path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" /></>,
  chart: <><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></>,
  leaf: <><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" /><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" /></>,
  copy: <><rect x="8" y="8" width="14" height="14" rx="2" /><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" /></>,
  printer: <><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></>,
  grid: <><rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" /></>,
  swap: <><path d="m16 3 4 4-4 4" /><path d="M20 7H4" /><path d="m8 21-4-4 4-4" /><path d="M4 17h16" /></>,
  phone: <><rect x="5" y="2" width="14" height="20" rx="2" /><path d="M12 18h.01" /></>,
  send: <><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></>,
  sparkles: <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />,
};

function Icon({ name, size = 20, stroke = 2, className }) {
  return (
    <svg className={cx("ic", className)} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {ICONS[name]}
    </svg>
  );
}

function Logo({ size = 38 }) {
  return (
    <svg className="logo" width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="12" className="logo__bg" />
      <path className="logo__leaf" d="M20 7c6.8 3.7 11.3 9.3 10.4 15.8-.6 4.7-4.8 7.1-8.4 5.3-.9-.5-1.6-1.1-2-1.8-.4.7-1.1 1.3-2 1.8-3.6 1.8-7.8-.6-8.4-5.3C8.7 16.3 13.2 10.7 20 7Z" />
      <path className="logo__vein" d="M20 11v22M20 17.5l-4.2-2.8M20 17.5l4.2-2.8M20 22.5l-5.6-3.2M20 22.5l5.6-3.2" />
    </svg>
  );
}

/* Gezichtjes 0 (heel slecht) → 4 (heel goed): één consistente beeldtaal. */
const MOUTHS = [
  "M15.5 34 Q24 26.5 32.5 34",
  "M16.5 32.5 Q24 29 31.5 32.5",
  "M17 31.5 Q24 31.5 31 31.5",
  "M16.5 29.5 Q24 35.5 31.5 29.5",
  "M15 28.5 Q24 39 33 28.5",
];

function MoodFace({ value, size = 48, tone = false, className }) {
  return (
    <svg className={cx("face", tone && "face--tone", className)} width={size} height={size} viewBox="0 0 48 48"
      aria-hidden="true" focusable="false" style={tone ? { "--face-fill": `var(--mood-${value})` } : undefined}>
      <circle className="face__bg" cx="24" cy="24" r="21" />
      {value === 0 && <path className="face__ft" d="M13 16.5 L19.5 14 M35 16.5 L28.5 14" />}
      {value === 4 ? (
        <path className="face__ft" d="M14 21.5 Q17.5 17 21 21.5 M27 21.5 Q30.5 17 34 21.5" />
      ) : (
        <>
          <circle className="face__eye" cx="17.5" cy="20.5" r="2.4" />
          <circle className="face__eye" cx="30.5" cy="20.5" r="2.4" />
        </>
      )}
      <path className="face__ft face__mouth" d={MOUTHS[value]} />
    </svg>
  );
}

/* Maanfasen voor slaapkwaliteit 1 → 5 (nieuwe maan → volle maan). */
function MoonPhase({ value, size = 32 }) {
  const f = [0, 0.06, 0.28, 0.5, 0.72, 1][value] ?? 0;
  const r = 10, c = 12;
  let lit = null;
  if (f >= 1) lit = <circle cx={c} cy={c} r={r} className="moon__lit" />;
  else if (f > 0) {
    const rx = r * Math.abs(1 - 2 * f);
    lit = <path className="moon__lit" d={`M${c} ${c - r}A${r} ${r} 0 0 1 ${c} ${c + r}A${rx} ${r} 0 0 ${f < 0.5 ? 0 : 1} ${c} ${c - r}Z`} />;
  }
  return (
    <svg className="moon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx={c} cy={c} r={r} className="moon__dark" />
      {lit}
      <circle cx={c} cy={c} r={r} className="moon__ring" />
    </svg>
  );
}

function Avatar({ name, size = 42 }) {
  return <span className="avatar" style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden="true">{initials(name)}</span>;
}

/* Lijngrafiek van de stemming. Eén reeks; tooltip bij aanwijzen of tikken,
   en altijd een tabelweergave. */
function MoodChart({ points }) {
  const W = 360, H = 156, L = 34, R = 14, T = 14, B = 34;
  const n = points.length;
  const x = (i) => L + (i * (W - L - R)) / (n - 1);
  const y = (v) => T + ((4 - v) * (H - T - B)) / 4;
  const [hover, setHover] = useState(null);

  let line = "";
  points.forEach((p, i) => {
    if (p.mood == null) return;
    line += `${i > 0 && points[i - 1].mood != null ? "L" : "M"}${x(i).toFixed(1)} ${y(p.mood).toFixed(1)}`;
  });
  const known = points.map((p, i) => ({ ...p, i })).filter((p) => p.mood != null);
  const contiguous = known.length > 1 && known.every((p, k) => k === 0 || p.i === known[k - 1].i + 1);
  const area = contiguous ? `${line}L${x(known[known.length - 1].i)} ${y(0)}L${x(known[0].i)} ${y(0)}Z` : null;
  const colW = (W - L - R) / (n - 1);
  const h = hover != null ? points[hover] : null;
  const showLabel = (i) => n <= 7 || (n - 1 - i) % 2 === 0;

  return (
    <figure className="mchart">
      <div className="mchart__plot">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Stemming per dag: ${points.map((p) => `${fmtDayShort(p.date)} ${p.mood != null ? MOODS[p.mood].toLowerCase() : "geen check-in"}`).join(", ")}`}>
          {[0, 1, 2, 3, 4].map((v) => <line key={v} x1={L} x2={W - R} y1={y(v)} y2={y(v)} className="mchart__grid" />)}
          {[4, 2, 0].map((v) => (
            <g key={v} transform={`translate(${L - 30} ${y(v) - 10})`}><MoodFace value={v} size={20} tone /></g>
          ))}
          {area && <path d={area} className="mchart__area" />}
          {h && <line x1={x(hover)} x2={x(hover)} y1={T - 4} y2={H - B} className="mchart__cross" />}
          <path d={line} className="mchart__line" />
          {points.map((p, i) => p.mood != null && (
            <circle key={i} cx={x(i)} cy={y(p.mood)} r={i === n - 1 ? 5.5 : n > 7 ? 3.8 : 4.5} className={cx("mchart__dot", i === n - 1 && "is-today", hover === i && "is-hover")} />
          ))}
          {points.map((p, i) => showLabel(i) && (
            <text key={i} x={i === n - 1 ? x(i) + 8 : x(i)} y={H - 10} textAnchor={i === n - 1 ? "end" : "middle"} className={cx("mchart__x", i === n - 1 && "is-today")}>
              {i === n - 1 ? "vandaag" : DAY_SHORT[p.date.getDay()]}
            </text>
          ))}
          {points.map((p, i) => (
            <rect key={i} x={x(i) - colW / 2} y={0} width={colW} height={H} fill="transparent"
              onPointerEnter={(e) => e.pointerType === "mouse" && setHover(i)}
              onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
              onClick={() => setHover((cur) => (cur === i ? null : i))} />
          ))}
        </svg>
        {h && (
          <div className="tip" style={{ left: `${(x(hover) / W) * 100}%`, top: `${((h.mood != null ? y(h.mood) : y(2)) / H) * 100}%` }}>
            <span className="tip__day">{capitalize(fmtDayShort(h.date))}</span>
            <span className="tip__val">{h.mood != null ? MOODS[h.mood] : "Geen check-in"}</span>
          </div>
        )}
      </div>
      <details className="tableview">
        <summary>Toon als tabel</summary>
        <table>
          <thead><tr><th scope="col">Dag</th><th scope="col">Stemming</th></tr></thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.date.toISOString()}><td>{capitalize(fmtDayShort(p.date))}</td><td>{p.mood != null ? `${MOODS[p.mood]} (${p.mood}/4)` : "Geen check-in"}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}

/* Zeven vakjes: de stemming per dag, kleur + tooltip + schermlezertekst. */
function WeekStrip({ values, days }) {
  return (
    <span className="wk" role="img" aria-label={`Laatste 7 dagen: ${values.map((v, i) => `${DAY_SHORT[days[i].getDay()]} ${v != null ? MOODS[v].toLowerCase() : "geen check-in"}`).join(", ")}`}>
      {values.map((v, i) => (
        <i key={i} className={cx("wk__c", v == null && "is-empty", i === values.length - 1 && "is-today")}
          style={v != null ? { background: `var(--mood-${v})` } : undefined}
          title={`${capitalize(fmtDayShort(days[i]))}: ${v != null ? MOODS[v] : "geen check-in"}`} />
      ))}
    </span>
  );
}

function MoodLegend() {
  return (
    <p className="mlegend">
      <span>Heel slecht</span>
      <span className="mlegend__sw" aria-hidden="true">{MOODS.map((m, v) => <i key={v} style={{ background: `var(--mood-${v})` }} title={m} />)}</span>
      <span>Heel goed</span>
    </p>
  );
}

/* Paneel dat van onder in beeld schuift (binnen de app). */
function Sheet({ open, onClose, labelId, children, className }) {
  const ref = useRef(null);
  useBackHandler(open, () => { onClose(); return false; });
  useEffect(() => {
    if (!open) return undefined;
    const prev = document.activeElement;
    const raf = requestAnimationFrame(() => {
      const el = ref.current?.querySelector("[data-autofocus]") || ref.current;
      el?.focus({ preventScroll: true });
    });
    return () => {
      cancelAnimationFrame(raf);
      if (prev && document.contains(prev)) prev.focus({ preventScroll: true });
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="sheet-layer">
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div className={cx("sheet", className)} role="dialog" aria-modal="true" aria-labelledby={labelId} ref={ref} tabIndex={-1} onKeyDown={trapTab}>
        <span className="sheet__grab" aria-hidden="true" />
        {children}
      </div>
    </div>
  );
}

function SyncStatus({ at, short }) {
  const [synced, setSynced] = useState(() => Date.now() - at.getTime() > 1400);
  useEffect(() => {
    if (synced) return undefined;
    const t = setTimeout(() => setSynced(true), 1400);
    return () => clearTimeout(t);
  }, [synced]);
  return (
    <p className={cx("syncline", synced && "is-synced")} role="status">
      <Icon name={synced ? "shield" : "sync"} size={14} className={synced ? undefined : "spin"} />
      {synced
        ? <>{short ? "Opgeslagen" : "Opgeslagen in je dossier"} · <span className="nowrap">gesynchroniseerd met <b>{ORG.epd}</b></span></>
        : "Bezig met opslaan…"}
    </p>
  );
}

/* ════════════════════════════════════════════════════════════════
   App
   ════════════════════════════════════════════════════════════════ */

export default function EMFIApp() {
  const [view, setView] = usePersistentState("zilverlinde.view", "patient");
  const [simple, setSimple] = usePersistentState("zilverlinde.eenvoudig", false);
  const [store, patch, setStore] = useStore();
  const [bootTime] = useState(() => Date.now());
  const now = useNow();
  const today = dayKey(now);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const selfLog = useMemo(() => buildSelfLog(store.submissions, now), [store.submissions, today]);
  const todayEntry = selfLog.find((e) => !e.seed && isToday(e.at, now)) || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ward = useMemo(() => buildWard(store, selfLog, now, bootTime), [store.callAt, store.callAck, selfLog, today, bootTime]);

  const submit = (mode) => {
    const d = store.draft;
    const entry = { ...d, talk: !!d.talk, thought: d.thought.trim(), at: new Date(), mode };
    patch((s) => ({ submissions: [...s.submissions, entry].slice(-60), draft: EMPTY_DRAFT }));
    return entry;
  };

  const lastSync = new Date(Math.max(bootTime - 60000, todayEntry ? todayEntry.at.getTime() + 1500 : 0));
  const go = (v) => { setView(v); window.scrollTo(0, 0); };

  return (
    <div className="zl" data-view={view}>
      <style>{CSS}</style>
      {view === "staff" ? (
        <StaffApp ward={ward} store={store} patch={patch} now={now} lastSync={lastSync} toPatient={() => go("patient")} />
      ) : (
        <PatientStage
          simple={simple} setSimple={setSimple} store={store} patch={patch} selfLog={selfLog} todayEntry={todayEntry}
          now={now} onSubmit={submit} toStaff={() => go("staff")} onReset={() => setStore(freshStore())}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Patiënt — presentatie (desktop) en toestel
   ════════════════════════════════════════════════════════════════ */

function PatientStage(props) {
  const { simple, setSimple, toStaff, now } = props;
  return (
    <div className="stage">
      <section className="stage__info" aria-label="Over deze app">
        <p className="stage__brand"><Logo size={40} />Zilverlinde</p>
        <p className="eyebrow">Patiënt-app · {ORG.ward}</p>
        <h1 className="stage__title">Elke dag even <em>inchecken.</em></h1>
        <p className="stage__lede">Patiënten vullen op hun telefoon of tablet in hoe het met hen gaat. Het team ziet het meteen in het dossier.</p>
        <ul className="stage__feats">
          <li><span className="stage__ficon"><Icon name="clock" size={18} /></span><b>Klaar in een minuut</b><span>Vijf korte stappen met grote knoppen. Wie stopt, gaat later gewoon verder.</span></li>
          <li><span className="stage__ficon"><Icon name="simple" size={18} /></span><b>Eenvoudige modus</b><span>Voor mensen met ASS of een verstandelijke beperking: één vraag per scherm, pictogrammen en voorlezen.</span></li>
          <li><span className="stage__ficon"><Icon name="leaf" size={18} /></span><b>Meer dan een formulier</b><span>Dagplanning, eigen verloop, een ademoefening en snel een begeleider roepen.</span></li>
        </ul>
        <div className="stage__ctrl">
          <button type="button" role="switch" aria-checked={simple} className="mswitch" onClick={() => setSimple(!simple)}>
            <Icon name="simple" size={18} />Eenvoudige modus<span className="track" aria-hidden="true" />
          </button>
          <button type="button" className="btn btn--secondary" onClick={toStaff}><Icon name="clipboard" size={18} />Bekijk begeleiding</button>
        </div>
        <p className="stage__fine">Fictief prototype. {ORG.hospital}, de patiënten en {ORG.epd} bestaan niet.</p>
      </section>

      <div className="device">
        <div className="device__screen">
          <div className="device__status" aria-hidden="true">
            <span>{fmtTime(now)}</span>
            <span className="device__icons">
              <svg width="18" height="12" viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4" rx="1" /><rect x="5" y="5.5" width="3" height="6.5" rx="1" /><rect x="10" y="3" width="3" height="9" rx="1" /><rect x="15" y="0" width="3" height="12" rx="1" /></svg>
              <svg width="16" height="12" viewBox="0 0 16 12"><path d="M8 11.5 5.6 8.9a3.4 3.4 0 0 1 4.8 0Zm-4.2-4.4-1.5-1.6a8.1 8.1 0 0 1 11.4 0l-1.5 1.6a6 6 0 0 0-8.4 0ZM.4 3.6-.9 2a12 12 0 0 1 17.8 0l-1.3 1.6a10 10 0 0 0-15.2 0Z" /></svg>
              <svg width="27" height="13" viewBox="0 0 27 13"><rect x=".5" y=".5" width="22" height="12" rx="3.5" fill="none" stroke="currentColor" opacity=".4" /><rect x="2" y="2" width="17" height="9" rx="2" /><path d="M24.5 4.5v4a2 2 0 0 0 0-4Z" opacity=".45" /></svg>
            </span>
          </div>
          <span className="device__island" aria-hidden="true" />
          <PatientApp {...props} />
          <span className="device__home" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Patiënt-app
   ════════════════════════════════════════════════════════════════ */

function PatientApp({ simple, setSimple, store, patch, selfLog, todayEntry, now, onSubmit, toStaff, onReset }) {
  const [tab, setTab] = useState("today");
  const [flow, setFlow] = useState(null);
  const [menu, setMenu] = useState(false);
  const mainRef = useRef(null);
  useInert(mainRef, (!!flow && !simple) || menu);

  const draft = store.draft;
  const update = useCallback((p) => patch((s) => ({ draft: { ...s.draft, ...p } })), [patch]);
  const setEmfi = useCallback((key, value, toggle = true) => patch((s) => {
    const emfi = { ...s.draft.emfi };
    if (value == null || (toggle && emfi[key] === value)) delete emfi[key];
    else emfi[key] = value;
    return { draft: { ...s.draft, emfi } };
  }), [patch]);

  const callAt = isToday(store.callAt, now) ? store.callAt : null;
  const callAck = callAt && isToday(store.callAck, now) ? store.callAck : null;
  const call = () => patch({ callAt: new Date(), callAck: null });
  const cancelCall = () => patch({ callAt: null, callAck: null });
  const remindedAt = isToday(store.reminded[SELF.id], now) && !todayEntry ? store.reminded[SELF.id] : null;

  const openFlow = (startStep = 0) => setFlow({ startStep });

  return (
    <div className="app" data-mode={simple ? "simple" : "regular"}>
      <div className="app__main" ref={mainRef}>
        <header className="app__head">
          <p className="app__brand"><Logo size={32} /><span>Zilverlinde</span></p>
          <button type="button" role="switch" aria-checked={simple} aria-label="Eenvoudige modus" className="mswitch mswitch--app" onClick={() => setSimple(!simple)}>
            {!simple && <Icon name="simple" size={16} />}
            <span>Eenvoudig</span>
            <span className="track" aria-hidden="true" />
          </button>
          <button type="button" className="avatar-btn" onClick={() => setMenu(true)} aria-label="Menu" aria-haspopup="dialog">
            <Avatar name={SELF.name} size={38} />
          </button>
        </header>

        <div className="app__body">
          {simple ? (
            <SimpleFlow draft={draft} update={update} setEmfi={setEmfi} todayEntry={todayEntry}
              onSubmit={() => onSubmit("simple")} callAt={callAt} callAck={callAck} onCall={call} />
          ) : (
            <div className="scroll" key={tab}>
              {tab === "today" && (
                <TodayTab now={now} draft={draft} todayEntry={todayEntry} selfLog={selfLog} remindedAt={remindedAt}
                  callAt={callAt} callAck={callAck} onStart={() => openFlow(0)}
                  onQuickMood={(v) => { update({ mood: v }); openFlow(1); }}
                  onSimple={() => setSimple(true)} onHistory={() => setTab("history")} onCalm={() => setTab("calm")} />
              )}
              {tab === "history" && <HistoryTab log={selfLog} now={now} />}
              {tab === "calm" && <CalmTab callAt={callAt} callAck={callAck} onCall={call} onCancelCall={cancelCall} />}
            </div>
          )}
        </div>

        {!simple && (
          <nav className="tabbar" aria-label="App">
            {[
              { id: "today", label: "Vandaag", icon: "home" },
              { id: "history", label: "Verloop", icon: "chart" },
              { id: "calm", label: "Rust", icon: "leaf" },
            ].map((t) => (
              <button key={t.id} type="button" className="tabbar__btn" aria-current={tab === t.id ? "page" : undefined} onClick={() => setTab(t.id)}>
                <span className="tabbar__icon"><Icon name={t.icon} size={21} /></span>
                {t.label}
              </button>
            ))}
          </nav>
        )}
      </div>

      {flow && !simple && (
        <CheckinFlow draft={draft} update={update} setEmfi={setEmfi} startStep={flow.startStep}
          onSubmit={() => onSubmit("regular")} onClose={() => setFlow(null)} />
      )}

      <MenuSheet open={menu} onClose={() => setMenu(false)} simple={simple} setSimple={setSimple}
        toStaff={() => { setMenu(false); toStaff(); }} onReset={() => { onReset(); setMenu(false); setTab("today"); }} />
    </div>
  );
}

function MenuSheet({ open, onClose, simple, setSimple, toStaff, onReset }) {
  const tid = useId();
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    if (!confirm) return undefined;
    const t = setTimeout(() => setConfirm(false), 4000);
    return () => clearTimeout(t);
  }, [confirm]);
  return (
    <Sheet open={open} onClose={onClose} labelId={tid}>
      <div className="menu">
        <div className="menu__who">
          <Avatar name={SELF.name} size={48} />
          <div>
            <p className="menu__name" id={tid}>{SELF.name}</p>
            <p className="menu__sub">{SELF.room} · {ORG.ward}</p>
          </div>
          <button type="button" className="iconbtn iconbtn--plain" onClick={onClose} aria-label="Sluiten"><Icon name="x" /></button>
        </div>
        <ul className="menu__list">
          <li>
            <button type="button" role="switch" aria-checked={simple} className="menu__item" onClick={() => setSimple(!simple)} data-autofocus="">
              <span className="menu__icon"><Icon name="simple" /></span>
              <span className="menu__text">Eenvoudige modus<small>Eén vraag per keer, grote knoppen, voorlezen</small></span>
              <span className="track" aria-hidden="true" />
            </button>
          </li>
          <li>
            <button type="button" className="menu__item" onClick={toStaff}>
              <span className="menu__icon"><Icon name="clipboard" /></span>
              <span className="menu__text">Bekijk als begeleiding<small>Demo van de werkplek voor het team</small></span>
              <Icon name="chevronRight" />
            </button>
          </li>
          <li>
            <button type="button" className={cx("menu__item", confirm && "is-confirm")} onClick={() => (confirm ? onReset() : setConfirm(true))}>
              <span className="menu__icon"><Icon name="sync" /></span>
              <span className="menu__text">{confirm ? "Tik nog eens om te bevestigen" : "Demo opnieuw starten"}<small>Wist alle demo-antwoorden op dit toestel</small></span>
            </button>
          </li>
        </ul>
        <p className="menu__fine">{ORG.hospital} en {ORG.epd} zijn fictief. Dit is een prototype.</p>
      </div>
    </Sheet>
  );
}

/* ── Vandaag ───────────────────────────────────────────────────── */

function TodayTab({ now, draft, todayEntry, selfLog, remindedAt, callAt, callAck, onStart, onQuickMood, onSimple, onHistory, onCalm }) {
  const { greeting, part } = daypart(now);
  const started = draft.mood !== null || Object.keys(draft.emfi).length > 0;
  return (
    <div className="tab-page">
      <header className="today-head">
        <p className="eyebrow">{capitalize(fmtDateLong(now))}</p>
        <h1 className="app-display">{greeting},<br /><em>{SELF.firstName}.</em></h1>
      </header>

      {callAt && (
        <button type="button" className={cx("callbar", callAck && "is-ack")} onClick={onCalm}>
          <span className="callbar__icon"><Icon name={callAck ? "checkCircle" : "bell"} size={20} /></span>
          <span className="callbar__text">
            <strong>{callAck ? `${STAFF_USER.firstName} komt naar je toe` : "Je vroeg een begeleider"}</strong>
            <span>{callAck ? `Gezien om ${fmtTime(callAck)}` : `Om ${fmtTime(callAt)} · iemand komt zo snel mogelijk`}</span>
          </span>
          <Icon name="chevronRight" size={18} />
        </button>
      )}

      {todayEntry ? (
        <section className="donecard" aria-label="Check-in van vandaag">
          <div className="donecard__head">
            <span className="donecard__check"><Icon name="check" size={20} stroke={3} /></span>
            <div>
              <p className="donecard__title">Check-in verstuurd</p>
              <p className="donecard__sub">Vandaag om {fmtTime(todayEntry.at)}</p>
            </div>
          </div>
          <div className="donecard__sum">
            <MoodFace value={todayEntry.mood} size={44} tone />
            <div className="donecard__sumtext">
              <b>{MOODS[todayEntry.mood]}</b>
              <span>{EMFI.map((d) => todayEntry.emfi[d.key]).filter(Boolean).join(" · ")}</span>
            </div>
          </div>
          <div className="donecard__foot">
            <SyncStatus at={todayEntry.at} short />
            <button type="button" className="btn btn--secondary btn--sm" onClick={onStart}>Nieuwe check-in</button>
          </div>
        </section>
      ) : (
        <section className="cicard" aria-labelledby="cicard-title">
          <div className="cicard__top">
            <span className="cicard__chip"><Icon name="clock" size={14} />± 1 minuut</span>
            <span>{capitalize(part)}check-in</span>
          </div>
          {remindedAt && <p className="cicard__remind"><Icon name="bell" size={15} />{STAFF_USER.firstName} vraagt of je je check-in wil invullen.</p>}
          <h2 className="cicard__title" id="cicard-title">{started ? "Je check-in staat klaar" : "Hoe gaat het met je?"}</h2>
          {started ? (
            <>
              <p className="cicard__sub">Je antwoorden zijn bewaard. Ga verder waar je was.</p>
              <button type="button" className="btn btn--onbrand btn--block btn--lg" onClick={onStart}>Verder invullen <Icon name="arrowRight" size={18} /></button>
            </>
          ) : (
            <>
              <p className="cicard__sub">Tik op een gezicht om te beginnen.</p>
              <div className="cicard__faces" role="group" aria-label="Kies je stemming om te beginnen">
                {MOODS.map((label, v) => (
                  <button key={v} type="button" className="cicard__face" style={{ "--tone": `var(--mood-${v})` }} onClick={() => onQuickMood(v)}>
                    <MoodFace value={v} size={42} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Vandaag op {ORG.ward}</h2>
        </div>
        <Schedule now={now} />
      </section>

      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Jouw week</h2>
          <button type="button" className="link" onClick={onHistory}>Verloop<Icon name="chevronRight" size={16} /></button>
        </div>
        <WeekFaces log={selfLog} now={now} />
      </section>

      <button type="button" className="simple-cta" onClick={onSimple}>
        <span className="simple-cta__icon"><Icon name="simple" size={22} /></span>
        <span className="simple-cta__body">
          <span className="simple-cta__title">Liever eenvoudig?</span>
          <span className="simple-cta__text">Eén vraag per keer, grote knoppen en voorlezen.</span>
        </span>
        <Icon name="chevronRight" size={18} />
      </button>
    </div>
  );
}

function Schedule({ now }) {
  const [all, setAll] = useState(false);
  const mins = now.getHours() * 60 + now.getMinutes();
  const items = SCHEDULE.map((it, i) => {
    const start = toMinutes(it.time);
    const end = SCHEDULE[i + 1] ? toMinutes(SCHEDULE[i + 1].time) : 24 * 60;
    return { ...it, state: mins >= end ? "past" : mins >= start ? "now" : "next" };
  });
  let idx = items.findIndex((i) => i.state === "now");
  if (idx < 0) idx = Math.max(0, items.findIndex((i) => i.state === "next"));
  const shown = all ? items : items.slice(idx, idx + 3);
  return (
    <>
      <ol className="sched">
        {shown.map((it) => (
          <li key={it.time} className={cx("sched__item", `is-${it.state}`)}>
            <span className="sched__time">{it.time}</span>
            <span className="sched__icon"><Icon name={it.icon} size={17} /></span>
            <span className="sched__body">
              <span className="sched__title">{it.title}</span>
              {it.sub && <span className="sched__sub">{it.sub}</span>}
            </span>
            {it.state === "now" && <span className="tag tag--now">Nu</span>}
          </li>
        ))}
      </ol>
      <button type="button" className="link link--block" aria-expanded={all} onClick={() => setAll(!all)}>
        {all ? "Toon minder" : "Hele dag bekijken"}
      </button>
    </>
  );
}

function WeekFaces({ log, now }) {
  const days = lastDays(7, now);
  return (
    <ol className="weekfaces">
      {days.map((d) => {
        const e = log.find((x) => dayKey(x.at) === dayKey(d));
        const today = isToday(d, now);
        return (
          <li key={dayKey(d)} className={cx(today && "is-today")}>
            <span className="weekfaces__day">{today ? "Nu" : DAY_SHORT[d.getDay()]}</span>
            {e ? <MoodFace value={e.mood} size={34} tone /> : <span className="weekfaces__empty" />}
            <span className="sr-only">{capitalize(fmtDayShort(d))}: {e ? MOODS[e.mood] : "nog geen check-in"}</span>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Verloop ───────────────────────────────────────────────────── */

function HistoryTab({ log, now }) {
  const [range, setRange] = useState(7);
  const days = lastDays(range, now);
  const entries = days.map((d) => log.find((e) => dayKey(e.at) === dayKey(d)) || null);
  const done = entries.filter(Boolean);
  const points = days.map((date, i) => ({ date, mood: entries[i]?.mood ?? null }));
  const avg = average(done.map((e) => e.mood));
  const sleepAvg = average(done.filter((e) => e.sleep).map((e) => e.sleep));
  const insight = findInsight(done);
  return (
    <div className="tab-page">
      <header className="page-head">
        <h1 className="app-title">Jouw verloop</h1>
        <p className="muted">Zo ging het de voorbije {range} dagen.</p>
      </header>

      <div className="segmented" role="group" aria-label="Periode">
        {[7, 14].map((n) => (
          <button key={n} type="button" aria-pressed={range === n} onClick={() => setRange(n)}>{n} dagen</button>
        ))}
      </div>

      <section className="card pad">
        <dl className="stats">
          <div><dt>Gemiddeld</dt><dd>{avg != null ? MOODS[Math.round(avg)] : "—"}</dd></div>
          <div><dt>Slaap</dt><dd>{sleepAvg != null ? SLEEP[Math.round(sleepAvg)] : "—"}</dd></div>
          <div><dt>Check-ins</dt><dd>{done.length} van {range}</dd></div>
        </dl>
        <MoodChart points={points} />
      </section>

      {insight && (
        <section className="insight">
          <span className="insight__icon"><Icon name="sparkles" size={20} /></span>
          <div>
            <p className="insight__title">{insight.title}</p>
            <p className="insight__text">{insight.text}</p>
            <p className="insight__fine">Dat wil niet zeggen dat het één het ander veroorzaakt. Wel iets om eens over te praten met je begeleider.</p>
          </div>
        </section>
      )}

      <section className="block">
        <div className="block__head"><h2 className="block__title">Wat kwam het vaakst terug?</h2></div>
        <EmfiPatterns entries={done} />
      </section>

      <section className="block">
        <div className="block__head"><h2 className="block__title">Per dag</h2></div>
        <ul className="daylist">
          {[...done].reverse().map((e) => (
            <li key={dayKey(e.at)} className="daylist__row">
              <MoodFace value={e.mood} size={36} tone />
              <span className="daylist__text">
                <b>{isToday(e.at, now) ? "Vandaag" : capitalize(fmtDayShort(e.at))} · {MOODS[e.mood]}</b>
                <span>{EMFI.map((d) => e.emfi[d.key]).filter(Boolean).join(" · ") || "Geen EMFI ingevuld"}</span>
              </span>
              {e.sleep > 0 && <span className="daylist__sleep" title={`Slaap: ${SLEEP[e.sleep]}`}><MoonPhase value={e.sleep} size={22} /><span className="sr-only">Slaap: {SLEEP[e.sleep]}</span></span>}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function EmfiPatterns({ entries }) {
  if (!entries.length) return <p className="muted">Nog geen check-ins in deze periode.</p>;
  return (
    <ul className="patterns">
      {EMFI.map((d) => {
        const counts = {};
        entries.forEach((e) => { const v = e.emfi[d.key]; if (v) counts[v] = (counts[v] || 0) + 1; });
        const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
        const max = top[0]?.[1] || 1;
        return (
          <li key={d.key} className={cx("pattern", `tone-${d.key}`)}>
            <p className="pattern__head"><span className="mini-badge"><Icon name={d.icon} size={14} /></span>{d.name}</p>
            {top.length ? (
              <ul className="pattern__bars">
                {top.map(([v, n]) => (
                  <li key={v}>
                    <span className="pattern__label">{v}</span>
                    <span className="pattern__track"><i style={{ width: `${(n / max) * 100}%` }} /></span>
                    <span className="pattern__n">{n}×</span>
                  </li>
                ))}
              </ul>
            ) : <p className="muted small">Niet ingevuld</p>}
          </li>
        );
      })}
    </ul>
  );
}

/* ── Rust ──────────────────────────────────────────────────────── */

function CalmTab({ callAt, callAck, onCall, onCancelCall }) {
  return (
    <div className="tab-page">
      <header className="page-head">
        <h1 className="app-title">Even rust</h1>
        <p className="muted">Kleine dingen die kunnen helpen. Neem je tijd.</p>
      </header>
      <Breathing />
      <section className="block">
        <div className="block__head">
          <h2 className="block__title">Wat helpt jou</h2>
        </div>
        <p className="muted small block__lead">Uit je signaleringsplan, opgesteld samen met {STAFF_USER.firstName}.</p>
        <ul className="helps">
          {HELPS.map((h) => (
            <li key={h.text}><span className="helps__icon"><Icon name={h.icon} size={18} /></span>{h.text}</li>
          ))}
        </ul>
      </section>
      <section className={cx("helpcard", callAt && "is-active")} aria-live="polite">
        {callAt ? (
          <>
            <span className="helpcard__icon"><Icon name={callAck ? "checkCircle" : "bell"} size={22} /></span>
            <h2 className="helpcard__title">{callAck ? `${STAFF_USER.firstName} komt naar je toe` : "Je vraag is doorgegeven"}</h2>
            <p>{callAck ? `Je begeleider zag je vraag om ${fmtTime(callAck)}.` : `Om ${fmtTime(callAt)}. Iemand van het team komt zo snel mogelijk naar je toe.`}</p>
            <button type="button" className="btn btn--secondary btn--sm" onClick={onCancelCall}>{callAck ? "Oké" : "Vraag intrekken"}</button>
          </>
        ) : (
          <>
            <span className="helpcard__icon"><Icon name="chat" size={22} /></span>
            <h2 className="helpcard__title">Wil je nu met iemand praten?</h2>
            <p>Je begeleider krijgt meteen een seintje en komt naar je toe.</p>
            <button type="button" className="btn btn--primary btn--block btn--lg" onClick={onCall}><Icon name="bell" size={18} />Vraag een begeleider</button>
          </>
        )}
        <p className="helpcard__fine"><Icon name="alert" size={15} />Voel je je niet veilig? Spreek meteen iemand aan of gebruik de oproepknop op je kamer.</p>
      </section>
    </div>
  );
}

function Breathing() {
  const [t, setT] = useState(-1);
  const running = t >= 0 && t < 60;
  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setT((v) => v + 1), 1000);
    return () => clearInterval(id);
  }, [running]);
  const c = t % 10;
  const phase = !running ? (t >= 60 ? "done" : "idle") : c < 4 ? "in" : "out";
  const left = phase === "in" ? 4 - c : 10 - c;
  return (
    <section className={cx("breath", `is-${phase}`)} aria-labelledby="breath-title">
      <div className="breath__head">
        <h2 className="block__title" id="breath-title">Ademoefening</h2>
        <span className="muted small">1 minuut · 4 tellen in, 6 uit</span>
      </div>
      <div className="breath__stage">
        <span className="breath__ring" aria-hidden="true" />
        <span className="breath__orb" aria-hidden="true" />
        <p className="breath__text">
          <span className="breath__phase" aria-live="polite">
            {phase === "in" ? "Adem in" : phase === "out" ? "Adem uit" : phase === "done" ? "Goed gedaan" : "Klaar?"}
          </span>
          {running && <span className="breath__count" aria-hidden="true">{left}</span>}
        </p>
      </div>
      {running ? (
        <div className="breath__foot">
          <span className="muted small">Nog {60 - t} seconden</span>
          <button type="button" className="btn btn--secondary btn--sm" onClick={() => setT(-1)}><Icon name="stop" size={15} />Stop</button>
        </div>
      ) : (
        <button type="button" className="btn btn--primary btn--block" onClick={() => setT(0)}>{phase === "done" ? "Nog eens" : "Start"}</button>
      )}
    </section>
  );
}

/* ── Check-in in vijf stappen ──────────────────────────────────── */

function CheckinFlow({ draft, update, setEmfi, startStep, onSubmit, onClose }) {
  const [step, setStep] = useState(startStep);
  const [dir, setDir] = useState(1);
  const [sheet, setSheet] = useState(null);
  const [nudge, setNudge] = useState(false);
  const [done, setDone] = useState(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const mainRef = useRef(null);
  const tid = useId();
  useInert(mainRef, !!sheet);

  const go = (to) => { setDir(to >= step ? 1 : -1); setStep(to); setNudge(false); };

  useBackHandler(true, (source) => {
    if (done || source === "escape") { onClose(); return false; }
    if (step > 0) { go(step - 1); return true; }
    onClose();
    return false;
  });

  useEffect(() => {
    const prev = document.activeElement;
    return () => { if (prev && document.contains(prev)) prev.focus({ preventScroll: true }); };
  }, []);
  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0);
    titleRef.current?.focus({ preventScroll: true });
  }, [step, done]);

  if (done) {
    return (
      <div className="flow" role="dialog" aria-modal="true" aria-labelledby={tid}>
        <FlowDone entry={done} titleId={tid} titleRef={titleRef} onClose={onClose} />
      </div>
    );
  }

  const s = FLOW_STEPS[step];
  const emfiCount = EMFI.filter((d) => draft.emfi[d.key]).length;
  const canNext = step === 0 ? draft.mood !== null : step === 1 ? emfiCount >= 2 : true;
  const needText = step === 0 ? "Kies eerst een gezicht." : emfiCount === 1 ? "Kies nog 1 gebied." : "Kies minstens 2 gebieden.";
  const filled = step === 2 ? draft.sleep > 0 || draft.activities.length > 0 : step === 3 ? !!draft.talk || draft.thought.trim().length > 0 : true;
  const last = step === FLOW_STEPS.length - 1;
  const next = () => {
    if (!canNext) { setNudge(true); return; }
    if (last) { setDone(onSubmit()); return; }
    go(step + 1);
  };

  return (
    <div className="flow" role="dialog" aria-modal="true" aria-labelledby={tid}>
      <div className="flow__main" ref={mainRef}>
        <header className="flow__head">
          <button type="button" className={cx("iconbtn iconbtn--plain", step === 0 && "is-hidden")} onClick={() => go(step - 1)} aria-label="Vorige stap" tabIndex={step === 0 ? -1 : undefined}>
            <Icon name="chevronLeft" size={22} />
          </button>
          <ol className="flow__progress" aria-hidden="true">
            {FLOW_STEPS.map((x, i) => <li key={x.id} className={cx(i < step && "is-done", i === step && "is-now")} />)}
          </ol>
          <button type="button" className="iconbtn iconbtn--plain" onClick={onClose} aria-label="Sluiten, je antwoorden blijven bewaard">
            <Icon name="x" size={22} />
          </button>
        </header>

        <div className="flow__body" ref={bodyRef}>
          <div className={cx("flow__step", dir > 0 ? "from-right" : "from-left")} key={step}>
            <p className="flow__kicker">Stap {step + 1} van {FLOW_STEPS.length} · {s.label}</p>
            <h2 className="flow__title" id={tid} ref={titleRef} tabIndex={-1}>{s.title}</h2>
            <p className="flow__sub">{s.sub}</p>
            {step === 0 && <MoodStep value={draft.mood} onChange={(v) => { update({ mood: v }); setNudge(false); }} />}
            {step === 1 && <EmfiStep draft={draft} count={emfiCount} onOpen={setSheet} />}
            {step === 2 && <DayStep draft={draft} update={update} />}
            {step === 3 && <NoteFields draft={draft} update={update} />}
            {step === 4 && <ReviewStep draft={draft} onEdit={go} />}
          </div>
        </div>

        <footer className="flow__foot">
          {nudge && !canNext && <p className="flow__nudge" role="alert"><Icon name="info" size={18} />{needText}</p>}
          <div className="flow__actions">
            {(step === 2 || step === 3) && !filled && (
              <button type="button" className="btn btn--ghost btn--lg" onClick={() => go(step + 1)}>Overslaan</button>
            )}
            <button type="button" className="btn btn--primary btn--lg flow__next" aria-disabled={!canNext} onClick={next}>
              {last ? "Verstuur naar dossier" : "Volgende"}<Icon name={last ? "send" : "arrowRight"} size={18} />
            </button>
          </div>
        </footer>
      </div>

      <EmfiSheet dimKey={sheet} value={sheet ? draft.emfi[sheet] : null}
        onPick={(v) => { setEmfi(sheet, v, false); setTimeout(() => setSheet(null), 180); }}
        onClear={() => { setEmfi(sheet, null); setSheet(null); }}
        onClose={() => setSheet(null)} />
    </div>
  );
}

function MoodStep({ value, onChange }) {
  const name = useId();
  return (
    <div className="moodstep">
      <div className="moodstep__hero" aria-hidden="true" style={value != null ? { "--tone": `var(--mood-${value})` } : undefined}>
        <MoodFace value={value ?? 2} size={128} className={cx("moodstep__face", value == null && "is-idle")} />
        <p className="moodstep__label">{value != null ? MOODS[value] : "Kies een gezicht"}</p>
      </div>
      <fieldset className="moodstep__row">
        <legend className="sr-only">Stemming</legend>
        {MOODS.map((label, v) => (
          <label key={v} className={cx("moodopt", value === v && "is-on")} style={{ "--tone": `var(--mood-${v})` }}>
            <input type="radio" className="sr-only" name={name} checked={value === v} onChange={() => onChange(v)} />
            <MoodFace value={v} size={44} />
            <span>{label}</span>
          </label>
        ))}
      </fieldset>
    </div>
  );
}

function EmfiStep({ draft, count, onOpen }) {
  return (
    <>
      <div className="emfi-grid">
        {EMFI.map((d) => {
          const v = draft.emfi[d.key];
          return (
            <button key={d.key} type="button" className={cx("emfi-card", `tone-${d.key}`, v && "is-set")} onClick={() => onOpen(d.key)} aria-haspopup="dialog">
              <span className="emfi-card__badge"><Icon name={d.icon} size={22} /></span>
              <span className="emfi-card__name">{d.name}</span>
              <span className="emfi-card__hint">{d.hint}</span>
              <span className="emfi-card__value">
                {v ? <><Icon name="check" size={15} stroke={3} />{v}</> : <>Kies<Icon name="chevronRight" size={15} /></>}
              </span>
            </button>
          );
        })}
      </div>
      <p className={cx("emfi-count", count >= 2 && "is-ok")} aria-live="polite">
        <Icon name={count >= 2 ? "checkCircle" : "info"} size={16} />
        {count} van 4 gekozen{count < 2 ? ` · nog ${2 - count} nodig` : ""}
      </p>
    </>
  );
}

function EmfiSheet({ dimKey, value, onPick, onClear, onClose }) {
  const d = EMFI.find((x) => x.key === dimKey);
  const tid = useId();
  const options = d ? [...d.options.map((o) => o.value), DONT_KNOW] : [];
  const focusValue = value && options.includes(value) ? value : options[0];
  return (
    <Sheet open={!!d} onClose={onClose} labelId={tid}>
      {d && (
        <div className={cx("osheet", `tone-${d.key}`)}>
          <div className="osheet__head">
            <span className="dim__badge"><Icon name={d.icon} size={20} /></span>
            <div className="osheet__titles">
              <p className="osheet__name" id={tid}>{d.name}</p>
              <p className="osheet__q">{d.question}</p>
            </div>
            <button type="button" className="iconbtn iconbtn--plain" onClick={onClose} aria-label="Sluiten"><Icon name="x" /></button>
          </div>
          <ul className="olist">
            {options.map((v) => (
              <li key={v}>
                <button type="button" className={cx("oitem", v === DONT_KNOW && "oitem--ghost")} aria-pressed={value === v}
                  onClick={() => onPick(v)} data-autofocus={v === focusValue ? "" : undefined}>
                  <span className="oitem__radio" aria-hidden="true" />
                  {v}
                  {v === DONT_KNOW && <Icon name="help" size={18} />}
                </button>
              </li>
            ))}
          </ul>
          {value && <button type="button" className="btn btn--ghost btn--sm osheet__clear" onClick={onClear}>Keuze wissen</button>}
        </div>
      )}
    </Sheet>
  );
}

function Scale({ kind, value, onChange }) {
  const name = useId();
  const items = kind === "mood"
    ? MOODS.map((label, v) => ({ v, label }))
    : SLEEP.slice(1).map((label, i) => ({ v: i + 1, label }));
  return (
    <fieldset className={cx("scale", `scale--${kind}`)}>
      <legend className="sr-only">{kind === "mood" ? "Kies je stemming" : "Kies hoe je geslapen hebt"}</legend>
      {items.map(({ v, label }) => (
        <label key={v} className={cx("scale__opt", value === v && "is-on")} style={kind === "mood" ? { "--tone": `var(--mood-${v})` } : undefined}>
          <input className="sr-only" type="radio" name={name} checked={value === v} onChange={() => onChange(v)} />
          {kind === "mood" ? <MoodFace value={v} size={44} /> : <MoonPhase value={v} size={34} />}
          <span className="scale__label">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function DayStep({ draft, update }) {
  const toggle = (a) => update({
    activities: draft.activities.includes(a) ? draft.activities.filter((x) => x !== a) : [...draft.activities, a],
  });
  return (
    <div className="daystep">
      <h3 className="flow__h3">Hoe heb je geslapen?</h3>
      <Scale kind="sleep" value={draft.sleep || null} onChange={(v) => update({ sleep: v })} />
      <h3 className="flow__h3">Wat heb je vandaag gedaan? <span>Kies er zoveel je wil.</span></h3>
      <fieldset className="acts">
        <legend className="sr-only">Activiteiten</legend>
        {ACTIVITIES.map((a) => {
          const on = draft.activities.includes(a.value);
          return (
            <label key={a.value} className={cx("act", on && "is-on")}>
              <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(a.value)} />
              <span className="act__icon"><Icon name={on ? "check" : a.icon} size={17} stroke={on ? 3 : 2} /></span>
              {a.value}
            </label>
          );
        })}
      </fieldset>
    </div>
  );
}

function NoteFields({ draft, update }) {
  const tid = useId();
  const pname = useId();
  return (
    <div className="notestep">
      <button type="button" role="switch" aria-checked={!!draft.talk} className="talk" onClick={() => update({ talk: !draft.talk })}>
        <span className="talk__icon"><Icon name="chat" size={22} /></span>
        <span className="talk__text">
          <strong>Ik wil vandaag graag een gesprek</strong>
          <span>Je begeleider ziet dit meteen.</span>
        </span>
        <span className="track" aria-hidden="true" />
      </button>

      <div className="field">
        <label className="field__label" htmlFor={tid}>Notitie <span>optioneel</span></label>
        <textarea id={tid} className="textarea" rows={4} maxLength={NOTE_MAX} value={draft.thought}
          placeholder="Schrijf hier wat je bezighoudt…" onChange={(e) => update({ thought: e.target.value })} />
        <div className="field__foot">
          <fieldset className="privacy">
            <legend className="sr-only">Wie mag je notitie lezen?</legend>
            {[
              { v: false, label: "Delen met begeleiding", icon: "eye" },
              { v: true, label: "Alleen voor mij", icon: "lock" },
            ].map((o) => (
              <label key={String(o.v)} className={cx(draft.thoughtPrivate === o.v && "is-on")}>
                <input type="radio" className="sr-only" name={pname} checked={draft.thoughtPrivate === o.v} onChange={() => update({ thoughtPrivate: o.v })} />
                <Icon name={o.icon} size={16} />{o.label}
              </label>
            ))}
          </fieldset>
        </div>
        <p className="privacy-note">
          <Icon name={draft.thoughtPrivate ? "lock" : "info"} size={16} />
          <span>{draft.thoughtPrivate ? "Deze notitie blijft bij jou. Ze komt niet in je dossier." : "Je begeleider kan deze notitie lezen in je dossier."}</span>
          <span className="count" aria-live="polite">{draft.thought.length}/{NOTE_MAX}</span>
        </p>
      </div>
    </div>
  );
}

function ReviewStep({ draft, onEdit }) {
  const rows = [
    { k: "Stemming", v: draft.mood != null ? MOODS[draft.mood] : null, step: 0, icon: draft.mood != null ? <MoodFace value={draft.mood} size={26} tone /> : <Icon name="help" size={18} /> },
    ...EMFI.map((d) => ({ k: d.name, v: draft.emfi[d.key] || null, step: 1, icon: <span className={`mini-badge tone-${d.key}`}><Icon name={d.icon} size={14} /></span> })),
    { k: "Slaap", v: draft.sleep ? SLEEP[draft.sleep] : null, step: 2, icon: <MoonPhase value={draft.sleep || 0} size={24} /> },
    { k: "Activiteiten", v: draft.activities.length ? draft.activities.join(", ") : null, step: 2, icon: <Icon name="activity" size={18} /> },
    { k: "Gesprek", v: draft.talk ? "Ja, graag" : null, step: 3, icon: <Icon name="chat" size={18} /> },
    { k: "Notitie", v: draft.thought.trim() ? (draft.thoughtPrivate ? "Alleen voor jou" : "Gedeeld met begeleiding") : null, step: 3, icon: <Icon name={draft.thoughtPrivate ? "lock" : "pencil"} size={18} /> },
  ];
  return (
    <>
      <ul className="review">
        {rows.map((r) => (
          <li key={r.k} className="review__row">
            <span className="review__icon">{r.icon}</span>
            <span className="review__text">
              <span className="review__k">{r.k}</span>
              <span className={cx("review__v", !r.v && "is-empty")}>{r.v || "Niet ingevuld"}</span>
            </span>
            <button type="button" className="review__edit" onClick={() => onEdit(r.step)} aria-label={`${r.k} wijzigen`}>
              <Icon name="pencil" size={16} />
            </button>
          </li>
        ))}
      </ul>
      <p className="foot-note"><Icon name="shield" size={15} />Alleen jouw behandelteam kan je check-in zien.</p>
    </>
  );
}

function careMessage(s) {
  if (s.mood !== null && s.mood <= 1) {
    return { tone: "alert", icon: "heart", text: "Het klinkt als een zware dag. Je hoeft het niet alleen te dragen: spreek gerust iemand van het team aan. Voel je je niet veilig? Zeg het dan meteen." };
  }
  if (s.talk) return { icon: "chat", text: "Je vroeg om een gesprek. Je begeleider komt naar je toe zodra het kan." };
  if (s.mood >= 3) return { icon: "heart", text: "Fijn om te horen. Neem dat gevoel mee in de rest van je dag." };
  return { icon: "heart", text: "Dankjewel om even stil te staan bij hoe het met je gaat." };
}

function FlowDone({ entry, titleId, titleRef, onClose }) {
  const care = careMessage(entry);
  return (
    <div className="flowdone">
      <div className="flowdone__body">
        <svg className="burst" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
          <circle className="burst__halo" cx="48" cy="48" r="46" />
          <circle className="burst__disc" cx="48" cy="48" r="32" />
          <path className="burst__check" d="M34 49 44 59 63 39" />
        </svg>
        <h2 className="flowdone__title" id={titleId} ref={titleRef} tabIndex={-1}>Dankjewel, <em>{SELF.firstName}.</em></h2>
        <p className="flowdone__lede">Je check-in staat in je dossier. Je begeleider bekijkt hem vandaag nog.</p>
        <div className={cx("care", care.tone === "alert" && "care--alert")}>
          <Icon name={care.icon} size={20} />
          <p>{care.text}</p>
        </div>
        <SyncStatus at={entry.at} />
      </div>
      <footer className="flow__foot">
        <div className="flow__actions">
          <button type="button" className="btn btn--primary btn--lg flow__next" onClick={onClose}>Naar vandaag</button>
        </div>
      </footer>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Patiënt — eenvoudige modus
   Eén vraag per scherm · vaste plek voor knoppen · korte, letterlijke
   zinnen · pictogrammen bij elk antwoord · voorlezen · geen animaties
   ════════════════════════════════════════════════════════════════ */

function SimpleFlow({ draft, update, setEmfi, todayEntry, onSubmit, callAt, callAck, onCall }) {
  const speech = useSpeech();
  const [step, setStep] = useState(-1);
  const [editing, setEditing] = useState(false);
  const [nudge, setNudge] = useState(false);
  const [done, setDone] = useState(null);
  const titleRef = useRef(null);
  const bodyRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    speech.stop();
    setNudge(false);
    bodyRef.current?.scrollTo(0, 0);
    if (mounted.current) titleRef.current?.focus({ preventScroll: true });
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, done]);

  useBackHandler(step >= 0 && !done, () => {
    if (step >= SIMPLE_STEPS.length) { setStep(SIMPLE_STEPS.length - 1); return true; }
    setStep(step - 1);
    return step - 1 >= 0;
  });

  const finish = () => { setDone(null); setStep(-1); };

  if (done) return <SimpleDone entry={done} speech={speech} titleRef={titleRef} bodyRef={bodyRef} onDone={finish} />;
  if (step < 0) {
    return <SimpleIntro speech={speech} titleRef={titleRef} bodyRef={bodyRef} todayEntry={todayEntry}
      callAt={callAt} callAck={callAck} onCall={onCall} onStart={() => setStep(0)} />;
  }
  if (step >= SIMPLE_STEPS.length) {
    return (
      <SimpleReview draft={draft} speech={speech} titleRef={titleRef} bodyRef={bodyRef}
        onEdit={(i) => { setEditing(true); setStep(i); }}
        onBack={() => setStep(SIMPLE_STEPS.length - 1)}
        onSubmit={() => { setEditing(false); setDone(onSubmit()); }} />
    );
  }

  const meta = SIMPLE_STEPS[step];
  const q = simpleQuestion(meta.id, draft, update, setEmfi);
  const next = () => {
    if (!q.answered) { setNudge(true); return; }
    if (editing) { setEditing(false); setStep(SIMPLE_STEPS.length); return; }
    setStep(step + 1);
  };
  const speakText = [q.title, q.sub, ...q.choices.map((c) => c.label)].filter(Boolean).join(". ");

  return (
    <div className="s-screen">
      <div className="s-body" ref={bodyRef}>
        <div className="s-inner">
          <div className="s-top">
            <div className="s-progress">
              <p className="s-count">Vraag {step + 1} van {SIMPLE_STEPS.length}</p>
              <ol className="s-dots" aria-hidden="true">
                {SIMPLE_STEPS.map((s, i) => <li key={s.id} className={cx("s-dot", i < step && "is-done", i === step && "is-now")} />)}
              </ol>
            </div>
            <SpeakButton speech={speech} text={speakText} />
          </div>
          <h1 className="s-title" ref={titleRef} tabIndex={-1}>{q.title}</h1>
          <p className="s-sub">{q.sub}</p>
          <SimpleChoices choices={q.choices} selected={q.selected} columns={q.columns} label={q.title}
            onSelect={(v) => { q.onSelect(v); setNudge(false); }} />
          {nudge && <p className="s-nudge" role="alert"><Icon name="info" size={26} />Kies eerst een antwoord. Daarna druk je op Volgende.</p>}
        </div>
      </div>
      <nav className="s-nav" aria-label="Vragen">
        <div className="s-nav__inner">
          <button type="button" className="s-btn" onClick={() => setStep(step - 1)}>
            <Icon name="arrowLeft" size={26} stroke={2.5} />Terug
          </button>
          <button type="button" className="s-btn s-btn--go" aria-disabled={!q.answered} onClick={next}>
            {editing ? "Naar overzicht" : step === SIMPLE_STEPS.length - 1 ? "Klaar" : "Volgende"}
            <Icon name="arrowRight" size={26} stroke={2.5} />
          </button>
        </div>
      </nav>
    </div>
  );
}

function simpleQuestion(id, draft, update, setEmfi) {
  if (id === "mood") {
    return {
      title: "Hoe gaat het met je?", sub: "Kies één gezicht.", columns: 3,
      answered: draft.mood !== null,
      selected: draft.mood === null ? null : clamp(draft.mood, 1, 3),
      onSelect: (v) => update({ mood: v }),
      choices: [1, 2, 3].map((v) => ({ value: v, label: MOODS[v], visual: <MoodFace value={v} size={80} tone /> })),
    };
  }
  if (id === "sleep") {
    return {
      title: "Hoe heb je geslapen?", sub: "Denk aan vannacht.", columns: 3,
      answered: draft.sleep > 0,
      selected: draft.sleep ? clamp(draft.sleep, 2, 4) : null,
      onSelect: (v) => update({ sleep: v }),
      choices: [
        { value: 2, label: "Slecht geslapen", visual: <MoodFace value={1} size={80} tone /> },
        { value: 3, label: "Gaat wel", visual: <MoodFace value={2} size={80} tone /> },
        { value: 4, label: "Goed geslapen", visual: <MoodFace value={3} size={80} tone /> },
      ],
    };
  }
  if (id === "talk") {
    return {
      title: "Wil je vandaag praten met je begeleider?", sub: "Je begeleider komt dan naar je toe.", columns: 2,
      answered: draft.talk !== null,
      selected: draft.talk,
      onSelect: (v) => update({ talk: v }),
      choices: [
        { value: true, label: "Ja, graag", visual: <span className="s-picto">💬</span> },
        { value: false, label: "Nee, nu niet", visual: <span className="s-picto">✋</span> },
      ],
    };
  }
  const d = EMFI.find((x) => x.key === id);
  return {
    title: d.simpleQuestion, sub: "Kies wat het best past.", columns: "emfi",
    answered: !!draft.emfi[id],
    selected: draft.emfi[id] ?? null,
    onSelect: (v) => setEmfi(id, v, false),
    choices: [
      ...d.options.filter((o) => o.simple).map((o) => ({ value: o.value, label: o.simple, visual: <span className="s-picto">{o.picto}</span> })),
      { value: DONT_KNOW, label: DONT_KNOW, visual: <span className="s-picto">🤷</span>, wide: true },
    ],
  };
}

function SimpleChoices({ choices, selected, onSelect, columns, label }) {
  const name = useId();
  return (
    <fieldset className={cx("s-grid", columns === 3 && "s-grid--3", columns === "emfi" && "s-grid--emfi")}>
      <legend className="sr-only">{label}</legend>
      {choices.map((c) => {
        const on = selected === c.value;
        return (
          <label key={String(c.value)} className={cx("s-tile", on && "is-on", c.wide && "s-tile--wide")}>
            <input type="radio" className="sr-only" name={name} checked={on} onChange={() => onSelect(c.value)} />
            {c.visual}
            <span className="s-tile__label">{c.label}</span>
            <span className="s-tile__check" aria-hidden="true"><Icon name="check" size={24} stroke={3.4} /></span>
          </label>
        );
      })}
    </fieldset>
  );
}

function SpeakButton({ speech, text }) {
  if (!speech.supported) return null;
  return (
    <button type="button" className="s-speak" aria-pressed={speech.speaking} onClick={() => (speech.speaking ? speech.stop() : speech.speak(text))}>
      <Icon name={speech.speaking ? "stop" : "volume"} size={26} stroke={2.4} />
      {speech.speaking ? "Stop" : "Lees voor"}
    </button>
  );
}

function SimpleIntro({ speech, titleRef, bodyRef, todayEntry, callAt, callAck, onCall, onStart }) {
  const text = todayEntry
    ? `Hallo ${SELF.firstName}. Je hebt vandaag al ingecheckt. Wil je het opnieuw doen? Druk op Opnieuw.`
    : `Hallo ${SELF.firstName}. We stellen je ${SIMPLE_STEPS.length} korte vragen. ${SIMPLE_STEPS.map((s, i) => `${i + 1}: ${s.name}`).join(". ")}. Het duurt ongeveer 2 minuten. Druk op Beginnen.`;
  return (
    <div className="s-screen">
      <div className="s-body" ref={bodyRef}>
        <div className="s-inner">
          <div className="s-head">
            <h1 className="s-title" ref={titleRef} tabIndex={-1}>Hallo {SELF.firstName} 👋</h1>
            <SpeakButton speech={speech} text={text} />
          </div>
          {todayEntry ? (
            <p className="s-msg s-msg--ok"><Icon name="checkCircle" size={30} />Je hebt vandaag al ingecheckt om {fmtTime(todayEntry.at)}.</p>
          ) : (
            <>
              <p className="s-sub">We stellen je {SIMPLE_STEPS.length} korte vragen. Het duurt ongeveer 2 minuten.</p>
              <ol className="s-list">
                {SIMPLE_STEPS.map((s, i) => (
                  <li key={s.id} className="s-list__item">
                    <span className="s-list__num">{i + 1}</span>
                    <span className="s-list__picto" aria-hidden="true">{s.picto}</span>
                    {s.name}
                  </li>
                ))}
              </ol>
            </>
          )}
          <div className="s-call">
            {callAt ? (
              <p className="s-msg" role="status">
                <span className="s-picto s-picto--sm" aria-hidden="true">{callAck ? "✅" : "🔔"}</span>
                {callAck ? `${STAFF_USER.firstName} komt naar je toe.` : "Iemand van het team komt naar je toe."}
              </p>
            ) : (
              <button type="button" className="s-btn s-btn--wide" onClick={onCall}>
                <span className="s-picto s-picto--sm" aria-hidden="true">🙋</span>Ik wil nu met iemand praten
              </button>
            )}
          </div>
        </div>
      </div>
      <nav className="s-nav" aria-label="Starten">
        <div className="s-nav__inner">
          <button type="button" className="s-btn s-btn--go" onClick={onStart}>
            {todayEntry ? "Opnieuw" : "Beginnen"}<Icon name="arrowRight" size={26} stroke={2.5} />
          </button>
        </div>
      </nav>
    </div>
  );
}

function simpleAnswer(id, draft) {
  if (id === "mood") return draft.mood !== null ? { label: MOODS[draft.mood], visual: <MoodFace value={draft.mood} size={50} tone /> } : null;
  if (id === "sleep") return draft.sleep ? { label: SLEEP[draft.sleep], visual: <span className="s-picto s-picto--sm">🌙</span> } : null;
  if (id === "talk") return draft.talk === null ? null : { label: draft.talk ? "Ja, graag" : "Nee, nu niet", visual: <span className="s-picto s-picto--sm">{draft.talk ? "💬" : "✋"}</span> };
  const v = draft.emfi[id];
  if (!v) return null;
  const opt = EMFI.find((x) => x.key === id).options.find((o) => o.value === v);
  return { label: opt?.simple || v, visual: <span className="s-picto s-picto--sm">{opt?.picto || "🤷"}</span> };
}

function SimpleReview({ draft, speech, titleRef, bodyRef, onEdit, onBack, onSubmit }) {
  const rows = SIMPLE_STEPS.map((s, i) => ({ ...s, i, a: simpleAnswer(s.id, draft) }));
  const text = `Klopt dit? ${rows.map((r) => `${r.name}: ${r.a ? r.a.label : "niet ingevuld"}`).join(". ")}. Druk op Versturen.`;
  return (
    <div className="s-screen">
      <div className="s-body" ref={bodyRef}>
        <div className="s-inner">
          <div className="s-head">
            <h1 className="s-title" ref={titleRef} tabIndex={-1}>Klopt dit?</h1>
            <SpeakButton speech={speech} text={text} />
          </div>
          <p className="s-sub">Wil je iets anders? Druk op Verander.</p>
          <ul className="s-review">
            {rows.map((r) => (
              <li key={r.id} className="s-review__row">
                <span className="s-review__visual" aria-hidden="true">{r.a ? r.a.visual : <span className="s-picto s-picto--sm">{r.picto}</span>}</span>
                <span className="s-review__text">
                  <span className="s-review__q">{r.name}</span>
                  <span className="s-review__a">{r.a ? r.a.label : "Nog niet ingevuld"}</span>
                </span>
                <button type="button" className="s-edit" onClick={() => onEdit(r.i)}>
                  <Icon name="pencil" size={20} stroke={2.4} />Verander<span className="sr-only">: {r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <nav className="s-nav" aria-label="Versturen">
        <div className="s-nav__inner">
          <button type="button" className="s-btn" onClick={onBack}><Icon name="arrowLeft" size={26} stroke={2.5} />Terug</button>
          <button type="button" className="s-btn s-btn--go" onClick={onSubmit}>Versturen<Icon name="check" size={26} stroke={3} /></button>
        </div>
      </nav>
    </div>
  );
}

function SimpleDone({ entry, speech, titleRef, bodyRef, onDone }) {
  const lines = ["Je begeleider kan je antwoorden nu zien."];
  if (entry.talk) lines.push("Je begeleider komt straks naar je toe.");
  if (entry.mood !== null && entry.mood <= 1) lines.push("Gaat het niet goed? Zeg het meteen tegen iemand van het team.");
  return (
    <div className="s-screen">
      <div className="s-body" ref={bodyRef}>
        <div className="s-inner s-done">
          <span className="s-done__mark" aria-hidden="true"><Icon name="check" size={68} stroke={3} /></span>
          <h1 className="s-title" ref={titleRef} tabIndex={-1}>Klaar! Dank je wel.</h1>
          <ul className="s-msgs">
            {lines.map((l) => <li key={l} className="s-msg">{l}</li>)}
          </ul>
          <div className="s-done__speak"><SpeakButton speech={speech} text={`Klaar! Dank je wel. ${lines.join(" ")}`} /></div>
          <SyncStatus at={entry.at} short />
        </div>
      </div>
      <nav className="s-nav" aria-label="Afsluiten">
        <div className="s-nav__inner">
          <button type="button" className="s-btn s-btn--go" onClick={onDone}>Klaar<Icon name="check" size={26} stroke={3} /></button>
        </div>
      </nav>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Begeleiding — desktopwerkplek
   ════════════════════════════════════════════════════════════════ */

function StaffApp({ ward, store, patch, now, lastSync, toPatient }) {
  const [page, setPage] = useState("overview");
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const wide = useMediaQuery("(min-width: 1280px)");
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const rows = useMemo(() => ward
    .map((p) => {
      const followedAt = isToday(store.followed[p.id], now) ? store.followed[p.id] : null;
      const remindedAt = isToday(store.reminded[p.id], now) ? store.reminded[p.id] : null;
      const notes = (store.notes[p.id] || []).filter((n) => isToday(n.at, now));
      return { ...p, a: assess(p), followedAt, remindedAt, notes };
    })
    .sort((x, y) => LEVELS[x.a.level].rank - LEVELS[y.a.level].rank
      || Number(!!y.checkin?.talk) - Number(!!x.checkin?.talk)
      || x.name.localeCompare(y.name, "nl")), [ward, store.followed, store.reminded, store.notes, now]);

  const q = query.trim().toLowerCase();
  const active = FILTERS.find((f) => f.id === filter);
  const visible = rows.filter(active.test).filter((r) => !q || r.name.toLowerCase().includes(q) || r.room.toLowerCase().includes(q));
  const selected = wide
    ? visible.find((r) => r.id === selectedId) || visible[0] || null
    : rows.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault();
      setPage("overview");
      requestAnimationFrame(() => searchRef.current?.focus());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const onListKey = (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    const btns = [...(listRef.current?.querySelectorAll("[data-rowbtn]") || [])];
    const i = btns.indexOf(document.activeElement);
    if (i < 0) return;
    e.preventDefault();
    const j = clamp(i + (e.key === "ArrowDown" ? 1 : -1), 0, btns.length - 1);
    btns[j].focus();
    if (wide) setSelectedId(btns[j].dataset.id);
  };

  const actions = {
    follow: (id) => patch((s) => ({ followed: { ...s.followed, [id]: isToday(s.followed[id], new Date()) ? null : new Date() } })),
    remind: (id) => patch((s) => ({ reminded: { ...s.reminded, [id]: new Date() } })),
    ack: () => patch({ callAck: new Date() }),
    note: (id, text) => patch((s) => ({ notes: { ...s.notes, [id]: [...(s.notes[id] || []), { text, at: new Date(), author: STAFF_USER.name }] } })),
  };

  const critical = rows.filter((r) => r.a.level === "critical").length;
  const attention = rows.filter((r) => r.a.level === "attention").length;

  return (
    <div className="staff">
      <aside className="sb">
        <div className="sb__brand">
          <Logo size={38} />
          <p className="brand__text"><span className="brand__name">Zilverlinde</span><span className="brand__ward">{ORG.ward}</span></p>
        </div>
        <nav className="sb__nav" aria-label="Werkplek">
          <button type="button" className="sb__link" aria-current={page === "overview" ? "page" : undefined} onClick={() => setPage("overview")}>
            <Icon name="grid" size={18} />Overzicht
            {critical + attention > 0 && <span className="sb__badge" title="Patiënten met signalen">{critical + attention}</span>}
          </button>
          <button type="button" className="sb__link" aria-current={page === "handover" ? "page" : undefined} onClick={() => setPage("handover")}>
            <Icon name="swap" size={18} />Overdracht
          </button>
        </nav>
        <div className="sb__spacer" />
        <button type="button" className="sb__demo" onClick={toPatient}>
          <Icon name="phone" size={18} />
          <span>Open patiënt-app<small>Demo</small></span>
        </button>
        <p className="sb__sync" title={`Laatste synchronisatie om ${fmtTime(lastSync)}`}>
          <span className="sync__dot" aria-hidden="true" />
          <span>Gesynchroniseerd met <b>{ORG.epd}</b><small>{capitalize(relTime(lastSync, now))}</small></span>
        </p>
        <div className="sb__user">
          <Avatar name={STAFF_USER.name} size={36} />
          <span><b>{STAFF_USER.name}</b><small>{STAFF_USER.role} · {shiftName(now).toLowerCase()}</small></span>
        </div>
      </aside>

      <div className="sm">
        {page === "overview" ? (
          <>
            <header className="sm__top">
              <div className="sm__titles">
                <h1 className="sm__title">Overzicht</h1>
                <p className="sm__sub">{shiftName(now)} · {fmtDateLong(now)} · {rows.length} patiënten</p>
              </div>
              <label className="search">
                <Icon name="search" size={17} />
                <span className="sr-only">Zoek patiënt of kamer</span>
                <input ref={searchRef} type="search" value={query} placeholder="Zoek naam of kamer" onChange={(e) => setQuery(e.target.value)} />
                <kbd aria-hidden="true">/</kbd>
              </label>
            </header>
            <div className="sm__content">
              <Kpis rows={rows} />
              <div className="toolbar">
                <div className="filters" role="group" aria-label="Filter patiënten">
                  {FILTERS.map((f) => (
                    <button key={f.id} type="button" className="fchip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
                      {f.label}<span className="fchip__n">{rows.filter(f.test).length}</span>
                    </button>
                  ))}
                </div>
                <MoodLegend />
              </div>
              <div className="split">
                <div className="plist" ref={listRef} onKeyDown={onListKey} aria-label="Patiënten, gesorteerd op prioriteit" role="group">
                  {visible.length ? visible.map((p) => (
                    <PatientRow key={p.id} p={p} now={now} selected={wide && selected?.id === p.id}
                      onSelect={() => setSelectedId(p.id)} onRemind={() => actions.remind(p.id)} />
                  )) : (
                    <div className="empty">
                      <Icon name="search" size={28} />
                      <p><strong>Niemand gevonden</strong></p>
                      <p>Probeer een andere filter of zoekterm.</p>
                    </div>
                  )}
                </div>
                {wide && (
                  <aside className="panel" aria-label="Details">
                    {selected
                      ? <PatientDetail key={selected.id} p={selected} now={now} actions={actions} />
                      : <div className="panel__empty"><Icon name="user" size={28} /><p>Kies een patiënt om de details te zien.</p></div>}
                  </aside>
                )}
              </div>
            </div>
          </>
        ) : (
          <Handover rows={rows} now={now} />
        )}
      </div>

      {!wide && (
        <Drawer open={!!selected} onClose={() => setSelectedId(null)} labelledBy="detail-title">
          {selected && <PatientDetail key={selected.id} p={selected} now={now} actions={actions} onClose={() => setSelectedId(null)} />}
        </Drawer>
      )}
    </div>
  );
}

function Kpis({ rows }) {
  const checked = rows.filter((r) => r.checkin);
  const open = rows.filter((r) => !r.checkin);
  const critical = rows.filter((r) => r.a.level === "critical");
  const attention = rows.filter((r) => r.a.level === "attention");
  const talkers = rows.filter((r) => r.checkin?.talk || (r.callAt && !r.callAck));
  const callers = rows.filter((r) => r.callAt && !r.callAck);
  const moods = checked.map((r) => r.checkin.mood);
  const avg = average(moods);
  const avgYesterday = average(rows.map((r) => r.history[r.history.length - 1]).filter((v) => v != null));
  const delta = avg !== null && avgYesterday !== null ? avg - avgYesterday : null;
  const dist = [0, 1, 2, 3, 4].map((v) => moods.filter((m) => m === v).length);
  const followedCrit = critical.filter((r) => r.followedAt).length;
  return (
    <section className="kpis" aria-label="Samenvatting van vandaag">
      <div className="kpi">
        <p className="kpi__label"><Icon name="checkCircle" size={16} />Check-ins vandaag</p>
        <p className="kpi__value">{checked.length}<small> / {rows.length}</small></p>
        <div className="meter" role="img" aria-label={`${checked.length} van ${rows.length} patiënten hebben ingecheckt`}>
          <i style={{ width: `${(checked.length / rows.length) * 100}%` }} />
        </div>
        <p className="kpi__sub">{open.length ? `Nog open: ${joinNl(open.map((r) => r.name))}` : "Iedereen heeft ingecheckt"}</p>
      </div>
      <div className="kpi">
        <p className="kpi__label"><Icon name="alert" size={16} />Direct opvolgen</p>
        <p className="kpi__value">{critical.length}</p>
        <p className="kpi__sub">
          {followedCrit > 0 && `${followedCrit} al opgevolgd · `}
          {attention.length} {attention.length === 1 ? "andere patiënt" : "andere patiënten"} met signalen
        </p>
      </div>
      <div className="kpi">
        <p className="kpi__label"><Icon name="chat" size={16} />Gespreksvragen</p>
        <p className="kpi__value">{talkers.length}</p>
        <p className="kpi__sub">
          {callers.length > 0 && <b className="kpi__urgent">{joinNl(callers.map((r) => firstName(r.name)))} vraagt nu een begeleider. </b>}
          {talkers.length ? joinNl(talkers.filter((r) => !callers.includes(r)).map((r) => firstName(r.name))) : "Geen vragen vandaag"}
        </p>
      </div>
      <div className="kpi kpi--wide">
        <p className="kpi__label"><Icon name="activity" size={16} />Stemming op de afdeling</p>
        <div className="kpi__row">
          <p className="kpi__value">{avg === null ? "—" : fmtNumber(avg)}<small> / 4</small></p>
          {delta !== null && (
            <p className={cx("delta", delta > 0.05 ? "is-up" : delta < -0.05 ? "is-down" : "is-flat")}>
              {delta > 0.05 ? "▲" : delta < -0.05 ? "▼" : "■"} {delta > 0 ? "+" : ""}{fmtNumber(delta)} t.o.v. gisteren
            </p>
          )}
        </div>
        <MoodDistribution dist={dist} />
      </div>
    </section>
  );
}

function MoodDistribution({ dist }) {
  const total = dist.reduce((s, v) => s + v, 0);
  return (
    <div className="dist">
      <div className="dist__bar" role="img" aria-label={`Verdeling: ${dist.map((n, v) => `${MOODS[v]} ${n}`).join(", ")}`}>
        {total === 0 && <i className="dist__empty" />}
        {dist.map((n, v) => n > 0 && <i key={v} style={{ flexGrow: n, background: `var(--mood-${v})` }} title={`${MOODS[v]}: ${n}`} />)}
      </div>
      <ul className="dist__legend">
        {dist.map((n, v) => (
          <li key={v} className={cx(n === 0 && "is-zero")}>
            <MoodFace value={v} size={18} tone />
            <span>{MOODS[v]}</span>
            <b>{n}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StatusPill({ level }) {
  const l = LEVELS[level];
  return <span className={cx("pill", `pill--${level}`)}><Icon name={l.icon} size={13} stroke={2.6} />{l.label}</span>;
}

function SignalList({ signals, talk, limit }) {
  const items = [...(talk ? [{ level: "talk", text: "Wil een gesprek" }] : []), ...signals];
  const shown = limit ? items.slice(0, limit) : items;
  const rest = items.length - shown.length;
  if (!items.length) return null;
  return (
    <ul className="signals">
      {shown.map((s) => (
        <li key={s.text} className={cx("sig", `sig--${s.level}`)}>
          <Icon name={s.level === "talk" ? "chat" : s.level === "critical" ? "alert" : "eye"} size={13} stroke={2.4} />{s.text}
        </li>
      ))}
      {rest > 0 && <li className="sig sig--more">+{rest}</li>}
    </ul>
  );
}

function PatientRow({ p, now, selected, onSelect, onRemind }) {
  const c = p.checkin;
  const a = p.a;
  const days = lastDays(7, now);
  const fresh = p.isSelf && c && now - c.at < 15 * 60000;
  return (
    <article className={cx("prow", `prow--${a.level}`, selected && "is-selected")} aria-current={selected ? "true" : undefined}>
      <button type="button" className="prow__btn" data-rowbtn="" data-id={p.id} onClick={onSelect}>
        <span className="sr-only">{p.name}, {LEVELS[a.level].label}, details openen</span>
      </button>
      <Avatar name={p.name} size={42} />
      <div className="prow__who">
        <p className="prow__name">{p.name}</p>
        <p className="prow__meta">
          {p.room}{c && <> · {fmtTime(c.at)}</>}
          {fresh && <span className="tag tag--new">Nieuw</span>}
          {c?.mode === "simple" && <span className="tag" title="Ingevuld in de eenvoudige modus">Eenvoudig</span>}
        </p>
      </div>
      <div className="prow__mood">
        {c ? <><MoodFace value={c.mood} size={34} tone /><b>{MOODS[c.mood]}</b></> : <span className="prow__none">Nog geen check-in</span>}
      </div>
      <div className="prow__week">
        <WeekStrip values={[...p.history, c ? c.mood : null]} days={days} />
      </div>
      <div className="prow__status">
        <StatusPill level={a.level} />
        {p.followedAt && <span className="followed"><Icon name="checkCircle" size={13} />Opgevolgd {fmtTime(p.followedAt)}</span>}
      </div>
      <div className="prow__line">
        {c ? (
          <ul className="etags" aria-label="EMFI">
            {EMFI.map((d) => c.emfi[d.key] && (
              <li key={d.key} className={cx("etag", `tone-${d.key}`)}>
                <Icon name={d.icon} size={14} /><span className="sr-only">{d.name}: </span>{c.emfi[d.key]}
              </li>
            ))}
          </ul>
        ) : (
          <button type="button" className="btn btn--secondary btn--xs prow__action" onClick={onRemind} disabled={!!p.remindedAt}>
            <Icon name={p.remindedAt ? "check" : "bell"} size={14} />
            {p.remindedAt ? `Herinnering verstuurd · ${fmtTime(p.remindedAt)}` : "Stuur herinnering"}
          </button>
        )}
      </div>
      {(a.signals.length > 0 || c?.talk) && (
        <div className="prow__line prow__line--signals"><SignalList signals={a.signals} talk={c?.talk} limit={3} /></div>
      )}
    </article>
  );
}

function Drawer({ open, onClose, labelledBy, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal?.();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="drawer" aria-labelledby={labelledBy}
      onClose={onClose} onClick={(e) => { if (e.target === ref.current) onClose(); }}>
      {children}
    </dialog>
  );
}

function PatientDetail({ p, now, actions, onClose }) {
  const c = p.checkin;
  const a = p.a;
  const days = lastDays(7, now);
  const points = days.map((date, i) => ({ date, mood: i < 6 ? p.history[i] : c ? c.mood : null }));
  return (
    <div className="dw">
      <header className="dw__head">
        <Avatar name={p.name} size={50} />
        <div className="dw__id">
          <h2 className="dw__name" id="detail-title">{p.name}</h2>
          <p className="dw__meta">{p.room} · {ORG.ward}</p>
        </div>
        {onClose && <button type="button" className="iconbtn" onClick={onClose} aria-label="Sluiten"><Icon name="x" size={20} /></button>}
      </header>

      <div className="dw__body">
        <div className="dw__status">
          <StatusPill level={a.level} />
          {c && <span className="dw__time"><Icon name="clock" size={14} />Check-in om {fmtTime(c.at)}{c.mode === "simple" && " · eenvoudige modus"}</span>}
        </div>

        {p.callAt && (
          <div className={cx("callout", !p.callAck && "callout--urgent")}>
            <Icon name={p.callAck ? "checkCircle" : "bell"} size={20} />
            <div>
              <strong>{p.callAck ? `Opgevolgd om ${fmtTime(p.callAck)}` : `Vraagt nu een begeleider · ${fmtTime(p.callAt)}`}</strong>
              <p>{p.callAck ? `${firstName(p.name)} ziet in de app dat je eraan komt.` : `Via de app. ${firstName(p.name)} ziet het meteen als je bevestigt.`}</p>
              {!p.callAck && <button type="button" className="btn btn--primary btn--sm" onClick={actions.ack}><Icon name="check" size={16} />Ik ga langs</button>}
            </div>
          </div>
        )}

        {c ? (
          <div className="dw__mood">
            <MoodFace value={c.mood} size={60} tone />
            <div>
              <p className="dw__moodlabel">{MOODS[c.mood]}</p>
              <p className="dw__moodsub">Stemming vandaag{a.streak >= 2 ? ` · ${a.streak} dagen laag` : ""}</p>
            </div>
          </div>
        ) : (
          <div className="callout callout--muted">
            <Icon name="clock" size={20} />
            <div><strong>Nog geen check-in vandaag</strong><p>Het weekverloop hieronder toont de vorige dagen.</p></div>
          </div>
        )}

        <section className="dw__sec">
          <h3 className="dw__h">Stemming · afgelopen 7 dagen</h3>
          <MoodChart points={points} />
        </section>

        {c && (
          <section className="dw__sec">
            <h3 className="dw__h">EMFI</h3>
            <div className="dw__emfi">
              {EMFI.map((d) => (
                <div key={d.key} className={cx("dw__dim", `tone-${d.key}`, !c.emfi[d.key] && "is-empty")}>
                  <span className="dim__badge"><Icon name={d.icon} size={18} /></span>
                  <div>
                    <p className="dw__dimname">{d.name}</p>
                    <p className="dw__dimval">{c.emfi[d.key] || "Niet ingevuld"}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {c && (
          <section className="dw__sec dw__facts">
            <div><p className="dw__h">Slaap</p><p className="dw__fact"><MoonPhase value={c.sleep || 0} size={22} />{c.sleep ? SLEEP[c.sleep] : "Niet ingevuld"}</p></div>
            <div><p className="dw__h">Activiteiten</p><p className="dw__fact">{c.activities.length ? c.activities.join(", ") : "Geen"}</p></div>
          </section>
        )}

        {c?.talk && (
          <div className="callout">
            <Icon name="chat" size={20} />
            <div><strong>Vraagt een gesprek</strong><p>{firstName(p.name)} gaf aan vandaag graag even te praten.</p></div>
          </div>
        )}

        {c?.thought && !c.thoughtPrivate && (
          <section className="dw__sec">
            <h3 className="dw__h">Notitie van {firstName(p.name)}</h3>
            <blockquote className="quote quote--lg">“{c.thought}”</blockquote>
          </section>
        )}

        {a.signals.length > 0 && (
          <section className="dw__sec">
            <h3 className="dw__h">Signalen</h3>
            <SignalList signals={a.signals} />
            <p className="dw__fine">Automatisch afgeleid uit de check-in en het weekverloop. Weeg altijd zelf af, samen met het team.</p>
          </section>
        )}

        <NotesBox p={p} onAdd={(text) => actions.note(p.id, text)} />
      </div>

      <footer className="dw__foot">
        <p className="syncline is-synced"><Icon name="shield" size={14} />Dossier gesynchroniseerd met <b>{ORG.epd}</b></p>
        {c ? (
          <button type="button" className={cx("btn", p.followedAt ? "btn--secondary" : "btn--primary")} onClick={() => actions.follow(p.id)} aria-pressed={!!p.followedAt}>
            <Icon name={p.followedAt ? "checkCircle" : "check"} size={18} />
            {p.followedAt ? `Opgevolgd om ${fmtTime(p.followedAt)}` : "Markeer als opgevolgd"}
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={() => actions.remind(p.id)} disabled={!!p.remindedAt}>
            <Icon name={p.remindedAt ? "check" : "bell"} size={18} />
            {p.remindedAt ? `Herinnering verstuurd · ${fmtTime(p.remindedAt)}` : "Stuur herinnering"}
          </button>
        )}
      </footer>
    </div>
  );
}

function NotesBox({ p, onAdd }) {
  const [text, setText] = useState("");
  const id = useId();
  const save = () => { if (!text.trim()) return; onAdd(text.trim()); setText(""); };
  return (
    <section className="dw__sec">
      <h3 className="dw__h">Rapportering</h3>
      {p.notes.length > 0 && (
        <ul className="notes">
          {p.notes.map((n) => (
            <li key={n.at.toISOString()} className="note">
              <p>{n.text}</p>
              <p className="note__meta">{n.author} · {fmtTime(n.at)} · <Icon name="shield" size={12} />in {ORG.epd}</p>
            </li>
          ))}
        </ul>
      )}
      <label className="sr-only" htmlFor={id}>Nieuwe notitie over {firstName(p.name)}</label>
      <textarea id={id} className="textarea textarea--sm" rows={3} value={text} placeholder={`Korte notitie over ${firstName(p.name)}…`}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) save(); }} />
      <div className="notes__actions">
        <span className="muted small">Ctrl + Enter om op te slaan</span>
        <button type="button" className="btn btn--secondary btn--sm" disabled={!text.trim()} onClick={save}><Icon name="send" size={15} />Opslaan in dossier</button>
      </div>
    </section>
  );
}

function Handover({ rows, now }) {
  const sections = buildHandover(rows);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const text = handoverText(sections, now);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand("copy"); } catch { /* */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };
  return (
    <>
      <header className="sm__top">
        <div className="sm__titles">
          <h1 className="sm__title">Overdracht</h1>
          <p className="sm__sub">{shiftName(now)} → {nextShiftName(now)} · {fmtDateLong(now)}</p>
        </div>
        <div className="ho__actions">
          <button type="button" className="btn btn--secondary" onClick={copy} aria-live="polite">
            <Icon name={copied ? "check" : "copy"} size={18} />{copied ? "Gekopieerd" : "Kopieer als tekst"}
          </button>
          <button type="button" className="btn btn--primary" onClick={() => window.print()}><Icon name="printer" size={18} />Afdrukken</button>
        </div>
      </header>
      <div className="sm__content ho">
        <p className="ho__intro">Automatisch samengesteld uit de check-ins en de rapportering van vandaag. Vul aan waar nodig.</p>
        <div className="ho__grid">
          {sections.map((s) => (
            <section key={s.id} className={cx("ho-sec", `ho-sec--${s.id}`)}>
              <h2 className="ho-sec__title"><span className="ho-dot" aria-hidden="true" />{s.title}<span className="ho-sec__n">{s.items.length}</span></h2>
              {s.items.length ? (
                <ul className="ho-list">
                  {s.items.map((it) => (
                    <li key={it.id} className="ho-item">
                      <p className="ho-item__top">
                        <b>{it.name}</b><span>{it.room}</span>
                        {it.mood != null && <span className="ho-item__mood"><MoodFace value={it.mood} size={18} tone />{MOODS[it.mood]}</span>}
                      </p>
                      {it.lines.map((l) => <p key={l} className="ho-item__line">{l}</p>)}
                    </li>
                  ))}
                </ul>
              ) : <p className="muted small">Niemand.</p>}
            </section>
          ))}
        </div>
      </div>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════
   Stijl
   ════════════════════════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700&family=Figtree:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');

:root {
  color-scheme: light;
  --font-ui: "Figtree", ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-display: "Instrument Serif", "Iowan Old Style", Georgia, serif;
  --font-simple: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", Verdana, ui-sans-serif, sans-serif;
  --font-emoji: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;

  --bg: #F3F2EC;
  --surface: #FFFFFF;
  --surface-2: #F7F6F1;
  --surface-3: #ECEBE4;
  --line: #E4E3DB;
  --line-strong: #CBCAC0;
  --ink: #17201C;
  --ink-2: #47524C;
  --ink-3: #636D68;
  --brand: #24594B;
  --brand-hover: #1B4A3E;
  --brand-ink: #FFFFFF;
  --brand-soft: #E0ECE5;
  --brand-soft-ink: #1D4D40;
  --focus: #2563EB;
  --glow-1: rgba(36, 89, 75, .11);
  --glow-2: rgba(232, 123, 164, .09);

  /* EMFI — gevalideerd op kleurenblindheid; altijd samen met icoon + tekst */
  --e: #E87BA4; --e-soft: #FCE8EF; --e-ink: #A8346A; --e-on: #17201C;
  --m: #6250D6; --m-soft: #EBE8FB; --m-ink: #4B3BC0; --m-on: #FFFFFF;
  --f: #1BAF7A; --f-soft: #DCF3E9; --f-ink: #0B7650; --f-on: #17201C;
  --i: #EDA100; --i-soft: #FCF0D2; --i-ink: #8A5A00; --i-on: #17201C;

  --crit: #C9372C; --crit-soft: #FCE6E3; --crit-ink: #9F2A21;
  --warn: #D97A0A; --warn-soft: #FDEEDB; --warn-ink: #8C4A04;
  --ok: #2F8F5B;

  /* Stemming: divergerend koel (laag) → neutraal → warm (hoog) */
  --mood-0: #8E9FDB; --mood-1: #BAC5EA; --mood-2: #D6D3C9; --mood-3: #F5D58A; --mood-4: #F0B449;
  --face-ink: #1E2622;
  --moon-dark: #DCDFE8; --moon-lit: #F1C95E; --moon-ring: #9AA2B4;

  --r-xl: 28px;
  --shadow-1: 0 1px 2px rgba(23, 32, 28, .04), 0 4px 14px -6px rgba(23, 32, 28, .08);
  --shadow-2: 0 2px 6px rgba(23, 32, 28, .05), 0 22px 44px -20px rgba(23, 32, 28, .28);
  --ease: cubic-bezier(.2, .7, .2, 1);
  --sat: env(safe-area-inset-top, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
}

@media (prefers-color-scheme: dark) {
  :root {
    color-scheme: dark;
    --bg: #0F1412;
    --surface: #171D1A;
    --surface-2: #1C2320;
    --surface-3: #252D29;
    --line: #29312D;
    --line-strong: #3A4540;
    --ink: #ECEFEC;
    --ink-2: #B6C0BA;
    --ink-3: #8D9893;
    --brand: #7FC4AA;
    --brand-hover: #95D2BA;
    --brand-ink: #0C1E17;
    --brand-soft: #1B302A;
    --brand-soft-ink: #A9DEC8;
    --focus: #7AA7FF;
    --glow-1: rgba(127, 196, 170, .08);
    --glow-2: rgba(212, 101, 152, .07);

    --e: #D46598; --e-soft: #3A2230; --e-ink: #F4B1CC; --e-on: #0F1412;
    --m: #8274EE; --m-soft: #252143; --m-ink: #C3BBFF; --m-on: #0F1412;
    --f: #0D8C60; --f-soft: #14322A; --f-ink: #8BE3C0; --f-on: #FFFFFF;
    --i: #C08300; --i-soft: #352910; --i-ink: #F5CE78; --i-on: #0F1412;

    --crit: #F07A70; --crit-soft: #3A1C19; --crit-ink: #FFB4AB;
    --warn: #F2A050; --warn-soft: #3A2613; --warn-ink: #F8C994;
    --ok: #5CCB8F;
    --moon-dark: #2B3340; --moon-lit: #F2D37C; --moon-ring: #5B6578;
    --shadow-1: 0 1px 2px rgba(0, 0, 0, .3);
    --shadow-2: 0 24px 48px -20px rgba(0, 0, 0, .6);
  }
}

.tone-E { --tone: var(--e); --tone-soft: var(--e-soft); --tone-ink: var(--e-ink); --tone-on: var(--e-on); }
.tone-M { --tone: var(--m); --tone-soft: var(--m-soft); --tone-ink: var(--m-ink); --tone-on: var(--m-on); }
.tone-F { --tone: var(--f); --tone-soft: var(--f-soft); --tone-ink: var(--f-ink); --tone-on: var(--f-on); }
.tone-I { --tone: var(--i); --tone-soft: var(--i-soft); --tone-ink: var(--i-ink); --tone-on: var(--i-on); }

/* ── Basis ─────────────────────────────────────────────── */
html { -webkit-text-size-adjust: 100%; }
html:has(dialog[open]) { overflow: hidden; }
html:has(.zl[data-view="patient"]) { overscroll-behavior: none; }
body { margin: 0; background: var(--bg); }
.zl {
  min-height: 100vh; min-height: 100dvh;
  position: relative; isolation: isolate; overflow-x: clip;
  background: var(--bg); color: var(--ink);
  font-family: var(--font-ui); font-size: 16px; line-height: 1.5;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
  -webkit-tap-highlight-color: transparent;
}
.zl *, .zl *::before, .zl *::after { box-sizing: border-box; }
.zl :where(h1, h2, h3, p, ul, ol, li, dl, dt, dd, figure, blockquote, fieldset, legend) { margin: 0; padding: 0; }
.zl :where(ul, ol) { list-style: none; }
.zl fieldset { border: 0; min-width: 0; }
.zl :where(button, input, textarea) { font: inherit; color: inherit; }
.zl button { cursor: pointer; }
.zl :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.zl::before {
  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(900px 520px at 8% -10%, var(--glow-1), transparent 65%),
    radial-gradient(760px 520px at 100% -5%, var(--glow-2), transparent 62%);
}
.sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.ic { flex: none; display: block; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
.muted { color: var(--ink-2); }
.nowrap { white-space: nowrap; }
.small { font-size: 13.5px; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--ink-2); }

.logo { flex: none; display: block; }
.logo__bg { fill: var(--brand); }
.logo__leaf { fill: var(--brand-soft); }
.logo__vein { fill: none; stroke: var(--brand); stroke-width: 1.7; stroke-linecap: round; }
.brand__text { display: flex; flex-direction: column; line-height: 1.05; }
.brand__name { font-family: var(--font-display); font-size: 24px; letter-spacing: .005em; }
.brand__ward { font-size: 11.5px; font-weight: 700; color: var(--ink-2); letter-spacing: .09em; text-transform: uppercase; margin-top: 2px; }

/* ── Knoppen & schakelaars ─────────────────────────────── */
.btn {
  --h: 48px;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  min-height: var(--h); padding: 0 22px; border-radius: 14px; border: 1px solid transparent;
  font-size: 16px; font-weight: 600; white-space: nowrap; text-decoration: none;
  transition: background .2s var(--ease), border-color .2s, color .2s, box-shadow .2s, transform .15s;
}
.btn:active { transform: scale(.98); }
.btn--primary { background: var(--brand); color: var(--brand-ink); box-shadow: 0 10px 22px -12px color-mix(in srgb, var(--brand) 80%, transparent); }
.btn--primary:hover { background: var(--brand-hover); }
.btn--primary[aria-disabled="true"] { background: var(--surface-3); color: var(--ink-2); box-shadow: none; }
.btn--secondary { background: var(--surface); border-color: var(--line-strong); color: var(--ink); }
.btn--secondary:hover { border-color: var(--ink-3); }
.btn--ghost { background: transparent; color: var(--ink-2); }
.btn--ghost:hover { background: var(--surface-3); color: var(--ink); }
.btn--onbrand { background: var(--brand-ink); color: var(--brand); }
.btn--lg { --h: 56px; font-size: 17px; border-radius: 18px; }
.btn--sm { --h: 40px; padding: 0 15px; font-size: 14px; border-radius: 12px; gap: 8px; }
.btn--xs { --h: 32px; padding: 0 12px; font-size: 13px; border-radius: 10px; gap: 6px; }
.btn--block { width: 100%; }
.btn:disabled { cursor: default; opacity: .75; transform: none; }
.iconbtn {
  width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 14px;
  border: 1px solid var(--line); background: var(--surface); color: var(--ink-2);
}
.iconbtn:hover { color: var(--ink); border-color: var(--line-strong); }
.iconbtn--plain { border-color: transparent; background: transparent; color: var(--ink); }
.iconbtn--plain:hover { background: var(--surface-3); border-color: transparent; }
.iconbtn.is-hidden { visibility: hidden; }
.link { display: inline-flex; align-items: center; gap: 2px; padding: 6px 4px; border: 0; background: none; color: var(--brand-soft-ink); font-size: 14.5px; font-weight: 700; }
.link--block { margin-top: 4px; }
.link:hover { text-decoration: underline; text-underline-offset: 3px; }

.mswitch {
  display: inline-flex; align-items: center; gap: 10px; min-height: 44px; padding: 0 10px 0 14px;
  border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface);
  color: var(--ink); font-size: 14px; font-weight: 600; transition: border-color .2s;
}
.mswitch:hover { border-color: var(--ink-3); }
.track {
  --tw: 40px; --th: 24px; --tk: 16px;
  position: relative; flex: none; width: var(--tw); height: var(--th); border-radius: 999px;
  background: var(--surface-3); box-shadow: inset 0 0 0 1.5px var(--line-strong);
  transition: background .2s var(--ease), box-shadow .2s;
}
.track::after {
  content: ""; position: absolute; top: calc((var(--th) - var(--tk)) / 2); left: calc((var(--th) - var(--tk)) / 2);
  width: var(--tk); height: var(--tk); border-radius: 50%; background: var(--ink-3);
  transition: transform .25s var(--ease), background .2s;
}
[aria-checked="true"] > .track { background: var(--brand); box-shadow: none; }
[aria-checked="true"] > .track::after { transform: translateX(calc(var(--tw) - var(--th))); background: var(--brand-ink); }

.tag { display: inline-flex; align-items: center; height: 21px; padding: 0 8px; border-radius: 999px; background: var(--surface-3); color: var(--ink-2); font-size: 11.5px; font-weight: 700; letter-spacing: .01em; white-space: nowrap; }
.tag--new { background: var(--brand); color: var(--brand-ink); }
.tag--now { background: var(--brand); color: var(--brand-ink); }
.avatar { flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--surface-3); color: var(--ink-2); font-weight: 700; letter-spacing: .02em; }
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-xl); box-shadow: var(--shadow-1); }
.pad { padding: 18px; }

/* Gezichtjes, maan */
.face { display: block; flex: none; overflow: visible; }
.face__bg { fill: var(--face-fill, var(--surface)); stroke: var(--face-line, var(--ink-3)); stroke-width: 2; transition: fill .25s, stroke .25s; }
.face__eye { fill: var(--face-line, var(--ink-3)); transition: fill .25s; }
.face__ft { fill: none; stroke: var(--face-line, var(--ink-3)); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; transition: stroke .25s; }
.face__mouth { transition: d .35s var(--ease), stroke .25s; }
.face--tone { --face-line: var(--face-ink); }
.moon { display: block; flex: none; }
.moon__dark { fill: var(--moon-dark); }
.moon__lit { fill: var(--moon-lit); }
.moon__ring { fill: none; stroke: var(--moon-ring); stroke-width: 1.2; }
.mini-badge { width: 24px; height: 24px; flex: none; display: grid; place-items: center; border-radius: 8px; background: var(--tone-soft); color: var(--tone-ink); }
.dim__badge { width: 42px; height: 42px; flex: none; display: grid; place-items: center; border-radius: 13px; background: var(--tone-soft); color: var(--tone-ink); }

.syncline { display: inline-flex; align-items: center; justify-content: center; gap: 7px; flex-wrap: wrap; font-size: 12.5px; color: var(--ink-3); }
.syncline b { font-weight: 700; color: var(--ink-2); letter-spacing: .01em; }
.syncline.is-synced .ic { color: var(--ok); }
.sync__dot { flex: none; width: 8px; height: 8px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 22%, transparent); animation: breathe 3.2s ease-in-out infinite; }
@keyframes breathe { 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--ok) 6%, transparent); } }

/* Grafiek */
.mchart { display: flex; flex-direction: column; gap: 8px; }
.mchart__plot { position: relative; }
.mchart svg { display: block; width: 100%; height: auto; overflow: visible; }
.mchart__grid { stroke: var(--line); stroke-width: 1; }
.mchart__area { fill: var(--brand); opacity: .1; }
.mchart__line { fill: none; stroke: var(--brand); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.mchart__dot { fill: var(--brand); stroke: var(--surface); stroke-width: 2; }
.mchart__dot.is-hover { r: 6; }
.mchart__cross { stroke: var(--line-strong); stroke-width: 1; }
.mchart__x { font-family: var(--font-ui); font-size: 11.5px; fill: var(--ink-3); font-weight: 500; }
.mchart__x.is-today { fill: var(--ink); font-weight: 700; }
.tip { position: absolute; z-index: 2; transform: translate(-50%, calc(-100% - 12px)); display: flex; flex-direction: column; padding: 7px 11px; border-radius: 10px; background: var(--ink); color: var(--bg); font-size: 12.5px; line-height: 1.3; white-space: nowrap; pointer-events: none; box-shadow: var(--shadow-2); }
.tip__day { opacity: .75; }
.tip__val { font-weight: 700; }
.tableview summary { cursor: pointer; font-size: 13px; font-weight: 600; color: var(--ink-2); width: max-content; }
.tableview table { width: 100%; margin-top: 8px; border-collapse: collapse; font-size: 13.5px; }
.tableview th, .tableview td { padding: 7px 4px; text-align: left; border-bottom: 1px solid var(--line); }
.tableview th { font-size: 12px; color: var(--ink-2); font-weight: 700; }

/* ════ Patiënt: presentatie & toestel ════════════════════ */
.stage { position: relative; min-height: 100vh; min-height: 100dvh; }
.stage__info { display: none; }
.device { position: relative; height: 100vh; height: 100dvh; }
.device__screen { position: relative; height: 100%; overflow: hidden; background: var(--bg); }
.device__status, .device__island, .device__home { display: none; }

@media (min-width: 1024px) and (min-height: 700px) and (hover: hover) and (pointer: fine) {
  .stage { display: grid; grid-template-columns: minmax(0, 460px) auto; align-items: center; justify-content: center; gap: clamp(48px, 7vw, 120px); padding: 32px 48px; }
  .stage__info { display: block; }
  .device {
    width: 417px; height: min(876px, calc(100dvh - 64px)); padding: 12px; border-radius: 64px; background: #0B0F0D;
    box-shadow: inset 0 0 0 1.5px #2D3430, 0 0 0 1px rgba(0, 0, 0, .06), 0 50px 90px -36px rgba(16, 24, 20, .5), 0 24px 44px -26px rgba(16, 24, 20, .4);
  }
  .device__screen { border-radius: 52px; --sat: 54px; --sab: 20px; }
  .device__status { display: flex; position: absolute; z-index: 90; inset: 0 0 auto 0; height: 54px; padding: 4px 30px 0 44px; align-items: center; justify-content: space-between; font-size: 16px; font-weight: 600; color: var(--ink); pointer-events: none; font-family: var(--font-ui); }
  .device__icons { display: inline-flex; align-items: center; gap: 6px; fill: currentColor; }
  .device__island { display: block; position: absolute; z-index: 91; top: 11px; left: 50%; width: 124px; height: 36px; margin-left: -62px; border-radius: 20px; background: #000; }
  .device__home { display: block; position: absolute; z-index: 91; bottom: 7px; left: 50%; width: 136px; height: 5px; margin-left: -68px; border-radius: 3px; background: var(--ink); opacity: .8; pointer-events: none; }
}
.stage__brand { display: flex; align-items: center; gap: 12px; margin-bottom: 44px; font-family: var(--font-display); font-size: 28px; }
.stage__title { font-family: var(--font-display); font-weight: 400; font-size: clamp(52px, 5vw, 76px); line-height: .96; letter-spacing: -.02em; margin-top: 14px; }
.stage__title em { font-style: italic; color: var(--brand); }
.stage__lede { margin-top: 18px; font-size: 18px; color: var(--ink-2); max-width: 40ch; text-wrap: pretty; }
.stage__feats { display: grid; gap: 16px; margin-top: 32px; }
.stage__feats li { display: grid; grid-template-columns: 40px minmax(0, 1fr); column-gap: 14px; }
.stage__feats b { grid-column: 2; font-size: 15.5px; }
.stage__feats li > span:last-child { grid-column: 2; font-size: 14.5px; color: var(--ink-2); line-height: 1.45; }
.stage__ficon { grid-row: span 2; width: 40px; height: 40px; display: grid; place-items: center; border-radius: 12px; background: var(--brand-soft); color: var(--brand-soft-ink); }
.stage__ctrl { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; margin-top: 34px; }
.stage__fine { margin-top: 18px; font-size: 13px; color: var(--ink-3); }

/* ════ Patiënt-app ═══════════════════════════════════════ */
.app { position: relative; height: 100%; display: flex; flex-direction: column; overflow: hidden; background: var(--bg); color: var(--ink); font-family: var(--font-ui); container: app / inline-size; isolation: isolate; }
.app__main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.app__head { flex: none; display: flex; align-items: center; gap: 8px; padding: calc(var(--sat) + 8px) 14px 8px 16px; background: var(--bg); }
.app__brand { display: flex; align-items: center; gap: 10px; margin-right: auto; font-family: var(--font-display); font-size: 21px; min-width: 0; }
.mswitch--app { min-height: 38px; gap: 8px; padding: 0 6px 0 12px; font-size: 13.5px; }
.mswitch--app .track { --tw: 34px; --th: 22px; --tk: 14px; }
.avatar-btn { flex: none; padding: 0; border: 0; background: none; border-radius: 50%; }
.app__body { flex: 1; min-height: 0; position: relative; }
.scroll { position: absolute; inset: 0; overflow-y: auto; overscroll-behavior: contain; scrollbar-width: thin; }
.tab-page { display: flex; flex-direction: column; gap: 24px; max-width: 640px; margin: 0 auto; padding: 6px 16px 32px; }
@container app (min-width: 600px) { .tab-page { padding: 16px 32px 48px; gap: 28px; } }

.tabbar { flex: none; display: grid; grid-template-columns: repeat(3, 1fr); padding: 6px 10px calc(var(--sab) + 6px); border-top: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 94%, transparent); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
.tabbar__btn { display: flex; flex-direction: column; align-items: center; gap: 3px; padding: 6px 0 4px; border: 0; background: none; color: var(--ink-2); font-size: 12px; font-weight: 600; border-radius: 14px; }
.tabbar__icon { display: grid; place-items: center; width: 60px; height: 32px; border-radius: 999px; transition: background .2s var(--ease), color .2s; }
.tabbar__btn[aria-current="page"] { color: var(--ink); }
.tabbar__btn[aria-current="page"] .tabbar__icon { background: var(--brand-soft); color: var(--brand-soft-ink); }

.app-display { font-family: var(--font-display); font-weight: 400; font-size: clamp(42px, 12cqi, 60px); line-height: .98; letter-spacing: -.018em; margin-top: 8px; }
.app-display em { font-style: italic; color: var(--brand); }
.app-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(38px, 10.5cqi, 52px); line-height: 1; letter-spacing: -.015em; }
.page-head { padding-top: 6px; display: flex; flex-direction: column; gap: 6px; }
.today-head { padding-top: 6px; }
.block { display: flex; flex-direction: column; gap: 10px; }
.block__head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.block__title { font-size: 17px; font-weight: 700; }
.block__lead { margin-top: -6px; }

/* Check-in kaart */
.cicard { position: relative; overflow: hidden; padding: 18px 16px 16px; border-radius: 28px; background: var(--brand); color: var(--brand-ink); box-shadow: 0 22px 44px -26px color-mix(in srgb, var(--brand) 90%, transparent); }
.cicard::before { content: ""; position: absolute; right: -60px; top: -80px; width: 260px; height: 260px; border-radius: 50%; border: 36px solid color-mix(in srgb, var(--brand-ink) 6%, transparent); pointer-events: none; }
.cicard__top { position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; font-weight: 600; }
.cicard__chip { display: inline-flex; align-items: center; gap: 6px; padding: 4px 10px; border-radius: 999px; background: color-mix(in srgb, var(--brand-ink) 14%, transparent); }
.cicard__remind { position: relative; display: flex; align-items: center; gap: 8px; margin-top: 12px; padding: 8px 12px; border-radius: 12px; background: color-mix(in srgb, var(--brand-ink) 12%, transparent); font-size: 13.5px; font-weight: 600; }
.cicard__title { position: relative; font-family: var(--font-display); font-weight: 400; font-size: 34px; line-height: 1.04; margin-top: 16px; }
.cicard__sub { position: relative; font-size: 14.5px; opacity: .88; margin-top: 4px; margin-bottom: 16px; }
.cicard__faces { position: relative; display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.cicard__face { display: flex; flex-direction: column; align-items: center; gap: 6px; padding: 10px 2px 9px; border: 0; border-radius: 16px; background: color-mix(in srgb, var(--brand-ink) 9%, transparent); color: inherit; font-size: 11px; font-weight: 600; line-height: 1.15; text-align: center; transition: background .2s, transform .2s var(--ease); }
.cicard__face .face { --face-fill: color-mix(in srgb, var(--brand-ink) 10%, transparent); --face-line: currentColor; transition: transform .25s var(--ease); }
.cicard__face:hover, .cicard__face:focus-visible { background: color-mix(in srgb, var(--brand-ink) 18%, transparent); }
.cicard__face:hover .face, .cicard__face:focus-visible .face { --face-fill: var(--tone); --face-line: var(--face-ink); transform: scale(1.08); }
.cicard__face:active { transform: scale(.96); }
.cicard :focus-visible { outline-color: var(--brand-ink); }

.donecard { display: flex; flex-direction: column; gap: 14px; padding: 16px; border-radius: 28px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-1); }
.donecard__head { display: flex; align-items: center; gap: 12px; }
.donecard__check { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--brand); color: var(--brand-ink); }
.donecard__title { font-weight: 700; font-size: 17px; }
.donecard__sub { font-size: 13.5px; color: var(--ink-2); }
.donecard__sum { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 18px; background: var(--surface-2); }
.donecard__sumtext { display: flex; flex-direction: column; min-width: 0; line-height: 1.3; }
.donecard__sumtext span { font-size: 13.5px; color: var(--ink-2); }
.donecard__foot { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.donecard__foot .syncline { justify-content: flex-start; }

.callbar { display: flex; align-items: center; gap: 12px; width: 100%; padding: 12px 14px; border-radius: 20px; border: 1.5px solid var(--warn); background: var(--warn-soft); color: var(--warn-ink); text-align: left; }
.callbar.is-ack { border-color: var(--brand); background: var(--brand-soft); color: var(--brand-soft-ink); }
.callbar__icon { width: 38px; height: 38px; flex: none; display: grid; place-items: center; border-radius: 12px; background: var(--surface); }
.callbar__text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.callbar__text span { font-size: 13px; }

/* Dagplanning */
.sched { display: flex; flex-direction: column; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); overflow: hidden; }
.sched__item { display: grid; grid-template-columns: 48px 32px minmax(0, 1fr) auto; align-items: center; gap: 10px; min-height: 60px; padding: 8px 14px; border-top: 1px solid var(--line); }
.sched__item:first-child { border-top: 0; }
.sched__time { font-size: 14px; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--ink-2); }
.sched__icon { width: 32px; height: 32px; display: grid; place-items: center; border-radius: 10px; background: var(--surface-3); color: var(--ink-2); }
.sched__body { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
.sched__title { font-weight: 600; }
.sched__sub { font-size: 13px; color: var(--ink-2); }
.sched__item.is-past { opacity: .55; }
.sched__item.is-now { background: color-mix(in srgb, var(--brand-soft) 60%, var(--surface)); }
.sched__item.is-now .sched__icon { background: var(--brand); color: var(--brand-ink); }
.sched__item.is-now .sched__time { color: var(--brand-soft-ink); }

.weekfaces { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 4px; padding: 12px 8px; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); }
.weekfaces li { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.weekfaces__day { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.weekfaces li.is-today .weekfaces__day { color: var(--ink); font-weight: 800; }
.weekfaces__empty { width: 34px; height: 34px; border-radius: 50%; border: 2px dashed var(--line-strong); }

.simple-cta { display: flex; align-items: center; gap: 14px; width: 100%; padding: 14px 14px 14px 16px; border-radius: 22px; border: 1px solid var(--line); background: var(--surface); color: var(--ink); text-align: left; }
.simple-cta:hover { border-color: var(--line-strong); }
.simple-cta__icon { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 14px; background: var(--brand-soft); color: var(--brand-soft-ink); }
.simple-cta__body { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.simple-cta__title { font-weight: 700; font-size: 15px; }
.simple-cta__text { font-size: 13.5px; color: var(--ink-2); line-height: 1.35; }

/* Verloop */
.segmented { display: inline-flex; align-self: flex-start; gap: 2px; padding: 4px; border-radius: 14px; background: var(--surface-3); margin-top: -8px; }
.segmented button { min-height: 38px; padding: 0 16px; border: 0; border-radius: 11px; background: transparent; color: var(--ink-2); font-size: 14px; font-weight: 600; }
.segmented button[aria-pressed="true"] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-1); }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; margin-bottom: 14px; }
.stats div { display: flex; flex-direction: column; gap: 2px; padding: 10px 12px; border-radius: 14px; background: var(--surface-2); }
.stats dt { font-size: 12px; font-weight: 600; color: var(--ink-2); }
.stats dd { font-size: 15px; font-weight: 700; line-height: 1.2; }
.insight { display: flex; gap: 14px; padding: 16px; border-radius: 22px; background: var(--brand-soft); color: var(--brand-soft-ink); }
.insight__icon { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 12px; background: var(--surface); color: var(--brand); }
.insight__title { font-weight: 700; font-size: 16px; color: var(--ink); }
.insight__text { margin-top: 2px; font-size: 14.5px; color: var(--ink); }
.insight__fine { margin-top: 8px; font-size: 12.5px; }
.patterns { display: grid; gap: 10px; }
@container app (min-width: 600px) { .patterns { grid-template-columns: 1fr 1fr; } }
.pattern { padding: 14px; border-radius: 20px; background: var(--surface); border: 1px solid var(--line); }
.pattern__head { display: flex; align-items: center; gap: 10px; font-weight: 700; margin-bottom: 10px; }
.pattern__bars { display: grid; gap: 8px; }
.pattern__bars li { display: grid; grid-template-columns: minmax(0, 110px) minmax(0, 1fr) 30px; align-items: center; gap: 10px; font-size: 14px; }
.pattern__label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pattern__track { height: 8px; border-radius: 999px; background: var(--surface-3); overflow: hidden; }
.pattern__track i { display: block; height: 100%; border-radius: inherit; background: var(--tone); }
.pattern__n { font-size: 13px; color: var(--ink-2); font-variant-numeric: tabular-nums; text-align: right; }
.daylist { display: flex; flex-direction: column; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); overflow: hidden; }
.daylist__row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-top: 1px solid var(--line); }
.daylist__row:first-child { border-top: 0; }
.daylist__text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.daylist__text span { font-size: 13px; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* Rust */
.breath { display: flex; flex-direction: column; align-items: stretch; gap: 14px; padding: 18px; border-radius: 28px; border: 1px solid var(--line); background: linear-gradient(180deg, var(--brand-soft), var(--surface) 75%); }
.breath__head { display: flex; flex-direction: column; gap: 2px; }
.breath__stage { position: relative; align-self: center; width: 220px; height: 220px; display: grid; place-items: center; }
.breath__ring { position: absolute; inset: 0; border-radius: 50%; border: 1.5px dashed color-mix(in srgb, var(--brand) 40%, transparent); }
.breath__orb { position: absolute; inset: 0; border-radius: 50%; background: radial-gradient(circle at 50% 38%, color-mix(in srgb, var(--brand) 30%, var(--surface)), color-mix(in srgb, var(--brand) 16%, transparent) 72%); transform: scale(.6); transition: transform 1.2s var(--ease); }
.breath.is-in .breath__orb { transform: scale(1); transition: transform 4s ease-in-out; }
.breath.is-out .breath__orb { transform: scale(.6); transition: transform 6s ease-in-out; }
.breath.is-done .breath__orb { transform: scale(.8); }
.breath__text { position: relative; display: flex; flex-direction: column; align-items: center; }
.breath__phase { font-family: var(--font-display); font-size: 30px; line-height: 1.1; }
.breath__count { font-size: 15px; font-weight: 700; color: var(--ink-2); font-variant-numeric: tabular-nums; }
.breath__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.helps { display: flex; flex-direction: column; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); overflow: hidden; }
.helps li { display: flex; align-items: center; gap: 12px; min-height: 58px; padding: 10px 14px; border-top: 1px solid var(--line); font-weight: 500; }
.helps li:first-child { border-top: 0; }
.helps__icon { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 11px; background: var(--brand-soft); color: var(--brand-soft-ink); }
.helpcard { display: flex; flex-direction: column; align-items: flex-start; gap: 8px; padding: 18px; border-radius: 28px; background: var(--surface); border: 1px solid var(--line); box-shadow: var(--shadow-1); }
.helpcard.is-active { border-color: var(--brand); background: color-mix(in srgb, var(--brand-soft) 55%, var(--surface)); }
.helpcard__icon { width: 44px; height: 44px; display: grid; place-items: center; border-radius: 14px; background: var(--brand-soft); color: var(--brand-soft-ink); }
.helpcard__title { font-size: 19px; font-weight: 700; line-height: 1.25; }
.helpcard p { color: var(--ink-2); font-size: 14.5px; }
.helpcard .btn { margin-top: 6px; }
.helpcard__fine { display: flex; align-items: flex-start; gap: 8px; margin-top: 6px; padding-top: 12px; border-top: 1px dashed var(--line-strong); width: 100%; font-size: 13px !important; }
.helpcard__fine .ic { margin-top: 2px; color: var(--warn); }

/* Paneel van onder (sheet) */
.sheet-layer { position: absolute; inset: 0; z-index: 80; display: flex; flex-direction: column; justify-content: flex-end; }
.sheet-backdrop { position: absolute; inset: 0; background: rgba(12, 18, 16, .45); animation: fade .25s ease; }
.sheet { position: relative; width: 100%; max-height: 90%; overflow-y: auto; overscroll-behavior: contain; padding: 6px 16px calc(var(--sab) + 16px); border-radius: 28px 28px 0 0; background: var(--surface); box-shadow: 0 -24px 60px -24px rgba(0, 0, 0, .35); animation: sheet-up .34s var(--ease); }
.sheet:focus { outline: none; }
.sheet__grab { display: block; width: 40px; height: 5px; margin: 4px auto 12px; border-radius: 3px; background: var(--line-strong); }
@container app (min-width: 600px) { .sheet { max-width: 520px; margin: 0 auto 24px; border-radius: 28px; } }
@keyframes sheet-up { from { transform: translateY(100%); } }
@keyframes fade { from { opacity: 0; } }

.osheet__head { display: flex; align-items: center; gap: 12px; }
.osheet__titles { flex: 1; min-width: 0; }
.osheet__name { font-weight: 700; font-size: 18px; line-height: 1.2; }
.osheet__q { color: var(--ink-2); font-size: 14.5px; }
.olist { display: flex; flex-direction: column; gap: 6px; margin-top: 16px; }
.oitem { width: 100%; display: flex; align-items: center; gap: 14px; min-height: 54px; padding: 0 16px; border-radius: 16px; border: 1.5px solid var(--line); background: var(--surface-2); color: var(--ink); font-size: 16.5px; font-weight: 500; text-align: left; transition: background .15s, border-color .15s; }
.oitem:hover { border-color: var(--tone); }
.oitem__radio { width: 22px; height: 22px; flex: none; border-radius: 50%; border: 2px solid var(--line-strong); background: var(--surface); transition: background .15s, border-color .15s, box-shadow .15s; }
.oitem[aria-pressed="true"] { border-color: var(--tone); background: var(--tone-soft); font-weight: 700; }
.oitem[aria-pressed="true"] .oitem__radio { border-color: var(--tone); background: var(--tone); box-shadow: inset 0 0 0 4px var(--surface); }
.oitem--ghost { border-style: dashed; color: var(--ink-2); }
.oitem--ghost .ic { margin-left: auto; color: var(--ink-3); }
.osheet__clear { margin-top: 10px; }

.menu__who { display: flex; align-items: center; gap: 12px; padding-bottom: 14px; }
.menu__who > div { flex: 1; min-width: 0; }
.menu__name { font-weight: 700; font-size: 18px; }
.menu__sub { color: var(--ink-2); font-size: 14px; }
.menu__list { display: flex; flex-direction: column; border-radius: 20px; border: 1px solid var(--line); overflow: hidden; }
.menu__list li + li { border-top: 1px solid var(--line); }
.menu__item { width: 100%; display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 10px 14px; border: 0; background: var(--surface); color: var(--ink); text-align: left; font-weight: 600; }
.menu__item:hover { background: var(--surface-2); }
.menu__item.is-confirm { background: var(--warn-soft); color: var(--warn-ink); }
.menu__icon { width: 36px; height: 36px; flex: none; display: grid; place-items: center; border-radius: 11px; background: var(--surface-3); color: var(--ink-2); }
.menu__text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.menu__text small { font-size: 13px; font-weight: 500; color: var(--ink-2); }
.menu__fine { margin-top: 14px; font-size: 12.5px; color: var(--ink-3); text-align: center; }

/* ── Check-in flow ─────────────────────────────────────── */
.flow { position: absolute; inset: 0; z-index: 50; display: flex; flex-direction: column; background: var(--bg); animation: flow-in .34s var(--ease); }
@keyframes flow-in { from { transform: translateY(28px); opacity: 0; } }
.flow__main { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.flow__head { flex: none; display: grid; grid-template-columns: 44px minmax(0, 1fr) 44px; align-items: center; gap: 10px; padding: calc(var(--sat) + 6px) 10px 6px; }
.flow__progress { display: flex; gap: 6px; }
.flow__progress li { flex: 1; height: 5px; border-radius: 999px; background: var(--surface-3); transition: background .3s var(--ease); }
.flow__progress li.is-done { background: var(--brand); }
.flow__progress li.is-now { background: color-mix(in srgb, var(--brand) 45%, var(--surface-3)); }
.flow__body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.flow__step { max-width: 600px; margin: 0 auto; padding: 14px 20px 28px; }
.flow__step.from-right { animation: step-r .36s var(--ease); }
.flow__step.from-left { animation: step-l .36s var(--ease); }
@keyframes step-r { from { opacity: 0; transform: translateX(32px); } }
@keyframes step-l { from { opacity: 0; transform: translateX(-32px); } }
.flow__kicker { font-size: 13px; font-weight: 700; color: var(--ink-2); }
.flow__title { font-family: var(--font-display); font-weight: 400; font-size: clamp(36px, 10cqi, 48px); line-height: 1.02; letter-spacing: -.012em; margin-top: 6px; text-wrap: balance; }
.flow__title:focus { outline: none; }
.flow__sub { margin-top: 8px; color: var(--ink-2); font-size: 16px; }
.flow__h3 { margin: 26px 0 12px; font-size: 16px; font-weight: 700; }
.flow__h3 span { font-weight: 500; color: var(--ink-2); font-size: 14px; }
.flow__foot { flex: none; padding: 12px 16px calc(var(--sab) + 12px); border-top: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 96%, transparent); }
.flow__actions { display: flex; gap: 10px; max-width: 600px; margin: 0 auto; }
.flow__next { flex: 1; }
.flow__nudge { display: flex; align-items: center; gap: 8px; max-width: 600px; margin: 0 auto 10px; padding: 10px 14px; border-radius: 14px; background: var(--warn-soft); color: var(--warn-ink); font-size: 14.5px; font-weight: 600; }

.moodstep { margin-top: 16px; }
.moodstep__hero { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 8px 0 24px; }
.moodstep__face { --face-fill: var(--tone); --face-line: var(--face-ink); transition: transform .35s var(--ease); }
.moodstep__face.is-idle { --face-fill: var(--surface); --face-line: var(--line-strong); }
.moodstep__label { font-family: var(--font-display); font-size: 32px; line-height: 1; }
.moodstep__row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.moodopt { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 10px 2px 9px; border-radius: 18px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink-2); font-size: 11.5px; font-weight: 600; line-height: 1.15; text-align: center; cursor: pointer; transition: background .2s, border-color .2s, transform .2s var(--ease); }
.moodopt:hover { border-color: var(--line-strong); }
.moodopt:active { transform: scale(.96); }
.moodopt:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.moodopt.is-on { border-color: color-mix(in srgb, var(--tone) 65%, var(--ink) 35%); background: color-mix(in srgb, var(--tone) 28%, var(--surface)); color: var(--ink); }
.moodopt.is-on .face { --face-fill: var(--tone); --face-line: var(--face-ink); }
@container app (min-width: 600px) { .moodopt { font-size: 13px; padding: 14px 4px 12px; } }

.emfi-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 22px; }
.emfi-card { display: flex; flex-direction: column; align-items: flex-start; gap: 2px; min-height: 160px; padding: 14px; border-radius: 22px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); text-align: left; transition: background .2s, border-color .2s, transform .2s var(--ease); }
.emfi-card:hover { border-color: var(--tone); }
.emfi-card:active { transform: scale(.98); }
.emfi-card__badge { width: 44px; height: 44px; display: grid; place-items: center; margin-bottom: 10px; border-radius: 14px; background: var(--tone-soft); color: var(--tone-ink); transition: background .2s, color .2s; }
.emfi-card__name { font-size: 17px; font-weight: 700; line-height: 1.2; }
.emfi-card__hint { font-size: 13px; color: var(--ink-2); line-height: 1.3; }
.emfi-card__value { display: inline-flex; align-items: center; gap: 5px; margin-top: auto; padding-top: 12px; font-size: 14.5px; font-weight: 700; color: var(--ink-2); }
.emfi-card.is-set { border-color: color-mix(in srgb, var(--tone) 55%, transparent); background: color-mix(in srgb, var(--tone-soft) 75%, var(--surface)); }
.emfi-card.is-set .emfi-card__badge { background: var(--tone); color: var(--tone-on); }
.emfi-card.is-set .emfi-card__value { color: var(--tone-ink); }
.emfi-count { display: flex; align-items: center; gap: 8px; margin-top: 14px; font-size: 14.5px; font-weight: 600; color: var(--ink-2); }
.emfi-count .ic { color: var(--warn); }
.emfi-count.is-ok { color: var(--brand-soft-ink); }
.emfi-count.is-ok .ic { color: var(--brand); }

.scale { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
.scale__opt { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 12px 2px 10px; border-radius: 16px; border: 1.5px solid var(--line); background: var(--surface); text-align: center; cursor: pointer; transition: background .2s var(--ease), border-color .2s; }
.scale__opt:hover { border-color: var(--line-strong); }
.scale__opt:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.scale__opt.is-on { background: color-mix(in srgb, var(--tone, var(--brand)) 22%, var(--surface)); border-color: color-mix(in srgb, var(--tone, var(--brand)) 70%, var(--ink) 30%); }
.scale--sleep .scale__opt.is-on { --tone: var(--moon-lit); }
.scale__label { font-size: 11.5px; font-weight: 600; color: var(--ink-2); line-height: 1.2; }
.scale__opt.is-on .scale__label { color: var(--ink); }
.scale__opt .moon { transition: transform .3s var(--ease); }
.scale__opt.is-on .moon { transform: scale(1.1); }

.acts { display: flex; flex-wrap: wrap; gap: 8px; }
.act { display: inline-flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 16px 0 6px; border-radius: 999px; border: 1.5px solid var(--line); background: var(--surface); font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s, border-color .15s; }
.act:hover { border-color: var(--line-strong); }
.act:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.act__icon { width: 36px; height: 36px; display: grid; place-items: center; border-radius: 50%; background: var(--surface-3); color: var(--ink-2); transition: background .15s, color .15s; }
.act.is-on { background: var(--brand-soft); border-color: var(--brand); }
.act.is-on .act__icon { background: var(--brand); color: var(--brand-ink); }

.notestep { margin-top: 22px; }
.talk { width: 100%; display: flex; align-items: center; gap: 14px; padding: 14px; text-align: left; border-radius: 20px; border: 1.5px solid var(--line); background: var(--surface); color: var(--ink); transition: background .2s, border-color .2s; }
.talk:hover { border-color: var(--line-strong); }
.talk[aria-checked="true"] { background: var(--brand-soft); border-color: var(--brand); }
.talk__icon { width: 46px; height: 46px; flex: none; display: grid; place-items: center; border-radius: 14px; background: var(--surface-3); color: var(--brand-soft-ink); }
.talk[aria-checked="true"] .talk__icon { background: var(--brand); color: var(--brand-ink); }
.talk__text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; line-height: 1.3; }
.talk__text strong { font-size: 16px; }
.talk__text span { font-size: 14px; color: var(--ink-2); }
.field { margin-top: 20px; }
.field__label { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; font-size: 15px; font-weight: 700; }
.field__label span { font-size: 13px; font-weight: 500; color: var(--ink-3); }
.textarea { display: block; width: 100%; min-height: 124px; padding: 14px 16px; resize: vertical; border-radius: 18px; border: 1.5px solid var(--line-strong); background: var(--surface); font-size: 16px; line-height: 1.55; transition: border-color .15s, box-shadow .15s; }
.textarea--sm { min-height: 84px; border-radius: 14px; font-size: 15px; padding: 12px 14px; }
.textarea::placeholder { color: var(--ink-3); }
.textarea:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 20%, transparent); }
.field__foot { margin-top: 12px; }
.privacy { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; padding: 4px; border-radius: 16px; background: var(--surface-3); }
.privacy label { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 6px 10px; border-radius: 12px; font-size: 14px; font-weight: 600; color: var(--ink-2); cursor: pointer; text-align: center; line-height: 1.2; transition: background .15s, color .15s; }
.privacy label.is-on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-1); }
.privacy label:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 1px; }
.privacy-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 10px; font-size: 13.5px; color: var(--ink-2); }
.privacy-note .ic { margin-top: 2px; }
.privacy-note span:first-of-type { flex: 1; }
.count { font-size: 13px; color: var(--ink-3); font-variant-numeric: tabular-nums; white-space: nowrap; }

.review { margin-top: 20px; border-radius: 22px; background: var(--surface); border: 1px solid var(--line); overflow: hidden; }
.review__row { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 8px 8px 14px; border-top: 1px solid var(--line); }
.review__row:first-child { border-top: 0; }
.review__icon { width: 30px; flex: none; display: grid; place-items: center; color: var(--ink-2); }
.review__text { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.3; }
.review__k { font-size: 12.5px; font-weight: 600; color: var(--ink-2); }
.review__v { font-weight: 700; overflow-wrap: anywhere; }
.review__v.is-empty { color: var(--ink-3); font-weight: 500; }
.review__edit { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border: 0; border-radius: 12px; background: transparent; color: var(--ink-2); }
.review__edit:hover { background: var(--surface-3); color: var(--ink); }
.foot-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 14px; font-size: 13px; color: var(--ink-2); line-height: 1.45; }
.foot-note .ic { margin-top: 1px; }

.flowdone { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.flowdone__body { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: calc(var(--sat) + 24px) 24px 24px; text-align: center; }
.burst { display: block; width: 112px; height: 112px; margin-bottom: 18px; }
.burst__halo { fill: var(--brand-soft); transform-box: fill-box; transform-origin: center; animation: pop .5s var(--ease) both; }
.burst__disc { fill: var(--brand); transform-box: fill-box; transform-origin: center; animation: pop .45s var(--ease) .08s both; }
.burst__check { fill: none; stroke: var(--brand-ink); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 48; stroke-dashoffset: 48; animation: draw .45s var(--ease) .38s forwards; }
@keyframes pop { from { transform: scale(.55); opacity: 0; } }
@keyframes draw { to { stroke-dashoffset: 0; } }
.flowdone__title { font-family: var(--font-display); font-weight: 400; font-size: clamp(42px, 12cqi, 58px); line-height: 1; letter-spacing: -.015em; }
.flowdone__title:focus { outline: none; }
.flowdone__title em { font-style: italic; color: var(--brand); }
.flowdone__lede { max-width: 32ch; margin-top: 12px; font-size: 17px; color: var(--ink-2); }
.care { display: flex; align-items: flex-start; gap: 12px; max-width: 420px; margin: 24px 0 18px; padding: 14px 16px; border-radius: 18px; background: var(--brand-soft); color: var(--brand-soft-ink); text-align: left; font-size: 15px; }
.care .ic { margin-top: 2px; }
.care--alert { background: var(--warn-soft); color: var(--warn-ink); }

/* ── Eenvoudige modus ──────────────────────────────────── */
.app[data-mode="simple"] {
  --font-ui: var(--font-simple);
  --font-display: var(--font-simple);
  --bg: #FBFAF6; --surface: #FFFFFF; --surface-2: #F3F1EA; --surface-3: #E7E5DD;
  --line: #C9C7BE; --tile-line: #85857D;
  --ink: #111412; --ink-2: #2F3532; --ink-3: #4F5652;
  --brand: #1F5446; --brand-hover: #17443A; --brand-ink: #FFFFFF; --brand-soft: #DCEDE4; --brand-soft-ink: #163F34;
  font-size: 20px; line-height: 1.5;
}
@media (prefers-color-scheme: dark) {
  .app[data-mode="simple"] {
    --bg: #0E1110; --surface: #171B19; --surface-2: #1D2220; --surface-3: #262C29;
    --line: #3F4743; --tile-line: #7E8682;
    --ink: #F5F7F5; --ink-2: #D2D8D4; --ink-3: #B2BAB5;
    --brand: #86CFB3; --brand-hover: #9CDBC2; --brand-ink: #0B1D16; --brand-soft: #1C3A31; --brand-soft-ink: #CDEFE1;
  }
}
.app[data-mode="simple"] *, .app[data-mode="simple"] *::before, .app[data-mode="simple"] *::after { animation: none !important; transition: none !important; }
.app[data-mode="simple"] .app__head { border-bottom: 2px solid var(--line); background: var(--surface); padding-bottom: 10px; }
.app[data-mode="simple"] .app__brand span { display: none; }
.app[data-mode="simple"] .mswitch--app { min-height: 52px; padding: 0 10px 0 16px; border: 2.5px solid var(--ink); font-size: 18px; font-weight: 700; gap: 10px; }
.app[data-mode="simple"] .mswitch--app .track { --tw: 48px; --th: 28px; --tk: 20px; }
.app[data-mode="simple"] :focus-visible { outline-width: 4px; outline-offset: 3px; }

.s-screen { position: absolute; inset: 0; display: flex; flex-direction: column; }
.s-body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; }
.s-inner { max-width: 840px; margin: 0 auto; padding: 20px 16px 28px; }
.s-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px 20px; margin-bottom: 18px; }
.s-progress { display: flex; flex-direction: column; gap: 8px; }
.s-count { font-size: 18px; font-weight: 700; }
.s-dots { display: flex; align-items: center; gap: 7px; }
.s-dot { width: 15px; height: 15px; border-radius: 50%; border: 2.5px solid var(--ink); }
.s-dot.is-done { background: var(--ink); }
.s-dot.is-now { width: 30px; border-radius: 8px; border-color: var(--brand); background: var(--brand); }
.s-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 14px; }
.s-title { font-size: clamp(30px, 9cqi, 44px); font-weight: 700; line-height: 1.15; }
.s-title:focus { outline: none; }
.s-sub { margin-top: 8px; font-size: 21px; color: var(--ink-2); }
.s-speak { flex: none; display: inline-flex; align-items: center; gap: 10px; min-height: 58px; padding: 0 18px; border-radius: 16px; border: 2.5px solid var(--ink); background: var(--surface); color: var(--ink); font-size: 19px; font-weight: 700; }
.s-speak[aria-pressed="true"] { background: var(--ink); color: var(--surface); }
.s-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; margin-top: 24px; }
.s-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.s-tile { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; min-height: 136px; padding: 16px 8px; border-radius: 22px; border: 3px solid var(--tile-line); background: var(--surface); color: var(--ink); text-align: center; font-size: 20px; font-weight: 700; line-height: 1.2; cursor: pointer; }
.s-grid--3 .s-tile { min-height: 156px; font-size: 18px; padding: 16px 4px; }
.s-tile:hover { border-color: var(--ink); }
.s-tile:has(input:focus-visible) { outline: 4px solid var(--focus); outline-offset: 3px; }
.s-tile.is-on { border-color: var(--brand); background: var(--brand-soft); box-shadow: inset 0 0 0 3px var(--brand); }
.s-tile--wide { grid-column: 1 / -1; flex-direction: row; min-height: 84px; border-style: dashed; }
.s-tile--wide.is-on { border-style: solid; }
.s-tile__check { position: absolute; top: 8px; right: 8px; width: 38px; height: 38px; display: none; place-items: center; border-radius: 50%; background: var(--brand); color: var(--brand-ink); }
.s-tile.is-on .s-tile__check { display: grid; }
.s-tile--wide .s-tile__check { top: 50%; right: 14px; transform: translateY(-50%); }
.s-picto { font-family: var(--font-emoji); font-size: 50px; line-height: 1; }
.s-picto--sm { font-size: 36px; }
.s-tile--wide .s-picto { font-size: 38px; }
@container app (min-width: 700px) {
  .s-inner { padding: 32px 28px 40px; }
  .s-grid { gap: 14px; }
  .s-grid--emfi { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .s-tile { min-height: 160px; font-size: 22px; }
  .s-grid--3 .s-tile { min-height: 210px; font-size: 22px; }
  .s-picto { font-size: 58px; }
}
.s-nudge { display: flex; align-items: center; gap: 12px; margin-top: 18px; padding: 14px 18px; border-radius: 18px; border: 2.5px solid var(--warn-ink); background: var(--warn-soft); color: var(--warn-ink); font-weight: 700; }
.s-nav { flex: none; padding: 12px 16px calc(var(--sab) + 12px); background: var(--surface); border-top: 2px solid var(--line); }
.s-nav__inner { max-width: 840px; margin: 0 auto; display: flex; justify-content: space-between; gap: 12px; }
.s-nav__inner:has(> .s-btn:only-child) { justify-content: center; }
.s-btn { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 68px; padding: 0 20px; border-radius: 18px; border: 3px solid var(--ink); background: var(--surface); color: var(--ink); font-size: 21px; font-weight: 700; text-align: left; }
.s-btn--go { flex: 1; max-width: 440px; border-color: var(--brand); background: var(--brand); color: var(--brand-ink); }
.s-btn--go[aria-disabled="true"] { border-color: var(--tile-line); background: var(--surface-2); color: var(--ink-2); }
.s-btn--wide { width: 100%; justify-content: flex-start; gap: 14px; }
.s-list { display: grid; gap: 8px; margin-top: 24px; }
.s-list__item { display: flex; align-items: center; gap: 14px; min-height: 64px; padding: 10px 16px; border-radius: 18px; border: 2px solid var(--line); background: var(--surface); font-size: 21px; font-weight: 700; }
.s-list__num { width: 40px; height: 40px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--ink); color: var(--surface); font-size: 18px; }
.s-list__picto { font-family: var(--font-emoji); font-size: 30px; line-height: 1; }
.s-call { margin-top: 24px; }
.s-msg { display: flex; align-items: center; gap: 14px; padding: 16px 18px; border-radius: 18px; border: 2px solid var(--line); background: var(--surface); font-size: 21px; font-weight: 700; text-align: left; }
.s-msg--ok { margin-top: 20px; border-color: var(--brand); background: var(--brand-soft); }
.s-msg--ok .ic { color: var(--brand); }
.s-review { display: grid; gap: 8px; margin-top: 22px; }
.s-review__row { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 14px; padding: 12px 14px; border-radius: 18px; border: 2px solid var(--line); background: var(--surface); }
.s-review__visual { width: 52px; flex: none; display: grid; place-items: center; }
.s-review__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.s-review__q { font-size: 16px; color: var(--ink-2); }
.s-review__a { font-size: 22px; font-weight: 700; line-height: 1.2; }
.s-edit { flex: none; margin-left: auto; display: inline-flex; align-items: center; gap: 8px; min-height: 52px; padding: 0 14px; border-radius: 14px; border: 2.5px solid var(--ink); background: var(--surface); color: var(--ink); font-size: 18px; font-weight: 700; }
.s-done { display: flex; flex-direction: column; align-items: center; text-align: center; padding-top: 36px; }
.s-done__mark { width: 124px; height: 124px; display: grid; place-items: center; margin-bottom: 24px; border-radius: 50%; background: var(--brand); color: var(--brand-ink); }
.s-msgs { display: grid; gap: 10px; width: 100%; max-width: 620px; margin-top: 24px; }
.s-done__speak { margin: 22px 0 14px; }
.app[data-mode="simple"] .syncline { font-size: 15px; }

/* ════ Begeleiding: werkplek ═════════════════════════════ */
.staff { display: grid; grid-template-columns: 256px minmax(0, 1fr); min-height: 100vh; min-height: 100dvh; }
.sb { position: sticky; top: 0; height: 100vh; height: 100dvh; display: flex; flex-direction: column; gap: 6px; padding: 18px 14px 16px; border-right: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 60%, transparent); }
.sb__brand { display: flex; align-items: center; gap: 12px; padding: 4px 8px 22px; }
.sb__nav { display: flex; flex-direction: column; gap: 2px; }
.sb__link { display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 12px; border: 0; border-radius: 12px; background: transparent; color: var(--ink-2); font-size: 15px; font-weight: 600; text-align: left; }
.sb__link:hover { background: var(--surface-3); color: var(--ink); }
.sb__link[aria-current="page"] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-1); }
.sb__badge { margin-left: auto; min-width: 24px; height: 24px; padding: 0 7px; display: grid; place-items: center; border-radius: 999px; background: var(--warn-soft); color: var(--warn-ink); font-size: 12.5px; font-weight: 700; }
.sb__spacer { flex: 1; }
.sb__demo { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 8px 12px; border-radius: 14px; border: 1px dashed var(--line-strong); background: transparent; color: var(--ink); text-align: left; font-weight: 600; font-size: 14.5px; }
.sb__demo:hover { background: var(--surface); border-style: solid; }
.sb__demo span { display: flex; flex-direction: column; line-height: 1.25; }
.sb__demo small, .sb__sync small, .sb__user small { font-size: 12.5px; font-weight: 500; color: var(--ink-2); }
.sb__sync { display: flex; align-items: center; gap: 10px; padding: 12px; font-size: 13px; color: var(--ink-2); line-height: 1.3; }
.sb__sync > span:last-child { display: flex; flex-direction: column; }
.sb__sync b { color: var(--ink); }
.sb__user { display: flex; align-items: center; gap: 10px; padding: 12px 8px 0; border-top: 1px solid var(--line); }
.sb__user > span { display: flex; flex-direction: column; line-height: 1.25; font-size: 14px; }

.sm { min-width: 0; display: flex; flex-direction: column; }
.sm__top { position: sticky; top: 0; z-index: 20; display: flex; flex-wrap: wrap; align-items: center; gap: 14px 20px; padding: 16px 32px; background: color-mix(in srgb, var(--bg) 84%, transparent); -webkit-backdrop-filter: saturate(1.4) blur(16px); backdrop-filter: saturate(1.4) blur(16px); border-bottom: 1px solid color-mix(in srgb, var(--line) 75%, transparent); }
.sm__titles { margin-right: auto; }
.sm__title { font-family: var(--font-display); font-weight: 400; font-size: 34px; line-height: 1; letter-spacing: -.01em; }
.sm__sub { margin-top: 4px; font-size: 14px; color: var(--ink-2); }
.sm__content { width: 100%; max-width: 1560px; padding: 24px 32px 56px; }
.search { position: relative; display: flex; align-items: center; color: var(--ink-3); }
.search .ic { position: absolute; left: 14px; pointer-events: none; }
.search input { width: 300px; max-width: 100%; height: 44px; padding: 0 40px 0 40px; border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface); font-size: 15px; color: var(--ink); }
.search input::placeholder { color: var(--ink-3); }
.search input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 20%, transparent); }
.search kbd { position: absolute; right: 12px; min-width: 22px; height: 22px; display: grid; place-items: center; border-radius: 6px; border: 1px solid var(--line-strong); background: var(--surface-2); font: 600 12px var(--font-ui); color: var(--ink-2); }

.kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.5fr); gap: 14px; margin-bottom: 22px; }
.kpi { display: flex; flex-direction: column; gap: 6px; min-height: 140px; padding: 16px 18px; border-radius: 22px; border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow-1); }
.kpi__label { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink-2); }
.kpi__value { font-size: 38px; font-weight: 600; line-height: 1.1; letter-spacing: -.02em; }
.kpi__value small { font-size: 18px; font-weight: 500; color: var(--ink-3); letter-spacing: 0; }
.kpi__sub { margin-top: auto; font-size: 13px; color: var(--ink-2); line-height: 1.4; }
.kpi__urgent { color: var(--crit-ink); }
.kpi__row { display: flex; align-items: baseline; flex-wrap: wrap; gap: 6px 14px; }
.delta { font-size: 13px; font-weight: 700; }
.delta.is-up { color: var(--brand); }
.delta.is-down { color: var(--crit-ink); }
.delta.is-flat { color: var(--ink-2); }
.meter { height: 6px; margin-top: 4px; border-radius: 999px; background: var(--brand-soft); overflow: hidden; }
.meter i { display: block; height: 100%; border-radius: inherit; background: var(--brand); transition: width .5s var(--ease); }
.dist { margin-top: auto; }
.dist__bar { display: flex; gap: 2px; height: 10px; border-radius: 999px; overflow: hidden; background: var(--surface); }
.dist__bar i { display: block; min-width: 6px; }
.dist__bar i:first-child { border-radius: 999px 0 0 999px; }
.dist__bar i:last-child { border-radius: 0 999px 999px 0; }
.dist__bar i:only-child { border-radius: 999px; }
.dist__empty { flex: 1; background: var(--surface-3); }
.dist__legend { display: flex; flex-wrap: wrap; gap: 6px 14px; margin-top: 10px; font-size: 12.5px; color: var(--ink-2); }
.dist__legend li { display: inline-flex; align-items: center; gap: 6px; }
.dist__legend b { color: var(--ink); font-weight: 700; font-variant-numeric: tabular-nums; }
.dist__legend li.is-zero { opacity: .6; }

.toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; }
.fchip { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 15px; border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 14px; font-weight: 600; transition: background .15s, color .15s, border-color .15s; }
.fchip:hover { border-color: var(--ink-3); }
.fchip__n { min-width: 26px; height: 26px; padding: 0 7px; display: grid; place-items: center; border-radius: 999px; background: var(--surface-3); font-size: 12.5px; font-variant-numeric: tabular-nums; }
.fchip[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.fchip[aria-pressed="true"] .fchip__n { background: color-mix(in srgb, var(--bg) 18%, transparent); }
.mlegend { display: inline-flex; align-items: center; gap: 8px; font-size: 12.5px; color: var(--ink-2); }
.mlegend__sw { display: inline-flex; gap: 2px; }
.mlegend__sw i { width: 14px; height: 14px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .06); }

.split { display: grid; grid-template-columns: minmax(0, 1fr) clamp(380px, 30vw, 480px); gap: 20px; align-items: start; }
.plist { display: flex; flex-direction: column; gap: 8px; min-width: 0; }
.prow {
  position: relative; display: grid; grid-template-columns: 42px minmax(0, 1.2fr) minmax(0, 1fr) auto auto;
  column-gap: 16px; row-gap: 10px; align-items: center; padding: 14px 16px;
  border-radius: 20px; border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow-1);
  transition: border-color .15s, box-shadow .15s, background .15s;
}
.prow:hover { border-color: var(--line-strong); box-shadow: var(--shadow-2); }
.prow.is-selected { border-color: var(--brand); background: color-mix(in srgb, var(--brand-soft) 40%, var(--surface)); box-shadow: 0 0 0 1px var(--brand), var(--shadow-1); }
.prow:has(.prow__btn:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.prow__btn { position: absolute; inset: 0; z-index: 0; border: 0; border-radius: inherit; background: transparent; }
.prow__btn:focus-visible { outline: none; }
.prow > :not(.prow__btn) { position: relative; pointer-events: none; }
.prow .prow__action, .prow [title] { pointer-events: auto; }
.prow--critical::before, .prow--attention::before { content: ""; position: absolute; z-index: 1; left: -1px; top: 16px; bottom: 16px; width: 4px; border-radius: 0 4px 4px 0; background: var(--crit); }
.prow--attention::before { background: var(--warn); }
.prow--none { background: color-mix(in srgb, var(--surface) 65%, transparent); box-shadow: none; border-style: dashed; }
.prow__who { min-width: 0; }
.prow__name { font-size: 16.5px; font-weight: 700; line-height: 1.25; }
.prow__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; font-size: 13px; color: var(--ink-2); }
.prow__mood { display: flex; align-items: center; gap: 10px; min-width: 0; }
.prow__mood b { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.prow__none { font-size: 14px; color: var(--ink-2); }
.prow__status { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.prow__line { grid-column: 2 / -1; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 12px; }
.wk { display: inline-flex; gap: 3px; }
.wk__c { width: 11px; height: 22px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(0, 0, 0, .06); }
.wk__c.is-empty { background: transparent; box-shadow: inset 0 0 0 1.5px var(--line-strong); }
.wk__c.is-today { outline: 2px solid var(--ink); outline-offset: 1px; }

.pill { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px 0 9px; border-radius: 999px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.pill--critical { background: var(--crit-soft); color: var(--crit-ink); }
.pill--attention { background: var(--warn-soft); color: var(--warn-ink); }
.pill--stable { background: var(--brand-soft); color: var(--brand-soft-ink); }
.pill--none { background: var(--surface-3); color: var(--ink-2); }
.etags { display: flex; flex-wrap: wrap; gap: 6px; }
.etag { display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 10px 0 8px; border-radius: 9px; background: var(--tone-soft); color: var(--ink); font-size: 13px; font-weight: 600; }
.etag .ic { color: var(--tone-ink); }
.signals { display: flex; flex-wrap: wrap; gap: 6px; }
.sig { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px 0 8px; border-radius: 8px; font-size: 12.5px; font-weight: 600; white-space: nowrap; }
.sig--critical { background: var(--crit-soft); color: var(--crit-ink); }
.sig--attention { background: var(--warn-soft); color: var(--warn-ink); }
.sig--talk { background: var(--brand-soft); color: var(--brand-soft-ink); }
.sig--more { background: var(--surface-3); color: var(--ink-2); padding: 0 9px; }
.followed { display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; color: var(--brand-soft-ink); white-space: nowrap; }
.quote { padding-left: 14px; border-left: 2px solid var(--line-strong); font-family: var(--font-display); font-style: italic; font-size: 18.5px; line-height: 1.35; color: var(--ink); }
.quote--lg { font-size: 22px; }
.empty { display: grid; justify-items: center; gap: 4px; padding: 48px 24px; text-align: center; color: var(--ink-2); border-radius: 22px; border: 1px dashed var(--line-strong); }
.empty .ic { color: var(--ink-3); margin-bottom: 6px; }
.empty strong { color: var(--ink); }

.panel { position: sticky; top: 96px; height: calc(100dvh - 120px); min-height: 520px; display: flex; overflow: hidden; border-radius: 24px; border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow-2); }
.panel__empty { flex: 1; display: grid; place-content: center; justify-items: center; gap: 10px; color: var(--ink-2); text-align: center; padding: 24px; }

.drawer {
  position: fixed; inset: 0 0 0 auto; width: min(540px, 100vw); max-width: 100vw; height: 100%; max-height: 100%;
  margin: 0; padding: 0; border: 0; border-radius: 28px 0 0 28px; overflow: hidden;
  background: var(--surface); color: var(--ink); box-shadow: -30px 0 80px -30px rgba(0, 0, 0, .35);
}
.drawer[open] { display: flex; animation: drawer-in .32s var(--ease); }
.drawer::backdrop { background: rgba(14, 20, 18, .38); -webkit-backdrop-filter: blur(2px); backdrop-filter: blur(2px); }
@keyframes drawer-in { from { transform: translateX(32px); opacity: 0; } }
.dw { display: flex; flex-direction: column; width: 100%; height: 100%; min-width: 0; }
.dw__head { display: flex; align-items: center; gap: 14px; padding: 20px 22px 16px; border-bottom: 1px solid var(--line); }
.dw__id { flex: 1; min-width: 0; }
.dw__name { font-family: var(--font-display); font-weight: 400; font-size: 32px; line-height: 1.05; }
.dw__meta { font-size: 14px; color: var(--ink-2); }
.dw__body { flex: 1; min-height: 0; overflow-y: auto; overscroll-behavior: contain; padding: 18px 22px 26px; display: flex; flex-direction: column; gap: 22px; }
.dw__status { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
.dw__time { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--ink-2); }
.dw__mood { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 20px; background: var(--surface-2); }
.dw__moodlabel { font-size: 22px; font-weight: 700; line-height: 1.2; }
.dw__moodsub { font-size: 13.5px; color: var(--ink-2); }
.dw__sec { display: flex; flex-direction: column; gap: 12px; }
.dw__h { font-size: 12.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2); }
.dw__emfi { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.dw__dim { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 16px; background: color-mix(in srgb, var(--tone-soft) 60%, var(--surface)); }
.dw__dim.is-empty { background: var(--surface-2); }
.dw__dim .dim__badge { width: 36px; height: 36px; border-radius: 11px; background: var(--tone); color: var(--tone-on); }
.dw__dim.is-empty .dim__badge { background: var(--tone-soft); color: var(--tone-ink); }
.dw__dimname { font-size: 12.5px; color: var(--ink-2); font-weight: 600; }
.dw__dimval { font-weight: 700; line-height: 1.25; }
.dw__facts { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.dw__facts > div { display: flex; flex-direction: column; gap: 8px; }
.dw__fact { display: flex; align-items: center; gap: 8px; font-weight: 600; }
.dw__fine { font-size: 12.5px; color: var(--ink-3); line-height: 1.45; }
.dw__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding: 14px 22px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); background: var(--surface); }
.dw__foot .syncline { justify-content: flex-start; }
.callout { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 16px; background: var(--brand-soft); color: var(--brand-soft-ink); font-size: 14px; }
.callout strong { display: block; font-size: 15px; }
.callout .ic { margin-top: 2px; }
.callout .btn { margin-top: 10px; }
.callout--muted { background: var(--surface-2); color: var(--ink-2); }
.callout--muted strong { color: var(--ink); }
.callout--urgent { background: var(--crit-soft); color: var(--crit-ink); box-shadow: inset 0 0 0 1.5px var(--crit); }
.notes { display: flex; flex-direction: column; gap: 8px; }
.note { padding: 12px 14px; border-radius: 14px; background: var(--surface-2); font-size: 14.5px; }
.note__meta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; margin-top: 4px; font-size: 12.5px; color: var(--ink-2); }
.note__meta .ic { color: var(--ok); }
.notes__actions { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }

.ho__actions { display: flex; flex-wrap: wrap; gap: 10px; }
.ho__intro { margin-bottom: 18px; color: var(--ink-2); max-width: 70ch; }
.ho__grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: start; }
.ho-sec { padding: 18px 20px; border-radius: 22px; border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow-1); }
.ho-sec__title { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; margin-bottom: 10px; }
.ho-sec__n { margin-left: auto; min-width: 28px; height: 26px; padding: 0 8px; display: grid; place-items: center; border-radius: 999px; background: var(--surface-3); font-size: 13px; color: var(--ink-2); }
.ho-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--ink-3); }
.ho-sec--critical .ho-dot { background: var(--crit); }
.ho-sec--attention .ho-dot { background: var(--warn); }
.ho-sec--stable .ho-dot { background: var(--brand); }
.ho-list { display: flex; flex-direction: column; }
.ho-item { padding: 12px 0; border-top: 1px solid var(--line); }
.ho-item:first-child { border-top: 0; padding-top: 4px; }
.ho-item__top { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; }
.ho-item__top > span { font-size: 13.5px; color: var(--ink-2); }
.ho-item__mood { display: inline-flex; align-items: center; gap: 6px; margin-left: auto; font-weight: 600; color: var(--ink) !important; }
.ho-item__line { margin-top: 4px; font-size: 14px; color: var(--ink-2); line-height: 1.45; }

/* ── Responsief (werkplek) ─────────────────────────────── */
@media (max-width: 1279px) {
  .split { grid-template-columns: 1fr; }
  .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kpi--wide { grid-column: 1 / -1; min-height: 0; }
}
@media (max-width: 960px) {
  .staff { grid-template-columns: 1fr; }
  .sb { position: sticky; top: 0; z-index: 30; height: auto; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 10px 16px; border-right: 0; border-bottom: 1px solid var(--line); background: color-mix(in srgb, var(--bg) 88%, transparent); -webkit-backdrop-filter: blur(16px); backdrop-filter: blur(16px); }
  .sb__brand { padding: 0; margin-right: auto; }
  .sb__nav { flex-direction: row; order: 3; width: 100%; }
  .sb__link { flex: 1; justify-content: center; }
  .sb__spacer, .sb__sync, .sb__user { display: none; }
  .sb__demo { min-height: 44px; padding: 6px 12px; }
  .sb__demo small { display: none; }
  .sm__top { position: static; padding: 20px 16px 6px; border-bottom: 0; background: transparent; -webkit-backdrop-filter: none; backdrop-filter: none; }
  .sm__content { padding: 14px 16px 48px; }
  .ho__grid { grid-template-columns: 1fr; }
}
@media (max-width: 720px) {
  .kpis { grid-template-columns: 1fr 1fr; gap: 10px; }
  .kpi { min-height: 0; padding: 14px; }
  .kpi__value { font-size: 32px; }
  .kpis > .kpi:nth-child(3) { grid-column: 1 / -1; }
  .search, .search input { width: 100%; }
  .sm__top .search { flex: 1 1 100%; }
  .mlegend { display: none; }
  .prow { grid-template-columns: 40px minmax(0, 1fr) auto; row-gap: 12px; padding: 14px; }
  .prow__mood { grid-column: 2; grid-row: 2; }
  .prow__week { grid-column: 3; grid-row: 2; justify-self: end; }
  .prow__status { grid-column: 3; grid-row: 1; }
  .prow__line { grid-column: 1 / -1; }
  .drawer { border-radius: 0; width: 100vw; }
  .dw__head, .dw__body, .dw__foot { padding-left: 18px; padding-right: 18px; }
  .dw__emfi, .dw__facts { grid-template-columns: 1fr; }
}

@media print {
  .zl::before, .sb, .ho__actions, .sm__top .search { display: none !important; }
  .staff { display: block; }
  .sm__top { position: static; background: none; border: 0; padding: 0 0 12px; }
  .sm__content { padding: 0; }
  .ho__grid { grid-template-columns: 1fr; }
  .ho-sec { box-shadow: none; break-inside: avoid; }
  body, .zl { background: #fff !important; }
}

@media (prefers-reduced-motion: reduce) {
  .zl *, .zl *::before, .zl *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
  .burst__check { stroke-dashoffset: 0; }
  .breath__orb, .breath.is-in .breath__orb, .breath.is-out .breath__orb { transform: scale(.82) !important; }
}
@media (forced-colors: active) {
  .moodopt.is-on, .scale__opt.is-on, .s-tile.is-on, .act.is-on, .fchip[aria-pressed="true"], .oitem[aria-pressed="true"], .emfi-card.is-set, .prow.is-selected { outline: 3px solid Highlight; }
}
`;
