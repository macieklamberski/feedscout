import { describe, expect, it } from 'bun:test'
import { hintKeys } from '../common/uris/platform/feeds.js'
import locales from '../locales.json' with { type: 'json' }
import './defaults.js'

describe('hint labels', () => {
  it('should have a label for every feed of every platform table', () => {
    const labels: Record<string, string> = locales.hints
    const value = [...hintKeys].filter((key) => !labels[key])
    const expected: Array<string> = []

    expect(value).toEqual(expected)
  })
})
