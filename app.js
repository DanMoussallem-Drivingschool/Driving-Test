// Easy customization:
const settings = {
  schoolName: "مدرسة القيادة الجديدة",
  tagline: "تدرّب على أسئلة الامتحان النظري بسهولة"
};

document.getElementById("schoolName").textContent = settings.schoolName;
document.getElementById("tagline").textContent = settings.tagline;
document.getElementById("year").textContent = new Date().getFullYear();
