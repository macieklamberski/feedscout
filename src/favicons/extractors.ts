import type { DiscoverExtractFn } from '../common/types.js'
import { isSuccessfulStatus } from '../common/utils.js'
import type { FaviconResult } from './types.js'

const isImageContentType = (headers?: Headers): boolean => {
  return headers?.get('content-type')?.startsWith('image/') ?? false
}

// TODO: Consider exposing byte data from fetch responses to detect JPEG and ICO
// via magic bytes. Their signatures are fully non-ASCII and get mangled by UTF-8
// decoding, making them undetectable from string content.
//
// Security: SVG favicons are accepted here but returned unvalidated. An SVG can
// carry active content (e.g. <svg onload=...>), so consumers must treat returned
// SVG favicon URLs as untrusted and never inline them without sanitization.
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

export const defaultExtractFn: DiscoverExtractFn<FaviconResult> = (input) => {
  // Require an actual image signal (content-type or sniffed body) on a 2xx
  // response. A successful status alone never implies the body is an image.
  const isImage = isImageContentType(input.headers) || isImageContent(input.content)

  return { url: input.url, isValid: isImage && isSuccessfulStatus(input.status) }
}
