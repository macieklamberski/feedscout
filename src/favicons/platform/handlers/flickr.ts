import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hosts } from '../../../feeds/platform/handlers/flickr.js'

const profileRegex = /^\/photos\/([^/]+)(?:\/favorites)?\/?$/
// The page owner's 300x300 buddyicon.
const avatarRegex =
  /<div class="avatar-container">\s*<div\s+class="avatar [^"]*"\s*style="background-image: url\((\/\/[^)#]+\/buddyicons\/[^)#]+)/

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
    const match = content?.match(avatarRegex)

    if (!match?.[1]) {
      return []
    }

    return [{ uri: `https:${match[1]}` }]
  },
}
