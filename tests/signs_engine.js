// tests/signs_engine.js
(function () {
  "use strict";

  // ---- Config ----
  const DATA = window.SIGNS_DATA || window.SIGNS || [];
  const MODE = window.SIGNS_MODE || "study"; // "study" or "quiz"

  // ✅ correct folder (repo has: assets/signs/signs_ar/)
  function signImgPath(item) {
    // prefer explicit filename from data
    if (item && item.file) {
      return `../assets/signs/signs_ar/${item.file}`;
    }
    // fallback to id-based filename
    const num = String(item.id || 1).padStart(4, "0");
    return `../assets/signs/signs_ar/sign_${num}.webp`;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function qs(sel) { return document.querySelector(sel); }

  if (!Array.isArray(DATA) || DATA.length === 0) {
    const box = qs("#errorBox");
    if (box) box.textContent = "⚠️ لم يتم تحميل بيانات العلامات. تأكد من signs_data.js";
    return;
  }

  // ---- Elements (shared) ----
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

  // ---- Build categories ----
  const categories = Array.from(new Set(DATA.map(x => x.category || "عام")))
    .sort((a,b)=>a.localeCompare(b,"ar"));

  if (catSel) {
    catSel.innerHTML =
      `<option value="__all__">كل الفئات</option>` +
      categories.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  let filtered = DATA.slice();
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

    if (filtered.length === 0) {
      const box = qs("#errorBox");
      if (box) box.textContent = "⚠️ لا توجد نتائج لهذا الفلتر.";
      return;
    }

    idx = 0;
    const box = qs("#errorBox");
    if (box) box.textContent = "";
    render();
  }

  function currentItem() {
    return filtered[idx] || DATA[0];
  }

  function renderMeta() {
    if (!elMeta) return;
    elMeta.textContent = `الإشارة ${idx + 1} من ${filtered.length}`;
  }

  function setImage(item) {
    if (!elImg) return;

    elImg.onerror = null;
    elImg.src = signImgPath(item);
    elImg.alt = item.ar || item.en || "Traffic sign";

    elImg.onerror = () => {
      // show a clear message if not found
      elImg.removeAttribute("src");
      elImg.alt = "❌ صورة غير موجودة";
      const box = qs("#errorBox");
      if (box) box.textContent = `⚠️ صورة غير موجودة: ${item.file || ("sign_" + String(item.id).padStart(4,"0") + ".webp")}`;
    };
  }

  function renderStudy() {
    const item = currentItem();

    if (elTitle) elTitle.textContent = "تعلم العلامات المرورية";
    if (elName) elName.textContent = item.ar || item.en || "—";
    if (elCat) elCat.textContent = item.category || "عام";

    setImage(item);
    renderMeta();
  }

  function buildChoices(correctItem) {
    // 3 choices: 1 correct + 2 random
    const pool = filtered.filter(x => x !== correctItem);
    shuffle(pool);
    const wrong1 = pool[0] || correctItem;
    const wrong2 = pool[1] || correctItem;

    return shuffle([
      { text: (correctItem.ar || correctItem.en), item: correctItem, correct: true },
      { text: (wrong1.ar || wrong1.en), item: wrong1, correct: false },
      { text: (wrong2.ar || wrong2.en), item: wrong2, correct: false },
    ]);
  }

  let selectedIndex = null;
  let confirmed = false;
  let score = 0;

  function renderQuiz() {
    const item = currentItem();

    if (elTitle) elTitle.textContent = "اختبار العلامات المرورية";
    if (elName) elName.textContent = "";
    if (elCat) elCat.textContent = item.category || "عام";

    setImage(item);
    renderMeta();

    confirmed = false;
    selectedIndex = null;

    if (!quizBox) return;
    if (elQText) elQText.textContent = "ما معنى هذه الإشارة؟";

    const choices = buildChoices(item);
    quizBox.dataset.correct = item.ar || item.en || "";
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
    if (confirmed) return;
    if (selectedIndex === null) return;

    confirmed = true;

    const choices = JSON.parse(quizBox.dataset.choices || "[]");
    const selected = choices[selectedIndex];
    const correctText = quizBox.dataset.correct;

    const isCorrect = selected && selected.text === correctText;

    [...elChoices.children].forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("correct","wrong");
      if (choices[i] && choices[i].text === correctText) btn.classList.add("correct");
      if (i === selectedIndex && !isCorrect) btn.classList.add("wrong");
    });

    if (isCorrect) score++;
    if (btnConfirm) btnConfirm.disabled = true;
  }

  function next() {
    if (MODE === "quiz" && !confirmed) return;
    idx++;
    if (idx >= filtered.length) idx = 0;
    render();
  }

  function prev() {
    idx--;
    if (idx < 0) idx = filtered.length - 1;
    render();
  }

  function randomizeOrder() {
    shuffle(filtered);
    idx = 0;
    render();
  }

  function render() {
    if (MODE === "quiz") {
      if (quizBox) quizBox.style.display = "block";
      renderQuiz();
    } else {
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

  // ---- Start ----
  render();
})();
