import n1Vocab from './vocab_n1.json' with { type: 'json' }
import n2Vocab from './vocab_n2.json' with { type: 'json' }

// Data vocab per level. Level yang belum punya data diisi null
// (halaman Vocab menampilkan keterangan "segera hadir").
const VOCAB_BY_LEVEL = {
  N1: n1Vocab,
  N2: n2Vocab,
}

export const VOCAB_LEVELS = ['N1', 'N2']

export function isVocabAvailable(level) {
  return Boolean(VOCAB_BY_LEVEL[level])
}

// "kanji|bacaan|arti" -> { kanji, kana, meaning }
export function parseVocabEntry(raw) {
  const parts = String(raw).split('|')
  return {
    kanji: (parts[0] || '').trim(),
    kana: (parts[1] || '').trim(),
    meaning: (parts[2] || '').trim(),
  }
}

const CACHE = new Map()

// Mengembalikan daftar tema berurutan:
// [{ id, label, labelId, words: [{ id, kanji, kana, meaning }] }]
export function getVocabThemes(level) {
  if (!isVocabAvailable(level)) return []
  if (!CACHE.has(level)) {
    const data = VOCAB_BY_LEVEL[level]
    const themes = data.themes.map((theme) => ({
      id: theme.id,
      label: theme.label,
      labelId: theme.labelId,
      words: theme.words.map((raw, index) => ({
        id: `${level}-${theme.id}-${index}`,
        ...parseVocabEntry(raw),
      })),
    }))
    CACHE.set(level, themes)
  }
  return CACHE.get(level)
}

export function getVocabCount(level) {
  return getVocabThemes(level).reduce((sum, theme) => sum + theme.words.length, 0)
}
