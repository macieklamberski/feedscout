import { getPathSegments, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type InstatusUrl = { kind: 'status'; language?: string }

const languageRegex = /^[a-z]{2}(?:-[a-z]{2})?$/i

const pageMarkers = ['custom-html-above-header', 'custom-html-below-footer']

export const isInstatusHtml = (content: string): boolean => {
  return pageMarkers.every((marker) => content.includes(marker))
}

export const isInstatusHeaders = (headers: Headers): boolean => {
  return headers.get('x-matched-path')?.startsWith('/[lang]/[url]/[type]/[userId]') ?? false
}

// A page in a translation (`/de`, `/zh-tw`) links the history feeds translated to it.
export const parseInstatusUrl = (url: string): InstatusUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [language] = getPathSegments(parsedUrl)

  if (language && languageRegex.test(language)) {
    return { kind: 'status', language }
  }

  return { kind: 'status' }
}

export const instatusHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isInstatusHtml, headers: isInstatusHeaders })) {
      return false
    }

    return parseInstatusUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseInstatusUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const { language } = parsed
    const base = language ? `${origin}/${language}` : origin

    return [
      { uri: `${base}/history.rss`, hint: composeHint('instatus:history', 'rss') },
      { uri: `${base}/history.atom`, hint: composeHint('instatus:history', 'atom') },
    ]
  },
}
