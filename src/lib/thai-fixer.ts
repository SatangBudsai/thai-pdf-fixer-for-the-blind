/**
 * Fix garbled Thai text from PDFs.
 *
 * Approach inspired by pdf2txt_th (github.com/veer66/pdf2txt_th, LGPL-3.0).
 * Fixes at the CHARACTER level (encoding, ordering, spacing) for maximum accuracy.
 * Avoids word-level guessing that causes false positives.
 *
 * Pipeline:
 * 1. Character remapping (garbled chars → correct Thai) — only in Thai context
 * 2. If severe garbling: digit/symbol substitutions + space stripping
 * 3. Combining character reordering (pdf2txt_th rules)
 * 4. Remove spaces before/between combining marks
 * 5. Sara Am reconstruction (ํ + า → ำ)
 * 6. General spacing cleanup
 * 7. Dictionary-based Sara Am correction (conservative, multi-syllable only)
 * 8. Encoding mojibake fix (TIS-620 / Windows-874)
 */

// ══════════════════════════════════════════════════════════════════════
// Unicode ranges
// ══════════════════════════════════════════════════════════════════════

const CONSONANTS = '\u0E01-\u0E2E' // ก-ฮ
const ABOVE_BELOW = '\u0E31\u0E34-\u0E3A' // ั ิ ี ึ ื ุ ู ฺ
const TONE_MARKS = '\u0E48-\u0E4B' // ่ ้ ๊ ๋
const THAI_RANGE = '\u0E00-\u0E7F' // all Thai

// Combining characters used in pdf2txt_th reordering rules
// Vowels/marks that appear above or below the consonant
const COMBINING_VOWELS = '\u0E33\u0E38\u0E39\u0E34\u0E35\u0E36\u0E37\u0E4D'
// ำ ุ ู ิ ี ึ ื ํ

const RE_THAI = new RegExp(`[${THAI_RANGE}]`)

// ══════════════════════════════════════════════════════════════════════
// Phase 1: Character remapping (pdf2txt_th style)
// ══════════════════════════════════════════════════════════════════════
// When PDF fonts use non-standard encoding, Latin characters may appear
// where Thai combining marks should be. Only remap when surrounded by Thai.

function applyCharacterRemapping(text: string): string {
  // Latin → Thai mappings that only apply in Thai context
  const contextMappings: [string, string][] = [
    ['e', '\u0E35'], // ี (sara ii)
    ['i', '\u0E49'], // ้ (mai tho)
    ['h', '\u0E48'], // ่ (mai ek)
    ['j', '\u0E4A'], // ๊ (mai tri)
    ['k', '\u0E4B'], // ๋ (mai chattawa)
    ['`', '\u0E34'] // ิ (sara i)
  ]

  let result = text

  for (const [from, to] of contextMappings) {
    // Only replace when preceded by Thai and followed by Thai or whitespace+Thai
    const re = new RegExp(`([${THAI_RANGE}])${escapeRegex(from)}(?=[${THAI_RANGE}]|\\s*[${THAI_RANGE}])`, 'g')
    result = result.replace(re, `$1${to}`)
  }

  // Always normalize typographic quotes
  result = result.replace(/[\u201C\u201D]/g, '"')
  result = result.replace(/[\u2018\u2019]/g, "'")

  return result
}

// ══════════════════════════════════════════════════════════════════════
// Phase 2: Severe garbling detection & fixes (Type B)
// ══════════════════════════════════════════════════════════════════════
// Government/EEC documents: spaces between every char, digit/symbol subs

