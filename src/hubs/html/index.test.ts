import { describe, expect, it } from 'bun:test'
import type { HubResult } from '../discover/types.js'
import { discoverHubsFromHtml } from './index.js'

describe('discoverHubsFromHtml', () => {
  it('should discover hub and self from link elements', () => {
    const html = `
      <html>
        <head>
          <link rel="hub" href="https://hub.example.com/">
          <link rel="self" href="https://example.com/feed.xml">
        </head>
      </html>
    `
    const value = discoverHubsFromHtml(html, 'https://example.com/')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/feed.xml',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should use baseUrl as topic when self link is missing', () => {
    const html = '<link rel="hub" href="https://hub.example.com/">'
    const value = discoverHubsFromHtml(html, 'https://example.com/')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should resolve relative URLs against base URL', () => {
    const html = '<link rel="hub" href="/websub">'
    const value = discoverHubsFromHtml(html, 'https://example.com/page')
    const expected: Array<HubResult> = [
      {
        hub: 'https://example.com/websub',
        topic: 'https://example.com/page',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should handle case-insensitive rel attribute', () => {
    const html = '<link rel="HUB" href="https://hub.example.com/">'
    const value = discoverHubsFromHtml(html, 'https://example.com/')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub.example.com/',
        topic: 'https://example.com/',
      },
    ]

    expect(value).toEqual(expected)
  })

  it('should return empty array when no hub found', () => {
    const html = '<link rel="self" href="https://example.com/feed.xml">'
    const value = discoverHubsFromHtml(html, 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should return empty array for empty content', () => {
    const value = discoverHubsFromHtml('', 'https://example.com/')

    expect(value).toEqual([])
  })

  it('should return all hubs when multiple hubs present', () => {
    const html = `
      <link rel="hub" href="https://hub1.example.com/">
      <link rel="hub" href="https://hub2.example.com/">
    `
    const value = discoverHubsFromHtml(html, 'https://example.com/')
    const expected: Array<HubResult> = [
      {
        hub: 'https://hub1.example.com/',
        topic: 'https://example.com/',
      },
      {
        hub: 'https://hub2.example.com/',
        topic: 'https://example.com/',
      },
    ]

    expect(value).toEqual(expected)
  })
})
