// Logika Latihan Kosakata (4 arah + kotak hafalan 1-4 + Review Prioritas).
// Mengikuti aturan Latihan Kosakata di NgebutJLPT v1. Semua fungsi murni
// (tidak mengubah data masukan) supaya mudah diuji; tampilan ada di halaman Vocab.
//
// Catatan disimpan di localStorage perangkat ini, bentuk sama dengan v1
// ({ version: 1, items }), tetapi dengan nama kunci sendiri karena v1 dan v2
// berada di domain yang sama (dadikirawan.github.io).

export const DRILL_STORAGE_KEY = 'ngebut-v2-vocab-drill'
export const DRILL_SESSION_SIZE = 10
export const DRILL_MIN_FOR_WEAK = 5
// Indeks = nomor kotak (1..4): jeda hari sebelum kata dianggap "jatuh tempo" lagi
export const DRILL_INTERVAL_DAYS = [0, 0, 1, 3, 7]
export const DRILL_DIRECTIONS = [
  { key: 'k2r', label: 'Kanji → Bacaan', hint: 'Lihat kanji, pilih cara bacanya (seperti soal 漢字読み)' },
  { key: 'r2k', label: 'Bacaan → Kanji', hint: 'Lihat bacaan, pilih tulisan kanjinya (seperti soal 表記)' },
  { key: 'k2m', label: 'Kanji → Arti', hint: 'Lihat kata, pilih artinya' },
  { key: 'm2k', label: 'Arti → Kanji', hint: 'Lihat arti, pilih kata Jepangnya' },
]

const DAY_MS = 86400000
const KANJI_RE = /[\u4e00-\u9fff々]/
const OPTION_IDS = ['A', 'B', 'C', 'D']
const WRONG_OPTION_COUNT = 3

// ---------- Penyimpanan ----------

function getDefaultStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage
  } catch {
    // akses localStorage bisa diblokir
  }
  return null
}

export function loadDrillStore(storage = getDefaultStorage()) {
  if (!storage) return {}
  try {
    const raw = storage.getItem(DRILL_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object' && parsed.items && typeof parsed.items === 'object') {
      return parsed.items
    }
    return {}
  } catch {
    return {}
  }
}

export function saveDrillStore(items, storage = getDefaultStorage()) {
  if (!storage) return false
  try {
    storage.setItem(DRILL_STORAGE_KEY, JSON.stringify({ version: 1, items }))
    return true
  } catch {
    return false
  }
}

// ---------- Kata dan kelayakan arah ----------

export function drillWordKey(level, item) {
  return `${level}|${item.kanji}|${item.kana}`
}

export function itemHasKanji(item) {
  return KANJI_RE.test(item.kanji)
}

// vocabByLevel: { N1: [{kanji, kana, meaning}], N2: [...] }
export function createDrillContext(vocabByLevel) {
  const homophones = new Map()
  Object.values(vocabByLevel).forEach((words) => {
    words.forEach((w) => {
      if (!homophones.has(w.kana)) homophones.set(w.kana, new Set())
      homophones.get(w.kana).add(w.kanji)
    })
  })
  return { vocabByLevel, homophones }
}

function kanaIsAmbiguous(item, ctx) {
  const set = ctx.homophones.get(item.kana)
  return Boolean(set && set.size > 1)
}

export function meaningTokens(item) {
  return String(item.meaning || '')
    .split(';')
    .map((t) => t.replace(/\(.*?\)/g, '').trim().toLowerCase())
    .filter(Boolean)
}

export function dirEligible(dirKey, item, ctx) {
  if (dirKey === 'k2r') return itemHasKanji(item)
  if (dirKey === 'r2k') return itemHasKanji(item) && !kanaIsAmbiguous(item, ctx)
  return Boolean(item.meaning)
}

// ---------- Catatan per kata per arah ----------

export function drillRecord(items, level, item, dirKey) {
  const word = items[drillWordKey(level, item)]
  return (word && word[dirKey]) || null
}

export function drillDirStats(items, level, words, dirKey) {
  let ok = 0
  let ng = 0
  words.forEach((item) => {
    const rec = drillRecord(items, level, item, dirKey)
    if (rec) {
      ok += Number(rec.ok) || 0
      ng += Number(rec.ng) || 0
    }
  })
  return { ok, ng, total: ok + ng }
}

