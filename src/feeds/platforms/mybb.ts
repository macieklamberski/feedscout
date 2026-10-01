import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  getCookieNames,
  hasClass,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers board, forum (html), partly covers thread.

const forumScriptRegex = /\/forumdisplay\.php$/i
const forumPathRegex = /\/forum-(\d+)(?:-page-\d+)?\.html$/i
const threadPathRegex = /\/(?:showthread\.php|thread-\d+(?:-[a-z]+-\d+)?\.html)$/i
const forumLinkRegex = /(?:^|\/)(?:forumdisplay\.php\?fid=|forum-)(\d+)(?:\.html)?$/i
const rootPathRegex = /var rootpath = "([^"]+)"/
const numericRegex = /^\d+$/

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
const getBoardUrl = (url: string, content?: string): string => {
  const rootPath = content?.match(rootPathRegex)?.[1]

  if (rootPath) {
    return rootPath
  }

  const { origin, pathname } = new URL(url)

  return `${origin}${pathname.slice(0, pathname.lastIndexOf('/'))}`
}

// The core breadcrumb ends with the thread's forum, and its page list sits in a nested div.
const getBreadcrumbForumId = (content?: string): string | undefined => {
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

const getForumId = (url: string, content?: string): string | undefined => {
  const { pathname, searchParams } = new URL(url)
  const queryId = searchParams.get('fid')

  if (forumScriptRegex.test(pathname) && queryId && numericRegex.test(queryId)) {
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

export type MybbPage = { boardUrl: string; forumId?: string }

const getMybbPage = (url: string, content: string | undefined): MybbPage | undefined => {
  if (!parseUrl(url)) {
    return
  }

  return { boardUrl: getBoardUrl(url, content), forumId: getForumId(url, content) }
}

export const mybbHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isMybbHtml, headers: isMybbHeaders })
  },

  resolve: (url, content) => {
    const page = getMybbPage(url, content)

    if (!page) {
      return []
    }

    const feedUrl = `${page.boardUrl}/syndication.php`
    const { forumId } = page
    const uris: Array<DiscoverUriEntry> = []

    if (forumId) {
      uris.push(
        { uri: `${feedUrl}?fid=${forumId}`, hint: composeHint('mybb:forum', 'rss') },
        {
          uri: `${feedUrl}?type=atom1.0&fid=${forumId}`,
          hint: composeHint('mybb:forum', 'atom'),
        },
      )
    }

    uris.push(
      { uri: feedUrl, hint: composeHint('mybb:threads', 'rss') },
      { uri: `${feedUrl}?type=atom1.0`, hint: composeHint('mybb:threads', 'atom') },
    )

    return uris
  },
}
