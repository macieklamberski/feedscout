import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type IvooxUrl = { kind: 'podcast'; podcastId: string } | { kind: 'episode' }
export type IvooxPage = { kind: 'podcast' | 'episode'; podcastId: string }

const hosts = ['ivoox.com', 'www.ivoox.com']

const podcastRegex = /_sq_f(\d+)_\d+\.html$/i
const episodeRegex = /_rf_\d+_\d+\.html$/i
// An episode page names its show in the JSON-LD `partOfSeries`, among links to other shows.
const partOfSeriesRegex = /"partOfSeries":\{[^{}]*_sq_f(\d+)_/

const feeds = definePlatformFeeds([
  { key: 'ivoox:podcast', template: 'https://feeds.ivoox.com/feed_fg_f{podcastId}_filtro_1.xml' },
  // Served spellings with the same items, under any slug. Claimed, never built.
  { key: 'ivoox:podcast', template: 'https://feeds.ivoox.com/{slug}_fg_f{podcastId}_filtro_1.xml' },
  { key: 'ivoox:podcast', template: 'https://www.ivoox.com/{slug}_fg_f{podcastId}_filtro_1.xml' },
  {
    key: 'ivoox:podcast',
    template: 'https://www.ivoox.com/{locale}/{slug}_fg_f{podcastId}_filtro_1.xml',
  },
  // A group of shows, and a listener's playlist, under ids only their own pages give.
  { key: 'ivoox:group', template: 'https://www.ivoox.com/{locale}/feed_fl_{groupId}_{page}.xml' },
  {
    key: 'ivoox:playlist',
    template: 'https://www.ivoox.com/{locale}/itunes-feed_fp_{playlistId}-_{date}_{page}.xml',
  },
])

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

    return [feeds.getFeedEntry('ivoox:podcast', { podcastId: page.podcastId })]
  },

  getFeedHint: feeds.getFeedHint,
}
