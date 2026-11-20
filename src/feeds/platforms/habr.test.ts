import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import type { HabrUrl } from './habr.js'
import { habrHandler, parseHabrUrl } from './habr.js'

describe('parseHabrUrl', () => {
  it('should return the hub for a hub page', () => {
    const expected: HabrUrl = { kind: 'hub', language: 'ru', hub: 'javascript' }

    expect(parseHabrUrl('https://habr.com/ru/hubs/javascript/')).toEqual(expected)
  })

  it('should return the hub for a hub page with a capitalized hubs segment', () => {
    const expected: HabrUrl = { kind: 'hub', language: 'ru', hub: 'javascript' }

    expect(parseHabrUrl('https://habr.com/ru/Hubs/javascript/')).toEqual(expected)
  })

  it('should return the hub for a hub article list', () => {
    const expected: HabrUrl = { kind: 'hub', language: 'ru', hub: 'programming' }

    expect(parseHabrUrl('https://habr.com/ru/hubs/programming/articles/')).toEqual(expected)
  })

  it('should return the hub for the singular hub path', () => {
    const expected: HabrUrl = { kind: 'hub', language: 'ru', hub: 'python' }

    expect(parseHabrUrl('https://habr.com/ru/hub/python/')).toEqual(expected)
  })

  it('should return the user for a user page', () => {
    const expected: HabrUrl = { kind: 'user', language: 'ru', username: 'alice' }

    expect(parseHabrUrl('https://habr.com/ru/users/alice/')).toEqual(expected)
  })

  it('should return the user for a user post list', () => {
    const expected: HabrUrl = { kind: 'user', language: 'en', username: 'alice' }

    expect(parseHabrUrl('https://habr.com/en/users/alice/posts/')).toEqual(expected)
  })

  it('should return the company for a company page', () => {
    const expected: HabrUrl = { kind: 'company', language: 'ru', company: 'example' }

    expect(parseHabrUrl('https://habr.com/ru/companies/example/articles/')).toEqual(expected)
  })

  it('should return the company for a company page with a capitalized companies segment', () => {
    const expected: HabrUrl = { kind: 'company', language: 'ru', company: 'example' }

    expect(parseHabrUrl('https://habr.com/ru/Companies/example/articles/')).toEqual(expected)
  })

  it('should return the company for a company named like the hub route', () => {
    const expected: HabrUrl = { kind: 'company', language: 'ru', company: 'hub' }

    expect(parseHabrUrl('https://habr.com/ru/companies/hub/articles/')).toEqual(expected)
  })

  it('should return the company for a company named like the user route', () => {
    const expected: HabrUrl = { kind: 'company', language: 'ru', company: 'users' }

    expect(parseHabrUrl('https://habr.com/ru/companies/users/articles/')).toEqual(expected)
  })

  it('should return the article for an article page', () => {
    const expected: HabrUrl = { kind: 'article', language: 'ru', post: '123456' }

    expect(parseHabrUrl('https://habr.com/ru/articles/123456/')).toEqual(expected)
  })

  it('should return the article and its company for a company article page', () => {
    const value = 'https://habr.com/ru/companies/example/articles/123456/'
    const expected: HabrUrl = {
      kind: 'article',
      language: 'ru',
      post: '123456',
      company: 'example',
    }

    expect(parseHabrUrl(value)).toEqual(expected)
  })

  it('should return the article for a legacy company blog post', () => {
    const value = 'https://habr.com/ru/company/example/blog/123456/'
    const expected: HabrUrl = {
      kind: 'article',
      language: 'ru',
      post: '123456',
      company: 'example',
    }

    expect(parseHabrUrl(value)).toEqual(expected)
  })

  it('should return the flow for a flow page', () => {
    const expected: HabrUrl = { kind: 'flow', language: 'ru', flow: 'example' }

    expect(parseHabrUrl('https://habr.com/ru/flows/example/articles/')).toEqual(expected)
  })

  it('should return the home page with its language for site-wide pages', () => {
    const expected: HabrUrl = { kind: 'home', language: 'en' }

    expect(parseHabrUrl('https://habr.com/en/articles/')).toEqual(expected)
  })

  it('should return the home page in Russian for the root', () => {
    const expected: HabrUrl = { kind: 'home', language: 'ru' }

    expect(parseHabrUrl('https://habr.com/')).toEqual(expected)
  })

  it('should return the hub with any language prefix', () => {
    const expected: HabrUrl = { kind: 'hub', language: 'de', hub: 'javascript' }

    expect(parseHabrUrl('https://habr.com/de/hubs/javascript/')).toEqual(expected)
  })

  it('should return the Russian home page for a prefix that is no language', () => {
    const expected: HabrUrl = { kind: 'home', language: 'ru' }

    expect(parseHabrUrl('https://habr.com/xx/hubs/javascript/')).toEqual(expected)
  })

  it('should return the user for the www host', () => {
    const expected: HabrUrl = { kind: 'user', language: 'ru', username: 'alice' }

    expect(parseHabrUrl('https://www.habr.com/ru/users/alice/')).toEqual(expected)
  })

  it('should return undefined for another host', () => {
    expect(parseHabrUrl('https://example.com/ru/users/alice/')).toBeUndefined()
  })

  it('should return undefined for an invalid URL', () => {
    expect(parseHabrUrl('not-a-url')).toBeUndefined()
  })
})

