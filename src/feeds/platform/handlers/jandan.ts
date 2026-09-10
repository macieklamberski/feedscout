import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Partially discoverable without handler.
//
// Jandan runs WordPress but blocks `/feed` with a 403 from its WAF, leaving
// the query-string routes as the only way in. Generic guessing reaches
// `/rss`, which serves RSS 0.92 with no `pubDate` or `dc:creator` on an
// item. The `?feed=rss2` and `?feed=atom` routes carry both.

const hosts = ['jandan.net', 'i.jandan.net']
const postRegex = /^\/p\/([a-zA-Z0-9]+)/

export const jandanHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const postMatch = pathname.match(postRegex)

    if (postMatch?.[1]) {
      return [
        {
          uri: `https://jandan.net/p/${postMatch[1]}/feed`,
          hint: composeHint('jandan:comments'),
        },
      ]
    }

    return [
      {
        uri: 'https://jandan.net/?feed=rss2',
        hint: composeHint('jandan:posts-rss'),
      },
      {
        uri: 'https://jandan.net/?feed=atom',
        hint: composeHint('jandan:posts-atom'),
      },
    ]
  },
}