export function weakestDirection(items, level, words) {
  let worst = null
  DRILL_DIRECTIONS.forEach((dir) => {
    const st = drillDirStats(items, level, words, dir.key)
    if (st.total < DRILL_MIN_FOR_WEAK) return
    const rate = st.ng / st.total
    if (!worst || rate > worst.rate) {
      worst = { key: dir.key, label: dir.label, rate, pct: Math.round(rate * 100), total: st.total }
    }
  })
  return worst && worst.rate > 0 ? worst : null
}

// Skor prioritas: makin tinggi makin perlu diulang.
export function drillScore(rec, dirFail, now) {
  if (!rec) return 3 + dirFail * 2
  const total = (Number(rec.ok) || 0) + (Number(rec.ng) || 0)
  const failRate = total ? (Number(rec.ng) || 0) / total : 0
  const box = Math.min(4, Math.max(1, Number(rec.box) || 1))
  const intervalMs = DRILL_INTERVAL_DAYS[box] * DAY_MS
  const due = !intervalMs || now - (Number(rec.last) || 0) >= intervalMs
  let s = (5 - box) * 1.5 + failRate * 3 + dirFail * 2
  if (!due) s -= 4
  return s
}

// Mengembalikan { items: catatan baru, change: { from, to } }. Data lama tidak diubah.
export function applyDrillResult(items, level, item, dirKey, isCorrect, now) {
  const key = drillWordKey(level, item)
  const prevWord = items[key] && typeof items[key] === 'object' ? items[key] : {}
  const rec = { ...(prevWord[dirKey] || { box: 1, ok: 0, ng: 0, last: 0 }) }
  const from = Math.min(4, Math.max(1, Number(rec.box) || 1))
  rec.box = isCorrect ? Math.min(4, from + 1) : 1
  if (isCorrect) rec.ok = (Number(rec.ok) || 0) + 1
  else rec.ng = (Number(rec.ng) || 0) + 1
  rec.last = now
  return {
    items: { ...items, [key]: { ...prevWord, [dirKey]: rec } },
    change: { from, to: rec.box },
  }
}

export function resetDrillLevel(items, level) {
  const prefix = `${level}|`
  const next = {}
  Object.keys(items).forEach((k) => {
    if (k.indexOf(prefix) !== 0) next[k] = items[k]
  })
  return next
}

// Status kata untuk lencana kartu: sudah dicoba? "hafal" bila semua arah layak berkotak >= 3
export function getWordStatus(items, level, item, ctx) {
  const word = items[drillWordKey(level, item)] || {}
  const dirs = DRILL_DIRECTIONS.filter((d) => dirEligible(d.key, item, ctx))
  const attempted = dirs.filter((d) => {
    const rec = word[d.key]
    return rec && (Number(rec.ok) || 0) + (Number(rec.ng) || 0) > 0
  })
  const mastered = dirs.length > 0 && dirs.every((d) => (Number(word[d.key]?.box) || 0) >= 3)
  return { seen: attempted.length > 0, mastered }
}

// ---------- Memilih kata untuk satu sesi ----------

// dirKey: 'k2r' | 'r2k' | 'k2m' | 'm2k' | 'priority'
export function pickDrillItems(items, level, ctx, dirKey, size = DRILL_SESSION_SIZE, opts = {}) {
  const rng = opts.rng || Math.random
  const now = opts.now ?? Date.now()
  const words = ctx.vocabByLevel[level] || []
  const dirFail = {}
  DRILL_DIRECTIONS.forEach((d) => {
    const st = drillDirStats(items, level, words, d.key)
    dirFail[d.key] = st.total ? st.ng / st.total : 0.3
  })
  const rows = []
  words.forEach((item) => {
    const dirs = dirKey === 'priority' ? DRILL_DIRECTIONS.map((d) => d.key) : [dirKey]
    let best = null
    dirs.forEach((dk) => {
      if (!dirEligible(dk, item, ctx)) return
      const s = drillScore(drillRecord(items, level, item, dk), dirFail[dk], now) + rng() * 0.8
      if (!best || s > best.s) best = { item, dirKey: dk, s }
    })
    if (best) rows.push(best)
  })
  rows.sort((a, b) => b.s - a.s)
  return rows.slice(0, size)
}

