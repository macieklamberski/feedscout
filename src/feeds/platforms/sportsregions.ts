import { isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SportsregionsUrl = { kind: 'club' }

const domains = ['sportsregions.fr']

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
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/rss/news`, hint: composeHint('sportsregions:news') },
      { uri: `${origin}/rss/evenement`, hint: composeHint('sportsregions:events') },
    ]
  },
}
