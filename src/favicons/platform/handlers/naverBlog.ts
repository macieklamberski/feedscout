import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'

// The desktop blog.naver.com page is a frameset without og:image.
const mobileHost = 'm.blog.naver.com'

// Excludes dots to skip pages like /BlogList.naver.
const blogRegex = /^\/[^/.]+\/?$/

// A blog that does not exist carries the generic ssl.pstatic.net/static/blog/icon/og_270x270.png.
const profileImageHosts = ['blogpfthumb-phinf.pstatic.net']

export const naverBlogHandler: PlatformHandler = {
  match: (url) => {
    const parsedUrl = parseUrl(url)

    if (parsedUrl?.hostname !== mobileHost) {
      return false
    }

    return blogRegex.test(parsedUrl.pathname)
  },

  resolve: (url, content) => {
    if (!content || !naverBlogHandler.match(url)) {
      return []
    }

    const image = getMetaContent(content, 'og:image')

    if (!image || !isHostOf(image, profileImageHosts)) {
      return []
    }

    return [{ uri: image }]
  },
}
