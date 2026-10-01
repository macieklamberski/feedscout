import { isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ProseUrl = { kind: 'home' } | { kind: 'tag'; tag: string } | { kind: 'blog' }

const domains = ['prose.sh']
const apexHosts = ['prose.sh', 'www.prose.sh']

export const parseProseUrl = (url: string): ProseUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // Apex prose.sh is the platform-wide discovery firehose, not a per-blog feed.
  if (isHostOf(parsedUrl, apexHosts)) {
    return { kind: 'home' }
  }

  if (!isSubdomainOf(parsedUrl, domains)) {
    return
  }

  const tag = parsedUrl.searchParams.get('tag')

  if (tag) {
    return { kind: 'tag', tag }
  }

  return { kind: 'blog' }
}

export const proseHandler: PlatformHandler = {
  match: (url) => {
    return parseProseUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseProseUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'home') {
      return [
        {
          uri: 'https://prose.sh/rss',
          hint: composeHint('prose:discovery'),
        },
      ]
    }

    const { origin } = new URL(url)

    if (parsed.kind === 'tag') {
      return [
        {
          uri: `${origin}/rss?tag=${encodeURIComponent(parsed.tag)}`,
          hint: composeHint('prose:tag'),
        },
      ]
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('prose:blog') }]
  },
}
