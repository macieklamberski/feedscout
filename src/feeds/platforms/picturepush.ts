import { getSubdomain, isAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PicturepushUrl = { kind: 'user' }

const domains = ['picturepush.com']

const excludedSubdomains = [
  'en', // Copy of the home page
  'fr', // Copy of the home page
  'nl', // Copy of the home page
  'www', // Redirects to picturepush.com
  'www1', // Photo host
]

export const parsePicturepushUrl = (url: string): PicturepushUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  if (!subdomain || isAnyOf(subdomain, excludedSubdomains)) {
    return
  }

  return { kind: 'user' }
}

export const picturepushHandler: PlatformHandler = {
  match: (url, content) => {
    if (!parsePicturepushUrl(url)) {
      return false
    }

    // A user that does not exist redirects to picturepush.com, whose page serves the sitewide
    // feed. Every user page links its own host, the home page never does. The page spells the
    // host as the account does, such as StepNebl, so it is compared in lowercase.
    if (content !== undefined && !content.toLowerCase().includes(`//${new URL(url).host}/`)) {
      return false
    }

    return true
  },

  resolve: (url) => {
    const parsed = parsePicturepushUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = [
      { uri: `${origin}/user_rss.php`, hint: composeHint('picturepush:pictures') },
    ]

    return uris
  },
}
