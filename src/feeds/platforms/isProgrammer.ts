import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (guess, html), partly covers post.

export type IsProgrammerUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }

const domains = ['is-programmer.com']

const postRegex = /^\/posts\/(\d+)(?:\.html)?(?:\/|$)/i

// An unregistered name answers the sign-up page, served from the platform's own index account.
const signUpPageRegex = /\/user_files\/index\/config\/favicon\.ico"/i

const feeds = definePlatformFeeds(
  [
    {
      key: 'is-programmer:post-comments',
      template: '{scheme}://{host}/posts/{postId}.rss',
    },
    { key: 'is-programmer:posts', template: '{scheme}://{host}/posts.rss' },
    { key: 'is-programmer:posts', template: '{scheme}://{host}/feed' },
    { key: 'is-programmer:posts', template: '{scheme}://{host}/feed.rss' },
    { key: 'is-programmer:posts', template: '{scheme}://{host}/rss' },
    { key: 'is-programmer:posts', template: '{scheme}://{host}/?format=rss' },
    { key: 'is-programmer:comments', template: '{scheme}://{host}/comments.rss' },
    { key: 'is-programmer:messages', template: '{scheme}://{host}/messages.rss' },
    { key: 'is-programmer:site', template: '{scheme}://{host}/site.rss' },
  ],
  { domains },
)

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
        page.getFeedEntry('is-programmer:post-comments', { ...params, postId: parsed.postId }),
        page.getFeedEntry('is-programmer:posts', params),
        page.getFeedEntry('is-programmer:comments', params),
        page.getFeedEntry('is-programmer:messages', params),
        page.getFeedEntry('is-programmer:site', params),
      ]
    }

    return [
      page.getFeedEntry('is-programmer:posts', params),
      page.getFeedEntry('is-programmer:comments', params),
      page.getFeedEntry('is-programmer:messages', params),
      page.getFeedEntry('is-programmer:site', params),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
