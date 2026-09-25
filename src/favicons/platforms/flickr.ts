import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { type Element, findElement, hasClass } from '../../common/utils.js'
import { hosts } from '../../feeds/platforms/flickr.js'

const profileRegex = /^\/photos\/([^/]+)(?:\/favorites)?\/?$/
const buddyiconRegex = /background-image:\s*url\(\s*["']?(\/\/[^)"'#]+\/buddyicons\/[^)"'#]+)/

const isOwnerAvatar = (element: Element): boolean => {
  return hasClass(element, 'avatar') && hasClass(element.parent, 'avatar-container')
}

export const flickrHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    const match = parsedUrl.pathname.match(profileRegex)

    // Tag pages carry other users' icons, never an owner's.
    return !!match?.[1] && match[1] !== 'tags'
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
