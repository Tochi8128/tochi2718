// /js/works-list.js
// inside.html で Works / Pickup を描画し、クリックで親へ OPEN_WORK を送る。
// 一覧は content/works/index.json を読む（GitHub Actions で自動生成される前提）。

const INDEX_URL = "/tochi2718/content/works/index.json";
const FETCH_OPTIONS = { cache: "no-store" };

const pickupGrid = document.getElementById("pickupGrid");
const worksGrid = document.getElementById("worksGrid");

init().catch((err) => console.error("[works-list] init error:", err));

async function init() {
  const metas = await loadFromIndex();

  const featured = metas
    .filter((m) => truthy(m.featured))
    .sort((a, b) => num(a.featuredOrder, 9999) - num(b.featuredOrder, 9999));

  const normal = metas
    .filter((m) => !truthy(m.featured))
    .sort((a, b) => {
      const byYear = num(b.year, -1) - num(a.year, -1);
      if (byYear !== 0) return byYear;
      return str(a.title).localeCompare(str(b.title), "ja");
    });

  if (pickupGrid) pickupGrid.innerHTML = featured.map(cardHTML).join("");
  if (worksGrid) worksGrid.innerHTML = normal.map(cardHTML).join("");

  document.addEventListener("click", onCardClick);
  document.addEventListener("keydown", onCardKeydown);
}

async function loadFromIndex() {
  const res = await fetch(INDEX_URL, FETCH_OPTIONS);
  if (!res.ok) throw new Error(`[works-list] index.json not found: ${INDEX_URL}`);
  const json = await res.json();
  return (json.works ?? []).filter(Boolean);
}

function onCardClick(e) {
  const btn = e.target.closest?.("[data-work-id]");
  if (!btn) return;
  const id = btn.getAttribute("data-work-id");
  if (!id) return;
  window.parent?.postMessage({ type: "OPEN_WORK", id }, "*");
}

function onCardKeydown(e) {
  const btn = e.target.closest?.("[data-work-id]");
  if (!btn) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const id = btn.getAttribute("data-work-id");
    if (!id) return;
    window.parent?.postMessage({ type: "OPEN_WORK", id }, "*");
  }
}

function cardHTML(m) {
  const thumb = m.thumbnail ? escapeAttr(m.thumbnail) : "";
  const title = escapeHTML(m.title ?? "");
  const cat = escapeHTML(m.category ?? "");

  const thumbHTML = thumb
    ? `<img class="workThumb" src="${thumb}" alt="${title}">`
    : `<div class="workThumb is-empty" aria-hidden="true"></div>`;

  return `
    <button class="workCard" type="button" data-work-id="${escapeAttr(m.id)}">
      ${thumbHTML}
      <div class="workBody">
        <div class="workCat">${cat}</div>
        <h3 class="workTitle">${title}</h3>
      </div>
    </button>
  `.trim();
}

function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
function escapeAttr(s) { return escapeHTML(s); }
function truthy(v) { return v === true || v === "true" || v === 1 || v === "1"; }
function num(v, fallback) { const n = Number(v); return Number.isFinite(n) ? n : fallback; }
function str(v) { return v == null ? "" : String(v); }