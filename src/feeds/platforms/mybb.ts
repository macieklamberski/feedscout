import { mybb } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  findElement,
  getCookieNames,
  getSiteParams,
  getSiteUrl,
  hasClass,
  hasMarker,
} from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type MybbPage = { boardUrl: string; forumId?: string }

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

// The core breadcrumb ends with the thread's forum, and its page list sits in a nested div.
const getBreadcrumbForumId = (url: string, content: string | undefined): string | undefined => {
  const navigation = findElement(content, (element) => {
    return element.name === 'div' && hasClass(element, 'navigation')
  })
  let forumId: string | undefined

  for (const child of navigation?.children ?? []) {
    if (!('attribs' in child) || child.name !== 'a') {
      continue
    }

    const href = parseUrl(child.attribs.href, url)?.href ?? ''
    const link = mybb.pages.read(href, { isAnyHost: true })

    if (link?.key === 'forum') {
      forumId = link.params.forumId
    }
  }

  return forumId
}

// MyBB 1.8 prints the board URL as `rootpath`. On an older board the page's directory is the root.
const getMybbPage = (url: string, content: string | undefined): MybbPage | undefined => {
  const page = mybb.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const boardUrl = content?.match(rootPathRegex)?.[1] ?? getSiteUrl(page.params)

  if (page.key === 'forum') {
    return { boardUrl, forumId: page.params.forumId }
  }

  if (page.key === 'thread') {
    return { boardUrl, forumId: getBreadcrumbForumId(url, content) }
  }

  return { boardUrl }
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

    const site = getSiteParams(page.boardUrl)

    if (page.forumId) {
      return [
        pageFeeds.getFeedEntry('forum', { ...site, forumId: page.forumId }, 'rss'),
        pageFeeds.getFeedEntry('forum', { ...site, forumId: page.forumId }, 'atom'),
        pageFeeds.getFeedEntry('threads', site, 'rss'),
        pageFeeds.getFeedEntry('threads', site, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('threads', site, 'rss'),
      pageFeeds.getFeedEntry('threads', site, 'atom'),
    ]
  },
}
