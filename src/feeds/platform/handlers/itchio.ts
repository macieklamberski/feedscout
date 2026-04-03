import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf, isSubdomainOf } from '../../../common/utils.js'

const mainHosts = ['itch.io', 'www.itch.io']
const sections = [
  'tools',
  'game-assets',
  'soundtracks',
  'physical-games',
  'books',
  'comics',
  'misc',
]
const sorts = ['newest', 'top-rated', 'top-sellers', 'on-sale']

const byUserRegex = /^\/games\/by-([^/]+)/
const tagRegex = /^\/games\/tag-([^/]+)/
const sortRegex = /^\/games\/([^/.]+)/
const sectionRegex = /^\/([^/.]+)/
const gameRegex = /^\/([^/]+)/

export const itchioHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, mainHosts) || isSubdomainOf(url, 'itch.io')
  },

  resolve: (url) => {
    const { hostname, pathname } = new URL(url)
    const lowerHostname = hostname.toLowerCase()

    // Subdomain: creator pages ({creator}.itch.io).
    if (!mainHosts.includes(lowerHostname) && lowerHostname.endsWith('.itch.io')) {
      const creator = lowerHostname.replace('.itch.io', '')
      const gameMatch = pathname.match(gameRegex)

      // Game page: {creator}.itch.io/{game}
      if (gameMatch?.[1]) {
        return [
          {
            uri: `https://${creator}.itch.io/${gameMatch[1]}/devlog.rss`,
            hint: composeHint('itchio:devlog'),
          },
        ]
      }

      // Creator root: {creator}.itch.io/
      return [
        {
          uri: `https://itch.io/games/by-${creator}.xml`,
          hint: composeHint('itchio:games'),
        },
      ]
    }

    // /games/by-{username}
    const byUserMatch = pathname.match(byUserRegex)

    if (byUserMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/by-${byUserMatch[1]}.xml`,
          hint: composeHint('itchio:games'),
        },
      ]
    }

    // /games/tag-{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/tag-${tagMatch[1]}.xml`,
          hint: composeHint('itchio:tag'),
        },
      ]
    }

    // /games/{sort}
    const sortMatch = pathname.match(sortRegex)

    if (sortMatch?.[1] && isAnyOf(sortMatch[1], sorts)) {
      return [
        {
          uri: `https://itch.io/games/${sortMatch[1]}.xml`,
          hint: composeHint('itchio:games'),
        },
      ]
    }

    // /games
    if (pathname === '/games' || pathname === '/games/') {
      return [{ uri: 'https://itch.io/games.xml', hint: composeHint('itchio:games') }]
    }

    // /devlogs
    if (pathname === '/devlogs' || pathname === '/devlogs/') {
      return [{ uri: 'https://itch.io/devlogs.xml', hint: composeHint('itchio:devlog') }]
    }

    // /{section} (tools, game-assets, soundtracks, physical-games, books, comics, misc)
    const sectionMatch = pathname.match(sectionRegex)

    if (sectionMatch?.[1] && isAnyOf(sectionMatch[1], sections)) {
      return [
        {
          uri: `https://itch.io/${sectionMatch[1]}.xml`,
          hint: composeHint('itchio:section'),
        },
      ]
    }

    // Root page: curated feeds.
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: 'https://itch.io/feed/featured.xml', hint: composeHint('itchio:featured') })
    uris.push({ uri: 'https://itch.io/feed/new.xml', hint: composeHint('itchio:new') })
    uris.push({ uri: 'https://itch.io/feed/sales.xml', hint: composeHint('itchio:sales') })

    return uris
  },
}
