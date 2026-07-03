import { isAnyOf, isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Partially discoverable without handler.

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
const sorts = ['newest', 'top-rated', 'top-sellers', 'on-sale', 'free']

const byUserRegex = /^\/games\/by-([^/]+)/
const tagRegex = /^\/games\/tag-([^/]+)/
const platformRegex = /^\/games\/platform-([^/.]+)/
const genreRegex = /^\/games\/genre-([^/.]+)/
const madeWithRegex = /^\/games\/made-with-([^/.]+)/
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

    // /games/platform-{platform}
    const platformMatch = pathname.match(platformRegex)

    if (platformMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/platform-${platformMatch[1]}.xml`,
          hint: composeHint('itchio:platform'),
        },
      ]
    }

    // /games/genre-{genre}
    const genreMatch = pathname.match(genreRegex)

    if (genreMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/genre-${genreMatch[1]}.xml`,
          hint: composeHint('itchio:genre'),
        },
      ]
    }

    // /games/made-with-{engine}
    const madeWithMatch = pathname.match(madeWithRegex)

    if (madeWithMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/made-with-${madeWithMatch[1]}.xml`,
          hint: composeHint('itchio:made-with'),
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

    // Root page: curated feeds + itch.io blog.
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: 'https://itch.io/feed/featured.xml', hint: composeHint('itchio:featured') })
    uris.push({ uri: 'https://itch.io/feed/new.xml', hint: composeHint('itchio:new') })
    uris.push({ uri: 'https://itch.io/feed/sales.xml', hint: composeHint('itchio:sales') })
    uris.push({ uri: 'https://itch.io/blog.rss', hint: composeHint('itchio:blog') })

    return uris
  },
}
