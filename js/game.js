"use strict";

/* =========================================================
   KONFIGURASI — ganti nilai di sini sesuai penerima
   ========================================================= */
const CONFIG = {
  judul: "Selamat Ulang Tahun",
  nama: "Naumi Sofia Omira",
  // Foto masa kecil, disimpan di dalam folder website
  fotoPath: "assets/images/naumi.jpeg",
  ucapan:
    "Semoga hari ini penuh dengan kebahagiaan, tawa, dan hal-hal baik yang selalu kamu impikan. Kamu selalu spesial!",
  // Gambar karakter milik Anda sendiri (PNG transparan). Jika file tidak ada,
  // maskot bawaan yang dipakai.
  karakterPath: "assets/images/stitch.png",
  // Karakter di layar "Game Selesai" dan di halaman ucapan. Kosongkan ('')
  // untuk memakai karakterPath.
  karakterSelesaiPath: "assets/images/st-love.png",
  karakterUcapanPath: "assets/images/stitch-ultah.png",
  // Kosongkan ('') untuk musik bawaan, atau isi path mp3, mis. 'assets/audio/birthday-music.mp3'
  musikPath: "assets/images/lagu.mp3",
};

const TOTAL_TAP = 7;
const HAPPY_COUNT = 4;
const IDLE_HINT_MS = 2500;
const FINISH_DELAY_MS = 2800;
const AUTO_NEXT_MS = 6000;
// Tombol "Main Lagi" di halaman ucapan muncul setelah jeda ini
const REPLAY_DELAY_MS = 14000;
const CONFETTI_COLORS = ["#ff6fa5", "#ffd23f", "#7fe0ff", "#9b7bff", "#7ddc7a"];

// Gambar hewan laut (menghadap kiri)
const ANIMAL_IMG = {
  gurita: "assets/images/hewan laut/gurita.png",
  hiu: "assets/images/hewan laut/hiu.png",
  uburUbur: "assets/images/hewan laut/ubur ubur.png",
  paus: "assets/images/hewan laut/paus.png",
};
const ANIMAL_TYPES = Object.keys(ANIMAL_IMG);
// Muat lebih awal agar hewan tidak telat muncul saat pertama kali tampil
Object.values(ANIMAL_IMG).forEach((src) => {
  new Image().src = src;
});

const FLASH_SVG = `<svg viewBox="0 0 100 100">
  <path d="M50 2 L58 30 L84 12 L70 40 L98 46 L70 58 L88 84 L58 70 L50 98 L42 70 L14 86 L30 58 L2 50 L30 40 L14 14 L42 30Z" fill="#fff"/>
  <circle cx="50" cy="50" r="20" fill="#ffe066"/>
  <circle cx="50" cy="50" r="10" fill="#fff"/>
</svg>`;

// Melodi sederhana buatan sendiri: [nada Hz, panjang dalam ketukan]
const MELODY = [
  [523, 1],
  [659, 0.5],
  [784, 0.5],
  [880, 1],
  [784, 1],
  [659, 1],
  [587, 1],
  [523, 2],
  [659, 0.5],
  [784, 0.5],
  [1047, 1],
  [880, 1],
  [784, 2],
];
const BEAT = 0.42;

/* ---------- Helper DOM ---------- */
const $ = (sel) => document.querySelector(sel);
const gameEl = $("#game");
const fxEl = $("#fx");
const animalsEl = $("#animals");
const cannonEl = $("#cannon");
const heroEl = $("#hero");
const counterEl = $("#counter");
const handEl = $("#hand");
const winEl = $("#win-text");
const muteBtn = $("#mute");

/* ---------- State game ---------- */
let shots = 0;
let lastType = null; // hewan sasaran terakhir
let finished = false;
let current = null; // { el, body } hewan yang sedang ada di laut
let idleTimer = null;
const heroImgs = {}; // gambar karakter milik pengguna yang berhasil dimuat, per path

