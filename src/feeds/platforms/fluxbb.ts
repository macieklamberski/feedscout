import { endsWithAnyOf, getQueryParam, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getScriptDirectory, hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers board, forum, topic.

export type FluxbbUrl =
  | { kind: 'forum'; boardPath: string; forumId: string }
  | { kind: 'topic'; boardPath: string; topicId: string }
  | { kind: 'board'; boardPath: string }

// Each id of a pair alone is a plausible id on an unrelated page.
const templateIds = ['brdheader', 'brdmain']
// `header.php` and `footer.php` print these whatever template the board uses.
const coreIds = ['brdmenu', 'brdfooter']

// A board is self-hosted on any domain, so the table only builds its feeds.
const feeds = definePlatformFeeds([
  { key: 'fluxbb:forum', template: '{root}/extern.php?action=feed&fid={forumId}&type=atom' },
  { key: 'fluxbb:topic', template: '{root}/extern.php?action=feed&tid={topicId}&type=atom' },
  { key: 'fluxbb:posts', template: '{root}/extern.php?action=feed&type=RSS', format: 'rss' },
  { key: 'fluxbb:posts', template: '{root}/extern.php?action=feed&type=atom', format: 'atom' },
])

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
  const id = getQueryParam(searchParams, 'id')

  if (id && endsWithAnyOf(pathname, '/viewforum.php')) {
    return { kind: 'forum', boardPath, forumId: id }
  }

  if (id && endsWithAnyOf(pathname, '/viewtopic.php')) {
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

    const root = `${new URL(url).origin}${parsed.boardPath}`

    if (parsed.kind === 'forum') {
      return [
        feeds.getFeedEntry('fluxbb:forum', { root, forumId: parsed.forumId }),
        feeds.getFeedEntry('fluxbb:posts', { root }, 'rss'),
        feeds.getFeedEntry('fluxbb:posts', { root }, 'atom'),
      ]
    }

    if (parsed.kind === 'topic') {
      return [
        feeds.getFeedEntry('fluxbb:topic', { root, topicId: parsed.topicId }),
        feeds.getFeedEntry('fluxbb:posts', { root }, 'rss'),
        feeds.getFeedEntry('fluxbb:posts', { root }, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('fluxbb:posts', { root }, 'rss'),
      feeds.getFeedEntry('fluxbb:posts', { root }, 'atom'),
    ]
  },
}
