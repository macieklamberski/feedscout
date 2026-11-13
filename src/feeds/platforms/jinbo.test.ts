import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
import { type JinboUrl, jinboHandler, parseJinboUrl } from './jinbo.js'

describe('parseJinboUrl', () => {
  it('should return the blog for a blog home', () => {
    const expected: JinboUrl = { kind: 'blog', username: 'alice' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice')).toEqual(expected)
  })

  it('should return the post for a post page', () => {
    const expected: JinboUrl = { kind: 'post', username: 'alice', postId: '123' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/123')).toEqual(expected)
  })

  it('should keep the case of the username', () => {
    const expected: JinboUrl = { kind: 'blog', username: 'AliceBlog' }

    expect(parseJinboUrl('https://blog.jinbo.net/AliceBlog')).toEqual(expected)
  })

  it('should return the category for a category page', () => {
    const expected: JinboUrl = { kind: 'category', username: 'alice', categoryId: '9' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/category/9')).toEqual(expected)
  })

  it('should return the category for a capitalized route word', () => {
    const expected: JinboUrl = { kind: 'category', username: 'alice', categoryId: '9' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/Category/9')).toEqual(expected)
  })

  it('should return the blog for the category list', () => {
    const expected: JinboUrl = { kind: 'blog', username: 'alice' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/category/')).toEqual(expected)
  })

  it('should return the tag with its spelling for a tag page', () => {
    const expected: JinboUrl = {
      kind: 'tag',
      username: 'alice',
      tag: '%EC%97%AC%ED%96%89%20%EC%9D%BC%EA%B8%B0',
    }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/tag/여행 일기')).toEqual(expected)
  })

  it('should return the tag for a tag id', () => {
    const expected: JinboUrl = { kind: 'tag', username: 'alice', tag: '12345' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/tag/12345')).toEqual(expected)
  })

  it('should return the blog for a category named by text', () => {
    const expected: JinboUrl = { kind: 'blog', username: 'alice' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/category/%EC%9B%B9')).toEqual(expected)
  })

  it('should return the blog for the tag cloud', () => {
    const expected: JinboUrl = { kind: 'blog', username: 'alice' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice/tag')).toEqual(expected)
  })

  it('should return undefined for the root', () => {
    expect(parseJinboUrl('https://blog.jinbo.net/')).toBeUndefined()
  })

  it('should return undefined for a dotted first segment', () => {
    expect(parseJinboUrl('https://blog.jinbo.net/favicon.ico')).toBeUndefined()
  })

  it('should return undefined for a dotted subdomain', () => {
    expect(parseJinboUrl('https://www.blog.jinbo.net/alice')).toBeUndefined()
  })

  it('should return undefined for another Jinbonet host', () => {
    expect(parseJinboUrl('https://www.jinbo.net/alice')).toBeUndefined()
  })

  it('should return undefined for another host', () => {
    expect(parseJinboUrl('https://example.com/alice')).toBeUndefined()
  })
})

describe('jinboHandler', () => {
  describe('match', () => {
    it('should match a blog page', () => {
      expect(jinboHandler.match('https://blog.jinbo.net/alice')).toBe(true)
    })

    it('should not match the site root', () => {
      expect(jinboHandler.match('https://blog.jinbo.net/')).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL outside the platform', () => {
      expect(jinboHandler.resolve('https://example.com/alice')).toEqual([])
    })

    it('should return https posts and responses feeds for a blog', () => {
      const value = 'http://blog.jinbo.net/alice'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/alice/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value)).toEqual(expected)
    })

    it('should return the responses feeds of a post first for a post page', () => {
      const value = 'http://blog.jinbo.net/alice/123'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/alice/rss/response/123',
          hint: {
            key: 'jinbo:post-responses',
            label: 'Post comments and trackbacks',
            format: 'rss',
          },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom/response/123',
          hint: {
            key: 'jinbo:post-responses',
            label: 'Post comments and trackbacks',
            format: 'atom',
          },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value)).toEqual(expected)
    })

    it('should spell the user as the page links its feed', () => {
      const value = 'https://blog.jinbo.net/aliceblog'
      const content = `
        <link rel="alternate" type="application/rss+xml" title="Alice" href="https://blog.jinbo.net/AliceBlog/rss" />
        <link rel="alternate" type="application/rss+xml" title="Alice : responses" href="https://blog.jinbo.net/AliceBlog/rss/response" />
      `
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/AliceBlog/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/AliceBlog/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/AliceBlog/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/AliceBlog/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the category feed first for a category page', () => {
      const value = 'https://blog.jinbo.net/alice/category/9'
      const content = '<p class="info"><span class="count">12</span>개의 게시물을 찾았습니다.</p>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/alice/atom/category/9',
          hint: { key: 'jinbo:category', label: 'Category', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the tag feed first for a tag page', () => {
      const value = 'https://blog.jinbo.net/alice/tag/%EC%97%AC%ED%96%89'
      const content = '<p class="info"><em>8</em>개의 게시물을 찾았습니다.</p>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/alice/atom/tag/%EC%97%AC%ED%96%89',
          hint: { key: 'jinbo:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the tag feed first for a tag that found no posts', () => {
      const value = 'https://blog.jinbo.net/alice/tag/nosuchtag'
      const content = '<p class="info"><span class="count">0</span>개의 게시물을 찾았습니다.</p>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/alice/atom/tag/nosuchtag',
          hint: { key: 'jinbo:tag', label: 'Tag', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return the category feed first for a category that found no posts', () => {
      const value = 'https://blog.jinbo.net/alice/category/999'
      const content = '<p class="info"><em>0</em>개의 게시물을 찾았습니다.</p>'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/alice/atom/category/999',
          hint: { key: 'jinbo:category', label: 'Category', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })

    it('should escape a number sign in the user the feed link names', () => {
      const value = 'https://blog.jinbo.net/alice'
      const content =
        '<link rel="alternate" type="application/rss+xml" href="https://blog.jinbo.net/alice#b/rss" />'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://blog.jinbo.net/alice%23b/rss',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice%23b/atom',
          hint: { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
        },
        {
          uri: 'https://blog.jinbo.net/alice%23b/rss/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
        },
        {
          uri: 'https://blog.jinbo.net/alice%23b/atom/response',
          hint: { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
        },
      ]

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the category hint for a category feed', () => {
      const value = 'https://blog.jinbo.net/ljydialogue/atom/category/5'
      const expected: DiscoverUriHint = { key: 'jinbo:category', label: 'Category', format: 'atom' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the category hint for a category feed named by text', () => {
      const value = 'https://blog.jinbo.net/gilo/atom/category/%EC%A1%B0%EB%AF%B8%EA%B4%80%EA%B3%84'
      const expected: DiscoverUriHint = { key: 'jinbo:category', label: 'Category', format: 'atom' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed', () => {
      const value = 'https://blog.jinbo.net/ysj40/atom/tag/32745'
      const expected: DiscoverUriHint = { key: 'jinbo:tag', label: 'Tag', format: 'atom' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the tag hint for a tag feed named by text', () => {
      const value =
        'https://blog.jinbo.net/alice/atom/tag/toward%20a%20global%20autonomous%20university'
      const expected: DiscoverUriHint = { key: 'jinbo:tag', label: 'Tag', format: 'atom' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an RSS feed', () => {
      const value = 'https://blog.jinbo.net/comworld/rss'
      const expected: DiscoverUriHint = { key: 'jinbo:posts', label: 'Posts', format: 'rss' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed', () => {
      const value = 'https://blog.jinbo.net/comworld/atom'
      const expected: DiscoverUriHint = { key: 'jinbo:posts', label: 'Posts', format: 'atom' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for an Atom feed with a trailing slash', () => {
      const value = 'http://blog.jinbo.net/comworld/atom/'
      const expected: DiscoverUriHint = { key: 'jinbo:posts', label: 'Posts', format: 'atom' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the posts hint for a feed over http', () => {
      const value = 'http://blog.jinbo.net/comworld/rss'
      const expected: DiscoverUriHint = { key: 'jinbo:posts', label: 'Posts', format: 'rss' }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the responses hint for an RSS feed', () => {
      const value = 'https://blog.jinbo.net/hongsili/rss/response'
      const expected: DiscoverUriHint = {
        key: 'jinbo:responses',
        label: 'Comments and trackbacks',
        format: 'rss',
      }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the responses hint for an Atom feed', () => {
      const value = 'https://blog.jinbo.net/hongsili/atom/response'
      const expected: DiscoverUriHint = {
        key: 'jinbo:responses',
        label: 'Comments and trackbacks',
        format: 'atom',
      }

      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a blog page', () => {
      const value = 'https://blog.jinbo.net/comworld'

      expect(jinboHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a category page', () => {
      const value = 'https://blog.jinbo.net/ljydialogue/category/5'

      expect(jinboHandler.getFeedHint?.(value)).toBeUndefined()
    })

    const feedHints: Array<[string, DiscoverUriHint]> = [
      [
        'https://blog.jinbo.net/alice/rss/response/1234',
        { key: 'jinbo:post-responses', label: 'Post comments and trackbacks', format: 'rss' },
      ],
      [
        'http://blog.jinbo.net/alice/atom/response/1234',
        { key: 'jinbo:post-responses', label: 'Post comments and trackbacks', format: 'atom' },
      ],
      [
        'https://blog.jinbo.net/alice/rss/comment',
        { key: 'jinbo:comments', label: 'Comments', format: 'rss' },
      ],
      [
        'https://blog.jinbo.net/alice/atom/comment',
        { key: 'jinbo:comments', label: 'Comments', format: 'atom' },
      ],
      [
        'https://blog.jinbo.net/alice/rss/trackback',
        { key: 'jinbo:trackbacks', label: 'Trackbacks', format: 'rss' },
      ],
      [
        'https://blog.jinbo.net/alice/atom/trackback',
        { key: 'jinbo:trackbacks', label: 'Trackbacks', format: 'atom' },
      ],
      [
        'http://blog.jinbo.net/alice/rss/line',
        { key: 'jinbo:lines', label: 'Lines', format: 'rss' },
      ],
      [
        'https://blog.jinbo.net/alice/atom/line',
        { key: 'jinbo:lines', label: 'Lines', format: 'atom' },
      ],
    ]

    it.each(feedHints)('should return the hint for %s', (value, expected) => {
      expect(jinboHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for another host', () => {
      const value = 'https://example.com/comworld/rss'

      expect(jinboHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://blog.jinbo.net/ljydialogue/atom/category/5',
        { key: 'jinbo:category', label: 'Category', format: 'atom' },
      ],
      [
        'https://blog.jinbo.net/ysj40/atom/tag/32745',
        { key: 'jinbo:tag', label: 'Tag', format: 'atom' },
      ],
      [
        'https://blog.jinbo.net/comworld/rss',
        { key: 'jinbo:posts', label: 'Posts', format: 'rss' },
      ],
      [
        'https://blog.jinbo.net/comworld/atom',
        { key: 'jinbo:posts', label: 'Posts', format: 'atom' },
      ],
      [
        'https://blog.jinbo.net/hongsili/rss/response',
        { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'rss' },
      ],
      [
        'https://blog.jinbo.net/hongsili/atom/response',
        { key: 'jinbo:responses', label: 'Comments and trackbacks', format: 'atom' },
      ],
      [
        'http://blog.jinbo.net/alice/rss/response/1234',
        { key: 'jinbo:post-responses', label: 'Post comments and trackbacks', format: 'rss' },
      ],
      [
        'http://blog.jinbo.net/alice/rss/comment',
        { key: 'jinbo:comments', label: 'Comments', format: 'rss' },
      ],
      [
        'https://blog.jinbo.net/alice/atom/trackback',
        { key: 'jinbo:trackbacks', label: 'Trackbacks', format: 'atom' },
      ],
      [
        'http://blog.jinbo.net/alice/atom/line',
        { key: 'jinbo:lines', label: 'Lines', format: 'atom' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [jinboHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
