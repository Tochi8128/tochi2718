async function loadWorks() {
  const nav = document.getElementById("works-nav");
  if (!nav) return;

  try {
    const res = await fetch("./data/works.json");
    const data = await res.json();

    nav.innerHTML = data.works.map(work => `
      <div class="work-item">
        <div class="thumb">
          <img src="${work.thumbnail}" alt="${work.title}">
        </div>
        <div class="meta">
          <p class="category">${work.category || ""}</p>
          <h2 class="title">${work.title}</h2>
        </div>
      </div>
    `).join("");

  } catch (e) {
    console.error(e);
  }
}

loadWorks();