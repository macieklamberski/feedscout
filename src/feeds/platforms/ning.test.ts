import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import { isNingHtml, type NingUrl, ningHandler, parseNingUrl } from './ning.js'

const ningHtml = `
  <link
    rel="stylesheet"
    type="text/css"
    href="https://static.ning.com/socialnetworkmain/widgets/index/css/common-ie7.css?xn_version=2712659298"
  />
`
const ning3Html = `
  <script
    type="text/javascript"
    src="https://static.ning.com/examplenetwork/widgets/lib/core.min.js?xn_version=202609250855"
  ></script>
`
const ning3Headers = new Headers({
  'set-cookie': 'ning_session=abc; Path=/; Secure; HttpOnly',
  'x-xn-trace-token': '6b9ded418fab73c935d473816927c313',
})

describe('isNingHtml', () => {
  it('should return true for the classic asset path', () => {
    expect(isNingHtml(ningHtml)).toBe(true)
  })

  it('should return false for a Ning 3 network', () => {
    expect(isNingHtml(ning3Html)).toBe(false)
  })

  it('should return false for empty content', () => {
    expect(isNingHtml('')).toBe(false)
  })
})

describe('parseNingUrl', () => {
  it('should return the topic of a forum topic page', () => {
    const expected: NingUrl = { kind: 'topic', topic: 'tour-and-travel' }

    expect(parseNingUrl('https://example.ning.com/forum/topics/tour-and-travel')).toEqual(expected)
  })

  it('should return the home page for the root', () => {
    const expected: NingUrl = { kind: 'home' }

    expect(parseNingUrl('https://example.ning.com/')).toEqual(expected)
  })

  it('should return the home page for a blog post', () => {
    const expected: NingUrl = { kind: 'home' }

    expect(parseNingUrl('https://example.com/profiles/blogs/a-post')).toEqual(expected)
  })

  it('should return the home page for the topic list', () => {
    const expected: NingUrl = { kind: 'home' }

    expect(parseNingUrl('https://example.com/forum/topics/')).toEqual(expected)
  })

  it('should return undefined for an unparsable URL', () => {
    expect(parseNingUrl('not-a-url')).toBeUndefined()
  })
})

describe('ningHandler', () => {
  describe('match', () => {
    it('should match a classic Ning page', () => {
      expect(ningHandler.match('https://example.com/', ningHtml)).toBe(true)
    })

    it('should not match without content', () => {
      expect(ningHandler.match('https://example.ning.com/')).toBe(false)
    })

    it('should not match a Ning 3 network', () => {
      expect(ningHandler.match('https://example.ning.com/', ning3Html, ning3Headers)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return empty array for a URL that does not parse', () => {
      expect(ningHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the site feeds for the home page', () => {
      const value = 'https://example.com/'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.com/activity/log/list?fmt=rss',
          hint: { key: 'ning:activity', label: 'Latest activity' },
        },
        {
          uri: 'https://example.com/profiles/blog/feed?xn_auth=no',
          hint: { key: 'ning:blog', label: 'Blog posts' },
        },
        {
          uri: 'https://example.com/forum/topic/list?feed=yes&xn_auth=no',
          hint: { key: 'ning:forum', label: 'Forum' },
        },
      ]

      expect(ningHandler.resolve(value)).toEqual(expected)
    })

    it('should return the topic feed before the site feeds for a topic page', () => {
      const value = 'https://example.ning.com/forum/topics/tour-and-travel'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ning.com/forum/topics/tour-and-travel?feed=yes&xn_auth=no',
          hint: { key: 'ning:topic', label: 'Topic' },
        },
        {
          uri: 'https://example.ning.com/activity/log/list?fmt=rss',
          hint: { key: 'ning:activity', label: 'Latest activity' },
        },
        {
          uri: 'https://example.ning.com/profiles/blog/feed?xn_auth=no',
          hint: { key: 'ning:blog', label: 'Blog posts' },
        },
        {
          uri: 'https://example.ning.com/forum/topic/list?feed=yes&xn_auth=no',
          hint: { key: 'ning:forum', label: 'Forum' },
        },
      ]

      expect(ningHandler.resolve(value)).toEqual(expected)
    })
  })
})
