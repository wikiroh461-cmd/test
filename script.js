async function loadList(jsonPath, targetId, basePath="") {
  try {
    const res = await fetch(jsonPath);
    const data = await res.json();
    const ul = document.getElementById(targetId);
    if (!ul) return;
    ul.innerHTML = "";

    data.forEach(item => {
      const li = document.createElement("li");
      li.innerHTML = `<a href="${basePath}${item.file}">${item.title}</a>
                      <span class="muted"> (${item.date})</span>`;
      ul.appendChild(li);
    });
  } catch (e) {
    console.error("목록 로딩 실패:", e);
  }
}

document.getElementById("searchForm")?.addEventListener("submit", e => {
  e.preventDefault();
  const q = document.getElementById("searchInput").value.trim();
  const result = document.getElementById("searchResult");
  if (!q) {
    result.innerHTML = "<p>검색어를 입력하세요.</p>";
    return;
  }
  result.innerHTML = `<p>검색 기능은 향후 구현 예정입니다. “<strong>${q}</strong>”에 대한 결과는 각 카테고리에서 확인하세요.</p>`;
});

document.addEventListener("DOMContentLoaded", () => {
  loadList("latest.json", "latest-list");
  loadList("law/list.json", "law-list", "law/");
  loadList("local/list.json", "local-list", "local/");
  loadList("gyu/list.json", "gyu-list", "gyu/");
  loadList("court/list.json", "court-list", "court/");
});
