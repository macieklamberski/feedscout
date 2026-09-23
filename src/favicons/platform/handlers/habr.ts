import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { hosts, hubRegex, userRegex } from '../../../feeds/platform/handlers/habr.js'

// The first image nested in the card: only opening tags and comments may come before it.
const hubAvatarRegex =
  /class="tm-hub-card__avatar"[^>]*>(?:<(?!\/|img)[^>]*>)*<img[^>]*\ssrc="([^"]+)"/
const userAvatarRegex = /class="user-card[\s"][^>]*>(?:<(?!\/|img)[^>]*>)*<img[^>]*\ssrc="([^"]+)"/
// A user without an avatar gets one of the numbered generic pictures.
const placeholderRegex = /^https:\/\/assets\.habr\.com\/.+\/img\/avatars\/\d+\.png$/

const getAvatarRegex = (url: string): RegExp | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  if (hubRegex.test(parsedUrl.pathname)) {
    return hubAvatarRegex
  }

  if (userRegex.test(parsedUrl.pathname)) {
    return userAvatarRegex
  }
}

export const habrHandler: PlatformHandler = {
  match: (url) => {
    return getAvatarRegex(url) !== undefined
  },

  resolve: (url, content) => {
    const avatarRegex = getAvatarRegex(url)

    if (!avatarRegex || !content) {
      return []
    }

    const avatar = content.match(avatarRegex)?.[1]

    if (!avatar || placeholderRegex.test(avatar)) {
      return []
    }

    return [{ uri: avatar }]
  },
}
