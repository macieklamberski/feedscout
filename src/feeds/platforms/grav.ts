import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  getCookieNames,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers listing (guess, html).
// Handler needed for: home.

export type GravUrl = { kind: 'home' } | { kind: 'page'; path: string }

const trailingSlashRegex = /\/$/
const htmlSuffixRegex = /\.html$/i
const paginationRegex = /\/page:\d+$/i
const gravAssetRegex = /\/user\/(?:themes|plugins)\//
const gravCookieRegex = /^grav-site-[0-9a-f]+$/

// `GravCMS` in full, since the value is compared as a prefix and `Grav` matches `Gravity Forms`.
export const isGravHtml = (content: string): boolean => {
  if (hasMetaContent(content, 'generator', 'GravCMS')) {
    return true
  }

  const asset = findElement(content, (element) => {
    if (element.name === 'link') {
      return gravAssetRegex.test(element.attribs.href ?? '')
    }

    if (element.name === 'script') {
      return gravAssetRegex.test(element.attribs.src ?? '')
    }

    return false
  })

  return asset !== undefined
}

export const isGravHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => gravCookieRegex.test(name))
}

export const parseGravUrl = (url: string): GravUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // Grav serves `/blog.html` as the `/blog` page, whose feed is `/blog.rss`, and pages a listing
  // with a `page:{n}` parameter.
  const path = parsedUrl.pathname
    .replace(trailingSlashRegex, '')
    .replace(htmlSuffixRegex, '')
    .replace(paginationRegex, '')

  if (!path) {
    return { kind: 'home' }
  }

  return { kind: 'page', path }
}

export const gravHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isGravHtml, headers: isGravHeaders })) {
      return false
    }

    return parseGravUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGravUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    // The site root has no path to suffix, so its feed is `/.rss`.
    const pagePath = parsed.kind === 'home' ? `${origin}/` : `${origin}${parsed.path}`

    return [
      { uri: `${pagePath}.rss`, hint: composeHint('grav:page', 'rss') },
      { uri: `${pagePath}.atom`, hint: composeHint('grav:page', 'atom') },
    ]
  },
}
