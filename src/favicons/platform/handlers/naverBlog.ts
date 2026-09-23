import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { getMetaContent } from '../../../common/utils.js'
import { hosts } from '../../../feeds/platform/handlers/naverBlog.js'

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

  // The desktop blog page is a frameset without og:image, so its profile picture comes from
  // the mobile page.
  resolve: async (url, content, _headers, fetchFn) => {
    try {
      const { hostname, pathname } = new URL(url)
      const blogId = pathname.match(blogRegex)?.[1]

      if (!blogId) {
        return []
      }

      let page = hostname === mobileHost ? content : undefined

      if (!page && fetchFn) {
        const response = await fetchFn(`https://${mobileHost}/${blogId}`)
        page = typeof response.body === 'string' ? response.body : undefined
      }

      if (!page) {
        return []
      }

      const image = getProfileImage(page)

      if (image) {
        return [{ uri: image }]
      }
    } catch {}

    return []
  },
}