function detectGarblingLevel(text: string): 'mild' | 'severe' {
  const collapsed = text.replace(/ {2,}/g, ' ')
  let thaiCount = 0
  let singleCharRuns = 0

  for (let i = 0; i < collapsed.length; i++) {
    if (!RE_THAI.test(collapsed[i])) continue
    thaiCount++
    const prevSpace = i === 0 || collapsed[i - 1] === ' ' || !RE_THAI.test(collapsed[i - 1])
    const nextSpace = i === collapsed.length - 1 || collapsed[i + 1] === ' ' || !RE_THAI.test(collapsed[i + 1])
    if (prevSpace && nextSpace) singleCharRuns++
  }

  if (thaiCount < 10) return 'mild'
  if (singleCharRuns / thaiCount > 0.3) return 'severe'

  // Also check for digits/symbols in combining-mark positions
  if (/[\u0E01-\u0E2E] *\d/.test(text) || /[\u0E01-\u0E2E] *[;\\!@#]/.test(text)) {
    return 'severe'
  }

  return 'mild'
}

function fixDigitSubstitutions(text: string): string {
  let result = text
  const consonantSrc = `[${CONSONANTS}]`
  const combiningSrc = `[${ABOVE_BELOW}\u0E47-\u0E4E]`
  const thaiSrc = `[${THAI_RANGE}]`

  // Multi-digit substitutions first (longer match = higher priority)
  const multiDigitMap: [string, string][] = [
    ['56', '\u0E39\u0E48'], // ู่
    ['5@', '\u0E39'], // ู
    ['34', '\u0E36\u0E49'] // ึ้
  ]

  for (const [digits, replacement] of multiDigitMap) {
    const re = new RegExp(`(${consonantSrc}(?:${combiningSrc})*)${escapeRegex(digits)}(?= ?${thaiSrc}|\\s|$)`, 'g')
    result = result.replace(re, `$1${replacement}`)
  }

  // Single-digit substitutions
  const singleDigitMap: [string, string][] = [
    ['7', '\u0E47'], // ็ (mai taikhu)
    ['5', '\u0E39'], // ู (sara uu)
    ['6', '\u0E48'], // ่ (mai ek)
    ['3', '\u0E36'], // ึ (sara ue)
    ['0', '\u0E30'] // ะ (sara a)
  ]

  for (const [digit, replacement] of singleDigitMap) {
    const re = new RegExp(`(${consonantSrc}(?:${combiningSrc})*)${escapeRegex(digit)}(?= ?${thaiSrc}|\\s|$)`, 'g')
    result = result.replace(re, `$1${replacement}`)
  }

  return result
}

function fixSymbolSubstitutions(text: string): string {
  let result = text
  const consonantSrc = `[${CONSONANTS}]`
  const thaiSrc = `[${THAI_RANGE}]`

  const symbolRules: [RegExp, string][] = [
    [new RegExp(`(${consonantSrc}); ?`, 'g'), '$1\u0E37\u0E48'], // ื่
    [new RegExp(`(${consonantSrc})! ?`, 'g'), '$1\u0E39\u0E48'], // ู่
    [new RegExp(`(${thaiSrc})\\\\ ?(${thaiSrc})`, 'g'), '$1$2'], // remove \
    [new RegExp(`(${thaiSrc})@ ?(${thaiSrc})`, 'g'), '$1$2'], // remove @
    [new RegExp(`(${thaiSrc})# ?(${thaiSrc})`, 'g'), '$1$2'], // remove #
    [new RegExp(`(${consonantSrc})' ?(${thaiSrc})`, 'g'), '$1\u0E4C$2'], // ์ (thanthakhat)
    [new RegExp(`(${consonantSrc})\\+ ?(${thaiSrc})`, 'g'), '$1\u0E47$2'] // ็ (mai taikhu)
  ]

  for (const [pattern, replacement] of symbolRules) {
    result = result.replace(pattern, replacement)
  }

  return result
}

function stripInterCharSpaces(text: string): string {
  return text
    .split('\n')
    .map(line => {
      let working = line.replace(/ {2,}/g, ' ')
      let prev = ''
      while (prev !== working) {
        prev = working
        working = working.replace(/([\u0E00-\u0E7F]) ([\u0E00-\u0E7F])/g, '$1$2')
      }
      return working
    })
    .join('\n')
}

// ══════════════════════════════════════════════════════════════════════
// Phase 3: Combining character reordering (from pdf2txt_th)
// ══════════════════════════════════════════════════════════════════════
// Thai combining marks must appear in a specific order:
//   consonant → above/below vowel → tone mark
// PDFs sometimes output them in wrong order or with spaces between.

function reorderCombiningChars(text: string): string {
  let result = text

  // Rule 1: Tone mark before vowel → swap to vowel before tone mark
  // Example: ก่ิ → กิ่ (mai ek before sara i → sara i before mai ek)
  result = result.replace(new RegExp(`([${TONE_MARKS}])([${COMBINING_VOWELS}])`, 'g'), '$2$1')

  // Rule 2: Vowel + whitespace + tone mark → remove whitespace
  // Example: กิ ่ → กิ่
  result = result.replace(new RegExp(`([${COMBINING_VOWELS}])\\s+([${TONE_MARKS}])`, 'g'), '$1$2')

  // Rule 3: Whitespace before combining vowel → remove
  // Example: ก ิ → กิ (space before sara i)
  result = result.replace(new RegExp(`\\s+(?=[${COMBINING_VOWELS}])`, 'g'), '')

  // Rule 4 (pdf2txt_th special case): ู + consonant + tone mark before ำ
  // Reorder: ู + tone + consonant
  result = result.replace(new RegExp(`(\u0E39)([${CONSONANTS}])([${TONE_MARKS}])(?=\u0E33)`, 'g'), '$1$3$2')

  return result
}

// ══════════════════════════════════════════════════════════════════════
// Phase 4: Remove spaces before/between combining marks
// ══════════════════════════════════════════════════════════════════════

function removeSpacesAroundCombining(text: string): string {
  let result = text

  // Remove space between any character and a Thai combining mark
  // This is more general than the pdf2txt_th rules — catches all cases
  result = result.replace(new RegExp(`(.) +([${ABOVE_BELOW}\u0E47-\u0E4E])`, 'g'), '$1$2')

  // Also remove space between consonant and sara aa (า) when followed by
  // another combining mark (which indicates decomposed sara am)
  // Example: "ก า" where า has combining marks → likely should be กา or กำ
  result = result.replace(new RegExp(`([${CONSONANTS}])([${ABOVE_BELOW}\u0E47-\u0E4E]*) +\u0E32`, 'g'), (match, consonant: string, marks: string) => {
    // If there's already an above/below vowel, keep the space (it's a word boundary)
    if (/[\u0E34-\u0E39]/.test(marks)) return match
    return consonant + marks + '\u0E32'
  })

  return result
}

// ══════════════════════════════════════════════════════════════════════
// Phase 5: Sara Am reconstruction (ํ + า → ำ)
// ══════════════════════════════════════════════════════════════════════

function reconstructSaraAm(text: string): string {
  let result = text

  // Nikhahit (ํ) + Sara Aa (า) → Sara Am (ำ) — with or without space
  result = result.replace(/\u0E4D\s*\u0E32/g, '\u0E33')

  // Consonant + space + า → check if it should be ำ
  // This specifically handles the case where pdfjs-dist decomposes ำ into
  // separate text items: consonant item + "า" item with space between
  // Note: consonant + space + า is handled by removeSpacesAroundCombining
  // and then the dictionary phase. We don't guess here.

  return result
}

// ══════════════════════════════════════════════════════════════════════
// Phase 6: General spacing cleanup
// ══════════════════════════════════════════════════════════════════════

function fixSpacingArtifacts(text: string): string {
  let result = text
  result = result.replace(/ {2,}/g, ' ')
  result = result.replace(/([A-Za-z0-9]) +- +([A-Za-z0-9])/g, '$1-$2')
  return result
}

// ══════════════════════════════════════════════════════════════════════
// Phase 7: Dictionary-based Sara Am correction
// ══════════════════════════════════════════════════════════════════════
// CONSERVATIVE: only fix multi-syllable words where the wrong form
// never occurs naturally in Thai. No 2-char words (too ambiguous).
//
// Two directions:
// A. า→ำ: "สาคัญ" → "สำคัญ" (garbled ำ extracted as า)
// B. ำ→า: "ภำรกิจ" → "ภารกิจ" (garbled า extracted as ำ)

// Words that SHOULD have ำ — their า-version is always wrong
const WORDS_WITH_AM: string[] = [
  // ก
  'กำลัง',
  'กำหนด',
  'กำไร',
  'กำเนิด',
  'กำจัด',
  'กำกับ',
  'กำแพง',
  'กำนัน',
  'กำปั้น',
  'กำมะถัน',
  'กำไล',
  'กำนล',
  'กำเริบ',
  'กำชับ',
  'กำสรวล',
  'กำธร',
  'กำพร้า',
  'กำพืด',
  'กำเหน็จ',
  'กำราบ',
  'กำหราบ',
  'กำเดา',
  'กำมะหยี่',
  // ข
  'ขำขัน',
  // ค
  'คำสั่ง',
  'คำถาม',
  'คำตอบ',
  'คำพูด',
  'คำศัพท์',
  'คำนวณ',
  'คำร้อง',
  'คำขอ',
  'คำแนะนำ',
  'คำอธิบาย',
  'คำนำ',
  'คำปรึกษา',
  'คำมั่น',
  // จ
  'จำเป็น',
  'จำนวน',
  'จำกัด',
  'จำได้',
  'จำหน่าย',
  'จำลอง',
  'จำแนก',
  'จำคุก',
  'จำปา',
  'จำพวก',
  'จำเลย',
  'จำยอม',
  'จำใจ',
  'จำศีล',
  // ช
  'ชำนาญ',
  'ชำระ',
  'ชำรุด',
  'ชำแหละ',
  'ชำเลือง',
  // ด
  'ดำเนิน',
  'ดำรง',
  'ดำริ',
  'ดำน้ำ',
  // ต
  'ตำแหน่ง',
  'ตำรวจ',
  'ตำรา',
  'ตำบล',
  'ตำนาน',
  'ตำหนิ',
  'ตำหนัก',
  // ท
  'ทำให้',
  'ทำงาน',
  'ทำได้',
  'ทำลาย',
  'ทำการ',
  'ทำนาย',
  'ทำนอง',
  'ทำบุญ',
  'ทำเนียบ',
  'ทำอาหาร',
  'ทำความ',
  'ทำหน้าที่',
  'ทำสัญญา',
  'ทำตาม',
  'ทำมาหากิน',
  'ทำเล',
  'ทำท่า',
  'ทำโทษ',
  'ทำขวัญ',
  // น
  'นำไป',
  'นำมา',
  'นำเสนอ',
  'นำทาง',
  'นำเข้า',
  'นำออก',
  'นำหน้า',
  'นำพา',
  'นำร่อง',
  'นำสมัย',
  'นำกลับ',
  'นำเที่ยว',
  'น้ำมัน',
  'น้ำตา',
  'น้ำใจ',
  'น้ำหนัก',
  'น้ำท่วม',
  'น้ำแข็ง',
  'น้ำตก',
  'น้ำเสีย',
  'น้ำดื่ม',
  'น้ำผึ้ง',
  'น้ำมนต์',
  'น้ำพริก',
  'น้ำหอม',
  'น้ำเงิน',
  'น้ำจืด',
  'น้ำเค็ม',
  'น้ำซุป',
  'น้ำปลา',
  // บ
  'บำรุง',
  'บำบัด',
  'บำเพ็ญ',
  'บำนาญ',
  'บำเหน็จ',
  // ป
  'ปฏิบำ', // rare but exists
  // ผ
  'ผลกำไร',
  'ผู้กำกับ',
  // พ
  'พำนัก',
  // ร
  'รำคาญ',
  'รำพัน',
  'รำลึก',
  'รำพึง',
  'รำไร',
  // ล
  'ลำดับ',
  'ลำเลียง',
  'ลำบาก',
  'ลำไย',
  'ลำธาร',
  'ลำพัง',
  'ลำต้น',
  'ลำไส้',
  'ลำเอียง',
  'ลำคลอง',
  'ลำนำ',
  'ลำพอง',
  'ลำปาง',
  // ส
  'สำคัญ',
  'สำหรับ',
  'สำนัก',
  'สำนักงาน',
  'สำเร็จ',
  'สำรวจ',
  'สำรอง',
  'สำเนา',
  'สำราญ',
  'สำอาง',
  'สำนึก',
  'สำแดง',
  'สำเภา',
  'สำรับ',
  'สำออย',
  'สำรวม',
  'สำเริง',
  'สำนวน',
  'สำมะโน',
  'สำลัก',
  'สำลี',
  'สำปะหลัง',
  // อ
  'อำนาจ',
  'อำเภอ',
  'อำนวย',
  'อำพราง',
  'อำมหิต',
  'อำลา',
  'อำมาตย์',
  // ประ- compound
  'ประจำ',
  'ประจำวัน',
  'ประจำปี',
  'ประจำเดือน',
  'ประจำการ',
  // Compound words
  'ข้อกำหนด',
  'ขีดจำกัด',
  'ฝึกอบรำ'
]

// Words that SHOULD have า — their ำ-version is always wrong
const WORDS_WITH_AA: string[] = [
  // ภ
  'ภารกิจ',
  'ภาค',
  'ภาพ',
  'ภาษา',
  'ภาษ',
  'ภาวะ',
  'ภาระ',
  'ภาคี',
  'ภาชนะ',
  'ภาพยนตร์',
  'ภาคภูมิ',
  'ภาคเอกชน',
  'ภาครัฐ',
  // เ-า compound
  'เซาท์',
  'เจาะ',
  'เขาว่า',
  'เขาใหญ่',
  // อ
  'อากาศ',
  'อาหาร',
  'อาการ',
  'อาสา',
  'อาย',
  'อายุ',
  'อาวุธ',
  'อาชีพ',
  'อาณาจักร',
  'อาศัย',
  'อาจารย์',
  'อารมณ์',
  'อาราม',
  'อาทิตย์',
  'อาเซียน',
  'อาคาร',
  'อาณา',
  'อาณาเขต',
  'อาทิ',
  'อาจ',
  // ก
  'การ',
  'การณ์',
  'กาล',
  'กาย',
  'การ์ด',
  'กาศ',
  'การเมือง',
  'การศึกษา',
  'การทำ',
  'การเงิน',
  'การค้า',
  // ส
  'สาร',
  'สาว',
  'สาม',
  'สาย',
  'สาขา',
  'สาธารณ',
  'สากล',
  'สาเหตุ',
  'สาธารณสุข',
  'สาธารณะ',
  'สาระ',
  // ร
  'ราคา',
  'ราก',
  'ราว',
  'ราง',
  'ราช',
  'ราศี',
  'ราชการ',
  'ราชวงศ์',
  // น
  'นาม',
  'นาที',
  'นาย',
  'นาง',
  'นาค',
  'นาฬิกา',
  'นาน',
  // ท
  'ทาน',
  'ทาส',
  'ทาย',
  'ทาง',
  'ทางการ',
  'ทางด้าน',
  // ม
  'มาก',
  'มาตร',
  'มาตรา',
  'มาตรฐาน',
  'มาร',
  'มาส',
  // บ
  'บาง',
  'บาท',
  'บาด',
  'บาป',
  'บาน',
  'บาร์',
  // ช
  'ชาว',
  'ชาติ',
  'ชาย',
  'ชาญ',
  'ชาง',
  'ชาร์จ',
  // ต
  'ตาก',
  'ตาม',
  'ตาย',
  'ตาง',
  'ต่างๆ',
  'ต่างชาติ',
  'ต่างประเทศ',
  // ป
  'ปาก',
  'ปาน',
  // ล
  'ลาย',
  'ลาก',
  'ลาว',
  'ลาภ',
  // ว
  'วาง',
  'วาด',
  'วาท',
  'วาร',
  'วาน',
  // ห
  'หาก',
  'หาย',
  'หาร',
  'หาง',
  // ค
  'คาด',
  'คาม',
  'คาว',
  'คาร์',
  'ความ',
  'ความรู้',
  'ความคิด',
  // จ
  'จาก',
  'จาง',
  'จาร',
  // ด
  'ดาว',
  'ดาร',
  'ดาน',
  'ดาบ',
  // พ
  'พาก',
  'พาน',
  'พาย',
  'พาร์',
  // Words with ้า (sara aa + mai tho)
  'หน้า',
  'ข้า',
  'ค่า',
  'ว่า',
  'น่า',
  'ท่า',
  'ผ่า',
  'ฆ่า',
  'น้า',
  'บ้า',
  'ป้า',
  'ล่า',
  'ฟ้า',
  'ม้า',
  // ประ-
  'ประกาศ',
  'ประการ',
  'ประกาย',
  'ประสาท',
  'ประชาชน',
  'ประชาธิปไตย',
  'ประเทศ',
  'ประกัน',
  // กระ-
  'กระจาย',
  'กระดาษ',
  'กระทรวง',
  // Other
  'สงคราม',
  'เวลา',
  'ปัญหา',
  'ตัวเลขา',
  'ประชา',
  'เครา',
  'ดารา',
  'มารา',
  'สารา'
]

/**
 * Generate wrong→right replacement pairs from dictionaries.
 *
 * CRITICAL: Direction A (า→ำ) and Direction B (ำ→า) are applied SEPARATELY
 * to prevent Direction B from undoing Direction A fixes.
 *
 * Example of the bug this prevents:
 * 1. Direction A: "ทางาน" → "ทำงาน" ✓
 * 2. Direction B: "ทำง" (wrong of "ทาง") matches inside "ทำงาน" → "ทางาน" ✗
 *
 * Fix: Direction B pairs are filtered to exclude any wrong-version that
 * appears as a substring of a correct ำ word in WORDS_WITH_AM.
 */
function buildDirectionA(): [string, string][] {
  const pairs: [string, string][] = []

  for (const word of WORDS_WITH_AM) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === '\u0E33') {
        const wrongVersion = word.slice(0, i) + '\u0E32' + word.slice(i + 1)
        if (wrongVersion.length >= 3) {
          pairs.push([wrongVersion, word])
        }
      }
    }
  }

  pairs.sort((a, b) => b[0].length - a[0].length)
  return pairs
}

