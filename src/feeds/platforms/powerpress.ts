import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const playerFunction = 'powerpress_pinw'

// Each episode's play-in-new-window link opens `{home}/?powerpress_pinw={id}-podcast`.
const pinwUrlRegex = /powerpress_pinw\('(?<homeUrl>[^'?]*)\?powerpress_pinw=/
const trailingSlashRegex = /\/$/

export const isPowerpressHtml = (content: string): boolean => {
  return content.includes(playerFunction)
}

// A play-in-new-window link names the site root only on the page's own host, under a root that
// holds the page.
const getHomeUrl = (url: string, content: string | undefined): string | undefined => {
  const homeUrl = content?.match(pinwUrlRegex)?.groups?.homeUrl?.replace(trailingSlashRegex, '')
  const parsedHomeUrl = parseUrl(homeUrl ?? '')
  const parsedUrl = parseUrl(url)

  if (!homeUrl || !parsedHomeUrl || !parsedUrl || parsedHomeUrl.origin !== parsedUrl.origin) {
    return
  }

  if (!`${parsedUrl.pathname}/`.startsWith(`${parsedHomeUrl.pathname}/`)) {
    return
  }

  return homeUrl
}

export const powerpressHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isPowerpressHtml })
  },

  resolve: (url, content) => {
    const homeUrl = getHomeUrl(url, content) ?? new URL(url).origin

    return [{ uri: `${homeUrl}/feed/podcast/`, hint: composeHint('powerpress:podcast') }]
  },
}
