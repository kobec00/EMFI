import { useState } from "react";

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,500;1,9..144,300&family=DM+Sans:wght@300;400;500&display=swap');
`;

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --sand: #F5F0E8;
    --warm: #EDE5D8;
    --clay: #C9A882;
    --sage: #7A9E7E;
    --dusk: #5C7A8C;
    --night: #2D3A45;
    --blush: #E8B4A0;
    --lilac: #B8A9C9;
    --text: #2D3A45;
    --muted: #7A8A96;
  }

  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--sand);
    color: var(--text);
    min-height: 100vh;
  }

  .app {
    max-width: 420px;
    margin: 0 auto;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--sand);
    position: relative;
    overflow: hidden;
  }

  .bg-blob {
    position: fixed;
    border-radius: 50%;
    filter: blur(60px);
    opacity: 0.25;
    pointer-events: none;
    z-index: 0;
  }

  .header {
    padding: 48px 28px 24px;
    position: relative;
    z-index: 1;
  }

  .greeting {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 300;
    color: var(--night);
    line-height: 1.3;
  }

  .greeting em {
    font-style: italic;
    color: var(--dusk);
  }

  .date-chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--warm);
    border: 1px solid var(--clay);
    border-radius: 20px;
    padding: 5px 14px;
    font-size: 13px;
    color: var(--muted);
    margin-top: 8px;
    letter-spacing: 0.02em;
  }

  .content {
    flex: 1;
    padding: 8px 28px 32px;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* EMFI Section */
  .section-label {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .emfi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .emfi-card {
    background: white;
    border-radius: 18px;
    padding: 18px 16px;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s ease;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }

  .emfi-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.09); }
  .emfi-card.active { border-color: currentColor; background: currentColor; }
  .emfi-card.active .emfi-emoji { transform: scale(1.15); }
  .emfi-card.active .emfi-label { color: white; }

  .emfi-card.e-color { color: #E8B4A0; }
  .emfi-card.m-color { color: #B8A9C9; }
  .emfi-card.f-color { color: #7A9E7E; }
  .emfi-card.i-color { color: #5C7A8C; }

  .emfi-card.active.e-color { background: #E8B4A0; }
  .emfi-card.active.m-color { background: #B8A9C9; }
  .emfi-card.active.f-color { background: #7A9E7E; }
  .emfi-card.active.i-color { background: #5C7A8C; }

  .emfi-emoji { font-size: 32px; transition: transform 0.2s; }
  .emfi-title { font-size: 13px; font-weight: 500; color: var(--night); }
  .emfi-label { font-size: 11px; color: var(--muted); text-align: center; transition: color 0.2s; }

  /* Gevoel slider */
  .feeling-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }

  .feeling-title {
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 300;
    margin-bottom: 16px;
    color: var(--night);
  }

  .mood-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    gap: 6px;
  }

  .mood-btn {
    flex: 1;
    aspect-ratio: 1;
    border: none;
    border-radius: 12px;
    font-size: 22px;
    cursor: pointer;
    background: var(--warm);
    transition: all 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mood-btn:hover { transform: scale(1.08); }
  .mood-btn.selected { background: var(--clay); transform: scale(1.12); box-shadow: 0 4px 12px rgba(201,168,130,0.4); }

  .mood-label-row {
    display: flex;
    justify-content: space-between;
    font-size: 10px;
    color: var(--muted);
    padding: 0 2px;
  }

  /* Gedachten */
  .thought-card {
    background: white;
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }

  .thought-card textarea {
    width: 100%;
    border: none;
    background: var(--warm);
    border-radius: 12px;
    padding: 14px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: var(--text);
    resize: none;
    height: 100px;
    outline: none;
    line-height: 1.6;
    transition: background 0.2s;
  }

  .thought-card textarea:focus { background: #E8E2D6; }
  .thought-card textarea::placeholder { color: var(--muted); }

  .private-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 10px;
    font-size: 12px;
    color: var(--muted);
    cursor: pointer;
  }

  .toggle-dot {
    width: 32px;
    height: 18px;
    background: var(--warm);
    border-radius: 9px;
    border: 1.5px solid var(--clay);
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }

  .toggle-dot::after {
    content: '';
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--clay);
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.2s;
  }

  .toggle-dot.on { background: var(--sage); border-color: var(--sage); }
  .toggle-dot.on::after { transform: translateX(14px); background: white; }

  /* Slaap / activiteit */
  .mini-cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  .mini-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  }

  .mini-card-title {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .star-row { display: flex; gap: 4px; }
  .star { font-size: 20px; cursor: pointer; transition: transform 0.1s; filter: grayscale(1); opacity: 0.4; }
  .star:hover { transform: scale(1.2); }
  .star.lit { filter: none; opacity: 1; }

  .activity-chips { display: flex; flex-wrap: wrap; gap: 5px; }
  .chip {
    padding: 4px 10px;
    border-radius: 10px;
    font-size: 11px;
    background: var(--warm);
    color: var(--muted);
    border: 1px solid transparent;
    cursor: pointer;
    transition: all 0.15s;
  }
  .chip.active { background: var(--dusk); color: white; border-color: var(--dusk); }

  /* Verzend knop */
  .submit-btn {
    background: var(--night);
    color: var(--sand);
    border: none;
    border-radius: 16px;
    padding: 18px;
    width: 100%;
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 300;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .submit-btn:hover { background: var(--dusk); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,58,69,0.25); }
  .submit-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  /* Success screen */
  .success-screen {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 28px;
    text-align: center;
    gap: 16px;
    animation: fadeIn 0.4s ease;
  }

  .success-icon {
    width: 80px;
    height: 80px;
    background: var(--sage);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 36px;
    box-shadow: 0 8px 24px rgba(122,158,126,0.35);
  }

  .success-title {
    font-family: 'Fraunces', serif;
    font-size: 26px;
    font-weight: 300;
    color: var(--night);
  }

  .success-sub {
    font-size: 14px;
    color: var(--muted);
    line-height: 1.6;
    max-width: 280px;
  }

  .staff-preview {
    background: white;
    border-radius: 16px;
    padding: 16px 20px;
    text-align: left;
    width: 100%;
    margin-top: 8px;
  }

  .staff-preview-title {
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--muted);
    margin-bottom: 10px;
  }

  .preview-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 0;
    border-bottom: 1px solid var(--warm);
    font-size: 13px;
    color: var(--text);
  }

  .preview-row:last-child { border-bottom: none; }

  .reset-btn {
    margin-top: 12px;
    background: transparent;
    border: 1.5px solid var(--clay);
    color: var(--clay);
    border-radius: 12px;
    padding: 12px 28px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-btn:hover { background: var(--clay); color: white; }

  /* Staff view */
  .tab-bar {
    display: flex;
    gap: 6px;
    background: var(--warm);
    border-radius: 14px;
    padding: 4px;
    margin-bottom: 16px;
  }

  .tab {
    flex: 1;
    padding: 9px;
    border: none;
    background: transparent;
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    color: var(--muted);
    cursor: pointer;
    transition: all 0.15s;
    font-weight: 400;
  }

  .tab.active { background: white; color: var(--night); box-shadow: 0 2px 8px rgba(0,0,0,0.08); font-weight: 500; }

  .patient-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    margin-bottom: 10px;
  }

  .patient-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .patient-name { font-family: 'Fraunces', serif; font-size: 16px; font-weight: 500; }
  .patient-room { font-size: 11px; color: var(--muted); }
  .status-dot { width: 8px; height: 8px; border-radius: 50%; }
  .status-dot.green { background: var(--sage); }
  .status-dot.yellow { background: #E8C96A; }
  .status-dot.red { background: #E8826A; }

  .patient-emfi { display: flex; gap: 6px; flex-wrap: wrap; }
  .emfi-badge {
    padding: 3px 10px;
    border-radius: 8px;
    font-size: 11px;
    font-weight: 500;
  }

  .flag { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; color: #E8826A; margin-top: 6px; }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .animate-in { animation: fadeIn 0.3s ease forwards; }
`;

