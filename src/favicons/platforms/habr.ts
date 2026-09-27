import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findDescendant, findElement, hasClass } from '../../common/utils.js'
import { parseHabrUrl } from '../../feeds/platforms/habr.js'

// A user without an avatar gets one of the numbered generic pictures.
const placeholderRegex = /^https:\/\/assets\.habr\.com\/.+\/img\/avatars\/\d+\.png$/

const getCardClass = (url: string): string | undefined => {
  const kind = parseHabrUrl(url)?.kind

  if (kind === 'hub') {
    return 'tm-hub-card__avatar'
  }

  if (kind === 'user') {
    return 'user-card'
  }

  if (kind === 'company') {
    return 'company-card'
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
