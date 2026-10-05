import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Gnuboard names each cookie with the md5 of its name, and this is `ck_visit_ip`.
const visitCookieName = '2a0d2363701f23f8a75028924a3af643'

const boardScriptRegex = /^(.*)\/bbs\/board\.php$/i
const boardVariableRegex = /var g[45]_bo_table\s*=\s*"(\w+)"/
const installUrlRegex = /var g5_url\s*=\s*"([^"]+)"/
const trailingSlashRegex = /\/$/

export type GnuboardPage = { kind: 'board'; root: string; board: string }

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
  const parsedUrl = parseUrl(url)
  const board = content?.match(boardVariableRegex)?.[1]

  if (!parsedUrl || !board) {
    return
  }

  const scriptRoot = parsedUrl.pathname.match(boardScriptRegex)?.[1]

  if (scriptRoot !== undefined) {
    if (parsedUrl.searchParams.get('bo_table') !== board) {
      return
    }

    return { kind: 'board', root: scriptRoot, board }
  }

  const installUrl = content?.match(installUrlRegex)?.[1]

  if (!installUrl) {
    return
  }

  const installRoot = parseUrl(installUrl, url)?.pathname.replace(trailingSlashRegex, '')

  if (installRoot === undefined) {
    return
  }

  return { kind: 'board', root: installRoot, board }
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

    const { origin } = new URL(url)
    const query = new URLSearchParams({ bo_table: page.board })

    return [
      {
        uri: `${origin}${page.root}/bbs/rss.php?${query}`,
        hint: composeHint('gnuboard:board'),
      },
    ]
  },
}
