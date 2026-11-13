const VALID_LEVELS = ['N1', 'N2']

const MEM_FALLBACK = new Map()
let _storeAvailableCache = null

function _keyFor(level) {
  return `jlpt-progress-${level.toLowerCase()}`
}

function _defaultStructure() {
  return {
    histories: [],
    aggregate: {
      attemptedTypes: [],
      bestScore: 0,
      avgScore: 0,
      totalCompleted: 0,
    },
  }
}

function _safeParse(raw) {
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === 'object') {
      return {
        histories: Array.isArray(parsed.histories) ? parsed.histories : [],
        aggregate: {
          attemptedTypes: Array.isArray(parsed.aggregate?.attemptedTypes)
            ? [...new Set(parsed.aggregate.attemptedTypes.filter((t) => typeof t === 'string'))]
            : [],
          bestScore: Number.isFinite(parsed.aggregate?.bestScore)
            ? parsed.aggregate.bestScore
            : 0,
          avgScore: Number.isFinite(parsed.aggregate?.avgScore)
            ? parsed.aggregate.avgScore
            : 0,
          totalCompleted: Number.isFinite(parsed.aggregate?.totalCompleted)
            ? parsed.aggregate.totalCompleted
            : 0,
        },
      }
    }
  } catch {
    // fallthrough
  }
  return _defaultStructure()
}

function _coerceStructure(safe) {
  return {
    histories: Array.isArray(safe.histories) ? safe.histories : [],
    aggregate: {
      attemptedTypes: Array.isArray(safe.aggregate?.attemptedTypes)
        ? [...new Set(safe.aggregate.attemptedTypes.filter((t) => typeof t === 'string'))]
        : [],
      bestScore: Number.isFinite(safe.aggregate?.bestScore)
        ? safe.aggregate.bestScore
        : 0,
      avgScore: Number.isFinite(safe.aggregate?.avgScore)
        ? safe.aggregate.avgScore
        : 0,
      totalCompleted: Number.isFinite(safe.aggregate?.totalCompleted)
        ? safe.aggregate.totalCompleted
        : 0,
    },
  }
}

function _testStorageWritable(store) {
  try {
    const TEST_KEY = '__ngebut_jlpt_test__'
    store.setItem(TEST_KEY, '1')
    store.removeItem(TEST_KEY)
    return true
  } catch (err) {
    const name = (err && err.name) || ''
    const code = (err && err.code) || 0
    if (
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      code === 22 ||
      code === 1014
    ) {
      // quota penuh — masih bisa baca, tidak bisa tulis
      return 'READ_ONLY'
    }
    // SecurityError (private mode Safari) / InvalidAccessError / lainnya → storage unavailable
    return false
  }
}

function _storage() {
  if (_storeAvailableCache !== null) {
    return _storeAvailableCache
  }
  try {
    if (typeof window === 'undefined') {
      _storeAvailableCache = 'MEMORY'
      return _storeAvailableCache
    }
    const store = window.localStorage
    if (!store) {
      _storeAvailableCache = 'MEMORY'
      return _storeAvailableCache
    }
    const status = _testStorageWritable(store)
    if (status === true) {
      _storeAvailableCache = store
    } else if (status === 'READ_ONLY') {
      // Bisa baca, tulis gagal → gunakan campuran: baca dari localStorage, tulis ke mem
      _storeAvailableCache = 'READ_THROUGH'
    } else {
      _storeAvailableCache = 'MEMORY'
    }
  } catch {
    _storeAvailableCache = 'MEMORY'
  }
  return _storeAvailableCache
}

function _rawGetItem(key) {
  const store = _storage()
  try {
    if (store && typeof store !== 'string' && typeof store.getItem === 'function') {
      return store.getItem(key)
    }
    if (store === 'READ_THROUGH' && typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key)
    }
  } catch {
    // fallthrough
  }
  if (MEM_FALLBACK.has(key)) {
    return MEM_FALLBACK.get(key)
  }
  return null
}

function _rawSetItem(key, value) {
  const store = _storage()
  try {
    if (store && typeof store !== 'string' && typeof store.setItem === 'function') {
      store.setItem(key, value)
      MEM_FALLBACK.set(key, value)
      return true
    }
  } catch (err) {
    const name = (err && err.name) || ''
    const code = (err && err.code) || 0
    if (
      name === 'QuotaExceededError' ||
      name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      code === 22 ||
      code === 1014
    ) {
      // Quota penuh — simpan ke mem fallback saja, return false sebagai tanda tidak persist
      MEM_FALLBACK.set(key, value)
      return false
    }
    // Error lain: SecurityError dll — fallthrough ke memory
  }
  MEM_FALLBACK.set(key, value)
  if (store && typeof store !== 'string') {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value)
      }
    } catch {
      // abaikan — sudah disimpan ke memory
    }
  }
  return store === 'MEMORY' || store === 'READ_THROUGH' ? false : true
}

export function loadProgress(level) {
  if (!VALID_LEVELS.includes(level)) {
    return _defaultStructure()
  }
  try {
    const raw = _rawGetItem(_keyFor(level))
    if (!raw) return _defaultStructure()
    return _safeParse(raw)
  } catch {
    return _defaultStructure()
  }
}

export function saveProgress(level, progressObj) {
  if (!VALID_LEVELS.includes(level)) {
    return false
  }
  try {
    const toSave = _coerceStructure(progressObj || _defaultStructure())
    const serialized = JSON.stringify(toSave)
    return _rawSetItem(_keyFor(level), serialized)
  } catch {
    return false
  }
}

export function appendHistory(level, history) {
  const current = loadProgress(level)
  if (!history || typeof history !== 'object') {
    return current
  }

  const histories = [...current.histories, history]
  const allScores = histories
    .map((h) => Number(h.scorePercent))
    .filter((s) => Number.isFinite(s))

  const bestScore = allScores.length > 0 ? Math.max(...allScores) : 0
  const avgScore =
    allScores.length > 0
      ? Math.round((allScores.reduce((a, b) => a + b, 0) / allScores.length) * 100) / 100
      : 0
  const totalCompleted = histories.length

  const typeSet = new Set(current.aggregate.attemptedTypes)
  if (Array.isArray(history.typeBreakdown)) {
    for (const tb of history.typeBreakdown) {
      if (tb && typeof tb.type === 'string') {
        typeSet.add(tb.type)
      }
    }
  }
  if (Array.isArray(history.answered)) {
    for (const ans of history.answered) {
      if (ans && typeof ans.problem_type === 'string') {
        typeSet.add(ans.problem_type)
      }
    }
  }

  const updated = {
    histories,
    aggregate: {
      attemptedTypes: [...typeSet],
      bestScore,
      avgScore,
      totalCompleted,
    },
  }

  saveProgress(level, updated)
  return updated
}

export function getAggregateAllLevels() {
  return {
    N1: loadProgress('N1').aggregate,
    N2: loadProgress('N2').aggregate,
  }
}

export function _isUsingMemoryFallback() {
  const s = _storage()
  return s === 'MEMORY' || s === 'READ_THROUGH'
}

// ---- Preferensi sederhana (string) — dipakai mis. toggle Furigana ----
export function getPref(key) {
  return _rawGetItem(key)
}

export function setPref(key, value) {
  return _rawSetItem(key, value)
}
