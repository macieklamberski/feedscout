import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { parseExblogUrl } from '../../feeds/platforms/exblog.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'exblog'

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
    return parseExblogUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const blog = parseExblogUrl(url)?.blog

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
