import { getSubdomain, isAnyOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (guess, html), partly covers post.

export type IsProgrammerUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }

const domains = ['is-programmer.com']

const postRegex = /^\/posts\/(\d+)(?:\.html)?(?:\/|$)/i

// An unregistered name answers the sign-up page, served from the platform's own index account.
const signUpPageRegex = /\/user_files\/index\/config\/favicon\.ico"/

const excludedSubdomains = ['www']

export const parseIsProgrammerUrl = (url: string): IsProgrammerUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const blog = getSubdomain(parsedUrl, domains)

  // A deeper host such as www.{blog}.is-programmer.com answers the sign-up page.
  if (!blog || blog.includes('.') || isAnyOf(blog, excludedSubdomains)) {
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

    // The host refuses connections on port 443, and every page links its feeds over http.
    const origin = `http://${parsed.blog}.is-programmer.com`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'post') {
      uris.push({
        uri: `${origin}/posts/${parsed.postId}.rss`,
        hint: composeHint('is-programmer:post-comments'),
      })
    }

    uris.push({ uri: `${origin}/posts.rss`, hint: composeHint('is-programmer:posts') })
    uris.push({ uri: `${origin}/comments.rss`, hint: composeHint('is-programmer:comments') })
    uris.push({ uri: `${origin}/messages.rss`, hint: composeHint('is-programmer:messages') })

    return uris
  },
}
