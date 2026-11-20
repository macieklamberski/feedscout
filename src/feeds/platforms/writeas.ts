import { writeas } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type WriteasUrl =
  | { kind: 'tag'; username: string; tag: string }
  | { kind: 'blog'; username: string }

const feeds = withHintLabels(writeas.feeds)

export const parseWriteasUrl = (url: string): WriteasUrl | undefined => {
  const page = writeas.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', username: page.params.username, tag: page.params.tag }
  }

  return { kind: 'blog', username: page.params.username }
}

export const writeasHandler: PlatformHandler = {
  match: (url) => {
    return parseWriteasUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWriteasUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [
        feeds.getFeedEntry('tag', { username: parsed.username, tag: parsed.tag }),
        feeds.getFeedEntry('blog', { username: parsed.username }),
      ]
    }

    return [feeds.getFeedEntry('blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
