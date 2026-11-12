import { getSubdomain, isAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, fc2Net, numberedBlog (html), partly covers 2nt.

export type Fc2Url = { kind: 'blog' }

// A blog is one label under these domains.
const domains = ['blog.2nt.com', 'fc2.net']

const numberedSubdomainRegex = /^(?<blog>[^.]+)\.blog\d*$/i

const feeds = definePlatformFeeds(
  [
    { key: 'fc2:posts', template: '{scheme}://{host}/?xml' },
    { key: 'fc2:comments', template: '{scheme}://{host}/?xml&comment' },
    { key: 'fc2:trackbacks', template: '{scheme}://{host}/?xml&trackback' },
  ],
  { domains: [...domains, 'fc2.com'] },
)

export const parseFc2Url = (url: string): Fc2Url | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (blog) {
    return { kind: 'blog' }
  }

  // A blog on fc2.com is one label above a blog or blog{n} label.
  const numberedSubdomain = getSubdomain(url, 'fc2.com')
  const numberedBlog = numberedSubdomain?.match(numberedSubdomainRegex)?.groups?.blog

  if (numberedBlog && !isAnyOf(numberedBlog, 'www')) {
    return { kind: 'blog' }
  }
}

export const fc2Handler: PlatformHandler = {
  match: (url) => {
    return parseFc2Url(url) !== undefined
  },

  resolve: (url) => {
    if (!parseFc2Url(url)) {
      return []
    }

    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host }

    return [
      feeds.getFeedEntry('fc2:posts', params),
      feeds.getFeedEntry('fc2:comments', params),
      feeds.getFeedEntry('fc2:trackbacks', params),
    ]
  },

  // The table reads any host under fc2.com, such as web.fc2.com, so the page parser narrows it to
  // a blog host first.
  getFeedHint: (url) => {
    if (!parseFc2Url(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
