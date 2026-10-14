import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers home (html), partly covers group.

export type MobilizonUrl = { kind: 'group'; group: string } | { kind: 'instance' }

const groupPathRegex = /^\/@([^/]+)/

// The page is a JavaScript shell, and this notice is the only text the server renders on every page.
export const isMobilizonHtml = (content: string): boolean => {
  return content.includes("Mobilizon doesn't work properly without JavaScript")
}

export const parseMobilizonUrl = (url: string): MobilizonUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const group = parsedUrl.pathname.match(groupPathRegex)?.[1]

  if (group) {
    return { kind: 'group', group }
  }

  return { kind: 'instance' }
}

export const mobilizonHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isMobilizonHtml })) {
      return false
    }

    return parseMobilizonUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMobilizonUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'group') {
      uris.push({
        uri: `${origin}/@${parsed.group}/feed/atom`,
        hint: composeHint('mobilizon:group'),
      })
    }

    uris.push({
      uri: `${origin}/feed/instance/atom`,
      hint: composeHint('mobilizon:instance'),
    })

    return uris
  },
}
