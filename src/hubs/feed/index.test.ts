import { describe, expect, it } from 'bun:test'
import type { HubResult } from '../discover/types.js'
import { discoverHubsFromFeed } from './index.js'

describe('discoverHubsFromFeed', () => {
  it('should discover hub and self from Atom feed', () => {
    const content = `
      <?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example Feed</title>
        <link href="https://hub.example.com/" rel="hub"/>
        <link href="https://example.com/feed.xml" rel="self"/>
      </feed>
    `
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should use baseUrl as topic when Atom self link is missing', () => {
    const content = `
      <?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example Feed</title>
        <link href="https://hub.example.com/" rel="hub"/>
      </feed>
    `
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return multiple hubs from Atom feed', () => {
    const content = `
      <?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example Feed</title>
        <link href="https://hub1.example.com/" rel="hub"/>
        <link href="https://hub2.example.com/" rel="hub"/>
        <link href="https://example.com/feed.xml" rel="self"/>
      </feed>
    `
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub1.example.com/',
        topic: 'https://example.com/feed.xml',
      },
      {
        hub: 'https://hub2.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when Atom feed has no hub link', () => {
    const content = `
      <?xml version="1.0" encoding="utf-8"?>
      <feed xmlns="http://www.w3.org/2005/Atom">
        <title>Example Feed</title>
        <link href="https://example.com/feed.xml" rel="self"/>
      </feed>
    `
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.xml')

    expect(value).toEqual([])
  })

  it('should discover hub from RSS feed with atom namespace', () => {
    const content = `
      <?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
        <channel>
          <title>Example Feed</title>
          <atom:link href="https://hub.example.com/" rel="hub"/>
          <atom:link href="https://example.com/feed.xml" rel="self"/>
        </channel>
      </rss>
    `
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when RSS feed has no atom:link hub', () => {
    const content = `
      <?xml version="1.0" encoding="utf-8"?>
      <rss version="2.0">
        <channel>
          <title>Example Feed</title>
          <link>https://example.com/</link>
        </channel>
      </rss>
    `
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.xml')

    expect(value).toEqual([])
  })

  it('should discover hubs from JSON Feed', () => {
    const content = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example Feed',
      feed_url: 'https://example.com/feed.json',
      hubs: [{ type: 'WebSub', url: 'https://hub.example.com/' }],
    })
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.json')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.json',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should use baseUrl as topic when JSON Feed feed_url is missing', () => {
    const content = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example Feed',
      hubs: [{ type: 'WebSub', url: 'https://hub.example.com/' }],
    })
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.json')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.json',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return multiple hubs from JSON Feed', () => {
    const content = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example Feed',
      feed_url: 'https://example.com/feed.json',
      hubs: [
        { type: 'WebSub', url: 'https://hub1.example.com/' },
        { type: 'WebSub', url: 'https://hub2.example.com/' },
      ],
    })
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.json')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub1.example.com/',
        topic: 'https://example.com/feed.json',
      },
      {
        hub: 'https://hub2.example.com/',
        topic: 'https://example.com/feed.json',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when JSON Feed has no hubs', () => {
    const content = JSON.stringify({
      version: 'https://jsonfeed.org/version/1.1',
      title: 'Example Feed',
    })
    const value = discoverHubsFromFeed(content, 'https://example.com/feed.json')

    expect(value).toEqual([])
  })

  it('should return empty array for invalid content', () => {
    const value = discoverHubsFromFeed('not a feed', 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should return empty array for empty content', () => {
    const value = discoverHubsFromFeed('', 'https://example.com/')

    expect(value).toEqual([])
  })
})
