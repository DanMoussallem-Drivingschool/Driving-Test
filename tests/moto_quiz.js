// tests/moto_quiz.js

let idx = 0;
let score = 0;
let selected = null;
let confirmed = false;

// ✅ NEW (Random + Review)
let order = [];
let answers = []; // answers[originalIndex] = selectedIndex
const PASS_PERCENT = 80; // ✅ غيّرها: 70 / 75 / 80 ...

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

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ensureReviewContainer(){
  let box = document.getElementById("reviewBox");
  if (!box){
    box = document.createElement("div");
    box.id = "reviewBox";
    box.style.marginTop = "16px";
    box.style.display = "none";
    box.style.gap = "12px";
    box.style.flexDirection = "column";
    box.style.alignItems = "stretch";
    box.style.justifyContent = "flex-start";
    // حطّو بعد choices
    choicesEl.parentNode.appendChild(box);
  }
  return box;
}

function clearReview(){
  const box = document.getElementById("reviewBox");
  if (box){
    box.innerHTML = "";
    box.style.display = "none";
  }
}

function setMeta(){
  const total = MOTO_QUESTIONS.length; // ✅ 27
  metaRight.textContent = `السؤال ${idx + 1} من ${total}`;
  metaLeft.textContent = `النتيجة: ${score}`;
  const pct = Math.round(((idx + 1) / total) * 100);
  progressBar.style.width = `${pct}%`;
}

function resetChoiceStyles(){
  [...choicesEl.children].forEach(b => {
    b.classList.remove("selected","correct","wrong");
    b.disabled = false;
  });
}

function startQuiz(){
  if (!safeQuestions()) return;

  idx = 0;
  score = 0;
  selected = null;
  confirmed = false;

  const total = MOTO_QUESTIONS.length;

  // ✅ Random order لكل مرة
  order = shuffle([...Array(total).keys()]);
  answers = Array(total).fill(null);

  clearReview();

  restartBtn.style.display = "none";
  pdfBtn.style.display = "none";
  confirmBtn.style.display = "inline-block";
  nextBtn.style.display = "inline-block";

  render();
}

function render(){
  if (!safeQuestions()) return;

  clearReview();

  selected = null;
  confirmed = false;

  confirmBtn.disabled = true;
  nextBtn.disabled = true;

  hint.style.display = "none";
  hint.textContent = "";

  setMeta();

  const originalIndex = order[idx];
  const q = MOTO_QUESTIONS[originalIndex];

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

  const originalIndex = order[idx];
  const q = MOTO_QUESTIONS[originalIndex];

  answers[originalIndex] = selected; // ✅ حفظ إجابة المستخدم

  const correct = q.correct; // ✅ حسب بياناتك

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
  startQuiz(); // ✅ يعيد خلط الأسئلة
});

function finish(){
  choicesEl.innerHTML = "";

  const total = MOTO_QUESTIONS.length;
  const percent = Math.round((score / total) * 100);
  const passed = percent >= PASS_PERCENT;

  progressBar.style.width = "100%";

  metaRight.textContent = "انتهى الاختبار";
  metaLeft.textContent = `النتيجة: ${score}`;

  qEl.textContent = passed
    ? `✅ ناجح — نتيجتك: ${score} / ${total} (${percent}%)`
    : `❌ راسب — نتيجتك: ${score} / ${total} (${percent}%)`;

  hint.style.display = "block";
  hint.textContent = `شرط النجاح: ${PASS_PERCENT}% — اضغط إعادة الاختبار للمحاولة من جديد.`;

  // ✅ Review Box (بدون صور لأن بيانات moto غالبًا نص فقط)
  const reviewBox = ensureReviewContainer();
  reviewBox.innerHTML = "";
  reviewBox.style.display = "flex";

  MOTO_QUESTIONS.forEach((q, i) => {
    const userAns = answers[i];
    const correct = q.correct;

    const isCorrect = userAns === correct;
    const userText = (userAns === null) ? "لم تُجب" : q.choices[userAns];
    const correctText = q.choices[correct];

    const card = document.createElement("div");
    card.style.border = "1px solid rgba(255,255,255,.14)";
    card.style.borderRadius = "14px";
    card.style.padding = "12px";
    card.style.background = "rgba(255,255,255,.06)";

    card.innerHTML = `
      <div style="font-weight:800;margin-bottom:8px">سؤال ${q.id || (i+1)}: ${q.q}</div>
      <div style="margin-bottom:6px">
        <span style="font-weight:800">إجابتك:</span>
        <span style="${isCorrect ? 'color:#22c55e' : 'color:#ef4444'}">${userText}</span>
      </div>
      <div>
        <span style="font-weight:800">الصحيح:</span>
        <span style="color:#22c55e">${correctText}</span>
      </div>
    `;

    reviewBox.appendChild(card);
  });

  restartBtn.style.display = "inline-block";
  pdfBtn.style.display = "inline-block";
  confirmBtn.style.display = "none";
  nextBtn.style.display = "none";
}

pdfBtn.addEventListener("click", () => {
  const total = MOTO_QUESTIONS.length;
  const percent = Math.round((score / total) * 100);
  const passed = percent >= PASS_PERCENT;

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
        .ok{color:#16a34a;font-weight:700}
        .bad{color:#dc2626;font-weight:700}
      </style>
    </head>
    <body>
      <h1>نتيجة اختبار الدراجات النارية</h1>
      <div class="box">
        <p>عدد الأسئلة: ${total}</p>
        <p>النتيجة: ${score} / ${total} (${percent}%)</p>
        <p>الحالة: <span class="${passed ? "ok" : "bad"}">${passed ? "ناجح" : "راسب"}</span></p>
        <p class="small">شرط النجاح: ${PASS_PERCENT}%</p>
        <p class="small">التاريخ: ${new Date().toLocaleString("ar-LB")}</p>
      </div>
      <script>window.onload=()=>window.print();</script>
    </body>
  </html>`;
  w.document.open(); w.document.write(html); w.document.close();
});

// start
startQuiz();
