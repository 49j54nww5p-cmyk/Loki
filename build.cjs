// Assemble src/ en un seul index.html + icônes + manifeste
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = __dirname, SRC = path.join(ROOT, "src"), DIST = process.env.OUT ? path.resolve(process.env.OUT) : path.join(ROOT, "dist");
fs.mkdirSync(DIST, { recursive: true });

const css = fs.readFileSync(path.join(SRC, "styles.css"), "utf8");
const js = ["data.js", "core.js", "engine.js", "ui.js"].map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
const html = fs.readFileSync(path.join(SRC, "shell.html"), "utf8")
  .replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => js);
fs.writeFileSync(path.join(DIST, "index.html"), html);
if (!process.env.OUT) fs.writeFileSync(path.join(DIST, "app.js"), js); // pour vérification de syntaxe
// Polices et Leaflet hébergés avec l'appli (aucun appel à Google Fonts ni à un CDN)
const copyDir = (from, to) => { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) { const a = path.join(from, f), b = path.join(to, f); if (fs.statSync(a).isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b); } };
copyDir(path.join(ROOT, "assets"), DIST);

const bird = "M3 15.5c1.8.2 3.3-.3 4.6-1.4 1.5-1.3 2.6-3.7 5.6-4.4 2.4-.6 4.3.2 5.4 1.4l2.9-.3-2.3 1.9c0 3.7-3 6.8-7.3 6.8-2.7 0-4.9-1-6.5-2.6L3 15.5zM16.5 11.3a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7z";
const icon = rx => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1FD1F2"/><stop offset=".55" stop-color="#3D7BFF"/><stop offset="1" stop-color="#14B8A6"/></linearGradient>
<radialGradient id="b" cx=".88" cy=".92" r=".62"><stop offset="0" stop-color="#FF8B3D" stop-opacity=".95"/><stop offset="1" stop-color="#FF8B3D" stop-opacity="0"/></radialGradient>
<clipPath id="c"><rect width="512" height="512" rx="${rx}"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="512" height="512" fill="url(#a)"/><rect width="512" height="512" fill="url(#b)"/>
<path transform="translate(48 11) scale(17)" fill="#061018" fill-rule="evenodd" d="${bird}"/></g></svg>`;
fs.writeFileSync(path.join(DIST, "icon.svg"), icon(112));

const manifest = {
  name: "Plumage", short_name: "Plumage", description: "Quiz d'oiseaux : photos, chants, latin et familles, en direct d'iNaturalist.",
  start_url: "./", scope: "./", display: "standalone", orientation: "portrait", background_color: "#060A13", theme_color: "#060A13", lang: "fr",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
};
fs.writeFileSync(path.join(DIST, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));

(async () => {
  const full = Buffer.from(icon(0));
  await sharp(full).resize(180, 180).png().toFile(path.join(DIST, "icon-180.png"));
  await sharp(full).resize(192, 192).png().toFile(path.join(DIST, "icon-192.png"));
  await sharp(full).resize(512, 512).png().toFile(path.join(DIST, "icon-512.png"));
  console.log("ok", (fs.statSync(path.join(DIST, "index.html")).size / 1024).toFixed(1) + " Ko");
})();