const MOODS = ["😔","😟","😐","🙂","😊"];
const MOOD_LABELS = ["Heel slecht", "", "Neutraal", "", "Heel goed"];

const EMFI_ITEMS = [
  { key: "E", emoji: "💬", title: "Emoties", label: "Hoe voel je je?", color: "e-color" },
  { key: "M", emoji: "🧠", title: "Mentaal", label: "Gedachten & focus", color: "m-color" },
  { key: "F", emoji: "🌿", title: "Fysiek", label: "Lichaam & energie", color: "f-color" },
  { key: "I", emoji: "🤝", title: "Interactie", label: "Contact & omgeving", color: "i-color" },
];

const EMFI_OPTIONS = {
  E: ["Rustig","Angstig","Verdrietig","Boos","Verward","Hopevol"],
  M: ["Helder","Vermoeid","Piekeren","Geconcentreerd","Somber","Leeg"],
  F: ["Energiek","Zwaar","Pijn","Gespannen","Ontspannen","Moe"],
  I: ["Verbonden","Teruggetrokken","Ondersteund","Eenzaam","Sociaal","Prikkelbaar"],
};

const ACTIVITIES = ["Wandelen","Groepsactiviteit","Gesprek","Lezen","Rusten","Creatief","Eten","Muziek"];

