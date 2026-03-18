function renderPrimary(item) {
  const thumb = document.querySelector(".p-thumb");
  const cat = document.querySelector(".p-cat");
  const text = document.querySelector(".text");

  if (!thumb || !cat || !text) return;

  thumb.innerHTML = item.thumbnail
    ? `<img src="${item.thumbnail}" alt="${item.title || item.category || "image"}">`
    : "";

  cat.innerHTML = `
    ${item.category ? `<div class="category"><div class="circle"></div><p>${item.category}<p></div>` : ""}
    ${item.title ? `<h1 class="title primary-title">${item.title}</h1>` : ""}
  `;

  text.innerHTML = item.description
    ? `<p class="primary-description">${item.description}</p>`
    : "";
}

async function loadWorks() {
  const nav = document.getElementById("works-nav");
  if (!nav) return;

  const defaultContent = {
    thumbnail: "./images/top-logo.gif",
    category: "About",
    title: "倒置",
    description:
      "テキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキストテキスト"
  };

  try {
    const res = await fetch("./data/works.json");
    const data = await res.json();

    renderPrimary(defaultContent);

    nav.innerHTML = data.works.map((work, index) => `
      <button class="work-item" type="button" data-index="${index}">
        <div class="thumb">
          <img src="${work.thumbnail}" alt="${work.title}">
        </div>
        <div class="meta">
          <p class="category">${work.category || ""}</p>
          <h2 class="title">${work.title}</h2>
        </div>
      </button>
    `).join("");

    const items = nav.querySelectorAll(".work-item");

    items.forEach(item => {
      item.addEventListener("click", () => {
        const index = Number(item.dataset.index);
        const work = data.works[index];
        renderPrimary(work);
      });
    });

    const topButton = document.querySelector(".header-right p:first-child");
    if (topButton) {
      topButton.addEventListener("click", () => {
        renderPrimary(defaultContent);
      });
    }

  } catch (e) {
    console.error(e);
  }
}

loadWorks();