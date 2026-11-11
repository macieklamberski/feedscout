import { composeQuery, decodeSegment, getQueryParam, isHostOf, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  digitsRegex,
  getHostOrigin,
  getTenantSubdomain,
  wordOrHyphenRegex,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, post, tag, tagQuery.

export type SapoBlogsUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }
  | { kind: 'tag'; blog: string; tag: string }
export type SapoBlogsPage = SapoBlogsUrl

const domains = ['blogs.sapo.pt']
const commentsUrl = 'https://blogs.sapo.pt/commentsrss.bml'

const postRegex = /^\/(?:[^/]+-(\d+)|(\d+)\.html)\/?$/i
const tagRegex = /^\/tag\/(.+?)\/?$/i
const rssRegex = /^\/data\/rss\/?$/i
const commentsRegex = /^\/commentsrss\.bml$/i

export const parseSapoBlogsUrl = (url: string): SapoBlogsUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  // The comments feeds sit on the apex host and name the blog in the query.
  if (isHostOf(parsedUrl, domains)) {
    const blog = getQueryParam(parsedUrl.searchParams, 'blog')
    const postId = getQueryParam(parsedUrl.searchParams, 'ditemid')

    if (!commentsRegex.test(parsedUrl.pathname) || !blog || !wordOrHyphenRegex.test(blog)) {
      return
    }

    if (postId && digitsRegex.test(postId)) {
      return { kind: 'post', blog, postId }
    }

    return { kind: 'blog', blog }
  }

  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  const { pathname } = parsedUrl

  const postMatch = pathname.match(postRegex)
  const postId = postMatch?.[1] ?? postMatch?.[2]

  if (postId) {
    return { kind: 'post', blog, postId }
  }

  // Tag paths spell a space as a plus.
  const tag = decodeSegment(pathname.match(tagRegex)?.[1]?.replaceAll('+', ' '))

  if (tag) {
    return { kind: 'tag', blog, tag }
  }

  // The next pages of a tag listing name the tag in the query, /?skip=20&tag={tag}, as the tag
  // feed does, /data/rss?tag={tag}.
  const isTagQueryPath = pathname === '/' || rssRegex.test(pathname)
  const queryTag = isTagQueryPath ? getQueryParam(parsedUrl.searchParams, 'tag') : undefined

  if (queryTag) {
    return { kind: 'tag', blog, tag: queryTag }
  }

  return { kind: 'blog', blog }
}

export const getSapoBlogsPage = (
  url: string,
  content: string | undefined,
): SapoBlogsPage | undefined => {
  const parsed = parseSapoBlogsUrl(url)

  // A post comments feed url names its post itself.
  if (parsed?.kind !== 'post' || isHostOf(url, domains)) {
    return parsed
  }

  const postLinkRegex = new RegExp(`ditemid=${parsed.postId}(?!\\d)`)

  // The endpoint answers an empty channel for a made-up post id, so only a linked post counts.
  if (!postLinkRegex.test(content ?? '')) {
    return { kind: 'blog', blog: parsed.blog }
  }

  return parsed
}

export const sapoBlogsHandler: PlatformHandler = {
  match: (url) => {
    return parseSapoBlogsUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getSapoBlogsPage(url, content)

    if (!page) {
      return []
    }

    // A blog the comments query names with `_` is served on a host with `-`.
    const origin = isHostOf(url, domains)
      ? getHostOrigin(`${page.blog.replaceAll('_', '-')}.blogs.sapo.pt`)
      : new URL(url).origin

    if (!origin) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'post') {
      uris.push({
        uri: `${commentsUrl}${composeQuery({ blog: page.blog, ditemid: page.postId })}`,
        hint: composeHint('sapo-blogs:post-comments'),
      })
    }

    if (page.kind === 'tag') {
      uris.push({
        uri: `${origin}/data/rss${composeQuery({ tag: page.tag })}`,
        hint: composeHint('sapo-blogs:tag'),
      })
    }

    uris.push({ uri: `${origin}/data/rss`, hint: composeHint('sapo-blogs:posts', 'rss') })
    uris.push({ uri: `${origin}/data/atom`, hint: composeHint('sapo-blogs:posts', 'atom') })
    uris.push({
      uri: `${commentsUrl}${composeQuery({ blog: page.blog })}`,
      hint: composeHint('sapo-blogs:comments'),
    })

    return uris
  },
}
