import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PromodjUrl = { kind: 'profile'; username: string }

const hosts = ['promodj.com', 'www.promodj.com']

export const parsePromodjUrl = (url: string): PromodjUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'profile', username }
}

export const promodjHandler: PlatformHandler = {
  match: (url) => {
    return parsePromodjUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePromodjUrl(url)

    if (!parsed) {
      return []
    }

    const profileUrl = `https://promodj.com/${parsed.username}`

    return [
      { uri: `${profileUrl}/podcast.xml`, hint: composeHint('promodj:podcast') },
      { uri: `${profileUrl}/rss.xml`, hint: composeHint('promodj:content') },
      { uri: `${profileUrl}/blog.xml`, hint: composeHint('promodj:blog') },
      { uri: `${profileUrl}/bookmarks.xml`, hint: composeHint('promodj:favorites') },
      { uri: `${profileUrl}/avisha.xml`, hint: composeHint('promodj:events') },
    ]
  },
}
