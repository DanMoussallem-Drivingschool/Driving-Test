// tests/signs_engine.js
(function () {
  "use strict";

  const DATA = window.SIGNS_DATA || window.SIGNS || [];
  const MODE = window.SIGNS_MODE || "study"; // "study" or "quiz"

  // --- Language (AR/EN) ---
  const LS_KEY = "SIGNS_LANG";
  let lang = (localStorage.getItem(LS_KEY) || "ar").toLowerCase(); // "ar" | "en"

  function getLabel(item) {
    return (lang === "en" ? (item.en || item.ar) : (item.ar || item.en)) || "—";
  }

  function setLang(next) {
    lang = next;
    localStorage.setItem(LS_KEY, lang);
    const b = document.getElementById("langBtn");
    if (b) b.textContent = (lang === "en" ? "EN" : "AR");
    render();
  }

  function toggleLang() {
    setLang(lang === "ar" ? "en" : "ar");
  }

  // Assets folder is in /assets, pages are in /tests => use ../assets/...
  function signImgPath(item) {
    // Prefer explicit file name from dataset
    if (item && item.file) return `../assets/signs_ar/${item.file}`;
    // Fallback to ID padding
    const num = String(item.id || 0).padStart(4, "0");
    return `../assets/signs_ar/sign_${num}.webp`;
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

  // ---- Elements ----
  const elTitle = qs("#pageTitle");
  const elMeta  = qs("#metaBox");
  const elImg   = qs("#signImg");
  const elName  = qs("#signName");
  const elCat   = qs("#signCat");
  const elTopMsg = qs("#topMsg"); // optional message box

  const btnPrev = qs("#btnPrev");
  const btnNext = qs("#btnNext");
  const btnRand = qs("#btnRand");
  const btnLang = qs("#langBtn"); // new

  // Quiz-only
  const quizBox = qs("#quizBox");
  const elQText = qs("#questionText");
  const elChoices = qs("#choices");
  const btnConfirm = qs("#confirmBtn");

  // Filters (optional if you later add categories)
  const catSel = qs("#catFilter");
  const searchInp = qs("#searchInp");

  // ---- Categories (if missing -> "عام") ----
  const categories = Array.from(new Set(DATA.map(x => x.category || "عام")))
    .sort((a,b)=>a.localeCompare(b,"ar"));

  if (catSel) {
    catSel.innerHTML =
      `<option value="__all__">كل الفئات</option>` +
      categories.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  let filtered = DATA.slice();
  let order = filtered.map(x => x.id);
  let idx = 0;

  function applyFilters() {
    const c = catSel ? catSel.value : "__all__";
    const s = (searchInp ? searchInp.value : "").trim().toLowerCase();

    filtered = DATA.filter(item => {
      const cat = item.category || "عام";
      const catOk = (c === "__all__") || (cat === c);
      if (!catOk) return false;

      if (!s) return true;
      const hay = `${item.ar || ""} ${item.en || ""} ${cat}`.toLowerCase();
      return hay.includes(s);
    });

    order = filtered.map(x => x.id);

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
    const id = order[idx];
    return filtered.find(x => x.id === id) || filtered[idx] || DATA[0];
  }

  function renderMeta() {
    if (elMeta) elMeta.textContent = `الإشارة ${idx + 1} من ${order.length}`;
  }

  function setTopMsg(msg) {
    if (!elTopMsg) return;
    elTopMsg.textContent = msg || "";
    elTopMsg.style.display = msg ? "block" : "none";
  }

  function renderStudy() {
    const item = currentItem();

    if (elTitle) elTitle.textContent = "تعلم العلامات المرورية";
    if (elName) elName.textContent = getLabel(item);
    if (elCat) elCat.textContent = item.category || "عام";

    if (elImg) {
      const src = signImgPath(item);
      elImg.onerror = null;
      elImg.src = src;
      elImg.alt = getLabel(item);

      elImg.onerror = () => {
        setTopMsg(`⚠️ صورة غير موجودة: ${item.file || ""}`.trim());
      };
      setTopMsg(""); // clear if ok
    }

    renderMeta();
  }

  function buildChoices(correctItem) {
    const pool = filtered.filter(x => x.id !== correctItem.id);
    shuffle(pool);

    const wrong1 = pool[0] || correctItem;
    const wrong2 = pool[1] || correctItem;

    return shuffle([
      { text: getLabel(correctItem), id: correctItem.id },
      { text: getLabel(wrong1), id: wrong1.id },
      { text: getLabel(wrong2), id: wrong2.id },
    ]);
  }

  let selectedIndex = null;
  let confirmed = false;
  let score = 0;

  function renderQuiz() {
    const item = currentItem();

    if (elTitle) elTitle.textContent = "اختبار العلامات المرورية";
    if (elCat) elCat.textContent = item.category || "عام";
    if (elName) elName.textContent = ""; // hide name in quiz
    renderMeta();

    if (elImg) {
      const src = signImgPath(item);
      elImg.onerror = null;
      elImg.src = src;
      elImg.alt = "Traffic sign";

      elImg.onerror = () => {
        setTopMsg(`⚠️ صورة غير موجودة: ${item.file || ""}`.trim());
      };
      setTopMsg("");
    }

    confirmed = false;
    selectedIndex = null;

    if (quizBox) quizBox.style.display = "block";
    if (elQText) elQText.textContent = (lang === "en" ? "What does this sign mean?" : "ما معنى هذه الإشارة؟");

    const choices = buildChoices(item);
    quizBox.dataset.correctId = String(item.id);
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

    const correctId = Number(quizBox.dataset.correctId);
    const choices = JSON.parse(quizBox.dataset.choices || "[]");
    const selected = choices[selectedIndex];
    const isCorrect = selected && selected.id === correctId;

    [...elChoices.children].forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("correct","wrong");
      const c = choices[i];
      if (c && c.id === correctId) btn.classList.add("correct");
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
    // Update lang button label
    if (btnLang) btnLang.textContent = (lang === "en" ? "EN" : "AR");

    if (MODE === "quiz") renderQuiz();
    else renderStudy();
  }

  // ---- Events ----
  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnRand) btnRand.addEventListener("click", randomizeOrder);
  if (btnConfirm) btnConfirm.addEventListener("click", confirmAnswer);

  if (btnLang) btnLang.addEventListener("click", toggleLang);

  if (catSel) catSel.addEventListener("change", applyFilters);
  if (searchInp) searchInp.addEventListener("input", applyFilters);

  // ---- Start ----
  render();
})();
