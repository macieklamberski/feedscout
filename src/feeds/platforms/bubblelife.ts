import { bubblelife } from 'feedintel'
import { includesAnyOf, isSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: library, news-alerts, posts.

export type BubblelifeUrl =
  | { kind: 'community'; community: string }
  | { kind: 'library'; community: string; libraryId: string }
export type BubblelifePage = {
  kind: 'community' | 'library'
  feedId: string
  alertId?: string
}

const domains = bubblelife.hosts.tenants

const communityRegex =
  /^\/community\/(?<community>[a-z0-9_]+)(?:\/library\/(?<libraryId>\d+))?(?:\/|$)/i
const feedHrefRegex = /^\/rss\?c=(\d+)$/i
const alertHrefRegex = /^\/rss\?c=(\d+),nofriends$/i

const feeds = withHintLabels(bubblelife.feeds)

export const parseBubblelifeUrl = (url: string): BubblelifeUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const { community, libraryId } = parseUrl(url)?.pathname.match(communityRegex)?.groups ?? {}

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
        pageFeeds.getFeedEntry('library', params),
        pageFeeds.getFeedEntry('news-alerts', alertParams),
      ]
    }

    if (page.kind === 'library') {
      return [pageFeeds.getFeedEntry('library', params)]
    }

    if (page.alertId) {
      return [
        pageFeeds.getFeedEntry('posts', params),
        pageFeeds.getFeedEntry('news-alerts', alertParams),
      ]
    }

    return [pageFeeds.getFeedEntry('posts', params)]
  },

  getFeedHint: feeds.getFeedHint,
}
