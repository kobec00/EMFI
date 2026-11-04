/**
 * EMFI check-in — PC Zilverlinde · afdeling De Meander
 * ------------------------------------------------------------------
 * Prototype van een dagelijkse check-in voor patiënten in een
 * psychiatrisch ziekenhuis, met een overzicht voor de begeleiding.
 * Ziekenhuis, afdeling, patiënten en "HErOS+" zijn fictief.
 *
 *  • Patiënt      — check-in rond Emoties, Mentaal, Fysiek en Interactie
 *  • Eenvoudig    — één vraag per scherm, grote knoppen, pictogrammen en
 *                   voorlezen; bedoeld voor mensen met ASS of een
 *                   verstandelijke beperking
 *  • Begeleiding  — afdelingsoverzicht met signalen en weekverloop
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

const SIMPLE_STEPS = [
  { id: "mood", name: "Hoe gaat het?", picto: "🙂" },
  ...EMFI.map((d) => ({ id: d.key, name: d.simpleName, picto: d.simplePicto })),
  { id: "sleep", name: "Slapen", picto: "🌙" },
  { id: "talk", name: "Praten", picto: "💬" },
];

const EMPTY_DRAFT = {
  mood: null, emfi: {}, sleep: 0, activities: [],
  talk: null, thought: "", thoughtPrivate: false,
};

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
  { id: SELF.id, name: SELF.name, room: SELF.room, history: [2, 2, 3, 2, 3, 2], checkin: null, isSelf: true },
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
  { id: "talk", label: "Wil een gesprek", test: (p) => !!p.checkin?.talk },
  { id: "open", label: "Nog geen check-in", test: (p) => !p.checkin },
];

/* Signalen zijn bewust eenvoudige, uitlegbare regels: ze helpen de
   begeleiding prioriteren, maar vervangen het klinisch oordeel niet. */
function assess(p) {
  const c = p.checkin;
  if (!c) return { level: "none", signals: [] };
  const signals = [];
  const series = [...p.history, c.mood];
  let streak = 0;
  for (let i = series.length - 1; i >= 0 && series[i] <= 1; i--) streak++;
  const prev = p.history.slice(-3);
  const prevAvg = prev.reduce((s, v) => s + v, 0) / prev.length;

  if (c.mood === 0) signals.push({ level: "critical", text: "Heel lage stemming" });
  if (streak >= 3) signals.push({ level: "critical", text: `Lage stemming, ${streak} dagen op rij` });
  else if (streak === 2) signals.push({ level: "attention", text: "Lage stemming, 2 dagen op rij" });
  if (prevAvg - c.mood >= 1.5) signals.push({ level: "attention", text: "Stemming duidelijk gedaald" });
  if (c.sleep && c.sleep <= 2) signals.push({ level: "attention", text: "Slechte nachtrust" });
  if (c.emfi.I === "Eenzaam" || c.emfi.I === "Teruggetrokken") signals.push({ level: "attention", text: "Weinig sociaal contact" });
  if (c.emfi.E === "Angstig" && c.emfi.M === "Piekeren") signals.push({ level: "attention", text: "Angst en piekeren" });
  if (c.emfi.M === "Overprikkeld") signals.push({ level: "attention", text: "Overprikkeld" });
  if (c.emfi.F === "Pijn") signals.push({ level: "attention", text: "Meldt pijn" });

  const level = signals.some((s) => s.level === "critical") ? "critical" : signals.length ? "attention" : "stable";
  return { level, signals, streak };
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

function relTime(date, now) {
  const min = Math.round((now - date) / 60000);
  if (min < 1) return "zojuist";
  if (min < 60) return `${min} min geleden`;
  const h = Math.round(min / 60);
  return `${h} uur geleden`;
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

function lastDays(n, now) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - (n - 1 - i));
    return d;
  });
}

const average = (xs) => (xs.length ? xs.reduce((s, v) => s + v, 0) / xs.length : null);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

function missingFor(d) {
  const missing = [];
  if (d.mood === null) missing.push("je stemming");
  const n = EMFI.filter((x) => d.emfi[x.key]).length;
  if (n < 2) missing.push(n === 1 ? "nog 1 EMFI-gebied" : "2 EMFI-gebieden");
  return missing;
}

