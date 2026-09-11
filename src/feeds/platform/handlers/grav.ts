import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Grav turns a listing page into a feed by appending `.rss` or `.atom` to its
// path.
//
// The generator value is `GravCMS` and must be matched in full: `hasMetaContent`
// compares the value as a prefix, so `Grav` also matches `Gravity Forms`.

const trailingSlashRegex = /\/$/

export const isGravHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'GravCMS')
}

export const gravHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isGravHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const pagePath = `${origin}${pathname}`.replace(trailingSlashRegex, '')

      return [
        { uri: `${pagePath}.rss`, hint: composeHint('grav:page-rss') },
        { uri: `${pagePath}.atom`, hint: composeHint('grav:page-atom') },
      ]
    } catch {}

    return []
  },
}
