import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WeblogLolUrl = { kind: 'blog' }

const domains = ['weblog.lol']

export const parseWeblogLolUrl = (url: string): WeblogLolUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const weblogLolHandler: PlatformHandler = {
  match: (url) => {
    return parseWeblogLolUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWeblogLolUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/rss.xml`, hint: composeHint('weblog-lol:posts', 'rss') })
    uris.push({ uri: `${origin}/atom.xml`, hint: composeHint('weblog-lol:posts', 'atom') })
    uris.push({ uri: `${origin}/feed.json`, hint: composeHint('weblog-lol:posts', 'json') })

    return uris
  },
}
