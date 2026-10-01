import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodbeanUrl = { kind: 'podcast'; show: string }

const domains = ['podbean.com']

// Reserved Podbean subdomains that aren't user shows. Without this guard, hitting
// podbean.com corporate/infra hosts produces feed.podbean.com/{reserved}/feed.xml
// URLs that resolve to real but unrelated user-owned shows (e.g. "The www's Podcast").
const excludedSubdomains = [
  'www',
  'feed',
  'pbcdn1',
  'sponsorship',
  'podads',
  'help',
  'blog',
  'support',
]

export const parsePodbeanUrl = (url: string): PodbeanUrl | undefined => {
  const show = getSubdomain(url, domains)

  if (!show || isAnyOf(show, excludedSubdomains)) {
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
