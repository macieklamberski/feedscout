import { isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain, wordOrHyphenRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (guess, html).
// Handler needed for: profile.

export type SubstackUrl = { kind: 'newsletter' } | { kind: 'profile'; username: string }
export type SubstackPage = { kind: 'newsletter' | 'profile'; origin: string }

const domains = ['substack.com']
// The app host names a publication in the path and the API host serves podcast feeds, so neither
// is a publication itself.
const appHosts = ['open.substack.com', 'api.substack.com']

const profileRegex = /^\/@(?<username>[^/]+)/
// A profile page embeds its primary publication as escaped JSON. The publication
// subdomain is not always the handle, and a custom domain replaces it.
const publicationRegex =
  /primaryPublication\\?":\{[^{}]*?\\?"subdomain\\?":\\?"(?<subdomain>[\w-]+)\\?",\\?"custom_domain\\?":(?:\\?"(?<customDomain>[^"\\]+)\\?"|null)/
// A publication page embeds its own record, with the id its podcast feeds are named by, and the
// podcast settings of each section that is a podcast. A publication or section without a podcast
// answers 404 there, so only those feeds are built.
const pubRecordRegex = /\\?"pub\\?":\{(?<record>[^{}]*)/
const pubIdRegex = /\\?"id\\?":(?<pubId>\d+),/
const podcastEnabledRegex = /\\?"podcast_enabled\\?":true\b/
const sectionPodcastRegex = /\\?"podcastSettings\\?":\{\\?"section_id\\?":(\d+)/g

// A custom domain is read only from a profile page, so its feed is built here but not claimed.
// The same feed answers at feed.xml and feed.rss. A podcast's section row comes first, so a section
// id picks it. No page links the Spotify copy of a podcast, so it is claimed but not built. The
// private feed of a paid podcast carries a subscriber token, so it is neither.
const feeds = definePlatformFeeds(
  [
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed' },
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed.xml' },
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed.rss' },
    {
      key: 'substack:podcast',
      template: 'https://api.substack.com/feed/podcast/{pubId}/s/{sectionId}.rss',
    },
    { key: 'substack:podcast', template: 'https://api.substack.com/feed/podcast/{pubId}.rss' },
    {
      key: 'substack:podcast',
      template: 'https://api.substack.com/feed/podcast/spotify/{uuid}/{pubId}.rss',
    },
  ],
  { domains },
)

const getPodcastFeeds = (content: string | undefined): Array<DiscoverUriEntry> => {
  const record = content?.match(pubRecordRegex)?.groups?.record
  const pubId = record?.match(pubIdRegex)?.groups?.pubId

  if (!content || !record || !pubId) {
    return []
  }

  const sectionIds = new Set([...content.matchAll(sectionPodcastRegex)].map(([, id]) => id))
  const podcastFeeds = [...sectionIds].map((sectionId) => {
    return feeds.getFeedEntry('substack:podcast', { pubId, sectionId })
  })

  if (podcastEnabledRegex.test(record)) {
    podcastFeeds.unshift(feeds.getFeedEntry('substack:podcast', { pubId }))
  }

  return podcastFeeds
}

const getPublicationOrigin = (content: string | undefined): string | undefined => {
  const { subdomain, customDomain } = content?.match(publicationRegex)?.groups ?? {}

  if (!subdomain) {
    return
  }

  const customOrigin = customDomain ? getHostOrigin(customDomain) : undefined

  return customOrigin ?? `https://${subdomain}.substack.com`
}

export const parseSubstackUrl = (url: string): SubstackUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (getTenantSubdomain(parsedUrl, domains) && !isHostOf(parsedUrl, appHosts)) {
    return { kind: 'newsletter' }
  }

  if (!isHostOf(parsedUrl, domains)) {
    return
  }

  const username = parsedUrl.pathname.match(profileRegex)?.groups?.username

  if (!username || !wordOrHyphenRegex.test(username)) {
    return
  }

  return { kind: 'profile', username }
}

export const getSubstackPage = (
  url: string,
  content: string | undefined,
): SubstackPage | undefined => {
  const parsed = parseSubstackUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'newsletter') {
    return { kind: 'newsletter', origin: new URL(url).origin }
  }

  const origin = getPublicationOrigin(content) ?? `https://${parsed.username}.substack.com`

  return { kind: 'profile', origin }
}

export const substackHandler: PlatformHandler = {
  match: (url) => {
    return parseSubstackUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSubstackPage(url, content)

    if (!page) {
      return []
    }

    const pageFeeds = feeds.forUrl(page.origin)

    if (!pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('substack:newsletter'), ...getPodcastFeeds(content)]
  },

  // The table reads any host under substack.com, so the page parser refuses a newsletter feed on
  // the apex and the app hosts, whose /feed answers 404, and on a nested subdomain, which fails its
  // TLS handshake.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key === 'substack:newsletter' && !parseSubstackUrl(url)) {
      return
    }

    return hint
  },
}
