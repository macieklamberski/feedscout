import { getAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type XenforoUrl =
  | { kind: 'forum'; basePath: string; route: string; forumPath: string }
  | { kind: 'board' }
export type XenforoPage =
  | { kind: 'forum'; basePath: string; route: string; forumPath: string }
  | { kind: 'board'; basePath: string }

// The board feed sits under the same route prefix as the forums. A page outside a
// forum does not carry the prefix, and a board that renamed its route can answer on both.
const routePrefixes = ['forums', 'f']

// XF2 serves a forum at `/f/{slug.id}` or, on the default route, `/forums/{slug.id}`.
const forumPathRegex = /\/(?<route>f|forums)\/(?<forumPath>[^/]+\.\d+)(?:\/|$)/i
// XF2 prints the path the board is mounted under in its script config.
const basePathRegex = /\bbasePath:\s*'(?<basePath>(?:\/[^'/]+)*)\/?'/

// XF2 puts `id="XF"` on the html element and XF1 put `id="XenForo"` there.
const appRootIds = ['XF', 'XenForo']

// A board on any host is known only by its markup, which a feed URL does not carry, so the feeds
// are built under the board root and never claimed. A forum page names the route of the board
// feed, and a board page does not, so it gets both routes in turn.
const feeds = definePlatformFeeds('xenforo', [
  { key: 'forum', main: '{root}/{route}/{forumPath}/index.rss' },
  { key: 'site', main: '{root}/{route}/-/index.rss' },
  { key: 'site', main: '{root}/forums/-/index.rss', aliases: ['{root}/f/-/index.rss'] },
])

export const isXenforoHtml = (content: string): boolean => {
  const root = findElement(content, (element) => {
    return element.name === 'html' && appRootIds.includes(element.attribs.id ?? '')
  })

  return root !== undefined
}

const getConfigBasePath = (url: string, content: string | undefined): string => {
  const basePath = content?.match(basePathRegex)?.groups?.basePath

  // The path counts only when it holds the page.
  if (!basePath || !`${new URL(url).pathname}/`.startsWith(`${basePath}/`)) {
    return ''
  }

  return basePath
}

export const parseXenforoUrl = (url: string): XenforoUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const forumMatch = parsedUrl.pathname.match(forumPathRegex)
  const route = getAnyOf(forumMatch?.groups?.route, routePrefixes)
  const forumPath = forumMatch?.groups?.forumPath

  // A board is routinely mounted under a sub-path such as `/community`, in front of the route.
  if (forumMatch && route && forumPath) {
    const basePath = parsedUrl.pathname.slice(0, forumMatch.index)

    return { kind: 'forum', basePath, route, forumPath }
  }

  return { kind: 'board' }
}

export const getXenforoPage = (
  url: string,
  content: string | undefined,
): XenforoPage | undefined => {
  const parsed = parseXenforoUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'forum') {
    return parsed
  }

  return { kind: 'board', basePath: getConfigBasePath(url, content) }
}

export const xenforoHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isXenforoHtml })) {
      return false
    }

    return parseXenforoUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getXenforoPage(url, content)

    if (!page) {
      return []
    }

    const root = `${new URL(url).origin}${page.basePath}`

    if (page.kind === 'forum') {
      return [
        feeds.getFeedEntry('forum', { root, route: page.route, forumPath: page.forumPath }),
        feeds.getFeedEntry('site', { root, route: page.route }),
      ]
    }

    return [feeds.getFeedSpellings('site', { root })]
  },
}
