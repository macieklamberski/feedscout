import { getSubdomain, isAnyOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type GcsWebUrl = { kind: 'site' }

const domains = ['gcs-web.com']

const filesPathRegex = /\/sites\/g\/files\/knoqqb\d+\//

// Service hosts of the platform, on addresses outside the company sites' edge.
const excludedSubdomains = ['mail', 'origin', 'www']

export const isGcsWebHtml = (content: string): boolean => {
  return filesPathRegex.test(content)
}

export const parseGcsWebUrl = (url: string): GcsWebUrl | undefined => {
  const company = getSubdomain(url, domains)

  if (!company || company.includes('.') || isAnyOf(company, excludedSubdomains)) {
    return
  }

  return { kind: 'site' }
}

export const gcsWebHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOrSubdomainOf(url, domains)) {
      return parseGcsWebUrl(url) !== undefined
    }

    return hasMarker(content, headers, { html: isGcsWebHtml })
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/rss/news-releases.xml`, hint: composeHint('gcs-web:news-releases') },
      { uri: `${origin}/rss/sec-filings.xml`, hint: composeHint('gcs-web:sec-filings') },
      { uri: `${origin}/rss/events.xml`, hint: composeHint('gcs-web:events') },
    ]
  },
}
