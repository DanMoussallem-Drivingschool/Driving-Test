// tests/moto_quiz.js

let idx = 0;
let score = 0;
let selected = null;
let confirmed = false;

const qEl = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");
const metaLeft = document.getElementById("metaLeft");
const metaRight = document.getElementById("metaRight");
const progressBar = document.getElementById("progressBar");
const hint = document.getElementById("hint");

const confirmBtn = document.getElementById("confirmBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const pdfBtn = document.getElementById("pdfBtn");

function safeQuestions(){
  if (!window.MOTO_QUESTIONS || !Array.isArray(MOTO_QUESTIONS) || MOTO_QUESTIONS.length === 0){
    qEl.textContent = "⚠️ لم يتم تحميل أسئلة الدراجات. تأكد أن moto_questions.js موجود داخل tests وأن المسار صحيح.";
    choicesEl.innerHTML = "";
    metaRight.textContent = "السؤال 0 من 0";
    metaLeft.textContent = "النتيجة: 0";
    progressBar.style.width = "0%";
    confirmBtn.disabled = true;
    nextBtn.disabled = true;
    return false;
  }
  return true;
}

function setMeta(){
  const total = MOTO_QUESTIONS.length; // ✅ 27
  metaRight.textContent = `السؤال ${idx + 1} من ${total}`;
  metaLeft.textContent = `النتيجة: ${score}`;
  const pct = Math.round((idx / total) * 100);
  progressBar.style.width = `${pct}%`;
}

function resetChoiceStyles(){
  [...choicesEl.children].forEach(b => {
    b.classList.remove("selected","correct","wrong");
    b.disabled = false;
  });
}

function render(){
  if (!safeQuestions()) return;

  selected = null;
  confirmed = false;

  confirmBtn.disabled = true;
  nextBtn.disabled = true;

  hint.style.display = "none";
  hint.textContent = "";

  setMeta();

  const q = MOTO_QUESTIONS[idx];
  qEl.textContent = q.q;

  choicesEl.innerHTML = "";
  q.choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "choice-btn";
    btn.type = "button";
    btn.textContent = text;

    btn.addEventListener("click", () => {
      if (confirmed) return;
      selected = i;
      confirmBtn.disabled = false;

      resetChoiceStyles();
      btn.classList.add("selected");
    });

    choicesEl.appendChild(btn);
  });
}

confirmBtn.addEventListener("click", () => {
  if (!safeQuestions()) return;
  if (selected === null || confirmed) return;

  confirmed = true;
  nextBtn.disabled = false;

  const correct = MOTO_QUESTIONS[idx].correct;

  // تعطيل كل الخيارات بعد التأكيد
  [...choicesEl.children].forEach(b => b.disabled = true);

  const selectedBtn = choicesEl.children[selected];
  const correctBtn = choicesEl.children[correct];

  if (selected === correct){
    score++;
    selectedBtn.classList.add("correct");
    hint.style.display = "block";
    hint.textContent = "✅ إجابة صحيحة";
  } else {
    selectedBtn.classList.add("wrong");
    if (correctBtn) correctBtn.classList.add("correct");
    hint.style.display = "block";
    hint.textContent = "❌ إجابة خاطئة (الإجابة الصحيحة باللون الأخضر)";
  }

  setMeta();
});

nextBtn.addEventListener("click", () => {
  if (!safeQuestions()) return;
  if (!confirmed) return;

  idx++;
  if (idx >= MOTO_QUESTIONS.length) finish();
  else render();
});

restartBtn.addEventListener("click", () => {
  idx = 0;
  score = 0;

  restartBtn.style.display = "none";
  pdfBtn.style.display = "none";
  confirmBtn.style.display = "inline-block";
  nextBtn.style.display = "inline-block";

  render();
});

function finish(){
  choicesEl.innerHTML = "";
  qEl.textContent = "انتهى الاختبار ✅";
  progressBar.style.width = "100%";

  metaRight.textContent = "انتهى الاختبار";
  metaLeft.textContent = `النتيجة: ${score}`;

  const total = MOTO_QUESTIONS.length;
  const percent = Math.round((score / total) * 100);

  hint.style.display = "block";
  hint.textContent = `نتيجتك: ${score} / ${total} (${percent}%)`;

  restartBtn.style.display = "inline-block";
  pdfBtn.style.display = "inline-block";
  confirmBtn.style.display = "none";
  nextBtn.style.display = "none";
}

pdfBtn.addEventListener("click", () => {
  const total = MOTO_QUESTIONS.length;
  const percent = Math.round((score / total) * 100);

  const w = window.open("", "_blank");
  const html = `
  <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>نتيجة اختبار الدراجات</title>
      <style>
        body{font-family:Arial; direction:rtl; padding:24px}
        h1{margin:0 0 12px}
        .box{border:1px solid #ccc; padding:14px; border-radius:10px; margin-top:12px}
        .small{color:#555}
      </style>
    </head>
    <body>
      <h1>نتيجة اختبار الدراجات النارية</h1>
      <div class="box">
        <p>عدد الأسئلة: ${total}</p>
        <p>النتيجة: ${score} / ${total} (${percent}%)</p>
        <p class="small">التاريخ: ${new Date().toLocaleString("ar-LB")}</p>
      </div>
      <script>window.onload=()=>window.print();</script>
    </body>
  </html>`;
  w.document.open(); w.document.write(html); w.document.close();
});

// تشغيل
render();
