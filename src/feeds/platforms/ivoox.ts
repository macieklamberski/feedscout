import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type IvooxUrl = { kind: 'podcast'; podcastId: string } | { kind: 'episode' }
export type IvooxPage = { kind: 'podcast' | 'episode'; podcastId: string }

const hosts = ['ivoox.com', 'www.ivoox.com']

const podcastRegex = /_sq_f(\d+)_\d+\.html$/i
const episodeRegex = /_rf_\d+_\d+\.html$/i
// An episode page names its show in the JSON-LD `partOfSeries`, among links to other shows.
const partOfSeriesRegex = /"partOfSeries":\{[^{}]*_sq_f(\d+)_/

export const parseIvooxUrl = (url: string): IvooxUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const { pathname } = new URL(url)
  const podcastId = pathname.match(podcastRegex)?.[1]

  if (podcastId) {
    return { kind: 'podcast', podcastId }
  }

  if (episodeRegex.test(pathname)) {
    return { kind: 'episode' }
  }
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

    return [
      {
        uri: `https://feeds.ivoox.com/feed_fg_f${page.podcastId}_filtro_1.xml`,
        hint: composeHint('ivoox:podcast'),
      },
    ]
  },
}
