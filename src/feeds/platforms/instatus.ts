import { getPathSegments } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const languageRegex = /^[a-z]{2}(?:-[a-z]{2})?$/i

const pageMarkers = ['custom-html-above-header', 'custom-html-below-footer']

export const isInstatusHtml = (content: string): boolean => {
  return pageMarkers.every((marker) => content.includes(marker))
}

export const isInstatusHeaders = (headers: Headers): boolean => {
  return headers.get('x-matched-path')?.startsWith('/[lang]/[url]/[type]/[userId]') ?? false
}

export const instatusHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isInstatusHtml, headers: isInstatusHeaders })
  },

  // A page in a translation (`/de`, `/zh-tw`) links the history feeds translated to it.
  resolve: (url) => {
    const { origin } = new URL(url)
    const [language] = getPathSegments(url)
    const base = language && languageRegex.test(language) ? `${origin}/${language}` : origin

    return [
      { uri: `${base}/history.rss`, hint: composeHint('instatus:history', 'rss') },
      { uri: `${base}/history.atom`, hint: composeHint('instatus:history', 'atom') },
    ]
  },
}