const joinNl = (xs) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} en ${xs[xs.length - 1]}`);

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

function useNow(interval = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), interval);
    return () => clearInterval(t);
  }, [interval]);
  return now;
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
   Iconen (lijnstijl, 24×24)
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
  "M17 31.5 L31 31.5",
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
      <path className="face__ft" d={MOUTHS[value]} />
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

/* ════════════════════════════════════════════════════════════════
   App
   ════════════════════════════════════════════════════════════════ */

export default function EMFIApp() {
  const [view, setView] = useState("patient");
  const [simple, setSimple] = usePersistentState("zilverlinde.eenvoudig", false);
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [phase, setPhase] = useState("form");
  const [step, setStep] = useState(-1);
  const [submission, setSubmission] = useState(null);
  const [openId, setOpenId] = useState(null);
  const [followed, setFollowed] = useState({});
  const [reminded, setReminded] = useState({});
  const [bootTime] = useState(() => Date.now());
  const now = useNow();

  const mode = view === "patient" && simple ? "simple" : "regular";

  useEffect(() => { window.scrollTo(0, 0); }, [view, mode, phase]);

  const update = useCallback((patch) => setDraft((d) => ({ ...d, ...patch })), []);
  const setEmfi = useCallback((key, value, toggle = true) => setDraft((d) => {
    const emfi = { ...d.emfi };
    if (toggle && emfi[key] === value) delete emfi[key];
    else emfi[key] = value;
    return { ...d, emfi };
  }), []);

  const submit = () => {
    setSubmission({ ...draft, talk: !!draft.talk, thought: draft.thought.trim(), at: new Date(), mode });
    setPhase("done");
  };
  const startNew = () => { setDraft(EMPTY_DRAFT); setPhase("form"); setStep(-1); };

  const patients = useMemo(() => SEED.map((p) => {
    if (p.isSelf) return { ...p, checkin: submission };
    return { ...p, checkin: p.checkin && { ...p.checkin, at: new Date(bootTime - p.checkin.ago * 60000) } };
  }), [submission, bootTime]);

  const lastSync = new Date(Math.max(bootTime - 60000, submission ? submission.at.getTime() + 1500 : 0));

  const openStaffFor = (id) => { setView("staff"); setOpenId(id); };

  return (
    <div className="zl" data-mode={mode}>
      <style>{CSS}</style>
      <a className="skip" href="#inhoud">Ga naar de inhoud</a>
      <TopBar view={view} onView={(v) => { setView(v); setOpenId(null); }} simple={simple} onSimple={setSimple} />
      <main id="inhoud" className="main" tabIndex={-1}>
        {view === "staff" ? (
          <StaffView
            patients={patients} now={now} lastSync={lastSync}
            openId={openId} setOpenId={setOpenId}
            followed={followed} onFollow={(id) => setFollowed((f) => ({ ...f, [id]: f[id] ? null : new Date() }))}
            reminded={reminded} onRemind={(id) => setReminded((r) => ({ ...r, [id]: new Date() }))}
          />
        ) : mode === "simple" ? (
          <SimpleFlow
            draft={draft} update={update} setEmfi={setEmfi}
            step={step} setStep={setStep} phase={phase}
            onSubmit={submit} onNew={startNew} submission={submission}
          />
        ) : phase === "done" ? (
          <DoneScreen submission={submission} onNew={startNew} onStaff={() => openStaffFor(SELF.id)} />
        ) : (
          <CheckinForm draft={draft} update={update} setEmfi={setEmfi} onSubmit={submit} now={now} onSimple={() => setSimple(true)} />
        )}
      </main>
    </div>
  );
}

/* ── Bovenbalk ─────────────────────────────────────────────────── */

function TopBar({ view, onView, simple, onSimple }) {
  const items = [
    { id: "patient", label: "Patiënt", icon: "user" },
    { id: "staff", label: "Begeleiding", icon: "clipboard" },
  ];
  return (
    <header className="topbar">
      <div className="topbar__inner">
        <div className="brand">
          <Logo />
          <p className="brand__text">
            <span className="brand__name">Zilverlinde</span>
            <span className="brand__ward">{ORG.ward}</span>
          </p>
        </div>
        <nav className="seg" aria-label="Weergave">
          {items.map((it) => (
            <button key={it.id} type="button" className="seg__btn" aria-current={view === it.id ? "page" : undefined} onClick={() => onView(it.id)}>
              <Icon name={it.icon} size={16} />
              <span>{it.label}</span>
            </button>
          ))}
        </nav>
        {view === "patient" && (
          <button type="button" role="switch" aria-checked={simple} aria-label="Eenvoudige modus" className="mswitch" onClick={() => onSimple(!simple)}>
            <Icon name="simple" size={18} />
            <span className="mswitch__label">Eenvoudig<span className="hide-sm">e modus</span></span>
            <span className="track" aria-hidden="true" />
          </button>
        )}
      </div>
    </header>
  );
}

/* ════════════════════════════════════════════════════════════════
   Patiënt — gewone modus
   ════════════════════════════════════════════════════════════════ */

function CheckinForm({ draft, update, setEmfi, onSubmit, now, onSimple }) {
  const { greeting, part } = daypart(now);
  const emfiCount = EMFI.filter((d) => draft.emfi[d.key]).length;
  const missing = missingFor(draft);
  const ready = missing.length === 0;
  const [flash, setFlash] = useState(null);

  const tryJump = () => {
    const target = draft.mood === null ? "sec-mood" : "sec-emfi";
    const el = document.getElementById(target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlash(target);
      setTimeout(() => setFlash(null), 1300);
    }
  };
  const handleSubmit = () => (ready ? onSubmit() : tryJump());

  const toggleActivity = (a) => update({
    activities: draft.activities.includes(a) ? draft.activities.filter((x) => x !== a) : [...draft.activities, a],
  });

  return (
    <div className="page page--form">
      <section className="hero">
        <svg className="meander" viewBox="0 0 640 240" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="meander-fade" x1="0" x2="640" y1="0" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0" stopColor="currentColor" stopOpacity="0" />
              <stop offset=".35" stopColor="currentColor" stopOpacity="1" />
              <stop offset=".8" stopColor="currentColor" stopOpacity="1" />
              <stop offset="1" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d="M20 180C110 180 120 80 210 80s110 110 200 100 110-120 210-110" stroke="url(#meander-fade)" />
        </svg>
        <div className="hero__main">
          <p className="eyebrow"><Icon name="calendar" size={16} />{capitalize(fmtDateLong(now))} · {capitalize(part)}check-in</p>
          <h1 className="display">{greeting}, <em>{SELF.firstName}.</em></h1>
          <p className="lede">Neem even de tijd voor jezelf. Er zijn geen goede of foute antwoorden: kies gewoon wat vandaag het best past.</p>
        </div>
        <aside className="simple-cta" aria-label="Eenvoudige modus">
          <span className="simple-cta__icon"><Icon name="simple" size={22} /></span>
          <div className="simple-cta__body">
            <p className="simple-cta__title">Liever eenvoudig?</p>
            <p className="simple-cta__text">Eén vraag per keer, grote knoppen en voorlezen.</p>
          </div>
          <button type="button" className="btn btn--secondary btn--sm" onClick={onSimple}>Zet aan</button>
        </aside>
      </section>

      <div className="layout">
        <div className="stack">
          <Section id="sec-mood" n={1} label="Stemming" title="Hoe gaat het met je, alles samen bekeken?" done={draft.mood !== null} flash={flash === "sec-mood"}>
            <Scale kind="mood" value={draft.mood} onChange={(v) => update({ mood: v })} />
          </Section>

          <Section id="sec-emfi" n={2} label="EMFI" title={<>Wat past vandaag het best <em>bij jou?</em></>} done={emfiCount >= 2} flash={flash === "sec-emfi"}
            aside={<span className={cx("counter", emfiCount >= 2 && "is-ok")}>{emfiCount} van 4 · minstens 2</span>}>
            <div className="dims">
              {EMFI.map((d) => <Dimension key={d.key} d={d} value={draft.emfi[d.key]} onPick={(v) => setEmfi(d.key, v)} />)}
            </div>
          </Section>

          <Section n={3} label="Slaap" title="Hoe heb je vannacht geslapen?" done={draft.sleep > 0}>
            <Scale kind="sleep" value={draft.sleep || null} onChange={(v) => update({ sleep: v })} />
          </Section>

          <Section n={4} label="Activiteiten" title="Wat heb je vandaag gedaan?" done={draft.activities.length > 0} optional>
            <fieldset className="acts">
              <legend className="sr-only">Activiteiten, kies er zoveel als je wil</legend>
              {ACTIVITIES.map((a) => {
                const on = draft.activities.includes(a.value);
                return (
                  <label key={a.value} className={cx("act", on && "is-on")}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleActivity(a.value)} />
                    <span className="act__icon"><Icon name={on ? "check" : a.icon} size={17} stroke={on ? 3 : 2} /></span>
                    {a.value}
                  </label>
                );
              })}
            </fieldset>
          </Section>

          <Section n={5} label="Voor je begeleider" title="Wil je nog iets kwijt?" done={!!draft.talk || draft.thought.trim().length > 0} optional>
            <NoteFields draft={draft} update={update} />
          </Section>
        </div>

        <aside className="aside">
          <SummaryCard draft={draft} ready={ready} missing={missing} onSubmit={handleSubmit} />
        </aside>
      </div>

      <div className="mbar" role="region" aria-label="Versturen">
        <p className="mbar__status">
          <strong>{ready ? "Klaar om te versturen" : "Bijna klaar"}</strong>
          {ready ? "Je kan nog alles aanpassen." : `Nog nodig: ${joinNl(missing)}.`}
        </p>
        <button type="button" className="btn btn--primary" aria-disabled={!ready} onClick={handleSubmit}>
          Versturen <Icon name="arrowRight" size={18} />
        </button>
      </div>
    </div>
  );
}

function Section({ id, n, label, title, done, optional, aside, flash, children }) {
  const hid = useId();
  return (
    <section id={id} className={cx("card sec", flash && "is-flash")} aria-labelledby={hid}>
      <div className="sec__top">
        <span className="sec__num">{String(n).padStart(2, "0")}</span>
        <span>{label}</span>
        {optional && <span className="sec__opt">optioneel</span>}
        <span className="sec__end">
          {aside}
          <span className={cx("sec__done", done && "is-done")}>
            <Icon name="check" size={13} stroke={3.2} />
            <span className="sr-only">{done ? "ingevuld" : "nog niet ingevuld"}</span>
          </span>
        </span>
      </div>
      <h2 className="sec__title" id={hid}>{title}</h2>
      {children}
    </section>
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
          {kind === "mood" ? <MoodFace value={v} size={52} /> : <MoonPhase value={v} size={40} />}
          <span className="scale__label">{label}</span>
        </label>
      ))}
    </fieldset>
  );
}

function Dimension({ d, value, onPick }) {
  const qid = useId();
  return (
    <div className={cx("dim", `tone-${d.key}`, value && "is-set")}>
      <div className="dim__head">
        <span className="dim__badge"><Icon name={d.icon} size={20} /></span>
        <div className="dim__titles">
          <p className="dim__name">{d.name} <span className="dim__hint">· {d.hint}</span></p>
          <p className="dim__q" id={qid}>{d.question}</p>
        </div>
        <span className={cx("dim__value", !value && "is-empty")}>
          {value ? <><Icon name="check" size={13} stroke={3} />{value}</> : "Nog open"}
        </span>
      </div>
      <div className="chips" role="group" aria-labelledby={qid}>
        {d.options.map((o) => (
          <button key={o.value} type="button" className="chip" aria-pressed={value === o.value} onClick={() => onPick(o.value)}>
            <span className="chip__check"><Icon name="check" size={14} stroke={3} /></span>
            {o.value}
          </button>
        ))}
        <button type="button" className="chip chip--ghost" aria-pressed={value === DONT_KNOW} onClick={() => onPick(DONT_KNOW)}>
          <Icon name="help" size={15} />
          {DONT_KNOW}
        </button>
      </div>
    </div>
  );
}

function NoteFields({ draft, update }) {
  const tid = useId();
  const pname = useId();
  return (
    <>
      <button type="button" role="switch" aria-checked={!!draft.talk} className="talk" onClick={() => update({ talk: !draft.talk })}>
        <span className="talk__icon"><Icon name="chat" size={22} /></span>
        <span className="talk__text">
          <strong>Ik wil vandaag graag een gesprek</strong>
          <span>Je begeleider ziet dit meteen en komt naar je toe.</span>
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
          <span className="count" aria-live="polite">{draft.thought.length}/{NOTE_MAX}</span>
        </div>
        <p className="privacy-note">
          <Icon name={draft.thoughtPrivate ? "lock" : "info"} size={16} />
          {draft.thoughtPrivate
            ? "Deze notitie blijft bij jou. Ze komt niet in je dossier."
            : "Je begeleider kan deze notitie lezen in je dossier."}
        </p>
      </div>
    </>
  );
}

function SummaryCard({ draft, ready, missing, onSubmit }) {
  const emfiSet = EMFI.filter((d) => draft.emfi[d.key]);
  const parts = [draft.mood !== null, emfiSet.length >= 2, draft.sleep > 0, draft.activities.length > 0];
  const done = parts.filter(Boolean).length;
  const rows = [
    { k: "Stemming", v: draft.mood !== null ? MOODS[draft.mood] : null, req: true },
    ...EMFI.map((d) => ({ k: d.name, v: draft.emfi[d.key] || null, tone: d.key })),
    { k: "Slaap", v: draft.sleep ? SLEEP[draft.sleep] : null },
    { k: "Activiteiten", v: draft.activities.length ? draft.activities.join(", ") : null, opt: true },
    { k: "Gesprek", v: draft.talk ? "Ja, graag" : null, opt: true },
    { k: "Notitie", v: draft.thought.trim() ? (draft.thoughtPrivate ? "Alleen voor jou" : "Gedeeld") : null, opt: true },
  ];
  return (
    <div className="card summary">
      <div className="summary__head">
        <div className="ring-wrap">
          <ProgressRing value={done / parts.length} />
          <span>{done}/{parts.length}</span>
        </div>
        <div>
          <p className="summary__title">Jouw check-in</p>
          <p className="summary__sub">Wordt opgeslagen in je dossier</p>
        </div>
      </div>
      <ul className="sumlist">
        {rows.map((r) => (
          <li key={r.k} className={r.tone ? `tone-${r.tone}` : undefined}>
            <span className={cx("sumlist__dot", r.v && "is-done", r.opt && "is-opt", r.tone && "is-tone")}><Icon name="check" size={11} stroke={3.4} /></span>
            <span className="sumlist__k">{r.k}</span>
            <span className="sumlist__v">{r.v || "—"}</span>
          </li>
        ))}
      </ul>
      <button type="button" className="btn btn--primary btn--lg btn--block" aria-disabled={!ready} onClick={onSubmit}>
        Verstuur naar dossier <Icon name="arrowRight" size={18} />
      </button>
      <p className={cx("hint", ready && "hint--ok")} aria-live="polite">
        <Icon name={ready ? "checkCircle" : "info"} size={16} />
        {ready ? "Alles wat nodig is, is ingevuld." : `Nog nodig: ${joinNl(missing)}.`}
      </p>
      <p className="foot-note"><Icon name="shield" size={15} />Alleen jouw behandelteam kan je check-in zien.</p>
    </div>
  );
}

function ProgressRing({ value }) {
  const r = 23, c = 2 * Math.PI * r;
  return (
    <svg className="ring" width="58" height="58" viewBox="0 0 58 58" aria-hidden="true" focusable="false">
      <circle cx="29" cy="29" r={r} className="ring__track" />
      <circle cx="29" cy="29" r={r} className="ring__bar" strokeDasharray={c} strokeDashoffset={c * (1 - value)} transform="rotate(-90 29 29)" />
    </svg>
  );
}

function receiptRows(s) {
  const rows = [{ icon: <MoodFace value={s.mood} size={24} tone />, k: "Stemming", v: MOODS[s.mood] }];
  EMFI.forEach((d) => s.emfi[d.key] && rows.push({ icon: <span className={`mini-badge tone-${d.key}`}><Icon name={d.icon} size={14} /></span>, k: d.name, v: s.emfi[d.key] }));
  if (s.sleep) rows.push({ icon: <MoonPhase value={s.sleep} size={22} />, k: "Slaap", v: SLEEP[s.sleep] });
  if (s.activities.length) rows.push({ icon: <Icon name="activity" size={18} />, k: "Activiteiten", v: s.activities.join(", ") });
  if (s.talk) rows.push({ icon: <Icon name="chat" size={18} />, k: "Gesprek", v: "Gevraagd" });
  if (s.thought) rows.push({ icon: <Icon name={s.thoughtPrivate ? "lock" : "pencil"} size={18} />, k: "Notitie", v: s.thoughtPrivate ? "Alleen voor jou" : "Gedeeld met begeleiding" });
  return rows;
}

function careMessage(s) {
  if (s.mood !== null && s.mood <= 1) {
    return { tone: "alert", icon: "heart", text: "Het klinkt als een zware dag. Je hoeft het niet alleen te dragen: spreek gerust iemand van het team aan. Voel je je niet veilig? Zeg het dan meteen." };
  }
  if (s.talk) return { icon: "chat", text: "Je vroeg om een gesprek. Je begeleider komt naar je toe zodra het kan." };
  if (s.mood >= 3) return { icon: "heart", text: "Fijn om te horen. Neem dat gevoel mee in de rest van je dag." };
  return { icon: "heart", text: "Dankjewel om even stil te staan bij hoe het met je gaat." };
}

function SyncStatus({ at, simple }) {
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
        ? <>{simple ? "Opgeslagen" : "Opgeslagen in je dossier"} · gesynchroniseerd met <b>{ORG.epd}</b> om {fmtTime(at)}</>
        : "Bezig met opslaan…"}
    </p>
  );
}

function DoneScreen({ submission, onNew, onStaff }) {
  const care = careMessage(submission);
  return (
    <div className="page done">
      <svg className="burst" viewBox="0 0 96 96" aria-hidden="true" focusable="false">
        <circle className="burst__halo" cx="48" cy="48" r="46" />
        <circle className="burst__disc" cx="48" cy="48" r="32" />
        <path className="burst__check" d="M34 49 44 59 63 39" />
      </svg>
      <h1 className="done__title">Dankjewel, <em>{SELF.firstName}.</em></h1>
      <p className="done__lede">Je check-in staat in je dossier. Je begeleider bekijkt hem vandaag nog.</p>

      <div className={cx("care", care.tone === "alert" && "care--alert")}>
        <Icon name={care.icon} size={20} />
        <p>{care.text}</p>
      </div>

      <div className="card receipt">
        <p className="receipt__title">Doorgestuurd naar je dossier</p>
        <ul>
          {receiptRows(submission).map((r) => (
            <li key={r.k} className="receipt__row">
              <span className="receipt__icon">{r.icon}</span>
              <span className="receipt__k">{r.k}</span>
              <span className="receipt__v">{r.v}</span>
            </li>
          ))}
        </ul>
      </div>

      <SyncStatus at={submission.at} />

      <div className="done__actions">
        <button type="button" className="btn btn--secondary" onClick={onNew}>Nieuwe check-in</button>
        <button type="button" className="btn btn--ghost" onClick={onStaff}>Bekijk als begeleiding <Icon name="arrowRight" size={16} /></button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Patiënt — eenvoudige modus
   Eén vraag per scherm · vaste plek voor knoppen · korte, letterlijke
   zinnen · pictogrammen bij elk antwoord · voorlezen · geen animaties
   ════════════════════════════════════════════════════════════════ */

function SimpleFlow({ draft, update, setEmfi, step, setStep, phase, onSubmit, onNew, submission }) {
  const speech = useSpeech();
  const [editing, setEditing] = useState(false);
  const [nudge, setNudge] = useState(false);
  const titleRef = useRef(null);
  const mounted = useRef(false);

  useEffect(() => {
    speech.stop();
    setNudge(false);
    if (mounted.current) {
      window.scrollTo(0, 0);
      titleRef.current?.focus({ preventScroll: true });
    }
    mounted.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, phase]);

  if (phase === "done" && submission) {
    return <SimpleDone submission={submission} speech={speech} titleRef={titleRef} onNew={onNew} />;
  }
  if (step < 0) return <SimpleIntro speech={speech} titleRef={titleRef} onStart={() => setStep(0)} />;
  if (step >= SIMPLE_STEPS.length) {
    return (
      <SimpleReview draft={draft} speech={speech} titleRef={titleRef}
        onEdit={(i) => { setEditing(true); setStep(i); }}
        onBack={() => setStep(SIMPLE_STEPS.length - 1)}
        onSubmit={() => { setEditing(false); onSubmit(); }} />
    );
  }

  const meta = SIMPLE_STEPS[step];
  const q = simpleQuestion(meta.id, draft, update, setEmfi);
  const answered = q.answered;
  const next = () => {
    if (!answered) { setNudge(true); return; }
    if (editing) { setEditing(false); setStep(SIMPLE_STEPS.length); return; }
    setStep(step + 1);
  };
  const speakText = [q.title, q.sub, ...q.choices.map((c) => c.label)].filter(Boolean).join(". ");

  return (
    <div className="s-page">
      <div className="s-top">
        <p className="s-count">Vraag {step + 1} van {SIMPLE_STEPS.length}</p>
        <ol className="s-dots" aria-hidden="true">
          {SIMPLE_STEPS.map((s, i) => <li key={s.id} className={cx("s-dot", i < step && "is-done", i === step && "is-now")} />)}
        </ol>
      </div>
      <div className="s-head">
        <h1 className="s-title" ref={titleRef} tabIndex={-1}>{q.title}</h1>
        <SpeakButton speech={speech} text={speakText} />
      </div>
      <p className="s-sub">{q.sub}</p>

      <SimpleChoices choices={q.choices} selected={q.selected} onSelect={(v) => { q.onSelect(v); setNudge(false); }} columns={q.columns} label={q.title} />

      {nudge && (
        <p className="s-nudge" role="alert"><Icon name="info" size={26} />Kies eerst een antwoord. Daarna druk je op Volgende.</p>
      )}

      <nav className="s-nav" aria-label="Vragen">
        <div className="s-nav__inner">
          <button type="button" className="s-btn" onClick={() => setStep(step - 1)}>
            <Icon name="arrowLeft" size={26} stroke={2.5} />Terug
          </button>
          <button type="button" className="s-btn s-btn--go" aria-disabled={!answered} onClick={next}>
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
      choices: [1, 2, 3].map((v) => ({ value: v, label: MOODS[v], visual: <MoodFace value={v} size={88} tone /> })),
    };
  }
  if (id === "sleep") {
    return {
      title: "Hoe heb je geslapen?", sub: "Denk aan vannacht.", columns: 3,
      answered: draft.sleep > 0,
      selected: draft.sleep ? clamp(draft.sleep, 2, 4) : null,
      onSelect: (v) => update({ sleep: v }),
      choices: [
        { value: 2, label: "Slecht geslapen", visual: <MoodFace value={1} size={88} tone /> },
        { value: 3, label: "Gaat wel", visual: <MoodFace value={2} size={88} tone /> },
        { value: 4, label: "Goed geslapen", visual: <MoodFace value={3} size={88} tone /> },
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

function SimpleIntro({ speech, titleRef, onStart }) {
  const text = `Hallo ${SELF.firstName}. We stellen je ${SIMPLE_STEPS.length} korte vragen. ${SIMPLE_STEPS.map((s, i) => `${i + 1}: ${s.name}`).join(". ")}. Het duurt ongeveer 2 minuten. Druk op Beginnen.`;
  return (
    <div className="s-page">
      <div className="s-head">
        <h1 className="s-title" ref={titleRef} tabIndex={-1}>Hallo {SELF.firstName} 👋</h1>
        <SpeakButton speech={speech} text={text} />
      </div>
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
      <nav className="s-nav" aria-label="Starten">
        <div className="s-nav__inner">
          <button type="button" className="s-btn s-btn--go" onClick={onStart}>Beginnen <Icon name="arrowRight" size={26} stroke={2.5} /></button>
        </div>
      </nav>
    </div>
  );
}

function simpleAnswer(id, draft) {
  if (id === "mood") return draft.mood !== null ? { label: MOODS[draft.mood], visual: <MoodFace value={draft.mood} size={52} tone /> } : null;
  if (id === "sleep") return draft.sleep ? { label: SLEEP[draft.sleep], visual: <span className="s-picto s-picto--sm">🌙</span> } : null;
  if (id === "talk") return draft.talk === null ? null : { label: draft.talk ? "Ja, graag" : "Nee, nu niet", visual: <span className="s-picto s-picto--sm">{draft.talk ? "💬" : "✋"}</span> };
  const v = draft.emfi[id];
  if (!v) return null;
  const opt = EMFI.find((x) => x.key === id).options.find((o) => o.value === v);
  return { label: opt?.simple || v, visual: <span className="s-picto s-picto--sm">{opt?.picto || "🤷"}</span> };
}

function SimpleReview({ draft, speech, titleRef, onEdit, onBack, onSubmit }) {
  const rows = SIMPLE_STEPS.map((s, i) => ({ ...s, i, a: simpleAnswer(s.id, draft) }));
  const text = `Klaar. Klopt dit? ${rows.map((r) => `${r.name}: ${r.a ? r.a.label : "niet ingevuld"}`).join(". ")}. Druk op Versturen.`;
  return (
    <div className="s-page">
      <div className="s-head">
        <h1 className="s-title" ref={titleRef} tabIndex={-1}>Klopt dit?</h1>
        <SpeakButton speech={speech} text={text} />
      </div>
      <p className="s-sub">Kijk je antwoorden na. Wil je iets anders? Druk op Verander.</p>
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
      <nav className="s-nav" aria-label="Versturen">
        <div className="s-nav__inner">
          <button type="button" className="s-btn" onClick={onBack}><Icon name="arrowLeft" size={26} stroke={2.5} />Terug</button>
          <button type="button" className="s-btn s-btn--go" onClick={onSubmit}>Versturen <Icon name="check" size={26} stroke={3} /></button>
        </div>
      </nav>
    </div>
  );
}

function SimpleDone({ submission, speech, titleRef, onNew }) {
  const lines = ["Je begeleider kan je antwoorden nu zien."];
  if (submission.talk) lines.push("Je begeleider komt straks naar je toe.");
  if (submission.mood !== null && submission.mood <= 1) lines.push("Gaat het niet goed? Zeg het meteen tegen iemand van het team.");
  return (
    <div className="s-page s-done">
      <span className="s-done__mark" aria-hidden="true"><Icon name="check" size={72} stroke={3} /></span>
      <div className="s-head s-head--center">
        <h1 className="s-title" ref={titleRef} tabIndex={-1}>Klaar! Dank je wel.</h1>
      </div>
      <ul className="s-msgs">
        {lines.map((l) => <li key={l} className="s-msg">{l}</li>)}
      </ul>
      <div className="s-done__speak"><SpeakButton speech={speech} text={`Klaar! Dank je wel. ${lines.join(" ")}`} /></div>
      <SyncStatus at={submission.at} simple />
      <nav className="s-nav" aria-label="Afsluiten">
        <div className="s-nav__inner">
          <button type="button" className="s-btn s-btn--go" onClick={onNew}>Klaar <Icon name="check" size={26} stroke={3} /></button>
        </div>
      </nav>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Begeleiding — afdelingsoverzicht
   ════════════════════════════════════════════════════════════════ */

function StaffView({ patients, now, lastSync, openId, setOpenId, followed, onFollow, reminded, onRemind }) {
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const rows = useMemo(() => patients
    .map((p) => ({ ...p, a: assess(p) }))
    .sort((x, y) => LEVELS[x.a.level].rank - LEVELS[y.a.level].rank
      || Number(!!y.checkin?.talk) - Number(!!x.checkin?.talk)
      || x.name.localeCompare(y.name, "nl")), [patients]);

  const checked = rows.filter((r) => r.checkin);
  const open = rows.filter((r) => !r.checkin);
  const critical = rows.filter((r) => r.a.level === "critical");
  const attention = rows.filter((r) => r.a.level === "attention");
  const talkers = rows.filter((r) => r.checkin?.talk);
  const moods = checked.map((r) => r.checkin.mood);
  const avg = average(moods);
  const avgYesterday = average(rows.map((r) => r.history[r.history.length - 1]));
  const delta = avg !== null && avgYesterday !== null ? avg - avgYesterday : null;
  const dist = [0, 1, 2, 3, 4].map((v) => moods.filter((m) => m === v).length);

  const q = query.trim().toLowerCase();
  const active = FILTERS.find((f) => f.id === filter);
  const visible = rows.filter(active.test).filter((r) => !q || r.name.toLowerCase().includes(q) || r.room.toLowerCase().includes(q));
  const selected = rows.find((r) => r.id === openId) || null;

  return (
    <div className="page page--staff">
      <header className="staff-head">
        <div>
          <p className="eyebrow"><Icon name="clipboard" size={16} />Begeleiding · {shiftName(now)} · {fmtDateLong(now)}</p>
          <h1 className="staff-title">{ORG.ward}</h1>
          <p className="staff-sub">{ORG.hospital} · {ORG.wardType} · {rows.length} patiënten</p>
        </div>
        <p className="sync" title={`Laatste synchronisatie om ${fmtTime(lastSync)}`}>
          <span className="sync__dot" aria-hidden="true" />
          Gesynchroniseerd met <b>{ORG.epd}</b>
          <span className="sync__time">· {relTime(lastSync, now)}</span>
        </p>
      </header>

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
            {critical.filter((r) => followed[r.id]).length > 0 && `${critical.filter((r) => followed[r.id]).length} al opgevolgd · `}
            {attention.length} {attention.length === 1 ? "andere patiënt" : "andere patiënten"} met signalen
          </p>
        </div>
        <div className="kpi">
          <p className="kpi__label"><Icon name="chat" size={16} />Gespreksvragen</p>
          <p className="kpi__value">{talkers.length}</p>
          <p className="kpi__sub">{talkers.length ? joinNl(talkers.map((r) => firstName(r.name))) : "Geen vragen vandaag"}</p>
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

      <div className="toolbar">
        <div className="filters" role="group" aria-label="Filter patiënten">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" className="fchip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}<span className="fchip__n">{rows.filter(f.test).length}</span>
            </button>
          ))}
        </div>
        <label className="search">
          <Icon name="search" size={17} />
          <span className="sr-only">Zoek patiënt of kamer</span>
          <input type="search" value={query} placeholder="Zoek naam of kamer" onChange={(e) => setQuery(e.target.value)} />
        </label>
      </div>

      {visible.length ? (
        <div className="pgrid">
          {visible.map((p) => (
            <PatientCard key={p.id} p={p} now={now} followedAt={followed[p.id]} remindedAt={reminded[p.id]}
              onOpen={() => setOpenId(p.id)} onRemind={() => onRemind(p.id)} />
          ))}
        </div>
      ) : (
        <div className="empty card">
          <Icon name="search" size={28} />
          <p><strong>Niemand gevonden</strong></p>
          <p>Probeer een andere filter of zoekterm.</p>
        </div>
      )}

      <Drawer open={!!selected} onClose={() => setOpenId(null)} labelledBy="drawer-title">
        {selected && (
          <PatientDetail p={selected} now={now} followedAt={followed[selected.id]} remindedAt={reminded[selected.id]}
            onFollow={() => onFollow(selected.id)} onRemind={() => onRemind(selected.id)} onClose={() => setOpenId(null)} />
        )}
      </Drawer>
    </div>
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

function Sparkline({ values, width = 96, height = 32 }) {
  const n = values.length;
  const x = (i) => 5 + (i * (width - 10)) / (n - 1);
  const y = (v) => 5 + ((4 - v) * (height - 10)) / 4;
  let d = "";
  values.forEach((v, i) => {
    if (v == null) return;
    d += `${i > 0 && values[i - 1] != null ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`;
  });
  const last = values[n - 1];
  const known = values.filter((v) => v != null);
  return (
    <svg className="spark" width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img"
      aria-label={`Stemming laatste ${n} dagen: ${known.map((v) => MOODS[v].toLowerCase()).join(", ")}`}>
      <path d={d} className="spark__line" />
      {last != null && <circle cx={x(n - 1)} cy={y(last)} r="4" className="spark__dot" />}
    </svg>
  );
}

function PatientCard({ p, now, followedAt, remindedAt, onOpen, onRemind }) {
  const c = p.checkin;
  const a = p.a;
  const fresh = p.isSelf && c && now - c.at < 15 * 60000;
  const hid = useId();
  return (
    <article className={cx("pcard", `pcard--${a.level}`)} aria-labelledby={hid}>
      <header className="pcard__head">
        <Avatar name={p.name} />
        <div className="pcard__id">
          <h3 className="pcard__name" id={hid}>
            <button type="button" className="pcard__open" onClick={onOpen}>
              {p.name}<span className="sr-only">, details openen</span>
            </button>
          </h3>
          <p className="pcard__meta">
            {p.room}{c && <> · {fmtTime(c.at)}</>}
            {fresh && <span className="tag tag--new">Nieuw</span>}
            {c?.mode === "simple" && <span className="tag" title="Ingevuld in de eenvoudige modus">Eenvoudig</span>}
          </p>
        </div>
        <StatusPill level={a.level} />
      </header>

      {c ? (
        <>
          <div className="pcard__mood">
            <MoodFace value={c.mood} size={38} tone />
            <div className="pcard__moodtext">
              <span className="pcard__moodlabel">{MOODS[c.mood]}</span>
              <span className="pcard__moodsub">Stemming vandaag</span>
            </div>
            <div className="pcard__trend">
              <Sparkline values={[...p.history, c.mood]} />
              <span>7 dagen</span>
            </div>
          </div>
          <ul className="etags" aria-label="EMFI">
            {EMFI.map((d) => c.emfi[d.key] && (
              <li key={d.key} className={cx("etag", `tone-${d.key}`)}>
                <Icon name={d.icon} size={14} /><span className="sr-only">{d.name}: </span>{c.emfi[d.key]}
              </li>
            ))}
          </ul>
          {c.thought && !c.thoughtPrivate && <blockquote className="quote">“{c.thought}”</blockquote>}
          <p className="pcard__facts">
            <span><MoonPhase value={c.sleep || 0} size={18} />{c.sleep ? `${SLEEP[c.sleep]} geslapen` : "Slaap niet ingevuld"}</span>
            {c.activities.length > 0 && <span><Icon name="activity" size={15} />{c.activities.join(", ")}</span>}
          </p>
          {(a.signals.length > 0 || c.talk || followedAt) && (
            <div className="pcard__foot">
              <SignalList signals={a.signals} talk={c.talk} limit={3} />
              {followedAt && <span className="followed"><Icon name="checkCircle" size={14} />Opgevolgd {fmtTime(followedAt)}</span>}
            </div>
          )}
        </>
      ) : (
        <div className="pcard__empty">
          <p>Nog geen check-in vandaag.</p>
          <button type="button" className="btn btn--secondary btn--sm pcard__action" onClick={onRemind} disabled={!!remindedAt}>
            <Icon name={remindedAt ? "check" : "bell"} size={15} />
            {remindedAt ? `Herinnering verstuurd · ${fmtTime(remindedAt)}` : "Stuur herinnering"}
          </button>
        </div>
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

function PatientDetail({ p, now, followedAt, remindedAt, onFollow, onRemind, onClose }) {
  const c = p.checkin;
  const a = p.a;
  const days = lastDays(7, now);
  const points = days.map((date, i) => ({ date, mood: i < 6 ? p.history[i] : c ? c.mood : null }));
  return (
    <div className="dw">
      <header className="dw__head">
        <Avatar name={p.name} size={50} />
        <div className="dw__id">
          <h2 className="dw__name" id="drawer-title">{p.name}</h2>
          <p className="dw__meta">{p.room} · {ORG.ward}</p>
        </div>
        <button type="button" className="iconbtn" onClick={onClose} aria-label="Sluiten"><Icon name="x" size={20} /></button>
      </header>

      <div className="dw__body">
        <div className="dw__status">
          <StatusPill level={a.level} />
          {c && <span className="dw__time"><Icon name="clock" size={14} />Check-in om {fmtTime(c.at)}{c.mode === "simple" && " · eenvoudige modus"}</span>}
        </div>

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
      </div>

      <footer className="dw__foot">
        <p className="syncline is-synced"><Icon name="shield" size={14} />Dossier gesynchroniseerd met <b>{ORG.epd}</b>{c ? ` · ${fmtTime(new Date(c.at.getTime() + 60000))}` : ""}</p>
        {c ? (
          <button type="button" className={cx("btn", followedAt ? "btn--secondary" : "btn--primary")} onClick={onFollow} aria-pressed={!!followedAt}>
            <Icon name={followedAt ? "checkCircle" : "check"} size={18} />
            {followedAt ? `Opgevolgd om ${fmtTime(followedAt)}` : "Markeer als opgevolgd"}
          </button>
        ) : (
          <button type="button" className="btn btn--secondary" onClick={onRemind} disabled={!!remindedAt}>
            <Icon name={remindedAt ? "check" : "bell"} size={18} />
            {remindedAt ? `Herinnering verstuurd · ${fmtTime(remindedAt)}` : "Stuur herinnering"}
          </button>
        )}
      </footer>
    </div>
  );
}

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
  const area = known.length > 1 && known.every((p, k) => k === 0 || p.i === known[k - 1].i + 1)
    ? `${line}L${x(known[known.length - 1].i)} ${y(0)}L${x(known[0].i)} ${y(0)}Z` : null;
  const colW = (W - L - R) / (n - 1);
  const h = hover != null ? points[hover] : null;

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
            <circle key={i} cx={x(i)} cy={y(p.mood)} r={i === n - 1 ? 5.5 : 4.5} className={cx("mchart__dot", i === n - 1 && "is-today", hover === i && "is-hover")} />
          ))}
          {points.map((p, i) => (
            <text key={i} x={i === n - 1 ? x(i) + 8 : x(i)} y={H - 10} textAnchor={i === n - 1 ? "end" : "middle"} className={cx("mchart__x", i === n - 1 && "is-today")}>
              {i === n - 1 ? "vandaag" : DAY_SHORT[p.date.getDay()]}
            </text>
          ))}
          {points.map((p, i) => (
            <rect key={i} x={x(i) - colW / 2} y={0} width={colW} height={H} fill="transparent"
              onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)} />
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
  --glow-line: rgba(36, 89, 75, .075);

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

  --r-lg: 22px; --r-xl: 28px;
  --shadow-1: 0 1px 2px rgba(23, 32, 28, .04), 0 4px 14px -6px rgba(23, 32, 28, .08);
  --shadow-2: 0 2px 6px rgba(23, 32, 28, .05), 0 22px 44px -20px rgba(23, 32, 28, .28);
  --ease: cubic-bezier(.2, .7, .2, 1);
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
    --glow-line: rgba(127, 196, 170, .05);

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
body { margin: 0; background: var(--bg); }
.zl {
  min-height: 100vh; min-height: 100dvh;
  position: relative; isolation: isolate; overflow-x: clip;
  background: var(--bg); color: var(--ink);
  font-family: var(--font-ui); font-size: 16px; line-height: 1.5;
  -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;
}
.zl *, .zl *::before, .zl *::after { box-sizing: border-box; }
.zl :where(h1, h2, h3, p, ul, ol, li, figure, blockquote, fieldset, legend) { margin: 0; padding: 0; }
.zl :where(ul, ol) { list-style: none; }
.zl fieldset { border: 0; min-width: 0; }
.zl :where(button, input, textarea) { font: inherit; color: inherit; }
.zl button { cursor: pointer; }
.zl :focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
.zl .main:focus { outline: none; }
.zl::before {
  content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none;
  background:
    radial-gradient(900px 520px at 8% -10%, var(--glow-1), transparent 65%),
    radial-gradient(760px 520px at 100% -5%, var(--glow-2), transparent 62%);
}
.sr-only { position: absolute !important; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0; }
.skip { position: absolute; left: 16px; top: -100px; z-index: 100; padding: 10px 16px; border-radius: 12px; background: var(--ink); color: var(--bg); font-weight: 700; text-decoration: none; }
.skip:focus { top: 12px; }
.ic { flex: none; display: block; }
.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* ── Bovenbalk ─────────────────────────────────────────── */
.topbar {
  position: sticky; top: 0; z-index: 30;
  background: color-mix(in srgb, var(--bg) 80%, transparent);
  -webkit-backdrop-filter: saturate(1.4) blur(16px); backdrop-filter: saturate(1.4) blur(16px);
  border-bottom: 1px solid color-mix(in srgb, var(--line) 75%, transparent);
}
.topbar__inner { max-width: 1240px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; gap: 14px; }
.brand { display: flex; align-items: center; gap: 12px; margin-right: auto; min-width: 0; }
.brand__text { display: flex; flex-direction: column; line-height: 1.05; }
.brand__name { font-family: var(--font-display); font-size: 24px; letter-spacing: .005em; }
.brand__ward { font-size: 11.5px; font-weight: 700; color: var(--ink-2); letter-spacing: .09em; text-transform: uppercase; margin-top: 2px; }
.logo { flex: none; display: block; }
.logo__bg { fill: var(--brand); }
.logo__leaf { fill: var(--brand-soft); }
.logo__vein { fill: none; stroke: var(--brand); stroke-width: 1.7; stroke-linecap: round; }

.seg { display: inline-flex; gap: 2px; padding: 4px; border-radius: 999px; background: var(--surface-3); }
.seg__btn {
  display: inline-flex; align-items: center; gap: 8px; height: 36px; padding: 0 15px;
  border: 0; border-radius: 999px; background: transparent; color: var(--ink-2);
  font-size: 14px; font-weight: 600; transition: background .2s var(--ease), color .2s, box-shadow .2s;
}
.seg__btn:hover { color: var(--ink); }
.seg__btn[aria-current="page"] { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-1); }

.mswitch {
  display: inline-flex; align-items: center; gap: 10px; height: 44px; padding: 0 10px 0 14px;
  border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface);
  color: var(--ink); font-size: 14px; font-weight: 600; transition: border-color .2s;
}
.mswitch:hover { border-color: var(--ink-3); }
.track {
  position: relative; flex: none; width: 40px; height: 24px; border-radius: 999px;
  background: var(--surface-3); box-shadow: inset 0 0 0 1.5px var(--line-strong);
  transition: background .2s var(--ease), box-shadow .2s;
}
.track::after {
  content: ""; position: absolute; top: 4px; left: 4px; width: 16px; height: 16px; border-radius: 50%;
  background: var(--ink-3); transition: transform .25s var(--ease), background .2s;
}
[aria-checked="true"] > .track { background: var(--brand); box-shadow: none; }
[aria-checked="true"] > .track::after { transform: translateX(16px); background: var(--brand-ink); }

/* ── Knoppen ───────────────────────────────────────────── */
.btn {
  --h: 48px;
  display: inline-flex; align-items: center; justify-content: center; gap: 10px;
  height: var(--h); padding: 0 22px; border-radius: 14px; border: 1px solid transparent;
  font-size: 16px; font-weight: 600; white-space: nowrap; text-decoration: none;
  transition: background .2s var(--ease), border-color .2s, color .2s, box-shadow .2s, transform .15s;
}
.btn:active { transform: translateY(1px); }
.btn--primary { background: var(--brand); color: var(--brand-ink); box-shadow: 0 10px 22px -12px color-mix(in srgb, var(--brand) 80%, transparent); }
.btn--primary:hover { background: var(--brand-hover); }
.btn--primary[aria-disabled="true"] { background: var(--surface-3); color: var(--ink-2); box-shadow: none; }
.btn--secondary { background: var(--surface); border-color: var(--line-strong); color: var(--ink); }
.btn--secondary:hover { border-color: var(--ink-3); }
.btn--ghost { background: transparent; color: var(--ink-2); }
.btn--ghost:hover { background: var(--surface-3); color: var(--ink); }
.btn--lg { --h: 56px; font-size: 17px; border-radius: 16px; }
.btn--sm { --h: 38px; padding: 0 14px; font-size: 14px; border-radius: 11px; gap: 8px; }
.btn--block { width: 100%; }
.btn:disabled { cursor: default; opacity: .75; transform: none; }
.iconbtn {
  width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 14px;
  border: 1px solid var(--line); background: var(--surface); color: var(--ink-2);
}
.iconbtn:hover { color: var(--ink); border-color: var(--line-strong); }

/* ── Pagina & hero ─────────────────────────────────────── */
.page { max-width: 1240px; margin: 0 auto; padding: 40px 24px 96px; }
.eyebrow { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; color: var(--ink-2); }
.display { font-family: var(--font-display); font-weight: 400; font-size: clamp(46px, 6.6vw, 80px); line-height: .98; letter-spacing: -.018em; margin-top: 14px; }
.display em { font-style: italic; color: var(--brand); }
.lede { font-size: 18px; color: var(--ink-2); max-width: 48ch; margin-top: 18px; text-wrap: pretty; }

.hero { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: end; gap: 24px 40px; margin-bottom: 36px; }
.meander { position: absolute; z-index: -1; right: -4%; top: -24px; width: min(760px, 70%); height: 260px; fill: none; color: var(--glow-line); stroke-width: 46; stroke-linecap: round; pointer-events: none; }
.simple-cta {
  display: flex; align-items: center; gap: 14px; max-width: 420px; padding: 14px 14px 14px 16px;
  border-radius: 20px; border: 1px solid var(--line); box-shadow: var(--shadow-1);
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
}
.simple-cta__icon { width: 44px; height: 44px; flex: none; display: grid; place-items: center; border-radius: 14px; background: var(--brand-soft); color: var(--brand-soft-ink); }
.simple-cta__body { flex: 1; min-width: 0; }
.simple-cta__title { font-weight: 700; font-size: 15px; }
.simple-cta__text { font-size: 14px; color: var(--ink-2); line-height: 1.35; }

.layout { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 28px; align-items: start; }
.stack { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
.aside { position: sticky; top: 92px; }

/* ── Secties ───────────────────────────────────────────── */
.card { background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-xl); box-shadow: var(--shadow-1); }
.sec { padding: 26px 28px 28px; scroll-margin-top: 100px; }
.sec.is-flash { animation: flash 1.3s var(--ease); }
@keyframes flash { 30% { box-shadow: 0 0 0 4px color-mix(in srgb, var(--focus) 40%, transparent); } }
.sec__top { display: flex; align-items: center; gap: 10px; min-height: 26px; font-size: 12.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2); }
.sec__num { font-variant-numeric: tabular-nums; color: var(--ink-3); display: inline-flex; align-items: center; gap: 10px; }
.sec__num::after { content: ""; width: 18px; height: 1px; background: var(--line-strong); }
.sec__opt { text-transform: none; letter-spacing: 0; font-weight: 500; color: var(--ink-3); font-size: 13px; }
.sec__end { margin-left: auto; display: inline-flex; align-items: center; gap: 10px; }
.sec__done { width: 26px; height: 26px; border-radius: 50%; display: grid; place-items: center; background: var(--surface-3); color: transparent; transition: background .25s var(--ease), color .25s; }
.sec__done.is-done { background: var(--brand); color: var(--brand-ink); }
.sec__title { font-family: var(--font-display); font-weight: 400; font-size: clamp(27px, 3vw, 34px); line-height: 1.1; letter-spacing: -.008em; margin: 10px 0 22px; text-wrap: balance; }
.sec__title em { font-style: italic; color: var(--ink-2); }
.counter { text-transform: none; letter-spacing: 0; font-size: 13px; font-weight: 600; color: var(--ink-2); padding: 4px 10px; border-radius: 999px; background: var(--surface-3); }
.counter.is-ok { background: var(--brand-soft); color: var(--brand-soft-ink); }

/* Schaal (stemming / slaap) */
.scale { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 10px; }
.scale__opt {
  display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 16px 4px 14px;
  border-radius: 18px; border: 1.5px solid transparent; background: var(--surface-2); text-align: center; cursor: pointer;
  transition: background .2s var(--ease), border-color .2s; -webkit-tap-highlight-color: transparent;
}
.scale__opt:hover { background: var(--surface-3); }
.scale__opt:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.scale__opt.is-on { background: color-mix(in srgb, var(--tone, var(--brand)) 20%, var(--surface)); border-color: color-mix(in srgb, var(--tone, var(--brand)) 70%, var(--ink) 30%); }
.scale--sleep .scale__opt.is-on { --tone: var(--moon-lit); }
.scale__label { font-size: 13.5px; font-weight: 600; color: var(--ink-2); line-height: 1.2; }
.scale__opt.is-on .scale__label { color: var(--ink); }
.scale__opt .face, .scale__opt .moon { transition: transform .3s var(--ease); }
.scale__opt.is-on .face { transform: scale(1.1); --face-fill: var(--tone); --face-line: var(--face-ink); }
.scale__opt.is-on .moon { transform: scale(1.1); }
.scale__opt:hover .face { --face-line: var(--ink-2); }

.face { display: block; flex: none; overflow: visible; }
.face__bg { fill: var(--face-fill, var(--surface)); stroke: var(--face-line, var(--ink-3)); stroke-width: 2; transition: fill .25s, stroke .25s; }
.face__eye { fill: var(--face-line, var(--ink-3)); }
.face__ft { fill: none; stroke: var(--face-line, var(--ink-3)); stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.face--tone { --face-line: var(--face-ink); }
.moon { display: block; flex: none; }
.moon__dark { fill: var(--moon-dark); }
.moon__lit { fill: var(--moon-lit); }
.moon__ring { fill: none; stroke: var(--moon-ring); stroke-width: 1.2; }

/* EMFI */
.dims { display: grid; gap: 12px; }
.dim { padding: 16px; border-radius: 20px; border: 1.5px solid transparent; background: var(--surface-2); transition: background .25s var(--ease), border-color .25s; }
.dim.is-set { background: color-mix(in srgb, var(--tone-soft) 60%, var(--surface)); border-color: color-mix(in srgb, var(--tone) 40%, transparent); }
.dim__head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.dim__badge { width: 42px; height: 42px; flex: none; display: grid; place-items: center; border-radius: 13px; background: var(--tone-soft); color: var(--tone-ink); transition: background .25s, color .25s; }
.dim.is-set .dim__badge { background: var(--tone); color: var(--tone-on); }
.dim__titles { flex: 1; min-width: 0; }
.dim__name { font-weight: 700; font-size: 16px; line-height: 1.25; }
.dim__hint { font-weight: 500; color: var(--ink-2); }
.dim__q { font-size: 14.5px; color: var(--ink-2); line-height: 1.35; }
.dim__value { flex: none; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px; border-radius: 999px; background: var(--surface); color: var(--tone-ink); font-size: 13px; font-weight: 700; }
.dim__value.is-empty { background: transparent; color: var(--ink-3); font-weight: 600; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chip {
  display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 15px;
  border-radius: 999px; border: 1.5px solid var(--line-strong); background: var(--surface);
  color: var(--ink); font-size: 15px; font-weight: 500;
  transition: border-color .15s, background .15s, box-shadow .15s;
}
.chip:hover { border-color: var(--tone, var(--ink-3)); }
.chip[aria-pressed="true"] { background: var(--tone-soft); border-color: var(--tone); box-shadow: inset 0 0 0 1px var(--tone); font-weight: 650; }
.chip__check { display: none; color: var(--tone-ink); }
.chip[aria-pressed="true"] .chip__check { display: inline-flex; }
.chip--ghost { border-style: dashed; color: var(--ink-2); }
.chip--ghost[aria-pressed="true"] { border-style: solid; background: var(--surface-3); border-color: var(--ink-3); box-shadow: inset 0 0 0 1px var(--ink-3); color: var(--ink); }

/* Activiteiten */
.acts { display: flex; flex-wrap: wrap; gap: 8px; }
.act {
  display: inline-flex; align-items: center; gap: 10px; height: 46px; padding: 0 16px 0 6px;
  border-radius: 999px; border: 1.5px solid var(--line); background: var(--surface-2);
  font-size: 15px; font-weight: 600; cursor: pointer; transition: background .15s, border-color .15s;
}
.act:hover { background: var(--surface-3); border-color: var(--line-strong); }
.act:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.act__icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; background: var(--surface); color: var(--ink-2); transition: background .15s, color .15s; }
.act.is-on { background: var(--brand-soft); border-color: var(--brand); }
.act.is-on .act__icon { background: var(--brand); color: var(--brand-ink); }

/* Gesprek & notitie */
.talk {
  width: 100%; display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-align: left;
  border-radius: 18px; border: 1.5px solid var(--line); background: var(--surface-2); color: var(--ink);
  transition: background .2s, border-color .2s;
}
.talk:hover { border-color: var(--line-strong); }
.talk[aria-checked="true"] { background: var(--brand-soft); border-color: var(--brand); }
.talk__icon { width: 46px; height: 46px; flex: none; display: grid; place-items: center; border-radius: 14px; background: var(--surface); color: var(--brand); }
.talk[aria-checked="true"] .talk__icon { background: var(--brand); color: var(--brand-ink); }
.talk__text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.talk__text strong { font-size: 16px; }
.talk__text span { font-size: 14px; color: var(--ink-2); }
.field { margin-top: 20px; }
.field__label { display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px; font-size: 15px; font-weight: 700; }
.field__label span { font-size: 13px; font-weight: 500; color: var(--ink-3); }
.textarea {
  display: block; width: 100%; min-height: 128px; padding: 14px 16px; resize: vertical;
  border-radius: 16px; border: 1.5px solid var(--line-strong); background: var(--surface);
  font-size: 16px; line-height: 1.55; transition: border-color .15s, box-shadow .15s;
}
.textarea::placeholder { color: var(--ink-3); }
.textarea:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 20%, transparent); }
.field__foot { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 12px; }
.count { font-size: 13px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.privacy { display: inline-flex; flex-wrap: wrap; gap: 2px; padding: 4px; border-radius: 14px; background: var(--surface-3); }
.privacy label { display: inline-flex; align-items: center; gap: 8px; height: 38px; padding: 0 14px; border-radius: 11px; font-size: 14px; font-weight: 600; color: var(--ink-2); cursor: pointer; transition: background .15s, color .15s; }
.privacy label.is-on { background: var(--surface); color: var(--ink); box-shadow: var(--shadow-1); }
.privacy label:has(input:focus-visible) { outline: 3px solid var(--focus); outline-offset: 1px; }
.privacy-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 10px; font-size: 13.5px; color: var(--ink-2); }
.privacy-note .ic { margin-top: 2px; }

/* Samenvatting */
.summary { padding: 22px; }
.summary__head { display: flex; align-items: center; gap: 14px; }
.summary__title { font-family: var(--font-display); font-size: 28px; line-height: 1.05; }
.summary__sub { font-size: 13.5px; color: var(--ink-2); }
.ring-wrap { position: relative; width: 58px; height: 58px; flex: none; }
.ring-wrap > span { position: absolute; inset: 0; display: grid; place-items: center; font-size: 13px; font-weight: 700; font-variant-numeric: tabular-nums; }
.ring { display: block; }
.ring__track { fill: none; stroke: var(--surface-3); stroke-width: 5; }
.ring__bar { fill: none; stroke: var(--brand); stroke-width: 5; stroke-linecap: round; transition: stroke-dashoffset .5s var(--ease); }
.sumlist { margin: 16px 0 18px; }
.sumlist li { display: grid; grid-template-columns: 20px auto minmax(0, 1fr); align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid var(--line); font-size: 14.5px; }
.sumlist__dot { width: 20px; height: 20px; display: grid; place-items: center; border-radius: 50%; border: 1.5px solid var(--line-strong); color: transparent; }
.sumlist__dot.is-opt { border-style: dashed; }
.sumlist__dot.is-done { background: var(--brand); border-color: var(--brand); color: var(--brand-ink); }
.sumlist__dot.is-tone.is-done { background: var(--tone); border-color: var(--tone); color: var(--tone-on); }
.sumlist__k { font-weight: 600; }
.sumlist__v { text-align: right; color: var(--ink-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hint { display: flex; align-items: flex-start; gap: 8px; margin-top: 12px; font-size: 13.5px; color: var(--ink-2); }
.hint .ic { margin-top: 2px; color: var(--warn); }
.hint--ok .ic { color: var(--brand); }
.foot-note { display: flex; align-items: flex-start; gap: 8px; margin-top: 16px; padding-top: 14px; border-top: 1px dashed var(--line-strong); font-size: 12.5px; color: var(--ink-3); line-height: 1.45; }
.foot-note .ic { margin-top: 1px; }

.mbar { display: none; }
.mbar__status { flex: 1; min-width: 0; font-size: 13px; line-height: 1.3; color: var(--ink-2); }
.mbar__status strong { display: block; font-size: 14.5px; color: var(--ink); }

/* ── Bevestiging ───────────────────────────────────────── */
.done { max-width: 640px; text-align: center; padding-top: 56px; }
.burst { display: block; width: 108px; height: 108px; margin: 0 auto 22px; }
.burst__halo { fill: var(--brand-soft); transform-box: fill-box; transform-origin: center; animation: pop .5s var(--ease) both; }
.burst__disc { fill: var(--brand); transform-box: fill-box; transform-origin: center; animation: pop .45s var(--ease) .08s both; }
.burst__check { fill: none; stroke: var(--brand-ink); stroke-width: 6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 48; stroke-dashoffset: 48; animation: draw .45s var(--ease) .38s forwards; }
@keyframes pop { from { transform: scale(.55); opacity: 0; } }
@keyframes draw { to { stroke-dashoffset: 0; } }
.done__title { font-family: var(--font-display); font-weight: 400; font-size: clamp(44px, 6vw, 64px); line-height: 1; letter-spacing: -.015em; }
.done__title em { font-style: italic; color: var(--brand); }
.done__lede { max-width: 44ch; margin: 14px auto 0; font-size: 18px; color: var(--ink-2); }
.care { display: flex; align-items: flex-start; gap: 14px; margin-top: 28px; padding: 16px 18px; border-radius: 18px; background: var(--brand-soft); color: var(--brand-soft-ink); text-align: left; font-size: 15px; }
.care .ic { margin-top: 2px; }
.care--alert { background: var(--warn-soft); color: var(--warn-ink); }
.receipt { margin-top: 14px; padding: 18px 22px 8px; text-align: left; }
.receipt__title { font-size: 12.5px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-2); margin-bottom: 6px; }
.receipt__row { display: grid; grid-template-columns: 28px auto minmax(0, 1fr); align-items: center; gap: 12px; padding: 11px 0; border-top: 1px solid var(--line); font-size: 15px; }
.receipt__icon { display: grid; place-items: center; color: var(--ink-2); }
.receipt__k { color: var(--ink-2); }
.receipt__v { text-align: right; font-weight: 600; overflow-wrap: anywhere; }
.mini-badge { width: 24px; height: 24px; display: grid; place-items: center; border-radius: 8px; background: var(--tone-soft); color: var(--tone-ink); }
.syncline { display: inline-flex; align-items: center; justify-content: center; gap: 8px; flex-wrap: wrap; margin-top: 18px; font-size: 13px; color: var(--ink-3); }
.syncline b { font-weight: 700; color: var(--ink-2); letter-spacing: .01em; }
.syncline.is-synced .ic { color: var(--ok); }
.done__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 26px; }

/* ── Begeleiding ───────────────────────────────────────── */
.staff-head { display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 16px 24px; margin-bottom: 28px; }
.staff-title { font-family: var(--font-display); font-weight: 400; font-size: clamp(46px, 5.6vw, 68px); line-height: 1; letter-spacing: -.015em; margin-top: 12px; }
.staff-sub { margin-top: 8px; color: var(--ink-2); }
.sync { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; padding: 7px 14px 7px 12px; border-radius: 999px; border: 1px solid var(--line); background: color-mix(in srgb, var(--surface) 70%, transparent); font-size: 13px; color: var(--ink-2); }
.sync b { font-weight: 700; color: var(--ink); }
.sync__time { color: var(--ink-3); }
.sync__dot { width: 8px; height: 8px; border-radius: 50%; background: var(--ok); box-shadow: 0 0 0 3px color-mix(in srgb, var(--ok) 22%, transparent); animation: breathe 3.2s ease-in-out infinite; }
@keyframes breathe { 50% { box-shadow: 0 0 0 6px color-mix(in srgb, var(--ok) 6%, transparent); } }

.kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)) minmax(0, 1.55fr); gap: 14px; margin-bottom: 28px; }
.kpi { display: flex; flex-direction: column; gap: 6px; min-height: 148px; padding: 18px 20px; border-radius: 22px; border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow-1); }
.kpi__label { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 600; color: var(--ink-2); }
.kpi__value { font-size: 40px; font-weight: 600; line-height: 1.1; letter-spacing: -.02em; }
.kpi__value small { font-size: 18px; font-weight: 500; color: var(--ink-3); letter-spacing: 0; }
.kpi__sub { margin-top: auto; font-size: 13px; color: var(--ink-2); line-height: 1.4; }
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

.toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
.filters { display: flex; flex-wrap: wrap; gap: 8px; }
.fchip { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 8px 0 15px; border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface); color: var(--ink); font-size: 14px; font-weight: 600; transition: background .15s, color .15s, border-color .15s; }
.fchip:hover { border-color: var(--ink-3); }
.fchip__n { min-width: 26px; height: 26px; padding: 0 7px; display: grid; place-items: center; border-radius: 999px; background: var(--surface-3); font-size: 12.5px; font-variant-numeric: tabular-nums; }
.fchip[aria-pressed="true"] { background: var(--ink); border-color: var(--ink); color: var(--bg); }
.fchip[aria-pressed="true"] .fchip__n { background: color-mix(in srgb, var(--bg) 18%, transparent); }
.search { position: relative; display: flex; align-items: center; color: var(--ink-3); }
.search .ic { position: absolute; left: 14px; pointer-events: none; }
.search input { width: 260px; max-width: 100%; height: 42px; padding: 0 16px 0 40px; border-radius: 999px; border: 1px solid var(--line-strong); background: var(--surface); font-size: 15px; color: var(--ink); }
.search input::placeholder { color: var(--ink-3); }
.search input:focus { outline: none; border-color: var(--brand); box-shadow: 0 0 0 4px color-mix(in srgb, var(--brand) 20%, transparent); }

.pgrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 360px), 1fr)); gap: 14px; }
.pcard {
  position: relative; display: flex; flex-direction: column; gap: 14px; padding: 18px 18px 16px;
  border-radius: 22px; border: 1px solid var(--line); background: var(--surface); box-shadow: var(--shadow-1);
  transition: box-shadow .2s var(--ease), border-color .2s, transform .2s var(--ease);
}
.pcard:hover { box-shadow: var(--shadow-2); border-color: var(--line-strong); transform: translateY(-2px); }
.pcard:has(.pcard__open:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
.pcard--critical::before, .pcard--attention::before { content: ""; position: absolute; left: -1px; top: 20px; bottom: 20px; width: 4px; border-radius: 0 4px 4px 0; background: var(--crit); }
.pcard--attention::before { background: var(--warn); }
.pcard--none { background: color-mix(in srgb, var(--surface) 60%, transparent); box-shadow: none; border-style: dashed; }
.pcard__head { display: flex; align-items: center; gap: 12px; }
.avatar { flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--surface-3); color: var(--ink-2); font-weight: 700; letter-spacing: .02em; }
.pcard__id { flex: 1; min-width: 0; }
.pcard__name { font-size: 17px; font-weight: 700; line-height: 1.25; }
.pcard__open { padding: 0; border: 0; background: none; font-weight: inherit; text-align: left; }
.pcard__open:focus-visible { outline: none; }
.pcard__open::after { content: ""; position: absolute; inset: 0; border-radius: inherit; }
.pcard__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 4px 8px; font-size: 13px; color: var(--ink-2); }
.tag { display: inline-flex; align-items: center; height: 21px; padding: 0 8px; border-radius: 999px; background: var(--surface-3); color: var(--ink-2); font-size: 11.5px; font-weight: 700; letter-spacing: .01em; }
.tag--new { background: var(--brand); color: var(--brand-ink); }
.pill { flex: none; display: inline-flex; align-items: center; gap: 6px; height: 28px; padding: 0 11px 0 9px; border-radius: 999px; font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.pill--critical { background: var(--crit-soft); color: var(--crit-ink); }
.pill--attention { background: var(--warn-soft); color: var(--warn-ink); }
.pill--stable { background: var(--brand-soft); color: var(--brand-soft-ink); }
.pill--none { background: var(--surface-3); color: var(--ink-2); }
.pcard__mood { display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; background: var(--surface-2); }
.pcard__moodtext { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.25; }
.pcard__moodlabel { font-weight: 700; }
.pcard__moodsub { font-size: 12.5px; color: var(--ink-2); }
.pcard__trend { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-size: 11px; color: var(--ink-3); }
.spark { display: block; overflow: visible; }
.spark__line { fill: none; stroke: var(--ink-3); stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.spark__dot { fill: var(--brand); stroke: var(--surface-2); stroke-width: 2; }
.etags { display: flex; flex-wrap: wrap; gap: 6px; }
.etag { display: inline-flex; align-items: center; gap: 6px; height: 30px; padding: 0 11px 0 9px; border-radius: 9px; background: var(--tone-soft); color: var(--ink); font-size: 13px; font-weight: 600; }
.etag .ic { color: var(--tone-ink); }
.quote { padding-left: 14px; border-left: 2px solid var(--line-strong); font-family: var(--font-display); font-style: italic; font-size: 18.5px; line-height: 1.35; color: var(--ink); }
.quote--lg { font-size: 22px; }
.pcard__facts { display: flex; flex-wrap: wrap; gap: 6px 16px; font-size: 13px; color: var(--ink-2); }
.pcard__facts span { display: inline-flex; align-items: center; gap: 6px; }
.pcard__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 8px; padding-top: 12px; border-top: 1px solid var(--line); }
.signals { display: flex; flex-wrap: wrap; gap: 6px; }
.sig { display: inline-flex; align-items: center; gap: 6px; height: 26px; padding: 0 10px 0 8px; border-radius: 8px; font-size: 12.5px; font-weight: 600; }
.sig--critical { background: var(--crit-soft); color: var(--crit-ink); }
.sig--attention { background: var(--warn-soft); color: var(--warn-ink); }
.sig--talk { background: var(--brand-soft); color: var(--brand-soft-ink); }
.sig--more { background: var(--surface-3); color: var(--ink-2); padding: 0 9px; }
.followed { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; font-weight: 600; color: var(--brand-soft-ink); }
.pcard__empty { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; font-size: 14px; color: var(--ink-2); }
.pcard__action { position: relative; z-index: 1; }
.empty { display: grid; justify-items: center; gap: 4px; padding: 48px 24px; text-align: center; color: var(--ink-2); }
.empty .ic { color: var(--ink-3); margin-bottom: 6px; }
.empty strong { color: var(--ink); }

/* Detailpaneel */
.drawer {
  position: fixed; inset: 0 0 0 auto; width: min(540px, 100vw); max-width: 100vw; height: 100%; max-height: 100%;
  margin: 0; padding: 0; border: 0; border-radius: 28px 0 0 28px; overflow: hidden;
  background: var(--surface); color: var(--ink); box-shadow: -30px 0 80px -30px rgba(0, 0, 0, .35);
}
.drawer[open] { display: flex; animation: drawer-in .32s var(--ease); }
.drawer::backdrop { background: rgba(14, 20, 18, .38); -webkit-backdrop-filter: blur(3px); backdrop-filter: blur(3px); }
@keyframes drawer-in { from { transform: translateX(32px); opacity: 0; } }
.dw { display: flex; flex-direction: column; width: 100%; height: 100%; }
.dw__head { display: flex; align-items: center; gap: 14px; padding: 22px 24px 18px; border-bottom: 1px solid var(--line); }
.dw__id { flex: 1; min-width: 0; }
.dw__name { font-family: var(--font-display); font-weight: 400; font-size: 32px; line-height: 1.05; }
.dw__meta { font-size: 14px; color: var(--ink-2); }
.dw__body { flex: 1; overflow-y: auto; overscroll-behavior: contain; padding: 20px 24px 28px; display: flex; flex-direction: column; gap: 22px; }
.dw__status { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 14px; }
.dw__time { display: inline-flex; align-items: center; gap: 6px; font-size: 13.5px; color: var(--ink-2); }
.dw__mood { display: flex; align-items: center; gap: 16px; padding: 16px 18px; border-radius: 20px; background: var(--surface-2); }
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
.dw__foot { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px; padding: 14px 24px calc(14px + env(safe-area-inset-bottom)); border-top: 1px solid var(--line); background: var(--surface); }
.dw__foot .syncline { margin: 0; justify-content: flex-start; }
.callout { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 16px; background: var(--brand-soft); color: var(--brand-soft-ink); font-size: 14px; }
.callout strong { display: block; font-size: 15px; }
.callout .ic { margin-top: 2px; }
.callout--muted { background: var(--surface-2); color: var(--ink-2); }
.callout--muted strong { color: var(--ink); }

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
.tip { position: absolute; transform: translate(-50%, calc(-100% - 12px)); display: flex; flex-direction: column; padding: 7px 11px; border-radius: 10px; background: var(--ink); color: var(--bg); font-size: 12.5px; line-height: 1.3; white-space: nowrap; pointer-events: none; box-shadow: var(--shadow-2); }
.tip__day { opacity: .75; }
.tip__val { font-weight: 700; }
.tableview summary { cursor: pointer; font-size: 13px; font-weight: 600; color: var(--ink-2); width: max-content; }
.tableview table { width: 100%; margin-top: 8px; border-collapse: collapse; font-size: 13.5px; }
.tableview th, .tableview td { padding: 7px 4px; text-align: left; border-bottom: 1px solid var(--line); }
.tableview th { font-size: 12px; color: var(--ink-2); font-weight: 700; }
.tableview td:last-child { font-variant-numeric: tabular-nums; }

/* ── Eenvoudige modus ──────────────────────────────────── */
.zl[data-mode="simple"] {
  --font-ui: var(--font-simple);
  --font-display: var(--font-simple);
  --bg: #FBFAF6; --surface: #FFFFFF; --surface-2: #F3F1EA; --surface-3: #E7E5DD;
  --line: #C9C7BE; --tile-line: #85857D;
  --ink: #111412; --ink-2: #2F3532; --ink-3: #4F5652;
  --brand: #1F5446; --brand-hover: #17443A; --brand-ink: #FFFFFF; --brand-soft: #DCEDE4; --brand-soft-ink: #163F34;
  font-size: 20px; line-height: 1.5;
}
@media (prefers-color-scheme: dark) {
  .zl[data-mode="simple"] {
    --bg: #0E1110; --surface: #171B19; --surface-2: #1D2220; --surface-3: #262C29;
    --line: #3F4743; --tile-line: #7E8682;
    --ink: #F5F7F5; --ink-2: #D2D8D4; --ink-3: #B2BAB5;
    --brand: #86CFB3; --brand-hover: #9CDBC2; --brand-ink: #0B1D16; --brand-soft: #1C3A31; --brand-soft-ink: #CDEFE1;
  }
}
.zl[data-mode="simple"]::before { display: none; }
.zl[data-mode="simple"] *, .zl[data-mode="simple"] *::before, .zl[data-mode="simple"] *::after { animation: none !important; transition: none !important; }
.zl[data-mode="simple"] .topbar { background: var(--surface); -webkit-backdrop-filter: none; backdrop-filter: none; border-bottom: 2px solid var(--line); }
.zl[data-mode="simple"] .brand__name { font-size: 21px; font-weight: 700; }
.zl[data-mode="simple"] .mswitch { height: 54px; padding: 0 12px 0 16px; border: 2.5px solid var(--ink); font-size: 18px; font-weight: 700; }
.zl[data-mode="simple"] .track { width: 48px; height: 28px; }
.zl[data-mode="simple"] .track::after { width: 20px; height: 20px; }
.zl[data-mode="simple"] [aria-checked="true"] > .track::after { transform: translateX(20px); }
.zl[data-mode="simple"] .seg__btn { font-size: 15px; }
.zl[data-mode="simple"] :focus-visible { outline-width: 4px; outline-offset: 3px; }

.s-page { max-width: 840px; margin: 0 auto; padding: 28px 20px 170px; }
.s-top { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px 20px; margin-bottom: 20px; }
.s-count { font-size: 19px; font-weight: 700; }
.s-dots { display: flex; align-items: center; gap: 8px; }
.s-dot { width: 16px; height: 16px; border-radius: 50%; border: 2.5px solid var(--ink); }
.s-dot.is-done { background: var(--ink); }
.s-dot.is-now { width: 34px; border-radius: 8px; border-color: var(--brand); background: var(--brand); }
.s-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: 16px; }
.s-head--center { justify-content: center; text-align: center; }
.s-title { font-size: clamp(32px, 6.5vw, 44px); font-weight: 700; line-height: 1.15; }
.s-title:focus { outline: none; }
.s-sub { margin-top: 8px; font-size: 22px; color: var(--ink-2); }
.s-speak {
  flex: none; display: inline-flex; align-items: center; gap: 10px; min-height: 58px; padding: 0 20px;
  border-radius: 16px; border: 2.5px solid var(--ink); background: var(--surface); color: var(--ink);
  font-size: 19px; font-weight: 700;
}
.s-speak[aria-pressed="true"] { background: var(--ink); color: var(--surface); }
.s-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-top: 28px; }
.s-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
@media (min-width: 760px) {
  .s-grid--emfi { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .s-grid--3 .s-tile { min-height: 210px; }
}
.s-tile {
  position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px;
  min-height: 156px; padding: 20px 12px; border-radius: 22px; border: 3px solid var(--tile-line); background: var(--surface);
  color: var(--ink); text-align: center; font-size: 22px; font-weight: 700; line-height: 1.2; cursor: pointer;
}
.s-tile:hover { border-color: var(--ink); }
.s-tile:has(input:focus-visible) { outline: 4px solid var(--focus); outline-offset: 3px; }
.s-tile.is-on { border-color: var(--brand); background: var(--brand-soft); box-shadow: inset 0 0 0 3px var(--brand); }
.s-tile--wide { grid-column: 1 / -1; flex-direction: row; min-height: 88px; border-style: dashed; }
.s-tile--wide.is-on { border-style: solid; }
.s-tile__check { position: absolute; top: 10px; right: 10px; width: 40px; height: 40px; display: none; place-items: center; border-radius: 50%; background: var(--brand); color: var(--brand-ink); }
.s-tile.is-on .s-tile__check { display: grid; }
.s-tile--wide .s-tile__check { top: 50%; transform: translateY(-50%); right: 16px; }
.s-picto { font-family: var(--font-emoji); font-size: 58px; line-height: 1; }
.s-picto--sm { font-size: 38px; }
.s-tile--wide .s-picto { font-size: 40px; }
.s-nudge { display: flex; align-items: center; gap: 12px; margin-top: 20px; padding: 16px 20px; border-radius: 18px; border: 2.5px solid var(--warn-ink); background: var(--warn-soft); color: var(--warn-ink); font-weight: 700; }
.s-nav { position: fixed; left: 0; right: 0; bottom: 0; z-index: 20; padding: 14px 20px calc(14px + env(safe-area-inset-bottom)); background: var(--surface); border-top: 2px solid var(--line); }
.s-nav__inner { max-width: 840px; margin: 0 auto; display: flex; justify-content: space-between; gap: 14px; }
.s-btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 12px; min-height: 70px; padding: 0 28px;
  border-radius: 18px; border: 3px solid var(--ink); background: var(--surface); color: var(--ink);
  font-size: 23px; font-weight: 700;
}
.s-btn--go { flex: 1; max-width: 440px; margin-left: auto; border-color: var(--brand); background: var(--brand); color: var(--brand-ink); }
.s-btn--go[aria-disabled="true"] { border-color: var(--tile-line); background: var(--surface-2); color: var(--ink-2); }
.s-list { display: grid; gap: 10px; margin-top: 28px; }
.s-list__item { display: flex; align-items: center; gap: 16px; padding: 14px 18px; border-radius: 18px; border: 2px solid var(--line); background: var(--surface); font-size: 22px; font-weight: 700; }
.s-list__num { width: 42px; height: 42px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--ink); color: var(--surface); font-size: 19px; }
.s-list__picto { font-family: var(--font-emoji); font-size: 32px; line-height: 1; }
.s-review { display: grid; gap: 10px; margin-top: 26px; }
.s-review__row { display: flex; align-items: center; gap: 16px; padding: 14px 16px; border-radius: 18px; border: 2px solid var(--line); background: var(--surface); }
.s-review__visual { width: 56px; flex: none; display: grid; place-items: center; }
.s-review__text { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.s-review__q { font-size: 17px; color: var(--ink-2); }
.s-review__a { font-size: 23px; font-weight: 700; line-height: 1.2; }
.s-edit { flex: none; display: inline-flex; align-items: center; gap: 8px; min-height: 54px; padding: 0 16px; border-radius: 14px; border: 2.5px solid var(--ink); background: var(--surface); color: var(--ink); font-size: 18px; font-weight: 700; }
.s-done { text-align: center; padding-top: 44px; }
.s-done__mark { width: 128px; height: 128px; display: grid; place-items: center; margin: 0 auto 26px; border-radius: 50%; background: var(--brand); color: var(--brand-ink); }
.s-msgs { display: grid; gap: 12px; margin: 26px auto 0; max-width: 620px; }
.s-msg { padding: 18px 22px; border-radius: 18px; border: 2px solid var(--line); background: var(--surface); font-size: 22px; font-weight: 600; text-align: left; }
.s-done__speak { margin-top: 22px; display: flex; justify-content: center; }
.zl[data-mode="simple"] .syncline { font-size: 15px; margin-top: 22px; }
.s-nav__inner:has(> .s-btn:only-child) .s-btn--go { margin-left: auto; margin-right: auto; }

/* ── Responsief ────────────────────────────────────────── */
@media (max-width: 1079px) {
  .layout { grid-template-columns: 1fr; }
  .aside { display: none; }
  .mbar {
    display: flex; align-items: center; gap: 12px; position: fixed; z-index: 25;
    left: 12px; right: 12px; bottom: calc(12px + env(safe-area-inset-bottom));
    max-width: 720px; margin: 0 auto; padding: 10px 10px 10px 18px; border-radius: 20px;
    border: 1px solid var(--line); box-shadow: var(--shadow-2);
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    -webkit-backdrop-filter: blur(16px) saturate(1.4); backdrop-filter: blur(16px) saturate(1.4);
  }
  .page--form { padding-bottom: 128px; }
  .kpis { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .kpi--wide { grid-column: 1 / -1; min-height: 0; }
}
@media (max-width: 860px) {
  .hero { grid-template-columns: 1fr; }
  .simple-cta { max-width: none; }
}
@media (max-width: 720px) {
  .topbar__inner { flex-wrap: wrap; padding: 10px 16px; gap: 10px; }
  .seg { order: 3; width: 100%; }
  .seg__btn { flex: 1; justify-content: center; }
  .hide-sm { display: none; }
  .page { padding: 28px 16px 88px; }
  .kpis { grid-template-columns: 1fr 1fr; gap: 10px; }
  .kpi { min-height: 0; padding: 16px; }
  .kpi__value { font-size: 34px; }
  .kpis > .kpi:nth-child(3) { grid-column: 1 / -1; }
  .search, .search input { width: 100%; }
  .toolbar { flex-direction: column; align-items: stretch; }
  .drawer { border-radius: 0; width: 100vw; }
  .dw__head, .dw__body, .dw__foot { padding-left: 18px; padding-right: 18px; }
}
@media (max-width: 560px) {
  .sec { padding: 20px 16px 22px; border-radius: 22px; }
  .scale { gap: 6px; }
  .scale__opt { padding: 12px 2px 10px; gap: 8px; border-radius: 14px; }
  .scale__label { font-size: 11.5px; }
  .scale--mood .face { width: 40px; height: 40px; }
  .scale--sleep .moon { width: 32px; height: 32px; }
  .dim { padding: 14px; }
  .dim__value { display: none; }
  .privacy { display: grid; grid-template-columns: 1fr 1fr; width: 100%; }
  .privacy label { justify-content: center; height: auto; min-height: 44px; padding: 8px 10px; line-height: 1.2; text-align: center; }
  .chip { height: 38px; padding: 0 13px; font-size: 14.5px; }
  .act { height: 44px; font-size: 14.5px; }
  .s-page { padding: 22px 16px 160px; }
  .s-grid { gap: 10px; }
  .s-grid--3 { gap: 8px; }
  .s-grid--3 .s-tile { min-height: 150px; padding: 16px 6px; font-size: 19px; }
  .s-grid--3 .face { width: 68px; height: 68px; }
  .s-tile { min-height: 136px; font-size: 20px; }
  .s-picto { font-size: 48px; }
  .s-btn { padding: 0 18px; font-size: 21px; }
  .s-review__row { flex-wrap: wrap; }
  .zl[data-mode="simple"] .brand__ward, .zl[data-mode="simple"] .mswitch .ic { display: none; }
  .zl[data-mode="simple"] .brand__name { font-size: 19px; }
  .zl[data-mode="simple"] .mswitch { height: 50px; padding: 0 10px 0 14px; font-size: 17px; }
  .s-edit { margin-left: auto; }
  .dw__emfi, .dw__facts { grid-template-columns: 1fr; }
}

@media (prefers-reduced-motion: reduce) {
  .zl *, .zl *::before, .zl *::after { animation-duration: .001ms !important; animation-iteration-count: 1 !important; transition-duration: .001ms !important; scroll-behavior: auto !important; }
  .burst__check { stroke-dashoffset: 0; }
}
@media (forced-colors: active) {
  .chip[aria-pressed="true"], .scale__opt.is-on, .s-tile.is-on, .act.is-on, .fchip[aria-pressed="true"] { outline: 3px solid Highlight; }
}
`;
