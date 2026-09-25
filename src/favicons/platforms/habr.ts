import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findDescendant, findElement, hasClass } from '../../common/utils.js'
import { hosts, hubRegex, userRegex } from '../../feeds/platforms/habr.js'

// A user without an avatar gets one of the numbered generic pictures.
const placeholderRegex = /^https:\/\/assets\.habr\.com\/.+\/img\/avatars\/\d+\.png$/

const getCardClass = (url: string): string | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(url, hosts)) {
    return
  }

  if (hubRegex.test(parsedUrl.pathname)) {
    return 'tm-hub-card__avatar'
  }

  if (userRegex.test(parsedUrl.pathname)) {
    return 'user-card'
  }
}

const findAvatarSrc = (content: string, cardClass: string): string | undefined => {
  const card = findElement(content, (element) => hasClass(element, cardClass))

  if (!card) {
    return
  }

  const image = findDescendant(card, (element) => element.name === 'img')

  return image?.attribs.src
}

export const habrHandler: PlatformHandler = {
  match: (url) => {
    return getCardClass(url) !== undefined
  },

  resolve: (url, content) => {
    const cardClass = getCardClass(url)

    if (!cardClass || !content) {
      return []
    }

    const avatar = findAvatarSrc(content, cardClass)

    if (!avatar || placeholderRegex.test(avatar)) {
      return []
    }

    return [{ uri: avatar }]
  },
}