const now = new Date();
const dateStr = now.toLocaleDateString('nl-BE', { weekday: 'long', day: 'numeric', month: 'long' });
const hour = now.getHours();
const greeting = hour < 12 ? "Goedemorgen" : hour < 18 ? "Goedemiddag" : "Goedenavond";

// Mock staff data
const PATIENTS = [
  { id: 1, name: "Thomas V.", room: "Kamer 12", status: "yellow", mood: 2, emfi: { E: "Angstig", M: "Piekeren", F: "Gespannen", I: "Teruggetrokken" }, thought: "Sliep slecht, maak me zorgen over morgen.", activities: ["Rusten"], sleep: 2, flag: true, flagMsg: "Laag humeur, 3 dagen op rij" },
  { id: 2, name: "Sara M.", room: "Kamer 7", status: "green", mood: 4, emfi: { E: "Hopevol", M: "Helder", F: "Energiek", I: "Verbonden" }, thought: null, activities: ["Wandelen","Groepsactiviteit"], sleep: 4, flag: false },
  { id: 3, name: "Kevin D.", room: "Kamer 3", status: "red", mood: 1, emfi: { E: "Verdrietig", M: "Leeg", F: "Zwaar", I: "Eenzaam" }, thought: "Wil niet praten vandaag.", activities: ["Rusten"], sleep: 1, flag: true, flagMsg: "Vraagt aandacht — weinig sociale interactie" },
];

const EMFI_COLORS = { E: "#E8B4A0", M: "#B8A9C9", F: "#7A9E7E", I: "#5C7A8C" };

