import { getQueryParam, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  digitsRegex,
  findElement,
  getCookieNames,
  getScriptDirectory,
  hasElementWithId,
  hasMarker,
} from '../../common/utils.js'
import { isForumotionHtml } from './forumotion.js'

// Discoverability: Discoverable without handler.

export type PhpbbPage = { boardUrl: string; forumId?: string; topicId?: string }

// A board is known only by its markup and cookies, so its feeds are built under the board root and
// claimed on no host. Each board-wide feed is an administrator toggle, so a board serves any subset
// of them.
const feeds = definePlatformFeeds('phpbb', [
  { key: 'topic', main: '{root}/feed.php?t={topicId}' },
  { key: 'forum', main: '{root}/feed.php?f={forumId}' },
  { key: 'site', main: '{root}/feed.php' },
  { key: 'news', main: '{root}/feed.php?mode=news' },
  { key: 'new-topics', main: '{root}/feed.php?mode=topics' },
  { key: 'active-topics', main: '{root}/feed.php?mode=topics_active' },
  { key: 'forums', main: '{root}/feed.php?mode=forums' },
])

// Forumotion's phpBB3 template prints the same body id and serves none of phpBB's feeds.
export const isPhpbbHtml = (content: string): boolean => {
  return hasElementWithId(content, 'phpbb') && !isForumotionHtml(content)
}

// phpBB sets `{name}_u`, `{name}_k` and `{name}_sid`, where the board picks the name.
export const isPhpbbHeaders = (headers: Headers): boolean => {
  const names = getCookieNames(headers)

  return names.some((name) => {
    if (!name.endsWith('_sid')) {
      return false
    }

    const prefix = name.slice(0, -'_sid'.length)

    return names.includes(`${prefix}_u`) && names.includes(`${prefix}_k`)
  })
}

const getNumericParam = (
  searchParams: URLSearchParams | undefined,
  name: string,
): string | undefined => {
  const value = getQueryParam(searchParams, name)

  if (value && digitsRegex.test(value)) {
    return value
  }
}

const getPhpbbPage = (url: string, content: string | undefined): PhpbbPage | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { origin, pathname, searchParams } = parsedUrl
  // A post link, `viewtopic.php?p={id}`, names no topic, and the page's canonical link does.
  const canonicalLink = findElement(content, (element) => {
    return element.name === 'link' && element.attribs.rel === 'canonical'
  })
  const canonicalUrl = parseUrl(canonicalLink?.attribs.href, url)

  return {
    // A board is routinely mounted under a sub-path such as `/community`.
    boardUrl: `${origin}${getScriptDirectory(pathname)}`,
    forumId: getNumericParam(searchParams, 'f'),
    topicId: getNumericParam(searchParams, 't') ?? getNumericParam(canonicalUrl?.searchParams, 't'),
  }
}

export const phpbbHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isPhpbbHtml, headers: isPhpbbHeaders })
  },

  resolve: (url, content) => {
    const page = getPhpbbPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const { boardUrl: root, forumId, topicId } = page

    if (topicId && forumId) {
      return [
        pageFeeds.getFeedEntry('topic', { root, topicId }),
        pageFeeds.getFeedEntry('forum', { root, forumId }),
        pageFeeds.getFeedEntry('site', { root }),
        pageFeeds.getFeedEntry('news', { root }),
        pageFeeds.getFeedEntry('new-topics', { root }),
        pageFeeds.getFeedEntry('active-topics', { root }),
        pageFeeds.getFeedEntry('forums', { root }),
      ]
    }

    if (topicId) {
      return [
        pageFeeds.getFeedEntry('topic', { root, topicId }),
        pageFeeds.getFeedEntry('site', { root }),
        pageFeeds.getFeedEntry('news', { root }),
        pageFeeds.getFeedEntry('new-topics', { root }),
        pageFeeds.getFeedEntry('active-topics', { root }),
        pageFeeds.getFeedEntry('forums', { root }),
      ]
    }

    if (forumId) {
      return [
        pageFeeds.getFeedEntry('forum', { root, forumId }),
        pageFeeds.getFeedEntry('site', { root }),
        pageFeeds.getFeedEntry('news', { root }),
        pageFeeds.getFeedEntry('new-topics', { root }),
        pageFeeds.getFeedEntry('active-topics', { root }),
        pageFeeds.getFeedEntry('forums', { root }),
      ]
    }

    return [
      pageFeeds.getFeedEntry('site', { root }),
      pageFeeds.getFeedEntry('news', { root }),
      pageFeeds.getFeedEntry('new-topics', { root }),
      pageFeeds.getFeedEntry('active-topics', { root }),
      pageFeeds.getFeedEntry('forums', { root }),
    ]
  },
}
