import { isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { domains } from '../../feeds/platforms/exblog.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'exblog'

const getBlog = (url: string): string | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const labels = parseUrl(url)?.hostname.split('.') ?? []

  // Only {blog}.exblog.jp names a blog, www.exblog.jp is the portal.
  if (labels.length !== 3 || labels[0] === 'www') {
    return
  }

  return labels[0]
}

// A blog without a logo omits the meta, so no generic image reaches it.
const parseLogo = (html: string): Array<string> => {
  const logo = getMetaContent(html, 'exblog:logo_url')

  if (!logo) {
    return []
  }

  return [logo]
}

export const exblogHandler: PlatformHandler = {
  match: (url) => {
    return !!getBlog(url)
  },

  resolve: (url, content) => {
    const blog = getBlog(url)

    if (!blog) {
      return []
    }

    if (!content) {
      return [{ platform, id: blog, url }]
    }

    return parseLogo(content).map((uri) => ({ uri }))
  },
}

export const exblogEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://${ref.id}.exblog.jp/`)

  return parseLogo(getResponseText(response))
}
