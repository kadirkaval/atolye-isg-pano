// 1. AYARLAR
// ==========================================
const SHEET_ID = "1YhQ-xwReHBYPVhw4CmaSwgynWl1TuCbmCPaCRCvS_Uo";

// DERS SAATLERİ
const schedule = [];
shludeVerisiGeldi = function (json) {
  const rows = json.table.rows.slice(1); // Başlıkları at
  const veriler = rows.map((row) => ({
    no: row.c[0] ? row.c[0].v : "",
    start: row.c[1] ? row.c[1].v : "",
    end: row.c[2] ? row.c[2].v : "",
  }));
  schedule.length = 0;
  veriler.forEach((item) => {
    if (item.no && item.start && item.end) {
      schedule.push({ no: item.no, start: item.start, end: item.end });
    }
  });
};
// ==========================================
// 2. SAAT VE DERS TAKİP SİSTEMİ
// ==========================================
function updateSystem() {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const seconds = now.getSeconds();

  // Tarih ve Saat Güncelle
  document.getElementById("saat").innerText = now.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  document.getElementById("tarih").innerText = now.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  });

  // Ders Durumu Hesapla
  const statusEl = document.getElementById("ders-adi");
  const countEl = document.getElementById("kalan-sure");
  const barEl = document.getElementById("ders-cubugu");
  const panelEl = document.getElementById("ders-durumu-paneli");

  let activeFound = false;

  for (let i = 0; i < schedule.length; i++) {
    const lesson = schedule[i];
    const [sh, sm] = lesson.start.split(":").map(Number);
    const [eh, em] = lesson.end.split(":").map(Number);
    const startMin = sh * 60 + sm;
    const endMin = eh * 60 + em;

    // HAFTA SONU KONTROLÜ
    if (now.getDay() === 0 || now.getDay() === 6) {
      statusEl.innerText = "HAFTA SONU";
      countEl.innerText = "İyi Tatiller";
      barEl.style.width = "0%";
      panelEl.style.background = "#7f8c8d";
      panelEl.className = "kutu";
      activeFound = true;
      break;
    }

    // DERSTE MİYİZ?
    if (currentMin >= startMin && currentMin < endMin) {
      const totalDuration = endMin - startMin;
      const elapsed = currentMin - startMin;
      const remaining = endMin - currentMin;
      const totalSec = totalDuration * 60;
      const elapsedSec = elapsed * 60 + seconds;
      const percent = (elapsedSec / totalSec) * 100;

      statusEl.innerText = `${lesson.no}. DERS`;
      countEl.innerText = `${remaining} dk kaldı`;
      barEl.style.width = `${percent}%`;
      barEl.innerText = `%${Math.floor(percent)}`;
      panelEl.className = "kutu ders-kutu";
      barEl.className =
        "progress-bar progress-bar-striped progress-bar-animated bg-warning";

      activeFound = true;
      break;
    }

    // TENEFFÜSTE MİYİZ?
    if (i < schedule.length - 1) {
      const nextLesson = schedule[i + 1];
      const [nSh, nSm] = nextLesson.start.split(":").map(Number);
      const nextStartMin = nSh * 60 + nSm;

      if (currentMin >= endMin && currentMin < nextStartMin) {
        const remaining = nextStartMin - currentMin;
        const totalDuration = nextStartMin - endMin;
        const percent =
          100 - ((remaining * 60 - seconds) / (totalDuration * 60)) * 100;

        statusEl.innerText = "TENEFFÜS";
        countEl.innerText = `${remaining} dk sonra ders`;
        barEl.style.width = `${percent}%`;
        barEl.innerText = "Dinlenme";
        panelEl.className = "kutu teneffus-kutu";
        barEl.className =
          "progress-bar progress-bar-striped progress-bar-animated bg-primary";

        activeFound = true;
        break;
      }
    }
  }

  if (!activeFound) {
    statusEl.innerText = "OKUL BİTTİ";
    countEl.innerText = "İyi Tatiller";
    barEl.style.width = "0%";
    panelEl.style.background = "#7f8c8d";
    panelEl.className = "kutu";
  }
}

setInterval(updateSystem, 1000);
updateSystem();

