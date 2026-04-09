import type { DiscoverExtractFn } from '../common/types.js'
import type { FaviconResult } from './types.js'

const isImageContentType = (headers?: Headers): boolean => {
  return headers?.get('content-type')?.startsWith('image/') ?? false
}

// TODO: Consider exposing byte data from fetch responses to detect JPEG and ICO
// via magic bytes. Their signatures are fully non-ASCII and get mangled by UTF-8
// decoding, making them undetectable from string content.
const isImageContent = (content: string): boolean => {
  if (content.includes('<html')) {
    return false
  }

  const trimmed = content.trimStart()
  const head = trimmed.slice(0, 200)

  return (
    trimmed.startsWith('<svg') ||
    (trimmed.startsWith('<?xml') && head.includes('<svg')) ||
    content.slice(1, 4) === 'PNG' ||
    content.startsWith('GIF8') ||
    (content.startsWith('RIFF') && content.includes('WEBP'))
  )
}

const isSuccessStatus = (status?: number): boolean => {
  return status !== undefined && status >= 200 && status < 400
}

export const defaultExtractFn: DiscoverExtractFn<FaviconResult> = (input) => {
  if (
    isImageContentType(input.headers) ||
    isImageContent(input.content) ||
    isSuccessStatus(input.status)
  ) {
    return { url: input.url, isValid: true }
  }

  return { url: input.url, isValid: false }
}
