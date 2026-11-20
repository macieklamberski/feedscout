import { powerpress } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const playerFunction = 'powerpress_pinw'

// Each episode's play-in-new-window link opens `{home}/?powerpress_pinw={id}-podcast`.
const pinwUrlRegex = /powerpress_pinw\('(?<homeUrl>[^'?]*)\?powerpress_pinw=/
const trailingSlashRegex = /\/$/

const feeds = withHintLabels(powerpress.feeds)

export const isPowerpressHtml = (content: string): boolean => {
  return content.includes(playerFunction)
}

export type PowerpressPage = { kind: 'site'; homeUrl: string }

// A play-in-new-window link names the site root only on the page's own host, under a root that
// holds the page.
const getPinwHomeUrl = (url: string, content: string | undefined): string | undefined => {
  const homeUrl = content?.match(pinwUrlRegex)?.groups?.homeUrl?.replace(trailingSlashRegex, '')
  const parsedHomeUrl = parseUrl(homeUrl)
  const parsedUrl = parseUrl(url)

  if (!homeUrl || !parsedHomeUrl || !parsedUrl || parsedHomeUrl.origin !== parsedUrl.origin) {
    return
  }

  if (!`${parsedUrl.pathname}/`.startsWith(`${parsedHomeUrl.pathname}/`)) {
    return
  }

  return homeUrl
}

export const getPowerpressPage = (url: string, content: string | undefined): PowerpressPage => {
  return { kind: 'site', homeUrl: getPinwHomeUrl(url, content) ?? new URL(url).origin }
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

    return [pageFeeds.getFeedEntry('podcast', { root: page.homeUrl })]
  },
}