// ==========================================
// 3. GOOGLE SHEETS VERİ ÇEKME MOTORU
// ==========================================
function loadData(sheetName, query, callbackName) {
  const old = document.getElementById("script-" + sheetName);
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "script-" + sheetName;
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?sheet=${sheetName}&tq=${encodeURIComponent(
    query
  )}&tqx=responseHandler:${callbackName}&_=${Date.now()}`;
  script.src = url;
  document.body.appendChild(script);
}

// --- A. UYARILAR ---
let isgSlaytlar = [];
let isgIndex = 0;

function isgVerisiGeldi(json) {
  const rows = json.table.rows.slice(1);

  isgSlaytlar = rows
    .map((r) => ({
      baslik: r.c[0] ? r.c[0].v : "",
      metin: r.c[1] ? r.c[1].v : "",
      resim: r.c[2] ? r.c[2].v : "",
    }))
    .filter((item) => item.baslik && item.resim);

  if (isgSlaytlar.length > 0 && !window.slaytInterval) {
    slaytGoster();
    window.slaytInterval = setInterval(slaytGoster, 10000);
  }
}

function slaytGoster() {
  if (isgSlaytlar.length === 0) return;
  const veri = isgSlaytlar[isgIndex];

  document.getElementById("konu-basligi").innerText = veri.baslik;
  document.getElementById("aciklama-metni").innerText = veri.metin;

  const imgEl = document.getElementById("ana-gorsel");
  if (veri.resim.startsWith("http")) {
    imgEl.src = veri.resim;
  } else {
    imgEl.src = "img/" + veri.resim;
  }
  isgIndex = (isgIndex + 1) % isgSlaytlar.length;
}

// --- B. NÖBETÇİLER ---
function nobetciVerisiGeldi(json) {
  try {
    const rows = json.table.rows;
    const gunler = [
      "Pazar",
      "Pazartesi",
      "Salı",
      "Çarşamba",
      "Perşembe",
      "Cuma",
      "Cumartesi",
    ];
    const bugunIndex = new Date().getDay();
    const bugunIsmi = gunler[bugunIndex];

    const kayit = rows.find(
      (r) => r.c[0] && r.c[0].v.trim().toLowerCase() === bugunIsmi.toLowerCase()
    );

    const mudurKutu = document.getElementById("mudur-yrd-isim");
    const ogretmenKutu = document.getElementById("nobetci-ogretmen-isim");

    if (kayit) {
      const mudurYrd = kayit.c[1] ? kayit.c[1].v : "-";
      const nobetci = kayit.c[2] ? kayit.c[2].v : "-";
      mudurKutu.innerText = mudurYrd;
      ogretmenKutu.innerText = nobetci;
    } else {
      mudurKutu.innerText = "-";
      ogretmenKutu.innerText = "Tatil / Haftasonu";
    }
  } catch (e) {
    console.error("Nöbetçi verisi hatası:", e);
  }
}

// --- C. DUYURULAR (KAYAN YAZI) - YENİ ÖZELLİK ---
function duyuruVerisiGeldi(json) {
  try {
    // Başlık satırını (1. satır) atla
    const rows = json.table.rows.slice(1);

    // Sadece A sütunundaki (c[0]) dolu verileri al
    const duyurular = rows
      .map((r) => (r.c[0] ? r.c[0].v : ""))
      .filter((metin) => metin !== ""); // Boşları temizle

    // Duyuruları birleştir
    if (duyurular.length > 0) {
      // Araya ayırıcı koyarak birleştir
      const kayanYaziMetni = duyurular.join(" --- *** --- ");
      document.getElementById("kayan-yazi").innerText = kayanYaziMetni;
    } else {
      document.getElementById("kayan-yazi").innerText =
        "ATÖLYE GÜVENLİK KURALLARINA UYUNUZ... BAŞARILAR DİLERİZ...";
    }
  } catch (e) {
    console.error("Duyuru verisi hatası:", e);
  }
}

// --- BAŞLATMA ---
function refreshData() {
  loadData("Uyarilar", "", "isgVerisiGeldi");
  loadData("Nobetciler", "", "nobetciVerisiGeldi");
  // Duyurular sekmesinden sadece A sütununu çek
  loadData("Duyurular", "", "duyuruVerisiGeldi");
  loadData("DersProgrami", "", "shludeVerisiGeldi");
}

refreshData();
setInterval(refreshData, 60000);

// İMZA
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById(
    "hazirlayan"
  ).innerHTML = `<i class="fas fa-code"></i>Kadir KAVAL <i class="fas fa-code"></i>`;
  console.log("Hazırlayan: Kadir KAVAL - Bilişim Teknolojileri");
});
