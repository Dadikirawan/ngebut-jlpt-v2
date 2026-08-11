# NgebutJLPT v2

Aplikasi Try Out Soal JLPT Resmi untuk level **N1** dan **N2**, dengan format soal sesuai ujian JLPT asli (文字・語彙・文法・読解 — pilihan ganda 4 opsi termasuk susunan kalimat ★, cloze passage, dan reading comprehension multi-pertanyaan per passage).

## Fitur

- 📚 **Question Pool 239 Soal Terstruktur** — 127 soal N1 + 112 soal N2, semua kunci jawaban tervalidasi
- ⚡ **Feedback Instan Per Soal (Mode Belajar)** — setelah klik opsi, langsung tampil:
  - Highlight visual hijau (benar) / merah (salah) + opsi jawaban benar otomatis ditandai
  - Area **Pembahasan Singkat**: ulang prompt soal + pill jawaban benar beserta teks opsi
  - Tombol "Soal Berikutnya" hanya aktif setelah user menjawab
- 📝 **4 Tipe Viewer Khusus Format JLPT**:
  1. 4択 Pilihan Ganda (vocab, kanji, grammar, sinonim, parafrase)
  2. 文の組み立て ★ Sentence Order (posisi huruf di ★ + fragment row visual + urutan benar)
  3. 文章の文法 Cloze Passage (2 kolom responsive, blank 【n】 highlight plum)
  4. 読解 Reading Passage (2 kolom responsive + tabel 情報検索 + footnotes)
- 🏆 **Gamifikasi App Shell** (sesuai versi NgebutJLPT flashcard v1):
  - Sidebar kiri Home / Vocab / Quiz / Try Out / Progress + Quick Action Cards
  - Header badges: 🔥 Study Streak / ⭐ XP / 🏆 Level JLPT
  - Learner Profile Card dengan XP progress bar ke level berikutnya
- 📊 **Progress Tracker per Level** — disimpan ke `localStorage` key `jlpt-progress-n1` / `jlpt-progress-n2`
  - Total riwayat pengerjaan, best score, rata-rata skor, jumlah tipe soal yang sudah dicoba
  - Riwayat 10 sesi terakhir dengan badge skor warna
- 📑 **Halaman Hasil Komprehensif**:
  - Score circle conic gradient + type breakdown per kategori (vocab / order / cloze / reading)
  - Ringkasan skor per tipe soal dengan progress bar
  - Filter pembahasan detail: 🔍 Semua / ✅ Benar / ❌ Salah — expandable dengan VIEWER SOAL ASLI (bukan hanya teks)

## Tech Stack

- **Vite 8** + **React 19** (ESM `import with { type: 'json' }`)
- **CSS Modules** (`*.module.css`) — tidak ada konflik class, design token terpusat di `src/index.css`
- Storage: `localStorage` dengan in-memory Map fallback untuk private Safari / quota penuh
- **State routing tanpa library** di `src/App.jsx`

## Design Token (Warna)

Token diatur sebagai CSS variables di `src/index.css` — JANGAN pakai warna di luar token ini untuk konsistensi brand:

| Token | Hex | Kegunaan |
|---|---|---|
| `--plum-deep` | `#541b4c` | Primary brand, badge soal, tombol primary gradient |
| `--eggplant` | `#2c2029` | Teks header / body |
| `--navy-ink` | `#0b2948` | Badge passage, label tipe, tombol secondary outline |
| `--paper` | `#ffffff` | Background utama / card |
| `--success` | `#1e7f4b` | Feedback benar / pill jawaban benar |
| `--danger` | `#b23d3d` | Feedback salah |
| `--warn` | `#c77a00` | Badge skor rendah |

## Jalankan Lokal

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # build production → dist/
npm run lint      # ESLint
npm run preview   # preview hasil build
```

## Struktur Data (src/data)

- `n1_structured.json` — 127 soal level N1, 13 problem
- `n2_structured.json` — 112 soal level N2, 14 problem
- `loadQuestions.js` — module akses data dengan caching:
  - `getQuestionsByLevel(level)` — semua soal per level (flatten)
  - `getQuestionsByProblemType(level, type)` — filter by `vocab_grammar_choice` | `sentence_order` | `cloze_passage` | `reading`
  - `getRandomQuizSet(level, count)` — generator acak round-robin per type bucket (distribusi merata)

Untuk soal `reading` & `cloze_passage`, setiap item flat sudah men-**copy `passage_text`, `table_data`, `footnotes`** secara self-contained agar valid jika di-quiz secara acak (tidak dependen parent passage object).

## Storage Layer (src/utils/storage.js)

Key yang dipakai **persis per level**:
- `jlpt-progress-n1` — gabungan aggregate + riwayat N1
- `jlpt-progress-n2` — gabungan aggregate + riwayat N2

Export:
```js
loadProgress(level)               // → { totalCompleted, bestScore, avgScore, attemptedTypes:Set, histories:[{id, scorePercent, ...}] }
saveProgress(level, data)         // → boolean (false = localStorage penuh & fallback ke mem)
appendHistory(level, historyObj)  // → hitung aggregate + push histories, lalu save
getAggregateAllLevels()           // → gabungan N1 + N2 untuk header badges
```

---

Made with 🍣 by NgebutJLPT team — 頑張ってください!
