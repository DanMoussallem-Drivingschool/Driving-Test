// tests/signs_engine.js
// محرك موحّد لصفحات تعلم/اختبار العلامات.
// يعتمد على:
// - tests/signs_data.js (window.SIGNS_DATA)
// - صور: assets/signs_lb/sign_0001.webp ... (من نفس الترتيب داخل signs_data)

(function () {
  "use strict";

  const DATA = window.SIGNS_DATA || [];
  const MODE = window.SIGNS_MODE || "study"; // "study" | "quiz"
  const STORE_KEY = MODE === "quiz" ? "SIGNS_QUIZ_STATE_V1" : "SIGNS_STUDY_STATE_V1";

  function signImgPath(id) {
    const num = String(id).padStart(4, "0");
    // الصفحات داخل /tests => نرجع مستوى واحد ثم assets
    return `../assets/signs_lb/sign_${num}.webp`;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function qs(sel) { return document.querySelector(sel); }

  const elTitle = qs("#pageTitle");
  const elMeta  = qs("#metaBox");
  const elImg   = qs("#signImg");
  const elName  = qs("#signName");
  const elCat   = qs("#signCat");
  const elHint  = qs("#hint");

  const btnPrev = qs("#btnPrev");
  const btnNext = qs("#btnNext");
  const btnRand = qs("#btnRand");
  const btnSpeak = qs("#btnSpeak");
  const btnLang  = qs("#btnLang");

  // Quiz-only
  const quizBox = qs("#quizBox");
  const elQText = qs("#questionText");
  const elChoices = qs("#choices");
  const btnConfirm = qs("#confirmBtn");

  // Results-only
  const resultsBox = qs("#resultsBox");
  const elResultSummary = qs("#resultSummary");
  const elResultLines = qs("#resultLines");
  const btnRestart = qs("#btnRestart");
  const btnPdf = qs("#btnPdf");

  // Filters
  const catSel = qs("#catFilter");
  const searchInp = qs("#searchInp");
  const countSel = qs("#countSel");

  const errBox = qs("#errorBox");
  if (!Array.isArray(DATA) || DATA.length === 0) {
    if (errBox) errBox.textContent = "⚠️ لم يتم تحميل بيانات العلامات. تأكد من signs_data.js";
    return;
  }

  // ---- Language (AR/EN) ----
  let lang = "ar"; // default
  function getLabel(item){
    if (lang === "en" && item.en) return item.en;
    return item.ar || item.en || "—";
  }
  function toggleLang(){
    lang = (lang === "ar") ? "en" : "ar";
    if (btnLang) btnLang.textContent = (lang === "ar") ? "AR" : "EN";
    render();
  }

  // ---- Speech ----
  function speak(text){
    if (!("speechSynthesis" in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    // العربية أفضل مع ar-SA غالباً (متوفر على أغلب الأجهزة)
    u.lang = (lang === "ar") ? "ar-SA" : "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  // ---- Categories ----
  const categories = Array.from(new Set(DATA.map(x => x.category || "عام"))).sort((a,b)=>a.localeCompare(b,"ar"));
  if (catSel) {
    catSel.innerHTML = `<option value="__all__">كل الفئات</option>` +
      categories.map(c => `<option value="${c}">${c}</option>`).join("");
  }

  // ---- State ----
  let filtered = DATA.slice();
  let order = filtered.map(x => x.id);
  let idx = 0;

  // quiz state
  let selectedIndex = null;
  let confirmed = false;
  let score = 0;
  let answersLog = []; // [{id, img, correctText, selectedText, ok}]

  // ---- Load saved state (optional) ----
  function loadState(){
    try{
      const s = JSON.parse(localStorage.getItem(STORE_KEY) || "null");
      if (!s) return;
      if (typeof s.lang === "string") lang = s.lang;
      if (Array.isArray(s.order) && s.order.length) order = s.order;
      if (typeof s.idx === "number") idx = Math.min(Math.max(0, s.idx), Math.max(0, order.length-1));
      if (MODE === "quiz"){
        if (typeof s.score === "number") score = s.score;
        if (Array.isArray(s.answersLog)) answersLog = s.answersLog;
      }
    }catch(e){/* ignore */}
  }

  function saveState(){
    const payload = { lang, order, idx };
    if (MODE === "quiz") Object.assign(payload, { score, answersLog });
    try{ localStorage.setItem(STORE_KEY, JSON.stringify(payload)); }catch(e){/* ignore */}
  }

  loadState();
  if (btnLang) btnLang.textContent = (lang === "ar") ? "AR" : "EN";

  function applyFilters() {
    const c = catSel ? catSel.value : "__all__";
    const s = (searchInp ? searchInp.value : "").trim().toLowerCase();

    filtered = DATA.filter(item => {
      const catOk = (c === "__all__") || ((item.category || "عام") === c);
      if (!catOk) return false;
      if (!s) return true;
      const hay = `${item.ar||""} ${item.en||""} ${item.category||""}`.toLowerCase();
      return hay.includes(s);
    });

    order = filtered.map(x => x.id);

    if (order.length === 0) {
      if (errBox) errBox.textContent = "⚠️ لا توجد نتائج لهذا الفلتر.";
      return;
    }

    idx = 0;
    if (errBox) errBox.textContent = "";
    saveState();
    render();
  }

  function currentItem() {
    const id = order[idx];
    return filtered.find(x => x.id === id) || filtered[idx] || DATA[0];
  }

  function renderMeta() {
    if (!elMeta) return;
    elMeta.textContent = `الإشارة ${idx + 1} من ${order.length}`;
  }

  function showImage(item){
    if (!elImg) return;
    elImg.src = signImgPath(item.id);
    elImg.alt = getLabel(item);
    elImg.onerror = () => {
      if (errBox) errBox.textContent = "⚠️ صورة هذه الإشارة غير موجودة أو المسار غير صحيح.";
    };
  }

  function renderStudy() {
    const item = currentItem();
    if (elTitle) elTitle.textContent = "تعلم العلامات المرورية";
    if (elName) elName.textContent = getLabel(item);
    if (elCat) elCat.textContent = item.category || "عام";
    showImage(item);
    renderMeta();

    if (elHint) {
      elHint.textContent = "يمكنك تغيير اللغة أو الاستماع للنطق.";
      elHint.style.display = "block";
    }

    if (resultsBox) resultsBox.style.display = "none";
    if (quizBox) quizBox.style.display = "none";
    saveState();
  }

  function buildChoices(correctItem) {
    // 3 خيارات: واحدة صحيحة + 2 عشوائي
    const pool = filtered.filter(x => x.id !== correctItem.id);
    shuffle(pool);
    const wrong1 = pool[0] || correctItem;
    const wrong2 = pool[1] || correctItem;

    const choices = shuffle([
      { text: getLabel(correctItem), id: correctItem.id, correct: true },
      { text: getLabel(wrong1), id: wrong1.id, correct: false },
      { text: getLabel(wrong2), id: wrong2.id, correct: false },
    ]);

    return choices;
  }

  function renderQuiz() {
    const item = currentItem();

    if (elTitle) elTitle.textContent = "اختبار العلامات المرورية";
    if (elCat) elCat.textContent = item.category || "عام";
    if (elName) elName.textContent = ""; // بالاختبار نخفي الاسم
    showImage(item);
    renderMeta();

    confirmed = false;
    selectedIndex = null;
    if (btnConfirm) btnConfirm.disabled = true;

    if (resultsBox) resultsBox.style.display = "none";
    if (quizBox) quizBox.style.display = "block";

    if (elQText) elQText.textContent = "ما معنى هذه الإشارة؟";
    if (elHint){
      elHint.style.display = "block";
      elHint.textContent = "اختر إجابة ثم اضغط (تأكيد الإجابة).";
    }

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

    saveState();
  }

  function confirmAnswer() {
    if (confirmed) return;
    if (selectedIndex === null) return;

    confirmed = true;

    const item = currentItem();
    const correctId = Number(quizBox.dataset.correctId);
    const choices = JSON.parse(quizBox.dataset.choices || "[]");

    const picked = choices[selectedIndex];
    const ok = picked && picked.id === correctId;

    // ألوان + تعطيل
    [...elChoices.children].forEach((btn, i) => {
      btn.disabled = true;
      btn.classList.remove("correct","wrong");
      const c = choices[i];
      if (c && c.id === correctId) btn.classList.add("correct");
      if (i === selectedIndex && !ok) btn.classList.add("wrong");
    });

    if (ok) score++;

    answersLog.push({
      id: item.id,
      img: signImgPath(item.id),
      correctText: getLabel(item),
      selectedText: picked ? picked.text : "",
      ok: !!ok,
      category: item.category || "عام"
    });

    if (elHint){
      elHint.textContent = ok ? "✅ إجابة صحيحة" : "❌ إجابة خاطئة (الصحيح بالأخضر)";
    }

    if (btnConfirm) btnConfirm.disabled = true;
    saveState();
  }

  function finishQuiz() {
    if (!resultsBox) return;

    const total = order.length;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= 70; // عتبة نجاح قابلة للتعديل

    if (resultsBox) resultsBox.style.display = "block";
    if (quizBox) quizBox.style.display = "none";

    if (elResultSummary){
      elResultSummary.textContent = `نتيجتك: ${score} / ${total} (${percent}%) — ${passed ? "✅ ناجح" : "❌ راسب"}`;
    }

    if (elResultLines){
      elResultLines.innerHTML = "";
      answersLog.forEach((a, i) => {
        const row = document.createElement("div");
        row.className = "res-line";
        row.innerHTML = `
          <img src="${a.img}" alt="">
          <div class="res-txt">
            <div class="t">سؤال ${i+1} — <span class="tag ${a.ok ? "ok":"no"}">${a.ok ? "صحيح":"خطأ"}</span></div>
            <div class="s">
              <div>إجابتك: <b>${a.selectedText || "—"}</b></div>
              <div>الصحيح: <b>${a.correctText || "—"}</b></div>
              <div>الفئة: ${a.category}</div>
            </div>
          </div>
        `;
        elResultLines.appendChild(row);
      });
    }

    if (btnRestart) btnRestart.style.display = "inline-flex";
    if (btnPdf) btnPdf.style.display = "inline-flex";

    // progress full
    if (elMeta) elMeta.textContent = `انتهى الاختبار`;
    saveState();
  }

  function next() {
    if (MODE === "quiz" && !confirmed) return; // لازم تأكيد
    idx++;
    if (idx >= order.length) {
      if (MODE === "quiz") finishQuiz();
      else idx = 0;
      return;
    }
    render();
  }

  function prev() {
    idx--;
    if (idx < 0) idx = order.length - 1;
    render();
  }

  function randomizeOrder() {
    order = shuffle(order.slice());
    idx = 0;

    // بالاختبار: نعيد ضبط النتيجة والسجل
    if (MODE === "quiz"){
      score = 0;
      answersLog = [];
      confirmed = false;
      selectedIndex = null;
      if (btnConfirm) btnConfirm.disabled = true;
    }

    saveState();
    render();
  }

  function restartQuiz(){
    // يعيد الاختبار بنفس الفلتر والعدد
    score = 0;
    answersLog = [];
    confirmed = false;
    selectedIndex = null;
    idx = 0;
    // ترتيب جديد كل مرة
    order = shuffle(order.slice());
    saveState();
    render();
  }

  function savePdf(){
    const total = order.length;
    const percent = Math.round((score / total) * 100);
    const passed = percent >= 70;
    const now = new Date().toLocaleString("ar-LB");

    const w = window.open("", "_blank");
    if (!w) { alert("الرجاء السماح بفتح نافذة جديدة (Pop-up) لحفظ PDF."); return; }

    const rows = answersLog.map((a,i)=>`
      <div style="border:1px solid #ddd;border-radius:10px;padding:10px;margin:10px 0;">
        <div><b>سؤال ${i+1}</b> — <span style="color:${a.ok ? "#16a34a":"#dc2626"};font-weight:700">${a.ok ? "صحيح":"خطأ"}</span></div>
        <div style="margin-top:6px">إجابتك: <b>${a.selectedText||"—"}</b></div>
        <div>الصحيح: <b>${a.correctText||"—"}</b></div>
        <div style="color:#555">الفئة: ${a.category}</div>
      </div>
    `).join("");

    const html = `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>نتيجة اختبار العلامات</title>
  <style>
    body{font-family: Arial, sans-serif; direction:rtl; padding:24px}
    h1{margin:0 0 10px}
    .box{border:1px solid #ccc; padding:14px; border-radius:10px; margin-top:12px}
    .small{color:#555}
  </style>
</head>
<body>
  <h1>نتيجة اختبار العلامات المرورية</h1>
  <div class="box">
    <p>النتيجة: ${score} / ${total} (${percent}%) — ${passed ? "✅ ناجح" : "❌ راسب"}</p>
    <p class="small">التاريخ: ${now}</p>
  </div>
  ${rows}
  <script>window.onload = () => window.print();</script>
</body>
</html>`;
    w.document.open(); w.document.write(html); w.document.close();
  }

  function applyCount(){
    // يحدد عدد أسئلة الاختبار (مثلاً 20) من الفلتر الحالي
    if (!countSel) return;
    const n = Number(countSel.value);
    if (!n || n <= 0) return;

    const ids = filtered.map(x=>x.id);
    shuffle(ids);
    order = ids.slice(0, Math.min(n, ids.length));
    idx = 0;

    if (MODE === "quiz"){
      score = 0; answersLog = [];
    }
    saveState();
    render();
  }

  function render() {
    if (MODE === "quiz") renderQuiz();
    else renderStudy();
  }

  // ---- Events ----
  if (btnPrev) btnPrev.addEventListener("click", prev);
  if (btnNext) btnNext.addEventListener("click", next);
  if (btnRand) btnRand.addEventListener("click", randomizeOrder);

  if (btnConfirm) btnConfirm.addEventListener("click", confirmAnswer);
  if (btnRestart) btnRestart.addEventListener("click", restartQuiz);
  if (btnPdf) btnPdf.addEventListener("click", savePdf);

  if (btnSpeak) btnSpeak.addEventListener("click", () => {
    const item = currentItem();
    speak(getLabel(item));
  });
  if (btnLang) btnLang.addEventListener("click", toggleLang);

  if (catSel) catSel.addEventListener("change", applyFilters);
  if (searchInp) searchInp.addEventListener("input", applyFilters);
  if (countSel) countSel.addEventListener("change", applyCount);

  // ---- Start ----
  // بالاختبار: نجعل الترتيب عشوائي مرة واحدة عند أول فتح إذا لم يكن محفوظ
  if (MODE === "quiz" && (!localStorage.getItem(STORE_KEY))) {
    order = shuffle(order.slice());
  }
  render();
})();
