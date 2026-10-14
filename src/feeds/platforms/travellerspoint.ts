import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TravellerspointUrl = { kind: 'blog'; blog: string }

const domains = ['travellerspoint.com']

const excludedSubdomains = ['assets', 'blog', 'guide', 'img', 'm', 'photos', 'secure']

export const parseTravellerspointUrl = (url: string): TravellerspointUrl | undefined => {
  const blog = getTenantSubdomain(url, domains, excludedSubdomains)

  if (!blog) {
    return
  }

  return { kind: 'blog', blog }
}

export const travellerspointHandler: PlatformHandler = {
  match: (url) => {
    return parseTravellerspointUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTravellerspointUrl(url)

    if (!parsed) {
      return []
    }

    // An http page redirects to https, and the page's alternate link spells the feed with https.
    return [
      {
        uri: `https://${parsed.blog}.travellerspoint.com/atom.xml`,
        hint: composeHint('travellerspoint:posts'),
      },
    ]
  },
}
