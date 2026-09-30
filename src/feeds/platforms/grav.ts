import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

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

export const gravHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isGravHtml, headers: isGravHeaders })
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    // The site root has no path to suffix, so its feed is `/.rss`.
    const pagePath =
      pathname === '/' ? `${origin}/` : `${origin}${pathname}`.replace(trailingSlashRegex, '')

    return [
      { uri: `${pagePath}.rss`, hint: composeHint('grav:page', 'rss') },
      { uri: `${pagePath}.atom`, hint: composeHint('grav:page', 'atom') },
    ]
  },
}
