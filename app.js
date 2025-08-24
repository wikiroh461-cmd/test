/* ====== 데이터 입력 위치 ======
 * 여기에 법령 데이터를 추가하세요.
 * 구조 예시:
 * {
 *   id: "LAW-0001",
 *   title: "민법",
 *   type: "법률",
 *   status: "시행",
 *   ministry: "법무부",
 *   enactedAt: "1958-02-22",
 *   effectiveAt: "1960-01-01",
 *   latestRevisionAt: "2023-12-31",
 *   summary: "간단 요약",
 *   keywords: ["계약","상속"],
 *   versions: [
 *     {
 *       versionId: "v20231231",
 *       label: "2023.12.31 시행",
 *       date: "2023-12-31",
 *       articles: [
 *         { num: "제1조", heading: "목적", body: "..." },
 *         { num: "제2조", heading: "신의성실", body: "..." }
 *       ],
 *       attachments: [{ name:"별표 1", body:"..." }],
 *       supplements: [{ name:"부칙", body:"..." }]
 *     }
 *   ],
 *   history: [
 *     { date: "1958-02-22", event: "제정", ref: "법률 제471호" },
 *     { date: "2023-12-31", event: "일부개정", ref: "법률 제19555호" }
 *   ]
 * }
 */
const LAW_DATA = [
  // 샘플 2건(필요 없으면 삭제)
  {
    id: "LAW-0001",
    title: "민법",
    type: "법률",
    status: "시행",
    ministry: "법무부",
    enactedAt: "1958-02-22",
    effectiveAt: "1960-01-01",
    latestRevisionAt: "2023-12-31",
    summary: "사법의 근간이 되는 일반법(권리·의무·계약·물권·가족·상속).",
    keywords: ["계약","물권","상속","친족"],
    versions: [
      {
        versionId: "v20231231",
        label: "2023.12.31 시행",
        date: "2023-12-31",
        articles: [
          { num: "제1조", heading: "민법의 목적", body: "이 법은 개인의 권리와 의무를 규정하여 사법질서를 확립함을 목적으로 한다." },
          { num: "제2조", heading: "신의성실", body: "권리의 행사와 의무의 이행은 신의에 좇아 성실히 하여야 한다." }
        ],
        attachments: [],
        supplements: [{ name:"부칙", body:"이 법은 2023년 12월 31일부터 시행한다." }]
      }
    ],
    history: [
      { date:"1958-02-22", event:"제정", ref:"법률 제471호" },
      { date:"2023-12-31", event:"일부개정", ref:"법률 제19555호" }
    ]
  },
  {
    id: "LAW-0002",
    title: "형법",
    type: "법률",
    status: "시행",
    ministry: "법무부",
    enactedAt: "1953-09-18",
    effectiveAt: "1953-10-03",
    latestRevisionAt: "2022-01-01",
    summary: "범죄와 형벌에 관한 기본 사항 규정.",
    keywords: ["범죄","형벌","책임"],
    versions: [
      {
        versionId: "v20220101",
        label: "2022.01.01 시행",
        date: "2022-01-01",
        articles: [
          { num:"제1조", heading:"형법의 적용범위", body:"범죄와 형벌은 행위시의 법률에 의한다." }
        ],
        attachments: [],
        supplements: []
      }
    ],
    history: [
      { date:"1953-09-18", event:"제정", ref:"법률 제293호" },
      { date:"2022-01-01", event:"일부개정", ref:"법률 제18648호" }
    ]
  }
];

/* ====== 유틸 ====== */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));
const fmtDate = d => d ? new Date(d).toLocaleDateString("ko-KR",{year:"numeric",month:"2-digit",day:"2-digit"}) : "-";
const byId = id => LAW_DATA.find(x => x.id === id);
const getCurrentVersion = law => {
  if (!law?.versions?.length) return null;
  // 최신 날짜 순
  return [...law.versions].sort((a,b)=>new Date(b.date)-new Date(a.date))[0];
};

/* ====== 상태 ====== */
const state = {
  q: "",
  fType: "",
  fStatus: "",
  fMinistry: "",
  sort: "rel",
  page: 1,
  pageSize: 20,
  selectedId: null,
  selectedVersionId: null,
  bookmarks: new Set(JSON.parse(localStorage.getItem("bookmarks") || "[]")),
};

