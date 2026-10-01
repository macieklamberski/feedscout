import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GravUrl = { kind: 'home' } | { kind: 'page'; path: string }

const trailingSlashRegex = /\/$/
const gravAssetRegex = /\/user\/(?:themes|plugins)\//
const gravCookieRegex = /^grav-site-[0-9a-f]+$/

// `GravCMS` in full, since the value is compared as a prefix and `Grav` matches `Gravity Forms`.
export const isGravHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'GravCMS') || gravAssetRegex.test(content)
}

export const isGravHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => gravCookieRegex.test(name))
}

export const parseGravUrl = (url: string): GravUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl

  if (pathname === '/') {
    return { kind: 'home' }
  }

  return { kind: 'page', path: pathname.replace(trailingSlashRegex, '') }
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
