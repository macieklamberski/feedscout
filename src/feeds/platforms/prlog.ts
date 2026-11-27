import { prlog } from 'feedintel'
import { getPathSegments, isHostOf, isLooseMatch, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type PrlogUrl = { kind: 'pressroom'; pressroomId: string }
export type PrlogPage = PrlogUrl

const hosts = prlog.hosts.exact

const feeds = withHintLabels(prlog.feeds)

export const parsePrlogUrl = (url: string): PrlogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [pressroomId] = getPathSegments(parsedUrl)

  if (!pressroomId) {
    return
  }

  return { kind: 'pressroom', pressroomId }
}

// The pressroom id answers in any case, and the page's feed alternate spells it as registered,
// so `/door_renew/` links `/Door_Renew/latest.xml`.
export const getPrlogPage = (url: string, content: string | undefined): PrlogPage | undefined => {
  const parsed = parsePrlogUrl(url)

  if (!parsed) {
    return
  }

  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      element.attribs.type === 'application/rss+xml'
    )
  })
  const linked = parsePrlogUrl(link?.attribs.href ?? '')

  if (linked && isLooseMatch(linked.pressroomId, parsed.pressroomId)) {
    return linked
  }

  return parsed
}

export const prlogHandler: PlatformHandler = {
  match: (url) => {
    return parsePrlogUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getPrlogPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('press-releases', { pressroomId: page.pressroomId })]
  },

  getFeedHint: feeds.getFeedHint,
}
