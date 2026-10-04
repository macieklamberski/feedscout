import { describe, expect, it } from 'bun:test'
import type { DiscoverUriEntry } from '../../common/types.js'
import {
  type ForumotionPage,
  forumotionHandler,
  getForumotionPage,
  isForumotionHtml,
} from './forumotion.js'

const userdataScript = `
  <script type="text/javascript">
    var _userdata = new Object();
    _userdata["session_logged_in"] = 0;
  </script>
`
const forumHtml = `
  <head>
    <link
      rel="canonical"
      href="https://shingamix.forumotion.com/f104-the-nexus"
    />
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/","name":"Super Maker Forums"}},{"@type":"ListItem","position":2,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/f104-the-nexus","name":"The Nexus"}}]}</script>
    ${userdataScript}
  </head>
`
const missingForumHtml = `
  <head>
    <link
      rel="canonical"
      href="https://shingamix.forumotion.com/f99999-forum"
    />
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/","name":"Super Maker Forums"}}]}</script>
    ${userdataScript}
  </head>
`
const topicHtml = `
  <head>
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/","name":"Super Maker Forums"}},{"@type":"ListItem","position":2,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/f104-the-nexus","name":"The Nexus"}},{"@type":"ListItem","position":3,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/f119-events","name":"Events"}},{"@type":"ListItem","position":4,"item":{"@id":"https:\\/\\/shingamix.forumotion.com\\/t550-i-have-returned","name":"I have returned!!!!!"}}]}</script>
    <script type="application/ld+json">{"@context":"https:\\/\\/schema.org","@type":"DiscussionForumPosting","headline":"I have returned!!!!!"}</script>
    ${userdataScript}
  </head>
`
const otherHtml = `
  <head>
    <script>var _board = new Object();</script>
  </head>
`

describe('isForumotionHtml', () => {
  it('should return true for the userdata script', () => {
    expect(isForumotionHtml(forumHtml)).toBe(true)
  })

  it('should return false for other forum software', () => {
    expect(isForumotionHtml(otherHtml)).toBe(false)
  })
})

describe('getForumotionPage', () => {
  it('should return the forum the breadcrumb ends with', () => {
    const value = 'https://shingamix.forumotion.com/f104-the-nexus'
    const expected: ForumotionPage = { kind: 'forum', forumId: '104' }

    expect(getForumotionPage(value, forumHtml)).toEqual(expected)
  })

  it('should return the forum of a later page of a forum', () => {
    const value = 'https://shingamix.forumotion.com/f104p20-the-nexus'
    const content = forumHtml.replaceAll('f104-the-nexus', 'f104p20-the-nexus')
    const expected: ForumotionPage = { kind: 'forum', forumId: '104' }

    expect(getForumotionPage(value, content)).toEqual(expected)
  })

  it('should return the forum before the topic for a topic page', () => {
    const value = 'https://shingamix.forumotion.com/t550-i-have-returned'
    const expected: ForumotionPage = { kind: 'topic', forumId: '119' }

    expect(getForumotionPage(value, topicHtml)).toEqual(expected)
  })

  it('should return home for a forum id the breadcrumb does not name', () => {
    const value = 'https://shingamix.forumotion.com/f99999-zzqq'
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage(value, missingForumHtml)).toEqual(expected)
  })

  it('should return home for a topic without a forum in the breadcrumb', () => {
    const value = 'https://shingamix.forumotion.com/t550-i-have-returned'
    const content = topicHtml.replace('f119-events', '')
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage(value, content)).toEqual(expected)
  })

  it('should return home for a breadcrumb that ends after its forum at no topic', () => {
    const value = 'https://shingamix.forumotion.com/c6-frontdesk'
    const content = topicHtml.replace('t550-i-have-returned', 'c6-frontdesk')
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage(value, content)).toEqual(expected)
  })

  it('should return home for a page without content', () => {
    const expected: ForumotionPage = { kind: 'home' }

    expect(getForumotionPage('https://shingamix.forumotion.com/', undefined)).toEqual(expected)
  })
})

describe('forumotionHandler', () => {
  describe('match', () => {
    it('should return true for a page with the userdata script', () => {
      expect(forumotionHandler.match('https://www.leschevelus.com/', userdataScript)).toBe(true)
    })

    it('should return false for a page without it', () => {
      expect(forumotionHandler.match('https://shingamix.forumotion.com/', otherHtml)).toBe(false)
    })
  })

  describe('resolve', () => {
    it('should return the forum and latest topics feeds for a forum page', () => {
      const value = 'https://shingamix.forumotion.com/f104-the-nexus'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=104',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=104&type=atom',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?type=atom',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
        },
      ]

      expect(forumotionHandler.resolve(value, forumHtml)).toEqual(expected)
    })

    it('should return the feeds of the topic forum for a topic page', () => {
      const value = 'https://shingamix.forumotion.com/t550-i-have-returned'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=119',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?f=119&type=atom',
          hint: { key: 'forumotion:forum', label: 'Forum', format: 'atom' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?type=atom',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
        },
      ]

      expect(forumotionHandler.resolve(value, topicHtml)).toEqual(expected)
    })

    it('should return only the latest topics feeds for a made-up forum', () => {
      const value = 'https://shingamix.forumotion.com/f99999-zzqq'
      const expected: Array<DiscoverUriEntry> = [
        {
          uri: 'https://shingamix.forumotion.com/feed/',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'rss' },
        },
        {
          uri: 'https://shingamix.forumotion.com/feed/?type=atom',
          hint: { key: 'forumotion:latest-topics', label: 'Latest topics', format: 'atom' },
        },
      ]

      expect(forumotionHandler.resolve(value, missingForumHtml)).toEqual(expected)
    })
  })
})
