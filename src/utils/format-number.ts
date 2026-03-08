/**
 * Number formatting utility functions
 */

export interface FormatNumberOptions {
  /** Minimum number of decimal places (default: 0) */
  minimumFractionDigits?: number
  /** Maximum number of decimal places (default: 2) */
  maximumFractionDigits?: number
  /** Rounding mode: 'up', 'down', 'nearest' (default: 'nearest') */
  roundingMode?: 'up' | 'down' | 'nearest'
  /** Locale for formatting (default: 'th-TH') */
  locale?: string
}

/**
 * Format number with customizable decimal places and rounding
 * @param number - The number to format
 * @param options - Formatting options
 * @returns Formatted number string
 */
export function formatNumber(number: number, options: FormatNumberOptions = {}): string {
  const { minimumFractionDigits = 0, maximumFractionDigits = 2, roundingMode = 'nearest', locale = 'th-TH' } = options

  let roundedNumber = number

  // Apply rounding based on mode
  if (roundingMode === 'up') {
    const multiplier = Math.pow(10, maximumFractionDigits)
    roundedNumber = Math.ceil(number * multiplier) / multiplier
  } else if (roundingMode === 'down') {
    const multiplier = Math.pow(10, maximumFractionDigits)
    roundedNumber = Math.floor(number * multiplier) / multiplier
  } else {
    // Default rounding (nearest)
    const multiplier = Math.pow(10, maximumFractionDigits)
    roundedNumber = Math.round(number * multiplier) / multiplier
  }

  return roundedNumber.toLocaleString(locale, {
    minimumFractionDigits,
    maximumFractionDigits
  })
}

/**
 * Calculate and format percentage with rounding down and no decimals
 * @param numerator - The numerator value
 * @param denominator - The denominator value
 * @param options - Additional formatting options
 * @returns Formatted percentage string without % symbol
 */
export function formatPercentage(
  numerator: number,
  denominator: number,
  options: Omit<FormatNumberOptions, 'minimumFractionDigits' | 'maximumFractionDigits'> = {}
): string {
  if (denominator === 0) return '0'

  const percentage = (numerator / denominator) * 100

  return formatNumber(percentage, {
    ...options,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    roundingMode: 'down'
  })
}

/**
 * Calculate discount percentage and format with rounding down
 * @param originalPrice - Original price
 * @param discountPrice - Discounted price
 * @param options - Additional formatting options
 * @returns Formatted discount percentage string without % symbol
 */
export function formatDiscountPercentage(
  originalPrice: number,
  discountPrice: number,
  options: Omit<FormatNumberOptions, 'minimumFractionDigits' | 'maximumFractionDigits'> = {}
): string {
  if (originalPrice <= 0) return '0'

  const discount = originalPrice - discountPrice
  return formatPercentage(discount, originalPrice, options)
}

/**
 * Format currency with Thai Baht symbol
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted currency string with ฿ symbol
 */
export function formatCurrency(amount: number, options: FormatNumberOptions = {}): string {
  const formatted = formatNumber(amount, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...options
  })

  return `฿${formatted}`
}

/**
 * Format savings amount
 * @param originalPrice - Original price
 * @param finalPrice - Final price after discount
 * @param options - Formatting options
 * @returns Formatted savings string with ฿ symbol
 */
export function formatSavings(originalPrice: number, finalPrice: number, options: FormatNumberOptions = {}): string {
  const savings = Math.max(0, originalPrice - finalPrice)
  return formatCurrency(savings, options)
}
