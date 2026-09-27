import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers board.
// Handler needed for: home.

const boardPathRegex = /\/forum-(\d+)-/i
const numericRegex = /^\d+$/

export const isDiscuzHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Discuz!')
}

// Discuz! prefixes its cookies per install, as in `K1VB_e732_saltkey`.
export const isDiscuzHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => name.endsWith('_saltkey'))
}

const getBoardId = (url: string): string | undefined => {
  const { pathname, searchParams } = new URL(url)
  const queryId = searchParams.get('fid')

  if (queryId && numericRegex.test(queryId)) {
    return queryId
  }

  return pathname.match(boardPathRegex)?.[1]
}

export const discuzHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!URL.canParse(url)) {
      return false
    }

    if (content && isDiscuzHtml(content)) {
      return true
    }

    if (headers && isDiscuzHeaders(headers)) {
      return true
    }

    return false
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const boardId = getBoardId(url)
    const uris: Array<DiscoverUriEntry> = []

    if (boardId) {
      uris.push({
        uri: `${origin}/forum.php?mod=rss&fid=${boardId}`,
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
