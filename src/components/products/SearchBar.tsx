'use client'

import { useEffect, useState } from 'react'
import { Search, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  /** Accessible name for the search input (not shown visually). */
  label?: string
  /** Active query from the parent — keeps the input in sync when a filter chip is cleared. */
  value?: string
}

export function SearchBar({
  onSearch,
  isLoading,
  label = 'Search products',
  value,
}: SearchBarProps) {
  const [query, setQuery] = useState(value ?? '')

  useEffect(() => {
    if (value !== undefined) setQuery(value)
  }, [value])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(query.trim())
  }

  const handleClear = () => {
    setQuery('')
    onSearch('')
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative w-full">
      <Search
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 dark:text-slate-500"
        aria-hidden="true"
      />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label={label}
        className={cn(
          'h-12 w-full rounded-full border pl-12 pr-32 text-sm shadow-sm outline-none transition',
          'border-gray-200 bg-white text-gray-900 placeholder:text-gray-400',
          'focus:border-primary-300 focus:ring-4 focus:ring-primary-100',
          'dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:placeholder:text-slate-500',
          'dark:focus:border-primary-500/60 dark:focus:ring-primary-500/15',
          '[&::-webkit-search-cancel-button]:hidden'
        )}
      />
      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex h-9 items-center gap-2 rounded-full bg-gradient-to-r from-primary-600 to-accent-500 px-5 text-sm font-semibold text-white shadow-md shadow-primary-500/25 hover:brightness-105 disabled:opacity-70"
        >
          {isLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          ) : (
            'Search'
          )}
        </button>
      </div>
    </form>
  )
}