function buildDirectionB(): [string, string][] {
  const pairs: [string, string][] = []

  for (const word of WORDS_WITH_AA) {
    for (let i = 0; i < word.length; i++) {
      if (word[i] === '\u0E32') {
        const wrongVersion = word.slice(0, i) + '\u0E33' + word.slice(i + 1)
        if (wrongVersion.length >= 3) {
          // SAFETY CHECK: skip if this wrong version is a substring of any
          // correct ำ word — otherwise it would undo Direction A fixes
          const conflictsWithAmWord = WORDS_WITH_AM.some(amWord => amWord.includes(wrongVersion))
          if (!conflictsWithAmWord) {
            pairs.push([wrongVersion, word])
          }
        }
      }
    }
  }

  pairs.sort((a, b) => b[0].length - a[0].length)
  return pairs
}

// Pre-compute replacement pairs at module load
const DIRECTION_A_PAIRS = buildDirectionA() // า→ำ fixes
const DIRECTION_B_PAIRS = buildDirectionB() // ำ→า fixes

function fixSaraAmByDictionary(text: string): string {
  let result = text

  // Direction A first: fix า that should be ำ (e.g. "สาคัญ" → "สำคัญ")
  for (const [wrong, right] of DIRECTION_A_PAIRS) {
    if (result.includes(wrong)) {
      result = result.split(wrong).join(right)
    }
  }

  // Direction B second: fix ำ that should be า (e.g. "ภำรกิจ" → "ภารกิจ")
  // These pairs are pre-filtered to not conflict with correct ำ words
  for (const [wrong, right] of DIRECTION_B_PAIRS) {
    if (result.includes(wrong)) {
      result = result.split(wrong).join(right)
    }
  }

  return result
}

