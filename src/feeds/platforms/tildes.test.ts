import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { parseTildesUrl, type TildesUrl, tildesHandler } from './tildes.js'

describe('parseTildesUrl', () => {
  it('should return the group for a group page', () => {
    const expected: TildesUrl = { kind: 'group', group: 'comp', tag: undefined }

    expect(parseTildesUrl('https://tildes.net/~comp')).toEqual(expected)
  })

  it('should return the group with its tag', () => {
    const expected: TildesUrl = { kind: 'group', group: 'comp', tag: 'python' }

    expect(parseTildesUrl('https://tildes.net/~comp?tag=python')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: TildesUrl = { kind: 'home', tag: undefined }

    expect(parseTildesUrl('https://tildes.net/')).toEqual(expected)
  })

  it('should read another page as the home page', () => {
    const expected: TildesUrl = { kind: 'home' }

    expect(parseTildesUrl('https://tildes.net/groups')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseTildesUrl('https://example.com/~comp')).toBeUndefined()
  })
})

describe('tildesHandler', () => {
  describe('match', () => {
    const values: Array<[boolean, string]> = [
      [true, 'https://tildes.net/~tech'],
      [true, 'https://www.tildes.net/~science'],
      [true, 'https://tildes.net'],
      [false, 'https://example.com'],
    ]

    it.each(values)('should return %s for %s', (expected, url) => {
      expect(tildesHandler.match(url)).toBe(expected)
    })

    it('should return false for invalid URL', () => {
      expect(tildesHandler.match('not-a-url')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside Tildes', () => {
      expect(tildesHandler.resolve('https://example.com/')).toEqual([])
    })

    it('should return RSS and Atom feeds for group', () => {
      const value = 'https://tildes.net/~tech'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/~tech/topics.rss',
          hint: { key: 'tildes:group', label: 'Group', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom',
          hint: { key: 'tildes:group', label: 'Group', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return group feeds regardless of subpath', () => {
      const value = 'https://tildes.net/~tech/some-topic'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/~tech/topics.rss',
          hint: { key: 'tildes:group', label: 'Group', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom',
          hint: { key: 'tildes:group', label: 'Group', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should return global topics feeds for root path', () => {
      const value = 'https://tildes.net/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/topics.rss',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/topics.atom',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through tag query on group feeds', () => {
      const value = 'https://tildes.net/~tech?tag=programming'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/~tech/topics.rss?tag=programming',
          hint: { key: 'tildes:group', label: 'Group', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/~tech/topics.atom?tag=programming',
          hint: { key: 'tildes:group', label: 'Group', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })

    it('should pass through tag query on global topics feeds', () => {
      const value = 'https://tildes.net/?tag=programming'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://tildes.net/topics.rss?tag=programming',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'rss' },
        },
        {
          uri: 'https://tildes.net/topics.atom?tag=programming',
          hint: { key: 'tildes:topics', label: 'Topics', format: 'atom' },
        },
      ]

      expect(tildesHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the group hint for a group RSS feed', () => {
      const value = 'https://tildes.net/~example/topics.rss'
      const expected: DiscoverUriHint = { key: 'tildes:group', label: 'Group', format: 'rss' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group hint for a group Atom feed', () => {
      const value = 'https://tildes.net/~example/topics.atom'
      const expected: DiscoverUriHint = { key: 'tildes:group', label: 'Group', format: 'atom' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group hint for a group feed with a tag', () => {
      const value = 'https://tildes.net/~example/topics.rss?tag=example'
      const expected: DiscoverUriHint = { key: 'tildes:group', label: 'Group', format: 'rss' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group hint for a group feed with another order', () => {
      const value = 'https://tildes.net/~example/topics.atom?order=activity&period=30d'
      const expected: DiscoverUriHint = { key: 'tildes:group', label: 'Group', format: 'atom' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group hint for a subgroup feed', () => {
      const value = 'https://tildes.net/~example.sub/topics.atom'
      const expected: DiscoverUriHint = { key: 'tildes:group', label: 'Group', format: 'atom' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the topics hint for the RSS feed', () => {
      const value = 'https://tildes.net/topics.rss'
      const expected: DiscoverUriHint = { key: 'tildes:topics', label: 'Topics', format: 'rss' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the topics hint for the Atom feed', () => {
      const value = 'https://tildes.net/topics.atom'
      const expected: DiscoverUriHint = { key: 'tildes:topics', label: 'Topics', format: 'atom' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the topics hint for a topics feed with a tag', () => {
      const value = 'https://tildes.net/topics.atom?tag=example'
      const expected: DiscoverUriHint = { key: 'tildes:topics', label: 'Topics', format: 'atom' }

      expect(tildesHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a group page', () => {
      const value = 'https://tildes.net/~example'

      expect(tildesHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a topic page', () => {
      const value = 'https://tildes.net/~example/1abc/example_topic'

      expect(tildesHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed path on another host', () => {
      const value = 'https://example.com/~example/topics.rss'

      expect(tildesHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('discoverUrisFromPlatform', () => {
    const values: Array<[string, DiscoverUriEntry['hint']]> = [
      [
        'http://tildes.net/~example/topics.rss',
        { key: 'tildes:group', label: 'Group', format: 'rss' },
      ],
      [
        'https://www.tildes.net/~example/topics.atom/',
        { key: 'tildes:group', label: 'Group', format: 'atom' },
      ],
      [
        'https://tildes.net/~example/topics.atom?tag=example',
        { key: 'tildes:group', label: 'Group', format: 'atom' },
      ],
      [
        'http://www.tildes.net/topics.rss',
        { key: 'tildes:topics', label: 'Topics', format: 'rss' },
      ],
      [
        'https://tildes.net/topics.atom/',
        { key: 'tildes:topics', label: 'Topics', format: 'atom' },
      ],
      [
        'https://tildes.net/topics.rss?tag=example',
        { key: 'tildes:topics', label: 'Topics', format: 'rss' },
      ],
    ]

    it.each(values)('should return %s as itself', async (value, hint) => {
      const options = {
        ...defaultPlatformOptions,
        handlers: [tildesHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
