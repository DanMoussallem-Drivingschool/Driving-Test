// tests/private_car_quiz.js

const QUESTIONS = window.PRIVATE_CAR_QUESTIONS || [];
const total = QUESTIONS.length;

let idx = 0;
let score = 0;
let selectedIndex = null;
let confirmed = false;

// ✅ NEW (Random + Review)
let order = [];
let answers = []; // answers[originalIndex] = selectedIndex
const PASS_PERCENT = 80; // ✅ غيّرها: 70 / 75 / 80 ...

const elScore = document.getElementById("scoreBox");
const elProg = document.getElementById("progressBox");
const elBar = document.getElementById("bar");
const elQ = document.getElementById("questionText");
const elChoices = document.getElementById("choices");
const elHint = document.getElementById("hintBox");

const confirmBtn = document.getElementById("confirmBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

const imgWrap = document.getElementById("qImageWrap");
const imgEl = document.getElementById("qImage");

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
    box.style.marginTop = "18px";
    box.style.display = "none";
    box.style.gap = "12px";
    box.style.flexDirection = "column";
    box.style.alignItems = "stretch";
    box.style.justifyContent = "flex-start";
    box.style.display = "none";
    // نحطه بعد choices
    elChoices.parentNode.appendChild(box);
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

function startQuiz(){
  if (!Array.isArray(QUESTIONS) || QUESTIONS.length === 0){
    elQ.textContent = "⚠️ لم يتم تحميل أسئلة الخصوصي. تأكد من private_car_questions.js والمسار.";
    elChoices.innerHTML = "";
    imgWrap.style.display = "none";
    elHint.textContent = "";
    confirmBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  idx = 0;
  score = 0;
  selectedIndex = null;
  confirmed = false;

  // ✅ Random order لكل مرة
  order = shuffle([...Array(total).keys()]);
  answers = Array(total).fill(null);

  clearReview();
  render();
}

function render(){
  clearReview();

  const originalIndex = order[idx];
  const q = QUESTIONS[originalIndex];

  selectedIndex = null;
  confirmed = false;

  elScore.textContent = `النتيجة: ${score}`;
  elProg.textContent = `السؤال ${idx + 1} من ${total}`;
  elBar.style.width = `${((idx + 1) / total) * 100}%`;

  elQ.textContent = q.q;
  elHint.textContent = "";

  // image
  if (q.img){
    imgEl.src = q.img;
    imgWrap.style.display = "block";
  } else {
    imgWrap.style.display = "none";
    imgEl.removeAttribute("src");
  }

  elChoices.innerHTML = "";
  q.choices.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.type = "button";
    btn.textContent = c;

    btn.addEventListener("click", () => {
      if (confirmed) return;
      selectedIndex = i;

      // reset styles
      [...elChoices.querySelectorAll(".btn")].forEach(b => b.style.outline = "none");
      btn.style.outline = "3px solid rgba(79,140,255,.45)";

      confirmBtn.disabled = false;
      elHint.textContent = "اضغط (تأكيد الإجابة) ثم (السؤال التالي).";
    });

    elChoices.appendChild(btn);
  });

  confirmBtn.disabled = true;
  nextBtn.disabled = true;
}

function confirm(){
  if (selectedIndex === null || confirmed) return;

  confirmed = true;

  const originalIndex = order[idx];
  const q = QUESTIONS[originalIndex];
  answers[originalIndex] = selectedIndex; // ✅ حفظ إجابة المستخدم

  const btns = [...elChoices.querySelectorAll(".btn")];
  const correct = q.correctIndex;

  // mark
  btns.forEach((b, i) => {
    if (i === correct) b.classList.add("correct");
    if (i === selectedIndex && i !== correct) b.classList.add("wrong");
    b.style.outline = "none";
  });

  if (selectedIndex === correct){
    score += 1;
    elHint.textContent = "✅ إجابة صحيحة";
  } else {
    elHint.textContent = "❌ إجابة خاطئة";
  }

  elScore.textContent = `النتيجة: ${score}`;
  nextBtn.disabled = false;
  confirmBtn.disabled = true;
}

function finish(){
  // hide question UI
  elChoices.innerHTML = "";
  imgWrap.style.display = "none";

  const percent = Math.round((score / total) * 100);
  const passed = percent >= PASS_PERCENT;

  elProg.textContent = "انتهى الاختبار ✅";
  elBar.style.width = "100%";

  elQ.textContent = passed
    ? `✅ ناجح — نتيجتك: ${score} من ${total} (${percent}%)`
    : `❌ راسب — نتيجتك: ${score} من ${total} (${percent}%)`;

  elHint.textContent = `شرط النجاح: ${PASS_PERCENT}%`;

  // ✅ Review Box
  const reviewBox = ensureReviewContainer();
  reviewBox.innerHTML = "";
  reviewBox.style.display = "flex";

  QUESTIONS.forEach((q, i) => {
    const userAns = answers[i];
    const correct = q.correctIndex;

    const isCorrect = userAns === correct;
    const userText = (userAns === null) ? "لم تُجب" : q.choices[userAns];
    const correctText = q.choices[correct];

    const card = document.createElement("div");
    card.style.border = "1px solid rgba(255,255,255,.14)";
    card.style.borderRadius = "14px";
    card.style.padding = "12px";
    card.style.background = "rgba(255,255,255,.06)";

    const imgHtml = q.img
      ? `<div style="text-align:center;margin-bottom:10px">
           <img src="${q.img}" style="max-width:260px;width:100%;background:#fff;border-radius:12px;border:1px solid rgba(0,0,0,.08)" />
         </div>`
      : "";

    card.innerHTML = `
      ${imgHtml}
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

  confirmBtn.disabled = true;
  nextBtn.disabled = true;
}

function next(){
  if (!confirmed) return;

  if (idx < total - 1){
    idx += 1;
    render();
  } else {
    finish();
  }
}

function restart(){
  startQuiz(); // ✅ يعيد خلط الأسئلة
}

confirmBtn.addEventListener("click", confirm);
nextBtn.addEventListener("click", next);
restartBtn.addEventListener("click", restart);

// start
startQuiz();
