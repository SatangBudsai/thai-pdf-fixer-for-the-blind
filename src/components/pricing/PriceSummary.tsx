import React, { useMemo } from 'react'
import dayjs from 'dayjs'
import { formatDiscountPercentage } from '@/utils/format-number'
import { E36EnumsCourseType, ProductTypeRelation } from '@/api/generated/main-service/apiGenerated'

export interface PriceSummaryProps {
  productData?: ProductTypeRelation
  productPrivateClassId?: string
  align?: 'left' | 'center'
  className?: string
  hiddenLabelStartPrice?: boolean
}

const formatCurrency = (value: number) => `฿${value.toLocaleString()}`

const formatExpireText = (expire?: string) => {
  if (!expire) return null
  const d = dayjs(expire)
  // Fallback: show raw string when invalid
  const text = d.isValid() ? d.format('DD MMM BBBB HH:mm น.') : expire
  return text
}

// Helper functions for package calculations
const calculateTotalCurrentPrice = (productData: ProductTypeRelation) => {
  if (!productData.product_child) return 0
  return productData.product_child.reduce((total, child) => {
    const course = child.child_product
    if (!course || !course.price) return total

    const hasValidCourseDiscount =
      course.discount_price &&
      course.discount_price < course.price &&
      course.ex_date_discount_price &&
      new Date(course.ex_date_discount_price) > new Date()

    const currentCoursePrice = hasValidCourseDiscount ? course.discount_price || 0 : course.price
    return total + currentCoursePrice
  }, 0)
}

const getCurrentPackagePrice = (productData: ProductTypeRelation) => {
  if (productData.discount_price && productData.ex_date_discount_price && new Date(productData.ex_date_discount_price) > new Date()) {
    return productData.discount_price
  }
  return productData.price || 0
}

