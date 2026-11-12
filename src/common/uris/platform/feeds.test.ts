import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../types.js'
import { definePlatformFeeds } from './feeds.js'

const feeds = definePlatformFeeds(
  [
    { key: 'example:posts', template: 'https://www.example.com/{username}/feed.rss' },
    {
      key: 'example:posts',
      template: 'https://www.example.com/{username}/feed.atom',
      format: 'atom',
    },
    { key: 'example:board', template: 'https://www.example.com/{username}/{board}.rss' },
    { key: 'example:tag', template: 'https://feeds.example.com/rss.xml?q=tag:{tag}' },
    {
      key: 'example:search',
      template: 'https://feeds.example.com/rss.xml?type=item&q=by:{username} sort:time',
    },
    { key: 'example:blog', template: 'https://{username}.example.org/feed' },
    { key: 'example:site', template: 'https://{host}/feeds/site' },
    { key: 'example:journal', template: 'https://{username}.{domain}/journal/feed' },
    { key: 'example:site-feed', template: '{scheme}://{host}/feed' },
    { key: 'example:channel', template: 'https://www.example.com/feed/{channel}' },
    { key: 'example:channel', template: 'https://{subdomain}.example.org/feed' },
    { key: 'example:profile', template: 'https://www.example.com/-{username}/?rss' },
    { key: 'example:member', template: 'https://www.example.com/members/{username}?rss=' },
    { key: 'example:page', template: 'https://www.example.com/pages/{username}?rss&page={page}' },
  ],
  { hosts: ['example.com', 'www.example.com'], domains: ['example.net', 'example.edu'] },
)

