import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodigeeUrl = { kind: 'podcast' }

const domains = ['podigee.io']

// The mp3 feed comes first, so resolve builds it. The aac, opus and vorbis feeds list the same
// episodes in another encoding, and a show's further feeds live under /feeds/{feed}.
const feeds = definePlatformFeeds(
  [
    { key: 'podigee:podcast', template: '{scheme}://{host}/feed/mp3' },
    { key: 'podigee:podcast', template: '{scheme}://{host}/feed/aac' },
    { key: 'podigee:podcast', template: '{scheme}://{host}/feed/opus' },
    { key: 'podigee:podcast', template: '{scheme}://{host}/feed/vorbis' },
    { key: 'podigee:podcast', template: '{scheme}://{host}/feeds/{feed}/mp3' },
    { key: 'podigee:podcast', template: '{scheme}://{host}/feeds/{feed}/aac' },
    { key: 'podigee:podcast', template: '{scheme}://{host}/feeds/{feed}/opus' },
    { key: 'podigee:podcast', template: '{scheme}://{host}/feeds/{feed}/vorbis' },
  ],
  { domains },
)

export const parsePodigeeUrl = (url: string): PodigeeUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'podcast' }
}

export const podigeeHandler: PlatformHandler = {
  match: (url) => {
    return parsePodigeeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodigeeUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('podigee:podcast')]
  },

  getFeedHint: feeds.getFeedHint,
}
