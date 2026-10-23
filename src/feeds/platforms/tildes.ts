import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TildesUrl =
  | { kind: 'group'; group: string; tag?: string }
  | { kind: 'home'; tag?: string }

const hosts = ['tildes.net', 'www.tildes.net']
const groupRegex = /^\/~([^/]+)/

export const parseTildesUrl = (url: string): TildesUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const tag = searchParams.get('tag') ?? undefined
  const group = pathname.match(groupRegex)?.[1]

  if (group) {
    return { kind: 'group', group, tag }
  }

  if (pathname === '/') {
    return { kind: 'home', tag }
  }
}

export const tildesHandler: PlatformHandler = {
  match: (url) => {
    return parseTildesUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTildesUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    // Tildes' feed views honour the ?tag= query (forces order=NEW server-side).
    const tagSuffix = parsed.tag ? `?tag=${encodeURIComponent(parsed.tag)}` : ''

    if (parsed.kind === 'group') {
      uris.push({
        uri: `https://tildes.net/~${parsed.group}/topics.rss${tagSuffix}`,
        hint: composeHint('tildes:group', 'rss'),
      })
      uris.push({
        uri: `https://tildes.net/~${parsed.group}/topics.atom${tagSuffix}`,
        hint: composeHint('tildes:group', 'atom'),
      })

      return uris
    }

    uris.push({
      uri: `https://tildes.net/topics.rss${tagSuffix}`,
      hint: composeHint('tildes:topics', 'rss'),
    })
    uris.push({
      uri: `https://tildes.net/topics.atom${tagSuffix}`,
      hint: composeHint('tildes:topics', 'atom'),
    })

    return uris
  },
}
