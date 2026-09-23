import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMetaContent } from '../../../common/utils.js'

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
  match: (url, content, headers) => {
    if (!URL.canParse(url)) {
      return false
    }

    if (content && isGravHtml(content)) {
      return true
    }

    if (headers && isGravHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      // The site root has no path to suffix, so its feed is `/.rss`.
      const pagePath =
        pathname === '/' ? `${origin}/` : `${origin}${pathname}`.replace(trailingSlashRegex, '')

      return [
        { uri: `${pagePath}.rss`, hint: composeHint('grav:page-rss') },
        { uri: `${pagePath}.atom`, hint: composeHint('grav:page-atom') },
      ]
    } catch {}

    return []
  },
}
