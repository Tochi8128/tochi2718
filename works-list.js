// /js/works-list.js
// inside.html で「作品一覧（Works / Pickup）」を描画して、クリック時に親（index.html）へ
// { type: "OPEN_WORK", id } を postMessage する “完全版”。
//
// 前提（inside.html側）:
//   <div id="pickupGrid"></div>
//   <div id="worksGrid"></div>
//   <script type="module" src="/js/works-list.js"></script>
//
// 前提（コンテンツ）:
//   /content/works/{id}.md に frontmatter + markdown 本文
//   frontmatter 例:
//   ---
//   id: dualalpha
//   title: DUALPHA
//   category: Typography
//   thumbnail: /uploads/works/dualalpha/thumb.jpg
//   hero: /uploads/works/dualalpha/hero.jpg
//   featured: true
//   featuredOrder: 1
//   year: 2026
//   ---
//   ## 概要
//   ...

// ===== 作品ID一覧（ここに追加していく）=====
const WORK_IDS = [
  "001_vocaloid-kohakulabo2025-HP",
  "002_vocaloid-kohaku2026-HP",
  "003_dualpha",
  "test"
];

// ===== 設定 =====
const WORK_MD_BASE = "/TochiNoDesign/content/works/";
const FETCH_OPTIONS = { cache: "no-store" }; // 更新反映を優先

// ===== DOM =====
const pickupGrid = document.getElementById("pickupGrid");
const worksGrid = document.getElementById("worksGrid");

if (!pickupGrid || !worksGrid) {
  console.warn("[works-list] pickupGrid / worksGrid が見つかりません。inside.html を確認してください。");
}

// ===== 初期化 =====
init().catch((err) => console.error("[works-list] init error:", err));

async function init() {
  // 作品メタ情報を読み込む
  const metas = await loadAllWorkMetas(WORK_IDS);

  // featured と通常に分ける
  const featured = metas
    .filter((m) => truthy(m.featured))
    .sort((a, b) => num(a.featuredOrder, 9999) - num(b.featuredOrder, 9999));

  const normal = metas
    .filter((m) => !truthy(m.featured))
    .sort((a, b) => {
      // year 降順 → title 昇順
      const byYear = num(b.year, -1) - num(a.year, -1);
      if (byYear !== 0) return byYear;
      return str(a.title).localeCompare(str(b.title), "ja");
    });

  // 描画
  if (pickupGrid) pickupGrid.innerHTML = featured.map(cardHTML).join("");
  if (worksGrid) worksGrid.innerHTML = normal.map(cardHTML).join("");

  // クリック（イベント委譲）
  document.addEventListener("click", onCardClick);
  document.addEventListener("keydown", onCardKeydown);
}

function onCardClick(e) {
  const btn = e.target.closest?.("[data-work-id]");
  if (!btn) return;

  const id = btn.getAttribute("data-work-id");
  if (!id) return;

  openWorkInParent(id);
}

function onCardKeydown(e) {
  // キーボード操作（Enter / Spaceで開く）
  const btn = e.target.closest?.("[data-work-id]");
  if (!btn) return;

  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    const id = btn.getAttribute("data-work-id");
    if (!id) return;
    openWorkInParent(id);
  }
}

function openWorkInParent(id) {
  // iframe内 → 親（index.html）へ通知
  window.parent?.postMessage({ type: "OPEN_WORK", id }, "*");
}

// ===== Markdown frontmatter の読み込み =====

async function loadAllWorkMetas(ids) {
  const results = await Promise.all(ids.map((id) => loadWorkMeta(id)));
  // 失敗したものは除外
  return results.filter(Boolean);
}

