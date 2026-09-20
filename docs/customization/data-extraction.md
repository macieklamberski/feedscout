---
title: "Customization: Data Extraction"
---

# Customize Data Extraction

By default, Feedscout uses [Feedsmith](https://feedsmith.dev) to parse and validate discovered feed URLs. You can provide a custom extractor to change how feeds are validated or to extract additional metadata.

## How Extractors Work

After discovering potential feed URLs, Feedscout fetches each URL and passes the content to an extractor function. The extractor determines if the content is a valid feed and extracts metadata. See the [DiscoverExtractFn](/reference/types#discoverextractfn) type for the interface.

## Use Cases

Custom extractors can be used for:

- **Adding custom metadata**: Extract additional fields like language, images, or items
- **Custom validation**: Reject feeds with no items, old feeds, or based on other criteria
- **Using a different parser**: Replace the default Feedsmith parser with another library
- **Blogroll extractors**: Custom extractors also work with `discoverBlogrolls`

## Example

```typescript
import { discoverFeeds } from 'feedscout'
import type { DiscoverExtractFn } from 'feedscout'
import type { FeedResult } from 'feedscout/feeds'
import { parseFeed } from 'feedsmith'

type CustomFeedResult = FeedResult & {
  itemCount: number
}

const customExtractor: DiscoverExtractFn<CustomFeedResult> = ({ url, content }) => {
  try {
    const { format, feed } = parseFeed(content)

    // Atom keeps its title in a text object and its items under `entries`.
    if (format === 'atom') {
      return {
        url,
        isValid: true,
        format,
        title: feed.title?.value,
        itemCount: feed.entries?.length ?? 0,
      }
    }

    return {
      url,
      isValid: true,
      format,
      title: feed.title,
      itemCount: feed.items?.length ?? 0,
    }
  } catch (error) {
    return { url, isValid: false, error }
  }
}

const feeds = await discoverFeeds(url, {
  methods: ['html', 'guess'],
  extractFn: customExtractor,
})

// [{
//   url: 'https://example.com/feed.xml',
//   isValid: true,
//   format: 'rss',
//   title: 'Example Blog',
//   itemCount: 10,
//   method: 'guess',
// }]
```
