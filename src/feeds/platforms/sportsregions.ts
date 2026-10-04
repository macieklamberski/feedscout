import { getSubdomain, isAnyOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SportsregionsUrl = { kind: 'club' }

const domains = ['sportsregions.fr']

// Every subdomain resolves to the club farm, and these answer as platform services, not clubs.
const excludedSubdomains = [
  'admin',
  'aide',
  'beta',
  'imap',
  'mail',
  'pop',
  'portail',
  'smtp',
  'video',
  'videos',
  'webmail',
  'www',
]

// The footer of every club site links the platform's abuse report form, on custom domains too.
export const isSportsregionsHtml = (content: string): boolean => {
  return content.includes('www.sportsregions.fr/signaler-un-contenu-inapproprie')
}

export const parseSportsregionsUrl = (url: string): SportsregionsUrl | undefined => {
  const club = getSubdomain(url, domains)

  if (!club || isAnyOf(club, excludedSubdomains)) {
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
