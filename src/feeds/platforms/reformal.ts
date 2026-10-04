import { isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ReformalUrl = { kind: 'project' }

const domains = ['reformal.ru', 'idea.informer.com']
const excludedHosts = [
  'mail.reformal.ru',
  'media.reformal.ru',
  'sites.reformal.ru',
  'www.reformal.ru',
  'www.idea.informer.com',
]

export const parseReformalUrl = (url: string): ReformalUrl | undefined => {
  if (!isSubdomainOf(url, domains) || isHostOf(url, excludedHosts)) {
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
