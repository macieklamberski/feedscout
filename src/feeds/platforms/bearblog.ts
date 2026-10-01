import { isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (guess, html).
// Handler needed for: home.

export type BearblogUrl = { kind: 'discover' } | { kind: 'blog'; tag?: string }

const domains = ['bearblog.dev']
const apexHosts = ['bearblog.dev', 'www.bearblog.dev']

export const parseBearblogUrl = (url: string): BearblogUrl | undefined => {
  // Apex bearblog.dev exposes the platform-wide trending discovery feed.
  if (isHostOf(url, apexHosts)) {
    return { kind: 'discover' }
  }

  if (!isSubdomainOf(url, domains)) {
    return
  }

  // Tag filter via ?q= query param.
  const tag = new URL(url).searchParams.get('q') ?? undefined

  return { kind: 'blog', tag }
}

export const bearblogHandler: PlatformHandler = {
  match: (url) => {
    return parseBearblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBearblogUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'discover') {
      return [
        {
          uri: 'https://bearblog.dev/discover/feed/',
          hint: composeHint('bearblog:discover', 'atom'),
        },
        {
          uri: 'https://bearblog.dev/discover/feed/?type=rss',
          hint: composeHint('bearblog:discover', 'rss'),
        },
      ]
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.tag) {
      uris.push({
        uri: `${origin}/feed/?q=${encodeURIComponent(parsed.tag)}`,
        hint: composeHint('bearblog:tag', 'atom'),
      })
      uris.push({
        uri: `${origin}/feed/?type=rss&q=${encodeURIComponent(parsed.tag)}`,
        hint: composeHint('bearblog:tag', 'rss'),
      })
    }

    uris.push({ uri: `${origin}/feed/`, hint: composeHint('bearblog:posts', 'atom') })
    uris.push({ uri: `${origin}/feed/?type=rss`, hint: composeHint('bearblog:posts', 'rss') })

    return uris
  },
}
