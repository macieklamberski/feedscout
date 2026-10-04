import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodcloudUrl = { kind: 'show' }

const domains = ['lepodcast.fr']

// podCloud's own services, not shows.
const excludedSubdomains = ['dev', 'feed', 'feeds', 'multifeed', 'studio', 'www', 'www2']

export const parsePodcloudUrl = (url: string): PodcloudUrl | undefined => {
  const slug = getSubdomain(url, domains)

  if (!slug || isAnyOf(slug, excludedSubdomains)) {
    return
  }

  return { kind: 'show' }
}

export const podcloudHandler: PlatformHandler = {
  match: (url) => {
    return parsePodcloudUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodcloudUrl(url)

    if (!parsed) {
      return []
    }

    const { hostname } = new URL(url)

    return [{ uri: `https://${hostname}/rss`, hint: composeHint('podcloud:podcast') }]
  },
}
