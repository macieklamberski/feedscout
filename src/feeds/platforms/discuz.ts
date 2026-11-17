import { getQueryParam, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  digitsRegex,
  getCookieNames,
  getMetaContent,
  getScriptDirectory,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: board, site.

export type DiscuzUrl = { kind: 'board'; boardId: string } | { kind: 'site' }

export type DiscuzPage = DiscuzUrl & { isLegacy: boolean }

const archiverBoardRegex = /\/archiver\/\??fid-(\d+)\.html/i
const archiverPathRegex = /\/archiver\/.*$/i
const boardPathRegex = /\/forum-(\d+)-/i
const legacyGeneratorRegex = /^Discuz! (?:Archiver )?\d/i

// A board runs on its own domain and is known only by its marker, so its feeds are built here but
// not claimed. Discuz! 7 and older serve the same feeds from `rss.php`.
const feeds = definePlatformFeeds('discuz', [
  { key: 'board', main: '{root}/forum.php?mod=rss&fid={boardId}&auth=0' },
  { key: 'site', main: '{root}/forum.php?mod=rss' },
])

const legacyFeeds = definePlatformFeeds('discuz', [
  { key: 'board', main: '{root}/rss.php?fid={boardId}&auth=0' },
  { key: 'site', main: '{root}/rss.php?auth=0' },
])

export const isDiscuzHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Discuz!')
}

// Discuz! prefixes its cookies per install, as in `K1VB_e732_saltkey`.
export const isDiscuzHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => name.endsWith('_saltkey'))
}

// Discuz! 7 and older print a version without the X, as in `Discuz! 7.2` or `Discuz! 5.5.0 with
// Templates 5.5.0`, or `Discuz! Archiver 7.2` on the archiver, and serve their feeds from `rss.php`
// in the install directory. On them `forum.php?mod=rss` answers 404.
const isLegacyDiscuz = (content: string | undefined): boolean => {
  if (!content) {
    return false
  }

  return legacyGeneratorRegex.test(getMetaContent(content, 'generator') ?? '')
}

export const parseDiscuzUrl = (url: string): DiscuzUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname, search, searchParams } = parsedUrl
  const queryId = getQueryParam(searchParams, 'fid')

  if (queryId && digitsRegex.test(queryId)) {
    return { kind: 'board', boardId: queryId }
  }

  // The archiver carries the board in the query key, as in `archiver/?fid-22.html`, or in the path
  // with rewrites on, as in `archiver/fid-22.html`.
  const boardId =
    boardPathRegex.exec(pathname)?.[1] ?? archiverBoardRegex.exec(`${pathname}${search}`)?.[1]

  if (boardId) {
    return { kind: 'board', boardId }
  }

  return { kind: 'site' }
}

export const getDiscuzPage = (url: string, content: string | undefined): DiscuzPage | undefined => {
  const parsed = parseDiscuzUrl(url)

  if (!parsed) {
    return
  }

  return { ...parsed, isLegacy: isLegacyDiscuz(content) }
}

export const discuzHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isDiscuzHtml, headers: isDiscuzHeaders })) {
      return false
    }

    return parseDiscuzUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getDiscuzPage(url, content)

    if (!page) {
      return []
    }

    const { origin, pathname } = new URL(url)

    // Discuz! pages sit in the install directory, such as `/forum/`, beside `forum.php` or
    // `rss.php`, except the archiver, served from `archiver/` inside it. The table drops one
    // trailing slash from a root, so a directory with a doubled slash keeps one.
    const pagePath = pathname.replace(archiverPathRegex, '/')
    const root = `${origin}${getScriptDirectory(pagePath)}/`

    if (page.isLegacy) {
      if (page.kind === 'board') {
        return [
          legacyFeeds.getFeedEntry('board', { root, boardId: page.boardId }),
          legacyFeeds.getFeedEntry('site', { root }),
        ]
      }

      return [legacyFeeds.getFeedEntry('site', { root })]
    }

    if (page.kind === 'board') {
      return [
        feeds.getFeedEntry('board', { root, boardId: page.boardId }),
        feeds.getFeedEntry('site', { root }),
      ]
    }

    return [feeds.getFeedEntry('site', { root })]
  },
}
