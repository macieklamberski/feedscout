import { sverigesRadio } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: program.

export type SverigesRadioUrl =
  | { kind: 'legacyProgram'; programId: string }
  | { kind: 'program'; slug: string }

const feeds = withHintLabels(sverigesRadio.feeds)

export const parseSverigesRadioUrl = (url: string): SverigesRadioUrl | undefined => {
  const page = sverigesRadio.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'legacy-program') {
    return { kind: 'legacyProgram', programId: page.params.programId }
  }

  return { kind: 'program', slug: page.params.slug }
}

export const sverigesRadioHandler: PlatformHandler = {
  match: (url) => {
    return parseSverigesRadioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSverigesRadioUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'legacyProgram') {
      return [feeds.getFeedEntry('program', { programId: parsed.programId })]
    }

    return [feeds.getFeedEntry('program', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
