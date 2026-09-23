import { isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Unmeasured, podomatic.com no longer resolves in DNS, from any resolver.

const hosts = ['podomatic.com', 'www.podomatic.com']
const domainSuffixRegex = /\.podomatic\.com$/i
const directoryPathRegex = /^\/podcasts\/([^/]+)/
const excludedSubdomains = ['www', 'api', 'assets', 'static']

const getShow = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { hostname, pathname } = parsedUrl

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
    return Boolean(getShow(url))
  },

  resolve: (url) => {
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
  },
}
