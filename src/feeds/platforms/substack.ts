import { substack } from 'feedintel'
import { escapeRegex, isPresent } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: newsletter.

export type SubstackUrl = { kind: 'newsletter' } | { kind: 'profile'; username: string }
export type SubstackPage = { kind: 'newsletter' | 'profile'; origin: string }

// A section page embeds the record of every section of the publication, each naming its id before
// its slug with no brace between them.
const braceRegex = /[{}]/
const sectionIdRegex = /"id":(?<section>\d+),/
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

const feeds = withHintLabels(substack.feeds)

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

const getSectionId = (content: string | undefined, url: string): string | undefined => {
  const page = substack.pages.read(url)
  const slug = page?.key === 'section' ? page.params.slug : undefined

  if (!content || !slug) {
    return
  }

  const slugRegex = new RegExp(`"slug":"${escapeRegex(slug)}"`, 'i')

  // Each run between two braces is read once, so a page of ids with no slug stays linear.
  for (const run of content.split(braceRegex)) {
    const slugIndex = run.search(slugRegex)

    if (slugIndex === -1) {
      continue
    }

    const section = run.slice(0, slugIndex).match(sectionIdRegex)?.groups?.section

    if (section) {
      return section
    }
  }
}

const getPublicationOrigin = (
  content: string | undefined,
  username: string,
): string | undefined => {
  const { subdomain, customDomain } = content?.match(publicationRegex)?.groups ?? {}
  const customOrigin = customDomain ? getHostOrigin(customDomain) : undefined

  if (customOrigin) {
    return customOrigin
  }

  const params = { scheme: 'https', username: subdomain ?? username }
  const feedUrl = feeds.getFeedUrl('newsletter', params)

  if (!feedUrl) {
    return
  }

  return new URL(feedUrl).origin
}

export const parseSubstackUrl = (url: string): SubstackUrl | undefined => {
  const page = substack.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'profile') {
    return { kind: 'profile', username: page.params.username }
  }

  return { kind: 'newsletter' }
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

  const origin = getPublicationOrigin(content, parsed.username)

  if (!origin) {
    return
  }

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

    const section = page.kind === 'newsletter' ? getSectionId(content, url) : undefined
    const record = content?.match(pubRecordRegex)?.groups?.record
    const publication = record?.match(pubIdRegex)?.groups?.publication

    if (!record || !publication) {
      return [
        pageFeeds.getFeedEntry('newsletter'),
        pageFeeds.getFeedEntry('newsletter-section', { section }),
      ].filter(isPresent)
    }

    const hasPodcast = podcastEnabledRegex.test(record) && !podcastFeedUrlRegex.test(record)
    // A podcast feed answers on the publication host too, but names the API host as its self link.
    const params = { publication }

    if (hasPodcast) {
      return [
        pageFeeds.getFeedEntry('newsletter'),
        pageFeeds.getFeedEntry('newsletter-section', { section }),
        pageFeeds.getFeedEntry('podcast', params),
        ...getPodcastSections(content, publication).map((section) => {
          return pageFeeds.getFeedEntry('podcast-section', { ...params, section })
        }),
      ].filter(isPresent)
    }

    return [
      pageFeeds.getFeedEntry('newsletter'),
      pageFeeds.getFeedEntry('newsletter-section', { section }),
      ...getPodcastSections(content, publication).map((section) => {
        return pageFeeds.getFeedEntry('podcast-section', { ...params, section })
      }),
    ].filter(isPresent)
  },

  getFeedHint: feeds.getFeedHint,
}
