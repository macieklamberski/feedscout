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

  it('should return the topic and group of a group topic page', () => {
    const value = 'https://example.ning.com/group/hikers/forum/topics/a-trail'
    const expected: NingUrl = { kind: 'topic', topic: 'a-trail', group: 'hikers' }

    expect(parseNingUrl(value)).toEqual(expected)
  })

  it('should return the group of a group page', () => {
    const value = 'https://example.ning.com/group/hikers/forum'
    const expected: NingUrl = { kind: 'group', group: 'hikers' }

    expect(parseNingUrl(value)).toEqual(expected)
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
    const siteFeeds: Array<DiscoverUriEntry> = [
      {
        uri: 'https://example.ning.com/activity/log/list?fmt=rss',
        hint: { key: 'ning:activity', label: 'Latest activity' },
      },
      {
        uri: 'https://example.ning.com/profiles/blog/feed?xn_auth=no',
        hint: { key: 'ning:blog', label: 'Blog posts' },
      },
      {
        uri: 'https://example.ning.com/profiles/blog/feed?promoted=1&xn_auth=no',
        hint: { key: 'ning:blog-featured', label: 'Featured blog posts' },
      },
      {
        uri: 'https://example.ning.com/forum/topic/list?feed=yes&xn_auth=no',
        hint: { key: 'ning:forum', label: 'Forum' },
      },
      {
        uri: 'https://example.ning.com/forum/topic/list?featured=1&feed=yes&xn_auth=no',
        hint: { key: 'ning:forum-featured', label: 'Featured topics' },
      },
      {
        uri: 'https://example.ning.com/profiles/friend/feed?xn_auth=no',
        hint: { key: 'ning:members', label: 'Members' },
      },
      {
        uri: 'https://example.ning.com/profiles/friend/feed?featured=1&xn_auth=no',
        hint: { key: 'ning:members-featured', label: 'Featured members' },
      },
      {
        uri: 'https://example.ning.com/photo/photo/rss?xn_auth=no',
        hint: { key: 'ning:photos', label: 'Photos' },
      },
      {
        uri: 'https://example.ning.com/photo/photo/listFeatured?rss=yes&xn_auth=no',
        hint: { key: 'ning:photos-featured', label: 'Featured photos' },
      },
      {
        uri: 'https://example.ning.com/video/video/rss?xn_auth=no',
        hint: { key: 'ning:videos', label: 'Videos' },
      },
      {
        uri: 'https://example.ning.com/video/video/rss?featured=1&xn_auth=no',
        hint: { key: 'ning:videos-featured', label: 'Featured videos' },
      },
      {
        uri: 'https://example.ning.com/events/event/feed?xn_auth=no',
        hint: { key: 'ning:events', label: 'Events' },
      },
      {
        uri: 'https://example.ning.com/groups/group/feed?xn_auth=no',
        hint: { key: 'ning:groups', label: 'Groups' },
      },
      {
        uri: 'https://example.ning.com/groups/group/feed?featured=1&xn_auth=no',
        hint: { key: 'ning:groups-featured', label: 'Featured groups' },
      },
      {
        uri: 'https://example.ning.com/page/page/list?feed=yes&xn_auth=no',
        hint: { key: 'ning:pages', label: 'Pages' },
      },
      {
        uri: 'https://example.ning.com/notes/index/feed?xn_auth=no',
        hint: { key: 'ning:notes', label: 'Notes' },
      },
    ]

    it('should return empty array for a URL that does not parse', () => {
      expect(ningHandler.resolve('not-a-url')).toEqual([])
    })

    it('should return the site feeds and the site-wide lists for the home page', () => {
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
          uri: 'https://example.com/profiles/blog/feed?promoted=1&xn_auth=no',
          hint: { key: 'ning:blog-featured', label: 'Featured blog posts' },
        },
        {
          uri: 'https://example.com/forum/topic/list?feed=yes&xn_auth=no',
          hint: { key: 'ning:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.com/forum/topic/list?featured=1&feed=yes&xn_auth=no',
          hint: { key: 'ning:forum-featured', label: 'Featured topics' },
        },
        {
          uri: 'https://example.com/profiles/friend/feed?xn_auth=no',
          hint: { key: 'ning:members', label: 'Members' },
        },
        {
          uri: 'https://example.com/profiles/friend/feed?featured=1&xn_auth=no',
          hint: { key: 'ning:members-featured', label: 'Featured members' },
        },
        {
          uri: 'https://example.com/photo/photo/rss?xn_auth=no',
          hint: { key: 'ning:photos', label: 'Photos' },
        },
        {
          uri: 'https://example.com/photo/photo/listFeatured?rss=yes&xn_auth=no',
          hint: { key: 'ning:photos-featured', label: 'Featured photos' },
        },
        {
          uri: 'https://example.com/video/video/rss?xn_auth=no',
          hint: { key: 'ning:videos', label: 'Videos' },
        },
        {
          uri: 'https://example.com/video/video/rss?featured=1&xn_auth=no',
          hint: { key: 'ning:videos-featured', label: 'Featured videos' },
        },
        {
          uri: 'https://example.com/events/event/feed?xn_auth=no',
          hint: { key: 'ning:events', label: 'Events' },
        },
        {
          uri: 'https://example.com/groups/group/feed?xn_auth=no',
          hint: { key: 'ning:groups', label: 'Groups' },
        },
        {
          uri: 'https://example.com/groups/group/feed?featured=1&xn_auth=no',
          hint: { key: 'ning:groups-featured', label: 'Featured groups' },
        },
        {
          uri: 'https://example.com/page/page/list?feed=yes&xn_auth=no',
          hint: { key: 'ning:pages', label: 'Pages' },
        },
        {
          uri: 'https://example.com/notes/index/feed?xn_auth=no',
          hint: { key: 'ning:notes', label: 'Notes' },
        },
      ]

      expect(ningHandler.resolve(value)).toEqual(expected)
    })

    it('should return the topic feed before the site feeds and lists for a topic page', () => {
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
          uri: 'https://example.ning.com/profiles/blog/feed?promoted=1&xn_auth=no',
          hint: { key: 'ning:blog-featured', label: 'Featured blog posts' },
        },
        {
          uri: 'https://example.ning.com/forum/topic/list?feed=yes&xn_auth=no',
          hint: { key: 'ning:forum', label: 'Forum' },
        },
        {
          uri: 'https://example.ning.com/forum/topic/list?featured=1&feed=yes&xn_auth=no',
          hint: { key: 'ning:forum-featured', label: 'Featured topics' },
        },
        {
          uri: 'https://example.ning.com/profiles/friend/feed?xn_auth=no',
          hint: { key: 'ning:members', label: 'Members' },
        },
        {
          uri: 'https://example.ning.com/profiles/friend/feed?featured=1&xn_auth=no',
          hint: { key: 'ning:members-featured', label: 'Featured members' },
        },
        {
          uri: 'https://example.ning.com/photo/photo/rss?xn_auth=no',
          hint: { key: 'ning:photos', label: 'Photos' },
        },
        {
          uri: 'https://example.ning.com/photo/photo/listFeatured?rss=yes&xn_auth=no',
          hint: { key: 'ning:photos-featured', label: 'Featured photos' },
        },
        {
          uri: 'https://example.ning.com/video/video/rss?xn_auth=no',
          hint: { key: 'ning:videos', label: 'Videos' },
        },
        {
          uri: 'https://example.ning.com/video/video/rss?featured=1&xn_auth=no',
          hint: { key: 'ning:videos-featured', label: 'Featured videos' },
        },
        {
          uri: 'https://example.ning.com/events/event/feed?xn_auth=no',
          hint: { key: 'ning:events', label: 'Events' },
        },
        {
          uri: 'https://example.ning.com/groups/group/feed?xn_auth=no',
          hint: { key: 'ning:groups', label: 'Groups' },
        },
        {
          uri: 'https://example.ning.com/groups/group/feed?featured=1&xn_auth=no',
          hint: { key: 'ning:groups-featured', label: 'Featured groups' },
        },
        {
          uri: 'https://example.ning.com/page/page/list?feed=yes&xn_auth=no',
          hint: { key: 'ning:pages', label: 'Pages' },
        },
        {
          uri: 'https://example.ning.com/notes/index/feed?xn_auth=no',
          hint: { key: 'ning:notes', label: 'Notes' },
        },
      ]

      expect(ningHandler.resolve(value)).toEqual(expected)
    })

    it('should return the topic and group forum feeds for a group topic page', () => {
      const value = 'https://example.ning.com/group/hikers/forum/topics/a-trail'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ning.com/forum/topics/a-trail?feed=yes&groupUrl=hikers&xn_auth=no',
          hint: { key: 'ning:topic', label: 'Topic' },
        },
        {
          uri: 'https://example.ning.com/groups/group/forum?feed=yes&groupUrl=hikers&xn_auth=no',
          hint: { key: 'ning:forum-group', label: 'Group forum' },
        },
        ...siteFeeds,
      ]

      expect(ningHandler.resolve(value)).toEqual(expected)
    })

    it('should return the group forum feed for a group page', () => {
      const value = 'https://example.ning.com/group/hikers'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ning.com/groups/group/forum?feed=yes&groupUrl=hikers&xn_auth=no',
          hint: { key: 'ning:forum-group', label: 'Group forum' },
        },
        ...siteFeeds,
      ]

      expect(ningHandler.resolve(value)).toEqual(expected)
    })
  })

  describe('getFeedHint', () => {
    it('should return the featured group topics for the featured topics of a group', () => {
      const value =
        'https://example.ning.com/forum/topic/list?featured=1&feed=yes&groupUrl=hikers&xn_auth=no'
      const expected: DiscoverUriHint = {
        key: 'ning:forum-group-featured',
        label: 'Featured group topics',
      }

      expect(ningHandler.getFeedHint?.(value)).toEqual(expected)
    })
  })

  describe('own feeds through the Platform method', () => {
    it('should return a group topic feed under the group path as itself', async () => {
      const value = 'https://example.ning.com/group/hikers/forum/topics/a-trail?feed=yes&xn_auth=no'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://example.ning.com/group/hikers/forum/topics/a-trail?feed=yes&xn_auth=no',
          hint: { key: 'ning:topic', label: 'Topic' },
        },
      ]
      const result = await discoverUrisFromPlatform(undefined, undefined, {
        ...defaultPlatformOptions,
        handlers: [ningHandler],
        baseUrl: value,
      })

      expect(result).toEqual(expected)
    })
  })
})
