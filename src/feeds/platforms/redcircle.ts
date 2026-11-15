import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent, uuidRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type RedcirclePage = { showUuid: string }

const hosts = ['redcircle.com', 'www.redcircle.com']

const showRegex = /^\/shows\/([^/]+)(?:\/|$)/i

const feeds = definePlatformFeeds([
  { key: 'redcircle:show', template: 'https://feeds.redcircle.com/{showUuid}' },
])

const getUuidFromPath = (pathname: string): string | undefined => {
  const segment = showRegex.exec(pathname)?.[1]

  // length: keeps a show slug out, since only the uuid builds feeds.redcircle.com/{uuid}
  if (!segment || !uuidRegex.test(segment)) {
    return
  }

  return segment
}

const findShowUuid = (url: string, content: string | undefined): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts) || !showRegex.test(parsedUrl.pathname)) {
    return
  }

  const showUuid = getUuidFromPath(parsedUrl.pathname)

  if (showUuid) {
    return showUuid
  }

  if (!content) {
    return
  }

  // A show or episode page under a slug names the show uuid in its `og:url`.
  const pageUrl = parseUrl(getMetaContent(content, 'og:url'))

  if (!pageUrl) {
    return
  }

  return getUuidFromPath(pageUrl.pathname)
}

const getRedcirclePage = (url: string, content: string | undefined): RedcirclePage | undefined => {
  const showUuid = findShowUuid(url, content)

  if (!showUuid) {
    return
  }

  return { showUuid }
}

export const redcircleHandler: PlatformHandler = {
  match: (url, content) => {
    return getRedcirclePage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getRedcirclePage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('redcircle:show', { showUuid: page.showUuid })]
  },

  getFeedHint: feeds.getFeedHint,
}
