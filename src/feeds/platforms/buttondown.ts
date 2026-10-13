import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ButtondownUrl = { kind: 'newsletter'; username: string }

const hosts = ['buttondown.com', 'www.buttondown.com', 'buttondown.email', 'www.buttondown.email']
const excludedPaths = [
  'about',
  'alternatives',
  'api',
  'blog',
  'book',
  'brand',
  'changelog',
  'climate',
  'comparison-guides',
  'docs',
  'emails',
  'features',
  'help',
  'kudos',
  'legal',
  'login',
  'open-source',
  'pricing',
  'privacy',
  'refer',
  'register',
  'search',
  'settings',
  'stack',
  'subscribers',
  'support',
  'terms',
  'testimonials',
  'use-cases',
]

export const parseButtondownUrl = (url: string): ButtondownUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'newsletter', username }
}

export const buttondownHandler: PlatformHandler = {
  match: (url) => {
    return parseButtondownUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseButtondownUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://buttondown.com/${parsed.username}/rss`,
        hint: composeHint('buttondown:newsletter'),
      },
    ]
  },
}
