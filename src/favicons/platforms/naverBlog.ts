import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { parseNaverBlogUrl } from '../../feeds/platforms/naverBlog.js'
import type { FaviconEnricher } from '../types.js'
import { getResponseText } from '../utils.js'

const platform = 'naverBlog'

// The desktop blog.naver.com page is a frameset without og:image.
const mobileHost = 'm.blog.naver.com'

// A blog that does not exist carries the generic ssl.pstatic.net/static/blog/icon/og_270x270.png.
const profileImageHosts = ['blogpfthumb-phinf.pstatic.net']

const getProfileImage = (content: string): string | undefined => {
  const image = getMetaContent(content, 'og:image')

  if (!image || !isHostOf(image, profileImageHosts)) {
    return
  }

  return image
}

export const naverBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseNaverBlogUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const blogId = parseNaverBlogUrl(url)?.blogId

    if (!blogId) {
      return []
    }

    // A post page carries the post image, not the profile image.
    if (!isHostOf(url, mobileHost) || getPathSegments(url).length > 1) {
      return [{ platform, id: blogId, url }]
    }

    if (!content) {
      return []
    }

    const image = getProfileImage(content)

    if (!image) {
      return []
    }

    return [{ uri: image }]
  },
}

export const naverBlogEnricher: FaviconEnricher = async (ref, context) => {
  if (ref.platform !== platform) {
    return
  }

  const response = await context.fetchFn(`https://${mobileHost}/${ref.id}`)
  const image = getProfileImage(getResponseText(response))

  if (image) {
    return [image]
  }

  return []
}
