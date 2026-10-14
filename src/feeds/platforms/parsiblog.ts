import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ParsiblogUrl = { kind: 'blog'; blog: string }

const domains = ['parsiblog.com', 'parsiblog.ir']

export const parseParsiblogUrl = (url: string): ParsiblogUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const parsiblogHandler: PlatformHandler = {
  match: (url) => {
    return parseParsiblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseParsiblogUrl(url)

    if (!parsed) {
      return []
    }

    // Parsiblog serves no HTTPS, and every page, on either domain, links its feeds on
    // http://{blog}.ParsiBlog.com.
    const origin = `http://${parsed.blog}.parsiblog.com`

    return [
      { uri: `${origin}/rss/`, hint: composeHint('parsiblog:posts', 'rss') },
      { uri: `${origin}/atom/`, hint: composeHint('parsiblog:posts', 'atom') },
    ]
  },
}
