import { forumotion } from 'feedintel'
import { isHostOrSubdomainOf, isPlainObject, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJsonLd, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: latest-topics.
// Handler needed for: forum.

export type ForumotionPage =
  | { kind: 'forum'; forumId: string }
  | { kind: 'topic'; forumId: string }
  | { kind: 'home' }

const forumPathRegex = /^\/f(\d+)(?:p\d+)?-/i
const topicPathRegex = /^\/t\d+(?:p\d+)?-/i

const domains = forumotion.hosts.tenants

const feeds = withHintLabels(forumotion.feeds)

// Core prints the `_userdata` script in every page head, on every template and domain.
export const isForumotionHtml = (content: string): boolean => {
  return content.includes('_userdata["session_logged_in"]')
}

const getBreadcrumbPaths = (url: string, content: string): Array<string> => {
  const paths: Array<string> = []

  for (const data of getJsonLd(content)) {
    if (!isPlainObject(data) || data['@type'] !== 'BreadcrumbList') {
      continue
    }

    if (!Array.isArray(data.itemListElement)) {
      continue
    }

    for (const element of data.itemListElement) {
      const pathname = parseUrl(element?.item?.['@id'], url)?.pathname

      if (pathname) {
        paths.push(pathname)
      }
    }
  }

  return paths
}

// Forumotion answers a forum id that does not exist with the site-wide feed, and its page with
// a canonical link naming that id. Only the breadcrumb leaves the made-up forum out.
export const getForumotionPage = (url: string, content: string | undefined): ForumotionPage => {
  if (!content) {
    return { kind: 'home' }
  }

  const paths = getBreadcrumbPaths(url, content)
  const lastPath = paths.at(-1) ?? ''
  const forumId = lastPath.match(forumPathRegex)?.[1]

  if (forumId) {
    return { kind: 'forum', forumId }
  }

  const topicForumId = paths.at(-2)?.match(forumPathRegex)?.[1]

  if (topicPathRegex.test(lastPath) && topicForumId) {
    return { kind: 'topic', forumId: topicForumId }
  }

  return { kind: 'home' }
}

export const forumotionHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOrSubdomainOf(url, domains)) {
      return getTenantSubdomain(url, domains) !== undefined
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
