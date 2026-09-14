import { describe, expect, it } from 'bun:test'
import { readFileSync } from 'node:fs'
import { renderComment } from './comment.js'
import baseline from './discoverability.json' with { type: 'json' }
import type { PlatformResult } from './verdict.js'

// Handlers added after the last measurement still carry their unchecked prose.
// The list empties when their comments are rewritten.
const notYetRewritten = new Set([
  'art19',
  'bitchute',
  'cnblogs',
  'confluence',
  'diaspora',
  'drupal',
  'fc2',
  'flickr',
  'gitea',
  'habr',
  'hatenaBookmark',
  'jira',
  'learnku',
  'neocities',
  'nodebb',
  'openstatus',
  'peertube',
  'podomatic',
  'postype',
  'shopify',
  'sourcehut',
  'squarespace',
  'syosetu',
  'togetter',
  'wikidot',
  'xenforo',
])

const blockRegex = /^\/\/ Discoverability:.*?(?=\n(?!\/\/))/ms

const readBlock = (platform: string): string | undefined => {
  const path = new URL(`../src/feeds/platform/handlers/${platform}.ts`, import.meta.url)

  return readFileSync(path, 'utf8').match(blockRegex)?.[0]
}

const measured = (baseline as { results: Array<PlatformResult> }).results.filter(
  (result) => result.label !== 'inconclusive' && !notYetRewritten.has(result.platform),
)

describe('handler comments', () => {
  it('should measure at least one platform', () => {
    expect(measured.length).toBeGreaterThan(0)
  })

  it('should match what the baseline renders', () => {
    const drifted = measured
      .filter((result) => readBlock(result.platform) !== renderComment(result))
      .map((result) => result.platform)

    expect(drifted).toEqual([])
  })
})
