import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodigeeUrl = { kind: 'podcast'; podcast: string }

const domains = ['podigee.io']

// The mp3 feed comes first, so resolve builds it. The aac, opus and vorbis feeds list the same
// episodes in another encoding, and a show's further feeds live under /feeds/{feed}.
const feeds = definePlatformFeeds([
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feed/mp3' },
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feed/aac' },
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feed/opus' },
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feed/vorbis' },
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feeds/{feed}/mp3' },
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feeds/{feed}/aac' },
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feeds/{feed}/opus' },
  { key: 'podigee:podcast', template: 'https://{podcast}.podigee.io/feeds/{feed}/vorbis' },
])

export const parsePodigeeUrl = (url: string): PodigeeUrl | undefined => {
  const podcast = getTenantSubdomain(url, domains)

  if (!podcast) {
    return
  }

  return { kind: 'podcast', podcast }
}

export const podigeeHandler: PlatformHandler = {
  match: (url) => {
    return parsePodigeeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodigeeUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podigee:podcast', { podcast: parsed.podcast })]
  },

  getFeedKey: feeds.getFeedKey,
}