/* ====== DOM 캐시 ====== */
const els = {
  form: $("#searchForm"),
  q: $("#q"),
  resetBtn: $("#resetBtn"),
  fType: $("#fType"),
  fStatus: $("#fStatus"),
  fMinistry: $("#fMinistry"),
  fSort: $("#fSort"),
  resultCount: $("#resultCount"),
  resultList: $("#resultList"),
  pager: $("#pager"),
  pageInfo: $("#pageInfo"),
  lawTitle: $("#lawTitle"),
  lawMeta: $("#lawMeta"),
  bookmarkBtn: $("#bookmarkBtn"),
  printBtn: $("#printBtn"),
  exportBtn: $("#exportBtn"),
  tabButtons: $$(".tab"),
  tabPanel: $("#tabPanel"),
  versionSelect: $("#versionSelect"),
  viewBookmarks: $("#viewBookmarks"),
  clearBookmarks: $("#clearBookmarks"),
  resultItemTpl: $("#resultItemTpl"),
};

/* ====== 검색/필터 ====== */
function filterData() {
  const q = state.q.trim().toLowerCase();
  let list = [...LAW_DATA];

  if (q) {
    list = list.filter(l =>
      [l.title, l.summary, ...(l.keywords||[])].join(" ").toLowerCase().includes(q)
    );
  }
  if (state.fType) list = list.filter(l => l.type === state.fType);
  if (state.fStatus) list = list.filter(l => l.status === state.fStatus);
  if (state.fMinistry) list = list.filter(l => l.ministry === state.fMinistry);

  if (state.sort === "rev") list.sort((a,b)=>new Date(b.latestRevisionAt)-new Date(a.latestRevisionAt));
  if (state.sort === "abc") list.sort((a,b)=>a.title.localeCompare(b.title,"ko"));

  return list;
}

function renderResults() {
  const list = filterData();
  els.resultCount.textContent = `(${list.length})`;

  const start = (state.page-1)*state.pageSize;
  const pageItems = list.slice(start, start+state.pageSize);

  els.resultList.innerHTML = "";
  for (const l of pageItems) {
    const li = els.resultItemTpl.content.cloneNode(true);
    const btn = li.querySelector(".card__body");
    btn.dataset.id = l.id;
    li.querySelector("[data-type]").textContent = l.type || "-";
    li.querySelector("[data-title]").textContent = l.title || "-";
    li.querySelector("[data-summary]").textContent = l.summary || "-";
    li.querySelector("[data-status]").textContent = `상태: ${l.status||"-"}`;
    li.querySelector("[data-ministry]").textContent = `부처: ${l.ministry||"-"}`;
    li.querySelector("[data-rev]").textContent = `최종개정: ${fmtDate(l.latestRevisionAt)}`;
    els.resultList.appendChild(li);
  }

  // pager
  const totalPages = Math.max(1, Math.ceil(list.length/state.pageSize));
  els.pager.hidden = totalPages <= 1;
  els.pageInfo.textContent = `${state.page} / ${totalPages}`;
  els.pager.querySelectorAll("button").forEach(b=>{
    b.disabled = (b.dataset.page==="prev" && state.page<=1) ||
                 (b.dataset.page==="next" && state.page>=totalPages);
  });
}

/* ====== 상세 ====== */
function selectLaw(id, versionId = null) {
  const law = byId(id);
  state.selectedId = id;
  const ver = versionId
    ? law.versions.find(v => v.versionId === versionId)
    : getCurrentVersion(law);
  state.selectedVersionId = ver?.versionId ?? null;

  // 제목 & 버튼
  els.lawTitle.textContent = law.title;
  const isBookmarked = state.bookmarks.has(id);
  els.bookmarkBtn.textContent = (isBookmarked ? "★ 즐겨찾기 해제" : "★ 즐겨찾기");
  [els.bookmarkBtn, els.printBtn, els.exportBtn, els.versionSelect].forEach(el=>el.disabled=false);

  // 메타
  els.lawMeta.innerHTML = `
    <div class="grid">
      <div>종류: <strong>${law.type||"-"}</strong></div>
      <div>상태: <strong>${law.status||"-"}</strong></div>
      <div>부처: <strong>${law.ministry||"-"}</strong></div>
      <div>제정일: <strong>${fmtDate(law.enactedAt)}</strong></div>
      <div>시행일: <strong>${fmtDate(law.effectiveAt)}</strong></div>
      <div>최종개정: <strong>${fmtDate(law.latestRevisionAt)}</strong></div>
      <div style="grid-column: 1 / -1;">요약: <span class="muted">${law.summary||"-"}</span></div>
    </div>
  `;

  // 버전 셀렉트
  els.versionSelect.innerHTML = law.versions
    .sort((a,b)=>new Date(b.date)-new Date(a.date))
    .map(v=>`<option value="${v.versionId}" ${v.versionId===ver?.versionId?"selected":""}>${v.label||v.date}</option>`)
    .join("");

  // 탭 초기화 후 조문 렌더
  setActiveTab("toc");
  renderTab(ver, law);
}

