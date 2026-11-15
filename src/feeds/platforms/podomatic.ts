import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodomaticUrl = { kind: 'podcast'; show: string }

const domains = ['podomatic.com']
const hosts = ['podomatic.com', 'www.podomatic.com']

const directoryPathRegex = /^\/podcasts\/([^/]+)/i

const feeds = definePlatformFeeds(
  [
    { key: 'podomatic:show', template: '{scheme}://{host}/rss2.xml' },
    { key: 'podomatic:show', template: '{scheme}://{host}/archive/rss2.xml', isAlias: true },
  ],
  { domains },
)

export const parsePodomaticUrl = (url: string): PodomaticUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOf(parsedUrl, hosts)) {
    const show = parsedUrl.pathname.match(directoryPathRegex)?.[1]

    if (!show) {
      return
    }

    return { kind: 'podcast', show }
  }

  const show = getTenantSubdomain(parsedUrl, domains)

  if (!show) {
    return
  }

  return { kind: 'podcast', show }
}

export const podomaticHandler: PlatformHandler = {
  match: (url) => {
    return parsePodomaticUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodomaticUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const host = `${parsed.show.toLowerCase()}.podomatic.com`

    if (!getHostOrigin(host)) {
      return []
    }

    return [page.getFeedEntry('podomatic:show', { host })]
  },

  getFeedHint: feeds.getFeedHint,
}
