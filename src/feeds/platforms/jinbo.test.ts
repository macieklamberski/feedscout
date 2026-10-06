import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { type JinboUrl, jinboHandler, parseJinboUrl } from './jinbo.js'

describe('parseJinboUrl', () => {
  it('should return the blog for a blog home', () => {
    const expected: JinboUrl = { kind: 'blog', username: 'alice' }

    expect(parseJinboUrl('https://blog.jinbo.net/alice')).toEqual(expected)
  })

  it('should return the blog for a post page', () => {
    const expected: JinboUrl = { kind: 'blog', username: 'alice' }

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

  const siteWidePaths = [
    'https://blog.jinbo.net/',
    'https://blog.jinbo.net/archive/FOSS',
    'https://blog.jinbo.net/atom',
    'https://blog.jinbo.net/global/frame/script.js',
    'https://blog.jinbo.net/jplugins/Menubar/menubar.css',
    'https://blog.jinbo.net/lines',
    'https://blog.jinbo.net/post/?page=2',
    'https://blog.jinbo.net/rss/zine',
    'https://blog.jinbo.net/search/abc',
    'https://blog.jinbo.net/skin/blog/jbnew/style.css',
    'https://blog.jinbo.net/favicon.ico',
  ]

  it.each(siteWidePaths)('should return undefined for site-wide path %s', (value) => {
    expect(parseJinboUrl(value)).toBeUndefined()
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
      const value = 'http://blog.jinbo.net/alice/123'
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

    it('should return only the blog feeds for a tag that found no posts', () => {
      const value = 'https://blog.jinbo.net/alice/tag/nosuchtag'
      const content = '<p class="info"><span class="count">0</span>개의 게시물을 찾았습니다.</p>'
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

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })

    const noPostsSkins = [
      "<h1>'nosuchtag'에 관한 글 0개</h1>",
      "<h1>'nosuchtag'에 해당되는 글 0건</h1>",
    ]

    it.each(noPostsSkins)('should return only the blog feeds when the skin says %s', (content) => {
      const value = 'https://blog.jinbo.net/alice/tag/nosuchtag'
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

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })

    it('should return only the blog feeds for a category that found no posts', () => {
      const value = 'https://blog.jinbo.net/alice/category/999'
      const content = '<p class="info"><em>0</em>개의 게시물을 찾았습니다.</p>'
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

      expect(jinboHandler.resolve(value, content)).toEqual(expected)
    })
  })
})
