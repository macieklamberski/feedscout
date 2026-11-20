import { podomatic } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getHostOrigin, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PodomaticUrl = { kind: 'podcast'; show: string }

const domains = podomatic.hosts.tenants

const feeds = withHintLabels(podomatic.feeds)

export const parsePodomaticUrl = (url: string): PodomaticUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains)

  if (subdomain) {
    return { kind: 'podcast', show: subdomain }
  }

  const page = podomatic.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'podcast', show: page.params.show }
}

export const podomaticHandler: PlatformHandler = {
  match: (url) => {
    return parsePodomaticUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePodomaticUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const host = `${parsed.show.toLowerCase()}.podomatic.com`

    if (!getHostOrigin(host)) {
      return []
    }

    return [page.getFeedEntry('show', { host })]
  },

  getFeedHint: feeds.getFeedHint,
}