async function loadWorkMeta(id) {
  try {
    const url = `${WORK_MD_BASE}${encodeURIComponent(id)}.md`;
    const res = await fetch(url, FETCH_OPTIONS);
    if (!res.ok) {
      console.warn(`[works-list] md not found: ${url}`);
      return null;
    }
    const raw = await res.text();
    const { data } = parseFrontmatter(raw);

    // 例: GitHub Pages の project site が /PORTFOLIO/ でも /portfolio/ でも吸収
    const path = location.pathname;
    const m = path.match(/^\/([^\/]+)\//); // 先頭のディレクトリ名
    const SITE_BASE = (m && m[1].toLowerCase() === "portfolio") ? `/${m[1]}` : "";


    function withBase(path) {
      if (!path) return "";
      // すでに http(s) ならそのまま
      if (/^https?:\/\//.test(path)) return path;
      // / で始まる絶対パスにだけ base を付ける
      if (path.startsWith("/")) return SITE_BASE + path;
      // 相対パスはそのまま
      return path;
    }

    // id はファイル名を優先（frontmatterに無くても動く）
    return {
      id,
      title: data.title ?? id,
      category: data.category ?? "",
      thumbnail: withBase(data.thumbnail ?? data.hero ?? ""),
      hero: withBase(data.hero ?? ""),
      featured: data.featured ?? false,
      featuredOrder: data.featuredOrder ?? 9999,
      year: data.year ?? null,
      url: data.url ?? "",
    };

  } catch (err) {
    console.warn(`[works-list] failed to load meta: ${id}`, err);
    return null;
  }
}

function parseFrontmatter(text) {
  // 超軽量 frontmatter パーサ（YAMLの一部だけ対応）
  // ---\nkey: value\n---\nbody
  if (!text.startsWith("---")) return { data: {}, body: text };

  const end = text.indexOf("\n---", 3);
  if (end === -1) return { data: {}, body: text };

  const fm = text.slice(3, end).trim();
  const body = text.slice(end + 4).replace(/^\n+/, "");

  const data = {};
  for (const line of fm.split("\n")) {
    const m = line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();

    // クォートを剥がす（"..." or '...')
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }

    data[key] = coerce(val);
  }

  return { data, body };
}

function coerce(v) {
  if (v === "true") return true;
  if (v === "false") return false;
  if (v === "null") return null;
  if (v === "undefined") return undefined;
  if (v !== "" && isFinite(v)) return Number(v);
  return v;
}

// ===== カードHTML =====

function cardHTML(m) {
  const thumb = m.thumbnail ? escapeAttr(m.thumbnail) : "";
  const title = escapeHTML(m.title);
  const cat = escapeHTML(m.category);

  // thumbnail が無い場合のプレースホルダ
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

// ===== 小物（安全） =====
function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttr(s) {
  // 属性値用（基本はHTMLエスケープと同じでOK）
  return escapeHTML(s);
}

function truthy(v) {
  return v === true || v === "true" || v === 1 || v === "1";
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v) {
  return v == null ? "" : String(v);
}

// ===== cursor position (iframe -> parent) =====
(() => {
  let pending = false;
  let last = null;

  function send(active) {
    if (!window.parent) return;
    if (!last) return;

    window.parent.postMessage(
      { type: "CURSOR_NORM", xN: last.xN, yN: last.yN, active },
      "*"
    );
  }

  window.addEventListener("mousemove", (e) => {
    const w = window.innerWidth || 1;
    const h = window.innerHeight || 1;

    last = {
      xN: e.clientX / w,
      yN: e.clientY / h,
    };

    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      send(true);
    });
  });

  // 点滅防止：最後の座標を定期送信
  setInterval(() => {
    if (!last) return;

    window.parent.postMessage(
      {
        type: "CURSOR_NORM",
        xN: last.xN,
        yN: last.yN,
        active: true
      },
      "*"
    );
  }, 120);

  // iframeがフォーカスを失ったとき（他要素にマウスが抜ける等）
  window.addEventListener("blur", () => {
    window.parent.postMessage(
      { type: "CURSOR_NORM", active: false },
      "*"
    );
  });

  // タブ切り替え・非表示時
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") {
      window.parent.postMessage(
        { type: "CURSOR_NORM", active: false },
        "*"
      );
    }
  });
})();
