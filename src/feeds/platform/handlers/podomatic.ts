import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// A Podomatic show serves its feed at `{show}.podomatic.com/rss2.xml`. The
// directory path `www.podomatic.com/podcasts/{show}` addresses the same show,
// and both shapes map back to the subdomain for the feed.

const hosts = ['podomatic.com', 'www.podomatic.com']
const domainSuffixRegex = /\.podomatic\.com$/i
const directoryPathRegex = /^\/podcasts\/([^/]+)/
const excludedSubdomains = ['www', 'api', 'assets', 'static']

const getShow = (url: string): string | undefined => {
  const { hostname, pathname } = new URL(url)

  if (isHostOf(url, hosts)) {
    return pathname.match(directoryPathRegex)?.[1]
  }

  if (!isSubdomainOf(url, 'podomatic.com')) {
    return
  }

  const subdomain = hostname.replace(domainSuffixRegex, '')

  return excludedSubdomains.includes(subdomain) ? undefined : subdomain
}

export const podomaticHandler: PlatformHandler = {
  match: (url) => {
    try {
      return Boolean(getShow(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const show = getShow(url)

      if (!show) {
        return []
      }

      return [
        {
          uri: `https://${show}.podomatic.com/rss2.xml`,
          hint: composeHint('podomatic:show'),
        },
      ]
    } catch {}

    return []
  },
}
