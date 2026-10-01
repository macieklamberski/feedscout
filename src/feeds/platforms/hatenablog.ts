import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenablogUrl =
  | { kind: 'category'; category: string }
  | { kind: 'author'; author: string }
  | { kind: 'blog' }

const domains = [
  'hatenablog.com',
  'hatenablog.jp',
  'hateblo.jp',
  'hatenadiary.com',
  'hatenadiary.jp',
  'hatenadiary.org',
]
const categoryRegex = /^\/archive\/category\/([^/]+)/i
const authorRegex = /^\/archive\/author\/([^/]+)/i

export const parseHatenablogUrl = (url: string): HatenablogUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const category = pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', category }
  }

  const author = pathname.match(authorRegex)?.[1]

  if (author) {
    return { kind: 'author', author }
  }

  return { kind: 'blog' }
}

export const hatenablogHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenablogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHatenablogUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      uris.push({
        uri: `${origin}/rss/category/${parsed.category}`,
        hint: composeHint('hatenablog:category', 'rss'),
      })
      uris.push({
        uri: `${origin}/feed/category/${parsed.category}`,
        hint: composeHint('hatenablog:category', 'atom'),
      })
    }

    if (parsed.kind === 'author') {
      uris.push({
        uri: `${origin}/rss/author/${parsed.author}`,
        hint: composeHint('hatenablog:author', 'rss'),
      })
      uris.push({
        uri: `${origin}/feed/author/${parsed.author}`,
        hint: composeHint('hatenablog:author', 'atom'),
      })
    }

    uris.push({ uri: `${origin}/rss`, hint: composeHint('hatenablog:posts', 'rss') })
    uris.push({ uri: `${origin}/feed`, hint: composeHint('hatenablog:posts', 'atom') })

    return uris
  },
}
