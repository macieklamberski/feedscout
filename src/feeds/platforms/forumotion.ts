import { isPlainObject, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getJsonLd, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (guess, html), partly covers forum, topic.

export type ForumotionPage =
  | { kind: 'forum'; forumId: string }
  | { kind: 'topic'; forumId: string }
  | { kind: 'home' }

const forumPathRegex = /^\/f(\d+)(?:p\d+)?-/i
const topicPathRegex = /^\/t\d+(?:p\d+)?-/i

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
      const pathname = parseUrl(element?.item?.['@id'] ?? '', url)?.pathname

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
    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    // Forumotion serves no topic feed and ignores `?t=`, so a topic page gets its forum's feed.
    if (page.kind === 'forum' || page.kind === 'topic') {
      uris.push(
        {
          uri: `${origin}/feed/?f=${page.forumId}`,
          hint: composeHint('forumotion:forum', 'rss'),
        },
        {
          uri: `${origin}/feed/?f=${page.forumId}&type=atom`,
          hint: composeHint('forumotion:forum', 'atom'),
        },
      )
    }

    uris.push(
      { uri: `${origin}/feed/`, hint: composeHint('forumotion:latest-topics', 'rss') },
      { uri: `${origin}/feed/?type=atom`, hint: composeHint('forumotion:latest-topics', 'atom') },
    )

    return uris
  },
}
