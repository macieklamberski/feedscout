import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers board.
// Handler needed for: home.

export type DiscuzUrl = { kind: 'board'; boardId: string } | { kind: 'site' }

const boardPathRegex = /\/forum-(\d+)-/i
const numericRegex = /^\d+$/

export const isDiscuzHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Discuz!')
}

// Discuz! prefixes its cookies per install, as in `K1VB_e732_saltkey`.
export const isDiscuzHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => name.endsWith('_saltkey'))
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

  resolve: (url) => {
    const parsed = parseDiscuzUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'board') {
      uris.push({
        uri: `${origin}/forum.php?mod=rss&fid=${parsed.boardId}`,
        hint: composeHint('discuz:board'),
      })
    }

    uris.push({
      uri: `${origin}/forum.php?mod=rss`,
      hint: composeHint('discuz:site'),
    })

    return uris
  },
}
