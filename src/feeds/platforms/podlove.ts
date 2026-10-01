import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElements } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const pluginPath = '/podlove-podcasting-plugin-for-wordpress/'
const feedTitlePrefix = 'Podcast Feed: '

// The plugin enqueues its frontend stylesheet on every page and prints an alternate link titled
// "Podcast Feed: {podcast} ({feed})" for each discoverable feed. The owner sets every feed's slug.
const getFeedUrls = (url: string, content: string | undefined): Array<string> => {
  if (!content?.includes(pluginPath)) {
    return []
  }

  const links = findElements(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      Boolean(element.attribs.href) &&
      (element.attribs.title ?? '').startsWith(feedTitlePrefix)
    )
  })
  const feedUrls: Array<string> = []

  for (const link of links) {
    const feedUrl = parseUrl(link.attribs.href, url)

    if (feedUrl) {
      feedUrls.push(feedUrl.href)
    }
  }

  return feedUrls
}

export const podloveHandler: PlatformHandler = {
  match: (url, content) => {
    return getFeedUrls(url, content).length > 0
  },

  resolve: (url, content) => {
    return getFeedUrls(url, content).map((uri) => {
      return { uri, hint: composeHint('podlove:podcast') }
    })
  },
}
