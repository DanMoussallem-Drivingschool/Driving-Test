// moto_quiz.js

let idx = 0;
let score = 0;
let locked = false;

const qEl = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");
const progressEl = document.getElementById("progress");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const resultHint = document.getElementById("resultHint");
const savePdfBtn = document.getElementById("savePdfBtn");

function render(){
  locked = false;
  nextBtn.disabled = true;

  const q = MOTO_QUESTIONS[idx];
  progressEl.textContent = `سؤال ${idx + 1} من ${MOTO_QUESTIONS.length}`;
  qEl.textContent = q.q;

  choicesEl.innerHTML = "";
  q.choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = text;

    btn.addEventListener("click", () => pick(i, btn));
    choicesEl.appendChild(btn);
  });
}

function pick(i, btn){
  if (locked) return;
  locked = true;
  nextBtn.disabled = false;

  const correct = MOTO_QUESTIONS[idx].correct;

  // reset styles
  [...choicesEl.children].forEach(b => {
    b.style.borderColor = "rgba(255,255,255,.14)";
    b.style.transform = "none";
    b.style.opacity = "0.92";
  });

  // highlight chosen
  btn.style.opacity = "1";
  btn.style.transform = "translateY(-2px)";

  // show correct/wrong
  if (i === correct) {
    score++;
    btn.style.borderColor = "rgba(34,197,94,.95)";
  } else {
    btn.style.borderColor = "rgba(239,68,68,.95)";
    // highlight correct
    const correctBtn = choicesEl.children[correct];
    if (correctBtn) correctBtn.style.borderColor = "rgba(34,197,94,.95)";
  }
}

nextBtn.addEventListener("click", () => {
  if (!locked) return;
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
  nextBtn.style.display = "inline-flex";
  render();
});

function finish(){
  choicesEl.innerHTML = "";
  progressEl.textContent = "انتهى الاختبار ✅";
  qEl.textContent = "شكراً! يمكنك إعادة الاختبار أو حفظ النتيجة PDF.";

  const percent = Math.round((score / MOTO_QUESTIONS.length) * 100);
  resultHint.style.display = "block";
  resultHint.textContent = `نتيجتك: ${score} / ${MOTO_QUESTIONS.length} (${percent}%)`;

  restartBtn.style.display = "inline-flex";
  savePdfBtn.style.display = "inline-flex";
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

