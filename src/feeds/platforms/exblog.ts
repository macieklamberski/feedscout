import { getSubdomain, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ExblogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const categoryRegex = /^\/i(\d+)/

const domains = ['exblog.jp']

export const parseExblogUrl = (url: string): ExblogUrl | undefined => {
  const blog = getSubdomain(url, domains)

  // Only {blog}.exblog.jp names a blog, www.exblog.jp is the portal.
  if (!blog || blog.includes('.') || blog === 'www') {
    return
  }

  const category = parseUrl(url)?.pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', blog, category }
  }

  return { kind: 'blog', blog }
}

export const exblogHandler: PlatformHandler = {
  match: (url) => {
    return parseExblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseExblogUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    // Category page: /i{N}.
    if (parsed.kind === 'category') {
      uris.push({
        uri: `${origin}/i${parsed.category}/index.xml`,
        hint: composeHint('exblog:category', 'rss'),
      })
      uris.push({
        uri: `${origin}/i${parsed.category}/atom.xml`,
        hint: composeHint('exblog:category', 'atom'),
      })
    }

    uris.push({ uri: `${origin}/index.xml`, hint: composeHint('exblog:posts', 'rss') })
    uris.push({ uri: `${origin}/atom.xml`, hint: composeHint('exblog:posts', 'atom') })

    return uris
  },
}
