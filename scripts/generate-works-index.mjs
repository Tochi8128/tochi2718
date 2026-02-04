// scripts/generate-works-index.mjs
import fs from "node:fs";
import path from "node:path";

const SITE_BASE = "/TochiNoDesign"; // ★project pages の base
const WORKS_DIR = path.resolve("content/works");
const OUT_FILE = path.resolve("content/works/index.json");

function parseFrontmatter(raw) {
  if (!raw.startsWith("---")) return { data: {} };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { data: {} };
  const fm = raw.slice(3, end).trim();

  const data = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();

    // strip quotes
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) val = val.slice(1, -1);

    // coerce
    if (val === "true") val = true;
    else if (val === "false") val = false;
    else if (val !== "" && Number.isFinite(Number(val))) val = Number(val);

    data[key] = val;
  }
  return { data };
}

function withBase(p) {
  if (!p) return "";
  if (/^https?:\/\//.test(p)) return p;
  if (p.startsWith(SITE_BASE + "/")) return p; // already ok
  if (p.startsWith("/")) return SITE_BASE + p; // ★ project pages 補正
  return p;
}

const files = fs
  .readdirSync(WORKS_DIR)
  .filter((f) => f.endsWith(".md"))
  .sort();

const works = [];
for (const file of files) {
  const id = file.replace(/\.md$/, "");
  const raw = fs.readFileSync(path.join(WORKS_DIR, file), "utf8");
  const { data } = parseFrontmatter(raw);

  works.push({
    id,
    title: data.title ?? id,
    category: data.category ?? "",
    year: data.year ?? null,
    featured: data.featured ?? false,
    featuredOrder: data.featuredOrder ?? 9999,
    thumbnail: withBase(data.thumbnail ?? ""),
    hero: withBase(data.hero ?? ""),
    url: data.url ?? "",
  });
}

const out = {
  generatedAt: new Date().toISOString(),
  works,
};

fs.writeFileSync(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log(`[generate] wrote ${OUT_FILE} (${works.length} works)`);
