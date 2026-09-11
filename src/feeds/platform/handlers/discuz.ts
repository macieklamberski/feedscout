import type { DiscoverUriEntry } from '../../../common/types.js'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Discuz! serves a site feed at `/forum.php?mod=rss` and a per-board feed at
// `&fid={fid}`. Board pages carry no `alternate` link, so nothing finds either.
//
// The board id is numeric and appears as `forum-{fid}-1.html` or as a `fid`
// query parameter.
//
// Many installs gate the feed behind a login and answer with an HTML notice at
// status 200, so the response body is what decides, never the status.

const boardPathRegex = /\/forum-(\d+)-/
const numericRegex = /^\d+$/

export const isDiscuzHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Discuz!')
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
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isDiscuzHtml(content ?? '')
  },

  resolve: (url) => {
    try {
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
    } catch {}

    return []
  },
}
