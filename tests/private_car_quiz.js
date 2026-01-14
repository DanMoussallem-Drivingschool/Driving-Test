// tests/private_car_quiz.js

const QUESTIONS = window.PRIVATE_CAR_QUESTIONS || [];
const total = QUESTIONS.length;

let idx = 0;
let score = 0;
let selectedIndex = null;
let confirmed = false;

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

function render(){
  const q = QUESTIONS[idx];
  selectedIndex = null;
  confirmed = false;

  elScore.textContent = `النتيجة: ${score}`;
  elProg.textContent = `السؤال ${idx+1} من ${total}`;
  elBar.style.width = `${((idx+1)/total)*100}%`;

  elQ.textContent = q.q;
  elHint.textContent = "";

  // image
  if(q.img){
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
      if(confirmed) return;
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
  if(selectedIndex === null || confirmed) return;

  confirmed = true;
  const q = QUESTIONS[idx];

  const btns = [...elChoices.querySelectorAll(".btn")];
  const correct = q.correctIndex;

  // mark
  btns.forEach((b, i) => {
    if(i === correct) b.classList.add("correct");
    if(i === selectedIndex && i !== correct) b.classList.add("wrong");
    b.style.outline = "none";
  });

  if(selectedIndex === correct){
    score += 1;
    elHint.textContent = "✅ إجابة صحيحة";
  } else {
    elHint.textContent = "❌ إجابة خاطئة";
  }

  elScore.textContent = `النتيجة: ${score}`;
  nextBtn.disabled = false;
  confirmBtn.disabled = true;
}

function next(){
  if(!confirmed) return;

  if(idx < total - 1){
    idx += 1;
    render();
  } else {
    // done
    elQ.textContent = `انتهى الاختبار ✅ نتيجتك: ${score} من ${total}`;
    elChoices.innerHTML = "";
    imgWrap.style.display = "none";
    elHint.textContent = "اضغط (إعادة الاختبار) للمحاولة من جديد.";
    confirmBtn.disabled = true;
    nextBtn.disabled = true;
  }
}

function restart(){
  idx = 0;
  score = 0;
  render();
}

confirmBtn.addEventListener("click", confirm);
nextBtn.addEventListener("click", next);
restartBtn.addEventListener("click", restart);

render();

