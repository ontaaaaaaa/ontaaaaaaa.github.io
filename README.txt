WEBSITE ULANG TAHUN - STITCH BEACH GAME
=========================================

ISI PROYEK
----------
index.html            Halaman utama (pantai, karakter, meriam, layar selesai,
                      halaman ucapan)
css/style.css         Tampilan dan animasi
js/game.js            Logika game, suara, dan konfigurasi
assets/images/        Foto masa kecil (foto-masakecil.png) dan, bila ada,
                      gambar karakter Anda (stitch.png)
README.txt            Panduan ini

Tidak perlu database, backend, atau login. Semua berjalan di browser.


MENJALANKAN DI KOMPUTER (LOKAL)
-------------------------------
1. Ekstrak file ZIP.
2. Buka file index.html dengan Chrome, Edge, atau Firefox (klik dua kali).
3. Untuk tes di HP tanpa internet: pakai mode responsif (F12 lalu ikon HP),
   atau jalankan server lokal sederhana:
     - Python:  python3 -m http.server 8000   lalu buka http://localhost:8000
     - Node:    npx serve .


MENGGANTI FOTO
--------------
1. Siapkan foto masa kecil, ukuran minimal 800 x 1000 px (potret).
2. Beri nama foto-masakecil.png dan letakkan di assets/images/
   (menimpa file yang ada).
3. Nama atau format lain (jpg/jpeg) juga bisa: ubah fotoPath di js/game.js.


MENGGANTI NAMA, UCAPAN, DAN MUSIK
---------------------------------
Buka js/game.js, bagian paling atas (objek CONFIG):

  judul:        Judul di halaman ulang tahun ("Selamat Ulang Tahun")
  nama:         Ditulis di bawah foto, mis. "Naumi Sofia Omira"
  fotoPath:     Lokasi foto
  ucapan:       Pesan ulang tahun
  karakterPath: Gambar karakter (lihat bagian MENGGANTI KARAKTER)
  musikPath:    Musik halaman ucapan, saat ini 'assets/images/lagu.mp3'.
              Kosongkan ('') untuk musik bawaan, atau isi path mp3 lain.

Setelah mengubah, simpan file dan muat ulang halaman.


MENGGANTI KARAKTER
------------------
Website memakai maskot orisinal bawaan (makhluk laut biru berantena bintang)
yang digambar dengan SVG. Jika Anda punya gambar karakter sendiri,
misalnya Stitch, simpan sebagai PNG berlatar transparan dengan nama
assets/images/stitch.png. Gambar itu otomatis dipakai di pantai, layar
"Game Selesai", dan halaman ucapan. Jika file tidak ada, maskot bawaan
tetap tampil.
Layar "Game Selesai" memakai assets/images/st-love.png (karakterSelesaiPath)
dan halaman ucapan memakai assets/images/stitch-ultah.png (karakterUcapanPath),
keduanya diatur di js/game.js. Kosongkan salah satunya agar layar itu memakai
stitch.png.


ALUR GAME (sesuai 8 layar desain)
---------------------------------
0. Intro: Stitch (assets/images/stitch-hello.png) jatuh ke layar sambil
   melambai dan menyapa "Aloha, Naumi!". Stitch bisa diketuk supaya
   melompat. Game baru dimulai setelah tombol "Ayo Main!" ditekan.
1. Layar awal: judul "Ayo Tembak!" dan petunjuk singkat.
2. Ketukan pertama di mana saja: meriam menembak hewan laut, papan kayu
   "Tap: 1/7" muncul.
3. Hewan yang terkena menghilang dengan ledakan, lalu hewan berikutnya
   muncul secara acak (gurita, hiu, ubur-ubur, atau paus; tidak sama dengan
   hewan sebelumnya). Gambarnya ada di
   assets/images/hewan laut/ (diatur di ANIMAL_IMG pada js/game.js).
4-6. Ketukan ke-2 sampai ke-7 sama saja, tidak perlu membidik.
   Jika anak diam sebentar, ikon tangan muncul sebagai pengingat.
7. Setelah ketukan ke-7: ledakan besar, karakter menari, confetti, dan
   tulisan "Yeay! Kamu Berhasil!". Kemudian layar malam "Yeay! Game
   Selesai!" muncul dengan tombol "Lanjut". Tombol ini tidak wajib
   ditekan karena halaman ucapan muncul sendiri setelah 6 detik.
8. Halaman ucapan: foto polaroid, nama, pesan, dan musik. Halaman ini hanya
   dibuat setelah game selesai. Setelah 14 detik muncul tombol "Main Lagi"
   untuk mengulang game dari awal. Jumlah tembakan (TOTAL_TAP) dan jeda
   tombol (REPLAY_DELAY_MS) diatur di js/game.js.
- Tombol 🔊/🔇 di pojok kanan atas untuk mute/unmute.

Suara meriam, percikan, kemenangan, dan musik dibuat langsung di browser
(Web Audio), sehingga tidak perlu file suara.


MENERBITKAN SECARA GRATIS
-------------------------

A. GITHUB PAGES
   1. Buat akun di github.com, lalu buat repository baru (mis. birthday-stitch),
      dan pilih Public.
   2. Upload semua isi folder birthday-website (index.html, css, js, assets)
      ke repository. Pastikan index.html ada di tingkat paling atas, bukan di
      dalam folder lain.
   3. Buka Settings > Pages. Di bagian "Branch", pilih main dan folder "/ (root)",
      lalu klik Save.
   4. Tunggu 1-2 menit. Alamat website akan muncul, bentuknya:
      https://USERNAME.github.io/birthday-stitch/

B. NETLIFY (paling cepat)
   1. Buka https://app.netlify.com/drop dan masuk (bisa pakai akun Google/GitHub).
   2. Seret folder birthday-website ke area "Drop" di halaman tersebut.
   3. Netlify langsung memberi alamat seperti https://nama-acak.netlify.app.
      Alamat ini bisa diganti lewat Site settings > Change site name.

Setelah diterbitkan, kirim tautannya. Ubah isi file lalu upload ulang
(GitHub: Add file > Upload files; Netlify: seret ulang folder) untuk memperbarui.


CATATAN
-------
- Maskot bawaan, meriam, dan pemandangan digambar dengan SVG di index.html.
  Hewan laut memakai gambar PNG di assets/images/hewan laut/.
- Font diambil dari Google Fonts. Tanpa internet, tampilan tetap berjalan
  dengan font cadangan.
- Untuk performa, animasi memakai Web Animations dan CSS transform.
