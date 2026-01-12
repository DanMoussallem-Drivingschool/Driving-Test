// 1) عدّل هذه المعلومات فقط
const settings = {
  schoolName: "مدرسة القيادة الجديدة",
  tagline: "تدرّب على أسئلة الامتحان النظري بسهولة",
  phoneText: "03 850 939",
  phoneTel: "+9613850939",
  mapUrl: "https://maps.google.com/?q=Dekwene"
};

// 2) ربط الإعدادات بالواجهة
document.getElementById("schoolName").textContent = settings.schoolName;
document.getElementById("tagline").textContent = settings.tagline;

const phoneLink = document.getElementById("phoneLink");
phoneLink.textContent = "📞 " + settings.phoneText;
phoneLink.href = "tel:" + settings.phoneTel;

const mapLink = document.getElementById("mapLink");
mapLink.href = settings.mapUrl;

document.getElementById("year").textContent = new Date().getFullYear();
