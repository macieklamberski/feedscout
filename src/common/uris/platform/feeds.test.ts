import { describe, expect, it } from 'bun:test'
import { isLocale } from 'trousse'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../types.js'
import {
  definePlatformFeeds,
  hintKeys,
  type PlatformFeedTableOptions,
  withHintLabel,
} from './feeds.js'

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

    definePlatformFeeds('plurk', value)

    expect([...hintKeys]).toEqual(expect.arrayContaining(expected))
  })
})

describe('definePlatformFeeds', () => {
  it('should throw for a template without an http scheme', () => {
    const value = [{ key: 'posts', main: 'example.com/feed' }]
    const expected = 'Not a feed URL template: example.com/feed'
    const throwing = () => definePlatformFeeds('example', value)

    expect(throwing).toThrow(expected)
  })

  describe('getFeedHint', () => {
    const hintFeeds = definePlatformFeeds('youtube', [
      { key: 'shorts', main: 'https://example.com/{shop}/products.rdf', format: 'rdf' },
      { key: 'videos', main: 'https://example.com/{username}/videos.xml' },
    ])

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
    const entryFeeds = definePlatformFeeds('plurk', [
      { key: 'plurks', main: 'https://www.example.com/{username}.xml' },
      { key: 'plurks', main: 'https://www.example.com/{username}.atom', format: 'atom' },
    ])

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
    const spellingFeeds = definePlatformFeeds('wordpress', [
      { key: 'posts', main: '{root}/feed/', aliases: ['{root}/?feed=rss2'] },
      { key: 'posts', main: '{root}/feed/atom/', format: 'atom', aliases: ['{root}/?feed=atom'] },
    ])

    it('should return every spelling of the feed with its labelled hint', () => {
      const value = { root: 'https://example.com' }
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
      const value = { root: 'https://example.com' }
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

  describe('forUrl', () => {
    const pageFeeds = definePlatformFeeds('typecho', [
      { key: 'posts', main: '{root}/feed/', aliases: ['{root}/index.php/feed/'] },
      { key: 'posts', main: '{root}/feed/atom/', format: 'atom' },
    ])

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
      const page = pageFeeds.forUrl(value)

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
      const page = pageFeeds.forUrl(value)

      expect(page?.getFeedSpellings('posts')).toEqual(expected)
    })

    it('should return undefined for an unparsable URL', () => {
      const value = 'not a url'

      expect(pageFeeds.forUrl(value)).toBeUndefined()
    })
  })

  describe('options', () => {
    const expectedFull: DiscoverUriHint = {
      key: 'wordpress:posts',
      label: 'Posts',
    }

    it('should name a feed on a host of the hosts option', () => {
      const value = 'https://example.com/feed'
      const options: PlatformFeedTableOptions = { hosts: { exact: ['example.com'] } }
      const rows = [{ key: 'posts', main: 'https://{host}/feed' }]
      const feeds = definePlatformFeeds('wordpress', rows, options)

      expect(feeds.getFeedHint(value)).toEqual(expectedFull)
    })

    it('should build no feed URL for a value a check of the checks option refuses', () => {
      const value = { locale: 'abcd' }
      const options: PlatformFeedTableOptions = { checks: { locale: isLocale } }
      const rows = [{ key: 'posts', main: 'https://example.com/{locale}/feed' }]
      const feeds = definePlatformFeeds('wordpress', rows, options)

      expect(feeds.getFeedUrl('posts', value)).toBeUndefined()
    })

    it('should name a feed under another value of a parameter of the keptParams option', () => {
      const value = 'https://example.com/feed?alt=json'
      const options: PlatformFeedTableOptions = { keptParams: ['alt'] }
      const rows = [
        { key: 'posts', main: 'https://example.com/feed' },
        { key: 'posts', main: 'https://example.com/feed?alt=rss' },
      ]
      const feeds = definePlatformFeeds('wordpress', rows, options)

      expect(feeds.getFeedHint(value)).toEqual(expectedFull)
    })

    it('should name a feed with &amp; between query pairs under a mark of the lenient option', () => {
      const value = 'https://example.com/feed.ashx?id=7&amp;guid=a1b2'
      const options: PlatformFeedTableOptions = { lenient: { ampersandEntity: true } }
      const rows = [{ key: 'posts', main: 'https://example.com/feed.ashx?id={id}&guid={guid}' }]
      const feeds = definePlatformFeeds('wordpress', rows, options)

      expect(feeds.getFeedHint(value)).toEqual(expectedFull)
    })

    it('should name a feed on a tenant named www with isWwwTenant', () => {
      const value = 'https://www.example.org/feed'
      const options: PlatformFeedTableOptions = { isWwwTenant: true }
      const rows = [{ key: 'posts', main: 'https://{username}.example.org/feed' }]
      const feeds = definePlatformFeeds('wordpress', rows, options)

      expect(feeds.getFeedHint(value)).toEqual(expectedFull)
    })

    it('should name a feed on a tenant host with www with isWwwTenantPrefix', () => {
      const value = 'https://www.alice.example.org/feed'
      const options: PlatformFeedTableOptions = { isWwwTenantPrefix: true }
      const rows = [{ key: 'posts', main: 'https://{username}.example.org/feed' }]
      const feeds = definePlatformFeeds('wordpress', rows, options)

      expect(feeds.getFeedHint(value)).toEqual(expectedFull)
    })
  })
})
