import { ivoox } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: podcast.

export type IvooxUrl = { kind: 'podcast'; podcastId: string } | { kind: 'episode' }
export type IvooxPage = { kind: 'podcast' | 'episode'; podcastId: string }

// An episode page names its show in the JSON-LD `partOfSeries`, among links to other shows.
const partOfSeriesRegex = /"partOfSeries":\{[^{}]*_sq_f(\d+)_/

const feeds = withHintLabels(ivoox.feeds)

export const parseIvooxUrl = (url: string): IvooxUrl | undefined => {
  const page = ivoox.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'podcast') {
    return { kind: 'podcast', podcastId: page.params.podcastId }
  }

  return { kind: 'episode' }
}

export const getIvooxPage = (url: string, content: string | undefined): IvooxPage | undefined => {
  const parsed = parseIvooxUrl(url)

  if (!parsed) {
    return
  }

  if (parsed.kind === 'podcast') {
    return parsed
  }

  const podcastId = content?.match(partOfSeriesRegex)?.[1]

  if (!podcastId) {
    return
  }

  return { kind: 'episode', podcastId }
}

export const ivooxHandler: PlatformHandler = {
  match: (url) => {
    return parseIvooxUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getIvooxPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { podcastId: page.podcastId })]
  },

  getFeedHint: feeds.getFeedHint,
}
