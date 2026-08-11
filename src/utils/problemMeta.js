import n1Data from '../data/n1_structured.json' with { type: 'json' }
import n2Data from '../data/n2_structured.json' with { type: 'json' }

const DATA_BY_LEVEL = {
  N1: n1Data,
  N2: n2Data,
}

function _countQuestionsForProblem(problem) {
  if (!problem) return 0
  switch (problem.type) {
    case 'vocab_grammar_choice':
    case 'sentence_order':
      return problem.questions ? problem.questions.length : 0
    case 'cloze_passage':
      return problem.blanks ? problem.blanks.length : 0
    case 'reading':
      return problem.passages
        ? problem.passages.reduce(
            (sum, pass) => sum + (pass.questions ? pass.questions.length : 0),
            0
          )
        : 0
    default:
      return 0
  }
}

function _buildCategoryLabel(type) {
  switch (type) {
    case 'vocab_grammar_choice':
      return 'Pilihan Ganda'
    case 'sentence_order':
      return 'Susunan Kalimat'
    case 'cloze_passage':
      return 'Lengkapi Bacaan'
    case 'reading':
      return 'Pemahaman Bacaan'
    default:
      return 'Soal'
  }
}

export const PROBLEM_META = {
  N1: {
    P1: {
      titleJp: '漢字読み',
      titleId: 'Baca Kanji',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih bacaan (yomikata) yang benar untuk kanji dalam kalimat.',
      questionCount: 15,
    },
    P2: {
      titleJp: '文脈規定',
      titleId: 'Konteks Kosakata',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih kata yang paling sesuai untuk mengisi bagian kosong berdasarkan konteks kalimat.',
      questionCount: 20,
    },
    P3: {
      titleJp: '言い換え類義',
      titleId: 'Sinonim & Parafrase',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih ungkapan yang memiliki arti paling dekat dengan kata yang digarisbawahi.',
      questionCount: 10,
    },
    P4: {
      titleJp: '用法',
      titleId: 'Penggunaan Kata',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih kalimat yang menggunakan kata target dengan cara yang paling tepat dan alami.',
      questionCount: 5,
    },
    P5: {
      titleJp: '文法形式の判断',
      titleId: 'Struktur Tata Bahasa',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih bentuk tata bahasa (bunkei) yang benar untuk mengisi bagian kosong.',
      questionCount: 30,
    },
    P6: {
      titleJp: '文の組み立て',
      titleId: 'Susunan Kalimat (★)',
      categoryLabel: 'Susunan Kalimat',
      description: 'Susun fragmen kata menjadi kalimat yang benar dan tentukan posisi tanda ★.',
      questionCount: 10,
    },
    P7: {
      titleJp: '文章の文法',
      titleId: 'Tata Bahasa dalam Bacaan',
      categoryLabel: 'Lengkapi Bacaan',
      description: 'Lengkapi bagian kosong dalam sebuah bacaan dengan bentuk tata bahasa yang tepat.',
      questionCount: 10,
    },
    P8: {
      titleJp: '内容理解・短文',
      titleId: 'Pemahaman Teks Pendek',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Baca teks pendek dan jawab pertanyaan tentang isi, tujuan, atau informasi spesifik.',
      questionCount: 4,
    },
    P9: {
      titleJp: '内容理解・中文',
      titleId: 'Pemahaman Teks Sedang',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Baca teks berukuran sedang dan pahami detail, alur, serta maksud penulis.',
      questionCount: 9,
    },
    P10: {
      titleJp: '内容理解・長文',
      titleId: 'Pemahaman Teks Panjang',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Baca teks panjang dan jawab pertanyaan tentang struktur, tema, dan rincian isi.',
      questionCount: 4,
    },
    P11: {
      titleJp: '複数テキストの理解',
      titleId: 'Perbandingan Multi Teks',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Bandingkan beberapa teks terkait (misal: artikel, pengumuman) untuk menemukan informasi.',
      questionCount: 3,
    },
    P12: {
      titleJp: '主張理解・長文',
      titleId: 'Pemahaman Argumen Penulis',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Identifikasi pendapat, argumen, dan kesimpulan utama penulis dalam esai/opini panjang.',
      questionCount: 5,
    },
    P13: {
      titleJp: '情報検索',
      titleId: 'Pencarian Informasi (Tabel)',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Cari informasi spesifik yang diperlukan dari tabel, bagan, atau materi iklan/pengumuman.',
      questionCount: 2,
    },
  },
  N2: {
    P1: {
      titleJp: '漢字読み',
      titleId: 'Baca Kanji',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih bacaan (yomikata) yang benar untuk kanji dalam kalimat.',
      questionCount: 15,
    },
    P2: {
      titleJp: '表記',
      titleId: 'Notasi Kanji',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih bentuk kanji (hyōki) yang benar untuk kata yang ditulis dalam hiragana.',
      questionCount: 5,
    },
    P3: {
      titleJp: '語形成',
      titleId: 'Pembentukan Kata',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih kombinasi awalan/akhiran atau bentuk kata yang paling tepat.',
      questionCount: 5,
    },
    P4: {
      titleJp: '文脈規定',
      titleId: 'Konteks Kosakata',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih kata yang paling sesuai untuk mengisi bagian kosong berdasarkan konteks kalimat.',
      questionCount: 20,
    },
    P5: {
      titleJp: '言い換え類義',
      titleId: 'Sinonim & Parafrase',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih ungkapan yang memiliki arti paling dekat dengan kata yang digarisbawahi.',
      questionCount: 10,
    },
    P6: {
      titleJp: '用法',
      titleId: 'Penggunaan Kata',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih kalimat yang menggunakan kata target dengan cara yang paling tepat dan alami.',
      questionCount: 5,
    },
    P7: {
      titleJp: '文法形式の判断',
      titleId: 'Struktur Tata Bahasa',
      categoryLabel: 'Pilihan Ganda',
      description: 'Pilih bentuk tata bahasa (bunkei) yang benar untuk mengisi bagian kosong.',
      questionCount: 20,
    },
    P8: {
      titleJp: '文の組み立て',
      titleId: 'Susunan Kalimat (★)',
      categoryLabel: 'Susunan Kalimat',
      description: 'Susun fragmen kata menjadi kalimat yang benar dan tentukan posisi tanda ★.',
      questionCount: 5,
    },
    P9: {
      titleJp: '文章の文法',
      titleId: 'Tata Bahasa dalam Bacaan',
      categoryLabel: 'Lengkapi Bacaan',
      description: 'Lengkapi bagian kosong dalam sebuah bacaan dengan bentuk tata bahasa yang tepat.',
      questionCount: 5,
    },
    P10: {
      titleJp: '内容理解・短文',
      titleId: 'Pemahaman Teks Pendek',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Baca teks pendek dan jawab pertanyaan tentang isi, tujuan, atau informasi spesifik.',
      questionCount: 6,
    },
    P11: {
      titleJp: '内容理解・中文',
      titleId: 'Pemahaman Teks Sedang',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Baca teks berukuran sedang dan pahami detail, alur, serta maksud penulis.',
      questionCount: 6,
    },
    P12: {
      titleJp: '統合理解',
      titleId: 'Pemahaman Terintegrasi',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Bandingkan dan integrasikan informasi dari beberapa sumber teks yang berbeda.',
      questionCount: 3,
    },
    P13: {
      titleJp: '主張理解・長文',
      titleId: 'Pemahaman Argumen Penulis',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Identifikasi pendapat, argumen, dan kesimpulan utama penulis dalam esai/opini panjang.',
      questionCount: 5,
    },
    P14: {
      titleJp: '情報検索',
      titleId: 'Pencarian Informasi (Tabel)',
      categoryLabel: 'Pemahaman Bacaan',
      description: 'Cari informasi spesifik yang diperlukan dari tabel, bagan, atau materi iklan/pengumuman.',
      questionCount: 2,
    },
  },
}

