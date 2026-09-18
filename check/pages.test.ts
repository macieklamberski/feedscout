import { describe, expect, it } from 'bun:test'
import { readdirSync } from 'node:fs'
import pages from './pages.json' with { type: 'json' }

// Platforms that have no page a run can fetch. Mailchimp archives are keyed by
// an account's private u/id pair with no public directory to source one from,
// and Omny serves the feed but 404s omny.fm/shows/{slug} for every slug.
const unmeasured = ['mailchimp', 'omnystudio']

const handlerDir = new URL('../src/feeds/platform/handlers/', import.meta.url)

const handlerNames = readdirSync(handlerDir)
  .filter((file) => file.endsWith('.ts') && !file.endsWith('.test.ts'))
  .map((file) => file.replace('.ts', ''))
  .filter((name) => name !== 'invariant')

const corpus = pages as Record<string, Record<string, string>>

describe('pages.json', () => {
  it('should cover every platform handler', () => {
    const missing = handlerNames.filter((name) => !corpus[name] && !unmeasured.includes(name))

    expect(missing).toEqual([])
  })

  it('should not name a platform without a handler', () => {
    const stale = Object.keys(corpus).filter((name) => !handlerNames.includes(name))

    expect(stale).toEqual([])
  })

  it('should give every platform at least one page URL', () => {
    const empty = Object.entries(corpus)
      .filter(([, shapes]) => Object.keys(shapes).length === 0)
      .map(([platform]) => platform)

    expect(empty).toEqual([])
  })

  it('should only list unmeasured platforms that still have a handler', () => {
    const gone = unmeasured.filter((name) => !handlerNames.includes(name))

    expect(gone).toEqual([])
  })
})
