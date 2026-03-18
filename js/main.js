if (window.marked) {
  marked.setOptions({
    breaks: true,
    gfm: true,
  });
}

function slugify(text = "") {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-ぁ-んァ-ヶ一-龠ー]/g, "");
}

function getWorkSlug(work) {
  if (work.slug && work.slug.trim()) return work.slug.trim();
  return slugify(work.title || "");
}

function getWorkPath(work) {
  return `/tochi2718/works/${encodeURIComponent(getWorkSlug(work))}/`;
}

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}

function getRequestedPath() {
  const params = new URLSearchParams(window.location.search);
  const redirectedPath = params.get("path");
  if (redirectedPath) return normalizePath(decodeURIComponent(redirectedPath));
  return normalizePath(window.location.pathname);
}

function getSlugFromCurrentLocation() {
  const path = getRequestedPath();
  const match = path.match(/^\/tochi2718\/works\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isWorksRootPath() {
  return getRequestedPath() === "/tochi2718/works";
}

function renderPrimary(item) {
  const thumb = document.querySelector(".p-thumb");
  const cat = document.querySelector(".p-cat");
  const text = document.querySelector(".text");

  if (!thumb || !cat || !text) return;

  thumb.innerHTML = item.thumbnail
    ? `<img src="${item.thumbnail}" alt="${item.title || item.category || "image"}">`
    : "";

  cat.innerHTML = `
    ${
      item.category
        ? `<div class="category"><div class="circle"></div><p>${item.category}</p></div>`
        : ""
    }
    ${item.title ? `<h1 class="title primary-title">${item.title}</h1>` : ""}
  `;

  const description = item.description || "";
  const parsed = window.marked ? marked.parse(description) : description;

  text.innerHTML = parsed
    ? `<div class="primary-description">${parsed}</div>`
    : "";
}

function setActiveWork(index) {
  document.querySelectorAll(".work-item").forEach((item) => {
    item.classList.toggle("is-active", Number(item.dataset.index) === index);
  });
}

async function loadWorks() {
  if (isWorksRootPath()) {
    window.location.replace("/tochi2718/");
    return;
  }

  const nav = document.getElementById("works-nav");
  if (!nav) return;

  const defaultContent = {
    thumbnail: "./images/top-logo.gif",
    category: "About",
    title: "倒置",
    description: `
ここにabout文を入れます。
`,
  };

  try {
    const res = await fetch("./data/works.json");
    const data = await res.json();
    const works = Array.isArray(data.works) ? data.works : [];

    nav.innerHTML = works
      .map(
        (work, index) => `
          <a class="work-item" href="${getWorkPath(work)}" data-index="${index}">
            <div class="thumb">
              <img src="${work.thumbnail}" alt="${work.title}">
            </div>
            <div class="meta">
              <p class="category">${work.category || ""}</p>
              <h2 class="title">${work.title || ""}</h2>
            </div>
          </a>
        `
      )
      .join("");

    function showDefault(push = true) {
      renderPrimary(defaultContent);
      setActiveWork(-1);
      if (push) {
        history.pushState({ type: "top" }, "", "/tochi2718/");
      }
    }

    function showWorkByIndex(index, push = true) {
      const work = works[index];
      if (!work) {
        showDefault(push);
        return;
      }

      renderPrimary(work);
      setActiveWork(index);

      if (push) {
        history.pushState(
          { type: "work", workIndex: index },
          "",
          getWorkPath(work)
        );
      }
    }

    const initialSlug = getSlugFromCurrentLocation();
    if (initialSlug) {
      const initialIndex = works.findIndex(
        (work) => getWorkSlug(work) === initialSlug
      );
      if (initialIndex >= 0) {
        showWorkByIndex(initialIndex, false);
      } else {
        showDefault(false);
      }
    } else {
      showDefault(false);
    }

    nav.querySelectorAll(".work-item").forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        const index = Number(item.dataset.index);
        showWorkByIndex(index, true);
      });
    });

    window.addEventListener("popstate", () => {
      const slug = getSlugFromCurrentLocation();
      if (!slug) {
        showDefault(false);
        return;
      }

      const index = works.findIndex((work) => getWorkSlug(work) === slug);
      if (index >= 0) {
        showWorkByIndex(index, false);
      } else {
        showDefault(false);
      }
    });

    const topTrigger = document.querySelector(".top-trigger");
    const logo = document.querySelector(".logo");

    if (topTrigger) {
      topTrigger.addEventListener("click", () => {
        showDefault(true);
      });
    }

    if (logo) {
      logo.style.cursor = "pointer";
      logo.addEventListener("click", () => {
        showDefault(true);
      });
    }
  } catch (error) {
    console.error("worksの読み込みに失敗しました:", error);
  }
}

loadWorks();