describe('habrHandler', () => {
  describe('match', () => {
    it('should match a Habr URL', () => {
      expect(habrHandler.match('https://habr.com/ru/articles/')).toBe(true)
    })

    it('should not match other hosts', () => {
      expect(habrHandler.match('https://example.com/ru/articles/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the hub, hub posts, articles and news feeds for a hub page', () => {
      const value = 'https://habr.com/ru/hubs/programming/articles/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/hubs/programming/articles/',
          hint: { key: 'habr:hub', label: 'Hub' },
        },
        {
          uri: 'https://habr.com/ru/rss/hubs/programming/posts/',
          hint: { key: 'habr:hub-posts', label: 'Hub posts' },
        },
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/ru/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the user feed for a user page', () => {
      const value = 'https://habr.com/en/users/example/posts/'
      const expected = [
        {
          uri: 'https://habr.com/en/rss/users/example/publications/articles/',
          hint: { key: 'habr:user', label: 'User' },
        },
        {
          uri: 'https://habr.com/en/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/en/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the company feed for a company page', () => {
      const value = 'https://habr.com/ru/companies/example/articles/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/companies/example/articles/',
          hint: { key: 'habr:company', label: 'Company' },
        },
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/ru/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the feeds on habr.com for a page on the www host', () => {
      const value = 'https://www.habr.com/ru/companies/example/articles/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/companies/example/articles/',
          hint: { key: 'habr:company', label: 'Company' },
        },
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/ru/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the comments feed for an article page', () => {
      const value = 'https://habr.com/ru/articles/123456/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/publications/123456/',
          hint: { key: 'habr:comments', label: 'Comments' },
        },
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/ru/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the comments and company feeds for a company article page', () => {
      const value = 'https://habr.com/en/companies/example/articles/123456/'
      const expected = [
        {
          uri: 'https://habr.com/en/rss/publications/123456/',
          hint: { key: 'habr:comments', label: 'Comments' },
        },
        {
          uri: 'https://habr.com/en/rss/companies/example/articles/',
          hint: { key: 'habr:company', label: 'Company' },
        },
        {
          uri: 'https://habr.com/en/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/en/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return the flow feed for a flow page', () => {
      const value = 'https://habr.com/ru/flows/example/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/flows/example/articles/',
          hint: { key: 'habr:flow', label: 'Flow' },
        },
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/ru/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should fall back to the default language', () => {
      const value = 'https://habr.com/'
      const expected = [
        {
          uri: 'https://habr.com/ru/rss/articles/',
          hint: { key: 'habr:articles', label: 'Articles' },
        },
        {
          uri: 'https://habr.com/ru/rss/news/',
          hint: { key: 'habr:news', label: 'News' },
        },
      ]

      expect(habrHandler.resolve(value)).toEqual(expected)
    })

    it('should return empty array for another host', () => {
      expect(habrHandler.resolve('https://example.com/ru/users/alice/')).toEqual([])
    })
  })

  describe('getFeedHint', () => {
    it('should return the comments hint for the post feed an article page links', () => {
      const value = 'https://habr.com/ru/rss/post/123456/?fl=ru'
      const expected: DiscoverUriHint = { key: 'habr:comments', label: 'Comments' }

      expect(habrHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a company blog feed as itself', async () => {
      const value = 'https://habr.com/ru/rss/company/example/blog/'
      const options = {
        ...defaultPlatformOptions,
        handlers: [habrHandler],
        baseUrl: value,
      }
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: value,
          hint: {
            key: 'habr:company',
            label: 'Company',
          },
        },
      ]

      expect(await discoverUrisFromPlatform(undefined, undefined, options)).toEqual(expected)
    })
  })
})
