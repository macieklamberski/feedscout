import { getSubdomain, isAnyOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ProboardsUrl = { kind: 'forum' } | { kind: 'customDomain' }

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

// Every forum page loads the core script from storage.proboards.com or storage.forums.net, on a
// custom domain too.
export const isProboardsHtml = (content: string): boolean => {
  return content.includes('/forum/js/proboards.combined_')
}

export const parseProboardsUrl = (url: string): ProboardsUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return { kind: 'customDomain' }
  }

  const subdomain = getSubdomain(url, domains)

  if (!subdomain || isAnyOf(new URL(url).hostname.toLowerCase(), excludedHosts)) {
    return
  }

  return { kind: 'forum' }
}

export const proboardsHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseProboardsUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isProboardsHtml })
    }

    return parsed !== undefined
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
