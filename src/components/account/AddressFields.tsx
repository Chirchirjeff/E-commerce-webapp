'use client'

import { BuyerAddress } from '@/stores/authStore'

/** Maximum saved delivery addresses per buyer (enforced by the backend too). */
export const MAX_SAVED_ADDRESSES = 5

export type AddressDraft = Omit<BuyerAddress, 'id' | 'isDefault'>

export const EMPTY_ADDRESS: AddressDraft = {
  label: 'Home', recipientName: '', phone: '', addressLine: '', city: '', state: '', postalCode: '',
}

export function validateAddress(draft: AddressDraft, withRecipient: boolean): Record<string, string> {
  const errors: Record<string, string> = {}
  if (withRecipient && !draft.recipientName.trim()) errors.recipientName = 'Recipient name is required'
  if (withRecipient && !draft.phone.trim())         errors.phone = 'Phone number is required'
  if (!draft.addressLine.trim()) errors.addressLine = 'Street address is required'
  if (!draft.city.trim())        errors.city = 'City is required'
  if (!draft.state.trim())       errors.state = 'County / state is required'
  if (!draft.postalCode.trim())  errors.postalCode = 'Postal code is required'
  return errors
}

const LABEL_SUGGESTIONS = ['Home', 'Work', 'Other']

interface AddressFieldsProps {
  value: AddressDraft
  onChange: (next: AddressDraft) => void
  errors?: Record<string, string>
  /** Show recipient name + phone (the checkout collects these separately). */
  withRecipient?: boolean
  idPrefix?: string
}

export function AddressFields({ value, onChange, errors = {}, withRecipient = true, idPrefix = 'address' }: AddressFieldsProps) {
  const set = (field: keyof AddressDraft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [field]: e.target.value })

  const inputClass = (field: string) =>
    `w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent ${
      errors[field] ? 'border-red-500' : 'border-gray-300'
    }`
  const id = (field: string) => `${idPrefix}-${field}`
  const error = (field: string) => errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={id('label')} className="block text-sm font-medium text-gray-700 mb-1">Address name</label>
        <input id={id('label')} value={value.label} onChange={set('label')} className={inputClass('label')} placeholder="Home, Work, Mum's place…" list={id('label-options')} />
        <datalist id={id('label-options')}>{LABEL_SUGGESTIONS.map((label) => <option key={label} value={label} />)}</datalist>
      </div>
      {withRecipient && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={id('recipientName')} className="block text-sm font-medium text-gray-700 mb-1">Recipient name *</label>
            <input id={id('recipientName')} value={value.recipientName} onChange={set('recipientName')} className={inputClass('recipientName')} placeholder="Jane Doe" />
            {error('recipientName')}
          </div>
          <div>
            <label htmlFor={id('phone')} className="block text-sm font-medium text-gray-700 mb-1">Phone number *</label>
            <input id={id('phone')} type="tel" value={value.phone} onChange={set('phone')} className={inputClass('phone')} placeholder="0712 345 678" />
            {error('phone')}
          </div>
        </div>
      )}
      <div>
        <label htmlFor={id('addressLine')} className="block text-sm font-medium text-gray-700 mb-1">Street address *</label>
        <textarea id={id('addressLine')} value={value.addressLine} onChange={set('addressLine')} rows={2} className={inputClass('addressLine')} placeholder="123 Moi Avenue, Apt 4B" />
        {error('addressLine')}
      </div>
      <div>
        <label htmlFor={id('city')} className="block text-sm font-medium text-gray-700 mb-1">City *</label>
        <input id={id('city')} value={value.city} onChange={set('city')} className={inputClass('city')} placeholder="Nairobi" />
        {error('city')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor={id('state')} className="block text-sm font-medium text-gray-700 mb-1">County / State *</label>
          <input id={id('state')} value={value.state} onChange={set('state')} className={inputClass('state')} placeholder="Nairobi County" />
          {error('state')}
        </div>
        <div>
          <label htmlFor={id('postalCode')} className="block text-sm font-medium text-gray-700 mb-1">Postal code *</label>
          <input id={id('postalCode')} value={value.postalCode} onChange={set('postalCode')} className={inputClass('postalCode')} placeholder="00100" />
          {error('postalCode')}
        </div>
      </div>
    </div>
  )
}

export function formatAddress(address: Pick<BuyerAddress, 'addressLine' | 'city' | 'state' | 'postalCode'>) {
  return [address.addressLine, address.city, address.state, address.postalCode].filter(Boolean).join(', ')
}
