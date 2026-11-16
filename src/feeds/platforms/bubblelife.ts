import { getQueryParam, includesAnyOf, isSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type BubblelifeUrl =
  | { kind: 'community'; community: string }
  | { kind: 'library'; community: string; libraryId: string }
export type BubblelifePage = {
  kind: 'community' | 'library'
  feedId: string
  alertId?: string
}

const domains = ['bubblelife.com']

const communityRegex =
  /^\/community\/(?<community>[a-z0-9_]+)(?:\/library\/(?<libraryId>\d+))?(?:\/|$)/i
const feedHrefRegex = /^\/rss\?c=(\d+)$/i
const alertHrefRegex = /^\/rss\?c=(\d+),nofriends$/i
// A news alert feed suffixes its id with `,nofriends`.
const feedIdRegex = /^\d+(?:,nofriends)?$/i

// A community's posts feed is its first library's feed, so a feed URL reads back as a library. A
// topic feed narrows a library to one topic. The news alert row goes before the library rows,
// whose `{id}` would read its suffixed id.
const feeds = definePlatformFeeds(
  [
    { key: 'bubblelife:topic', template: '{scheme}://{host}/rss?c={id}&t={topic}' },
    { key: 'bubblelife:news-alerts', template: '{scheme}://{host}/rss?c={id},nofriends' },
    { key: 'bubblelife:library', template: '{scheme}://{host}/rss?c={id}' },
    { key: 'bubblelife:posts', template: '{scheme}://{host}/rss?c={id}' },
  ],
  { domains },
)

export const parseBubblelifeUrl = (url: string): BubblelifeUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { community, libraryId } = new URL(url).pathname.match(communityRegex)?.groups ?? {}

  if (!community) {
    return
  }

  if (libraryId) {
    return { kind: 'library', community, libraryId }
  }

  return { kind: 'community', community }
}

export const getBubblelifePage = (
  url: string,
  content: string | undefined,
): BubblelifePage | undefined => {
  const parsed = parseBubblelifeUrl(url)

  if (!parsed || !content) {
    return
  }

  const communityPath = `/community/${parsed.community}/library/`

  // The rssinfo page links the feeds themselves, its "All Posts" feed first and its "Flash News
  // Alerts" feed beside it. Topic feeds carry a `&t=` suffix and are left out.
  const feedLink = findElement(content, (element) => {
    return element.name === 'a' && feedHrefRegex.test(element.attribs.href ?? '')
  })
  const feedId = feedLink?.attribs.href?.match(feedHrefRegex)?.[1]

  if (feedId) {
    const alertLink = findElement(content, (element) => {
      return element.name === 'a' && alertHrefRegex.test(element.attribs.href ?? '')
    })
    const alertId = alertLink?.attribs.href?.match(alertHrefRegex)?.[1]

    return { kind: parsed.kind, feedId, alertId }
  }

  // A made-up library id answers 200 with the community's About page, whose footer RSS link
  // then names the community instead, so the id counts only when the footer names it.
  if (
    parsed.kind === 'library' &&
    includesAnyOf(content, `${communityPath}${parsed.libraryId}/type/rssinfo`)
  ) {
    return { kind: 'library', feedId: parsed.libraryId }
  }

  // The page's alternate link has no href, so the id is read from the community's first library
  // link, which is its "All Posts" feed. A city news community links no library of its own.
  const libraryIdRegex = new RegExp(`href="${communityPath}(\\d+)["/]`, 'i')
  const libraryId = content.match(libraryIdRegex)?.[1]

  if (!libraryId) {
    return
  }

  return { kind: 'community', feedId: libraryId }
}

export const bubblelifeHandler: PlatformHandler = {
  match: (url) => {
    return parseBubblelifeUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getBubblelifePage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = { id: page.feedId }
    const alertParams = { id: page.alertId }

    if (page.kind === 'library' && page.alertId) {
      return [
        pageFeeds.getFeedEntry('bubblelife:library', params),
        pageFeeds.getFeedEntry('bubblelife:news-alerts', alertParams),
      ]
    }

    if (page.kind === 'library') {
      return [pageFeeds.getFeedEntry('bubblelife:library', params)]
    }

    if (page.alertId) {
      return [
        pageFeeds.getFeedEntry('bubblelife:posts', params),
        pageFeeds.getFeedEntry('bubblelife:news-alerts', alertParams),
      ]
    }

    return [pageFeeds.getFeedEntry('bubblelife:posts', params)]
  },

  getFeedHint: (url) => {
    const parsedUrl = parseUrl(url)

    if (!feedIdRegex.test(getQueryParam(parsedUrl, 'c') ?? '')) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
