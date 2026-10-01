import { isSubdomainOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, tag.

export type PikaUrl = { kind: 'tag'; tag: string } | { kind: 'blog' }

const domains = ['pika.page']
const tagRegex = /^\/tag\/([^/]+)/i

export const parsePikaUrl = (url: string): PikaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isSubdomainOf(parsedUrl, domains)) {
    return
  }

  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  return { kind: 'blog' }
}

export const pikaHandler: PlatformHandler = {
  match: (url) => {
    return parsePikaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePikaUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const posts: Array<DiscoverUriEntry> = [
      { uri: `${origin}/posts_feed`, hint: composeHint('pika:posts', 'atom') },
      { uri: `${origin}/posts_feed.rss`, hint: composeHint('pika:posts', 'rss') },
    ]

    if (parsed.kind === 'tag') {
      return [
        { uri: `${origin}/tag/${parsed.tag}/feed`, hint: composeHint('pika:tag', 'atom') },
        { uri: `${origin}/tag/${parsed.tag}/feed.rss`, hint: composeHint('pika:tag', 'rss') },
        ...posts,
      ]
    }

    return posts
  },
}
