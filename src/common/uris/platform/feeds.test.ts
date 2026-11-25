import { describe, expect, it } from 'bun:test'
import { defineFeedUrls } from 'feedintel'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../types.js'
import { hintKeys, withHintLabel, withHintLabels } from './feeds.js'

describe('withHintLabel', () => {
  it('should add the label to a hint', () => {
    const value = { key: 'plurk:plurks' }
    const expected: DiscoverUriHint = {
      key: 'plurk:plurks',
      label: 'Plurks',
    }

    expect(withHintLabel(value)).toEqual(expected)
  })

  it('should return undefined for undefined', () => {
    const value = undefined

    expect(withHintLabel(value)).toBeUndefined()
  })
})

describe('hintKeys', () => {
  it('should hold the hint key of every feed of a defined table', () => {
    const value = [
      { key: 'plurks', main: 'https://www.example.com/{username}.xml' },
      { key: 'responses', main: 'https://www.example.com/{username}/responses.xml' },
    ]
    const expected = ['plurk:plurks', 'plurk:responses']

    withHintLabels(defineFeedUrls('plurk', value))

    expect([...hintKeys]).toEqual(expect.arrayContaining(expected))
  })
})

describe('withHintLabels', () => {
  describe('getFeedHint', () => {
    const hintFeeds = withHintLabels(
      defineFeedUrls('youtube', [
        { key: 'shorts', main: 'https://example.com/{shop}/products.rdf', format: 'rdf' },
        { key: 'videos', main: 'https://example.com/{username}/videos.xml' },
      ]),
    )

    it('should return the labelled hint of a feed whose row names a format', () => {
      const value = 'https://example.com/alice/products.rdf'
      const expected: DiscoverUriHint = {
        key: 'youtube:shorts',
        label: 'Shorts',
        format: 'rdf',
      }

      expect(hintFeeds.getFeedHint(value)).toEqual(expected)
    })

    it('should return the labelled hint of a feed whose row names no format', () => {
      const value = 'https://example.com/alice/videos.xml'
      const expected: DiscoverUriHint = {
        key: 'youtube:videos',
        label: 'Videos',
      }

      expect(hintFeeds.getFeedHint(value)).toEqual(expected)
    })

    it('should return undefined for a URL no row reads', () => {
      const value = 'https://example.com/alice'

      expect(hintFeeds.getFeedHint(value)).toBeUndefined()
    })
  })

  describe('getFeedEntry', () => {
    const entryFeeds = withHintLabels(
      defineFeedUrls('plurk', [
        { key: 'plurks', main: 'https://www.example.com/{username}.xml' },
        { key: 'plurks', main: 'https://www.example.com/{username}.atom', format: 'atom' },
      ]),
    )

    it('should return the feed with its labelled hint', () => {
      const value = { username: 'alice' }
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.xml',
        hint: {
          key: 'plurk:plurks',
          label: 'Plurks',
        },
      }

      expect(entryFeeds.getFeedEntry('plurks', value)).toEqual(expected)
    })

    it('should return the feed of the format with the format in its labelled hint', () => {
      const value = { username: 'alice' }
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.atom',
        hint: {
          key: 'plurk:plurks',
          label: 'Plurks',
          format: 'atom',
        },
      }

      expect(entryFeeds.getFeedEntry('plurks', value, 'atom')).toEqual(expected)
    })

    it('should return undefined for a placeholder with no value', () => {
      const value = {}

      expect(entryFeeds.getFeedEntry('plurks', value)).toBeUndefined()
    })
  })

  describe('getFeedSpellings', () => {
    const spellingFeeds = withHintLabels(
      defineFeedUrls('wordpress', [
        {
          key: 'posts',
          main: '{scheme}://{host}{/base*}/feed/',
          aliases: ['{scheme}://{host}{/base*}/?feed=rss2'],
        },
        {
          key: 'posts',
          main: '{scheme}://{host}{/base*}/feed/atom/',
          format: 'atom',
          aliases: ['{scheme}://{host}{/base*}/?feed=atom'],
        },
      ]),
    )

    it('should return every spelling of the feed with its labelled hint', () => {
      const value = {
        scheme: 'https',
        host: 'example.com',
      }
      const expected: DiscoverUriEntry = {
        uri: ['https://example.com/feed/', 'https://example.com/?feed=rss2'],
        hint: {
          key: 'wordpress:posts',
          label: 'Posts',
        },
      }

      expect(spellingFeeds.getFeedSpellings('posts', value)).toEqual(expected)
    })

    it('should return the spellings of the format with the format in its labelled hint', () => {
      const value = {
        scheme: 'https',
        host: 'example.com',
      }
      const expected: DiscoverUriEntry = {
        uri: ['https://example.com/feed/atom/', 'https://example.com/?feed=atom'],
        hint: {
          key: 'wordpress:posts',
          label: 'Posts',
          format: 'atom',
        },
      }

      expect(spellingFeeds.getFeedSpellings('posts', value, 'atom')).toEqual(expected)
    })

    it('should return undefined when the values fill no row of the key', () => {
      const value = {}

      expect(spellingFeeds.getFeedSpellings('posts', value)).toBeUndefined()
    })
  })

  describe('forSite', () => {
    const pageFeeds = withHintLabels(
      defineFeedUrls('typecho', [
        {
          key: 'posts',
          main: '{scheme}://{host}{/base*}/feed/',
          aliases: ['{scheme}://{host}{/base*}/index.php/feed/'],
        },
        { key: 'posts', main: '{scheme}://{host}{/base*}/feed/atom/', format: 'atom' },
      ]),
    )

    it('should return the feed of a page with its labelled hint', () => {
      const value = 'https://example.com/archives/13/'
      const expected: DiscoverUriEntry = {
        uri: 'https://example.com/feed/atom/',
        hint: {
          key: 'typecho:posts',
          label: 'Posts',
          format: 'atom',
        },
      }
      const page = pageFeeds.forSite(value)

      expect(page?.getFeedEntry('posts', {}, 'atom')).toEqual(expected)
    })

    it('should return every spelling of the feed of a page with its labelled hint', () => {
      const value = 'https://example.com/archives/13/'
      const expected: DiscoverUriEntry = {
        uri: ['https://example.com/feed/', 'https://example.com/index.php/feed/'],
        hint: {
          key: 'typecho:posts',
          label: 'Posts',
        },
      }
      const page = pageFeeds.forSite(value)

      expect(page?.getFeedSpellings('posts')).toEqual(expected)
    })

    it('should return undefined for an unparsable URL', () => {
      const value = 'not a url'

      expect(pageFeeds.forSite(value)).toBeUndefined()
    })
  })
})
