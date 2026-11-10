// Assemble src/ en un seul index.html + icônes + manifeste
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const ROOT = __dirname, SRC = path.join(ROOT, "src"), DIST = process.env.OUT ? path.resolve(process.env.OUT) : path.join(ROOT, "dist");
fs.mkdirSync(DIST, { recursive: true });

const css = fs.readFileSync(path.join(SRC, "styles.css"), "utf8") + "\n/* ==== look.css : refonte v3 ==== */\n" + fs.readFileSync(path.join(SRC, "look.css"), "utf8") + "\n/* ==== stories.css : v4 ==== */\n" + fs.readFileSync(path.join(SRC, "stories.css"), "utf8") + "\n/* ==== tabs.css ==== */\n" + fs.readFileSync(path.join(SRC, "tabs.css"), "utf8") + "\n/* ==== autres.css ==== */\n" + fs.readFileSync(path.join(SRC, "autres.css"), "utf8") + "\n/* ==== grand.css ==== */\n" + fs.readFileSync(path.join(SRC, "grand.css"), "utf8") + "\n/* ==== anim.css ==== */\n" + fs.readFileSync(path.join(SRC, "anim.css"), "utf8");
const js = ["data.js", "core.js", "engine.js", "hand.js", "sosies.js", "net.js", "partage.js", "defi.js", "parcours.js", "grand.js", "terrain.js", "cloud.js", "semaine.js", "idees.js", "ui.js", "anim.js"].map(f => `/* ---- ${f} ---- */\n` + fs.readFileSync(path.join(SRC, f), "utf8")).join("\n");
const html = fs.readFileSync(path.join(SRC, "shell.html"), "utf8")
  .replace("/*__CSS__*/", () => css)
  .replace("/*__JS__*/", () => js);
fs.writeFileSync(path.join(DIST, "index.html"), html);
if (!process.env.OUT) fs.writeFileSync(path.join(DIST, "app.js"), js); // pour vérification de syntaxe
// Polices et Leaflet hébergés avec l'appli (aucun appel à Google Fonts ni à un CDN)
const copyDir = (from, to) => { fs.mkdirSync(to, { recursive: true }); for (const f of fs.readdirSync(from)) { const a = path.join(from, f), b = path.join(to, f); if (fs.statSync(a).isDirectory()) copyDir(a, b); else fs.copyFileSync(a, b); } };
copyDir(path.join(ROOT, "assets"), DIST);

const bird = "M3 15.5c1.8.2 3.3-.3 4.6-1.4 1.5-1.3 2.6-3.7 5.6-4.4 2.4-.6 4.3.2 5.4 1.4l2.9-.3-2.3 1.9c0 3.7-3 6.8-7.3 6.8-2.7 0-4.9-1-6.5-2.6L3 15.5zM16.5 11.3a.85.85 0 1 0 0 1.7.85.85 0 0 0 0-1.7z";
/* Icône : l'oiseau à l'encre sur l'orange de l'appli */
const icon = rx => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
<defs><clipPath id="c"><rect width="512" height="512" rx="${rx}"/></clipPath></defs>
<g clip-path="url(#c)"><rect width="512" height="512" fill="#FFCE00"/>
<path transform="translate(40 2) scale(18)" fill="#0B0B0B" fill-rule="evenodd" d="${bird}"/></g></svg>`;
fs.writeFileSync(path.join(DIST, "icon.svg"), icon(112));

const manifest = {
  name: "Plumage", short_name: "Plumage", description: "Quiz d'oiseaux : photos, chants, latin et familles, en direct d'iNaturalist.",
  start_url: "./", scope: "./", display: "standalone", orientation: "portrait", background_color: "#0B0B0B", theme_color: "#0B0B0B", lang: "fr",
  icons: [
    { src: "icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
  ]
};
fs.writeFileSync(path.join(DIST, "manifest.webmanifest"), JSON.stringify(manifest, null, 2));

/* Service worker : coquille de l'appli en cache (s'ouvre sans réseau), photos du pack terrain hors ligne */
const walk = (d, base = "") => fs.readdirSync(d).flatMap(f => { const a = path.join(d, f), r = base + f; return fs.statSync(a).isDirectory() ? walk(a, r + "/") : [r]; });
const shell = ["./", "index.html", "manifest.webmanifest", "icon.svg", "icon-180.png", "icon-192.png", "icon-512.png", ...walk(path.join(ROOT, "assets")).filter(f => !/\.txt$|\.md$/i.test(f))];
const ver = require("crypto").createHash("sha1").update(html + JSON.stringify(shell)).digest("hex").slice(0, 10);
fs.writeFileSync(path.join(DIST, "sw.js"), fs.readFileSync(path.join(SRC, "sw.js"), "utf8").replace("__VERSION__", ver).replace("/*__SHELL__*/[]", JSON.stringify(shell)));

(async () => {
  const full = Buffer.from(icon(0));
  await sharp(full).resize(180, 180).png().toFile(path.join(DIST, "icon-180.png"));
  await sharp(full).resize(192, 192).png().toFile(path.join(DIST, "icon-192.png"));
  await sharp(full).resize(512, 512).png().toFile(path.join(DIST, "icon-512.png"));
  console.log("ok", (fs.statSync(path.join(DIST, "index.html")).size / 1024).toFixed(1) + " Ko");
})();