/* ---------- Audio (Web Audio API, tanpa file) ---------- */
let audioCtx = null;
let masterGain = null;
let muted = false;
let musicEl = null;
let synthTimer = null;

function audio() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = muted ? 0 : 0.8;
    masterGain.connect(audioCtx.destination);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function tone({ freq, freqEnd, type = "sine", dur = 0.2, vol = 0.3, delay = 0, dest }) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(gain).connect(dest || masterGain);
  osc.start(t);
  osc.stop(t + dur + 0.05);
}

function noise({ dur = 0.25, vol = 0.3, delay = 0, cutoff = 1200 }) {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + delay;
  const buf = ac.createBuffer(1, Math.ceil(ac.sampleRate * dur), ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  const src = ac.createBufferSource();
  const filter = ac.createBiquadFilter();
  const gain = ac.createGain();
  src.buffer = buf;
  filter.type = "lowpass";
  filter.frequency.value = cutoff;
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(gain).connect(masterGain);
  src.start(t);
}

const sfx = {
  cannon() {
    tone({ freq: 180, freqEnd: 40, type: "square", dur: 0.3, vol: 0.12 });
    noise({ dur: 0.25, vol: 0.4, cutoff: 900 });
  },
  splash() {
    for (let i = 0; i < 5; i++) {
      tone({ freq: 400 + i * 150, freqEnd: 900 + i * 150, dur: 0.12, vol: 0.15, delay: i * 0.06 });
    }
    noise({ dur: 0.3, vol: 0.12, cutoff: 3000, delay: 0.02 });
  },
  hello() {
    tone({ freq: 520, freqEnd: 880, type: "triangle", dur: 0.12, vol: 0.25 });
    tone({ freq: 700, freqEnd: 1200, type: "triangle", dur: 0.14, vol: 0.25, delay: 0.13 });
  },
  boing() {
    tone({ freq: 220, freqEnd: 660, type: "sine", dur: 0.25, vol: 0.3 });
  },
  win() {
    [523, 659, 784, 1047, 1319].forEach((f, i) =>
      tone({ freq: f, type: "triangle", dur: 0.4, vol: 0.3, delay: i * 0.14 }),
    );
  },
};

function startMusic() {
  if (CONFIG.musikPath) {
    musicEl = new Audio(CONFIG.musikPath);
    musicEl.loop = true;
    musicEl.volume = 0.6;
    musicEl.muted = muted;
    // Jika file tidak ada atau diblokir, pakai musik bawaan
    musicEl.play().catch(startSynthMusic);
    return;
  }
  startSynthMusic();
}

function startSynthMusic() {
  const ac = audio();
  if (!ac || synthTimer) return;
  const musicGain = ac.createGain();
  musicGain.gain.value = 0.1;
  musicGain.connect(masterGain);
  let t = ac.currentTime + 0.1;
  let i = 0;
  const schedule = () => {
    while (t < ac.currentTime + 0.6) {
      const [freq, beats] = MELODY[i];
      const dur = beats * BEAT;
      tone({
        freq,
        type: "triangle",
        dur: dur * 0.9,
        vol: 0.5,
        delay: t - ac.currentTime,
        dest: musicGain,
      });
      t += dur;
      i = (i + 1) % MELODY.length;
    }
  };
  schedule();
  synthTimer = setInterval(schedule, 150);
}

function setMuted(value) {
  muted = value;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.8;
  if (musicEl) musicEl.muted = muted;
  muteBtn.textContent = muted ? "🔇" : "🔊";
  muteBtn.setAttribute("aria-label", muted ? "Nyalakan suara" : "Matikan suara");
}
muteBtn.addEventListener("click", () => setMuted(!muted));

/* ---------- Karakter ---------- */
// Layar "Game Selesai" memakai karakterSelesaiPath, halaman ucapan memakai
// karakterUcapanPath; selain itu, atau bila gambarnya tidak ada, karakterPath.
function heroImgFor(el) {
  const path = el.classList.contains("hero-finish")
    ? CONFIG.karakterSelesaiPath
    : el.classList.contains("hero-bday")
      ? CONFIG.karakterUcapanPath
      : CONFIG.karakterPath;
  return heroImgs[path] || heroImgs[CONFIG.karakterPath];
}

// Pasang gambar karakter pengguna ke semua .hero di dalam root
function dressHero(root) {
  root.querySelectorAll(".hero").forEach((el) => {
    const img = heroImgFor(el);
    if (img) el.replaceChildren(img.cloneNode());
  });
}

new Set([CONFIG.karakterPath, CONFIG.karakterSelesaiPath, CONFIG.karakterUcapanPath]).forEach(
  (path) => {
    if (!path) return;
    const img = new Image();
    img.alt = "";
    img.onload = () => {
      heroImgs[path] = img;
      dressHero(document);
    };
    img.src = path;
  },
);

/* ---------- Helper efek visual ---------- */
// Posisi di tengah (x, y) dengan setengah ukuran elemen
const pos = (x, y, half) => `translate(${x - half}px, ${y - half}px)`;
const pick = (list) => list[Math.floor(Math.random() * list.length)];

function fx(cls, layer = fxEl) {
  const el = document.createElement("i");
  el.className = cls;
  layer.appendChild(el);
  return el;
}

function animateFx(el, frames, opts) {
  return el.animate(frames, { fill: "forwards", ...opts }).finished.then(() => el.remove());
}

function relRect(el) {
  const r = el.getBoundingClientRect();
  const g = gameEl.getBoundingClientRect();
  return { left: r.left - g.left, top: r.top - g.top, width: r.width, height: r.height };
}

function muzzle() {
  const r = relRect(cannonEl);
  // Ujung laras meriam (koordinat relatif dari gambar meriam)
  return { x: r.left + r.width * 0.82, y: r.top + r.height * 0.12 };
}

function centerOf(el) {
  const r = relRect(el);
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

function randomSeaPoint() {
  return {
    x: gameEl.clientWidth * (0.25 + Math.random() * 0.5),
    y: gameEl.clientHeight * (0.4 + Math.random() * 0.15),
  };
}

function burst(x, y, count, scale = 1) {
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const d = (60 + Math.random() * 80) * scale;
    const tx = x + Math.cos(a) * d;
    const ty = y + Math.sin(a) * d;
    const kind = i % 3;
    let p;
    if (kind === 0) {
      // Garis percikan mengarah keluar
      p = fx("streak");
      const deg = (a * 180) / Math.PI + 90;
      animateFx(
        p,
        [
          { transform: `${pos(x, y, 3)} rotate(${deg}deg) scaleY(.4)`, opacity: 1 },
          { transform: `${pos(tx, ty, 3)} rotate(${deg}deg) scaleY(1)`, opacity: 0 },
        ],
        { duration: 500, easing: "cubic-bezier(.2,.7,.4,1)" },
      );
      continue;
    }
    if (kind === 1) {
      p = fx("twinkle");
      p.textContent = "✦";
    } else {
      p = fx("spark");
      p.style.background = pick(CONFETTI_COLORS);
    }
    animateFx(
      p,
      [
        { transform: pos(x, y, 5), opacity: 1 },
        { transform: pos(tx, ty, 5), opacity: 0 },
      ],
      { duration: 550 + Math.random() * 300, easing: "cubic-bezier(.2,.7,.4,1)" },
    );
  }
}

function explode(x, y, big) {
  const size = big ? 220 : 130;
  const flash = fx("flash");
  flash.style.width = flash.style.height = `${size}px`;
  flash.innerHTML = FLASH_SVG;
  animateFx(
    flash,
    [
      { transform: pos(x, y, size / 2) + " scale(.2) rotate(0deg)", opacity: 1 },
      { transform: pos(x, y, size / 2) + " scale(1) rotate(20deg)", opacity: 1, offset: 0.4 },
      { transform: pos(x, y, size / 2) + " scale(1.15) rotate(30deg)", opacity: 0 },
    ],
    { duration: big ? 900 : 550, easing: "ease-out" },
  );
  burst(x, y, big ? 30 : 15, big ? 1.8 : 1);
}

function fall(kind, layer = fxEl) {
  const el = fx("falling", layer);
  if (kind === "star") {
    el.classList.add("star");
    el.textContent = "★";
  } else if (kind === "heart") {
    el.classList.add("heart");
    el.textContent = "♥";
  } else {
    el.style.background = pick(CONFETTI_COLORS);
  }
  const w = layer.clientWidth;
  const h = layer.clientHeight;
  const x = Math.random() * w;
  const sway = (Math.random() - 0.5) * 120;
  const spin = (Math.random() - 0.5) * 720;
  animateFx(
    el,
    [
      { transform: pos(x, -30, 0) + " rotate(0deg)", opacity: 1 },
      { transform: pos(x + sway, h + 40, 0) + ` rotate(${spin}deg)`, opacity: 0.9 },
    ],
    {
      duration: 2600 + Math.random() * 1800,
      delay: Math.random() * 1200,
      easing: "linear",
    },
  );
}

/* ---------- Latar: bayangan ikan di kejauhan ---------- */
function fillSchool() {
  const school = $("#school");
  const spots = [
    [12, 38, 7],
    [30, 44, 5],
    [62, 40, 6],
    [80, 47, 5],
    [20, 56, 8],
    [70, 60, 7],
    [48, 66, 6],
    [86, 70, 8],
    [10, 72, 6],
  ];
  spots.forEach(([x, y, w], i) => {
    const jelly = i % 4 === 3;
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    el.setAttribute("class", "shadow-fish");
    el.setAttribute("viewBox", jelly ? "0 0 40 50" : "0 0 60 30");
    el.innerHTML = `<use href="#${jelly ? "jelly-shadow" : "fish-shadow"}"/>`;
    el.style.left = `${x}%`;
    el.style.top = `${y}%`;
    el.style.width = `${w}vw`;
    if (jelly) el.style.color = "#7b5bd6";
    else if (i % 2) el.style.scale = "-1 1";
    el.style.animation = `swim ${14 + i * 3}s ease-in-out ${-i * 2}s infinite alternate`;
    school.appendChild(el);
  });
}

/* ---------- Hewan laut ---------- */
function spawnAnimal(happy = false) {
  if (finished && !happy) return;
  // Hewan acak, tapi tidak sama dengan hewan sasaran sebelumnya
  const type = happy ? pick(ANIMAL_TYPES) : pick(ANIMAL_TYPES.filter((t) => t !== lastType));
  if (!happy) lastType = type;

  const el = document.createElement("div");
  el.className = "animal";
  el.style.left = (happy ? 15 + Math.random() * 70 : 30 + Math.random() * 40) + "%";
  // Hewan pertama berenang lebih rendah agar tidak tertutup judul
  const top = happy ? 30 + Math.random() * 25 : shots === 0 ? 52 : 36 + Math.random() * 12;
  el.style.top = top + "%";

  const flip = document.createElement("div");
  flip.className = "flip";
  // Gambar menghadap kiri; sesekali dibalik agar bervariasi
  flip.style.setProperty("--dir", Math.random() < 0.6 ? 1 : -1);

  const body = document.createElement("div");
  body.className = "body";
  const img = document.createElement("img");
  img.src = ANIMAL_IMG[type];
  img.alt = "";
  img.draggable = false;
  body.appendChild(img);

  flip.appendChild(body);
  el.appendChild(flip);
  animalsEl.appendChild(el);

  el.animate([{ transform: "translate(-14px, 0)" }, { transform: "translate(14px, 8px)" }], {
    duration: 2200 + Math.random() * 1400,
    direction: "alternate",
    iterations: Infinity,
    easing: "ease-in-out",
  });
  body.animate(
    [
      { transform: "scale(0)", opacity: 0 },
      { transform: "scale(1)", opacity: 1 },
    ],
    { duration: 450, easing: "cubic-bezier(.2, 1.6, .4, 1)" },
  );

  if (happy) {
    flip.classList.add("happy");
    flip.style.animationDelay = Math.random() * 0.6 + "s";
  } else {
    current = { el, body };
  }
}

function hit(animal) {
  animal.body.animate(
    [
      { transform: "scale(1) rotate(0deg)", opacity: 1 },
      { transform: "scale(1.25) rotate(12deg)", opacity: 1, offset: 0.35 },
      { transform: "scale(0)", opacity: 0 },
    ],
    { duration: 500, easing: "ease-in", fill: "forwards" },
  ).onfinish = () => animal.el.remove();

  // Hewan berikutnya muncul otomatis setelah jeda singkat
  if (!finished) setTimeout(spawnAnimal, 700);
}

/* ---------- Tembakan ---------- */
function fire(isLast) {
  sfx.cannon();
  cannonEl.animate(
    [
      { transform: "translateX(0)" },
      { transform: "translateX(-10px) rotate(-4deg)" },
      { transform: "translateX(0)" },
    ],
    { duration: 260 },
  );

  const target = current ? centerOf(current.el) : randomSeaPoint();
  const targetAnimal = current;
  current = null;

  const from = muzzle();
  const smoke = fx("smoke");
  animateFx(
    smoke,
    [
      { transform: pos(from.x, from.y, 25) + " scale(.3)", opacity: 0.9 },
      { transform: pos(from.x + 20, from.y - 30, 25) + " scale(1.4)", opacity: 0 },
    ],
    { duration: 600, easing: "ease-out" },
  );

  const ball = fx("ball");
  ball.animate(
    [
      { transform: pos(from.x, from.y, 12) + " scale(1.1)" },
      { transform: pos(target.x, target.y, 12) + " scale(.7)" },
    ],
    { duration: 420, easing: "cubic-bezier(.3, .6, .6, 1)", fill: "forwards" },
  ).onfinish = () => {
    ball.remove();
    explode(target.x, target.y, isLast);
    sfx.splash();
    if (targetAnimal) hit(targetAnimal);
    if (isLast) finale();
  };
}

/* ---------- Petunjuk tangan saat anak diam ---------- */
function armIdleHint() {
  clearTimeout(idleTimer);
  handEl.classList.remove("show");
  if (finished) return;
  idleTimer = setTimeout(() => handEl.classList.add("show"), IDLE_HINT_MS);
}

/* ---------- Input tap ----------
   Hanya pointerdown: satu sentuhan jari atau satu klik mouse
   menghasilkan tepat satu event, sehingga tidak ada hitungan ganda. */
gameEl.addEventListener("pointerdown", (e) => {
  if (finished || !e.isPrimary || e.button !== 0) return;
  e.preventDefault();
  audio();

  const g = gameEl.getBoundingClientRect();
  const ring = fx("tap-ring");
  animateFx(
    ring,
    [
      { transform: pos(e.clientX - g.left, e.clientY - g.top, 30) + " scale(.3)", opacity: 1 },
      { transform: pos(e.clientX - g.left, e.clientY - g.top, 30) + " scale(1.4)", opacity: 0 },
    ],
    { duration: 450, easing: "ease-out" },
  );

  shots += 1;
  gameEl.classList.add("started");
  counterEl.textContent = `Tap: ${shots}/${TOTAL_TAP}`;
  counterEl.classList.remove("bump");
  void counterEl.offsetWidth;
  counterEl.classList.add("bump");
  if (shots === TOTAL_TAP) finished = true;
  armIdleHint();

  fire(finished);
});

/* ---------- Penyelesaian game ---------- */
function finale() {
  gameEl.classList.add("won");
  heroEl.classList.add("dance");
  winEl.classList.add("show");
  sfx.win();

  for (let i = 0; i < HAPPY_COUNT; i++) {
    setTimeout(() => spawnAnimal(true), 200 + i * 150);
  }
  for (let i = 0; i < 60; i++) fall("confetti");
  for (let i = 0; i < 16; i++) fall("star");
  for (let i = 0; i < 14; i++) fall("heart");

  setTimeout(showFinish, FINISH_DELAY_MS);
}

function mount(templateId) {
  const section = $(templateId).content.firstElementChild.cloneNode(true);
  dressHero(section);
  document.body.appendChild(section);
  requestAnimationFrame(() => requestAnimationFrame(() => section.classList.add("show")));
  return section;
}

function leave(el) {
  el.classList.add("leave");
  el.inert = true;
  el.style.opacity = "0";
  setTimeout(() => el.remove(), 900);
}

function showFinish() {
  const finish = mount("#finish-tpl");
  const stars = finish.querySelector(".night-stars");
  for (let i = 0; i < 36; i++) {
    const s = document.createElement("span");
    s.className = "night-star";
    s.textContent = i % 3 ? "✦" : "★";
    s.style.left = `${Math.random() * 96}%`;
    s.style.top = `${Math.random() * 80}%`;
    s.style.fontSize = `${8 + Math.random() * 16}px`;
    s.style.animationDelay = `${-Math.random() * 2}s`;
    stars.appendChild(s);
  }
  const fxLayer = finish.querySelector(".fx");
  for (let i = 0; i < 40; i++) fall("confetti", fxLayer);

  leave(gameEl);

  // Tombol "Lanjut" boleh ditekan, tetapi tidak wajib: halaman ucapan muncul sendiri
  let done = false;
  const next = () => {
    if (done) return;
    done = true;
    clearTimeout(autoTimer);
    showBirthday(finish);
  };
  const autoTimer = setTimeout(next, AUTO_NEXT_MS);
  finish.querySelector(".next-btn").addEventListener("click", next);
}

function showBirthday(finish) {
  const bday = mount("#birthday-tpl");
  bday.querySelector(".bday-title-text").textContent = CONFIG.judul;
  bday.querySelector(".bday-name").textContent = CONFIG.nama;
  bday.querySelector(".bday-msg").textContent = CONFIG.ucapan;
  const photo = bday.querySelector(".photo");
  photo.src = CONFIG.fotoPath;
  photo.alt = `Foto masa kecil ${CONFIG.nama}`;

  leave(finish);
  startMusic();

  const fxLayer = bday.querySelector(".fx");
  for (let i = 0; i < 40; i++) fall("confetti", fxLayer);
  setInterval(() => fall(Math.random() < 0.5 ? "heart" : "star", fxLayer), 700);

  // Main lagi dari awal: muat ulang halaman agar semua keadaan kembali bersih
  const replay = bday.querySelector(".replay-btn");
  replay.addEventListener("click", () => location.reload());
  setTimeout(() => {
    replay.hidden = false;
  }, REPLAY_DELAY_MS);
}

/* ---------- Mulai ---------- */
fillSchool();
counterEl.textContent = `Tap: 0/${TOTAL_TAP}`;

// Intro lucu: Stitch menyapa, game baru dimulai setelah tombol "Ayo Main!"
const opening = $("#opening");
const openingStitch = opening.querySelector(".opening-stitch");
opening.querySelector(".opening-name").textContent = CONFIG.nama.split(" ")[0];

// Ketuk Stitch: dia melompat kegirangan
openingStitch.addEventListener("pointerdown", () => {
  sfx.boing();
  openingStitch.classList.remove("giggle");
  void openingStitch.offsetWidth; // ulang animasi meski diketuk berkali-kali
  openingStitch.classList.add("giggle");
});

opening.querySelector(".start-btn").addEventListener(
  "click",
  () => {
    sfx.hello();
    leave(opening);
    setTimeout(() => spawnAnimal(), 900);
    armIdleHint();
  },
  { once: true },
);
