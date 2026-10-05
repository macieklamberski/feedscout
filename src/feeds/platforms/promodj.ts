import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PromodjUrl = { kind: 'profile'; username: string }

const hosts = ['promodj.com', 'www.promodj.com']

const excludedPaths = [
  'acapellas',
  'assets',
  'avisha',
  'booking',
  'charts',
  'clubbers',
  'communities',
  'contests',
  'cool',
  'cp',
  'cue',
  'djs',
  'download',
  'extra',
  'featured',
  'forum',
  'info',
  'interview',
  'lives',
  'login',
  'logout',
  'magazine',
  'mixes',
  'music',
  'musicians',
  'onair',
  'online',
  'people',
  'podcasts',
  'prelisten',
  'preview',
  'promos',
  'radio',
  'radioshows',
  'register',
  'releases',
  'remixes',
  'samples',
  'search',
  'shop',
  'source',
  'support',
  'tools',
  'top100',
  'tracks',
  'trendy',
  'tv',
  'videos',
  'waveform',
]

export const parsePromodjUrl = (url: string): PromodjUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
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

    // PromoDJ answers /TAGA too, and its page links the feeds of /taga.
    const profileUrl = `https://promodj.com/${parsed.username.toLowerCase()}`

    return [
      { uri: `${profileUrl}/podcast.xml`, hint: composeHint('promodj:podcast') },
      { uri: `${profileUrl}/rss.xml`, hint: composeHint('promodj:content') },
      { uri: `${profileUrl}/blog.xml`, hint: composeHint('promodj:blog') },
      { uri: `${profileUrl}/bookmarks.xml`, hint: composeHint('promodj:favorites') },
      { uri: `${profileUrl}/avisha.xml`, hint: composeHint('promodj:events') },
    ]
  },
}
