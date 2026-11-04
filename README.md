# EMFI check-in

Prototype van een dagelijkse check-in voor patiënten van een psychiatrische afdeling, met een overzicht voor de begeleiding. De check-in volgt vier gebieden: **E**moties, **M**entaal, **F**ysiek en **I**nteractie.

> PC Zilverlinde, afdeling De Meander, alle patiënten en het dossiersysteem HErOS+ zijn **fictief**. Er worden geen gegevens opgeslagen of verstuurd.

## Wat zit erin

| Weergave | Voor wie | Wat |
|---|---|---|
| **Patiënt** | patiënten | Stemming, de vier EMFI-gebieden (met "Weet ik niet"), slaap, activiteiten, een gespreksvraag en een notitie die je kan delen of privé kan houden. |
| **Eenvoudige modus** | mensen met ASS of een verstandelijke beperking | Eén vraag per scherm, grote knoppen met pictogrammen, korte en letterlijke zinnen, minder keuzes, vaste plek voor *Terug* en *Volgende*, een overzicht vooraf en achteraf, voorlezen en geen animaties. |
| **Begeleiding** | het team | Afdelingsoverzicht met signalen, stemmingsverdeling, gespreksvragen, wie nog niet heeft ingecheckt, en per patiënt een detailpaneel met het verloop over 7 dagen. |

De eenvoudige modus zet je aan met de knop rechtsboven. De browser onthoudt die keuze.

## Toegankelijkheid

- Kleurcontrast haalt WCAG AA in de lichte en de donkere modus. De eenvoudige modus heeft nog meer contrast.
- Een kleur staat nooit alleen: er hoort altijd een icoon en tekst bij. Het EMFI-palet is getest op kleurenblindheid.
- Alles werkt met het toetsenbord, met een duidelijke focusrand. Formulieronderdelen gebruiken echte radio-, checkbox- en switch-elementen.
- Respecteert `prefers-reduced-motion`, `prefers-color-scheme` en `forced-colors`. Inzoomen blijft mogelijk.
- Voorlezen gebruikt de spraak die op het toestel zelf zit (Web Speech API, `nl-BE`).

## Bestanden

- `index.jsx` is de bron: één React-component zonder andere afhankelijkheden. Je kan hem ook los gebruiken, bijvoorbeeld als Claude-artifact.
- `index.html` wordt **gegenereerd**. Het is een zelfstandig bestand waar React al in zit, dus het werkt zonder server (ook via GitHub Pages).
- `build.mjs` is het buildscript (esbuild).

## Aanpassen en bouwen

Pas `index.jsx` aan en bouw daarna `index.html` opnieuw:

```bash
npm install
```

```bash
npm run build
```
