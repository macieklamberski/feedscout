import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodigeeUrl = { kind: 'podcast' }

const domains = ['podigee.io']

const excludedSubdomains = ['www', 'app', 'help', 'hilfe', 'blog', 'status', 'player', 'cdn']

export const parsePodigeeUrl = (url: string): PodigeeUrl | undefined => {
  const show = getSubdomain(url, domains)

  if (!show || isAnyOf(show, excludedSubdomains)) {
    return
  }

  return { kind: 'podcast' }
}

export const podigeeHandler: PlatformHandler = {
  match: (url) => {
    return parsePodigeeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodigeeUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/feed/mp3`, hint: composeHint('podigee:podcast') }]
  },
}