function renderTab(ver, law) {
  // 목차
  const toc = els.tabPanel.querySelector('[data-panel="toc"]');
  toc.innerHTML = "";
  if (!ver?.articles?.length) {
    toc.innerHTML = `<p class="muted">조문이 없습니다.</p>`;
  } else {
    const container = document.createElement("div");
    container.className = "toc";
    ver.articles.forEach((a,i)=>{
      const btn = document.createElement("button");
      btn.textContent = `${a.num} ${a.heading||""}`;
      btn.addEventListener("click", ()=> {
        setActiveTab("articles");
        document.getElementById(`art-${i}`)?.scrollIntoView({behavior:"smooth", block:"start"});
      });
      container.appendChild(btn);
    });
    toc.appendChild(container);
  }

  // 조문
  const art = els.tabPanel.querySelector('[data-panel="articles"]');
  art.innerHTML = "";
  if (!ver?.articles?.length) {
    art.innerHTML = `<p class="muted">조문이 없습니다.</p>`;
  } else {
    ver.articles.forEach((a,i)=>{
      const wrap = document.createElement("article");
      wrap.className = "article";
      wrap.id = `art-${i}`;
      wrap.innerHTML = `<h4>${a.num} ${a.heading||""}</h4><div>${(a.body||"").replace(/\n/g,"<br>")}</div>`;
      art.appendChild(wrap);
    });
    if (ver.attachments?.length) {
      const sep = document.createElement("div");
      sep.className = "article";
      sep.innerHTML = `<h4>별표/별지</h4><ul>${ver.attachments.map(x=>`<li><strong>${x.name}</strong>: ${x.body||""}</li>`).join("")}</ul>`;
      art.appendChild(sep);
    }
    if (ver.supplements?.length) {
      const sup = document.createElement("div");
      sup.className = "article";
      sup.innerHTML = `<h4>부칙</h4><ul>${ver.supplements.map(x=>`<li><strong>${x.name}</strong>: ${x.body||""}</li>`).join("")}</ul>`;
      art.appendChild(sup);
    }
  }

  // 이력
  const his = els.tabPanel.querySelector('[data-panel="history"]');
  his.innerHTML = "";
  if (!law?.history?.length) {
    his.innerHTML = `<p class="muted">이력 정보가 없습니다.</p>`;
  } else {
    his.innerHTML = `<ul class="toc">${law.history
      .sort((a,b)=>new Date(b.date)-new Date(a.date))
      .map(h=>`<li><button>${fmtDate(h.date)} · ${h.event}${h.ref?` (${h.ref})`:""}</button></li>`).join("")}</ul>`;
  }
}

/* ====== 탭 ====== */
function setActiveTab(name){
  els.tabButtons.forEach(b=>{
    const active = b.dataset.tab === name;
    b.classList.toggle("is-active", active);
    els.tabPanel.querySelectorAll("[data-panel]").forEach(p=>{
      if (p.dataset.panel === name) p.hidden = false;
      else if (["toc","articles","history"].includes(p.dataset.panel)) p.hidden = true;
    });
  });
}