// ══════════════════════════════════════════════════════════════════════
// Phase 8: Encoding mojibake fix (TIS-620 / Windows-874)
// ══════════════════════════════════════════════════════════════════════

function tis620ToUnicode(garbled: string): string {
  const result: string[] = []
  for (let i = 0; i < garbled.length; i++) {
    const code = garbled.charCodeAt(i)
    if (code >= 0xa1 && code <= 0xfb) {
      result.push(String.fromCharCode(code - 0xa1 + 0x0e01))
    } else {
      result.push(garbled[i])
    }
  }
  return result.join('')
}

function windows874ToUnicode(garbled: string): string {
  const win874Extras: Record<number, number> = {
    0x80: 0x20ac,
    0x85: 0x2026,
    0x91: 0x2018,
    0x92: 0x2019,
    0x93: 0x201c,
    0x94: 0x201d,
    0x95: 0x2022,
    0x96: 0x2013,
    0x97: 0x2014
  }
  const result: string[] = []
  for (let i = 0; i < garbled.length; i++) {
    const code = garbled.charCodeAt(i)
    if (code >= 0xa1 && code <= 0xfb) {
      result.push(String.fromCharCode(code - 0xa1 + 0x0e01))
    } else if (win874Extras[code]) {
      result.push(String.fromCharCode(win874Extras[code]))
    } else {
      result.push(garbled[i])
    }
  }
  return result.join('')
}

