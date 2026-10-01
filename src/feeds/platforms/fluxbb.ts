import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getScriptDirectory, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers board, forum, topic.

export type FluxbbUrl =
  | { kind: 'forum'; boardPath: string; forumId: string }
  | { kind: 'topic'; boardPath: string; topicId: string }
  | { kind: 'board'; boardPath: string }

const forumPathRegex = /\/viewforum\.php$/i
const topicPathRegex = /\/viewtopic\.php$/i

// Each id of a pair alone is a plausible id on an unrelated page.
const templateIds = ['brdheader', 'brdmain']
// `header.php` and `footer.php` print these whatever template the board uses.
const coreIds = ['brdmenu', 'brdfooter']

export const isFluxbbHtml = (content: string): boolean => {
  return (
    templateIds.every((id) => hasElementWithId(content, id)) ||
    coreIds.every((id) => hasElementWithId(content, id))
  )
}

export const parseFluxbbUrl = (url: string): FluxbbUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname, searchParams } = parsedUrl
  const boardPath = getScriptDirectory(pathname)
  const id = searchParams.get('id')

  if (id && forumPathRegex.test(pathname)) {
    return { kind: 'forum', boardPath, forumId: id }
  }

  if (id && topicPathRegex.test(pathname)) {
    return { kind: 'topic', boardPath, topicId: id }
  }

  return { kind: 'board', boardPath }
}

export const fluxbbHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isFluxbbHtml })) {
      return false
    }

    return parseFluxbbUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFluxbbUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const feedUrl = `${origin}${parsed.boardPath}/extern.php?action=feed`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'forum') {
      uris.push({
        uri: `${feedUrl}&fid=${parsed.forumId}&type=atom`,
        hint: composeHint('fluxbb:forum'),
      })
    }

    if (parsed.kind === 'topic') {
      uris.push({
        uri: `${feedUrl}&tid=${parsed.topicId}&type=atom`,
        hint: composeHint('fluxbb:topic'),
      })
    }

    uris.push(
      { uri: `${feedUrl}&type=RSS`, hint: composeHint('fluxbb:posts', 'rss') },
      { uri: `${feedUrl}&type=atom`, hint: composeHint('fluxbb:posts', 'atom') },
    )

    return uris
  },
}
