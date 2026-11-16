import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodigeeUrl = { kind: 'podcast' }

const domains = ['podigee.io']

// The aac, opus and vorbis feeds list the mp3 feed's episodes with other enclosures, so each
// encoding is a feed of its own. A show's further feeds live under /feeds/{feed} and can list
// fewer episodes than the main one. No page links either, and a show without an encoding
// answers 302 to /feed/mp3, so they are claimed and never built.
const feeds = definePlatformFeeds(
  [
    { key: 'podigee:podcast', template: '{scheme}://{host}/feed/mp3' },
    { key: 'podigee:podcast-encoding', template: '{scheme}://{host}/feed/aac' },
    { key: 'podigee:podcast-encoding', template: '{scheme}://{host}/feed/opus' },
    { key: 'podigee:podcast-encoding', template: '{scheme}://{host}/feed/vorbis' },
    { key: 'podigee:feed', template: '{scheme}://{host}/feeds/{feed}/mp3' },
    { key: 'podigee:feed-encoding', template: '{scheme}://{host}/feeds/{feed}/aac' },
    { key: 'podigee:feed-encoding', template: '{scheme}://{host}/feeds/{feed}/opus' },
    { key: 'podigee:feed-encoding', template: '{scheme}://{host}/feeds/{feed}/vorbis' },
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
  getSiblingFeeds: feeds.getSiblingFeeds,
}
