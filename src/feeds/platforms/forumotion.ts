import { forumotion } from 'feedintel'
import { isPlainObject, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJsonLd, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: latest-topics.
// Handler needed for: forum.

export type ForumotionPage =
  | { kind: 'forum'; forumId: string }
  | { kind: 'topic'; forumId: string }
  | { kind: 'home' }

const feeds = withHintLabels(forumotion.feeds)

// Core prints the `_userdata` script in every page head, on every template and domain.
export const isForumotionHtml = (content: string): boolean => {
  return content.includes('_userdata["session_logged_in"]')
}

type BreadcrumbPage = NonNullable<ReturnType<typeof forumotion.pages.read>>

// A breadcrumb names each page under the site's root, on the forum's host.
const getBreadcrumbPages = (url: string, content: string): Array<BreadcrumbPage | undefined> => {
  const pages: Array<BreadcrumbPage | undefined> = []

  for (const data of getJsonLd(content)) {
    if (!isPlainObject(data) || data['@type'] !== 'BreadcrumbList') {
      continue
    }

    if (!Array.isArray(data.itemListElement)) {
      continue
    }

    for (const element of data.itemListElement) {
      const itemUrl = parseUrl(element?.item?.['@id'], url)

      if (itemUrl) {
        pages.push(forumotion.pages.read(itemUrl.href, { isAnyHost: true }))
      }
    }
  }

  return pages
}

// Forumotion answers a forum id that does not exist with the site-wide feed, and its page with
// a canonical link naming that id. Only the breadcrumb leaves the made-up forum out.
export const getForumotionPage = (url: string, content: string | undefined): ForumotionPage => {
  if (!content) {
    return { kind: 'home' }
  }

  const pages = getBreadcrumbPages(url, content)
  const lastPage = pages.at(-1)
  const parentPage = pages.at(-2)

  if (lastPage?.key === 'forum') {
    return { kind: 'forum', forumId: lastPage.params.forumId }
  }

  if (lastPage?.key === 'topic' && parentPage?.key === 'forum') {
    return { kind: 'topic', forumId: parentPage.params.forumId }
  }

  return { kind: 'home' }
}

export const forumotionHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const page = forumotion.pages.read(url)

    if (page) {
      return page.key !== 'platform'
    }

    return hasMarker(content, headers, { html: isForumotionHtml })
  },

  resolve: (url, content) => {
    const page = getForumotionPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    // Forumotion serves no topic feed and ignores `?t=`, so a topic page gets its forum's feed.
    if (page.kind === 'forum' || page.kind === 'topic') {
      const params = { forumId: page.forumId }

      return [
        pageFeeds.getFeedEntry('forum', params, 'rss'),
        pageFeeds.getFeedEntry('forum', params, 'atom'),
        pageFeeds.getFeedEntry('latest-topics', {}, 'rss'),
        pageFeeds.getFeedEntry('latest-topics', {}, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('latest-topics', {}, 'rss'),
      pageFeeds.getFeedEntry('latest-topics', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
