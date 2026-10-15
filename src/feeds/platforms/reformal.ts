import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ReformalUrl = { kind: 'project' }

const domains = ['reformal.ru', 'idea.informer.com']

export const parseReformalUrl = (url: string): ReformalUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'project' }
}

export const reformalHandler: PlatformHandler = {
  match: (url) => {
    return parseReformalUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseReformalUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/proj/rss`, hint: composeHint('reformal:feedback') }]
  },
}
