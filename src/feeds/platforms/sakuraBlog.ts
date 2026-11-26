import { sakuraBlog } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type SakuraBlogUrl = { kind: 'blog'; hostname: string }

const domains = sakuraBlog.hosts.tenants

const feeds = withHintLabels(sakuraBlog.feeds)

export const parseSakuraBlogUrl = (url: string): SakuraBlogUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const hostname = parseUrl(url)?.hostname

  if (!hostname) {
    return
  }

  return { kind: 'blog', hostname }
}

export const sakuraBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseSakuraBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!parseSakuraBlogUrl(url) || !page) {
      return []
    }

    // Blogs on the classic engine answer over http only, as their alternate links spell it: https
    // fails the TLS handshake with a certificate that names blog.sakura.ne.jp.
    return [
      page.getFeedSpellings('posts', { scheme: 'http' }, 'rss'),
      page.getFeedEntry('posts', { scheme: 'http' }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
