import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getMetaContent } from '../../common/utils.js'
import { hosts } from '../../feeds/platforms/naverBlog.js'
import type { FaviconEnricher } from '../types.js'

const platform = 'naverBlog'

// The desktop blog.naver.com page is a frameset without og:image.
const mobileHost = 'm.blog.naver.com'

// Excludes dots to skip pages like /BlogList.naver.
const blogRegex = /^\/([^/.]+)\/?$/

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
    const parsedUrl = parseUrl(url)

    if (!parsedUrl || !isHostOf(url, hosts)) {
      return false
    }

    return blogRegex.test(parsedUrl.pathname)
  },

  resolve: (url, content) => {
    const parsedUrl = parseUrl(url)
    const blogId = parsedUrl?.pathname.match(blogRegex)?.[1]

    if (!blogId || !naverBlogHandler.match(url)) {
      return []
    }

    if (parsedUrl?.hostname !== mobileHost) {
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

  try {
    const response = await context.fetchFn(`https://${mobileHost}/${ref.id}`)

    if (typeof response.body !== 'string') {
      return []
    }

    const image = getProfileImage(response.body)

    if (image) {
      return [image]
    }
  } catch {}

  return []
}
