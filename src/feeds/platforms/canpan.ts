import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type CanpanUrl = { kind: 'blog'; blog: string }

const hosts = ['blog.canpan.info']

// Asset and service paths on the blog host, none of them a blog.
const excludedPaths = [
  '_common',
  '_contents',
  '_images_e',
  '_pages',
  'css',
  'img',
  'js',
  'tb',
  'template',
]

export const parseCanpanUrl = (url: string): CanpanUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [blog] = getPathSegments(url)

  if (!blog || isAnyOf(blog, excludedPaths)) {
    return
  }

  return { kind: 'blog', blog: blog.toLowerCase() }
}

export const canpanHandler: PlatformHandler = {
  match: (url) => {
    return parseCanpanUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseCanpanUrl(url)

    if (!parsed) {
      return []
    }

    const { blog } = parsed

    return [
      {
        uri: `https://blog.canpan.info/${blog}/index2_0.xml`,
        hint: composeHint('canpan:posts', 'rss'),
      },
      {
        uri: `https://blog.canpan.info/${blog}/index1_0.rdf`,
        hint: composeHint('canpan:posts', 'rdf'),
      },
    ]
  },
}
