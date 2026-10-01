import { isSubdomainOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html), partly covers tag.

export type PosthavenUrl = { kind: 'tag'; tag: string } | { kind: 'blog' }

const domains = ['posthaven.com']
const tagRegex = /^\/tag\/([^/]+)/i

export const parsePosthavenUrl = (url: string): PosthavenUrl | undefined => {
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

export const posthavenHandler: PlatformHandler = {
  match: (url) => {
    return parsePosthavenUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePosthavenUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const posts: DiscoverUriEntry = {
      uri: `${origin}/posts.atom`,
      hint: composeHint('posthaven:posts'),
    }

    // Posthaven serves an undocumented per-tag Atom feed.
    if (parsed.kind === 'tag') {
      return [
        { uri: `${origin}/tag/${parsed.tag}.atom`, hint: composeHint('posthaven:tag') },
        posts,
      ]
    }

    return [posts]
  },
}
