// Year
document.getElementById("year").textContent = new Date().getFullYear();

/*
Later (optional): bilingual support.
Example idea:
- Put translations here
- Choose language and replace elements having data-i18n="..."

const translations = {
  ar: { choose_test: "اختر نوع الاختبار", ... },
  en: { choose_test: "Choose your test type", ... }
};

function setLang(lang){
  document.querySelectorAll("[data-i18n]").forEach(el=>{
    const key = el.getAttribute("data-i18n");
    if(translations[lang] && translations[lang][key]) el.textContent = translations[lang][key];
  });
}
*/
