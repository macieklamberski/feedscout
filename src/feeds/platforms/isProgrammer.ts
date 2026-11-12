import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
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

// The host refuses connections on port 443, and every page links its feeds over http.
const feeds = definePlatformFeeds([
  {
    key: 'is-programmer:post-comments',
    template: 'http://{blog}.is-programmer.com/posts/{postId}.rss',
  },
  { key: 'is-programmer:posts', template: 'http://{blog}.is-programmer.com/posts.rss' },
  { key: 'is-programmer:posts', template: 'http://{blog}.is-programmer.com/feed' },
  { key: 'is-programmer:posts', template: 'http://{blog}.is-programmer.com/feed.rss' },
  { key: 'is-programmer:posts', template: 'http://{blog}.is-programmer.com/rss' },
  { key: 'is-programmer:posts', template: 'http://{blog}.is-programmer.com/?format=rss' },
  { key: 'is-programmer:comments', template: 'http://{blog}.is-programmer.com/comments.rss' },
  { key: 'is-programmer:messages', template: 'http://{blog}.is-programmer.com/messages.rss' },
  { key: 'is-programmer:site', template: 'http://{blog}.is-programmer.com/site.rss' },
])

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

    if (!parsed) {
      return []
    }

    const params = { blog: parsed.blog }
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'post') {
      uris.push(
        feeds.getFeedEntry('is-programmer:post-comments', { ...params, postId: parsed.postId }),
      )
    }

    uris.push(
      feeds.getFeedEntry('is-programmer:posts', params),
      feeds.getFeedEntry('is-programmer:comments', params),
      feeds.getFeedEntry('is-programmer:messages', params),
      feeds.getFeedEntry('is-programmer:site', params),
    )

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
