'use client'

import { ChangeEvent, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'
import Button from '@/components/ui/Button'
import { authAPI, getApiErrorMessage } from '@/lib/api'
import { BuyerProfile } from '@/stores/authStore'
import { AccountDialog } from './AccountDialog'

export const MAX_AVATAR_BYTES = 5 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif'

/**
 * Checks a chosen photo before upload. Some browsers report HEIC files with an
 * empty type, so the extension is used to give them the right one — the
 * server checks the type it is sent.
 */
function preparePhoto(file: File): { file: File } | { error: string } {
  let prepared = file
  if (!file.type || file.type === 'application/octet-stream') {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'heic' || ext === 'heif') prepared = new File([file], file.name, { type: `image/${ext}` })
  }
  if (!ALLOWED_TYPES.includes(prepared.type)) {
    return { error: 'That file type isn’t supported. Choose a JPG, PNG, WebP or HEIC photo.' }
  }
  if (prepared.size > MAX_AVATAR_BYTES) {
    const mb = (prepared.size / (1024 * 1024)).toFixed(1)
    return { error: `That photo is ${mb} MB. Choose one that's 5 MB or smaller.` }
  }
  return { file: prepared }
}

interface Options {
  onUpdated: (user: BuyerProfile) => void
  onNotice: (message: string) => void
}

/**
 * Profile photo picker: file input → preview dialog → upload. Returns
 * `pick` / `remove` actions and the `element` (hidden input + dialog) to render once.
 */
export function useProfilePhoto({ onUpdated, onNotice }: Options) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [previewFailed, setPreviewFailed] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [removing, setRemoving] = useState(false)

  // Release the object URL whenever the preview changes or the dialog unmounts.
  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }, [previewUrl])

  const pick = () => {
    if (inputRef.current) { inputRef.current.value = ''; inputRef.current.click() }
  }

  const onFileChosen = (event: ChangeEvent<HTMLInputElement>) => {
    const chosen = event.target.files?.[0]
    if (!chosen) return
    const result = preparePhoto(chosen)
    setPreviewFailed(false); setProgress(0)
    if ('error' in result) {
      setFile(null); setPreviewUrl(null); setError(result.error)
    } else {
      setFile(result.file); setPreviewUrl(URL.createObjectURL(result.file)); setError('')
    }
    setOpen(true)
  }

  const close = () => {
    if (uploading) return
    setOpen(false); setFile(null); setPreviewUrl(null); setError('')
  }

  const upload = async () => {
    if (!file) return
    setUploading(true); setError(''); setProgress(0)
    try {
      const { data } = await authAPI.uploadAvatar(file, setProgress)
      onUpdated(data.user)
      onNotice('Profile photo updated.')
      setOpen(false); setFile(null); setPreviewUrl(null)
    } catch (err) {
      setError(getApiErrorMessage(err, 'We couldn’t upload that photo. Please try again.'))
    } finally {
      setUploading(false)
    }
  }

  const remove = async () => {
    if (!window.confirm('Remove your profile photo? Your initials will be shown instead.')) return
    setRemoving(true)
    try {
      const { data } = await authAPI.removeAvatar()
      onUpdated(data.user)
      onNotice('Profile photo removed.')
    } catch (err) {
      onNotice(getApiErrorMessage(err, 'We couldn’t remove your photo. Please try again.'))
    } finally {
      setRemoving(false)
    }
  }

  const element = (
    <>
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={onFileChosen} tabIndex={-1} aria-hidden="true" />
      <AccountDialog
        open={open}
        title="Update profile photo"
        description="We’ll centre it on your face and crop it to a square."
        onClose={close}
        busy={uploading}
      >
        <div className="flex flex-col items-center gap-4">
          {file && (
            <div className="relative h-40 w-40 overflow-hidden rounded-full bg-gray-100 ring-4 ring-primary-50">
              {previewUrl && !previewFailed ? (
                <Image src={previewUrl} alt="Preview of your new profile photo" fill unoptimized className="object-cover" onError={() => setPreviewFailed(true)} />
              ) : (
                // e.g. HEIC outside Safari — it still uploads and converts fine.
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-4 text-center text-xs text-gray-500">
                  <ImageOff className="h-6 w-6" aria-hidden="true" />
                  Preview not available in this browser
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white" aria-hidden="true">
                  {progress < 100 ? `${progress}%` : 'Processing…'}
                </div>
              )}
            </div>
          )}
          {file && <p className="max-w-full truncate text-xs text-gray-500">{file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB</p>}
          {error && <p className="w-full rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700" role="alert">{error}</p>}
          <p className="text-xs text-gray-500 text-center">JPG, PNG, WebP or HEIC, up to 5 MB.</p>
          <div className="flex w-full gap-3">
            <Button type="button" variant="secondary" className="flex-1" onClick={pick} disabled={uploading}>
              {file ? 'Choose another' : 'Choose a photo'}
            </Button>
            {file && (
              <Button type="button" className="flex-1" onClick={upload} isLoading={uploading}>
                {uploading ? 'Uploading…' : 'Save photo'}
              </Button>
            )}
          </div>
        </div>
      </AccountDialog>
    </>
  )

  return { pick, remove, removing, uploading, element }
}
