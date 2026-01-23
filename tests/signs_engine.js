// tests/signs_engine.js
(function () {
  "use strict";

  const DATA_RAW = window.SIGNS_DATA || window.SIGNS || [];
  const MODE = window.SIGNS_MODE || "study"; // "study" or "quiz"

  function qs(sel) { return document.querySelector(sel); }

  // ✅ Use file mapping first (sign_0001.webp, ...)
  function signImgPath(item) {
    if (item && item.file) return `../assets/signs_ar/${item.file}`;
    const n = Number(item && item.id ? item.id : 0);
    const num = String(n).padStart(4, "0");
    return `../assets/signs_ar/sign_${num}.webp`;
  }

  // infer id from file if needed
  function idFromFile(file) {
    const m = String(file || "").match(/sign_(\d+)\.webp/i);
    return m ? Number(m[1]) : null;
  }

  // basic category inference (only if dataset doesn't provide category)
  function inferCategory(item) {
    if (item.category) return item.category;
    const n = (item.file ? idFromFile(item.file) : null) ?? Number(item.id || 0);

    // Simple Lebanese-style grouping by typical blocks
    if (n >= 1 && n <= 29) return "إشارات تنظيمية";
    if (n >= 30 && n <= 58) return "إشارات تحذيرية";
    if (n >= 59 && n <= 73) return "إشارات إلزامية";
    if (n >= 74 && n <= 87) return "إشارات إرشادية";
    return "علامات/خطوط/إشارات أخرى";
  }

  function normalizeData(raw) {
    return raw
      .filter(Boolean)
      .map((x, i) => {
        const fid = x.file ? idFromFile(x.file) : null;
        const key = (fid ?? x.id ?? (i + 1));
        return {
          ...x,
          _key: key,
          category: x.category || inferCategory({ ...x, id: key }),
        };
      });
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const DATA = normalizeData(DATA_RAW);

  if (!Array.isArray(DATA) || DATA.length === 0) {
    const box = qs("#errorBox");
    if (box) box.textContent = "⚠️ لم يتم تحميل بيانات العلامات. تأكد من signs_data.js";
    return;
  }

  // ---- Elements ----
  const elTitle = qs("#pageTitle");
  const elMeta  = qs("#metaBox");
  const elImg   = qs("#signImg");
  const elName  = qs("#signName");
  const elCat   = qs("#signCat");

  const btnPrev = qs("#btnPrev");
  const btnNext = qs("#btnNext");
  const btnRand = qs("#btnRand");

  // Quiz-only
  const quizBox = qs("#quizBox");
  const elQText = qs("#questionText");
  const elChoices = qs("#choices");
  const btnConfirm = qs("#confirmBtn");

  // Filters
  const catSel = qs("#catFilter");
  const searchInp = qs("#searchInp");

  // ---- Categories ----
  const categories = Array.from(new Set(DATA.map(x => x.category || "عام")))
    .sort((a,b)=>a.localeCompare(b,"ar"));

  if (catSel) {
    catSel.innerHTML =
      `<option value="__all__">كل الفئات</option>` +
      categories.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  let filtered = DATA.slice();
  let order = filtered.map(x => x._key);
  let idx = 0;

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

    order = filtered.map(x => x._key);

    const box = qs("#errorBox");
    if (order.length === 0) {
      if (box) box.textContent = "⚠️ لا توجد نتائج لهذا الفلتر.";
      return;
    }
    if (box) box.textContent = "";
    idx = 0;
    render();
  }

  function currentItem() {
    const key = order[idx];
    return filtered.find(x => x._key === key) || filtered[idx] || DATA[0];
  }

  function renderMeta() {
    if (elMeta) elMeta.textContent = `الإشارة ${idx + 1} من ${order.length}`;
  }

  function renderStudy() {
    const item = currentItem();

    if (elTitle) elTitle.textContent = "تعلم العلامات المرورية";
    if (elName) elName.textContent = item.ar || item.en || "—";
    if (elCat)  elCat.textContent  = item.category || "عام";

    if (elImg) {
      elImg.src = signImgPath(item);
      elImg.alt = item.ar || item.en || "Traffic sign";
      elImg.onerror = () => { elImg.alt = "❌ صورة غير موجودة"; };
    }

    renderMeta();
  }

  function buildChoices(correctItem) {
    const pool = filtered.filter(x => x._key !== correctItem._key);
    shuffle(pool);

    const wrong1 = pool[0] || correctItem;
    const wrong2 = pool[1] || correctItem;

    return shuffle([
      { text: (correctItem.ar || correctItem.en), key: correctItem._key, correct: true },
      { text: (wrong1.ar || wrong1.en), key: wrong1._key, correct: false },
      { text: (wrong2.ar || wrong2.en), key: wrong2._key, correct: false },
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
    if (elName) elName.textContent = ""; // hide title in quiz
    if (elCat)  elCat.textContent  = item.category || "عام";

    renderMeta();

    confirmed = false;
    selectedIndex = null;

    if (quizBox) quizBox.style.display = "block";
    if (elQText) elQText.textContent = "ما معنى هذه الإشارة؟";

    const choices = buildChoices(item);
    quizBox.dataset.correctKey = String(item._key);
    quizBox.dataset.choices = JSON.stringify(choices);

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

    const correctKey = Number(quizBox.dataset.correctKey);
    const choices = JSON.parse(quizBox.dataset.choices || "[]");

    const selected = choices[selectedIndex];
    const isCorrect = selected && Number(selected.key) === correctKey;

    [...elChoices.children].forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("correct","wrong");
      const c = choices[i];
      if (c && Number(c.key) === correctKey) btn.classList.add("correct");
      if (i === selectedIndex && !isCorrect) btn.classList.add("wrong");
    });

    if (isCorrect) score++;

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

  // ---- Events ----
  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnRand) btnRand.addEventListener("click", randomizeOrder);
  if (btnConfirm) btnConfirm.addEventListener("click", confirmAnswer);

  if (catSel) catSel.addEventListener("change", applyFilters);
  if (searchInp) searchInp.addEventListener("input", applyFilters);

  render();
})();
