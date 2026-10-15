import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodbeanUrl = { kind: 'podcast'; show: string }

const domains = ['podbean.com']
// The feed host serves every show by path, so it names no show.
const feedHosts = ['feed.podbean.com']

export const parsePodbeanUrl = (url: string): PodbeanUrl | undefined => {
  const show = getTenantSubdomain(url, domains)

  if (!show || isHostOf(url, feedHosts)) {
    return
  }

  return { kind: 'podcast', show }
}

export const podbeanHandler: PlatformHandler = {
  match: (url) => {
    return parsePodbeanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodbeanUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://feed.podbean.com/${parsed.show}/feed.xml`,
        hint: composeHint('podbean:podcast'),
      },
    ]
  },
}
