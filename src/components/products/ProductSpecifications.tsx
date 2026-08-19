'use client'

import { ProductAttributeValue } from '@/types'

interface ProductSpecificationsProps {
  description?: string
  attributeValues?: ProductAttributeValue[]
}

export function ProductSpecifications({
  description,
  attributeValues,
}: ProductSpecificationsProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      {description && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Description
          </h3>
          <p className="text-gray-600 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {/* Specifications */}
      {attributeValues && attributeValues.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Specifications
          </h3>
          <div className="space-y-3">
            {attributeValues.map((attr) => (
              <div key={attr.id} className="flex gap-4 py-2 border-b border-gray-200 last:border-0">
                <dt className="font-medium text-gray-700 min-w-fit">
                  {attr.attribute?.name || 'Specification'}:
                </dt>
                <dd className="text-gray-600">{attr.value}</dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
