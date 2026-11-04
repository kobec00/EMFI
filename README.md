# EMFI check-in

Prototype van een dagelijkse check-in voor patiënten van een psychiatrische afdeling, met een werkplek voor de begeleiding. De check-in volgt vier gebieden: **E**moties, **M**entaal, **F**ysiek en **I**nteractie.

> Alle namen van patiënten, medewerkers, het ziekenhuis (PC Zilverlinde) en de afdeling (De Meander) zijn **fictief of pseudoniemen**. HErOS+ is een bestaand patiëntendossier van [Obasi](https://www.obasi.be). Het wordt hier enkel als voorbeeld gebruikt en de koppeling is gesimuleerd. Alles wat je invult, blijft in de browser van het toestel.

## Patiënt-app (telefoon en tablet)

Ontworpen als echte app: vaste bovenbalk, tabbalk onderaan, panelen die van onder openschuiven, en de terugknop van de telefoon werkt zoals je verwacht.

Op een computer draait de app in een gesimuleerd toestel dat meeschaalt met je venster. Rechtsboven wissel je tussen **iPhone** (met dynamic island) en **iPad** (liggend, over de volle breedte, met de app in twee kolommen). Wat je aan het invullen bent, blijft staan als je wisselt, en de browser onthoudt je keuze. Daarnaast staat, los van die schakelaar, de knop **Bekijk begeleidersportaal**. De disclaimer open je met het kleine **i**-knopje rechtsonder. Op een telefoon of tablet zelf is de app gewoon schermvullend.

- **Vandaag**: begroeting, check-in starten met één tik op een gezichtje, een korte samenvatting van Linde AI, de dagplanning van de afdeling en je week in één oogopslag.
- **Check-in in vijf stappen**: stemming, EMFI (minstens 2 van de 4, met "Weet ik niet"), slaap en activiteiten, een gespreksvraag en notitie (delen of privé), en tot slot nakijken. Stop je halverwege, dan ga je later verder waar je was.
- **Verloop**: je stemming over 7 of 14 dagen, een samenvatting van Linde AI, wat het vaakst terugkwam per EMFI-gebied, en een voorzichtig patroon ("Op dagen met wandelen ging het vaak beter").
- **Rust**: een ademoefening van een minuut, wat jou helpt (uit je signaleringsplan) en een knop om meteen een begeleider te vragen.

### Linde AI, de chatbot (demo)

Op **Vandaag** en **Verloop** staat een kader van Linde AI met een korte samenvatting van je dag of je week.

- Op **Vandaag** komt Linde AI binnen met een korte intro, één keer per bezoek en zodra de kaart in beeld is. Het paarse bolletje verschijnt groot in het midden, landt in de kop, en dan typt Linde AI de samenvatting. Wie op het toestel minder beweging heeft ingesteld, ziet meteen de volledige kaart.
- Op **Verloop** is de kaart ingeklapt. Tik op de kop om de samenvatting te openen.

Via **Praat met Linde AI** open je een chat voor kleine vragen: wat er nog op de planning staat, hoe je week was, tips om te ontspannen, bezoekuren of maaltijden.

- "AI" staat bewust in de naam, en de chat zegt meteen dat het een chatbot is en geen mens. Zo denkt niemand dat hij met een medewerker praat.
- Linde AI is er **niet voor noodgevallen**. Dat staat bovenaan in elke chat, met een knop **Vraag een begeleider** die altijd zichtbaar blijft.
- Schrijft iemand iets wat op een crisis lijkt, dan antwoordt Linde AI niet inhoudelijk. De chatbot verwijst meteen naar een begeleider (één tik) en naar de Zelfmoordlijn (1813).
- Linde AI kan je ook naar de ademoefening of je check-in brengen.

Linde AI is **niet gekoppeld aan een taalmodel**. Alle antwoorden komen uit vaste regels en de gegevens in de app. Het is enkel een demonstratie.

### Eenvoudige modus

Voor mensen met ASS of een verstandelijke beperking. Je zet hem aan met de knop rechtsboven of via het menu.

- Vooraf zie je hoeveel vragen er komen.
- Eén vraag per scherm, met grote tegels en pictogrammen.
- Korte, letterlijke zinnen en minder keuzes (bijvoorbeeld 3 gezichtjes in plaats van 5).
- *Terug* en *Volgende* staan altijd op dezelfde plek.
- Achteraf zie je een overzicht waarin je nog alles kan veranderen.
- Je kan alles laten voorlezen, en er zijn geen animaties.
- Een grote knop "Ik wil nu met iemand praten".

## Begeleiding (desktop)

Een werkplek met zijbalk, gemaakt voor een groot scherm.

- **Overzicht**: een strook met kerncijfers (ingecheckt, direct opvolgen, opvolgen, gespreksvragen, gemiddelde stemming tegenover gisteren), filters en zoeken (toets `/`).
- **Patiëntenlijst per prioriteit**: gegroepeerd in *Direct opvolgen*, *Opvolgen*, *Stabiel* en *Nog geen check-in*. Per persoon zie je de stemming, de laatste 7 dagen en het belangrijkste aandachtspunt.
- **Detailpaneel naast de lijst** met drie tabbladen: *Vandaag* (EMFI, slaap, activiteiten, notitie, signalen), *Verloop* (weekgrafiek) en *Rapportering* (opslaan in het dossier). Met ↑ en ↓ ga je door de lijst.
- **Acties**: "Markeer als opgevolgd", een herinnering sturen, en reageren op "vraagt nu een begeleider". De patiënt ziet die reactie meteen in de app.
- **Overdracht**: automatisch samengesteld per prioriteit, om te kopiëren of af te drukken.

### AI-functies (demo)

- **Linde AI-briefing** bovenaan het overzicht: een samenvatting van je dienst, met per patiënt die aandacht vraagt een concrete suggestie. Klik op een naam om die patiënt te openen.
- **Samenvatting per patiënt** in het detailpaneel.
- **Concept-rapportering**: Linde AI schrijft een eerste versie van de rapportering. Je leest die na en past ze aan voor je ze opslaat. In het dossier staat dan "met Linde AI".
- **Samenvatting bij de overdracht**.

Ook hier zit geen taalmodel achter. Alle suggesties komen uit vaste regels, en de begeleider beslist altijd zelf.

Op een tablet of telefoon opent het detailpaneel als schuifpaneel.

## Toegankelijkheid

- Kleurcontrast haalt WCAG AA. De eenvoudige modus heeft nog meer contrast. De app blijft altijd licht, ook als het toestel op donkere modus staat.
- Een kleur staat nooit alleen: er hoort altijd een icoon en tekst bij. Het EMFI-palet is getest op kleurenblindheid.
- Alles werkt met het toetsenbord, met een duidelijke focusrand. Grafieken hebben ook een tabelweergave.
- De app volgt de instelling van het toestel voor minder beweging. Inzoomen blijft mogelijk.
- Voorlezen gebruikt de spraak die op het toestel zelf zit (`nl-BE`).

## Installeren als app

Zodra de site via `https` online staat, bijvoorbeeld op GitHub Pages, kan je hem op een telefoon of tablet toevoegen aan het beginscherm. Hij opent dan schermvullend en werkt ook zonder internet.

## Bestanden

- `index.jsx` is de bron: één React-component zonder andere afhankelijkheden. Je kan hem ook los gebruiken, bijvoorbeeld als Claude-artifact.
- `index.html` wordt **gegenereerd**. Het is een zelfstandig bestand waar React al in zit.
- `build.mjs` is het buildscript (esbuild).
- `manifest.webmanifest`, `sw.js` en `icons/` zorgen ervoor dat je de site als app kan installeren en offline kan gebruiken.

## Aanpassen en bouwen

Pas `index.jsx` aan en bouw daarna `index.html` opnieuw:

```bash
npm install
```

```bash
npm run build
```
