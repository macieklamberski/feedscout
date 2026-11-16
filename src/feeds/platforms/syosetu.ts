import { getPathSegments, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, formatSuffixRegex } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers author.

export type SyosetuUrl = { kind: 'writer'; writerId: string }

const hosts = ['mypage.syosetu.com']

const writerRegex = /^\/(?<writerId>[^/]+)/

const feeds = definePlatformFeeds([
  { key: 'syosetu:author', template: 'https://api.syosetu.com/writernovel/{writerId}.Atom' },
  { key: 'syosetu:activity', template: 'https://api.syosetu.com/writer/{writerId}.Atom' },
  { key: 'syosetu:all-novels', template: 'https://api.syosetu.com/allnovel.Atom' },
])

export const parseSyosetuUrl = (url: string): SyosetuUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const writerId = parsedUrl.pathname.match(writerRegex)?.groups?.writerId

  if (!writerId || !digitsRegex.test(writerId)) {
    return
  }

  return { kind: 'writer', writerId }
}

export const syosetuHandler: PlatformHandler = {
  match: (url) => {
    return parseSyosetuUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSyosetuUrl(url)

    if (!parsed) {
      return []
    }

    return [
      feeds.getFeedEntry('syosetu:author', { writerId: parsed.writerId }),
      feeds.getFeedEntry('syosetu:activity', { writerId: parsed.writerId }),
      feeds.getFeedEntry('syosetu:all-novels'),
    ]
  },

  // The page parser builds writer feeds only for a digits writer id, so a writer feed URL with
  // another id gets no key.
  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    if (hint?.key === 'syosetu:all-novels') {
      return hint
    }

    const writerId = getPathSegments(url).at(-1)?.replace(formatSuffixRegex, '')

    if (!writerId || !digitsRegex.test(writerId)) {
      return
    }

    return hint
  },
}
