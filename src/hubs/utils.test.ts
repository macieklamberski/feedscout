import { describe, expect, it } from 'bun:test'
import { defaultResolveUrlFn } from '../common/discover/defaults.js'
import type { DiscoverResolveUrlFn } from '../common/types.js'
import type { HubResult } from './discover/types.js'
import { toHubResults } from './utils.js'

describe('toHubResults', () => {
  it('should use the self URI as the topic of every hub', () => {
    const value = toHubResults(
      ['https://hub.example.com/', '/local-hub'],
      '/feed.xml',
      'https://example.com/page',
      defaultResolveUrlFn,
    )
    const expected: Array<HubResult> = [
      { hub: 'https://hub.example.com/', topic: 'https://example.com/feed.xml' },
      { hub: 'https://example.com/local-hub', topic: 'https://example.com/feed.xml' },
    ]

    expect(value).toEqual(expected)
  })

  it('should use the base URL as the topic without a self URI', () => {
    const value = toHubResults(
      ['https://hub.example.com/'],
      undefined,
      'https://example.com/page',
      defaultResolveUrlFn,
    )
    const expected: Array<HubResult> = [
      { hub: 'https://hub.example.com/', topic: 'https://example.com/page' },
    ]

    expect(value).toEqual(expected)
  })

  it('should return an empty array without hub URIs', () => {
    expect(toHubResults([], '/feed.xml', 'https://example.com/', defaultResolveUrlFn)).toEqual([])
  })

  it('should keep the raw URI and report the error when resolving throws', () => {
    const errors: Array<unknown> = []
    const resolveUrlFn: DiscoverResolveUrlFn = () => {
      throw new Error('Resolve failed')
    }
    const value = toHubResults(
      ['/hub'],
      '/feed.xml',
      'https://example.com/',
      resolveUrlFn,
      (error) => {
        errors.push(error)
      },
    )
    const expected: Array<HubResult> = [{ hub: '/hub', topic: '/feed.xml' }]

    expect(value).toEqual(expected)
    expect(errors).toHaveLength(2)
  })
})
