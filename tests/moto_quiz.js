// moto_quiz.js

let idx = 0;
let score = 0;
let selected = null;
let confirmed = false;

const qEl = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");
const progressEl = document.getElementById("progress");
const scoreMiniEl = document.getElementById("scoreMini");

const confirmBtn = document.getElementById("confirmBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const resultHint = document.getElementById("resultHint");
const savePdfBtn = document.getElementById("savePdfBtn");

function render(){
  selected = null;
  confirmed = false;

  confirmBtn.disabled = true;
  nextBtn.disabled = true;

  const q = MOTO_QUESTIONS[idx];
  progressEl.textContent = `سؤال ${idx + 1} من ${MOTO_QUESTIONS.length}`;
  scoreMiniEl.textContent = `النتيجة: ${score}/${MOTO_QUESTIONS.length}`;

  qEl.textContent = q.q;

  choicesEl.innerHTML = "";
  q.choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = text;

    btn.addEventListener("click", () => {
      if (confirmed) return;

      selected = i;
      confirmBtn.disabled = false;

      // إزالة التحديد القديم
      [...choicesEl.children].forEach(b => {
        b.style.borderColor = "rgba(255,255,255,.14)";
        b.style.opacity = "0.92";
        b.style.transform = "none";
      });

      // تمييز المختار
      btn.style.opacity = "1";
      btn.style.transform = "translateY(-2px)";
      btn.style.borderColor = "rgba(79,140,255,.75)";
    });

    choicesEl.appendChild(btn);
  });
}

confirmBtn.addEventListener("click", () => {
  if (selected === null || confirmed) return;

  confirmed = true;
  nextBtn.disabled = false;

  const correct = MOTO_QUESTIONS[idx].correct;

  const selectedBtn = choicesEl.children[selected];
  const correctBtn = choicesEl.children[correct];

  if (selected === correct){
    score++;
    selectedBtn.classList.add("correct");
  } else {
    selectedBtn.classList.add("wrong");
    if (correctBtn) correctBtn.classList.add("correct");
  }

  scoreMiniEl.textContent = `النتيجة: ${score}/${MOTO_QUESTIONS.length}`;
});

nextBtn.addEventListener("click", () => {
  if (!confirmed) return;
  idx++;

  if (idx >= MOTO_QUESTIONS.length) finish();
  else render();
});

restartBtn.addEventListener("click", () => {
  idx = 0;
  score = 0;

  restartBtn.style.display = "none";
  savePdfBtn.style.display = "none";
  resultHint.style.display = "none";

  confirmBtn.style.display = "inline-flex";
  nextBtn.style.display = "inline-flex";

  render();
});

function finish(){
  choicesEl.innerHTML = "";
  progressEl.textContent = "انتهى الاختبار ✅";
  qEl.textContent = "تم إنهاء الاختبار. يمكنك إعادة المحاولة أو تحميل النتيجة PDF.";

  const percent = Math.round((score / MOTO_QUESTIONS.length) * 100);
  resultHint.style.display = "block";
  resultHint.textContent = `نتيجتك: ${score} / ${MOTO_QUESTIONS.length} (${percent}%)`;

  restartBtn.style.display = "inline-flex";
  savePdfBtn.style.display = "inline-flex";

  confirmBtn.style.display = "none";
  nextBtn.style.display = "none";
}

savePdfBtn.addEventListener("click", () => {
  const percent = Math.round((score / MOTO_QUESTIONS.length) * 100);
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
        <p>عدد الأسئلة: ${MOTO_QUESTIONS.length}</p>
        <p>النتيجة: ${score} / ${MOTO_QUESTIONS.length} (${percent}%)</p>
        <p class="small">التاريخ: ${new Date().toLocaleString("ar-LB")}</p>
      </div>
      <script>
        window.onload = () => { window.print(); };
      </script>
    </body>
  </html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
});

// start
render();
