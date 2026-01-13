let idx = 0;
let score = 0;
let selected = null;
let confirmed = false;

const TOTAL = Math.min(MOTO_QUESTIONS.length,27);

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
  selected=null; confirmed=false;
  confirmBtn.disabled=true; nextBtn.disabled=true;

  const q=MOTO_QUESTIONS[idx];
  progressEl.textContent=`سؤال ${idx+1} من ${TOTAL}`;
  scoreMiniEl.textContent=`النتيجة: ${score}/${TOTAL}`;
  qEl.textContent=q.q;

  choicesEl.innerHTML="";
  q.choices.forEach((t,i)=>{
    const b=document.createElement("button");
    b.className="btn";
    b.textContent=t;
    b.onclick=()=>{
      if(confirmed) return;
      selected=i; confirmBtn.disabled=false;
      [...choicesEl.children].forEach(x=>x.classList.remove("selected"));
      b.classList.add("selected");
    };
    choicesEl.appendChild(b);
  });
}

confirmBtn.onclick=()=>{
  if(selected===null||confirmed) return;
  confirmed=true; nextBtn.disabled=false;
  const correct=MOTO_QUESTIONS[idx].correct;
  if(selected===correct) score++;
  scoreMiniEl.textContent=`النتيجة: ${score}/${TOTAL}`;
};

nextBtn.onclick=()=>{
  if(!confirmed) return;
  idx++;
  if(idx>=TOTAL) finish();
  else render();
};

restartBtn.onclick=()=>{
  idx=0; score=0;
  restartBtn.style.display="none";
  savePdfBtn.style.display="none";
  resultHint.style.display="none";
  confirmBtn.style.display="inline-flex";
  nextBtn.style.display="inline-flex";
  render();
};

function finish(){
  qEl.textContent="تم إنهاء الاختبار.";
  choicesEl.innerHTML="";
  const pct=Math.round(score/TOTAL*100);
  resultHint.textContent=`نتيجتك: ${score}/${TOTAL} (${pct}%)`;
  resultHint.style.display="block";
  restartBtn.style.display="inline-flex";
  savePdfBtn.style.display="inline-flex";
  confirmBtn.style.display="none";
  nextBtn.style.display="none";
}

savePdfBtn.onclick=()=>{
  const pct=Math.round(score/TOTAL*100);
  const w=window.open("");
  w.document.write(`
  <html dir="rtl"><body>
  <h2>نتيجة اختبار الدراجات النارية</h2>
  <p>النتيجة: ${score}/${TOTAL} (${pct}%)</p>
  <script>window.print()</script>
  </body></html>
  `);
  w.document.close();
};

render();
