import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodomaticUrl = { kind: 'podcast'; show: string }

const domains = ['podomatic.com']
const hosts = ['podomatic.com', 'www.podomatic.com']
const directoryPathRegex = /^\/podcasts\/([^/]+)/i
const excludedSubdomains = ['api', 'assets', 'static']

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

  const show = getTenantSubdomain(parsedUrl, domains, excludedSubdomains)

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

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://${parsed.show}.podomatic.com/rss2.xml`,
        hint: composeHint('podomatic:show'),
      },
    ]
  },
}
