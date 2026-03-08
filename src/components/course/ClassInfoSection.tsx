import React from 'react'
import { Chip, Image } from '@heroui/react'
import { Icon } from '@iconify/react'
import Tag from '@/components/tag'
import { E36EnumsPaymentStatus, type ProductTypeRelation } from '@/api/generated/main-service/apiGenerated'

interface ClassInfoSectionProps {
  productData: ProductTypeRelation
}

const ClassInfoSection: React.FC<ClassInfoSectionProps> = ({ productData }) => {
  const isPurchased =
    productData.product_type === 'PACKAGE'
      ? productData.transaction_user_payment?.every(p => p.paymentStatus === E36EnumsPaymentStatus.SUCCESS)
      : productData.user_product && productData.user_product?.length > 0

  const availableTickets =
    isPurchased && productData.user_product?.[0]
      ? productData.user_product[0].enrolled_limit - (productData.user_product[0].enrolled_count || 0)
      : undefined

  const renderStatusAndType = (isMobile: boolean = false) => (
    <div className={`flex flex-wrap gap-2 ${isMobile ? 'mt-3 md:hidden' : 'mt-3 hidden md:flex'}`}>
      {productData.type && <Tag code={productData.type} size='sm' />}
      {productData.level && <Tag code={productData.level} size='sm' />}

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
    </div>
  )

  return (
    <div className='flex flex-col gap-4 md:flex-row'>
      <div className='w-full md:w-auto'>
        <Image
          src={productData.images || '/images/@mock/400x300.jpg'}
          alt={productData.name}
          className='aspect-video h-auto w-full rounded-lg object-cover md:h-52'
        />

        {/* Status and Type - Mobile Version (below image) */}
        {renderStatusAndType(true)}
      </div>

      <div className='flex-1'>
        {/* Title */}
        <h1 className='text-xl font-bold text-primary lg:text-2xl'>{productData.name}</h1>

        {/* Class Details Section */}
        <div className='mt-4 flex items-center gap-2'>
          <div>
            <h3 className='text-base font-semibold text-foreground'>รายละเอียดคอร์ส</h3>
            <p className='line-clamp-3 text-sm leading-relaxed text-foreground/80'>{productData.description}</p>
          </div>
        </div>

        {/* Status and Type - Desktop Version */}
        {renderStatusAndType(false)}

        {/* Tickets Info for Private Classes */}
        {productData.type === 'PRIVATE' && availableTickets !== undefined && (
          <div className='my-3 flex items-center justify-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2'>
            <div className='flex items-center gap-2'>
              <Icon icon='mdi:ticket' className='text-primary' />
              <span className='text-sm font-medium text-primary'>
                {isPurchased ? `เหลือ ${availableTickets} ตั๋ว` : `รวม ${productData.user_product?.[0]?.enrolled_limit || 0} ตั๋ว`}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassInfoSection
