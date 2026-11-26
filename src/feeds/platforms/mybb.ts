import { mybb } from 'feedintel'
import { endsWithAnyOf, getQueryParam, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  digitsRegex,
  findElement,
  getCookieNames,
  hasClass,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type MybbPage = { boardUrl: string; forumId?: string }

const forumPathRegex = /\/forum-(\d+)(?:-page-\d+)?\.html$/i
const threadPathRegex = /\/(?:showthread\.php|thread-\d+(?:-[a-z]+-\d+)?\.html)$/i
const forumLinkRegex = /(?:^|\/)(?:forumdisplay\.php\?fid=|forum-)(\d+)(?:\.html)?$/i
const rootPathRegex = /var rootpath = "([^"]+)"/

const feeds = withHintLabels(mybb.feeds)

// MyBB prepends the board's cookie prefix setting to the name.
export const isMybbHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => name.endsWith('mybb[lastvisit]'))
}

// Core `headerinclude` prints these for `general.js` whatever the theme. A board can stop
// sending the cookies to guests, as community.mybb.com does.
export const isMybbHtml = (content: string): boolean => {
  return content.includes('var cookiePrefix =') && content.includes('var cookieDomain =')
}

// MyBB 1.8 prints the board URL as `rootpath`. Every MyBB script sits in the install
// root, so on an older board the page's directory is the root.
const getBoardUrl = (url: string, content: string | undefined): string | undefined => {
  const rootPath = content?.match(rootPathRegex)?.[1]

  if (rootPath) {
    return rootPath
  }

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { origin, pathname } = parsedUrl

  return `${origin}${pathname.slice(0, pathname.lastIndexOf('/'))}`
}

// The core breadcrumb ends with the thread's forum, and its page list sits in a nested div.
const getBreadcrumbForumId = (content: string | undefined): string | undefined => {
  const navigation = findElement(content, (element) => {
    return element.name === 'div' && hasClass(element, 'navigation')
  })
  let forumId: string | undefined

  for (const child of navigation?.children ?? []) {
    if (!('attribs' in child) || child.name !== 'a') {
      continue
    }

    forumId = child.attribs.href?.match(forumLinkRegex)?.[1] ?? forumId
  }

  return forumId
}

const getForumId = (url: string, content: string | undefined): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const queryId = getQueryParam(searchParams, 'fid')

  if (endsWithAnyOf(pathname, '/forumdisplay.php') && queryId && digitsRegex.test(queryId)) {
    return queryId
  }

  const pathId = pathname.match(forumPathRegex)?.[1]

  if (pathId) {
    return pathId
  }

  if (threadPathRegex.test(pathname)) {
    return getBreadcrumbForumId(content)
  }
}

const getMybbPage = (url: string, content: string | undefined): MybbPage | undefined => {
  const boardUrl = getBoardUrl(url, content)

  if (!parseUrl(url) || !boardUrl) {
    return
  }

  return { boardUrl, forumId: getForumId(url, content) }
}

export const mybbHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isMybbHtml, headers: isMybbHeaders })
  },

  resolve: (url, content) => {
    const page = getMybbPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const root = page.boardUrl

    if (page.forumId) {
      return [
        pageFeeds.getFeedEntry('forum', { root, forumId: page.forumId }, 'rss'),
        pageFeeds.getFeedEntry('forum', { root, forumId: page.forumId }, 'atom'),
        pageFeeds.getFeedEntry('threads', { root }, 'rss'),
        pageFeeds.getFeedEntry('threads', { root }, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('threads', { root }, 'rss'),
      pageFeeds.getFeedEntry('threads', { root }, 'atom'),
    ]
  },
}
