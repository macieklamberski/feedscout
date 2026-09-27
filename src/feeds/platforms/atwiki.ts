import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// Legacy wwwNN.atwiki.jp hosts redirect every wiki path to w.atwiki.jp.
const hosts = ['w.atwiki.jp']

const excludedPaths = ['common']

const getWiki = (url: string): string | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [wiki] = getPathSegments(url)

  if (!wiki || isAnyOf(wiki, excludedPaths)) {
    return
  }

  return wiki
}

export const atwikiHandler: PlatformHandler = {
  match: (url) => {
    return getWiki(url) !== undefined
  },

  resolve: (url) => {
    const wiki = getWiki(url)

    if (!wiki) {
      return []
    }

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
