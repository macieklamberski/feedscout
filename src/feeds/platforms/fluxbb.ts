import { fluxbb } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasElementWithId, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: forum, topic.
// Handler needed for: posts.

export type FluxbbUrl =
  | { kind: 'forum'; root: string; forumId: string }
  | { kind: 'topic'; root: string; topicId: string }
  | { kind: 'board'; root: string }

// Each id of a pair alone is a plausible id on an unrelated page.
const templateIds = ['brdheader', 'brdmain']
// `header.php` and `footer.php` print these whatever template the board uses.
const coreIds = ['brdmenu', 'brdfooter']

const feeds = withHintLabels(fluxbb.feeds)

export const isFluxbbHtml = (content: string): boolean => {
  return (
    templateIds.every((id) => hasElementWithId(content, id)) ||
    coreIds.every((id) => hasElementWithId(content, id))
  )
}

export const parseFluxbbUrl = (url: string): FluxbbUrl | undefined => {
  const page = fluxbb.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const { root } = page.params

  if (page.key === 'forum') {
    return { kind: 'forum', root, forumId: page.params.forumId }
  }

  if (page.key === 'topic') {
    return { kind: 'topic', root, topicId: page.params.topicId }
  }

  return { kind: 'board', root }
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

    const { root } = parsed

    if (parsed.kind === 'forum') {
      return [
        feeds.getFeedEntry('forum', { root, forumId: parsed.forumId }),
        feeds.getFeedEntry('posts', { root }, 'rss'),
        feeds.getFeedEntry('posts', { root }, 'atom'),
      ]
    }

    if (parsed.kind === 'topic') {
      return [
        feeds.getFeedEntry('topic', { root, topicId: parsed.topicId }),
        feeds.getFeedEntry('posts', { root }, 'rss'),
        feeds.getFeedEntry('posts', { root }, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('posts', { root }, 'rss'),
      feeds.getFeedEntry('posts', { root }, 'atom'),
    ]
  },
}
