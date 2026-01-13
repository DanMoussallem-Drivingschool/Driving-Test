// tests/moto_quiz.js

let idx = 0;
let score = 0;
let selected = null;
let confirmed = false;

const qEl = document.getElementById("questionText");
const choicesEl = document.getElementById("choices");

const confirmBtn = document.getElementById("confirmBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const savePdfBtn = document.getElementById("savePdfBtn");

const resultHint = document.getElementById("resultHint");
const metaLeft = document.getElementById("metaLeft");
const metaRight = document.getElementById("metaRight");
const progressBar = document.getElementById("progressBar");

function setMeta(){
  metaRight.textContent = `السؤال ${idx + 1} من ${MOTO_QUESTIONS.length}`;
  metaLeft.textContent  = `النتيجة: ${score}`;
  const pct = Math.round((idx / MOTO_QUESTIONS.length) * 100);
  progressBar.style.width = `${pct}%`;
}

function resetChoiceStyles(){
  [...choicesEl.children].forEach(b => {
    b.classList.remove("correct","wrong","selected");
    b.style.borderColor = "rgba(255,255,255,.14)";
    b.style.opacity = "0.92";
    b.style.transform = "none";
    b.disabled = false;
  });
}

function render(){
  selected = null;
  confirmed = false;

  confirmBtn.disabled = true;
  nextBtn.disabled = true;

  const q = MOTO_QUESTIONS[idx];
  setMeta();

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

      resetChoiceStyles();

      btn.classList.add("selected");
      btn.style.opacity = "1";
      btn.style.transform = "translateY(-2px)";
      btn.style.borderColor = "rgba(168,85,247,.85)"; // بنفسجي
    });

    choicesEl.appendChild(btn);
  });

  resultHint.style.display = "none";
}

confirmBtn.addEventListener("click", () => {
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
    selectedBtn.style.borderColor = "rgba(34,197,94,.9)";
    resultHint.style.display = "block";
    resultHint.textContent = "✅ إجابة صحيحة";
  } else {
    selectedBtn.classList.add("wrong");
    selectedBtn.style.borderColor = "rgba(239,68,68,.95)";
    if (correctBtn){
      correctBtn.classList.add("correct");
      correctBtn.style.borderColor = "rgba(34,197,94,.9)";
    }
    resultHint.style.display = "block";
    resultHint.textContent = "❌ إجابة خاطئة (تم تمييز الإجابة الصحيحة بالأخضر)";
  }

  setMeta();
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
  confirmBtn.style.display = "inline-flex";
  nextBtn.style.display = "inline-flex";

  progressBar.style.width = "0%";
  render();
});

function finish(){
  choicesEl.innerHTML = "";
  qEl.textContent = "انتهى الاختبار ✅";

  progressBar.style.width = "100%";
  metaRight.textContent = `انتهى الاختبار`;
  metaLeft.textContent  = `النتيجة: ${score}`;

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
