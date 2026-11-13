import { createElement, useSyncExternalStore } from 'react'
import n2Furigana from '../data/furigana_n2.json' with { type: 'json' }
import n1Furigana from '../data/furigana_n1.json' with { type: 'json' }
import { getPref, setPref } from './storage.js'

// Peta furigana per level: { [hashTeks]: "kanji|bacaan,kanji|bacaan" }.
// Data soal asli tidak diubah; furigana diterapkan saat render berdasarkan hash teks yang ditampilkan.
const FURIGANA_BY_LEVEL = { N2: n2Furigana, N1: n1Furigana }

// Soal yang memang menebak kanji → tanpa furigana.
// N2: P1 (漢字読み) & P2 (表記). N1: P1 (漢字読み).
const NO_FURIGANA_PROBLEMS = { N2: [1, 2], N1: [1] }

const PREF_KEY = 'jlpt-v2-furigana'

// ---------- Preferensi ON/OFF (disimpan di localStorage lewat storage.js) ----------
const listeners = new Set()
let cached = null

function readPref() {
  const raw = getPref(PREF_KEY)
  return raw !== 'off'
}

function getSnapshot() {
  if (cached === null) cached = readPref()
  return cached
}

function subscribe(cb) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function setFuriganaEnabled(on) {
  cached = Boolean(on)
  setPref(PREF_KEY, cached ? 'on' : 'off')
  listeners.forEach((cb) => cb())
}

export function useFuriganaEnabled() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

// ---------- Hash teks (FNV-1a 32-bit atas UTF-16 code unit + panjang) ----------
export function hashText(s) {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return `${h.toString(36)}-${s.length}`
}

export function furiganaAllowed(question) {
  if (!question) return false
  const skip = NO_FURIGANA_PROBLEMS[question.level]
  if (!skip) return false
  return !skip.includes(Number(question.problem_number))
}

function escapeRe(c) {
  return c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Pecah teks menjadi segmen polos / berfurigana. Pasangan dicocokkan berurutan;
// spasi nyasar di antara karakter kanji (artefak ekstraksi PDF) ditoleransi.
function annotate(text, spec) {
  const segs = []
  let pos = 0
  for (const pair of spec.split(',')) {
    const cut = pair.indexOf('|')
    if (cut < 1) continue
    const surface = pair.slice(0, cut)
    const reading = pair.slice(cut + 1)
    const re = new RegExp(Array.from(surface).map(escapeRe).join('\\s*'), 'g')
    re.lastIndex = pos
    const m = re.exec(text)
    if (!m) continue
    if (m.index > pos) segs.push({ text: text.slice(pos, m.index), start: pos, end: m.index })
    segs.push({ text: m[0], reading, start: m.index, end: m.index + m[0].length })
    pos = m.index + m[0].length
  }
  if (pos < text.length) segs.push({ text: text.slice(pos), start: pos, end: text.length })
  return segs
}

// Kembalikan segmen furigana untuk teks, atau null bila furigana tidak berlaku.
export function furiSegments(question, text, enabled) {
  if (!enabled || typeof text !== 'string' || text === '') return null
  if (!furiganaAllowed(question)) return null
  const map = FURIGANA_BY_LEVEL[question.level]
  const spec = map ? map[hashText(text)] : undefined
  if (!spec) return null
  return annotate(text, spec)
}

// Render segmen untuk rentang [start, end) pada teks asli.
export function renderSegments(segs, start = 0, end = Infinity) {
  const nodes = []
  for (const seg of segs) {
    if (seg.reading) {
      if (seg.start >= start && seg.start < end) {
        nodes.push(
          createElement('ruby', { key: `r${seg.start}` }, seg.text, createElement('rt', null, seg.reading))
        )
      }
      continue
    }
    const s = Math.max(seg.start, start)
    const e = Math.min(seg.end, end)
    if (e > s) nodes.push(seg.text.slice(s - seg.start, e - seg.start))
  }
  return nodes
}
