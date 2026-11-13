import { getAnyOf, isAnyOf, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, devlog, devlogs, game (html), partly covers home.
// Handler needed for: browseByEngine, browseByGenre, browseByPlatform, browseBySort, browseByTag, browseByUser, browseCombined, games, section, user.

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
const combinedListingRegex = /^\/games\/([^/]+(?:\/[^/]+)+)/i
// A listing of one sort and one tag or creator, such as newest/tag-horror.
const sortedListingRegex = /^(?<sort>[^/]+)\/(?<filter>tag|by)-(?<value>[^/]+)$/i
// The first filter of a feed under the sorted tag and creator rows.
const listingSortRegex = /^\/games\/([^/]+)\/[^/]/i
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

// A URL takes the key of the first row it matches, so the /games/{sort}.xml, /games/{filters*}.xml
// and /{section}.xml rows come after the rows whose feeds they also match. A sort keeps the key of
// the listing it sorts, so a sorted tag or creator listing is that tag's or creator's feed, and a
// listing with any other filters is a games listing.
const feeds = definePlatformFeeds(
  [
    { key: 'itchio:devlog', template: '{scheme}://{host}/{game}/devlog.rss' },
    { key: 'itchio:creator', template: 'https://itch.io/games/{sort}/by-{creator}.xml' },
    { key: 'itchio:creator', template: 'https://itch.io/games/by-{creator}.xml' },
    { key: 'itchio:tag', template: 'https://itch.io/games/{sort}/tag-{tag}.xml' },
    { key: 'itchio:tag', template: 'https://itch.io/games/tag-{tag}.xml' },
    { key: 'itchio:platform', template: 'https://itch.io/games/platform-{platform}.xml' },
    { key: 'itchio:genre', template: 'https://itch.io/games/genre-{genre}.xml' },
    { key: 'itchio:made-with', template: 'https://itch.io/games/made-with-{engine}.xml' },
    { key: 'itchio:games', template: 'https://itch.io/games/{sort}.xml' },
    { key: 'itchio:games', template: 'https://itch.io/games/{filters*}.xml' },
    { key: 'itchio:games', template: 'https://itch.io/games.xml' },
    { key: 'itchio:devlogs', template: 'https://itch.io/devlogs.xml' },
    { key: 'itchio:blog', template: 'https://itch.io/blog.rss' },
    { key: 'itchio:updates', template: 'https://itch.io/updates.rss' },
    { key: 'itchio:digest', template: 'https://itch.io/digest.rss' },
    { key: 'itchio:featured', template: 'https://itch.io/feed/featured.xml' },
    { key: 'itchio:new', template: 'https://itch.io/feed/new.xml' },
    { key: 'itchio:sales', template: 'https://itch.io/feed/sales.xml' },
    { key: 'itchio:section', template: 'https://itch.io/{section}.xml' },
  ],
  { domains },
)

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

    // The curated feeds, the devlogs, the blog, the platform updates and the digest need no value
    // from the page, so every page builds them after its own feeds.
    if (parsed.kind === 'game') {
      const pageFeeds = feeds.forUrl(url)

      if (!pageFeeds) {
        return []
      }

      return [
        pageFeeds.getFeedEntry('itchio:devlog', { game: parsed.game }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'creator') {
      return [
        feeds.getFeedEntry('itchio:creator', { creator: parsed.creator, sort: parsed.sort }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('itchio:tag', { tag: parsed.tag, sort: parsed.sort }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'platform') {
      return [
        feeds.getFeedEntry('itchio:platform', { platform: parsed.platform }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'genre') {
      return [
        feeds.getFeedEntry('itchio:genre', { genre: parsed.genre }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'madeWith') {
      return [
        feeds.getFeedEntry('itchio:made-with', { engine: parsed.engine }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'listing') {
      return [
        feeds.getFeedEntry('itchio:games', { filters: parsed.filters }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'games' && parsed.sort) {
      return [
        feeds.getFeedEntry('itchio:games', { sort: parsed.sort }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'games') {
      return [
        feeds.getFeedEntry('itchio:games'),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'devlogs') {
      return [
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'blog') {
      return [
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    if (parsed.kind === 'section') {
      return [
        feeds.getFeedEntry('itchio:section', { section: parsed.section }),
        feeds.getFeedEntry('itchio:featured'),
        feeds.getFeedEntry('itchio:new'),
        feeds.getFeedEntry('itchio:sales'),
        feeds.getFeedEntry('itchio:devlogs'),
        feeds.getFeedEntry('itchio:blog'),
        feeds.getFeedEntry('itchio:updates'),
        feeds.getFeedEntry('itchio:digest'),
      ]
    }

    return [
      feeds.getFeedEntry('itchio:featured'),
      feeds.getFeedEntry('itchio:new'),
      feeds.getFeedEntry('itchio:sales'),
      feeds.getFeedEntry('itchio:devlogs'),
      feeds.getFeedEntry('itchio:blog'),
      feeds.getFeedEntry('itchio:updates'),
      feeds.getFeedEntry('itchio:digest'),
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
