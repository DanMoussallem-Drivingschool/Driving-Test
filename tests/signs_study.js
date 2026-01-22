let signs = window.TRAFFIC_SIGNS || [];
let index = 0;

const imgEl = document.getElementById("signImg");
const nameEl = document.getElementById("signName");
const descEl = document.getElementById("signDesc");
const catEl = document.getElementById("signCat");

function render(){
  if(!signs.length){
    nameEl.textContent = "لا توجد إشارات";
    return;
  }

  const s = signs[index];
  imgEl.src = s.image;
  nameEl.textContent = s.name_ar;
  descEl.textContent = s.desc_ar;
  catEl.textContent = s.category_ar;
}

function nextSign(){
  index = (index + 1) % signs.length;
  render();
}

function prevSign(){
  index = (index - 1 + signs.length) % signs.length;
  render();
}

function randomSign(){
  index = Math.floor(Math.random() * signs.length);
  render();
}

render();

