import { isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { domains } from '../../../feeds/platform/handlers/microblog.js'

const getUser = (url: string): string | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  const labels = parseUrl(url)?.hostname.split('.') ?? []

  // Only {user}.micro.blog names a blog, www.micro.blog serves nothing.
  if (labels.length !== 3 || labels[0] === 'www') {
    return
  }

  return labels[0]
}

export const microblogHandler: PlatformHandler = {
  match: (url) => {
    return !!getUser(url)
  },

  resolve: (url) => {
    const user = getUser(url)

    if (!user) {
      return []
    }

    return [{ uri: `https://micro.blog/${user}/avatar.jpg` }]
  },
}