export const LEVEL_INFO = {
  N1: {
    labelJp: '日本語能力試験N1',
    labelId: 'JLPT Level N1',
    desc: 'Level tertinggi. Diharapkan mampu memahami bahasa Jepang kompleks di berbagai konteks akademis, pekerjaan, dan masyarakat umum.',
  },
  N2: {
    labelJp: '日本語能力試験N2',
    labelId: 'JLPT Level N2',
    desc: 'Level menengah-atas. Diharapkan mampu memahami bahasa Jepang pada situasi sehari-hari serta topik yang sedikit luas.',
  },
}

export function getProblemMeta(level, problemNumber) {
  const levelData = DATA_BY_LEVEL[level]
  const pNum =
    typeof problemNumber === 'string'
      ? parseInt(problemNumber.replace(/^P/i, ''), 10)
      : Number(problemNumber)
  const key = `P${pNum}`

  const staticMeta = PROBLEM_META[level]?.[key] || {
    titleJp: '',
    titleId: '',
    categoryLabel: '',
    description: '',
    questionCount: 0,
  }

  const rawProblem = levelData?.problems?.find(
    (p) => Number(p.problem_number) === Number(pNum)
  )

  const dynamicCount = rawProblem ? _countQuestionsForProblem(rawProblem) : 0
  const questionCount = dynamicCount > 0 ? dynamicCount : staticMeta.questionCount
  const categoryLabel =
    rawProblem?.type && !staticMeta.categoryLabel
      ? _buildCategoryLabel(rawProblem.type)
      : staticMeta.categoryLabel

  return {
    ...staticMeta,
    questionCount,
    categoryLabel,
  }
}
