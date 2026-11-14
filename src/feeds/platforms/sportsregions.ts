import { isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SportsregionsUrl = { kind: 'club' }

const domains = ['sportsregions.fr']

// A club on its own domain is known only by its markers, so its feeds are built but not claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'sportsregions:news', template: '{scheme}://{host}/rss/news' },
    { key: 'sportsregions:events', template: '{scheme}://{host}/rss/evenement' },
  ],
  { domains },
)

// The footer of every club site links the platform's abuse report form, on custom domains too.
export const isSportsregionsHtml = (content: string): boolean => {
  return content.includes('www.sportsregions.fr/signaler-un-contenu-inapproprie')
}

export const parseSportsregionsUrl = (url: string): SportsregionsUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'club' }
}

export const sportsregionsHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (parseSportsregionsUrl(url)) {
      return true
    }

    // The portal and the help center print the same footer.
    if (isHostOrSubdomainOf(url, domains)) {
      return false
    }

    return hasMarker(content, headers, { html: isSportsregionsHtml })
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('sportsregions:news'), page.getFeedEntry('sportsregions:events')]
  },

  getFeedHint: feeds.getFeedHint,
}
