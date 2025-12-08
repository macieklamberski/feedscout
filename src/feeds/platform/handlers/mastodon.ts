import type { PlatformHandler } from '../../../common/uris/platform/types.js'

const knownInstances = [
  'mastodon.social',
  'mastodon.online',
  'mstdn.social',
  'mas.to',
  'fosstodon.org',
  'hachyderm.io',
  'infosec.exchange',
  'techhub.social',
  'mastodon.world',
  'universeodon.com',
]

const isMastodonInstance = (hostname: string): boolean => {
  if (knownInstances.includes(hostname)) {
    return true
  }

  if (hostname.startsWith('mastodon.') || hostname.startsWith('mstdn.')) {
    return true
  }

  return false
}

export const mastodonHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = new URL(url)
    const hostname = parsedUrl.hostname.toLowerCase()

    if (!isMastodonInstance(hostname)) {
      return false
    }

    return parsedUrl.pathname.startsWith('/@')
  },

  resolve: (url) => {
    const parsedUrl = new URL(url)
    const match = parsedUrl.pathname.match(/^\/@([^/]+)/)
    const username = match?.[1]

    if (!username) {
      return []
    }

    return [`${parsedUrl.origin}/@${username}.rss`]
  },
}
