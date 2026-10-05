import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ParsiblogUrl = { kind: 'blog'; blog: string }

const domains = ['parsiblog.com', 'parsiblog.ir']

// The portal, not a blog. Every other name on the wildcard is a blog or a missing one.
const excludedSubdomains = ['www']

export const parseParsiblogUrl = (url: string): ParsiblogUrl | undefined => {
  const blog = getSubdomain(url, domains)

  if (!blog || blog.includes('.') || isAnyOf(blog, excludedSubdomains)) {
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
