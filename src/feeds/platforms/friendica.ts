import { friendica } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type FriendicaUrl = { kind: 'profile'; username: string }

const feeds = withHintLabels(friendica.feeds)

export const isFriendicaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Friendica')
}

export const isFriendicaHeaders = (headers: Headers): boolean => {
  return headers.has('x-friendica-version')
}

export const parseFriendicaUrl = (url: string): FriendicaUrl | undefined => {
  const page = friendica.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  return { kind: 'profile', username: page.params.username }
}

export const friendicaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (parseFriendicaUrl(url) === undefined) {
      return false
    }

    return hasMarker(content, headers, { html: isFriendicaHtml, headers: isFriendicaHeaders })
  },

  resolve: (url) => {
    const parsed = parseFriendicaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const { username } = parsed

    return [
      page.getFeedEntry('posts', { username }),
      page.getFeedEntry('comments', { username }),
      page.getFeedEntry('replies', { username }),
      page.getFeedEntry('activity', { username }),
    ]
  },
}
