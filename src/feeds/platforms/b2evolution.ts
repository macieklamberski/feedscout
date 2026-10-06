import type { DiscoverUriEntry } from '../../common/types.js'
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

const assetRegex = /\/rsc\/(?:build|css|js)\//
const sessionCookieRegex = /^session_b2evo(?:__.+)?$/
const blogFeedHrefRegex = /^(.*[?&])tempskin=_(?:rss2|atom)$/
const blogCommentsHrefRegex = /^(.*[?&])tempskin=_(?:rss2|atom)&disp=comments$/
const postCommentsHrefRegex = /[?&]tempskin=_rss2&disp=comments&p=\d+$/
const notFoundClassRegex = /\b(?:disp_404|error_404)\b/

export type B2evolutionPage =
  | { kind: 'blog'; feedPrefix: string }
  | { kind: 'post'; feedPrefix: string; postCommentsUrl: string }

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

  if (!feedPrefix) {
    return
  }

  // Some installs build the post comments feed on the post url, others on the blog url.
  const postCommentsUrl = findHref(content, 'a', postCommentsHrefRegex)

  if (postCommentsUrl) {
    return { kind: 'post', feedPrefix, postCommentsUrl }
  }

  return { kind: 'blog', feedPrefix }
}

export const b2evolutionHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    if (!hasMarker(content, headers, { html: isB2evolutionHtml, headers: isB2evolutionHeaders })) {
      return false
    }

    return getB2evolutionPage(content) !== undefined
  },

  resolve: (_url, content) => {
    const page = getB2evolutionPage(content)

    if (!page) {
      return []
    }

    const { feedPrefix } = page
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'post') {
      uris.push({ uri: page.postCommentsUrl, hint: composeHint('b2evolution:post-comments') })
    }

    uris.push(
      { uri: `${feedPrefix}tempskin=_rss2`, hint: composeHint('b2evolution:posts', 'rss') },
      { uri: `${feedPrefix}tempskin=_atom`, hint: composeHint('b2evolution:posts', 'atom') },
      {
        uri: `${feedPrefix}tempskin=_rss2&disp=comments`,
        hint: composeHint('b2evolution:comments', 'rss'),
      },
      {
        uri: `${feedPrefix}tempskin=_atom&disp=comments`,
        hint: composeHint('b2evolution:comments', 'atom'),
      },
    )

    return uris
  },
}
