# EMFI check-in

Prototype van een dagelijkse check-in voor patiënten van een psychiatrische afdeling, met een werkplek voor de begeleiding. De check-in volgt vier gebieden: **E**moties, **M**entaal, **F**ysiek en **I**nteractie.

> Alle namen van patiënten, medewerkers, het ziekenhuis (PC Zilverlinde) en de afdeling (De Meander) zijn **fictief of pseudoniemen**. HErOS+ is een bestaand patiëntendossier van Obasi. Het wordt hier enkel als voorbeeld gebruikt en de koppeling is gesimuleerd. Alles wat je invult, blijft in de browser van het toestel.

## Patiënt-app (telefoon en tablet)

Ontworpen als echte app: vaste bovenbalk, tabbalk onderaan, panelen die van onder openschuiven, en de terugknop van de telefoon werkt zoals je verwacht.

Op een computer draait de app in een gesimuleerd toestel dat meeschaalt met je venster. Rechtsboven wissel je tussen **iPhone** (met dynamic island) en **iPad** (liggend, over de volle breedte, met de app in twee kolommen). Wat je aan het invullen bent, blijft staan als je wisselt, en de browser onthoudt je keuze. Daarnaast staat de knop **Disclaimer**. Op een telefoon of tablet zelf is de app gewoon schermvullend.

- **Vandaag**: begroeting, check-in starten met één tik op een gezichtje, de dagplanning van de afdeling en je week in één oogopslag.
- **Check-in in vijf stappen**: stemming, EMFI (minstens 2 van de 4, met "Weet ik niet"), slaap en activiteiten, een gespreksvraag en notitie (delen of privé), en tot slot nakijken. Stop je halverwege, dan ga je later verder waar je was.
- **Verloop**: je stemming over 7 of 14 dagen, wat het vaakst terugkwam per EMFI-gebied, en een voorzichtig patroon ("Op dagen met wandelen ging het vaak beter").
- **Rust**: een ademoefening van een minuut, wat jou helpt (uit je signaleringsplan) en een knop om meteen een begeleider te vragen.

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

- **Overzicht**: kerncijfers van de dienst, filters en zoeken (toets `/`). Patiënten staan gesorteerd op prioriteit, met de stemming van de laatste 7 dagen per persoon.
- **Detailpaneel naast de lijst**: weekgrafiek, EMFI, slaap, notitie, signalen en rapportering die je opslaat in het dossier. Met ↑ en ↓ ga je door de lijst.
- **Acties**: "Markeer als opgevolgd", een herinnering sturen, en reageren op "vraagt nu een begeleider". De patiënt ziet die reactie meteen in de app.
- **Overdracht**: automatisch samengesteld per prioriteit, om te kopiëren of af te drukken.

Op een tablet of telefoon opent het detailpaneel als schuifpaneel.

## Toegankelijkheid

- Kleurcontrast haalt WCAG AA in de lichte en de donkere modus. De eenvoudige modus heeft nog meer contrast.
- Een kleur staat nooit alleen: er hoort altijd een icoon en tekst bij. Het EMFI-palet is getest op kleurenblindheid.
- Alles werkt met het toetsenbord, met een duidelijke focusrand. Grafieken hebben ook een tabelweergave.
- De app volgt de instellingen van het toestel voor minder beweging en donkere modus. Inzoomen blijft mogelijk.
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
