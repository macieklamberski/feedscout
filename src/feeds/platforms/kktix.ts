import { isLocale } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: events.

export type KktixUrl = { kind: 'organizer'; organizer: string }

const domains = ['kktix.cc']

// The page links the feed with the locale its request negotiated, zh-TW without an
// Accept-Language header, and only that spelling dedupes against the page's own link. The feed
// is also stored without the locale or with another one.
const feeds = definePlatformFeeds(
  'kktix',
  [
    {
      key: 'events',
      main: '{scheme}://{host}/events.atom?locale=zh-TW',
      aliases: ['{scheme}://{host}/events.atom', '{scheme}://{host}/events.atom?locale={locale}'],
    },
  ],
  { hosts: { tenants: domains }, checks: { locale: isLocale } },
)

export const parseKktixUrl = (url: string): KktixUrl | undefined => {
  // A nested subdomain like a.b.kktix.cc fails TLS, since the certificate covers one label.
  const organizer = getTenantSubdomain(url, domains)

  if (!organizer) {
    return
  }

  return { kind: 'organizer', organizer }
}

export const kktixHandler: PlatformHandler = {
  match: (url) => {
    return parseKktixUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page || !parseKktixUrl(url)) {
      return []
    }

    return [page.getFeedEntry('events')]
  },

  getFeedHint: feeds.getFeedHint,
}
