import { isPlainObject, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getJsonLd, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (guess, html), partly covers forum, topic.

export type ForumotionPage =
  | { kind: 'forum'; forumId: string }
  | { kind: 'topic'; forumId: string }
  | { kind: 'home' }

const forumPathRegex = /^\/f(\d+)(?:p\d+)?-/i
const topicPathRegex = /^\/t\d+(?:p\d+)?-/i

// One pattern per brand, each over its generic and country domains.
// length: keeps any suffix but a two-letter country code out
const domains = [
  '1fr1.net',
  'actieforum.com',
  /^forumactif\.(?:biz|com|info|org|[a-z]{2})$/,
  'forumeiros.com',
  /^forumgratuit\.(?:org|[a-z]{2})$/,
  /^forumotion\.(?:asia|com|net|org|co\.[a-z]{2}|[a-z]{2})$/,
  'forumpro.fr',
]

// A forum on its own domain is known only by its marker, so its feeds are built here but not
// claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'forumotion:forum', template: '{scheme}://{host}/feed/?f={forumId}', format: 'rss' },
    {
      key: 'forumotion:forum',
      template: '{scheme}://{host}/feed/?f={forumId}&type=atom',
      format: 'atom',
    },
    { key: 'forumotion:latest-topics', template: '{scheme}://{host}/feed/', format: 'rss' },
    {
      key: 'forumotion:latest-topics',
      template: '{scheme}://{host}/feed/?type=atom',
      format: 'atom',
    },
    // Forumotion serves the same feeds at `/rss`, which only claims.
    { key: 'forumotion:forum', template: '{scheme}://{host}/rss?f={forumId}', format: 'rss' },
    {
      key: 'forumotion:forum',
      template: '{scheme}://{host}/rss?f={forumId}&type=atom',
      format: 'atom',
    },
    { key: 'forumotion:latest-topics', template: '{scheme}://{host}/rss', format: 'rss' },
    {
      key: 'forumotion:latest-topics',
      template: '{scheme}://{host}/rss?type=atom',
      format: 'atom',
    },
  ],
  { domains },
)

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
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isForumotionHtml })
  },

  resolve: (url, content) => {
    const page = getForumotionPage(url, content)
    const pageFeeds = feeds.forUrl(url)
    const uris: Array<DiscoverUriEntry> = []

    if (!pageFeeds) {
      return uris
    }

    // Forumotion serves no topic feed and ignores `?t=`, so a topic page gets its forum's feed.
    if (page.kind === 'forum' || page.kind === 'topic') {
      const params = { forumId: page.forumId }

      uris.push(
        pageFeeds.getFeedEntry('forumotion:forum', params, 'rss'),
        pageFeeds.getFeedEntry('forumotion:forum', params, 'atom'),
      )
    }

    uris.push(
      pageFeeds.getFeedEntry('forumotion:latest-topics', {}, 'rss'),
      pageFeeds.getFeedEntry('forumotion:latest-topics', {}, 'atom'),
    )

    return uris
  },

  // The table reads any host under the domains, so only a forum's own subdomain is claimed, not
  // the apex, www or a nested host.
  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
