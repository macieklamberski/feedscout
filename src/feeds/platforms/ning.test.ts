import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry, DiscoverUriHint } from '../../common/types.js'
import { discoverUrisFromPlatform } from '../../common/uris/platform/index.js'
import { defaultPlatformOptions } from '../defaults.js'
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

  describe('getFeedHint', () => {
    const feedUrls: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.ning.com/forum/topics/tour-and-travel?feed=yes&xn_auth=no',
        { key: 'ning:topic', label: 'Topic' },
      ],
      [
        'https://example.ning.com/activity/log/list?fmt=rss',
        { key: 'ning:activity', label: 'Latest activity' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?xn_auth=no',
        { key: 'ning:blog', label: 'Blog posts' },
      ],
      [
        'https://example.ning.com/forum/topic/list?feed=yes&xn_auth=no',
        { key: 'ning:forum', label: 'Forum' },
      ],
      [
        'http://example.ning.com/forum/topics/tour-and-travel/?xn_auth=no&feed=yes',
        { key: 'ning:topic', label: 'Topic' },
      ],
      [
        'https://example.ning.com/activity/log/list?fmt=rss&screenName=1abcdefghij2k',
        { key: 'ning:activity-member', label: 'Member activity' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:blog-author', label: 'Author' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?tag=travel&xn_auth=no',
        { key: 'ning:blog-tag', label: 'Tag' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?promoted=1&xn_auth=no',
        { key: 'ning:blog-featured', label: 'Featured blog posts' },
      ],
      [
        'https://example.ning.com/forum/topic/list?featured=1&feed=yes&xn_auth=no',
        { key: 'ning:forum-featured', label: 'Featured topics' },
      ],
      [
        'https://example.ning.com/forum/topic/list?feed=yes&groupUrl=hikers&xn_auth=no',
        { key: 'ning:forum-group', label: 'Group forum' },
      ],
      [
        'https://example.ning.com/group/hikers/forum/topics/a-trail?feed=yes&xn_auth=no',
        { key: 'ning:topic', label: 'Topic' },
      ],
      [
        'https://example.ning.com/group/hikers/forum?feed=yes&xn_auth=no',
        { key: 'ning:forum-group', label: 'Group forum' },
      ],
      [
        'https://example.ning.com/forum/topic/listForContributor?feed=yes&user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:forum-member', label: 'Member topics' },
      ],
      [
        'https://example.ning.com/group/hikers/forum/topic/listForContributor?feed=yes&user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:forum-group-member', label: 'Member group topics' },
      ],
      [
        'https://example.ning.com/forum/topic/listForContributor?feed=yes&groupUrl=hikers&user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:forum-group-member', label: 'Member group topics' },
      ],
      [
        'https://example.ning.com/forum/topic/listForTag?feed=yes&tag=travel&xn_auth=no',
        { key: 'ning:forum-tag', label: 'Tagged topics' },
      ],
      [
        'https://example.ning.com/group/hikers/forum/topic/listForTag?feed=yes&tag=travel&xn_auth=no',
        { key: 'ning:forum-group-tag', label: 'Tagged group topics' },
      ],
      [
        'https://example.ning.com/forum/topic/listForTag?feed=yes&groupUrl=hikers&tag=travel&xn_auth=no',
        { key: 'ning:forum-group-tag', label: 'Tagged group topics' },
      ],
      [
        'https://example.ning.com/profiles/comment/feed?attachedTo=1234567%3ABlogPost%3A89&xn_auth=no',
        { key: 'ning:blog-post-comments', label: 'Blog post comments' },
      ],
      [
        'https://example.ning.com/profiles/statuscomment/feed?attachedTo=1234567%3AStatus%3A89&xn_auth=no',
        { key: 'ning:status-comments', label: 'Status comments' },
      ],
      [
        'https://example.ning.com/photo/albumcomment/feed?attachedTo=1234567%3AAlbum%3A89&xn_auth=no',
        { key: 'ning:album-comments', label: 'Album comments' },
      ],
      [
        'https://example.ning.com/photo/photo/listForContributor?rss=yes&screenName=1abcdefghij2k&xn_auth=no',
        { key: 'ning:photos-member', label: 'Member photos' },
      ],
      [
        'https://example.ning.com/video/video/listForContributor?rss=yes&screenName=1abcdefghij2k&xn_auth=no',
        { key: 'ning:videos-member', label: 'Member videos' },
      ],
      [
        'https://example.ning.com/video/video/listTagged?rss=yes&tag=travel&xn_auth=no',
        { key: 'ning:videos-tag', label: 'Tagged videos' },
      ],
      [
        'https://example.ning.com/events/comment/feed?attachedTo=1234567%3AEvent%3A89&xn_auth=no',
        { key: 'ning:event-comments', label: 'Event comments' },
      ],
    ]

    it.each(feedUrls)('should return the hint for %s', (value, expected) => {
      expect(ningHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return the group forum for the featured topics of a group', () => {
      const value =
        'https://example.ning.com/forum/topic/list?featured=1&feed=yes&groupUrl=hikers&xn_auth=no'
      const expected: DiscoverUriHint = { key: 'ning:forum-group', label: 'Group forum' }

      expect(ningHandler.getFeedHint?.(value)).toEqual(expected)
    })

    it('should return undefined for a page on a network subdomain', () => {
      const value = 'https://example.ning.com/forum/topics/tour-and-travel'

      expect(ningHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a custom domain', () => {
      const value = 'https://example.com/activity/log/list?fmt=rss'

      expect(ningHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on the apex', () => {
      const value = 'https://ning.com/activity/log/list?fmt=rss'

      expect(ningHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on www', () => {
      const value = 'https://www.ning.com/profiles/blog/feed?xn_auth=no'

      expect(ningHandler.getFeedHint?.(value)).toBeUndefined()
    })

    it('should return undefined for a feed on a nested subdomain', () => {
      const value = 'https://forum.example.ning.com/forum/topic/list?feed=yes&xn_auth=no'

      expect(ningHandler.getFeedHint?.(value)).toBeUndefined()
    })
  })

  describe('own feeds through the Platform method', () => {
    const ownFeeds: Array<[string, DiscoverUriHint]> = [
      [
        'https://example.ning.com/forum/topics/tour-and-travel?feed=yes&xn_auth=no',
        { key: 'ning:topic', label: 'Topic' },
      ],
      [
        'https://example.ning.com/activity/log/list?fmt=rss',
        { key: 'ning:activity', label: 'Latest activity' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?xn_auth=no',
        { key: 'ning:blog', label: 'Blog posts' },
      ],
      [
        'http://example.ning.com/forum/topic/list?feed=yes&xn_auth=no',
        { key: 'ning:forum', label: 'Forum' },
      ],
      [
        'https://example.ning.com/activity/log/list?fmt=rss&screenName=1abcdefghij2k',
        { key: 'ning:activity-member', label: 'Member activity' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:blog-author', label: 'Author' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?tag=travel&xn_auth=no',
        { key: 'ning:blog-tag', label: 'Tag' },
      ],
      [
        'https://example.ning.com/profiles/blog/feed?promoted=1&xn_auth=no',
        { key: 'ning:blog-featured', label: 'Featured blog posts' },
      ],
      [
        'https://example.ning.com/forum/topic/list?featured=1&feed=yes&xn_auth=no',
        { key: 'ning:forum-featured', label: 'Featured topics' },
      ],
      [
        'https://example.ning.com/forum/topic/list?feed=yes&groupUrl=hikers&xn_auth=no',
        { key: 'ning:forum-group', label: 'Group forum' },
      ],
      [
        'https://example.ning.com/group/hikers/forum/topics/a-trail?feed=yes&xn_auth=no',
        { key: 'ning:topic', label: 'Topic' },
      ],
      [
        'https://example.ning.com/group/hikers/forum?feed=yes&xn_auth=no',
        { key: 'ning:forum-group', label: 'Group forum' },
      ],
      [
        'https://example.ning.com/forum/topic/listForContributor?feed=yes&user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:forum-member', label: 'Member topics' },
      ],
      [
        'https://example.ning.com/group/hikers/forum/topic/listForContributor?feed=yes&user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:forum-group-member', label: 'Member group topics' },
      ],
      [
        'https://example.ning.com/forum/topic/listForContributor?feed=yes&groupUrl=hikers&user=1abcdefghij2k&xn_auth=no',
        { key: 'ning:forum-group-member', label: 'Member group topics' },
      ],
      [
        'https://example.ning.com/forum/topic/listForTag?feed=yes&tag=travel&xn_auth=no',
        { key: 'ning:forum-tag', label: 'Tagged topics' },
      ],
      [
        'https://example.ning.com/group/hikers/forum/topic/listForTag?feed=yes&tag=travel&xn_auth=no',
        { key: 'ning:forum-group-tag', label: 'Tagged group topics' },
      ],
      [
        'https://example.ning.com/forum/topic/listForTag?feed=yes&groupUrl=hikers&tag=travel&xn_auth=no',
        { key: 'ning:forum-group-tag', label: 'Tagged group topics' },
      ],
      [
        'https://example.ning.com/profiles/comment/feed?attachedTo=1234567%3ABlogPost%3A89&xn_auth=no',
        { key: 'ning:blog-post-comments', label: 'Blog post comments' },
      ],
      [
        'https://example.ning.com/profiles/statuscomment/feed?attachedTo=1234567%3AStatus%3A89&xn_auth=no',
        { key: 'ning:status-comments', label: 'Status comments' },
      ],
      [
        'https://example.ning.com/photo/albumcomment/feed?attachedTo=1234567%3AAlbum%3A89&xn_auth=no',
        { key: 'ning:album-comments', label: 'Album comments' },
      ],
      [
        'https://example.ning.com/photo/photo/listForContributor?rss=yes&screenName=1abcdefghij2k&xn_auth=no',
        { key: 'ning:photos-member', label: 'Member photos' },
      ],
      [
        'https://example.ning.com/video/video/listForContributor?rss=yes&screenName=1abcdefghij2k&xn_auth=no',
        { key: 'ning:videos-member', label: 'Member videos' },
      ],
      [
        'https://example.ning.com/video/video/listTagged?rss=yes&tag=travel&xn_auth=no',
        { key: 'ning:videos-tag', label: 'Tagged videos' },
      ],
      [
        'https://example.ning.com/events/comment/feed?attachedTo=1234567%3AEvent%3A89&xn_auth=no',
        { key: 'ning:event-comments', label: 'Event comments' },
      ],
    ]

    it.each(ownFeeds)('should return %s as itself', async (value, hint) => {
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [ningHandler],
        baseUrl: value,
      })
      const expected: Array<DiscoverUriEntry> = [{ uri: value, hint }]

      expect(result).toEqual(expected)
    })
  })
})
