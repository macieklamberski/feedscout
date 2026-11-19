import { itchio } from 'feedintel'
import { getAnyOf, isAnyOf, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: devlog.
// Handler needed for: creator, devlogs, featured, games, genre, made-with, new, platform, sales, section, tag.

export type ItchioUrl =
  | { kind: 'game'; creator: string; game: string }
  | { kind: 'creator'; creator: string; sort?: string }
  | { kind: 'tag'; tag: string; sort?: string }
  | { kind: 'platform'; platform: string }
  | { kind: 'genre'; genre: string }
  | { kind: 'madeWith'; engine: string }
  | { kind: 'games'; sort?: string }
  | { kind: 'listing'; filters: string }
  | { kind: 'devlogs' }
  | { kind: 'section'; section: string }
  | { kind: 'home' }

const domains = itchio.hosts.tenants
const mainHosts = ['itch.io', 'www.itch.io']

const byUserRegex = /^\/games\/by-([^/]+)/i
const tagRegex = /^\/games\/tag-([^/]+)/i
const platformRegex = /^\/games\/platform-([^/]+)/i
const genreRegex = /^\/games\/genre-([^/]+)/i
const madeWithRegex = /^\/games\/made-with-([^/]+)/i
const sortRegex = /^\/games\/([^/]+)/i
// A listing with two or more filters, such as /games/newest/tag-horror, has its feed at its path.
const combinedListingRegex = /^\/games\/([^/]+(?:\/[^/]+)+)/i
// A listing of one sort and one tag or creator, such as newest/tag-horror.
const sortedListingRegex = /^(?<sort>[^/]+)\/(?<filter>tag|by)-(?<value>[^/]+)$/i
// The first filter of a feed under the sorted tag and creator rows.
const listingSortRegex = /^\/games\/([^/]+)\/[^/]/i
const firstSegmentRegex = /^\/([^/]+)/
const gamesRegex = /^\/games\/?$/i
const devlogsRegex = /^\/devlogs\/?$/i
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

const feeds = withHintLabels(itchio.feeds)

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

  const filters = pathname.match(combinedListingRegex)?.[1]

  if (filters) {
    const sorted = sortedListingRegex.exec(filters)?.groups
    const sort = getAnyOf(sorted?.sort, sorts)

    if (sorted && sort && isAnyOf(sorted.filter, 'tag')) {
      return { kind: 'tag', tag: sorted.value, sort }
    }

    if (sorted && sort) {
      return { kind: 'creator', creator: sorted.value, sort }
    }

    return { kind: 'listing', filters }
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

    // The curated feeds and the devlogs need no value from the page, so every page builds them
    // after its own feeds.
    if (parsed.kind === 'game') {
      const pageFeeds = feeds.forUrl(url)

      if (!pageFeeds) {
        return []
      }

      return [
        pageFeeds.getFeedEntry('devlog', { game: parsed.game }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'creator') {
      return [
        feeds.getFeedEntry('creator', { creator: parsed.creator, sort: parsed.sort }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { tag: parsed.tag, sort: parsed.sort }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'platform') {
      return [
        feeds.getFeedEntry('platform', { platform: parsed.platform }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'genre') {
      return [
        feeds.getFeedEntry('genre', { genre: parsed.genre }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'madeWith') {
      return [
        feeds.getFeedEntry('made-with', { engine: parsed.engine }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'listing') {
      return [
        feeds.getFeedEntry('games', { filters: parsed.filters }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'games' && parsed.sort) {
      return [
        feeds.getFeedEntry('games', { sort: parsed.sort }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'games') {
      return [
        feeds.getFeedEntry('games'),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    if (parsed.kind === 'devlogs') {
      return [
        feeds.getFeedEntry('devlogs'),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
      ]
    }

    if (parsed.kind === 'section') {
      return [
        feeds.getFeedEntry('section', { section: parsed.section }),
        feeds.getFeedEntry('featured'),
        feeds.getFeedEntry('new'),
        feeds.getFeedEntry('sales'),
        feeds.getFeedEntry('devlogs'),
      ]
    }

    return [
      feeds.getFeedEntry('featured'),
      feeds.getFeedEntry('new'),
      feeds.getFeedEntry('sales'),
      feeds.getFeedEntry('devlogs'),
    ]
  },

  // itch.io serves its sitemap at /sitemap.xml, so a single-segment feed is a section feed only
  // for a section the platform lists. A sorted tag or creator row takes any first filter, and one
  // that is no sort makes the feed a games listing.
  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)
    const hint = feeds.getFeedHint(url)

    if (!parsedUrl || !hint) {
      return
    }

    const section = parsedUrl.pathname.match(sectionFeedRegex)?.[1]

    if (hint.key === 'itchio:section' && !isAnyOf(section, sections)) {
      return
    }

    const sort = parsedUrl.pathname.match(listingSortRegex)?.[1]

    if (isAnyOf(hint.key, ['itchio:tag', 'itchio:creator']) && sort && !getAnyOf(sort, sorts)) {
      return composeHint('itchio:games')
    }

    return hint
  },
}
