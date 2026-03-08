import React, { useState, useMemo } from 'react'
import { Button, Image, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Select, SelectItem } from '@heroui/react'
import { Icon } from '@iconify/react'
import PriceSummary from '@/components/pricing/PriceSummary'
import Tag from '@/components/tag'
import type { ProductPrivateClassTypeRelation, ProductTypeRelation } from '@/api/generated/main-service/apiGenerated'
import { useRouter } from 'next/router'

interface PurchaseConfirmationModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  productData: ProductTypeRelation
  modalTitle?: string
  modalSubtitle?: string
  includedItems?: string[]
}

const PurchaseConfirmationModal: React.FC<PurchaseConfirmationModalProps> = ({
  isOpen,
  onOpenChange,
  productData,
  modalTitle = 'ยืนยันการซื้อคลาส',
  modalSubtitle
}) => {
  const router = useRouter()
  const sortedPrivateClassOptions = useMemo(() => {
    if (!productData.product_private_class) return []

    return [...productData.product_private_class]
      .filter(option => option !== null && option !== undefined)
      .sort((a, b) => (a.limit_ticket || 0) - (b.limit_ticket || 0))
  }, [productData.product_private_class])

  // Find default option (cheapest price)
  const defaultPrivateClassOption = useMemo(() => {
    if (!sortedPrivateClassOptions.length) return null

    return sortedPrivateClassOptions.reduce((cheapest, current) => {
      if (!cheapest) return current

      const currentPrice = current.price || 0
      const cheapestPrice = cheapest.price || 0

      return currentPrice < cheapestPrice ? current : cheapest
    })
  }, [sortedPrivateClassOptions])

  const [selectedPrivateClassId, setSelectedPrivateClassId] = useState<string>(defaultPrivateClassOption?.id?.toString() || '')

  const formatPrice = (price?: number | null) => {
    if (!price || price === 0) return 'ฟรี'
    return `฿${price.toLocaleString()}`
  }

  const hasValidDiscount = (option: ProductPrivateClassTypeRelation) => {
    return (
      option?.discount_price &&
      option?.price &&
      option.discount_price < option.price &&
      productData?.ex_date_discount_price &&
      new Date(productData.ex_date_discount_price) > new Date()
    )
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case 'PRIVATE':
      case 'Private Class':
        return 'ติวเตอร์ส่วนตัว'
      case 'GROUP':
      case 'Group Discussion':
        return 'เรียนกลุ่ม'
      case 'NEWS':
      case 'Video Course':
      case 'Learn from News':
        return 'วิดีโอคอร์ส'
      case 'VIDEO':
      case 'Video Online':
        return 'วีดีโอออนไลน์'
      case 'PACKAGE':
      case 'Package':
        return 'แพ็กเกจ'
      default:
        return type
    }
  }

  const isPrivateClass = productData.type === 'PRIVATE' && productData.product_type === 'COURSE'
  console.log('🚀 ~ a.typ:', productData.type)
  console.log('🚀 ~ PurchaseConfirmationModal ~ isPrivateClass:', isPrivateClass)

  const handleProceedToPurchase = () => {
    router.push(`/purchase/${productData.id}?privateClassId=${isPrivateClass ? selectedPrivateClassId : ''}`)
  }

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='lg' placement='center' backdrop='blur'>
      <ModalContent>
        {onClose => (
          <>
            <ModalHeader className='pb-2'>
              <div className='flex items-center gap-3'>
                <div className='rounded-full bg-primary/10 p-2'>
                  <Icon icon='mdi:cart-plus' className='text-lg text-primary' />
                </div>
                <div>
                  <h3 className='text-base font-semibold text-foreground'>{modalTitle}</h3>
                  <p className='text-sm text-foreground/60'>{modalSubtitle || `${getTypeText(productData.type)}`}</p>
                </div>
              </div>
            </ModalHeader>

            <ModalBody className='py-3'>
              <div className='space-y-4'>
                {/* Course Summary */}
                <div className='flex items-start gap-3'>
                  <Image
                    src={productData.images || '/images/@mock/300x200.jpg'}
                    alt={productData.name}
                    className='h-14 w-20 rounded-md object-cover'
                    radius='sm'
                  />
                  <div className='flex-1'>
                    <h4 className='mb-1 text-base font-semibold text-foreground'>{productData.name}</h4>
                    <div className='mb-2 flex items-center gap-2'>
                      {productData.type && <Tag code={productData.type} size='sm' />}
                      {productData.level && <Tag code={productData.level} size='sm' />}
                    </div>
                  </div>
                </div>

                {/* Private Class Selection */}
                {isPrivateClass && (
                  <>
                    {isPrivateClass && sortedPrivateClassOptions.length > 0 ? (
                      <div className='space-y-2'>
                        <p className='text-sm font-medium text-foreground'>เลือกจำนวนครั้งการเรียน</p>
                        <Select
                          placeholder='เลือกจำนวนครั้งเข้าเรียน'
                          selectedKeys={selectedPrivateClassId ? [selectedPrivateClassId] : []}
                          onSelectionChange={keys => {
                            const selected = Array.from(keys)[0] as string
                            setSelectedPrivateClassId(selected)
                          }}
                          classNames={{
                            base: 'w-full',
                            trigger: 'bg-primary-100/20 border-primary/20'
                          }}>
                          {sortedPrivateClassOptions.map(option => (
                            <SelectItem key={option.id?.toString() || ''} textValue={`${option.limit_ticket || 0} ครั้ง`}>
                              <div className='flex w-full items-center justify-between'>
                                <span>{option.limit_ticket || 0} ครั้ง</span>
                                <div className='flex flex-col items-end text-sm'>
                                  <div className='flex items-center gap-2'>
                                    {/* แสดงราคาปกติเสมอ */}
                                    <span
                                      className={`${hasValidDiscount(option) ? 'italic text-foreground/60 text-primary line-through' : 'font-semibold text-foreground'}`}>
                                      {formatPrice(option.price)}
                                    </span>

                                    {hasValidDiscount(option) && (
                                      <span className='font-semibold text-danger'>{formatPrice(option.discount_price)}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </Select>
                      </div>
                    ) : (
                      <div className='rounded-lg bg-primary-100/20 p-2 px-4 text-base font-semibold text-primary'>
                        จำนวนครั้งเข้าเรียน {productData.product_private_class?.[0]?.limit_ticket || 10} ครั้ง
                      </div>
                    )}
                  </>
                )}

                {/* Price Summary */}
                <div className='border-b border-t border-foreground/10 py-3'>
                  <PriceSummary productData={productData} productPrivateClassId={isPrivateClass ? selectedPrivateClassId : undefined} />
                </div>
              </div>
            </ModalBody>

            <ModalFooter className='gap-3 pt-3'>
              <Button variant='flat' onPress={onClose} size='sm' className='px-4 font-medium'>
                ยกเลิก
              </Button>
              <Button
                color='primary'
                className='px-6 font-medium'
                size='sm'
                startContent={<Icon icon='mdi:arrow-right' width={14} />}
                onPress={() => {
                  handleProceedToPurchase()
                }}>
                ดำเนินการต่อ
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  )
}

export default PurchaseConfirmationModal
