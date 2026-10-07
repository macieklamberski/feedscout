import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  getCookieNames,
  getMetaContent,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (html), partly covers board.

export type DiscuzUrl = { kind: 'board'; boardId: string } | { kind: 'site' }

const archiverPathRegex = /\/archiver\/.*$/i
const boardPathRegex = /\/forum-(\d+)-/i
const numericRegex = /^\d+$/
const legacyGeneratorRegex = /^Discuz! \d/i

export const isDiscuzHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Discuz!')
}

// Discuz! prefixes its cookies per install, as in `K1VB_e732_saltkey`.
export const isDiscuzHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => name.endsWith('_saltkey'))
}

// Discuz! 7 and older print a version without the X, as in `Discuz! 7.2` or `Discuz! 5.5.0 with
// Templates 5.5.0`, and serve their feeds from `rss.php` in the install directory. On them
// `forum.php?mod=rss` answers 404.
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

  const { pathname, searchParams } = parsedUrl
  const queryId = searchParams.get('fid')

  if (queryId && numericRegex.test(queryId)) {
    return { kind: 'board', boardId: queryId }
  }

  const boardId = pathname.match(boardPathRegex)?.[1]

  if (boardId) {
    return { kind: 'board', boardId }
  }

  return { kind: 'site' }
}

export const discuzHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isDiscuzHtml, headers: isDiscuzHeaders })) {
      return false
    }

    return parseDiscuzUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const parsed = parseDiscuzUrl(url)

    if (!parsed) {
      return []
    }

    if (isLegacyDiscuz(content)) {
      const uris: Array<DiscoverUriEntry> = []

      // Every page of Discuz! 7 and older sits in the install directory, beside its `rss.php`.
      if (parsed.kind === 'board') {
        uris.push({
          uri: new URL(`rss.php?fid=${parsed.boardId}&auth=0`, url).href,
          hint: composeHint('discuz:board'),
        })
      }

      uris.push({
        uri: new URL('rss.php?auth=0', url).href,
        hint: composeHint('discuz:site'),
      })

      return uris
    }

    const uris: Array<DiscoverUriEntry> = []
    const installUrl = new URL(url)

    // Discuz! X pages sit in the install directory, such as `/forum/`, beside `forum.php`, except
    // the archiver, served from `archiver/` inside it.
    installUrl.pathname = installUrl.pathname.replace(archiverPathRegex, '/')

    if (parsed.kind === 'board') {
      uris.push({
        uri: new URL(`forum.php?mod=rss&fid=${parsed.boardId}&auth=0`, installUrl).href,
        hint: composeHint('discuz:board'),
      })
    }

    uris.push({
      uri: new URL('forum.php?mod=rss', installUrl).href,
      hint: composeHint('discuz:site'),
    })

    return uris
  },
}
