import { getAnyOf, isHostOf, isHostOrSubdomainOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers devlog, game (html), partly covers home.
// Handler needed for: browseByTag, browseByUser, games, user.

const domains = ['itch.io']
const mainHosts = ['itch.io', 'www.itch.io']

const byUserRegex = /^\/games\/by-([^/]+)/i
const tagRegex = /^\/games\/tag-([^/]+)/i
const platformRegex = /^\/games\/platform-([^/.]+)/i
const genreRegex = /^\/games\/genre-([^/.]+)/i
const madeWithRegex = /^\/games\/made-with-([^/.]+)/i
const sortRegex = /^\/games\/([^/.]+)/i
const sectionRegex = /^\/([^/.]+)/
const gameRegex = /^\/([^/]+)/
const gamesRegex = /^\/games\/?$/i
const devlogsRegex = /^\/devlogs\/?$/i
const feedSuffixRegex = /\.xml$/i

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

export const itchioHandler: PlatformHandler = {
  match: (url) => {
    return isHostOrSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { hostname, pathname } = new URL(url)

    // Subdomain: creator pages ({creator}.itch.io).
    if (!isHostOf(url, mainHosts) && isSubdomainOf(url, domains)) {
      const creator = hostname.replace('.itch.io', '')
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

    // A listing's feed URL, such as /games/tag-horror.xml, names its page too.
    const listingPath = pathname.replace(feedSuffixRegex, '')

    // /games/by-{username}
    const byUserMatch = listingPath.match(byUserRegex)

    if (byUserMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/by-${byUserMatch[1]}.xml`,
          hint: composeHint('itchio:games'),
        },
      ]
    }

    // /games/tag-{tag}
    const tagMatch = listingPath.match(tagRegex)

    if (tagMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/tag-${tagMatch[1]}.xml`,
          hint: composeHint('itchio:tag'),
        },
      ]
    }

    // /games/platform-{platform}
    const platformMatch = listingPath.match(platformRegex)

    if (platformMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/platform-${platformMatch[1]}.xml`,
          hint: composeHint('itchio:platform'),
        },
      ]
    }

    // /games/genre-{genre}
    const genreMatch = listingPath.match(genreRegex)

    if (genreMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/genre-${genreMatch[1]}.xml`,
          hint: composeHint('itchio:genre'),
        },
      ]
    }

    // /games/made-with-{engine}
    const madeWithMatch = listingPath.match(madeWithRegex)

    if (madeWithMatch?.[1]) {
      return [
        {
          uri: `https://itch.io/games/made-with-${madeWithMatch[1]}.xml`,
          hint: composeHint('itchio:made-with'),
        },
      ]
    }

    // /games/{sort}
    const sortMatch = listingPath.match(sortRegex)

    const sort = getAnyOf(sortMatch?.[1], sorts)

    if (sort) {
      return [
        {
          uri: `https://itch.io/games/${sort}.xml`,
          hint: composeHint('itchio:games'),
        },
      ]
    }

    // /games
    if (gamesRegex.test(listingPath)) {
      return [{ uri: 'https://itch.io/games.xml', hint: composeHint('itchio:games') }]
    }

    // /devlogs
    if (devlogsRegex.test(listingPath)) {
      return [{ uri: 'https://itch.io/devlogs.xml', hint: composeHint('itchio:devlog') }]
    }

    // /{section} (tools, game-assets, soundtracks, physical-games, books, comics, misc)
    const sectionMatch = listingPath.match(sectionRegex)

    const section = getAnyOf(sectionMatch?.[1], sections)

    if (section) {
      return [
        {
          uri: `https://itch.io/${section}.xml`,
          hint: composeHint('itchio:section'),
        },
      ]
    }

    // Root page: curated feeds + itch.io blog.
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: 'https://itch.io/feed/featured.xml', hint: composeHint('itchio:featured') })
    uris.push({ uri: 'https://itch.io/feed/new.xml', hint: composeHint('itchio:new') })
    uris.push({ uri: 'https://itch.io/feed/sales.xml', hint: composeHint('itchio:sales') })
    uris.push({ uri: 'https://itch.io/devlogs.xml', hint: composeHint('itchio:devlogs') })
    uris.push({ uri: 'https://itch.io/blog.rss', hint: composeHint('itchio:blog') })

    return uris
  },
}
