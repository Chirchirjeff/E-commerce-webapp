'use client'

import { useState } from 'react'
import { Share2, Copy, Check, AlertCircle } from 'lucide-react'
import { productLinksAPI } from '@/lib/api'

interface ProductShareButtonProps {
  productId: string
  productName: string
  compact?: boolean // Show as icon button instead of full button
}

/**
 * Product Share Button Component
 * 
 * Allows sellers to generate and share product links.
 * Features:
 * - Generate shareable link token
 * - Copy link to clipboard
 * - Show link status
 */
export function ProductShareButton({
  productId,
  productName,
  compact = false,
}: ProductShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isCopied, setIsCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [shareLink, setShareLink] = useState<string | null>(null)

  const baseUrl =
    typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : ''

  const handleGenerateLink = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Create a new product link
      const response = await productLinksAPI.create(productId, {
        title: `Shared: ${productName}`,
        source: 'direct_share',
      })

      if (response.data && response.data.token) {
        const fullLink = `${baseUrl}/link/${response.data.token}`
        setShareLink(fullLink)
      } else {
        throw new Error('Failed to generate link')
      }
    } catch (err) {
      console.error('Error generating product link:', err)
      setError(
        err instanceof Error ? err.message : 'Failed to generate share link'
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareLink) return

    try {
      await navigator.clipboard.writeText(shareLink)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error('Error copying to clipboard:', err)
      setError('Failed to copy link')
    }
  }

  if (compact) {
    return (
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        title="Share product"
      >
        <Share2 className="w-5 h-5" />
      </button>
    )
  }

  return (
    <div>
      {/* Share Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen)
          if (!shareLink && !isOpen) {
            handleGenerateLink()
          }
        }}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        <Share2 className="w-4 h-4" />
        {isLoading ? 'Generating...' : 'Share Product'}
      </button>

      {/* Share Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Share {productName}
            </h3>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {shareLink ? (
              <div className="space-y-3">
                {/* Link Display */}
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <p className="text-xs text-gray-600 mb-2">Shareable Link:</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs text-gray-700 break-all flex-1">
                      {shareLink}
                    </code>
                    <button
                      onClick={handleCopyLink}
                      className="p-2 hover:bg-gray-200 rounded transition-colors flex-shrink-0"
                      title="Copy link"
                    >
                      {isCopied ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Share Options */}
                <div className="space-y-2">
                  <p className="text-xs text-gray-600 font-medium">Share on:</p>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      {
                        name: 'WhatsApp',
                        icon: '💬',
                        url: `https://wa.me/?text=${encodeURIComponent(shareLink)}`,
                      },
                      {
                        name: 'Facebook',
                        icon: '👍',
                        url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareLink)}`,
                      },
                      {
                        name: 'Twitter',
                        icon: '𝕏',
                        url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareLink)}`,
                      },
                      {
                        name: 'Email',
                        icon: '📧',
                        url: `mailto:?subject=Check out: ${productName}&body=${encodeURIComponent(shareLink)}`,
                      },
                    ].map((platform) => (
                      <a
                        key={platform.name}
                        href={platform.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded text-xs font-medium text-gray-700 transition-colors"
                        title={`Share on ${platform.name}`}
                      >
                        <span>{platform.icon}</span>
                        {platform.name}
                      </a>
                    ))}
                  </div>
                </div>

                {/* Copy Success Message */}
                {isCopied && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-xs text-green-800 text-center">
                    ✓ Link copied to clipboard!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-600">
                  Click below to generate a shareable link for this product.
                </p>
              </div>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                setIsOpen(false)
                setIsCopied(false)
              }}
              className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