const PriceSummary: React.FC<PriceSummaryProps> = ({ productData, productPrivateClassId, align = 'center', className, hiddenLabelStartPrice }) => {
  const isPrivateClass = productData?.type === 'PRIVATE'

  const price = useMemo(() => {
    // If productPrivateClassId is provided, find specific private class option
    if (productPrivateClassId && productData?.product_private_class) {
      const selectedOption = productData.product_private_class.find(option => option.id === productPrivateClassId)
      return selectedOption?.price || null
    }

    // Otherwise, find minimum price from all options
    const getMinPrice = (productPrivateClass: ProductTypeRelation['product_private_class']) => {
      if (!productPrivateClass || productPrivateClass.length === 0) return null

      return productPrivateClass.reduce<number | null>((minPrice, currentClass) => {
        if (currentClass.price && (minPrice === null || currentClass.price < minPrice)) {
          return currentClass.price
        }
        return minPrice
      }, null)
    }

    if (productData?.type === 'PRIVATE' && productData?.product_private_class) {
      return getMinPrice(productData.product_private_class)
    }
    return productData?.price
  }, [productData, productPrivateClassId])

  const discountPrice = useMemo(() => {
    // If productPrivateClassId is provided, find specific private class option
    if (productPrivateClassId && productData?.product_private_class) {
      const selectedOption = productData.product_private_class.find(option => option.id === productPrivateClassId)
      return selectedOption?.discount_price || null
    }

    // Otherwise, find minimum discount price from all options
    const getMinDiscountPrice = (productPrivateClass: ProductTypeRelation['product_private_class']) => {
      if (!productPrivateClass || productPrivateClass.length === 0) return null

      return productPrivateClass.reduce<number | null>((minPrice, currentClass) => {
        if (currentClass.discount_price && (minPrice === null || currentClass.discount_price < minPrice)) {
          return currentClass.discount_price
        }

        return minPrice
      }, null)
    }

    if (productData?.type === 'PRIVATE' && productData?.product_private_class) {
      return getMinDiscountPrice(productData.product_private_class)
    }
    return productData?.discount_price
  }, [productData, productPrivateClassId])

  const baseOriginal = useMemo(() => {
    return price || 0
  }, [price])

  const expireDiscountPrice = useMemo(() => {
    return productData?.ex_date_discount_price
  }, [productData])

  const isDiscountValid = expireDiscountPrice ? new Date(expireDiscountPrice) > new Date() : true
  const hasDiscount = typeof discountPrice === 'number' && discountPrice > 0 && discountPrice < baseOriginal && isDiscountValid
  const savings = hasDiscount && discountPrice !== undefined ? baseOriginal - discountPrice : 0
  const percent = hasDiscount && baseOriginal > 0 ? formatDiscountPercentage(baseOriginal, discountPrice || 0) : '0'

  const isPackage = productData?.product_type === 'PACKAGE'
  const totalCurrentPrice = isPackage && productData ? calculateTotalCurrentPrice(productData) : 0
  const currentPackagePrice = isPackage && productData ? getCurrentPackagePrice(productData) : baseOriginal || 0
  const packageSavings = isPackage ? totalCurrentPrice - currentPackagePrice : 0

  return (
    <div className={`${align === 'center' ? 'text-center' : ''} ${className ?? ''}`.trim()}>
      <div>
        {/* Header Section */}
        {/* <div className='mb-4'>
          {isPackage && productData && (
            <div className='mb-2 flex items-center justify-center gap-2'>
              <div className='rounded-full bg-primary/10 p-1.5'>
                <svg className='h-4 w-4 text-primary' fill='currentColor' viewBox='0 0 20 20'>
                  <path d='M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' />
                </svg>
              </div>
              <span className='text-sm font-medium text-primary'>แพ็กเกจพิเศษ</span>
            </div>
          )}

          {subtitle && <p className='text-sm font-medium text-foreground/70'>{subtitle}</p>}
        </div> */}

        {/* Price Display Section */}
        <div className='space-y-4'>
          {/* Package Comparison or Regular Price */}
          {isPackage && productData ? (
            <div className='space-y-3'>
              {/* Package vs Individual Comparison */}
              <div className='rounded-lg bg-foreground/5 p-3 text-center'>
                <div className='mb-1 text-xs font-medium text-foreground/60'>ซื้อแยก</div>
                <div className='text-lg font-bold text-foreground/50 line-through'>{formatCurrency(totalCurrentPrice)}</div>
                <div className='text-xs text-foreground/60'>{productData.product_child?.length || 0} คอร์ส</div>
              </div>

              {/* Main Package Price Display */}
              <div className='text-center'>
                {hasDiscount && typeof discountPrice === 'number' ? (
                  <div className='space-y-1'>
                    <div className='flex items-baseline justify-center gap-3'>
                      <div className='text-4xl font-bold text-primary'>{formatCurrency(discountPrice)}</div>
                      <div className='text-xl text-foreground/50 line-through'>{formatCurrency(currentPackagePrice)}</div>
                    </div>
                    <div className='inline-flex items-center gap-2 rounded-full bg-danger/10 px-3 py-1'>
                      <svg className='h-4 w-4 text-danger' fill='currentColor' viewBox='0 0 20 20'>
                        <path
                          fillRule='evenodd'
                          d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z'
                          clipRule='evenodd'
                        />
                      </svg>
                      <span className='text-sm font-medium text-danger'>ลด {formatDiscountPercentage(currentPackagePrice, discountPrice)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className='text-4xl font-bold text-primary'>{formatCurrency(currentPackagePrice)}</div>
                )}
              </div>
            </div>
          ) : (
            /* Regular Course Price Display */
            <div className='space-y-2 text-center'>
              {hiddenLabelStartPrice && <p className='text-sm font-medium text-primary'>{isPrivateClass ? 'ราคาเริ่มต้น' : 'ราคา'}</p>}
              {hasDiscount && typeof discountPrice === 'number' ? (
                <div className='space-y-1'>
                  <div className='flex flex-col items-center justify-center'>
                    {/* <div className='flex items-end'>
                      <div className='text-4xl font-bold text-primary'>10</div>
                      <div className='text-xl font-bold text-primary'>ครั้ง</div>
                    </div> */}

                    <div className='text-xl italic text-primary line-through'>{formatCurrency(baseOriginal)}</div>
                    <div className='text-4xl font-bold text-primary'>{formatCurrency(discountPrice)}</div>
                  </div>
                  <div className='inline-flex items-center gap-2 rounded-full bg-danger/10 px-3 py-1'>
                    <svg className='h-4 w-4 text-danger' fill='currentColor' viewBox='0 0 20 20'>
                      <path
                        fillRule='evenodd'
                        d='M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z'
                        clipRule='evenodd'
                      />
                    </svg>
                    <span className='text-sm font-medium text-danger'>ลด {percent}%</span>
                  </div>
                </div>
              ) : (
                <div className='text-4xl font-bold text-primary'>{formatCurrency(baseOriginal)}</div>
              )}
            </div>
          )}

          {/* Promotion Expiry */}
          {hasDiscount && expireDiscountPrice && (
            <span className='text-xs font-medium text-danger'>โปรโมชันสิ้นสุด: {formatExpireText(expireDiscountPrice)}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default PriceSummary