/* ====== 이벤트 바인딩 ====== */
function bindEvents(){
  // 검색 폼
  els.form.addEventListener("submit", e=>{
    e.preventDefault();
    state.q = els.q.value || "";
    state.page = 1;
    renderResults();
  });
  els.resetBtn.addEventListener("click", ()=>{
    state.q = ""; els.q.value = "";
    state.fType = els.fType.value = "";
    state.fStatus = els.fStatus.value = "";
    state.fMinistry = els.fMinistry.value = "";
    state.sort = els.fSort.value = "rel";
    state.page = 1;
    renderResults();
  });

  // 필터
  els.fType.addEventListener("change", e=>{ state.fType = e.target.value; state.page=1; renderResults(); });
  els.fStatus.addEventListener("change", e=>{ state.fStatus = e.target.value; state.page=1; renderResults(); });
  els.fMinistry.addEventListener("change", e=>{ state.fMinistry = e.target.value; state.page=1; renderResults(); });
  els.fSort.addEventListener("change", e=>{ state.sort = e.target.value; state.page=1; renderResults(); });

  // 결과 클릭(이벤트 위임)
  els.resultList.addEventListener("click", e=>{
    const btn = e.target.closest(".card__body");
    if (!btn) return;
    selectLaw(btn.dataset.id);
  });

  // 페이징
  els.pager.addEventListener("click", e=>{
    if (!(e.target instanceof HTMLButtonElement)) return;
    const dir = e.target.dataset.page;
    if (dir==="prev") state.page = Math.max(1, state.page-1);
    if (dir==="next") state.page = state.page+1;
    renderResults();
  });

  // 탭
  els.tabButtons.forEach(b=> b.addEventListener("click", ()=> setActiveTab(b.dataset.tab)));

  // 버전 선택
  els.versionSelect.addEventListener("change", e=>{
    if (!state.selectedId) return;
    selectLaw(state.selectedId, e.target.value);
  });

  // 즐겨찾기
  els.bookmarkBtn.addEventListener("click", ()=>{
    if (!state.selectedId) return;
    if (state.bookmarks.has(state.selectedId)) state.bookmarks.delete(state.selectedId);
    else state.bookmarks.add(state.selectedId);
    localStorage.setItem("bookmarks", JSON.stringify([...state.bookmarks]));
    // 버튼 텍스트 갱신
    const isBookmarked = state.bookmarks.has(state.selectedId);
    els.bookmarkBtn.textContent = (isBookmarked ? "★ 즐겨찾기 해제" : "★ 즐겨찾기");
  });

  // 북마크 보기/초기화
  els.viewBookmarks.addEventListener("click", ()=>{
    const ids = [...state.bookmarks];
    if (!ids.length) { alert("즐겨찾기가 없습니다."); return; }
    // 북마크한 항목만 리스트에 표시
    const savedPage = state.page;
    const savedQ = state.q;
    state.q = ""; els.q.value="";
    state.page = 1;
    const list = LAW_DATA.filter(l=>ids.includes(l.id));
    els.resultCount.textContent = `(${list.length})`;
    els.resultList.innerHTML = "";
    list.forEach(l=>{
      const li = els.resultItemTpl.content.cloneNode(true);
      const btn = li.querySelector(".card__body");
      btn.dataset.id = l.id;
      li.querySelector("[data-type]").textContent = l.type || "-";
      li.querySelector("[data-title]").textContent = l.title || "-";
      li.querySelector("[data-summary]").textContent = l.summary || "-";
      li.querySelector("[data-status]").textContent = `상태: ${l.status||"-"}`;
      li.querySelector("[data-ministry]").textContent = `부처: ${l.ministry||"-"}`;
      li.querySelector("[data-rev]").textContent = `최종개정: ${fmtDate(l.latestRevisionAt)}`;
      els.resultList.appendChild(li);
    });
    els.pager.hidden = true;
    // 원상복구는 사용자가 필터/검색을 다시 수행하면 됩니다.
  });

  els.clearBookmarks.addEventListener("click", ()=>{
    if (!confirm("모든 즐겨찾기를 삭제할까요?")) return;
    state.bookmarks.clear();
    localStorage.removeItem("bookmarks");
    if (state.selectedId) {
      els.bookmarkBtn.textContent = "★ 즐겨찾기";
    }
  });

  // 인쇄
  els.printBtn.addEventListener("click", ()=>{
    window.print();
  });

  // JSON 내보내기(선택된 법령만)
  els.exportBtn.addEventListener("click", ()=>{
    if (!state.selectedId) return;
    const law = byId(state.selectedId);
    const blob = new Blob([JSON.stringify(law,null,2)], {type:"application/json"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${law.title.replace(/\\s+/g,'_')}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  });
}

/* ====== 초기 랜더링 ====== */
function init(){
  bindEvents();
  renderResults();
  // 첫 항목 자동 선택(있다면)
  if (LAW_DATA.length) selectLaw(LAW_DATA[0].id);
}
document.addEventListener("DOMContentLoaded", init);
