'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  placeholder?: string
}

export function SearchBar({
  onSearch,
  isLoading,
  placeholder = 'Search products...',
}: SearchBarProps) {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query)
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400"
      />
      <Button type="submit" isLoading={isLoading}>
        Search
      </Button>
    </form>
  )
}
