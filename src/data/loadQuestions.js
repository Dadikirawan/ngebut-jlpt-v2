import n1Data from './n1_structured.json' with { type: 'json' }
import n2Data from './n2_structured.json' with { type: 'json' }
import n1Explanations from './n1_explanations.json' with { type: 'json' }
import n2Explanations from './n2_explanations.json' with { type: 'json' }

const DATA_BY_LEVEL = {
  N1: n1Data,
  N2: n2Data,
}

const EXPLANATIONS_BY_LEVEL = {
  N1: n1Explanations,
  N2: n2Explanations,
}

function _getExplanation(level, problemNumber, questionNumber) {
  const exp = EXPLANATIONS_BY_LEVEL[level]
  if (!exp) return null
  const key = `${problemNumber}-${questionNumber}`
  const entry = exp[key]
  if (!entry || typeof entry.alasan !== 'string') return null
  const trimmed = entry.alasan.trim()
  return trimmed.length > 0 ? trimmed : null
}

const VALID_TYPES = [
  'vocab_grammar_choice',
  'sentence_order',
  'cloze_passage',
  'reading',
]

function _validateLevel(level) {
  if (!DATA_BY_LEVEL[level]) {
    throw new Error(
      `Invalid level "${level}". Valid levels are: ${Object.keys(DATA_BY_LEVEL).join(', ')}`
    )
  }
}

function _validateType(type) {
  if (type && !VALID_TYPES.includes(type)) {
    throw new Error(
      `Invalid problem type "${type}". Valid types are: ${VALID_TYPES.join(', ')}`
    )
  }
}

function _pickQuestionFields(q, base) {
  return {
    ...base,
    question_number: q.number,
    prompt: q.prompt,
    options: q.options ? { ...q.options } : undefined,
    answer: q.answer,
  }
}

function flattenQuestions(level) {
  _validateLevel(level)
  const data = DATA_BY_LEVEL[level]
  const results = []

  for (const problem of data.problems) {
    const base = {
      level,
      problem_number: problem.problem_number,
      problem_title: problem.title,
      problem_type: problem.type,
    }

    if (problem.type === 'vocab_grammar_choice') {
      for (const q of problem.questions) {
        const pick = _pickQuestionFields(q, base)
        pick.explanation = _getExplanation(level, problem.problem_number, q.number)
        results.push(pick)
      }
    } else if (problem.type === 'sentence_order') {
      for (const q of problem.questions) {
        const item = {
          ...base,
          question_number: q.number,
          prompt_template: q.prompt_template,
          prompt: q.prompt_template,
          fragments: q.fragments ? { ...q.fragments } : undefined,
          correct_order: q.correct_order,
          options: q.fragments ? { ...q.fragments } : undefined,
          answer: q.answer,
          explanation: _getExplanation(level, problem.problem_number, q.number),
        }
        results.push(item)
      }
    } else if (problem.type === 'cloze_passage') {
      const passageCtx = {
        passage_text: problem.passage,
      }
      for (const b of problem.blanks) {
        results.push({
          ...base,
          ...passageCtx,
          question_number: b.number,
          prompt: `【${b.number}】`,
          options: b.options ? { ...b.options } : undefined,
          answer: b.answer,
          explanation: _getExplanation(level, problem.problem_number, b.number),
        })
      }
    } else if (problem.type === 'reading') {
      for (let pIdx = 0; pIdx < problem.passages.length; pIdx++) {
        const passage = problem.passages[pIdx]
        const passageId = `${level}-P${problem.problem_number}-passage${pIdx}`
        const passageCtx = {
          passage_id: passageId,
          passage_text: passage.passage_text,
          table_data: passage.table_data
            ? {
                headers: [...passage.table_data.headers],
                rows: passage.table_data.rows.map((r) => ({ ...r })),
              }
            : undefined,
          footnotes: passage.footnotes ? [...passage.footnotes] : undefined,
        }
        for (const q of passage.questions) {
          results.push({
            ...base,
            ...passageCtx,
            question_number: q.number,
            prompt: q.prompt,
            options: q.options ? { ...q.options } : undefined,
            answer: q.answer,
            explanation: _getExplanation(level, problem.problem_number, q.number),
          })
        }
      }
    }
  }

  return results
}

const CACHE = new Map()

function getFlattenedCached(level) {
  if (!CACHE.has(level)) {
    CACHE.set(level, flattenQuestions(level))
  }
  return CACHE.get(level)
}

export function getQuestionsByLevel(level) {
  _validateLevel(level)
  return getFlattenedCached(level).map((q) => ({ ...q }))
}

export function getQuestionsByProblemType(level, type) {
  _validateLevel(level)
  _validateType(type)
  const all = getFlattenedCached(level)
  const filtered = type ? all.filter((q) => q.problem_type === type) : all
  return filtered.map((q) => ({ ...q }))
}

function _shuffleInPlace(arr, rng = Math.random) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function getRandomQuizSet(level, count) {
  _validateLevel(level)
  const all = getFlattenedCached(level)
  if (!Number.isInteger(count) || count <= 0) {
    throw new Error(`count must be a positive integer, got: ${count}`)
  }
  if (count > all.length) {
    throw new Error(
      `count (${count}) exceeds total available questions for ${level} (${all.length})`
    )
  }

  const typeBuckets = new Map()
  for (const q of all) {
    if (!typeBuckets.has(q.problem_type)) {
      typeBuckets.set(q.problem_type, [])
    }
    typeBuckets.get(q.problem_type).push(q)
  }

  for (const bucket of typeBuckets.values()) {
    _shuffleInPlace(bucket)
  }

  const types = [...typeBuckets.keys()]
  const bucketCursors = new Map(types.map((t) => [t, 0]))
  const selected = []
  const selectedKeys = new Set()

  function getUniqueKey(q) {
    return `${q.problem_type}-${q.problem_number}-${q.question_number}`
  }

  let tries = 0
  while (selected.length < count && tries < count * 50) {
    tries++
    const type = types[selected.length % types.length]
    const bucket = typeBuckets.get(type)
    if (!bucket || bucket.length === 0) continue
    let cursor = bucketCursors.get(type)
    if (cursor >= bucket.length) {
      cursor = 0
    }
    const candidate = bucket[cursor]
    bucketCursors.set(type, cursor + 1)
    const key = getUniqueKey(candidate)
    if (!selectedKeys.has(key)) {
      selectedKeys.add(key)
      selected.push(candidate)
    }
  }

  if (selected.length < count) {
    for (const q of _shuffleInPlace([...all])) {
      if (selected.length >= count) break
      const key = getUniqueKey(q)
      if (!selectedKeys.has(key)) {
        selectedKeys.add(key)
        selected.push(q)
      }
    }
  }

  _shuffleInPlace(selected)

  return selected.map((q) => ({ ...q }))
}
