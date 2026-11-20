import { isProgrammer } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: comments, messages, posts, site.
// Handler needed for: post-comments.

export type IsProgrammerUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }

const domains = isProgrammer.hosts.tenants

const postRegex = /^\/posts\/(\d+)(?:\.html)?(?:\/|$)/i

// An unregistered name answers the sign-up page, served from the platform's own index account.
const signUpPageRegex = /\/user_files\/index\/config\/favicon\.ico"/i

const feeds = withHintLabels(isProgrammer.feeds)

export const parseIsProgrammerUrl = (url: string): IsProgrammerUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // A deeper host such as www.{blog}.is-programmer.com answers the sign-up page.
  const blog = getTenantSubdomain(parsedUrl, domains)

  if (!blog) {
    return
  }

  const postId = parsedUrl.pathname.match(postRegex)?.[1]

  if (postId) {
    return { kind: 'post', blog, postId }
  }

  return { kind: 'blog', blog }
}

export const isProgrammerHandler: PlatformHandler = {
  match: (url, content) => {
    if (content && signUpPageRegex.test(content)) {
      return false
    }

    return parseIsProgrammerUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseIsProgrammerUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // The host refuses connections on port 443, and every page links its feeds over http.
    const params = { scheme: 'http' }

    if (parsed.kind === 'post') {
      return [
        page.getFeedEntry('post-comments', { ...params, postId: parsed.postId }),
        page.getFeedEntry('posts', params),
        page.getFeedEntry('comments', params),
        page.getFeedEntry('messages', params),
        page.getFeedEntry('site', params),
      ]
    }

    return [
      page.getFeedEntry('posts', params),
      page.getFeedEntry('comments', params),
      page.getFeedEntry('messages', params),
      page.getFeedEntry('site', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
