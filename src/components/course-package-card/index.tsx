import React from 'react'
import { useRouter } from 'next/router'
import { Button, Card, CardBody, cn, Image } from '@heroui/react'
import { Icon } from '@iconify/react'
import { useTimer } from 'react-timer-hook'
import dayjs from 'dayjs'
import 'dayjs/locale/th'
import relativeTime from 'dayjs/plugin/relativeTime'
import Tag from '@/components/tag'
import { formatDiscountPercentage } from '@/utils/format-number'
import { E36EnumsPaymentStatus, E36EnumsProductType, ProductTypeRelation } from '@/api/generated/main-service/apiGenerated'

// Configure dayjs
dayjs.extend(relativeTime)
dayjs.locale('th')

// Countdown Timer Component
const CountdownTimer = ({ expiryDate }: { expiryDate: string }) => {
  const expiryTimestamp = new Date(expiryDate)
  const { seconds, minutes, hours, days, isRunning } = useTimer({
    expiryTimestamp,
    onExpire: () => console.warn('Offer expired')
  })

  if (!isRunning) {
    return <div className='text-xs text-danger-600'>หมดอายุแล้ว</div>
  }

  return (
    <div className='text-xs font-medium text-danger-600'>
      {days > 0 && `${days}วัน `}
      {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
    </div>
  )
}

interface CoursePackageCardProps {
  courseData: ProductTypeRelation
  onViewDetails?: (courseId: string) => void
}

const CoursePackageCard: React.FC<CoursePackageCardProps> = ({ courseData: productData, onViewDetails }) => {
  const router = useRouter()
  const isExpired = productData.ex_date_discount_price && new Date(productData.ex_date_discount_price) < new Date()
  const isPurchased =
    productData.product_type === 'PACKAGE'
      ? productData.transaction_user_payment?.every(p => p.paymentStatus === E36EnumsPaymentStatus.SUCCESS)
      : productData.user_product && productData.user_product?.length > 0

  // Price calculation following PriceSummary pattern
  const price = React.useMemo(() => {
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
  }, [productData])

  const discountPrice = React.useMemo(() => {
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
  }, [productData])

  const expireDiscountPrice = React.useMemo(() => {
    return productData?.ex_date_discount_price
  }, [productData])

  const baseOriginal = React.useMemo(() => {
    return price || 0
  }, [price])

  const isDiscountValid = expireDiscountPrice ? new Date(expireDiscountPrice) > new Date() : true
  const hasDiscount = typeof discountPrice === 'number' && discountPrice > 0 && discountPrice < baseOriginal && isDiscountValid

  const handleViewClass = (classId: string) => {
    if (onViewDetails) {
      onViewDetails(classId)
    } else {
      router.push(`/courses/${classId}`)
    }
  }

  const isPrivateCourse = productData.product_type === 'COURSE' && productData.type === 'PRIVATE'

  return (
    <Card
      className={cn(
        productData.product_type === 'PACKAGE' ? 'bg-purple-300/10' : 'bg-white',
        `group flex h-full cursor-pointer flex-col items-stretch overflow-hidden border border-gray-200 shadow-sm transition-all duration-300 hover:shadow-md`
      )}>
      <CardBody className='flex h-full flex-col p-0'>
        {/* Image Section */}
        <div className='relative'>
          <Image
            radius='none'
            src={productData.images || '/images/@mock/300x200.jpg'}
            fallbackSrc='/images/@mock/300x200.jpg'
            alt={productData.name}
            className='h-52 w-full object-cover'
            classNames={{
              wrapper: 'w-full !max-w-none',
              img: 'w-full h-52 object-cover'
            }}
          />

          <div className='absolute left-3 top-3 z-10 flex gap-2'>
            {productData.product_type && <Tag code={productData.product_type} />}
            {isPurchased && <Tag code={isPurchased ? 'PURCHASED' : 'NOT_PURCHASED'} />}
            {/* {!isPurchased &&
              productData.discount_price &&
              productData.price &&
              productData.discount_price < productData.price &&
              productData.ex_date_discount_price &&
              new Date(productData.ex_date_discount_price) > new Date() && (
                <div className='rounded-md bg-danger-500 px-2 py-1 text-xs font-medium text-white'>
                  -{formatDiscountPercentage(productData.price, productData.discount_price)}%
                </div>
              )} */}
          </div>
        </div>

        <div className='flex flex-grow flex-col p-4'>
          {/* Course Type, Level & Tags */}
          <div className='mb-3 flex flex-wrap gap-1'>
            {productData.product_type === 'PACKAGE' ? (
              <div className='flex flex-wrap items-center gap-2'>
                <Tag code={E36EnumsProductType.PACKAGE} />
              </div>
            ) : (
              <div className='flex flex-wrap items-center gap-2'>{productData.type && <Tag code={productData.type} />}</div>
            )}

            <div className='flex flex-wrap items-center gap-2'>{productData.level && <Tag code={productData.level} />}</div>
            {productData.product_tag?.map(item => (
              <div key={item.id} className='flex flex-wrap items-center gap-2'>
                {item.tag && (
                  <Tag
                    label={item.tag.name}
                    variant={item.tag.variant || 'flat'}
                    color={item.tag.color || 'default'}
                    icon={item.tag.icon || 'mdi:tag'}
                    className={item.tag.custom_class || ''}
                  />
                )}
              </div>
            ))}
            {/* {courseData.price === 0 && <Tag code='free' />} */}
          </div>

          {/* Title */}
          <h3 className='mb-2 line-clamp-2 text-base font-semibold text-gray-900'>{productData.name}</h3>
          <p className='mb-4 line-clamp-3 text-sm text-gray-600'>{productData.description || 'เรียนรู้และพัฒนาทักษะภาษาอังกฤษ'}</p>

          {productData.product_type === 'PACKAGE' && productData.product_child && (
            <div className='mb-3 rounded-lg bg-purple-100/80 p-2'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Icon icon='mdi:package-variant' className='text-purple-600' width={18} height={18} />
                  <span className='text-sm font-medium text-purple-700'>รวม {productData.product_child.length} คอร์ส</span>
                </div>
              </div>
            </div>
          )}

          {/* Package Course List (สำหรับแพ็กเกจ) */}
          {productData.product_type === 'PACKAGE' && productData.product_child && productData.product_child.length > 0 && (
            <div className='mb-4 rounded-lg bg-white/60 p-3'>
              <h4 className='mb-2 flex items-center gap-2 text-sm font-medium text-gray-800'>
                <Icon icon='mdi:format-list-bulleted' width={16} height={16} />
                คอร์สที่รวมอยู่ในแพ็กเกจ:
              </h4>
              <div className='space-y-1'>
                {productData.product_child.slice(0, 3).map((child, index) => (
                  <div key={`${productData.id}-feature-${index}`} className='flex items-center text-sm text-gray-600'>
                    <Icon icon='mdi:check-circle' className='mr-2 text-green-500' width={12} height={12} />
                    <span className='line-clamp-1'>{child.child_product?.name || 'คอร์ส'}</span>
                  </div>
                ))}
                {productData.product_child.length > 3 && (
                  <div className='text-xs text-gray-500'>+ อีก {productData.product_child.length - 3} คอร์ส</div>
                )}
              </div>
            </div>
          )}

          {/* Status Information - Simplified */}
          {isPurchased && (
            <div className='mb-3'>
              {isExpired && (
                <div className='rounded-lg border border-red-200 bg-red-50 p-3 text-sm'>
                  <div className='flex items-start'>
                    <Icon icon='mdi:clock' className='mr-2 mt-0.5 text-red-600' />
                    <div className='flex-1'>
                      <div className='font-medium text-red-800'>
                        {productData.product_type === 'PACKAGE' ? 'แพ็กเกจหมดอายุแล้ว' : 'คอร์สหมดอายุแล้ว'}
                      </div>
                      <div className='text-red-600'>
                        หมดอายุ: {productData.ex_date_discount_price ? new Date(productData.ex_date_discount_price).toLocaleDateString('th-TH') : '-'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className='mt-auto' />

          {/* Price (show fallback price when discount expired) */}
          {!isPurchased && !hasDiscount && baseOriginal > 0 && (
            <div className='mb-4'>
              <div className='flex justify-end'>
                <div className='text-right'>
                  <div className='flex flex-col items-end'>
                    {isPrivateCourse && <div className='text-xs text-primary'>ราคาเริ่มต้น</div>}
                    <div className='text-lg font-bold text-primary'>{baseOriginal === 0 ? 'ฟรี' : `฿${baseOriginal.toLocaleString()}`}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Limited Time Offer Banner */}
          {!isPurchased &&
            (() => {
              if (isPrivateCourse && hasDiscount) {
                // For Private Course: use unified price and discount logic
                return (
                  <div className='mb-3 rounded-lg bg-danger-50 px-3 py-2'>
                    <div className='space-y-1'>
                      <div className='flex justify-between gap-2'>
                        <div className='flex items-center gap-1'>
                          <Icon icon='streamline-ultimate:tag-dollar-bold' className=' text-danger' width={25} height={25} />
                          <span className='mt-0.5 text-xl font-semibold text-danger'>SALE</span>
                          <span className='-mb-1 ml-1 italic text-primary line-through'>฿{baseOriginal.toLocaleString()}</span>
                        </div>
                        <div className='flex flex-col items-end'>
                          <div className='text-xs text-primary'>ราคาเริ่มต้น</div>
                          <div className='text-xl font-bold text-danger'>{discountPrice === 0 ? 'ฟรี' : `฿${discountPrice?.toLocaleString()}`}</div>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='text-xs font-medium text-danger-600'>ถึงวันที่ {dayjs(expireDiscountPrice).format('DD/MM/YYYY')}</div>
                        {expireDiscountPrice && <CountdownTimer expiryDate={expireDiscountPrice} />}
                      </div>
                    </div>
                  </div>
                )
              }

              // For non-Private courses
              return (
                !isPrivateCourse &&
                hasDiscount && (
                  <div className='mb-3 rounded-lg bg-danger-50 px-3 py-2'>
                    <div className='space-y-1'>
                      <div className='flex justify-between gap-2'>
                        <div className='flex items-center gap-1'>
                          <Icon icon='streamline-ultimate:tag-dollar-bold' className=' text-danger' width={25} height={25} />
                          <span className='mt-0.5 text-xl font-semibold text-danger'>SALE</span>
                          <span className='-mb-1 ml-1 italic text-primary line-through'>฿{baseOriginal.toLocaleString()}</span>
                        </div>
                        <div className='flex flex-col items-end'>
                          <div className='text-xl font-bold text-danger'>{discountPrice === 0 ? 'ฟรี' : `฿${discountPrice?.toLocaleString()}`}</div>
                        </div>
                      </div>
                      <div className='flex items-center justify-between'>
                        <div className='text-xs font-medium text-danger-600'>ถึงวันที่ {dayjs(expireDiscountPrice).format('DD/MM/YYYY')}</div>
                        {expireDiscountPrice && <CountdownTimer expiryDate={expireDiscountPrice} />}
                      </div>
                    </div>
                  </div>
                )
              )
            })()}

          {/* Action Buttons */}
          <div className='flex flex-col gap-2'>
            {isPurchased ? (
              <>
                {isExpired ? (
                  <>
                    <Button color='danger' variant='solid' className='w-full font-medium' onPress={() => handleViewClass(productData.id || '')}>
                      <Icon icon='mdi:shopping' className='mr-1' />
                      ซื้อคอร์สเพิ่ม
                    </Button>
                    <Button color='primary' variant='bordered' className='w-full font-medium' onPress={() => handleViewClass(productData.id || '')}>
                      <Icon icon='mdi:eye' className='mr-1' />
                      ดูรายละเอียด
                    </Button>
                  </>
                ) : (
                  <Button color='success' variant='solid' className='w-full font-medium' onPress={() => handleViewClass(productData.id || '')}>
                    <Icon icon='mdi:check-circle' className='mr-1' width={18} height={18} />
                    {`${productData.product_type === 'PACKAGE' ? 'ซื้อแพ็กเกจแล้ว' : 'ซื้อคอร์สแล้ว'}`}
                  </Button>
                )}
              </>
            ) : (
              <Button color='primary' variant='solid' className='w-full font-medium' onPress={() => handleViewClass(productData.id || '')}>
                <Icon icon='mdi:eye' className='mr-1' />
                ดูรายละเอียด{productData.product_type === 'PACKAGE' ? 'แพ็กเกจ' : ''}
              </Button>
            )}
          </div>

          {!isPurchased && isPrivateCourse && (
            <div className='mt-2 flex items-center gap-2'>
              <span className='text-xs text-foreground/70'>จำนวนครั้ง</span>
              <Tag
                variant='flat'
                label={productData.product_private_class
                  ?.filter(item => item && item.limit_ticket != null)
                  ?.sort((a, b) => (a.limit_ticket ?? 0) - (b.limit_ticket ?? 0))
                  ?.map(item => String(item.limit_ticket))
                  .join(', ')}
                size='sm'
                hiddenIcon
              />
            </div>
          )}

          {isPurchased && isPrivateCourse && productData?.user_product && productData?.user_product[0] && (
            <div className='mt-2 flex items-center gap-2'>
              <span className='text-xs text-foreground/70'>จำนวนครั้งที่เหลือ</span>
              <Tag
                variant='flat'
                label={`${productData?.user_product[0]?.enrolled_count}/${productData?.user_product[0]?.enrolled_limit}`}
                size='sm'
                hiddenIcon
              />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

export default CoursePackageCard
