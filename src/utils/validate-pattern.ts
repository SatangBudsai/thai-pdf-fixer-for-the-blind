/**
 * ตรวจสอบว่าเป็นภาษาอังกฤษล้วน (a-z, A-Z เท่านั้น)
 */
export function isEnglishOnly(text: string): boolean {
  return /^[A-Za-z]+$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นภาษาไทยล้วน (ก-ฮ, ฯ, ๆ, ฯลฯ, สระ, วรรณยุกต์)
 */
export function isThaiOnly(text: string): boolean {
  return /^[\u0E00-\u0E7F]+$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นตัวเลขล้วน (0-9 เท่านั้น)
 */
export function isNumberOnly(text: string): boolean {
  return /^[0-9]+$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นภาษาอังกฤษหรือตัวเลขเท่านั้น (a-z, A-Z, 0-9)
 */
export function isEnglishOrNumber(text: string): boolean {
  return /^[A-Za-z0-9]+$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นภาษาไทยหรือตัวเลขเท่านั้น
 */
export function isThaiOrNumber(text: string): boolean {
  return /^[\u0E00-\u0E7F0-9]+$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นภาษาอังกฤษ ตัวเลข และอักขระพิเศษ (a-z, A-Z, 0-9, special chars)
 */
export function isEnglishNumberSpecial(text: string): boolean {
  return /^[A-Za-z0-9\s!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นอีเมลที่ถูกต้อง
 */
export function isEmail(text: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นเว็บไซต์ที่ถูกต้อง (http, https, www, domain)
 */
export function isWebsite(text: string): boolean {
  return /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z]{2,})+([\/?#].*)?$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นเบอร์โทรศัพท์แบบมาตรฐานสากล (E.164) รองรับทุกประเทศ
 * ตัวอย่าง: +66812345678, +12025550123, +441632960961
 */
export function isInternationalPhoneNumber(text: string): boolean {
  return /^\+[1-9]\d{1,14}$/.test(text)
}

/**
 * ตรวจสอบว่าเป็นเบอร์โทรศัพท์ในประเทศไทย
 * รองรับรูปแบบ 02-XXX-XXXX (กรุงเทพฯ) หรือ 0X-XXX-XXX(X) (ต่างจังหวัด โดย X = 3-7)
 */
export function isThaiPhoneNumber(text: string): boolean {
  return /^(?:02-\d{3}-\d{4}|0[3-7]\d{2}-\d{3}-\d{3,4})$/.test(text)
}
