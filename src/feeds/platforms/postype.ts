import { postype } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// A channel subdomain redirects to www.postype.com/@{channel}.
export type PostypeUrl =
  | { kind: 'channel'; channel: string }
  | { kind: 'post'; channel: string }
  | { kind: 'subdomain'; channel: string }

const domains = postype.hosts.tenants

const feeds = withHintLabels(postype.feeds)

export const parsePostypeUrl = (url: string): PostypeUrl | undefined => {
  const page = postype.pages.read(url)

  if (page?.key === 'post') {
    return { kind: 'post', channel: page.params.channel }
  }

  if (page) {
    return { kind: 'channel', channel: page.params.channel }
  }

  const subdomain = getTenantSubdomain(url, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'subdomain', channel: subdomain }
}

export const postypeHandler: PlatformHandler = {
  match: (url) => {
    return parsePostypeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePostypeUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'subdomain') {
      const page = feeds.forUrl(url)

      if (!page) {
        return []
      }

      return [page.getFeedEntry('posts')]
    }

    return [feeds.getFeedEntry('posts', { channel: parsed.channel })]
  },

  getFeedHint: feeds.getFeedHint,
}
