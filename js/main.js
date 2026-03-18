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
  return slugify(work.title);
}

function getWorkUrl(work) {
  return `./works/${encodeURIComponent(getWorkSlug(work))}/`;
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
    ${item.category ? `<div class="category"><div class="circle"></div><p>${item.category}</p></div>` : ""}
    ${item.title ? `<h1 class="title primary-title">${item.title}</h1>` : ""}
  `;

  text.innerHTML = item.description
  ? `<div class="primary-description">${marked.parse(item.description, {
      breaks: true,
      gfm: true
    })}</div>`
  : "";
}

function goTop() {
  history.pushState({}, "", "./");
  renderPrimary(defaultContent);
}

function redirectIfWorksRoot() {
  const normalizedPath = window.location.pathname.replace(/\/+$/, "");
  if (normalizedPath.endsWith("/works")) {
    window.location.replace("../");
  }
}

const defaultContent = {
  thumbnail: "./images/top-logo.gif",
  category: "About",
  title: "倒置",
  description: `
テキストテキストテキストテキストテキスト
`
};

async function loadWorks() {
  redirectIfWorksRoot();

  const nav = document.getElementById("works-nav");
  if (!nav) return;

  try {
    const res = await fetch("./data/works.json");
    const data = await res.json();
    const works = Array.isArray(data.works) ? data.works : [];

    renderPrimary(defaultContent);

    nav.innerHTML = works
      .map(
        (work, index) => `
        <a class="work-item" href="${getWorkUrl(work)}" data-index="${index}">
          <div class="thumb">
            <img src="${work.thumbnail}" alt="${work.title}">
          </div>
          <div class="meta">
            <p class="category">${work.category || ""}</p>
            <h2 class="title">${work.title}</h2>
          </div>
        </a>
      `,
      )
      .join("");

    const items = nav.querySelectorAll(".work-item");

    items.forEach((item) => {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        const index = Number(item.dataset.index);
        const work = works[index];
        renderPrimary(work);
        history.pushState({ workIndex: index }, "", getWorkUrl(work));
      });
    });

    window.addEventListener("popstate", (event) => {
      if (event.state && typeof event.state.workIndex === "number") {
        renderPrimary(works[event.state.workIndex]);
      } else {
        renderPrimary(defaultContent);
      }
    });

    const topButton = document.querySelector(".top-trigger");
    const logo = document.querySelector(".logo");

    if (topButton) {
      topButton.addEventListener("click", goTop);
    }

    if (logo) {
      logo.style.cursor = "pointer";
      logo.addEventListener("click", goTop);
    }
  } catch (e) {
    console.error(e);
  }
}

loadWorks();