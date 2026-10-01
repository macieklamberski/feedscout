import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GhostUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'author'; author: string }
  | { kind: 'blog' }

const domains = ['ghost.io']
const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i

export const parseGhostUrl = (url: string): GhostUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const author = pathname.match(authorRegex)?.[1]

  if (author) {
    return { kind: 'author', author }
  }

  return { kind: 'blog' }
}

export const ghostHandler: PlatformHandler = {
  match: (url) => {
    return parseGhostUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGhostUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const blog = { uri: `${origin}/rss/`, hint: composeHint('ghost:blog') }

    if (parsed.kind === 'tag') {
      return [{ uri: `${origin}/tag/${parsed.tag}/rss/`, hint: composeHint('ghost:tag') }, blog]
    }

    if (parsed.kind === 'author') {
      return [
        { uri: `${origin}/author/${parsed.author}/rss/`, hint: composeHint('ghost:author') },
        blog,
      ]
    }

    return [blog]
  },
}
