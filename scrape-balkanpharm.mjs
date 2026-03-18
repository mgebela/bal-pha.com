import fs from 'node:fs/promises'
import path from 'node:path'

const SHOP_BASE_URL = 'https://balkanpharm.hr'
const OUTPUT_PATH = path.join(
  process.cwd(),
  'src',
  'assets',
  'balkanpharm-catalog.json'
)

const DEFAULT_HEADERS = {
  accept: 'application/json,text/plain,*/*',
  'user-agent': 'balkanpharm-webshop-demo/1.0 (local catalog scrape)',
}

const COLLECTION_PRIORITY = [
  'cbd-cvjetovi',
  'frulice',
  'moonrocks',
  'cbd-cajevi',
  'cbd-ulje',
  'kreme-protiv-bolova',
  'setovi',
  'dodaci-prehrani',
]

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function stripHtml(html) {
  if (!html) return ''
  return (
    html
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, ' ')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, ' ')
      // Convert line-ish tags to spacing
      .replace(/<\/(p|div|li|br|h\d)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .join('\n')
  )
}

async function fetchJson(url, { retries = 3, minDelayMs = 450 } = {}) {
  let lastError
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: DEFAULT_HEADERS,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${res.statusText} - ${text.slice(0, 200)}`)
      }
      return await res.json()
    } catch (err) {
      lastError = err
      const backoff = minDelayMs * Math.pow(2, attempt)
      await sleep(backoff)
    }
  }
  throw lastError
}

function parsePriceEur(priceLike) {
  const n = Number.parseFloat(String(priceLike))
  return Number.isFinite(n) ? n : 0
}

function normalizeProduct(product, { categoriesByProductId }) {
  const variants = (product.variants || []).map((v) => ({
    id: String(v.id),
    title: v.title,
    available: Boolean(v.available),
    priceEur: parsePriceEur(v.price),
    compareAtPriceEur: v.compare_at_price ? parsePriceEur(v.compare_at_price) : null,
    sku: v.sku ?? null,
    grams: typeof v.grams === 'number' ? v.grams : null,
    option1: v.option1 ?? null,
    option2: v.option2 ?? null,
    option3: v.option3 ?? null,
  }))

  const prices = variants.map((v) => v.priceEur).filter((n) => Number.isFinite(n))
  const minPriceEur = prices.length ? Math.min(...prices) : 0
  const maxPriceEur = prices.length ? Math.max(...prices) : 0

  const images = (product.images || []).map((img) => ({
    src: img.src,
    width: img.width ?? null,
    height: img.height ?? null,
  }))

  const productId = String(product.id)
  const categories = categoriesByProductId.get(productId) ?? []
  const primaryCategory = categories[0] ?? null

  return {
    id: product.handle,
    shopifyId: productId,
    title: product.title,
    handle: product.handle,
    url: `${SHOP_BASE_URL}/products/${product.handle}`,
    vendor: product.vendor ?? null,
    productType: product.product_type ?? null,
    tags: product.tags ?? [],
    descriptionText: stripHtml(product.body_html),
    images,
    imageUrl: images[0]?.src ?? null,
    variants,
    available: variants.some((v) => v.available),
    price: {
      currency: 'EUR',
      min: minPriceEur,
      max: maxPriceEur,
    },
    categories,
    primaryCategory,
  }
}

async function getAllCollections() {
  const url = `${SHOP_BASE_URL}/collections.json?limit=250&page=1`
  const data = await fetchJson(url)
  const collections = Array.isArray(data.collections) ? data.collections : []
  return collections.map((c) => ({
    id: String(c.id),
    title: c.title,
    handle: c.handle,
    description: c.description ?? '',
    imageUrl: c.image?.src ?? null,
    productsCount: c.products_count ?? null,
  }))
}

async function getAllProductsViaPages() {
  const products = []
  for (let page = 1; page <= 25; page += 1) {
    const url = `${SHOP_BASE_URL}/products.json?limit=250&page=${page}`
    const data = await fetchJson(url)
    const pageProducts = Array.isArray(data.products) ? data.products : []
    if (pageProducts.length === 0) break
    products.push(...pageProducts)
    await sleep(650)
  }
  return products
}

async function getProductsForCollection(handle) {
  const url = `${SHOP_BASE_URL}/collections/${handle}/products.json?limit=250&page=1`
  const data = await fetchJson(url)
  return Array.isArray(data.products) ? data.products : []
}

async function main() {
  const startedAt = Date.now()
  const collections = await getAllCollections()

  const collectionByHandle = new Map(collections.map((c) => [c.handle, c]))
  const prioritizedCollections = COLLECTION_PRIORITY.filter((h) =>
    collectionByHandle.has(h)
  )

  const categories = prioritizedCollections.map((handle) => {
    const c = collectionByHandle.get(handle)
    return {
      handle,
      title: c.title,
      imageUrl: c.imageUrl,
      productsCount: c.productsCount,
    }
  })

  // Build category mapping by product id by walking collections first (so primary category is stable)
  const categoriesByProductId = new Map()
  for (const handle of prioritizedCollections) {
    const c = collectionByHandle.get(handle)
    const products = await getProductsForCollection(handle)
    for (const p of products) {
      const id = String(p.id)
      const existing = categoriesByProductId.get(id) ?? []
      if (!existing.includes(c.title)) {
        categoriesByProductId.set(id, [...existing, c.title])
      }
    }
    await sleep(650)
  }

  // Fetch full product list once (includes products outside prioritized collections)
  const rawProducts = await getAllProductsViaPages()
  const normalizedProducts = rawProducts
    .map((p) => normalizeProduct(p, { categoriesByProductId }))
    .sort((a, b) => a.title.localeCompare(b.title, 'hr'))

  const catalog = {
    generatedAt: new Date().toISOString(),
    source: SHOP_BASE_URL,
    categories,
    products: normalizedProducts,
    stats: {
      products: normalizedProducts.length,
      categories: categories.length,
      elapsedMs: Date.now() - startedAt,
    },
  }

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, JSON.stringify(catalog, null, 2) + '\n', 'utf8')

  console.log(`Saved ${normalizedProducts.length} products to ${OUTPUT_PATH}`)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})

