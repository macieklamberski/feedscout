import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TravellerspointUrl = { kind: 'blog'; blog: string }

const domains = ['travellerspoint.com']

// Hosts of the site itself. Every other label is a member blog or answers 404.
const excludedSubdomains = ['assets', 'blog', 'guide', 'img', 'm', 'photos', 'secure', 'www']

export const parseTravellerspointUrl = (url: string): TravellerspointUrl | undefined => {
  const blog = getSubdomain(url, domains)

  if (!blog || blog.includes('.') || isAnyOf(blog, excludedSubdomains)) {
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
