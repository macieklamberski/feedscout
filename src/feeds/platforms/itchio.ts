import { getAnyOf, isAnyOf, isHostOf, isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, devlog, devlogs, game (html), partly covers home.
// Handler needed for: browseByEngine, browseByGenre, browseByPlatform, browseBySort, browseByTag, browseByUser, games, section, user.

export type ItchioUrl =
  | { kind: 'game'; creator: string; game: string }
  | { kind: 'creator'; creator: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'platform'; platform: string }
  | { kind: 'genre'; genre: string }
  | { kind: 'madeWith'; engine: string }
  | { kind: 'games'; sort?: string }
  | { kind: 'devlogs' }
  | { kind: 'blog' }
  | { kind: 'section'; section: string }
  | { kind: 'home'; path: string }

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
const blogRegex = /^\/blog\/?$/i
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
const sorts = [
  'newest',
  'top-rated',
  'top-sellers',
  'on-sale',
  'free',
  'released',
  'in-development',
]

export const parseItchioUrl = (url: string): ItchioUrl | undefined => {
  if (!isHostOf(url, mainHosts) && !isSubdomainOf(url, domains)) {
    return
  }

  const { hostname, pathname } = new URL(url)

  // Subdomain: creator pages ({creator}.itch.io).
  if (!isHostOf(url, mainHosts)) {
    const creator = hostname.replace('.itch.io', '')
    const game = pathname.match(gameRegex)?.[1]

    if (game) {
      return { kind: 'game', creator, game }
    }

    return { kind: 'creator', creator }
  }

  // A listing's feed URL, such as /games/tag-horror.xml, names its page too.
  const listingPath = pathname.replace(feedSuffixRegex, '')
  const creator = listingPath.match(byUserRegex)?.[1]

  if (creator) {
    return { kind: 'creator', creator }
  }

  const tag = listingPath.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const platform = listingPath.match(platformRegex)?.[1]

  if (platform) {
    return { kind: 'platform', platform }
  }

  const genre = listingPath.match(genreRegex)?.[1]

  if (genre) {
    return { kind: 'genre', genre }
  }

  const engine = listingPath.match(madeWithRegex)?.[1]

  if (engine) {
    return { kind: 'madeWith', engine }
  }

  const sort = getAnyOf(listingPath.match(sortRegex)?.[1], sorts)

  if (sort) {
    return { kind: 'games', sort }
  }

  if (gamesRegex.test(listingPath)) {
    return { kind: 'games' }
  }

  if (devlogsRegex.test(listingPath)) {
    return { kind: 'devlogs' }
  }

  if (blogRegex.test(listingPath)) {
    return { kind: 'blog' }
  }

  // /{section} (tools, game-assets, soundtracks, physical-games, books, comics, misc)
  const section = getAnyOf(listingPath.match(sectionRegex)?.[1], sections)

  if (section) {
    return { kind: 'section', section }
  }

  return { kind: 'home', path: pathname }
}

export const itchioHandler: PlatformHandler = {
  match: (url) => {
    return parseItchioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseItchioUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'game') {
      return [
        {
          uri: `https://${parsed.creator}.itch.io/${parsed.game}/devlog.rss`,
          hint: composeHint('itchio:devlog'),
        },
      ]
    }

    if (parsed.kind === 'creator') {
      return [
        {
          uri: `https://itch.io/games/by-${parsed.creator}.xml`,
          hint: composeHint('itchio:games'),
        },
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        {
          uri: `https://itch.io/games/tag-${parsed.tag}.xml`,
          hint: composeHint('itchio:tag'),
        },
      ]
    }

    if (parsed.kind === 'platform') {
      return [
        {
          uri: `https://itch.io/games/platform-${parsed.platform}.xml`,
          hint: composeHint('itchio:platform'),
        },
      ]
    }

    if (parsed.kind === 'genre') {
      return [
        {
          uri: `https://itch.io/games/genre-${parsed.genre}.xml`,
          hint: composeHint('itchio:genre'),
        },
      ]
    }

    if (parsed.kind === 'madeWith') {
      return [
        {
          uri: `https://itch.io/games/made-with-${parsed.engine}.xml`,
          hint: composeHint('itchio:made-with'),
        },
      ]
    }

    if (parsed.kind === 'games' && parsed.sort) {
      return [
        {
          uri: `https://itch.io/games/${parsed.sort}.xml`,
          hint: composeHint('itchio:games'),
        },
      ]
    }

    if (parsed.kind === 'games') {
      return [{ uri: 'https://itch.io/games.xml', hint: composeHint('itchio:games') }]
    }

    if (parsed.kind === 'devlogs') {
      return [{ uri: 'https://itch.io/devlogs.xml', hint: composeHint('itchio:devlogs') }]
    }

    if (parsed.kind === 'blog') {
      return [{ uri: 'https://itch.io/blog.rss', hint: composeHint('itchio:blog') }]
    }

    if (parsed.kind === 'section') {
      return [
        {
          uri: `https://itch.io/${parsed.section}.xml`,
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

    // A site feed URL, such as /feed/featured.xml, names only itself.
    const siteFeed = uris.find((entry) => isAnyOf(`https://itch.io${parsed.path}`, entry.uri))

    if (siteFeed) {
      return [siteFeed]
    }

    return uris
  },
}
