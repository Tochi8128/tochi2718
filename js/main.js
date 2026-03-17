async function loadWorks() {
  const nav = document.getElementById("works-nav");
  if (!nav) return;

  try {
    const res = await fetch("./data/works.json");
    const data = await res.json();

    nav.innerHTML = data.works.map(work => `
      <div class="nav-item">
        <img src="${work.thumbnail}" alt="${work.title}">
      </div>
    `).join("");
  } catch (e) {
    console.error("worksの読み込み失敗", e);
  }
}

loadWorks();