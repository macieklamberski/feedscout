import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { type Element, findElement, hasClass } from '../../common/utils.js'
import type { FlickrUrl } from '../../feeds/platforms/flickr.js'
import { parseFlickrUrl } from '../../feeds/platforms/flickr.js'

const buddyiconRegex = /background-image:\s*url\(\s*["']?(\/\/[^)"'#]+\/buddyicons\/[^)"'#]+)/

// Pages that show the owner's avatar. Tag pages carry other users' icons, and single photo
// and album pages carry none.
const ownerKinds: Array<FlickrUrl['kind']> = ['photostream', 'favorites', 'albums', 'galleries']

const isOwnerAvatar = (element: Element): boolean => {
  return hasClass(element, 'avatar') && hasClass(element.parent, 'avatar-container')
}

export const flickrHandler: PlatformHandler = {
  match: (url) => {
    const parsed = parseFlickrUrl(url)

    return parsed !== undefined && ownerKinds.includes(parsed.kind)
  },

  resolve: (_url, content) => {
    // The page owner's 300x300 buddyicon.
    const avatar = findElement(content, isOwnerAvatar)
    const match = avatar?.attribs.style?.match(buddyiconRegex)

    if (!match?.[1]) {
      return []
    }

    return [{ uri: `https:${match[1]}` }]
  },
}
