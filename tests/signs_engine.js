// tests/signs_engine.js
(function () {
  "use strict";

  const DATA = window.SIGNS_DATA || [];
  const MODE = window.SIGNS_MODE || "study"; // "study" | "quiz"

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  const qs = (s) => document.querySelector(s);

  if (!Array.isArray(DATA) || DATA.length === 0) {
    const box = qs("#errorBox");
    if (box) box.textContent = "⚠️ لا توجد بيانات في signs_data.js بعد. افتح صفحة الإدارة لتوليد البيانات.";
    return;
  }

  // IMPORTANT: assets are in /assets/... and pages are in /tests => ../assets/...
  function signImgPath(item) {
    // Prefer explicit file
    if (item.file) return `../assets/signs_ar/${item.file}`;
    // Backward fallback (id -> sign_0001.webp)
    if (typeof item.id === "number") {
      const num = String(item.id).padStart(4, "0");
      return `../assets/signs_ar/sign_${num}.webp`;
    }
    return "";
  }

  const elTitle = qs("#pageTitle");
  const elMeta  = qs("#metaBox");
  const elImg   = qs("#signImg");
  const elName  = qs("#signName");
  const elCat   = qs("#signCat");

  const btnPrev = qs("#btnPrev");
  const btnNext = qs("#btnNext");
  const btnRand = qs("#btnRand");

  const quizBox = qs("#quizBox");
  const elQText = qs("#questionText");
  const elChoices = qs("#choices");
  const btnConfirm = qs("#confirmBtn");

  const catSel = qs("#catFilter");
  const searchInp = qs("#searchInp");

  // ---- Categories ----
  const categories = Array.from(new Set(DATA.map(x => x.category || "عام")))
    .sort((a,b)=>a.localeCompare(b,"ar"));

  if (catSel) {
    catSel.innerHTML =
      `<option value="__all__">كل الفئات</option>` +
      categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
  }

  let filtered = DATA.slice();
  let order = filtered.map((_, i) => i); // store indices
  let idx = 0;

  function escapeHtml(s){
    return String(s)
      .replaceAll("&","&amp;").replaceAll("<","&lt;")
      .replaceAll(">","&gt;").replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function applyFilters() {
    const c = catSel ? catSel.value : "__all__";
    const s = (searchInp ? searchInp.value : "").trim().toLowerCase();

    filtered = DATA.filter(item => {
      const catOk = (c === "__all__") || ((item.category || "عام") === c);
      if (!catOk) return false;
      if (!s) return true;
      const hay = `${item.ar || ""} ${item.en || ""} ${item.category || ""}`.toLowerCase();
      return hay.includes(s);
    });

    order = filtered.map((_, i) => i);
    idx = 0;

    const box = qs("#errorBox");
    if (order.length === 0) {
      if (box) box.textContent = "⚠️ لا توجد نتائج لهذا الفلتر.";
      return;
    }
    if (box) box.textContent = "";
    render();
  }

  function currentItem() {
    const i = order[idx];
    return filtered[i] || DATA[0];
  }

  function renderMeta() {
    if (!elMeta) return;
    elMeta.textContent = `الإشارة ${idx + 1} من ${order.length}`;
  }

  function renderStudy() {
    const item = currentItem();
    if (elTitle) elTitle.textContent = "تعلم العلامات المرورية";
    if (elName) elName.textContent = item.ar || item.en || "—";
    if (elCat) elCat.textContent = item.category || "عام";

    if (elImg) {
      elImg.src = signImgPath(item);
      elImg.alt = item.ar || item.en || "Traffic sign";
      elImg.onerror = () => { elImg.alt = "❌ صورة غير موجودة"; };
    }
    renderMeta();
  }

  function buildChoices(correctItem) {
    const pool = filtered.filter(x => x !== correctItem);
    shuffle(pool);
    const wrong1 = pool[0] || correctItem;
    const wrong2 = pool[1] || correctItem;

    return shuffle([
      { text: (correctItem.ar || correctItem.en), ref: correctItem, correct: true },
      { text: (wrong1.ar || wrong1.en), ref: wrong1, correct: false },
      { text: (wrong2.ar || wrong2.en), ref: wrong2, correct: false },
    ]);
  }

  let selectedIndex = null;
  let confirmed = false;
  let score = 0;

  function renderQuiz() {
    const item = currentItem();

    if (elTitle) elTitle.textContent = "اختبار العلامات المرورية";
    if (elImg) {
      elImg.src = signImgPath(item);
      elImg.alt = item.ar || item.en || "Traffic sign";
    }
    if (elName) elName.textContent = "";
    if (elCat) elCat.textContent = item.category || "عام";
    renderMeta();

    confirmed = false;
    selectedIndex = null;

    if (!quizBox) return;
    quizBox.style.display = "block";
    if (elQText) elQText.textContent = "ما معنى هذه الإشارة؟";

    const choices = buildChoices(item);
    quizBox._choices = choices;
    quizBox._correct = item;

    elChoices.innerHTML = "";
    choices.forEach((c, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = c.text;

      btn.addEventListener("click", () => {
        if (confirmed) return;
        selectedIndex = i;
        [...elChoices.children].forEach(b => b.classList.remove("selected"));
        btn.classList.add("selected");
        if (btnConfirm) btnConfirm.disabled = false;
      });

      elChoices.appendChild(btn);
    });

    if (btnConfirm) btnConfirm.disabled = true;
  }

  function confirmAnswer() {
    if (confirmed || selectedIndex === null) return;
    confirmed = true;

    const choices = quizBox._choices || [];
    const correctItem = quizBox._correct;
    const selected = choices[selectedIndex];

    const isCorrect = selected && selected.ref === correctItem;
    if (isCorrect) score++;

    [...elChoices.children].forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("correct","wrong");
      const c = choices[i];
      if (c && c.ref === correctItem) btn.classList.add("correct");
      if (i === selectedIndex && !isCorrect) btn.classList.add("wrong");
    });

    if (btnConfirm) btnConfirm.disabled = true;
  }

  function next() {
    if (MODE === "quiz" && !confirmed) return;
    idx++;
    if (idx >= order.length) idx = 0;
    render();
  }
  function prev() {
    idx--;
    if (idx < 0) idx = order.length - 1;
    render();
  }
  function randomizeOrder() {
    const ids = order.slice();
    shuffle(ids);
    order = ids;
    idx = 0;
    render();
  }

  function render() {
    if (MODE === "quiz") renderQuiz();
    else {
      if (quizBox) quizBox.style.display = "none";
      renderStudy();
    }
  }

  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnRand) btnRand.addEventListener("click", randomizeOrder);
  if (btnConfirm) btnConfirm.addEventListener("click", confirmAnswer);
  if (catSel) catSel.addEventListener("change", applyFilters);
  if (searchInp) searchInp.addEventListener("input", applyFilters);

  render();
})();