export default function EMFIApp() {
  const [view, setView] = useState("patient"); // "patient" | "staff"
  const [submitted, setSubmitted] = useState(false);

  // Patient form state
  const [selectedEMFI, setSelectedEMFI] = useState({});
  const [mood, setMood] = useState(null);
  const [thought, setThought] = useState("");
  const [privateThought, setPrivateThought] = useState(false);
  const [sleep, setSleep] = useState(0);
  const [activities, setActivities] = useState([]);
  const [activeEMFIPanel, setActiveEMFIPanel] = useState(null);

  const toggleActivity = (a) => setActivities(p => p.includes(a) ? p.filter(x => x !== a) : [...p, a]);
  const toggleEMFIOption = (key, val) => setSelectedEMFI(p => ({ ...p, [key]: p[key] === val ? undefined : val }));
  const canSubmit = mood !== null && Object.keys(selectedEMFI).length >= 2;

  const handleSubmit = () => setSubmitted(true);

  const reset = () => {
    setSubmitted(false);
    setSelectedEMFI({}); setMood(null); setThought(""); setSleep(0); setActivities([]); setActiveEMFIPanel(null);
  };

  return (
    <>
      <style>{FONTS + STYLES}</style>
      <div className="app">
        <div className="bg-blob" style={{ width: 300, height: 300, background: "#C9A882", top: -80, right: -80 }} />
        <div className="bg-blob" style={{ width: 250, height: 250, background: "#7A9E7E", bottom: 60, left: -60 }} />

        {/* Top switcher — prototype only */}
        <div style={{ padding: "16px 28px 0", zIndex: 2, position: "relative" }}>
          <div className="tab-bar">
            <button className={`tab${view === "patient" ? " active" : ""}`} onClick={() => { setView("patient"); setSubmitted(false); }}>🙋 Patiënt</button>
            <button className={`tab${view === "staff" ? " active" : ""}`} onClick={() => setView("staff")}>🩺 Begeleiding</button>
          </div>
        </div>

        {/* ── PATIENT VIEW ── */}
        {view === "patient" && !submitted && (
          <>
            <div className="header">
              <p className="greeting">{greeting},<br /><em>hoe gaat het vandaag?</em></p>
              <div className="date-chip">📅 {dateStr}</div>
            </div>

            <div className="content">
              {/* Stemming */}
              <div className="feeling-card animate-in">
                <p className="feeling-title">Hoe voel jij je nu?</p>
                <div className="mood-row">
                  {MOODS.map((m, i) => (
                    <button key={i} className={`mood-btn${mood === i ? " selected" : ""}`} onClick={() => setMood(i)}>{m}</button>
                  ))}
                </div>
                <div className="mood-label-row">
                  {MOOD_LABELS.map((l, i) => <span key={i}>{l}</span>)}
                </div>
              </div>

              {/* EMFI */}
              <div>
                <p className="section-label">EMFI — selecteer minstens 2</p>
                <div className="emfi-grid">
                  {EMFI_ITEMS.map(item => (
                    <div key={item.key}>
                      <div
                        className={`emfi-card ${item.color}${activeEMFIPanel === item.key ? " active" : ""}`}
                        onClick={() => setActiveEMFIPanel(p => p === item.key ? null : item.key)}
                      >
                        <div className="emfi-emoji">{item.emoji}</div>
                        <div className="emfi-title">{item.title}</div>
                        <div className="emfi-label">{selectedEMFI[item.key] || item.label}</div>
                      </div>
                      {activeEMFIPanel === item.key && (
                        <div style={{ marginTop: 6, background: "white", borderRadius: 12, padding: "10px 8px", display: "flex", flexWrap: "wrap", gap: 5, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", animation: "fadeIn 0.2s ease" }}>
                          {EMFI_OPTIONS[item.key].map(opt => (
                            <span
                              key={opt}
                              className={`chip${selectedEMFI[item.key] === opt ? " active" : ""}`}
                              onClick={() => toggleEMFIOption(item.key, opt)}
                            >{opt}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Slaap & Activiteiten */}
              <div className="mini-cards">
                <div className="mini-card">
                  <p className="mini-card-title">😴 Slaap</p>
                  <div className="star-row">
                    {[1,2,3,4,5].map(n => (
                      <span key={n} className={`star${sleep >= n ? " lit" : ""}`} onClick={() => setSleep(n)}>⭐</span>
                    ))}
                  </div>
                </div>
                <div className="mini-card">
                  <p className="mini-card-title">🏃 Activiteit</p>
                  <div className="activity-chips">
                    {ACTIVITIES.slice(0,4).map(a => (
                      <span key={a} className={`chip${activities.includes(a) ? " active" : ""}`} onClick={() => toggleActivity(a)}>{a}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gedachten */}
              <div className="thought-card">
                <p className="feeling-title">Persoonlijke gedachte <span style={{ fontSize: 13, color: "var(--muted)", fontFamily: "DM Sans, sans-serif", fontWeight: 300 }}>— optioneel</span></p>
                <textarea
                  placeholder="Schrijf hier iets wat je bezig houdt..."
                  value={thought}
                  onChange={e => setThought(e.target.value)}
                />
                <label className="private-toggle" onClick={() => setPrivateThought(p => !p)}>
                  <div className={`toggle-dot${privateThought ? " on" : ""}`} />
                  {privateThought ? "Alleen voor mij (niet zichtbaar in dossier)" : "Zichtbaar voor begeleiding"}
                </label>
              </div>

              <button className="submit-btn" onClick={handleSubmit} disabled={!canSubmit}>
                Verstuur naar dossier <span>→</span>
              </button>
              {!canSubmit && <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", marginTop: -8 }}>Vul minstens je stemming en 2 EMFI-gebieden in</p>}
            </div>
          </>
        )}

        {/* ── SUCCESS ── */}
        {view === "patient" && submitted && (
          <div className="success-screen">
            <div className="success-icon">✓</div>
            <p className="success-title">Bedankt!</p>
            <p className="success-sub">Je check-in is opgeslagen en doorgestuurd naar je begeleider. Goed bezig dat je dit invult. 💚</p>

            <div className="staff-preview">
              <p className="staff-preview-title">📋 Doorgestuurd naar dossier</p>
              <div className="preview-row"><span>😊</span> Stemming: {MOODS[mood]} ({["Heel slecht","Slecht","Neutraal","Goed","Heel goed"][mood]})</div>
              {Object.entries(selectedEMFI).map(([k, v]) => v && (
                <div key={k} className="preview-row"><span>{EMFI_ITEMS.find(e=>e.key===k)?.emoji}</span> {EMFI_ITEMS.find(e=>e.key===k)?.title}: {v}</div>
              ))}
              {sleep > 0 && <div className="preview-row"><span>😴</span> Slaapkwaliteit: {sleep}/5</div>}
              {activities.length > 0 && <div className="preview-row"><span>🏃</span> Activiteiten: {activities.join(", ")}</div>}
              {thought && !privateThought && <div className="preview-row"><span>💭</span> Gedachte: "{thought.slice(0,40)}{thought.length > 40 ? "…" : ""}"</div>}
              {thought && privateThought && <div className="preview-row" style={{ color: "var(--muted)" }}><span>🔒</span> Persoonlijke gedachte (privé)</div>}
            </div>

            <button className="reset-btn" onClick={reset}>Nieuwe check-in invullen</button>
          </div>
        )}

        {/* ── STAFF VIEW ── */}
        {view === "staff" && (
          <>
            <div className="header">
              <p className="greeting">Overzicht<br /><em>patiëntendossiers</em></p>
              <div className="date-chip">📅 {dateStr} — avondcheck-in</div>
            </div>

            <div className="content">
              <p className="section-label">Patiënten — De Zeilen 2</p>

              {PATIENTS.map(p => (
                <div key={p.id} className="patient-card animate-in">
                  <div className="patient-header">
                    <div>
                      <p className="patient-name">{p.name}</p>
                      <p className="patient-room">{p.room}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 22 }}>{MOODS[p.mood]}</span>
                      <div className={`status-dot ${p.status}`} />
                    </div>
                  </div>

                  <div className="patient-emfi">
                    {Object.entries(p.emfi).map(([k, v]) => (
                      <span key={k} className="emfi-badge" style={{ background: EMFI_COLORS[k] + "30", color: EMFI_COLORS[k] }}>
                        {EMFI_ITEMS.find(e=>e.key===k)?.title}: {v}
                      </span>
                    ))}
                  </div>

                  {p.thought && (
                    <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 8, fontStyle: "italic", paddingLeft: 4 }}>💭 "{p.thought}"</p>
                  )}

                  <div style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 12, color: "var(--muted)" }}>
                    <span>😴 {'⭐'.repeat(p.sleep)}{'☆'.repeat(5-p.sleep)}</span>
                    <span>·</span>
                    <span>🏃 {p.activities.join(", ")}</span>
                  </div>

                  {p.flag && (
                    <div className="flag">⚠️ {p.flagMsg}</div>
                  )}
                </div>
              ))}

              <div style={{ background: "white", borderRadius: 16, padding: 16, boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <p className="section-label">📊 Trend vandaag</p>
                <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 8 }}>
                  {[["😔","Slecht","1"],["😐","Neutraal","0"],["😊","Goed","2"]].map(([emoji, label, count]) => (
                    <div key={label} style={{ textAlign: "center" }}>
                      <div style={{ fontSize: 28 }}>{emoji}</div>
                      <div style={{ fontSize: 18, fontFamily: "Fraunces, serif", fontWeight: 500 }}>{count}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
