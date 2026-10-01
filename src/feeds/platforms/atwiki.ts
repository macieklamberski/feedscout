import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type AtwikiUrl = { kind: 'wiki'; wiki: string }

// Legacy wwwNN.atwiki.jp hosts redirect every wiki path to w.atwiki.jp.
const hosts = ['w.atwiki.jp']

const excludedPaths = ['common']

export const parseAtwikiUrl = (url: string): AtwikiUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [wiki] = getPathSegments(url)

  if (!wiki || isAnyOf(wiki, excludedPaths)) {
    return
  }

  return { kind: 'wiki', wiki }
}

export const atwikiHandler: PlatformHandler = {
  match: (url) => {
    return parseAtwikiUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAtwikiUrl(url)

    if (!parsed) {
      return []
    }

    const { wiki } = parsed

    return [
      {
        uri: `https://w.atwiki.jp/${wiki}/rss10.xml`,
        hint: composeHint('atwiki:updated-pages', 'rdf'),
      },
      {
        uri: `https://w.atwiki.jp/${wiki}/feed.atom`,
        hint: composeHint('atwiki:updated-pages', 'atom'),
      },
      {
        uri: `https://w.atwiki.jp/${wiki}/rss10_new.xml`,
        hint: composeHint('atwiki:new-pages', 'rdf'),
      },
    ]
  },
}
