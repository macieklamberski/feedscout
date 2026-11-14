import { isHostOf, parseUrl } from 'trousse'
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
// A publication page embeds its own record as raw JSON, with the id its podcast feeds are named by
// and the settings of each section that is a podcast. A publication or section without a podcast
// answers 404 there, so only those feeds are built. A publication that names a feed URL of its own
// redirects its publication feed there, so that feed is left out. An escaped quote is text inside a
// string, so a quoted record never matches.
const pubRecordRegex = /"pub":\{(?<record>[^{}]*)/
const pubIdRegex = /"id":(?<publication>\d+),/
const podcastEnabledRegex = /"podcast_enabled":true\b/
const podcastFeedUrlRegex = /"podcast_feed_url":"/
// A section record names its publication before its podcast settings.
const podcastSectionRegex =
  /"publication_id":(?<owner>\d+)|"podcastSettings":\{"section_id":(?<section>\d+)/g

// A custom domain is read only from a profile page, so its feed is built here but not claimed.
// The same feed answers at feed.xml and feed.rss.
const feeds = definePlatformFeeds(
  [
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed' },
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed.xml' },
    { key: 'substack:newsletter', template: '{scheme}://{host}/feed.rss' },
    // One section of the newsletter, which holds only that section's posts.
    { key: 'substack:newsletter-section', template: '{scheme}://{host}/feed?sectionId={section}' },
    // A publication's podcast, mostly linked on api.substack.com, and one section of it, under ids
    // no page URL gives. A private or Spotify feed adds a listener token.
    { key: 'substack:podcast', template: '{scheme}://{host}/feed/podcast/{publication}.rss' },
    {
      key: 'substack:podcast-section',
      template: '{scheme}://{host}/feed/podcast/{publication}/s/{section}.rss',
    },
    {
      key: 'substack:podcast',
      template: '{scheme}://{host}/feed/podcast/{publication}/private/{token}.rss',
    },
    {
      key: 'substack:podcast',
      template: '{scheme}://{host}/feed/podcast/spotify/{token}/{publication}.rss',
    },
  ],
  { domains },
)

const getPodcastSections = (content: string, publication: string): Array<string> => {
  const sections: Array<string> = []
  let owner: string | undefined

  for (const match of content.matchAll(podcastSectionRegex)) {
    const { owner: matchedOwner, section } = match.groups ?? {}

    if (matchedOwner) {
      owner = matchedOwner
      continue
    }

    if (section && owner === publication && !sections.includes(section)) {
      sections.push(section)
    }
  }

  return sections
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

    const record = content?.match(pubRecordRegex)?.groups?.record
    const publication = record?.match(pubIdRegex)?.groups?.publication

    if (!record || !publication) {
      return [pageFeeds.getFeedEntry('substack:newsletter')]
    }

    const hasPodcast = podcastEnabledRegex.test(record) && !podcastFeedUrlRegex.test(record)
    // A podcast feed answers on the publication host too, but names the API host as its self link.
    const params = { host: 'api.substack.com', publication }

    return [
      pageFeeds.getFeedEntry('substack:newsletter'),
      ...(hasPodcast ? [pageFeeds.getFeedEntry('substack:podcast', params)] : []),
      ...getPodcastSections(content, publication).map((section) => {
        return pageFeeds.getFeedEntry('substack:podcast-section', { ...params, section })
      }),
    ]
  },

  // The table reads any single-label host under substack.com, so the page parser refuses a
  // newsletter feed on the app hosts, whose /feed answers 404. Podcast feeds are served from the
  // API host.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key.startsWith('substack:newsletter') && !parseSubstackUrl(url)) {
      return
    }

    return hint
  },
}
