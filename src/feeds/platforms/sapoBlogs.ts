import { decodeSegment, getQueryParam, parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, post, tag, tagQuery.

export type SapoBlogsUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'post'; blog: string; postId: string }
  | { kind: 'tag'; blog: string; tag: string }
export type SapoBlogsPage = SapoBlogsUrl

const domains = ['blogs.sapo.pt']

const postRegex = /^\/(?:[^/]+-(\d+)|(\d+)\.html)\/?$/i
const tagRegex = /^\/tag\/(.+?)\/?$/i

const feeds = definePlatformFeeds([
  { key: 'sapo-blogs:posts', template: 'https://{blog}.blogs.sapo.pt/data/rss', format: 'rss' },
  { key: 'sapo-blogs:posts', template: 'https://{blog}.blogs.sapo.pt/data/atom', format: 'atom' },
  { key: 'sapo-blogs:tag', template: 'https://{blog}.blogs.sapo.pt/data/rss?tag={tag}' },
  { key: 'sapo-blogs:comments', template: 'https://blogs.sapo.pt/commentsrss.bml?blog={blog}' },
  {
    key: 'sapo-blogs:post-comments',
    template: 'https://blogs.sapo.pt/commentsrss.bml?blog={blog}&ditemid={postId}',
  },
])

export const parseSapoBlogsUrl = (url: string): SapoBlogsUrl | undefined => {
  const parsedUrl = parseUrl(url)
  const blog = getTenantSubdomain(url, domains)

  if (!parsedUrl || !blog) {
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

  // The next pages of a tag listing name the tag in the query: /?skip=20&tag={tag}.
  const queryTag = pathname === '/' ? getQueryParam(parsedUrl.searchParams, 'tag') : undefined

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

  if (parsed?.kind !== 'post') {
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

    const { blog } = page
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'post') {
      uris.push(feeds.getFeedEntry('sapo-blogs:post-comments', { blog, postId: page.postId }))
    }

    if (page.kind === 'tag') {
      uris.push(feeds.getFeedEntry('sapo-blogs:tag', { blog, tag: page.tag }))
    }

    uris.push(
      feeds.getFeedEntry('sapo-blogs:posts', { blog }, 'rss'),
      feeds.getFeedEntry('sapo-blogs:posts', { blog }, 'atom'),
      feeds.getFeedEntry('sapo-blogs:comments', { blog }),
    )

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
