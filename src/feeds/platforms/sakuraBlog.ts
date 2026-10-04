import { isSubdomainOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SakuraBlogUrl = { kind: 'blog'; hostname: string }

const domains = ['sblo.jp']

export const parseSakuraBlogUrl = (url: string): SakuraBlogUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  return { kind: 'blog', hostname: new URL(url).hostname }
}

export const sakuraBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseSakuraBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSakuraBlogUrl(url)

    if (!parsed) {
      return []
    }

    // Blogs on the classic engine answer over http only, as their alternate links spell it: https
    // fails the TLS handshake with a certificate that names blog.sakura.ne.jp. Newer blogs serve
    // https and /rss.xml instead, which generic discovery finds through the page's anchor.
    const origin = `http://${parsed.hostname}`
    const uris: Array<DiscoverUriEntry> = []

    uris.push({ uri: `${origin}/index20.rdf`, hint: composeHint('sakura-blog:posts', 'rss') })
    uris.push({ uri: `${origin}/index.rdf`, hint: composeHint('sakura-blog:posts', 'rdf') })

    return uris
  },
}
