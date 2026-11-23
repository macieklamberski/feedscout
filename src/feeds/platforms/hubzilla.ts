import { hubzilla } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HubzillaUrl = { kind: 'channel'; channel: string }

const feeds = withHintLabels(hubzilla.feeds)

// A custom theme can drop the generator, while core prints `var zid` in every page head.
export const isHubzillaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'hubzilla') || content.includes('var zid =')
}

export const parseHubzillaUrl = (url: string): HubzillaUrl | undefined => {
  const page = hubzilla.pages.read(url, { root: parseUrl(url)?.origin ?? '' })

  if (!page) {
    return
  }

  return { kind: 'channel', channel: page.params.channel }
}

export const hubzillaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isHubzillaHtml })) {
      return false
    }

    return parseHubzillaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHubzillaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('channel', { channel: parsed.channel })]
  },
}
