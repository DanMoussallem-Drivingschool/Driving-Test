/* public_quiz.js
   Shared engine for Public Taxi tests (Test1/Test2/Test3).
   Requirements:
   - Each test page loads:
     1) its questions file (defines window.PUBLIC_QUESTIONS = [...])
     2) this file
*/

(function () {
  "use strict";

  const qs = window.PUBLIC_QUESTIONS;
  const title = window.QUIZ_TITLE || "اختبار";

  if (!Array.isArray(qs) || qs.length === 0) {
    console.error("PUBLIC_QUESTIONS is missing or empty.");
    const errBox = document.getElementById("pqError");
    if (errBox) errBox.textContent = "⚠️ لم يتم تحميل الأسئلة. تأكد من ملف الأسئلة والمسارات.";
    return;
  }

  // Elements
  const elTitle = document.getElementById("pqTitle");
  const elSub = document.getElementById("pqSub");
  const elMetaRight = document.getElementById("pqMetaRight");
  const elMetaLeft = document.getElementById("pqMetaLeft");
  const elProgress = document.getElementById("pqProgressBar");

  const elQuestion = document.getElementById("pqQuestion");
  const elChoices = document.getElementById("pqChoices");
  const elHint = document.getElementById("pqHint");

  const btnConfirm = document.getElementById("pqConfirm");
  const btnNext = document.getElementById("pqNext");
  const btnRestart = document.getElementById("pqRestart");
  const btnPdf = document.getElementById("pqPdf");

  const elResult = document.getElementById("pqResult");
  const elError = document.getElementById("pqError");

  // State
  let idx = 0;
  let score = 0;
  let selected = null;
  let confirmed = false;

  // Init header texts
  if (elTitle) elTitle.textContent = title;
  if (elSub) elSub.textContent = "اختر إجابة واحدة → أكد الإجابة → انتقل للسؤال التالي";

  function letter(i) {
    return i === 0 ? "أ" : i === 1 ? "ب" : "ج";
  }

  function setMeta() {
    elMetaRight.textContent = `السؤال ${idx + 1} من ${qs.length}`;
    elMetaLeft.textContent = `النتيجة: ${score}`;

    const pct = Math.round((idx / qs.length) * 100);
    elProgress.style.width = `${pct}%`;
  }

  function resetButtons() {
    btnConfirm.disabled = true;
    btnNext.disabled = true;
  }

  function render() {
    if (elError) elError.textContent = "";

    selected = null;
    confirmed = false;

    btnRestart.style.display = "none";
    btnPdf.style.display = "none";
    elResult.style.display = "none";

    btnConfirm.style.display = "inline-flex";
    btnNext.style.display = "inline-flex";

    resetButtons();
    setMeta();

    const q = qs[idx];
    if (!q) {
      console.error("Question not found at idx:", idx);
      if (elError) elError.textContent = "⚠️ خطأ في تحميل السؤال. راجع ملف الأسئلة.";
      return;
    }

    elQuestion.textContent = q.q;
    elHint.textContent = "اختر إجابة للمتابعة.";

    // Build choices
    elChoices.innerHTML = "";
    q.choices.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pq-choice";
      btn.dataset.index = String(i);
      btn.textContent = `${letter(i)}) ${text}`;

      btn.addEventListener("click", () => {
        if (confirmed) return;

        // clear old selection
        [...elChoices.querySelectorAll(".pq-choice")].forEach((b) => b.classList.remove("selected"));

        selected = i;
        btn.classList.add("selected");
        btnConfirm.disabled = false;
        elHint.textContent = "اضغط (تأكيد الإجابة) لمعرفة النتيجة.";
      });

      elChoices.appendChild(btn);
    });
  }

  function confirm() {
    if (selected === null || confirmed) return;

    confirmed = true;
    btnConfirm.disabled = true;
    btnNext.disabled = false;

    const correct = qs[idx].correct;

    const nodes = [...elChoices.querySelectorAll(".pq-choice")];
    const selectedBtn = nodes[selected];
    const correctBtn = nodes[correct];

    if (selected === correct) {
      score++;
      if (selectedBtn) selectedBtn.classList.add("correct");
      elHint.textContent = "✅ إجابة صحيحة.";
    } else {
      if (selectedBtn) selectedBtn.classList.add("wrong");
      if (correctBtn) correctBtn.classList.add("correct");
      elHint.textContent = `❌ إجابة خاطئة. الإجابة الصحيحة هي: ${letter(correct)}.`;
    }

    // Update meta after score change
    elMetaLeft.textContent = `النتيجة: ${score}`;
  }

  function next() {
    if (!confirmed) return;

    idx++;
    if (idx >= qs.length) finish();
    else render();
  }

  function finish() {
    elChoices.innerHTML = "";
    elHint.textContent = "";

    const percent = Math.round((score / qs.length) * 100);

    elQuestion.textContent = "انتهى الاختبار ✅";
    elResult.style.display = "block";
    elResult.textContent = `نتيجتك: ${score} / ${qs.length} (${percent}%)`;

    btnConfirm.style.display = "none";
    btnNext.style.display = "none";

    btnRestart.style.display = "inline-flex";
    btnPdf.style.display = "inline-flex";

    // progress full
    elProgress.style.width = "100%";
    elMetaRight.textContent = `انتهى`;
    elMetaLeft.textContent = `النتيجة النهائية: ${score}`;
  }

  function restart() {
    idx = 0;
    score = 0;
    selected = null;
    confirmed = false;
    render();
  }

  function savePdf() {
    const percent = Math.round((score / qs.length) * 100);
    const now = new Date().toLocaleString("ar-LB");

    const w = window.open("", "_blank");
    if (!w) {
      alert("الرجاء السماح بفتح نافذة جديدة (Pop-up) لحفظ PDF.");
      return;
    }

    const html = `
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8" />
  <title>نتيجة الاختبار</title>
  <style>
    body{font-family: Arial, sans-serif; direction:rtl; padding:24px}
    h1{margin:0 0 10px}
    .box{border:1px solid #ccc; padding:14px; border-radius:10px; margin-top:12px}
    .small{color:#555}
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="box">
    <p>عدد الأسئلة: ${qs.length}</p>
    <p>النتيجة: ${score} / ${qs.length} (${percent}%)</p>
    <p class="small">التاريخ: ${now}</p>
  </div>
  <script>
    window.onload = () => window.print();
  </script>
</body>
</html>`;

    w.document.open();
    w.document.write(html);
    w.document.close();
  }

  // Events
  btnConfirm.addEventListener("click", confirm);
  btnNext.addEventListener("click", next);
  btnRestart.addEventListener("click", restart);
  btnPdf.addEventListener("click", savePdf);

  // Start
  render();
})();

