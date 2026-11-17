import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  findElement,
  getCookieNames,
  hasMarker,
  hasMetaContent,
} from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, post.

const assetRegex = /\/rsc\/(?:build|css|js)\//i
const sessionCookieRegex = /^session_b2evo(?:__.+)?$/
const blogFeedHrefRegex = /^(.*[?&])tempskin=_(?:rss2|atom)$/i
const blogCommentsHrefRegex = /^(.*[?&])tempskin=_(?:rss2|atom)&disp=comments$/i
const postCommentsHrefRegex = /[?&]tempskin=_rss2&disp=comments&p=\d+$/i
const notFoundClassRegex = /\b(?:disp_404|error_404)\b/
// A feed link up to its skin, as `/index.php?blog=2&`, is the blog's root and the query naming it.
const feedPrefixRegex = /^([^?]*)\?(.*)$/

// An install runs on its own domain and is known only by its marker, so its feeds are built here
// but not claimed. A feed is the blog's feed link with another skin.
const feeds = definePlatformFeeds([
  { key: 'b2evolution:posts', main: '{root}?{query}&tempskin=_rss2', format: 'rss' },
  { key: 'b2evolution:posts', main: '{root}?{query}&tempskin=_atom', format: 'atom' },
  {
    key: 'b2evolution:comments',
    main: '{root}?{query}&tempskin=_rss2&disp=comments',
    format: 'rss',
  },
  {
    key: 'b2evolution:comments',
    main: '{root}?{query}&tempskin=_atom&disp=comments',
    format: 'atom',
  },
])

export type B2evolutionPage =
  | { kind: 'blog'; feedRoot: string; feedQuery: string }
  | { kind: 'post'; feedRoot: string; feedQuery: string; postCommentsUrl: string }

// Core scripts and styles load from the install's `rsc` directory whatever the skin.
// Some installs before 4.1 load none from there, and kowsarblog.ir renames the generator.
export const isB2evolutionHtml = (content: string): boolean => {
  return assetRegex.test(content) || hasMetaContent(content, 'generator', 'b2evolution')
}

// A shared install names the cookie per site, as `session_b2evo__{site}`.
export const isB2evolutionHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).some((name) => sessionCookieRegex.test(name))
}

const findHref = (content: string | undefined, name: string, regex: RegExp): string | undefined => {
  const found = findElement(content, (element) => {
    return element.name === name && regex.test(element.attribs.href ?? '')
  })

  return found?.attribs.href
}

// The blog comes from the page, since an unknown blog path answers with the default blog's feeds.
// Newer skins drop the alternate links and keep only the feed widget, whose comments anchor names
// the blog where a category anchor beside it names a category feed.
const getB2evolutionPage = (content: string | undefined): B2evolutionPage | undefined => {
  // An unknown blog path answers 404 with the default blog's layout and feed links.
  const notFoundElement = findElement(content, (element) => {
    return notFoundClassRegex.test(element.attribs.class ?? '')
  })

  if (notFoundElement) {
    return
  }

  const alternateHref = findHref(content, 'link', blogFeedHrefRegex)
  const commentsHref = findHref(content, 'a', blogCommentsHrefRegex)
  const feedPrefix =
    alternateHref?.match(blogFeedHrefRegex)?.[1] ?? commentsHref?.match(blogCommentsHrefRegex)?.[1]
  const [, feedRoot, feedQuery] = feedPrefix?.match(feedPrefixRegex) ?? []

  if (feedRoot === undefined || feedQuery === undefined) {
    return
  }

  // Some installs build the post comments feed on the post url, others on the blog url.
  const postCommentsUrl = findHref(content, 'a', postCommentsHrefRegex)

  if (postCommentsUrl) {
    return { kind: 'post', feedRoot, feedQuery, postCommentsUrl }
  }

  return { kind: 'blog', feedRoot, feedQuery }
}

export const b2evolutionHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    if (!hasMarker(content, headers, { html: isB2evolutionHtml, headers: isB2evolutionHeaders })) {
      return false
    }

    return getB2evolutionPage(content) !== undefined
  },

  resolve: (url, content) => {
    const page = getB2evolutionPage(content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    // The table drops one trailing slash from a root, so a root ending in one keeps it.
    const params = { root: `${page.feedRoot}/`, query: page.feedQuery }

    if (page.kind === 'post') {
      return [
        { uri: page.postCommentsUrl, hint: composeHint('b2evolution:post-comments') },
        pageFeeds.getFeedEntry('b2evolution:posts', params, 'rss'),
        pageFeeds.getFeedEntry('b2evolution:posts', params, 'atom'),
        pageFeeds.getFeedEntry('b2evolution:comments', params, 'rss'),
        pageFeeds.getFeedEntry('b2evolution:comments', params, 'atom'),
      ]
    }

    return [
      pageFeeds.getFeedEntry('b2evolution:posts', params, 'rss'),
      pageFeeds.getFeedEntry('b2evolution:posts', params, 'atom'),
      pageFeeds.getFeedEntry('b2evolution:comments', params, 'rss'),
      pageFeeds.getFeedEntry('b2evolution:comments', params, 'atom'),
    ]
  },
}
