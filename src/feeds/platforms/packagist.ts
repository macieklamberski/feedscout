import { packagist } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: extension-releases, new-extensions, releases, vendor.
// Handler needed for: new-packages, new-releases.

export type PackagistUrl =
  | { kind: 'package'; vendor: string; name: string }
  | { kind: 'vendor'; vendor: string }
  | { kind: 'extensions' }
  | { kind: 'home' }

const feeds = withHintLabels(packagist.feeds)

export const parsePackagistUrl = (url: string): PackagistUrl | undefined => {
  const page = packagist.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'package') {
    return { kind: 'package', vendor: page.params.vendor, name: page.params.name }
  }

  if (page.key === 'vendor') {
    return { kind: 'vendor', vendor: page.params.vendor }
  }

  if (page.key === 'extensions') {
    return { kind: 'extensions' }
  }

  return { kind: 'home' }
}

export const packagistHandler: PlatformHandler = {
  match: (url) => {
    return parsePackagistUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePackagistUrl(url)

    if (!parsed) {
      return []
    }

    // Every page gets the site-wide feeds after its own, the extension pages included, which do
    // not link them.
    if (parsed.kind === 'package') {
      const params = { vendor: parsed.vendor, name: parsed.name }

      return [
        feeds.getFeedEntry('releases', params, 'rss'),
        feeds.getFeedEntry('releases', params, 'atom'),
        feeds.getFeedEntry('new-packages', undefined, 'rss'),
        feeds.getFeedEntry('new-packages', undefined, 'atom'),
        feeds.getFeedEntry('new-releases', undefined, 'rss'),
        feeds.getFeedEntry('new-releases', undefined, 'atom'),
      ]
    }

    if (parsed.kind === 'vendor') {
      return [
        feeds.getFeedEntry('vendor', { vendor: parsed.vendor }, 'rss'),
        feeds.getFeedEntry('vendor', { vendor: parsed.vendor }, 'atom'),
        feeds.getFeedEntry('new-packages', undefined, 'rss'),
        feeds.getFeedEntry('new-packages', undefined, 'atom'),
        feeds.getFeedEntry('new-releases', undefined, 'rss'),
        feeds.getFeedEntry('new-releases', undefined, 'atom'),
      ]
    }

    if (parsed.kind === 'extensions') {
      return [
        feeds.getFeedEntry('new-extensions', undefined, 'rss'),
        feeds.getFeedEntry('new-extensions', undefined, 'atom'),
        feeds.getFeedEntry('extension-releases', undefined, 'rss'),
        feeds.getFeedEntry('extension-releases', undefined, 'atom'),
        feeds.getFeedEntry('new-packages', undefined, 'rss'),
        feeds.getFeedEntry('new-packages', undefined, 'atom'),
        feeds.getFeedEntry('new-releases', undefined, 'rss'),
        feeds.getFeedEntry('new-releases', undefined, 'atom'),
      ]
    }

    return [
      feeds.getFeedEntry('new-packages', undefined, 'rss'),
      feeds.getFeedEntry('new-packages', undefined, 'atom'),
      feeds.getFeedEntry('new-releases', undefined, 'rss'),
      feeds.getFeedEntry('new-releases', undefined, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
