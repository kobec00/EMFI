// Bouwt index.html uit index.jsx: één zelfstandig bestand met React erin,
// zodat de app ook zonder bouwstap of server werkt (bv. via GitHub Pages).
//
//   npm install
//   npm run build
import { build } from "esbuild";
import { writeFile } from "node:fs/promises";

const FONTS =
  "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:wght@400;600;700&family=Figtree:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap";

const FAVICON =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="12" fill="#24594B"/>' +
      '<path fill="#E0ECE5" d="M20 7c6.8 3.7 11.3 9.3 10.4 15.8-.6 4.7-4.8 7.1-8.4 5.3-.9-.5-1.6-1.1-2-1.8-.4.7-1.1 1.3-2 1.8-3.6 1.8-7.8-.6-8.4-5.3C8.7 16.3 13.2 10.7 20 7Z"/>' +
      '<path fill="none" stroke="#24594B" stroke-width="1.7" stroke-linecap="round" d="M20 11v22M20 17.5l-4.2-2.8M20 17.5l4.2-2.8M20 22.5l-5.6-3.2M20 22.5l5.6-3.2"/></svg>'
  );

const result = await build({
  stdin: {
    contents: `
      import { createRoot } from "react-dom/client";
      import App from "./index.jsx";
      createRoot(document.getElementById("root")).render(<App />);
    `,
    loader: "jsx",
    resolveDir: ".",
    sourcefile: "entry.jsx",
  },
  bundle: true,
  write: false,
  minify: true,
  format: "iife",
  target: ["es2020"],
  jsx: "automatic",
  legalComments: "eof",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "warning",
});

// "</script" mag niet letterlijk in een inline script staan.
const js = result.outputFiles[0].text.replace(/<\/script/gi, "<\\/script");

const html = `<!doctype html>
<html lang="nl-BE">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>EMFI check-in · PC Zilverlinde</title>
<meta name="description" content="Dagelijkse EMFI check-in voor patiënten en begeleiding van afdeling De Meander (PC Zilverlinde, fictief).">
<meta name="theme-color" content="#F3F2EC" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0F1412" media="(prefers-color-scheme: dark)">
<link rel="icon" href="${FAVICON}">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Zilverlinde">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="${FONTS}">
<style>body{margin:0;background:#F3F2EC}@media (prefers-color-scheme:dark){body{background:#0F1412}}</style>
<!-- Gegenereerd uit index.jsx met "npm run build". Pas index.jsx aan, niet dit bestand. -->
</head>
<body>
<div id="root"></div>
<noscript><p style="font:16px/1.5 system-ui,sans-serif;padding:24px">Deze app heeft JavaScript nodig.</p></noscript>
<script>${js}</script>
<script>
  // Installeerbaar als app (PWA) zodra de pagina via http(s) geserveerd wordt, bv. GitHub Pages.
  if (/^https?:$/.test(location.protocol)) {
    var manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "manifest.webmanifest";
    document.head.appendChild(manifest);
    if ("serviceWorker" in navigator) {
      addEventListener("load", function () { navigator.serviceWorker.register("sw.js").catch(function () {}); });
    }
  }
</script>
</body>
</html>
`;

await writeFile("index.html", html);
console.log(`index.html geschreven (${(Buffer.byteLength(html) / 1024).toFixed(0)} kB)`);
