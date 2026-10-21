import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, fc2Net, numberedBlog (html), partly covers 2nt.

export type Fc2Url = { kind: 'blog' }

// A blog is one label under these domains.
const domains = ['blog.2nt.com', 'fc2.net']

const numberedSubdomainRegex = /^(?<blog>[^.]+)\.blog\d*$/i

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

    const { origin } = new URL(url)

    return [
      { uri: `${origin}/?xml`, hint: composeHint('fc2:posts') },
      { uri: `${origin}/?xml&comment`, hint: composeHint('fc2:comments') },
      { uri: `${origin}/?xml&trackback`, hint: composeHint('fc2:trackbacks') },
    ]
  },
}
