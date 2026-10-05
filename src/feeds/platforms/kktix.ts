import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers organizer (html).
// Handler needed for: event.

export type KktixUrl = { kind: 'organizer'; organizer: string }

const domains = ['kktix.cc']

const excludedSubdomains = ['www']

export const parseKktixUrl = (url: string): KktixUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  // A nested subdomain like a.b.kktix.cc fails TLS, since the certificate covers one label.
  if (!subdomain || subdomain.includes('.')) {
    return
  }

  if (isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  return { kind: 'organizer', organizer: subdomain }
}

export const kktixHandler: PlatformHandler = {
  match: (url) => {
    return parseKktixUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseKktixUrl(url)

    if (!parsed) {
      return []
    }

    // The page links the feed with the locale its request negotiated, zh-TW without an
    // Accept-Language header, and only that spelling dedupes against the page's own link.
    return [
      {
        uri: `https://${parsed.organizer}.kktix.cc/events.atom?locale=zh-TW`,
        hint: composeHint('kktix:events'),
      },
    ]
  },
}
