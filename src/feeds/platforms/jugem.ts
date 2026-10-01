import { getSubdomain } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type JugemUrl = { kind: 'blog'; blog: string }

const domains = ['jugem.jp']

export const parseJugemUrl = (url: string): JugemUrl | undefined => {
  const blog = getSubdomain(url, domains)

  // Only {blog}.jugem.jp names a blog, www.jugem.jp is the portal.
  if (!blog || blog.includes('.') || blog === 'www') {
    return
  }

  return { kind: 'blog', blog }
}

export const jugemHandler: PlatformHandler = {
  match: (url) => {
    return parseJugemUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseJugemUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      { uri: `${origin}/?mode=rss`, hint: composeHint('jugem:posts', 'rdf') },
      { uri: `${origin}/?mode=atom`, hint: composeHint('jugem:posts', 'atom') },
    ]
  },
}