function countThaiChars(text: string): number {
  let count = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x0e01 && code <= 0x0e5b) count++
  }
  return count
}

function hasLatinHighBytes(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0xa1 && code <= 0xfb) return true
  }
  return false
}

function fixEncodingMojibake(text: string): string {
  if (!hasLatinHighBytes(text)) return text

  let bestResult = text
  let bestScore = countThaiChars(text)

  for (const fn of [tis620ToUnicode, windows874ToUnicode]) {
    const candidate = fn(text)
    const score = countThaiChars(candidate)
    if (score > bestScore) {
      bestScore = score
      bestResult = candidate
    }
  }

  return bestResult
}

// ══════════════════════════════════════════════════════════════════════
// Utility
// ══════════════════════════════════════════════════════════════════════

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ══════════════════════════════════════════════════════════════════════
// Main pipeline
// ══════════════════════════════════════════════════════════════════════

export function fixGarbledThai(input: string): string {
  if (!input.trim()) return ''

  let result = input

  // Phase 1: Character remapping (pdf2txt_th style)
  result = applyCharacterRemapping(result)

  // Phase 2: Detect & fix severe garbling (Type B)
  const level = detectGarblingLevel(result)
  if (level === 'severe') {
    result = fixDigitSubstitutions(result)
    result = fixSymbolSubstitutions(result)
    result = stripInterCharSpaces(result)
  }

  // Phase 3: Combining character reordering (pdf2txt_th rules)
  result = reorderCombiningChars(result)

  // Phase 4: Remove spaces before/between combining marks
  result = removeSpacesAroundCombining(result)

  // Phase 5: Sara Am reconstruction (ํ + า → ำ)
  result = reconstructSaraAm(result)

  // Phase 6: General spacing cleanup
  result = fixSpacingArtifacts(result)

  // Phase 7: Fix formatting artifacts (stray newlines after list numbers)
  result = fixFormattingArtifacts(result)

  // Phase 8: Dictionary-based Sara Am correction (conservative)
  result = fixSaraAmByDictionary(result)

  // Phase 9: Encoding mojibake fix
  result = fixEncodingMojibake(result)

  return result
}

// ══════════════════════════════════════════════════════════════════════
// Phase 7: Formatting artifact fixes
// ══════════════════════════════════════════════════════════════════════

function fixFormattingArtifacts(text: string): string {
  let result = text

  // Fix isolated list numbers on their own line: "1.\n\nText" → "1. Text"
  result = result.replace(/^(\d+\.)\s*\n+\s*/gm, '$1 ')

  // Fix bullet/dash items on their own line
  result = result.replace(/^([•\-–—])\s*\n+\s*/gm, '$1 ')

  return result
}
