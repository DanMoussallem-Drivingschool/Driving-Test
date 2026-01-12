function startQuizForm({ jsonPath, totalLimit = 30, quizId = "quiz" }) {
  const TEXT = {
    pick: "اختر إجابة للمتابعة.",
    confirmFirst: "اضغط على (تأكيد الإجابة) ثم (السؤال التالي).",
    correct: "✅ إجابة صحيحة",
    wrong: "❌ إجابة خاطئة",
    done: "انتهى الاختبار",
    last: "آخر نتيجة محفوظة على هذا الجهاز:"
  };

  let questions = [];
  let idx = 0;
  let score = 0;

  let selectedIndex = null;
  let confirmed = false;

  const progressEl = document.getElementById("progress");
  const miniScoreEl = document.getElementById("miniScore");
  const qEl = document.getElementById("question");
  const choicesEl = document.getElementById("choices");
  const msgEl = document.getElementById("msg");
  const barEl = document.getElementById("bar");

  const confirmBtn = document.getElementById("confirmBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pdfBtn = document.getElementById("pdfBtn");
  const restartBtn = document.getElementById("restartBtn");
  const lastResultEl = document.getElementById("lastResult");

  const storageKey = `drivequiz:${quizId}:lastResult`;

  // Load last result from localStorage (works on GitHub Pages)
  renderLastResult();

  fetch(jsonPath)
    .then(r => r.json())
    .then(data => {
      questions = data.slice(0, totalLimit);
      render();
    })
    .catch(() => {
      qEl.textContent = "تعذر تحميل الأسئلة. تأكد من وجود ملف البيانات.";
    });

  function render() {
    selectedIndex = null;
    confirmed = false;

    confirmBtn.disabled = true;
    nextBtn.disabled = true;

    choicesEl.innerHTML = "";
    msgEl.textContent = TEXT.pick;

    const q = questions[idx];
    progressEl.textContent = `السؤال ${idx + 1} من ${questions.length}`;
    miniScoreEl.textContent = `النتيجة: ${score}`;

    const percent = Math.round(((idx) / questions.length) * 100);
    barEl.style.width = `${percent}%`;

    qEl.textContent = q.q;

    q.choices.forEach((txt, cIndex) => {
      const id = `q${idx}_c${cIndex}`;

      const label = document.createElement("label");
      label.className = "choice";
      label.setAttribute("for", id);

      const input = document.createElement("input");
      input.type = "radio";
      input.name = "choice";
      input.id = id;
      input.value = String(cIndex);

      const span = document.createElement("div");
      span.className = "text";
      span.textContent = txt;

      input.addEventListener("change", () => {
        if (confirmed) return;

        selectedIndex = cIndex;
        confirmBtn.disabled = false;
        msgEl.textContent = TEXT.confirmFirst;

        document.querySelectorAll(".choice").forEach(el => el.classList.remove("selected"));
        label.classList.add("selected");
      });

      label.appendChild(input);
      label.appendChild(span);
      choicesEl.appendChild(label);
    });
  }

  confirmBtn.addEventListener("click", () => {
    if (selectedIndex === null || confirmed) return;
    confirmed = true;

    const q = questions[idx];
    const labels = Array.from(document.querySelectorAll(".choice"));

    // If answer key exists -> show correct/wrong
    if (typeof q.correct === "number") {
      labels.forEach((lab, i) => {
        lab.classList.remove("selected");
        if (i === q.correct) lab.classList.add("correct");
        if (i === selectedIndex && i !== q.correct) lab.classList.add("wrong");
      });

      if (selectedIndex === q.correct) {
        score++;
        miniScoreEl.textContent = `النتيجة: ${score}`;
        msgEl.textContent = TEXT.correct;
      } else {
        msgEl.textContent = TEXT.wrong;
      }
    } else {
      // no answers -> just allow next
      msgEl.textContent = "تم تأكيد اختيارك.";
    }

    nextBtn.disabled = false;
    confirmBtn.disabled = true;

    // Fill progress bar a bit
    const percent = Math.round(((idx + 1) / questions.length) * 100);
    barEl.style.width = `${percent}%`;
  });

  nextBtn.addEventListener("click", () => {
    if (!confirmed) return;

    idx++;
    if (idx >= questions.length) {
      finish();
      return;
    }
    render();
  });

  restartBtn.addEventListener("click", () => {
    idx = 0;
    score = 0;
    render();
  });

  function finish() {
    const total = questions.length;
    const percent = total ? Math.round((score / total) * 100) : 0;

    // Save last result locally
    const result = {
      date: new Date().toISOString(),
      score,
      total,
      percent
    };
    try {
      localStorage.setItem(storageKey, JSON.stringify(result));
    } catch (e) {}

    // Replace UI
    document.getElementById("captureArea").innerHTML = `
      <div class="topbar">
        <div class="progress">${TEXT.done}</div>
        <div class="score">النتيجة: ${score} / ${total}</div>
      </div>
      <div class="bar-wrap"><div class="bar" style="width:${percent}%;"></div></div>
      <div style="text-align:center;padding:16px 8px;">
        <div style="font-size:44px;font-weight:900;margin:10px 0 6px;">${percent}%</div>
        <div style="color:var(--muted);font-weight:800;margin-bottom:16px;">${score} من ${total}</div>
        <div style="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;">
          <button class="btn2" id="pdfBtn2">تحميل النتيجة PDF</button>
          <button class="btn2 ghost" onclick="location.reload()">إعادة المحاولة</button>
        </div>
        <p style="color:var(--muted);font-weight:700;margin-top:14px;">${TEXT.last}</p>
        <p style="color:var(--muted);font-weight:700;">${formatResult(result)}</p>
      </div>
    `;

    // re-bind pdf button on finish screen
    document.getElementById("pdfBtn2").addEventListener("click", exportPdf);
  }

  function renderLastResult() {
    const saved = safeGet(storageKey);
    if (!saved) {
      lastResultEl.textContent = "";
      return;
    }
    lastResultEl.innerHTML = `${TEXT.last}<br>${formatResult(saved)}`;
  }

  function safeGet(key) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : null;
    } catch (e) {
      return null;
    }
  }

  function formatResult(r) {
    const d = new Date(r.date);
    const dt = d.toLocaleString("ar-LB");
    return `التاريخ: ${dt} — النتيجة: ${r.score}/${r.total} — (${r.percent}%)`;
  }

  // PDF export: capture quiz card as image then put into PDF
  // html2canvas renders DOM to canvas :contentReference[oaicite:2]{index=2}
  // jsPDF generates PDF in browser :contentReference[oaicite:3]{index=3}
  async function exportPdf() {
    const capture = document.getElementById("captureArea");
    if (!capture || !window.html2canvas || !window.jspdf) {
      alert("ملفات PDF غير موجودة. تأكد من مجلد libs.");
      return;
    }

    const canvas = await window.html2canvas(capture, { scale: 2 });
    const imgData = canvas.toDataURL("image/png"); // MDN: canvas toDataURL :contentReference[oaicite:4]{index=4}

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");

    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();

    // Fit image to page with margins
    const margin = 10;
    const maxW = pageW - margin * 2;
    const maxH = pageH - margin * 2;

    // Image dimensions ratio
    const imgW = canvas.width;
    const imgH = canvas.height;
    const ratio = Math.min(maxW / imgW, maxH / imgH);

    const w = imgW * ratio;
    const h = imgH * ratio;

    const x = (pageW - w) / 2;
    const y = margin;

    pdf.addImage(imgData, "PNG", x, y, w, h);
    pdf.save("نتيجة-الاختبار.pdf");
  }

  pdfBtn.addEventListener("click", exportPdf);
}

window.startQuizForm = startQuizForm;
