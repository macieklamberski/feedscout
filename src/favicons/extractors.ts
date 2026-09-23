import type { DiscoverExtractFn } from '../common/types.js'
import { isSuccessfulStatus } from '../common/utils.js'
import type { FaviconResult } from './types.js'

const isImageContentType = (headers?: Headers): boolean => {
  return headers?.get('content-type')?.startsWith('image/') ?? false
}

// Decoding a body as text keeps the ICO signature, whose bytes are valid UTF-8,
// and turns JPEG's leading `FF D8 FF` into replacement characters, so a JPEG is
// found by the JFIF or Exif label that follows them.
const icoSignature = '\u0000\u0000\u0001\u0000'
const jpegLabelRegex = /^\uFFFD{3,4}[\s\S]{2}(?:JFIF|Exif)/

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
    content.startsWith(icoSignature) ||
    jpegLabelRegex.test(content) ||
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
