import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.
//
// Joomla turns a list view into a feed by giving it a `.feed` suffix and a
// `type` parameter. It emits both alternates by default, so the handler exists
// to resolve them without a page fetch.
//
// The suffix form is used rather than `?format=feed`, because a search-engine
// friendly path ends in `.html` and answers that query with the HTML page.
//
// Only list views produce a feed. A non-list view answers 404 as
// `application/xml` with an `<error>` root, so the content type never proves a
// hit on its own.

const viewSuffixRegex = /(?:\.html)?\/?$/

export const isJoomlaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Joomla!')
}

export const joomlaHandler: PlatformHandler = {
  match: (url, content) => {
    return URL.canParse(url) && Boolean(content) && isJoomlaHtml(content ?? '')
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const viewUrl = `${origin}${pathname}`.replace(viewSuffixRegex, '')

      return [
        {
          uri: `${viewUrl}.feed?type=rss`,
          hint: composeHint('joomla:view-rss'),
        },
        {
          uri: `${viewUrl}.feed?type=atom`,
          hint: composeHint('joomla:view-atom'),
        },
      ]
    } catch {}

    return []
  },
}
