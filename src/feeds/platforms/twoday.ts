import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TwodayUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'topic'; blog: string; topic: string }

const domains = ['twoday.net']

const topicRegex = /^\/topics\/([^/]+)(?:\/|$)/i

const excludedSubdomains = ['static']

export const parseTwodayUrl = (url: string): TwodayUrl | undefined => {
  const pathname = parseUrl(url)?.pathname

  if (!pathname) {
    return
  }

  const blog = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!blog) {
    return
  }

  const topic = pathname.match(topicRegex)?.[1]

  if (topic) {
    return { kind: 'topic', blog, topic }
  }

  return { kind: 'blog', blog }
}

export const twodayHandler: PlatformHandler = {
  match: (url) => {
    return parseTwodayUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTwodayUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'topic') {
      uris.push({
        uri: `${origin}/topics/${parsed.topic}/index.rdf`,
        hint: composeHint('twoday:topic'),
      })
    }

    // A blog's skin links either spelling, and both serve the same feed.
    uris.push({ uri: [`${origin}/index.rdf`, `${origin}/rss`], hint: composeHint('twoday:posts') })

    return uris
  },
}
