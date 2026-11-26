import { atypon } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Unmeasured, bot wall.

export type AtyponUrl = { kind: 'journal'; code: string; isWiley: boolean }

const hosts = atypon.hosts.exact
const mostCitedHosts = ['onlinelibrary.wiley.com']

const journalRegex = /^\/(?:toc|journals?|loi|home)\/(\w+)(?:\/|$)/i

const feeds = withHintLabels(atypon.feeds)

export const parseAtyponUrl = (url: string): AtyponUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const code = pathname.match(journalRegex)?.[1]

  if (!code) {
    return
  }

  return { kind: 'journal', code, isWiley: isHostOf(url, mostCitedHosts) }
}

export const atyponHandler: PlatformHandler = {
  match: (url) => {
    return parseAtyponUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAtyponUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.isWiley) {
      return [
        page.getFeedEntry('journal', { code: parsed.code }, 'rss'),
        page.getFeedEntry('ahead-of-print', { code: parsed.code }, 'rdf'),
        page.getFeedEntry('most-cited', { code: parsed.code }, 'rss'),
      ]
    }

    return [
      page.getFeedEntry('journal', { code: parsed.code }, 'rdf'),
      page.getFeedEntry('ahead-of-print', { code: parsed.code }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
