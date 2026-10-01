import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const hosts = ['redcircle.com', 'www.redcircle.com']

const showRegex = /^\/shows\/([^/]+)(?:\/|$)/i
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const getUuidFromPath = (pathname: string): string | undefined => {
  const segment = pathname.match(showRegex)?.[1]

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
  const pageUrl = parseUrl(getMetaContent(content, 'og:url') ?? '')

  if (!pageUrl) {
    return
  }

  return getUuidFromPath(pageUrl.pathname)
}

export type RedcirclePage = { showUuid: string }

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

    return [
      {
        uri: `https://feeds.redcircle.com/${page.showUuid}`,
        hint: composeHint('redcircle:show'),
      },
    ]
  },
}
