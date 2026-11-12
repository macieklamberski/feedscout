import { getAnyOf, isAnyOf, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, devlog, devlogs, game (html), partly covers home.
// Handler needed for: browseByEngine, browseByGenre, browseByPlatform, browseBySort, browseByTag, browseByUser, browseCombined, games, section, user.

export type ItchioUrl =
  | { kind: 'game'; creator: string; game: string }
  | { kind: 'creator'; creator: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'platform'; platform: string }
  | { kind: 'genre'; genre: string }
  | { kind: 'madeWith'; engine: string }
  | { kind: 'games'; sort?: string }
  | { kind: 'listing'; path: string }
  | { kind: 'devlogs' }
  | { kind: 'blog' }
  | { kind: 'section'; section: string }
  | { kind: 'home' }

const domains = ['itch.io']
const mainHosts = ['itch.io', 'www.itch.io']

const byUserRegex = /^\/games\/by-([^/]+)/i
const tagRegex = /^\/games\/tag-([^/]+)/i
const platformRegex = /^\/games\/platform-([^/]+)/i
const genreRegex = /^\/games\/genre-([^/]+)/i
const madeWithRegex = /^\/games\/made-with-([^/]+)/i
const sortRegex = /^\/games\/([^/]+)/i
// A listing with two or more filters, such as /games/newest/tag-horror, has its feed at its path.
// length: keeps a single-filter listing out
const combinedListingRegex = /^\/games(?:\/[^/]+){2,}/i
const combinedListingFeedRegex = /^\/games\/[^/]+\/.+\.xml\/?$/i
const firstSegmentRegex = /^\/([^/]+)/
const gamesRegex = /^\/games\/?$/i
const devlogsRegex = /^\/devlogs\/?$/i
const blogRegex = /^\/blog\/?$/i
const sectionFeedRegex = /^\/([^/]+)\.xml\/?$/i

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

// A URL takes the key of the first row it matches, so the /games/{sort}.xml and /{section}.xml
// rows come after the rows whose feeds they also match.
const feeds = definePlatformFeeds([
  { key: 'itchio:devlog', template: 'https://{creator}.itch.io/{game}/devlog.rss' },
  { key: 'itchio:games', template: 'https://itch.io/games/by-{creator}.xml' },
  { key: 'itchio:tag', template: 'https://itch.io/games/tag-{tag}.xml' },
  { key: 'itchio:platform', template: 'https://itch.io/games/platform-{platform}.xml' },
  { key: 'itchio:genre', template: 'https://itch.io/games/genre-{genre}.xml' },
  { key: 'itchio:made-with', template: 'https://itch.io/games/made-with-{engine}.xml' },
  { key: 'itchio:games', template: 'https://itch.io/games/{sort}.xml' },
  { key: 'itchio:games', template: 'https://itch.io/games.xml' },
  { key: 'itchio:devlogs', template: 'https://itch.io/devlogs.xml' },
  { key: 'itchio:blog', template: 'https://itch.io/blog.rss' },
  { key: 'itchio:featured', template: 'https://itch.io/feed/featured.xml' },
  { key: 'itchio:new', template: 'https://itch.io/feed/new.xml' },
  { key: 'itchio:sales', template: 'https://itch.io/feed/sales.xml' },
  { key: 'itchio:section', template: 'https://itch.io/{section}.xml' },
])

export const parseItchioUrl = (url: string): ItchioUrl | undefined => {
  if (!isHostOf(url, mainHosts) && !isSubdomainOf(url, domains)) {
    return
  }

  const { pathname } = new URL(url)

  // Subdomain: creator pages ({creator}.itch.io).
  if (!isHostOf(url, mainHosts)) {
    const creator = getTenantSubdomain(url, domains)

    if (!creator) {
      return
    }

    const game = pathname.match(firstSegmentRegex)?.[1]

    if (game) {
      return { kind: 'game', creator, game }
    }

    return { kind: 'creator', creator }
  }

  const combinedListing = pathname.match(combinedListingRegex)?.[0]

  if (combinedListing) {
    return { kind: 'listing', path: combinedListing }
  }

  const creator = pathname.match(byUserRegex)?.[1]

  if (creator) {
    return { kind: 'creator', creator }
  }

  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const platform = pathname.match(platformRegex)?.[1]

  if (platform) {
    return { kind: 'platform', platform }
  }

  const genre = pathname.match(genreRegex)?.[1]

  if (genre) {
    return { kind: 'genre', genre }
  }

  const engine = pathname.match(madeWithRegex)?.[1]

  if (engine) {
    return { kind: 'madeWith', engine }
  }

  const sort = getAnyOf(pathname.match(sortRegex)?.[1], sorts)

  if (sort) {
    return { kind: 'games', sort }
  }

  if (gamesRegex.test(pathname)) {
    return { kind: 'games' }
  }

  if (devlogsRegex.test(pathname)) {
    return { kind: 'devlogs' }
  }

  if (blogRegex.test(pathname)) {
    return { kind: 'blog' }
  }

  // /{section} (tools, game-assets, soundtracks, physical-games, books, comics, misc)
  const section = getAnyOf(pathname.match(firstSegmentRegex)?.[1], sections)

  if (section) {
    return { kind: 'section', section }
  }

  return { kind: 'home' }
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
      return [feeds.getFeedEntry('itchio:devlog', { creator: parsed.creator, game: parsed.game })]
    }

    if (parsed.kind === 'creator') {
      return [feeds.getFeedEntry('itchio:games', { creator: parsed.creator })]
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('itchio:tag', { tag: parsed.tag })]
    }

    if (parsed.kind === 'platform') {
      return [feeds.getFeedEntry('itchio:platform', { platform: parsed.platform })]
    }

    if (parsed.kind === 'genre') {
      return [feeds.getFeedEntry('itchio:genre', { genre: parsed.genre })]
    }

    if (parsed.kind === 'madeWith') {
      return [feeds.getFeedEntry('itchio:made-with', { engine: parsed.engine })]
    }

    // A listing has any number of filters, more path segments than a template placeholder holds.
    if (parsed.kind === 'listing') {
      return [{ uri: `https://itch.io${parsed.path}.xml`, hint: composeHint('itchio:games') }]
    }

    if (parsed.kind === 'games' && parsed.sort) {
      return [feeds.getFeedEntry('itchio:games', { sort: parsed.sort })]
    }

    if (parsed.kind === 'games') {
      return [feeds.getFeedEntry('itchio:games')]
    }

    if (parsed.kind === 'devlogs') {
      return [feeds.getFeedEntry('itchio:devlogs')]
    }

    if (parsed.kind === 'blog') {
      return [feeds.getFeedEntry('itchio:blog')]
    }

    if (parsed.kind === 'section') {
      return [feeds.getFeedEntry('itchio:section', { section: parsed.section })]
    }

    return [
      feeds.getFeedEntry('itchio:featured'),
      feeds.getFeedEntry('itchio:new'),
      feeds.getFeedEntry('itchio:sales'),
      feeds.getFeedEntry('itchio:devlogs'),
      feeds.getFeedEntry('itchio:blog'),
    ]
  },

  // itch.io serves its sitemap at /sitemap.xml, so a single-segment feed is a section feed only
  // for a section the platform lists.
  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return
    }

    if (isHostOf(parsedUrl, mainHosts) && combinedListingFeedRegex.test(parsedUrl.pathname)) {
      return composeHint('itchio:games')
    }

    const hint = feeds.getFeedHint(url)
    const section = parsedUrl.pathname.match(sectionFeedRegex)?.[1]

    if (hint?.key === 'itchio:section' && !isAnyOf(section, sections)) {
      return
    }

    return hint
  },
}
