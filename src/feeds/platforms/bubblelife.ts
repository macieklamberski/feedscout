import { bubblelife } from 'feedintel'
import { isSameText, parseUrl } from 'trousse'
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

const feeds = withHintLabels(bubblelife.feeds)

export const parseBubblelifeUrl = (url: string): BubblelifeUrl | undefined => {
  const page = bubblelife.pages.read(url)

  if (!page) {
    return
  }

  const { community, id } = page.params

  if (page.key === 'community') {
    return { kind: 'community', community }
  }

  return { kind: 'library', community, libraryId: id }
}

type FeedLink = ReturnType<typeof bubblelife.feeds.read>

type PageLink = ReturnType<typeof bubblelife.pages.read>

const readFeedLink = (url: string, href: string | undefined): FeedLink => {
  const linkUrl = parseUrl(href, url)

  if (!linkUrl) {
    return
  }

  return bubblelife.feeds.read(linkUrl.href)
}

const readPageLink = (url: string, href: string | undefined): PageLink => {
  const linkUrl = parseUrl(href, url)

  if (!linkUrl) {
    return
  }

  return bubblelife.pages.read(linkUrl.href)
}

const findFeedLinkId = (url: string, content: string, key: string): string | undefined => {
  const link = findElement(content, (element) => {
    return element.name === 'a' && readFeedLink(url, element.attribs.href)?.key === key
  })

  return readFeedLink(url, link?.attribs.href)?.params.id
}

export const getBubblelifePage = (
  url: string,
  content: string | undefined,
): BubblelifePage | undefined => {
  const parsed = parseBubblelifeUrl(url)

  if (!parsed || !content) {
    return
  }

  // The rssinfo page links the feeds themselves, its "All Posts" feed first and its "Flash News
  // Alerts" feed beside it. Topic feeds are left out.
  const feedId = findFeedLinkId(url, content, 'library')

  if (feedId) {
    const alertId = findFeedLinkId(url, content, 'news-alerts')

    return { kind: parsed.kind, feedId, alertId }
  }

  // A made-up library id answers 200 with the community's About page, whose footer RSS link
  // then names the community instead, so the id counts only when the footer names it.
  if (parsed.kind === 'library') {
    const { community, libraryId } = parsed
    const footerLink = findElement(content, (element) => {
      const page = readPageLink(url, element.attribs.href)

      return (
        page?.key === 'library-rssinfo' &&
        isSameText(page.params.community, community) &&
        page.params.id === libraryId
      )
    })

    if (footerLink) {
      return { kind: 'library', feedId: libraryId }
    }
  }

  // The page's alternate link has no href, so the id is read from the community's first library
  // link, which is its "All Posts" feed. A city news community links no library of its own.
  const libraryLink = findElement(content, (element) => {
    const page = readPageLink(url, element.attribs.href)

    return page?.key !== 'community' && isSameText(page?.params.community, parsed.community)
  })
  const libraryId = readPageLink(url, libraryLink?.attribs.href)?.params.id

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
