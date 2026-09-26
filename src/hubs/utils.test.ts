import { describe, expect, it } from 'bun:test'
import { defaultResolveUrlFn } from '../common/discover/defaults.js'
import type { DiscoverResolveUrlFn } from '../common/types.js'
import { toHubResults } from './utils.js'

describe('toHubResults', () => {
  it('should drop a hub with a non-http scheme', () => {
    const value = toHubResults(
      ['javascript:subscribe()', 'mailto:hub@example.com', 'https://hub.example.com/'],
      undefined,
      'https://example.com/page',
      defaultResolveUrlFn,
    )
    const expected = [{ hub: 'https://hub.example.com/', topic: 'https://example.com/page' }]

    expect(value).toEqual(expected)
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
    const expected = [{ hub: '/hub', topic: '/feed.xml' }]

    expect(value).toEqual(expected)
    expect(errors).toHaveLength(2)
  })
})