// ---------- Membuat soal 4 pilihan ----------

function wordClass(v) {
  if (/い$/.test(v.kana)) return 'i'
  if (/[うくぐすつぬぶむる]$/.test(v.kana)) return 'v'
  return 'n'
}

function shuffle(list, rng) {
  const a = [...list]
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    const tmp = a[i]
    a[i] = a[j]
    a[j] = tmp
  }
  return a
}

const PROMPTS = {
  k2r: (item) => [item.kanji, 'Bagaimana cara membacanya?'],
  r2k: (item) => [item.kana, 'Tulisan kanji (atau kata) yang tepat?'],
  k2m: (item) => [item.kanji, 'Apa artinya?'],
  m2k: (item) => [item.meaning, 'Kata Jepang yang tepat?'],
}

export function buildDrillQuestion(level, item, dirKey, ctx, opts = {}) {
  const rng = opts.rng || Math.random
  const lenOf = (s) => Array.from(String(s)).length
  const textOf = (v) => (dirKey === 'k2r' ? v.kana : dirKey === 'k2m' ? v.meaning : v.kanji)
  const correctText = textOf(item)
  const correctTokens = meaningTokens(item)

  const usable = (v) => {
    if (v === item || v.kanji === item.kanji) return false
    if (dirKey === 'k2r' || dirKey === 'r2k') {
      if (v.kana === item.kana) return false
    }
    if (dirKey === 'k2m' || dirKey === 'm2k') {
      if (!v.meaning) return false
      if (meaningTokens(v).some((t) => correctTokens.includes(t))) return false
    }
    return Boolean(textOf(v))
  }

  const score = (v) => {
    let s = rng() * 1.5
    if (dirKey === 'k2r') {
      s -= Math.abs(lenOf(v.kana) - lenOf(item.kana)) * 1.2
      if (v.kana.slice(-1) === item.kana.slice(-1)) s += 1.5
      if (v.kana.charAt(0) === item.kana.charAt(0)) s += 1
    } else if (dirKey === 'r2k' || dirKey === 'm2k') {
      s -= Math.abs(lenOf(v.kanji) - lenOf(item.kanji))
      if (Array.from(v.kanji).some((c) => KANJI_RE.test(c) && item.kanji.includes(c))) s += 2
      if (itemHasKanji(v) === itemHasKanji(item)) s += 1
      if (dirKey === 'm2k' && wordClass(v) === wordClass(item)) s += 1.5
    } else if (wordClass(v) === wordClass(item)) {
      s += 2
    }
    return s
  }

  const picked = []
  const seen = new Set([correctText])
  const take = (pool) => {
    pool
      .filter(usable)
      .map((v) => ({ v, s: score(v) }))
      .sort((a, b) => b.s - a.s)
      .forEach(({ v }) => {
        const t = textOf(v)
        if (picked.length >= WRONG_OPTION_COUNT || seen.has(t)) return
        seen.add(t)
        picked.push(v)
      })
  }
  take(ctx.vocabByLevel[level] || [])
  if (picked.length < WRONG_OPTION_COUNT) {
    Object.keys(ctx.vocabByLevel)
      .filter((k) => k !== level)
      .forEach((k) => take(ctx.vocabByLevel[k]))
  }

  const options = shuffle(
    [{ text: correctText, correct: true }, ...picked.map((v) => ({ text: textOf(v), correct: false }))],
    rng,
  ).map((o, i) => ({ id: OPTION_IDS[i], text: o.text, correct: o.correct }))

  const [promptMain, promptSub] = PROMPTS[dirKey](item)
  return {
    item,
    dirKey,
    level,
    promptMain,
    promptSub,
    options,
    correctId: options.find((o) => o.correct).id,
    correctText,
  }
}

// Satu sesi: memilih kata lalu membuat soalnya
export function buildDrillSession(items, level, ctx, dirKey, opts = {}) {
  const rows = pickDrillItems(items, level, ctx, dirKey, opts.size ?? DRILL_SESSION_SIZE, opts)
  return rows.map((r) => buildDrillQuestion(level, r.item, r.dirKey, ctx, opts))
}
