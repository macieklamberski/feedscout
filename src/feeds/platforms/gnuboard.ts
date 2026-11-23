import { gnuboard } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Gnuboard names each cookie with the md5 of its name, and this is `ck_visit_ip`.
const visitCookieName = '2a0d2363701f23f8a75028924a3af643'

const boardVariableRegex = /var g[45]_bo_table\s*=\s*"(\w+)"/
const installUrlRegex = /var g5_url\s*=\s*"([^"]+)"/

const feeds = withHintLabels(gnuboard.feeds)

export type GnuboardPage = { kind: 'board'; root: string; board: string }

const getRootPath = (root: string): string => {
  return root.slice(new URL(root).origin.length)
}

// The visit counter sets the cookie on the first request of a visitor, whatever the skin.
export const isGnuboardHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes(visitCookieName)
}

// Board pages and short URLs print the board in the page head only when it exists. Other pages
// echo the requested name, and Gnuboard 5 answers a made-up board's feed with HTML. Gnuboard 5
// short URLs such as `/{board}/{post}` name the board nowhere else.
export const getGnuboardPage = (
  url: string,
  content: string | undefined,
): GnuboardPage | undefined => {
  const board = content?.match(boardVariableRegex)?.[1]
  const page = gnuboard.pages.read(url, { isAnyHost: true })

  if (!page || !board) {
    return
  }

  if (page.key !== 'page') {
    if (page.params.board !== board) {
      return
    }

    return { kind: 'board', root: getRootPath(page.params.root), board }
  }

  const installUrl = content?.match(installUrlRegex)?.[1]

  if (!installUrl) {
    return
  }

  const installed = gnuboard.pages.read(url, { root: parseUrl(installUrl, url)?.href ?? '' })

  if (!installed) {
    return
  }

  return { kind: 'board', root: getRootPath(installed.params.root), board }
}

export const gnuboardHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isGnuboardHeaders })) {
      return false
    }

    return getGnuboardPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getGnuboardPage(url, content)

    if (!page) {
      return []
    }

    const root = `${new URL(url).origin}${page.root}`

    return [feeds.getFeedEntry('board', { root, board: page.board })]
  },
}
