import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ProboardsUrl = { kind: 'forum' }

const domains = ['proboards.com', 'freeforums.net', 'boards.net']

// ProBoards' own site, sign-in and asset hosts, not forums. On freeforums.net and boards.net the
// same names are ordinary forums.
const excludedHosts = [
  'www.proboards.com',
  'www.freeforums.net',
  'www.boards.net',
  'login.proboards.com',
  'storage.proboards.com',
]

export const parseProboardsUrl = (url: string): ProboardsUrl | undefined => {
  const subdomain = getSubdomain(url, domains)

  if (!subdomain || isAnyOf(new URL(url).hostname.toLowerCase(), excludedHosts)) {
    return
  }

  return { kind: 'forum' }
}

export const proboardsHandler: PlatformHandler = {
  match: (url) => {
    return parseProboardsUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseProboardsUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss/public`, hint: composeHint('proboards:posts') }]
  },
}