describe('definePlatformFeeds', () => {
  it('should throw for a template without an http scheme', () => {
    const throwing = () =>
      definePlatformFeeds([{ key: 'example:posts', template: 'example.com/feed' }])

    expect(throwing).toThrow('Not a feed URL template: example.com/feed')
  })

  it('should throw for a host placeholder without hosts', () => {
    const throwing = () =>
      definePlatformFeeds([{ key: 'example:site', template: 'https://{host}/feed' }])

    expect(throwing).toThrow('No hosts for the example:site feed')
  })

  it('should throw for a domain placeholder without domains', () => {
    const throwing = () =>
      definePlatformFeeds([{ key: 'example:blog', template: 'https://{username}.{domain}/feed' }])

    expect(throwing).toThrow('No hosts for the example:blog feed')
  })

  describe('getFeedUrl', () => {
    it('should write a path value into the template', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'alice' })
      const expected = 'https://www.example.com/alice/feed.rss'

      expect(value).toBe(expected)
    })

    it('should encode a path value', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'c#' })
      const expected = 'https://www.example.com/c%23/feed.rss'

      expect(value).toBe(expected)
    })

    it('should write a query value through composeQuery', () => {
      const value = feeds.getFeedUrl('example:search', { username: 'alice' })
      const expected = 'https://feeds.example.com/rss.xml?type=item&q=by:alice%20sort:time'

      expect(value).toBe(expected)
    })

    it('should write a query flag with no value', () => {
      const value = feeds.getFeedUrl('example:profile', { username: 'alice' })
      const expected = 'https://www.example.com/-alice/?rss'

      expect(value).toBe(expected)
    })

    it('should write a query flag written with an empty value as a flag', () => {
      const value = feeds.getFeedUrl('example:member', { username: 'alice' })
      const expected = 'https://www.example.com/members/alice?rss'

      expect(value).toBe(expected)
    })

    it('should write a query flag beside a query value', () => {
      const value = feeds.getFeedUrl('example:page', { username: 'alice', page: '2' })
      const expected = 'https://www.example.com/pages/alice?rss&page=2'

      expect(value).toBe(expected)
    })

    it('should write a host value as given', () => {
      const value = feeds.getFeedUrl('example:site', { host: 'example.com' })
      const expected = 'https://example.com/feeds/site'

      expect(value).toBe(expected)
    })

    it('should write the scheme value as given', () => {
      const value = feeds.getFeedUrl('example:site-feed', { scheme: 'http', host: 'example.com' })
      const expected = 'http://example.com/feed'

      expect(value).toBe(expected)
    })

    it('should build the first template of a key whose placeholders the values fill', () => {
      const value = feeds.getFeedUrl('example:channel', { subdomain: 'alice' })
      const expected = 'https://alice.example.org/feed'

      expect(value).toBe(expected)
    })

    it('should build the first template of a key when the values fill none', () => {
      const value = feeds.getFeedUrl('example:channel', {})
      const expected = 'https://www.example.com/feed/{channel}'

      expect(value).toBe(expected)
    })

    it('should pick the template of the format', () => {
      const value = feeds.getFeedUrl('example:posts', { username: 'alice' }, 'atom')
      const expected = 'https://www.example.com/alice/feed.atom'

      expect(value).toBe(expected)
    })

    it('should throw for an unknown key', () => {
      const throwing = () => feeds.getFeedUrl('example:unknown')

      expect(throwing).toThrow('No feed template for example:unknown')
    })

    it('should keep a placeholder with no value', () => {
      const value = feeds.getFeedUrl('example:posts')
      const expected = 'https://www.example.com/{username}/feed.rss'

      expect(value).toBe(expected)
    })
  })

  describe('getFeedEntry', () => {
    const labelled = definePlatformFeeds([
      { key: 'plurk:plurks', template: 'https://www.example.com/{username}.xml' },
      { key: 'plurk:plurks', template: 'https://www.example.com/{username}.atom', format: 'atom' },
    ])

    it('should return the feed with its hint', () => {
      const value = labelled.getFeedEntry('plurk:plurks', { username: 'alice' })
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.xml',
        hint: { key: 'plurk:plurks', label: 'Plurks' },
      }

      expect(value).toEqual(expected)
    })

    it('should return the feed of the format with the format in its hint', () => {
      const value = labelled.getFeedEntry('plurk:plurks', { username: 'alice' }, 'atom')
      const expected: DiscoverUriEntry = {
        uri: 'https://www.example.com/alice.atom',
        hint: { key: 'plurk:plurks', label: 'Plurks', format: 'atom' },
      }

      expect(value).toEqual(expected)
    })
  })

  describe('getFeedKey', () => {
    it('should return the key of a feed URL', () => {
      expect(feeds.getFeedKey('https://www.example.com/alice/feed.rss')).toBe('example:posts')
    })

    it('should return the key of a feed named by a query flag', () => {
      const value = 'https://www.example.com/-alice/?rss'
      const expected = 'example:profile'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return the key of a feed named by a query flag with an empty value', () => {
      const value = 'https://www.example.com/-alice/?rss='
      const expected = 'example:profile'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return the key of a feed whose template writes the flag with an empty value', () => {
      const value = 'https://www.example.com/members/alice?rss'
      const expected = 'example:member'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return the key of a feed named by a query flag beside a query value', () => {
      const value = 'https://www.example.com/pages/alice?page=2&rss='
      const expected = 'example:page'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return undefined for a query flag with a value', () => {
      const value = 'https://www.example.com/-alice/?rss=1'

      expect(feeds.getFeedKey(value)).toBeUndefined()
    })

    it('should return the key of a feed with two values', () => {
      expect(feeds.getFeedKey('https://www.example.com/alice/recipes.rss')).toBe('example:board')
    })

    it('should return the key of a feed named by its query', () => {
      expect(feeds.getFeedKey('https://feeds.example.com/rss.xml?q=tag%3Acats')).toBe('example:tag')
    })

    it('should return the key of the template with more query parameters first', () => {
      const value = 'https://feeds.example.com/rss.xml?type=item&q=by%3Aalice%20sort%3Atime'

      expect(feeds.getFeedKey(value)).toBe('example:search')
    })

    it('should return the key of a feed on a tenant host', () => {
      expect(feeds.getFeedKey('https://alice.example.org/feed')).toBe('example:blog')
    })

    it('should return the key of a feed on any listed host', () => {
      expect(feeds.getFeedKey('https://example.com/feeds/site')).toBe('example:site')
    })

    it('should return the key of a feed under either scheme for a scheme placeholder', () => {
      const value = 'http://example.com/feed'
      const expected = 'example:site-feed'

      expect(feeds.getFeedKey(value)).toBe(expected)
    })

    it('should return the key of a feed on a host under a listed domain', () => {
      expect(feeds.getFeedKey('https://meta.example.net/feeds/site')).toBe('example:site')
    })

    it('should return the key of a feed on a tenant host of a listed domain', () => {
      expect(feeds.getFeedKey('https://alice.example.edu/journal/feed')).toBe('example:journal')
    })

    it('should return undefined for a tenant host of another domain', () => {
      expect(feeds.getFeedKey('https://alice.example.com/journal/feed')).toBeUndefined()
    })

    it('should ignore the scheme, www, a trailing slash and the case of a route word', () => {
      expect(feeds.getFeedKey('http://example.com/alice/Feed.rss/')).toBe('example:posts')
    })

    it('should ignore the query order and extra parameters', () => {
      const value =
        'https://feeds.example.com/rss.xml?utm_source=x&q=by%3Aalice%20sort%3Atime&type=item'

      expect(feeds.getFeedKey(value)).toBe('example:search')
    })

    it('should return undefined for a page URL', () => {
      expect(feeds.getFeedKey('https://www.example.com/alice')).toBeUndefined()
    })

    it('should return undefined for a nested subdomain', () => {
      expect(feeds.getFeedKey('https://a.alice.example.org/feed')).toBeUndefined()
    })

    it('should return undefined for a feed missing a query parameter', () => {
      expect(feeds.getFeedKey('https://feeds.example.com/rss.xml?type=item')).toBeUndefined()
    })

    it('should return undefined for another host', () => {
      expect(feeds.getFeedKey('https://example.edu/alice/feed.rss')).toBeUndefined()
    })

    it('should return undefined for a URL without an http origin', () => {
      expect(feeds.getFeedKey('ftp://www.example.com/alice/feed.rss')).toBeUndefined()
    })
  })
})
