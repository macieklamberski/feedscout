import { medium } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: publication.
// Handler needed for: tag.

export type MediumUrl =
  | { kind: 'user'; username: string }
  | { kind: 'tag'; tag: string }
  | { kind: 'publication'; publication: string; tag?: string }
  | { kind: 'subdomain'; subdomain: string; tag?: string }

const domains = medium.hosts.tenants
export const hosts = medium.hosts.exact

const feeds = withHintLabels(medium.feeds)

export const parseMediumUrl = (url: string): MediumUrl | undefined => {
  const page = medium.pages.read(url)

  if (!page) {
    return
  }

  const { username, tag, publication } = page.params

  if (page.key === 'user') {
    return { kind: 'user', username }
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag }
  }

  if (page.key === 'publication') {
    return { kind: 'publication', publication, tag }
  }

  const subdomain = getTenantSubdomain(url, domains)

  if (!subdomain) {
    return
  }

  return { kind: 'subdomain', subdomain, tag }
}

export const mediumHandler: PlatformHandler = {
  match: (url) => {
    return parseMediumUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseMediumUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('posts', { username: parsed.username })]
    }

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('tag', { tag: parsed.tag })]
    }

    if (parsed.kind === 'publication' && parsed.tag) {
      const params = { publication: parsed.publication, tag: parsed.tag }

      return [feeds.getFeedEntry('tagged', params)]
    }

    if (parsed.kind === 'publication') {
      return [feeds.getFeedEntry('publication', { publication: parsed.publication })]
    }

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    if (parsed.tag) {
      return [page.getFeedEntry('tagged', { tag: parsed.tag })]
    }

    return [page.getFeedEntry('publication')]
  },

  getFeedHint: feeds.getFeedHint,
}
