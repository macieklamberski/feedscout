import { describe, expect, it } from 'bun:test'
import type { HubResult } from '../discover/types.js'
import { discoverHubsFromHeaders } from './index.js'

describe('discoverHubsFromHeaders', () => {
  it('should discover hub and self from Link headers', () => {
    const headers = new Headers({
      link: '<https://hub.example.com/>; rel="hub", <https://example.com/feed.xml>; rel="self"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should use baseUrl as topic when self link is missing', () => {
    const headers = new Headers({
      link: '<https://hub.example.com/>; rel="hub"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle multiple Link headers with other relations', () => {
    const headers = new Headers({
      link: '<https://example.com/>; rel="alternate", <https://hub.example.com/>; rel="hub", <https://example.com/feed.xml>; rel="self"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when no hub found', () => {
    const headers = new Headers({
      link: '<https://example.com/feed.xml>; rel="self"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')

    expect(value).toEqual([])
  })

  it('should return empty array when no Link header present', () => {
    const headers = new Headers()
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')

    expect(value).toEqual([])
  })

  it('should handle case-insensitive rel attribute', () => {
    const headers = new Headers({
      link: '<https://hub.example.com/>; rel="HUB", <https://example.com/feed.xml>; rel="SELF"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return all hubs when multiple hubs present', () => {
    const headers = new Headers({
      link: '<https://hub1.example.com/>; rel="hub", <https://hub2.example.com/>; rel="hub"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
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

  it('should handle malformed Link header gracefully', () => {
    const headers = new Headers({
      link: 'invalid-link-header',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')

    expect(value).toEqual([])
  })

  it('should handle quoted rel values', () => {
    const headers = new Headers({
      link: '<https://hub.example.com/>; rel="hub"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle unquoted rel values', () => {
    const headers = new Headers({
      link: '<https://hub.example.com/>; rel=hub',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should apply custom normalizeUrlFn to hub and topic URLs', () => {
    const headers = new Headers({
      link: '</hub>; rel="hub", </feed.xml>; rel="self"',
    })
    const customNormalizer = (url: string) => {
      return `https://custom.example.com${url}`
    }
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml', customNormalizer)
    const expected: Array<HubResult> = [
      {
        hub: 'https://custom.example.com/hub',
        topic: 'https://custom.example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should resolve relative hub URL /hub in Link header', () => {
    const headers = new Headers({
      link: '</hub>; rel="hub"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/feed.xml')
    const expected: Array<HubResult> = [
      {
        hub: 'https://example.com/hub',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should use first self entry when multiple rel="self" are present', () => {
    const headers = new Headers({
      link: '<https://hub.example.com/>; rel="hub", <https://example.com/first.xml>; rel="self", <https://example.com/second.xml>; rel="self"',
    })
    const value = discoverHubsFromHeaders(headers, 'https://example.com/')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/first.xml',
      },
    ]

    expect(value).toEqual(expected)
  })
})
