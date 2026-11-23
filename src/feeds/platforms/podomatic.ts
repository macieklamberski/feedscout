import { podomatic } from 'feedintel'
import { isPresent, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PodomaticUrl = { kind: 'podcast'; show: string }

const feeds = withHintLabels(podomatic.feeds)

export const parsePodomaticUrl = (url: string): PodomaticUrl | undefined => {
  const page = podomatic.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'podcast', show: page.params.show }
}

export const podomaticHandler: PlatformHandler = {
  match: (url) => {
    return parsePodomaticUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodomaticUrl(url)
    const parsedUrl = parseUrl(url)

    if (!parsed || !parsedUrl) {
      return []
    }

    const params = { scheme: parsedUrl.protocol.slice(0, -1), show: parsed.show }

    return [feeds.getFeedEntry('show', params)].filter(isPresent)
  },

  getFeedHint: feeds.getFeedHint,
}
