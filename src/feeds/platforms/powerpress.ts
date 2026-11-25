import { powerpress } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getSiteUrl, hasMarker, isRootOfPage } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const playerFunction = 'powerpress_pinw'

// Each episode's player call names its play-in-new-window URL as the first argument.
const pinwCallRegex = /powerpress_pinw\('(?<pinwUrl>[^']*)'/

const feeds = withHintLabels(powerpress.feeds)

export const isPowerpressHtml = (content: string): boolean => {
  return content.includes(playerFunction)
}

export type PowerpressPage = { kind: 'site'; base?: Array<string> }

// A play-in-new-window link names the site's folder only on the page's own host, under a root that
// holds the page. A page with no such link is read at the root of its host.
export const getPowerpressPage = (url: string, content: string | undefined): PowerpressPage => {
  const pinwUrl = content?.match(pinwCallRegex)?.groups?.pinwUrl ?? ''
  const player = powerpress.pages.read(pinwUrl, { isAnyHost: true })

  if (player?.key !== 'player' || !isRootOfPage(getSiteUrl(player.params), url)) {
    return { kind: 'site' }
  }

  return { kind: 'site', base: player.params.base }
}

export const powerpressHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isPowerpressHtml })
  },

  resolve: (url, content) => {
    const page = getPowerpressPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('podcast', { base: page.base })]
  },
}
