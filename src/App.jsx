import { useEffect, useMemo, useState } from 'react'
import './App.css'
import catalog from './assets/balkanpharm-catalog.json'
import ovajDizeHeroImg from './assets/ovaj-dize-iz-mrtvih.png'

const NEWSLETTER_STORAGE_KEY = 'balpha-tea-club-email'
const SESSION_MAIN_DISMISSED = 'balpha-newsletter-main-dismissed'
const SESSION_EXIT_SHOWN = 'balpha-newsletter-exit-shown'
const DISCOUNT_CODE = 'TEA10'
const MAIN_POPUP_DELAY_MS = 5000
const DEMO_STOCK_BOXES_LEFT = 18

const BUNDLE_HERO_IMAGES = [
  ovajDizeHeroImg,
  'https://cdn.shopify.com/s/files/1/0631/0448/3570/files/kopika50g.png?v=1737404419',
  'https://cdn.shopify.com/s/files/1/0631/0448/3570/files/carobnabanana100g_1.png?v=1708464197',
]

const TESTIMONIALS = [
  {
    quote:
      'Konačno imam miran večernji ritual — smirujući miris, osjećaj prave kvalitete.',
    author: 'Maja K.',
    city: 'Split',
  },
  {
    quote:
      'Jutarnja energija bez „škripanja“. Paket otkrića mi je olakšao odabir — sve na jednom mjestu.',
    author: 'Ivan P.',
    city: 'Zagreb',
  },
  {
    quote:
      'Izbalansirane mješavine. Trojka je idealna ako ne možeš odlučiti za jednu.',
    author: 'Tea L.',
    city: 'Rijeka',
  },
]

function readStoredNewsletterEmail() {
  try {
    return localStorage.getItem(NEWSLETTER_STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim())
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function BalphaLogo({ variant = 'green', className = '' }) {
  const variants = {
    green: { from: '#42d68f', to: '#7cf3c0' },
    yellow: { from: '#f5b04a', to: '#fff07b' },
    orange: { from: '#e24b3d', to: '#f2b24f' },
    purple: { from: '#6b2cff', to: '#d946ef' },
  }
  const v = variants[variant] ?? variants.green
  const gradId = `balpha-grad-${variant}`

  return (
    <svg
      className={className}
      viewBox="0 0 1200 240"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="balpha CBD ORIGINALS"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={v.from} />
          <stop offset="1" stopColor={v.to} />
        </linearGradient>
      </defs>
      <rect
        x="12"
        y="12"
        width="1176"
        height="216"
        rx="22"
        fill={`url(#${gradId})`}
        stroke="rgba(15,23,42,0.85)"
        strokeWidth="12"
      />
      <g transform="translate(56 54)">
        <path
          d="M96 0c7 25 7 46 0 70c20-7 36-19 54-40c-2 28-12 49-34 70c24 0 44-7 70-22c-12 23-28 39-56 51c27 12 44 28 56 51c-26-15-46-22-70-22c22 21 32 42 34 70c-18-21-34-33-54-40c7 24 7 45 0 70c-7-25-7-46 0-70c-20 7-36 19-54 40c2-28 12-49 34-70c-24 0-44 7-70 22c12-23 28-39 56-51c-28-12-44-28-56-51c26 15 46 22 70 22c-22-21-32-42-34-70c18 21 34 33 54 40c-7-24-7-45 0-70Z"
          fill="rgba(255,255,255,0.95)"
        />
        <rect x="88" y="126" width="16" height="62" rx="8" fill="rgba(255,255,255,0.95)" />
      </g>
      <text
        x="310"
        y="135"
        fill="rgba(255,255,255,0.96)"
        fontFamily="ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial"
        fontWeight="800"
        fontSize="140"
        letterSpacing="-2"
      >
        balpha
      </text>
      <text
        x="435"
        y="200"
        fill="rgba(255,255,255,0.9)"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
        fontWeight="900"
        fontSize="54"
        letterSpacing="6"
      >
        CBD ORIGINALS
      </text>
    </svg>
  )
}

const TEA_DISCOVERY_BOX_PRODUCT = {
  id: 'tea-discovery-box',
  name: 'Paket otkrića — 3 čaja',
  priceEur: 33,
  priceMinEur: 33,
  priceMaxEur: 33,
  compareAtPriceEur: 47,
  category: 'Paketi',
  description: 'Tri odabrane premium mješavine (50 g) — za jutro, dan i noć.',
  size: '3 × 50 g',
  imageUrl: null,
}

const PREMIUM_TEA_DUO_PRODUCT = {
  id: 'premium-tea-duo',
  name: 'Premium čajni duo',
  priceEur: 50,
  priceMinEur: 50,
  priceMaxEur: 50,
  compareAtPriceEur: 55,
  category: 'Paketi',
  description: 'Dva velika pakiranja (100 g) za duže uživanje ili dijeljenje.',
  size: '2 × 100 g',
  imageUrl:
    'https://cdn.shopify.com/s/files/1/0631/0448/3570/files/mocnivocniduh100g.png?v=1708463377',
}

const MANUAL_TEA_EXTRA = [
  {
    id: 'zdrawoo-ovaj-dize-iz-mrtvih-50g',
    name: 'Ovaj diže iz mrtvih – voćni čaj – 50g',
    priceEur: 15,
    priceMinEur: 15,
    priceMaxEur: 15,
    category: 'Čajevi',
    description: 'THC: <0,3% · CBD: >15%.',
    size: '50g',
    imageUrl: ovajDizeHeroImg,
  },
]

const PRODUCTS = [
  ...catalog.products
    .filter((p) => p.productType === 'cbd tea')
    .map((p) => {
      const primaryCategory =
        p.primaryCategory || p.productType || (p.categories && p.categories[0]) || 'Čajevi'

      const description =
        p.descriptionText?.split('\n').filter(Boolean)[0] ||
        'CBD čaj iz BalkanPharm ponude.'

      const sizeVariant = p.variants?.[0]
      const size =
        sizeVariant?.option1 && !/default title/i.test(sizeVariant.option1)
          ? sizeVariant.option1
          : ''

      const basePriceMin = p.price?.min ?? 0
      const basePriceMax = p.price?.max ?? basePriceMin

      return {
        id: p.id,
        name: p.title,
        priceEur: basePriceMin,
        priceMinEur: basePriceMin,
        priceMaxEur: basePriceMax,
        category: primaryCategory,
        description,
        size,
        imageUrl: p.imageUrl || (p.images && p.images[0]?.src) || null,
      }
    }),
  TEA_DISCOVERY_BOX_PRODUCT,
  PREMIUM_TEA_DUO_PRODUCT,
  ...MANUAL_TEA_EXTRA,
]

function formatPrice(value) {
  return value.toLocaleString('hr-HR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  })
}

function PriceCompare({ price, compareAt, className = '' }) {
  const showCompare = compareAt != null && compareAt > price
  return (
    <span className={`bp-price-compare-row ${className}`.trim()}>
      <span className="bp-price-current">{formatPrice(price)}</span>
      {showCompare ? (
        <del className="bp-price-was">{formatPrice(compareAt)}</del>
      ) : null}
    </span>
  )
}

function StarRating({ rating = 4.8 }) {
  return (
    <div className="bp-stars" aria-label={`Ocjena ${rating} od 5`}>
      <span className="bp-stars-symbols" aria-hidden="true">
        ★★★★★
      </span>
      <span className="bp-stars-value">{rating.toFixed(1)}</span>
    </div>
  )
}

function App() {
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState({})
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [subscribedEmail, setSubscribedEmail] = useState(readStoredNewsletterEmail)
  const [showMainNewsletter, setShowMainNewsletter] = useState(false)
  const [showExitNewsletter, setShowExitNewsletter] = useState(false)
  const [showWelcomeEmail, setShowWelcomeEmail] = useState(false)
  const [newsletterInput, setNewsletterInput] = useState('')
  const [newsletterError, setNewsletterError] = useState('')

  useEffect(() => {
    if (subscribedEmail) return
    const timer = window.setTimeout(() => {
      try {
        if (sessionStorage.getItem(SESSION_MAIN_DISMISSED)) return
        if (sessionStorage.getItem(SESSION_EXIT_SHOWN)) return
      } catch {
        /* ignore */
      }
      setShowMainNewsletter(true)
    }, MAIN_POPUP_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [subscribedEmail])

  useEffect(() => {
    if (subscribedEmail) return
    if (showMainNewsletter) return

    const onDocLeave = (e) => {
      if (e.clientY > 24) return
      try {
        if (sessionStorage.getItem(SESSION_EXIT_SHOWN)) return
        sessionStorage.setItem(SESSION_EXIT_SHOWN, '1')
      } catch {
        /* ignore */
      }
      setShowExitNewsletter(true)
    }

    document.documentElement.addEventListener('mouseleave', onDocLeave)
    return () =>
      document.documentElement.removeEventListener('mouseleave', onDocLeave)
  }, [subscribedEmail, showMainNewsletter])

  function dismissMainNewsletter() {
    try {
      sessionStorage.setItem(SESSION_MAIN_DISMISSED, '1')
    } catch {
      /* ignore */
    }
    setShowMainNewsletter(false)
  }

  function submitNewsletter(e) {
    e.preventDefault()
    const email = newsletterInput.trim()
    if (!isValidEmail(email)) {
      setNewsletterError('Unesi valjanu e-mail adresu.')
      return
    }
    try {
      localStorage.setItem(NEWSLETTER_STORAGE_KEY, email)
      sessionStorage.setItem(SESSION_MAIN_DISMISSED, '1')
      sessionStorage.setItem(SESSION_EXIT_SHOWN, '1')
    } catch {
      /* ignore */
    }
    setSubscribedEmail(email)
    setNewsletterError('')
    setShowMainNewsletter(false)
    setShowExitNewsletter(false)
    setShowWelcomeEmail(true)
  }

  function dismissExitNewsletter() {
    setShowExitNewsletter(false)
  }

  const filteredProducts = useMemo(() => {
    const q = normalizeText(search)
    if (!q) return PRODUCTS
    return PRODUCTS.filter((product) => {
      const hay = normalizeText(`${product.name}\n${product.description}`)
      return hay.includes(q)
    })
  }, [search])

  const teaGroups = useMemo(() => {
    const pool = [...filteredProducts]

    const takeOrdered = (orderedMatchers) => {
      const taken = []
      for (const m of orderedMatchers) {
        const matchTerms = m.matchTerms.map(normalizeText)
        const matches = pool.filter((p) => {
          const name = normalizeText(p.name)
          return matchTerms.some((t) => name.includes(t))
        })
        for (const p of matches) {
          if (!taken.some((x) => x.id === p.id)) taken.push(p)
        }
        for (const p of matches) {
          const idx = pool.findIndex((x) => x.id === p.id)
          if (idx >= 0) pool.splice(idx, 1)
        }
      }
      return taken
    }

    const morningMatchers = [
      { label: 'Ovaj diže iz mrtvih', matchTerms: ['ovaj dize iz mrtvih'] },
      { label: 'Kopika', matchTerms: ['kopika'] },
      { label: 'Balkan Orkain', matchTerms: ['balkan orkain'] },
    ]

    const dayMatchers = [
      { label: 'Čarobna banana', matchTerms: ['carobna banana'] },
      { label: 'Proljetni snovi', matchTerms: ['proljetni snovi'] },
      { label: 'Voćna magija', matchTerms: ['vocna magija'] },
    ]

    const nightMatchers = [
      { label: 'Moćni Voćni Duh', matchTerms: ['mocni vocni duh'] },
      { label: 'Topla crvena rapsodija', matchTerms: ['topla crvena rapsodija'] },
      { label: 'Wish', matchTerms: ['my name is wish'] },
    ]

    const jutro = takeOrdered(morningMatchers)
    const dan = takeOrdered(dayMatchers)
    const noc = takeOrdered(nightMatchers)

    return [
      {
        key: 'jutro',
        title: 'Jutro',
        subtitle: 'Žuta kolekcija za energičan start dana.',
        logoVariant: 'yellow',
        products: jutro,
      },
      {
        key: 'dan',
        title: 'Dan',
        subtitle: 'Narančasta kolekcija za fokus i dobar ritam.',
        logoVariant: 'orange',
        products: dan,
      },
      {
        key: 'noc',
        title: 'Noć',
        subtitle: 'Ljubičasta kolekcija za opuštanje i ritual pred spavanje.',
        logoVariant: 'purple',
        products: noc,
      },
    ]
  }, [filteredProducts])

  const cartItems = useMemo(() => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = PRODUCTS.find((p) => p.id === productId)
        if (!product) return null
        return {
          product,
          quantity,
          lineTotal: product.priceEur * quantity,
        }
      })
      .filter(Boolean)
  }, [cart])

  function openTeaClubPopup() {
    setShowExitNewsletter(false)
    setShowMainNewsletter(true)
  }

  function addDiscoveryAndOpenCart() {
    addToCart(TEA_DISCOVERY_BOX_PRODUCT.id)
    setIsCartOpen(true)
  }

  const cartTotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [cartItems]
  )

  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, qty) => sum + qty, 0),
    [cart]
  )

  function addToCart(productId) {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }))
  }

  function updateQuantity(productId, quantity) {
    setCart((prev) => {
      if (quantity <= 0) {
        const next = { ...prev }
        delete next[productId]
        return next
      }
      return {
        ...prev,
        [productId]: quantity,
      }
    })
  }

  function clearCart() {
    setCart({})
  }

  return (
    <div className="bp-app bp-tea-app">
      <header className="bp-header">
        <div className="bp-header-main">
          <div className="bp-logo">
            <span className="bp-logo-mark">BP</span>
            <div className="bp-logo-text">
              <span className="bp-logo-title">BalkanPharm</span>
                <span className="bp-logo-subtitle">CBD Čajevi (Demo webshop)</span>
            </div>
          </div>

          <div className="bp-header-actions">
            <div className="bp-search">
              <input
                type="text"
                placeholder="Pretraži čajeve..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <button
              className="bp-cart-button"
              onClick={() => setIsCartOpen(true)}
            >
              <span className="bp-cart-icon">🛒</span>
              <span className="bp-cart-label">Košarica</span>
              {totalItems > 0 && (
                <span className="bp-cart-count">{totalItems}</span>
              )}
            </button>
          </div>
        </div>

        <div className="bp-header-secondary">
          <div className="bp-brand-strip">
            <BalphaLogo variant="green" className="bp-brand-logo" />
          </div>
        </div>
      </header>

      <main className="bp-main">
        <section className="bp-hero bp-hero-funnel" aria-labelledby="bp-hero-funnel-title">
          <div className="bp-hero-funnel-layout">
            <div className="bp-hero-content bp-hero-funnel-copy">
              <div className="bp-hero-trust-row">
                <span className="bp-trust-badge">Najprodavanije</span>
                <span className="bp-trust-badge bp-trust-badge--muted">Ograničena serija</span>
              </div>
              <h1 id="bp-hero-funnel-title">Otkrij svoj savršeni čaj</h1>
              <p className="bp-hero-funnel-sub">
                Isprobaj 3 premium mješavine i pronađi omiljenu
              </p>
              <div className="bp-hero-rating-row">
                <StarRating rating={4.8} />
                <span className="bp-hero-rating-caption">Visoke ocjene prvjih kupaca</span>
              </div>
              <div className="bp-hero-price-block">
                <PriceCompare
                  price={TEA_DISCOVERY_BOX_PRODUCT.priceEur}
                  compareAt={TEA_DISCOVERY_BOX_PRODUCT.compareAtPriceEur}
                />
                <span className="bp-hero-save-pill">Najbolja vrijednost za početak</span>
              </div>
              <div className="bp-hero-cta-row">
                <a className="bp-button-primary bp-hero-funnel-cta" href="#tea-discovery-box">
                  Uzmi kutiju
                </a>
                <a className="bp-button-ghost" href="#tea-discovery-box">
                  Kupi odmah
                </a>
              </div>
            </div>
            <div className="bp-hero-bundle" aria-hidden="true">
              {BUNDLE_HERO_IMAGES.map((src, i) => (
                <div key={i} className={`bp-hero-bundle-tile bp-hero-bundle-tile--${i}`}>
                  <img src={src} alt="" loading={i === 0 ? 'eager' : 'lazy'} />
                </div>
              ))}
              <p className="bp-hero-bundle-caption">3 × 50 g · prirodne mješavine</p>
            </div>
          </div>
        </section>

        <section
          className="bp-featured-discovery"
          id="tea-discovery-box"
          aria-labelledby="bp-featured-discovery-title"
        >
          <div className="bp-featured-discovery-inner">
            <div className="bp-featured-discovery-copy">
              <span className="bp-featured-eyebrow">Istaknuto · Paket otkrića</span>
              <h2 id="bp-featured-discovery-title">Paket otkrića</h2>
              <StarRating rating={4.8} />
              <div className="bp-discovery-prose">
                <p className="bp-discovery-lead">Ne znaš koji čaj odabrati?</p>
                <p>Ovo je najlakši način da isprobaš najbolje okuse.</p>
                <ul className="bp-discovery-list">
                  <li>Tri različite premium mješavine (po 50 g)</li>
                  <li>Za opuštanje, energiju ili svakodnevni ritual</li>
                  <li>Ušteda u odnosu na kupnju pojedinačno</li>
                  <li>Ograničena dostupnost · manje serije, pažljiviji pristup</li>
                </ul>
              </div>
              <p className="bp-scarcity-inline">
                <strong>Ograničena zaliha:</strong> u ovoj je seriji ostalo još{' '}
                {DEMO_STOCK_BOXES_LEFT} kutija (demo brojač).
              </p>
              <div className="bp-featured-discovery-actions">
                <div className="bp-featured-price-row">
                  <PriceCompare
                    price={TEA_DISCOVERY_BOX_PRODUCT.priceEur}
                    compareAt={TEA_DISCOVERY_BOX_PRODUCT.compareAtPriceEur}
                  />
                </div>
                <p className="bp-tea-club-inline">
                  <button type="button" className="bp-tea-club-link" onClick={openTeaClubPopup}>
                    🎁 -10% kad se pridružiš našem Tea Clubu
                  </button>
                </p>
                <button
                  type="button"
                  className="bp-button-primary"
                  onClick={() => addToCart(TEA_DISCOVERY_BOX_PRODUCT.id)}
                >
                  Uzmi kutiju
                </button>
                <a className="bp-featured-scroll-catalog" href="#products">
                  Pregledaj pojedinačne čajeve
                </a>
              </div>
            </div>
            <div className="bp-featured-discovery-panel" aria-hidden="true">
              <div className="bp-featured-discovery-visual">
                <span className="bp-featured-visual-icon" aria-hidden="true">
                  🍃
                </span>
                <p className="bp-featured-visual-title">Paket otkrića</p>
                <p className="bp-featured-visual-meta">Jutro · Dan · Noć</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bp-social-proof" aria-labelledby="bp-social-title">
          <h2 id="bp-social-title" className="bp-section-title">
            Što ljudi prvo osjete
          </h2>
          <div className="bp-social-grid">
            {TESTIMONIALS.map((t) => (
              <blockquote key={t.author} className="bp-testimonial">
                <StarRating rating={5} />
                <p className="bp-testimonial-quote">"{t.quote}"</p>
                <footer>
                  — {t.author}, {t.city}
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section className="bp-product-story" aria-labelledby="bp-story-title">
          <h2 id="bp-story-title" className="bp-section-title">
            Što dobivaš
          </h2>
          <ul className="bp-story-list">
            <li>
              <strong>Otkrivanje, a ne nagađanje.</strong> Tri jasna profila da osjetiš koja ti
              mješavina pristaje uz raspoloženje.
            </li>
            <li>
              <strong>Kvaliteta koju okusiš.</strong> Prirodno aromatični sastojci, uravnoteženo —
              bez „glasnog“ ili umjetnog dojma.
            </li>
            <li>
              <strong>Miran ritual.</strong> Kratko skuhanje, dugi izdisaj — za male trenutke u
              danu.
            </li>
          </ul>
        </section>

        <section className="bp-urgency-strip" role="status">
          <p>
            <strong>Ograničena zaliha.</strong> Paketi brzo nestaju — kad ova mikro-serija ode,
            sljedeće punjenje prati prirodni ritam, ne skladišni sat.
          </p>
        </section>

        <section className="bp-upsell-duo" aria-labelledby="bp-duo-title">
          <div className="bp-upsell-duo-inner">
            <div className="bp-upsell-duo-copy">
              <span className="bp-featured-eyebrow">Više za ljubitelje</span>
              <h2 id="bp-duo-title">Premium čajni duo</h2>
              <p className="bp-upsell-tagline">Želiš više? Prijeđi na veća pakiranja.</p>
              <p>
                Dva izdašna pakiranja od 100 g za sporije ispijanje, dijeljenje ili zalihu kod kuće.
                I dalje jasno, i dalje premium — samo više onoga što već voliš.
              </p>
              <div className="bp-upsell-price">
                <PriceCompare
                  price={PREMIUM_TEA_DUO_PRODUCT.priceEur}
                  compareAt={PREMIUM_TEA_DUO_PRODUCT.compareAtPriceEur}
                />
              </div>
              <button
                type="button"
                className="bp-button-primary"
                onClick={() => addToCart(PREMIUM_TEA_DUO_PRODUCT.id)}
              >
                Dodaj premium duo
              </button>
            </div>
            {PREMIUM_TEA_DUO_PRODUCT.imageUrl && (
              <div className="bp-upsell-duo-media">
                <img src={PREMIUM_TEA_DUO_PRODUCT.imageUrl} alt="" loading="lazy" />
              </div>
            )}
          </div>
        </section>

        <section className="bp-cta-repeat" aria-labelledby="bp-cta-repeat-title">
          <div className="bp-cta-repeat-inner">
            <h2 id="bp-cta-repeat-title">Kad god ti odgovara</h2>
            <p className="bp-cta-repeat-prices">
              Uzmi paket otkrića po{' '}
              <PriceCompare
                price={TEA_DISCOVERY_BOX_PRODUCT.priceEur}
                compareAt={TEA_DISCOVERY_BOX_PRODUCT.compareAtPriceEur}
              />{' '}
              — nježan ulaz u punu ponudu ispod.
            </p>
            <button type="button" className="bp-button-primary" onClick={addDiscoveryAndOpenCart}>
              Uzmi kutiju · {formatPrice(TEA_DISCOVERY_BOX_PRODUCT.priceEur)}
            </button>
          </div>
        </section>

        <section className="bp-products" id="products">
          {filteredProducts.length === 0 ? (
            <div className="bp-empty-state">
              <h2>Nema rezultata</h2>
              <p>Pokušaj s drugačijom pretragom.</p>
            </div>
          ) : (
            <div className="bp-tea-sections">
              {teaGroups.map((group) => (
                <section
                  key={group.key}
                  className={`bp-tea-section bp-tea-section-${group.key}`}
                >
                  <header className="bp-tea-section-header">
                    <BalphaLogo
                      variant={group.logoVariant}
                      className="bp-tea-section-logo"
                    />
                    <div className="bp-tea-section-headline">
                      <h2>{group.title}</h2>
                      <p>{group.subtitle}</p>
                    </div>
                  </header>

                  <div className="bp-product-grid">
                    {group.products.slice(0, 3).map((product) => (
                      <article key={product.id} className="bp-product-card">
                        <div className="bp-product-badge">ČAJ</div>
                        {product.imageUrl && (
                          <div className="bp-product-media">
                            <img
                              src={product.imageUrl}
                              alt={product.name}
                              loading="lazy"
                            />
                          </div>
                        )}
                        <div className="bp-product-body">
                          <h3 className="bp-product-name">{product.name}</h3>
                          {product.description?.trim() ? (
                            <p className="bp-product-desc">{product.description}</p>
                          ) : null}
                          <div className="bp-product-meta">
                            {product.size && (
                              <span className="bp-product-size">{product.size}</span>
                            )}
                          </div>
                        </div>
                        <div className="bp-product-footer">
                          <div className="bp-product-price">
                            {product.priceMinEur === product.priceMaxEur
                              ? formatPrice(product.priceMinEur)
                              : `od ${formatPrice(product.priceMinEur)}`}
                          </div>
                          <button
                            className="bp-button-primary"
                            onClick={() => addToCart(product.id)}
                          >
                            Dodaj u košaricu
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}

              {teaGroups.some((g) => g.products.length === 0) && (
                <div className="bp-tea-missing-note">
                  Neki čajevi nisu pronađeni u katalogu. Ako želiš, mogu dodati
                  i “Ostali čajevi” sekciju za sve preostale čajeve koji nisu u
                  Jutro/Dan/Noć.
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {showMainNewsletter && (
        <div
          className="bp-newsletter-backdrop"
          role="presentation"
          onClick={dismissMainNewsletter}
        >
          <div
            className="bp-newsletter-modal bp-newsletter-modal--main"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bp-newsletter-main-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="bp-newsletter-close"
              onClick={dismissMainNewsletter}
              aria-label="Zatvori"
            >
              ×
            </button>
            <p className="bp-newsletter-kicker">Tea Club</p>
            <h2 id="bp-newsletter-main-title" className="bp-newsletter-title">
              Uzmi -10% na prvu narudžbu
            </h2>
            <p className="bp-newsletter-subtitle">
              + ekskluzivne mješavine i posebne ponude
            </p>
            <p className="bp-newsletter-lead">
              Pridruži se Tea Clubu — smirene obavijesti, bez nereda. Odjavi se kad god želiš.
            </p>
            <form className="bp-newsletter-form" onSubmit={submitNewsletter}>
              <label className="bp-newsletter-label" htmlFor="bp-newsletter-email-main">
                E-mail
              </label>
              <input
                id="bp-newsletter-email-main"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Unesi svoj email"
                value={newsletterInput}
                onChange={(e) => {
                  setNewsletterInput(e.target.value)
                  if (newsletterError) setNewsletterError('')
                }}
                className="bp-newsletter-input"
              />
              {newsletterError && (
                <p className="bp-newsletter-error" role="alert">
                  {newsletterError}
                </p>
              )}
              <button type="submit" className="bp-newsletter-cta">
                Otključaj moj popust
              </button>
            </form>
            <p className="bp-newsletter-footnote">
              Bez spama — samo poneka dobra vijest i pogodnosti za ljubitelje čaja.
            </p>
          </div>
        </div>
      )}

      {showExitNewsletter && (
        <div
          className="bp-newsletter-backdrop"
          role="presentation"
          onClick={dismissExitNewsletter}
        >
          <div
            className="bp-newsletter-modal bp-newsletter-modal--exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bp-newsletter-exit-title"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="bp-newsletter-close"
              onClick={dismissExitNewsletter}
              aria-label="Zatvori"
            >
              ×
            </button>
            <h2 id="bp-newsletter-exit-title" className="bp-newsletter-title">
              Čekaj — uzmi -10% prije nego odeš 👀
            </h2>
            <p className="bp-newsletter-lead">
              Evo mali poklon za prvu narudžbu.
            </p>
            <form className="bp-newsletter-form" onSubmit={submitNewsletter}>
              <label className="bp-newsletter-label" htmlFor="bp-newsletter-email-exit">
                E-mail
              </label>
              <input
                id="bp-newsletter-email-exit"
                type="email"
                name="email"
                autoComplete="email"
                placeholder="Unesi svoj email"
                value={newsletterInput}
                onChange={(e) => {
                  setNewsletterInput(e.target.value)
                  if (newsletterError) setNewsletterError('')
                }}
                className="bp-newsletter-input"
              />
              {newsletterError && (
                <p className="bp-newsletter-error" role="alert">
                  {newsletterError}
                </p>
              )}
              <button type="submit" className="bp-newsletter-cta">
                👉 Pošalji mi kod
              </button>
            </form>
            <p className="bp-newsletter-footnote">
              Bez spama. Samo dobre ponude i još bolji čaj.
            </p>
          </div>
        </div>
      )}

      {showWelcomeEmail && (
        <div
          className="bp-newsletter-backdrop"
          role="presentation"
          onClick={() => setShowWelcomeEmail(false)}
        >
          <div
            className="bp-newsletter-modal bp-newsletter-modal--welcome"
            role="dialog"
            aria-modal="true"
            aria-labelledby="bp-welcome-email-subject"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="bp-newsletter-close"
              onClick={() => setShowWelcomeEmail(false)}
              aria-label="Zatvori"
            >
              ×
            </button>
            <p className="bp-welcome-email-meta">
              <span className="bp-welcome-email-label">Predmet</span>
              <span id="bp-welcome-email-subject">
                Evo tvoj -10% kod 🎁
              </span>
            </p>
            <p className="bp-welcome-email-preview">
              <span className="bp-welcome-email-label">Pretpregled</span>
              Iskoristi ga dok traje
            </p>
            <div className="bp-welcome-email-body">
              <p>
                Hej 👋
                <br />
                dobrodošao u Tea Club 🍃
              </p>
              <p>Evo tvoj kod za -10%:</p>
              <p className="bp-welcome-code">
                👉 <strong>{DISCOUNT_CODE}</strong>
              </p>
              <p>
                Iskoristi ga na svoju prvu narudžbu i pronađi svoj novi omiljeni
                čaj.
              </p>
              <p>
                <strong>🔥 Preporuka:</strong>
                <br />
                Ako nisi siguran što uzeti — kreni s našim mix paketima i
                isprobaj više okusa odjednom.
              </p>
              <a
                className="bp-welcome-email-link"
                href="#products"
                onClick={() => setShowWelcomeEmail(false)}
              >
                👉 Pogledaj čajeve
              </a>
              <p className="bp-welcome-email-signoff">
                Vidimo se uskoro,
                <br />
                Tim 🍵
              </p>
            </div>
          </div>
        </div>
      )}

      {isCartOpen && (
        <div className="bp-cart-backdrop" onClick={() => setIsCartOpen(false)}>
          <aside
            className="bp-cart-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="bp-cart-header">
              <h2>Košarica</h2>
              <button
                className="bp-icon-button"
                onClick={() => setIsCartOpen(false)}
              >
                ×
              </button>
            </header>

            {cartItems.length === 0 ? (
              <div className="bp-cart-empty">
                <p>Košarica je prazna.</p>
              </div>
            ) : (
              <>
                <ul className="bp-cart-list">
                  {cartItems.map(({ product, quantity, lineTotal }) => (
                    <li key={product.id} className="bp-cart-item">
                      <div className="bp-cart-item-main">
                        <div className="bp-cart-item-name">
                          {product.name}
                        </div>
                        <div className="bp-cart-item-meta">
                          <span>{product.size}</span>
                          <span>{formatPrice(product.priceEur)}</span>
                        </div>
                      </div>
                      <div className="bp-cart-item-actions">
                        <div className="bp-qty-control">
                          <button
                            onClick={() =>
                              updateQuantity(product.id, quantity - 1)
                            }
                          >
                            -
                          </button>
                          <span>{quantity}</span>
                          <button
                            onClick={() =>
                              updateQuantity(product.id, quantity + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        <div className="bp-cart-item-total">
                          {formatPrice(lineTotal)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="bp-cart-footer">
                  <div className="bp-cart-summary">
                    <span>Ukupno</span>
                    <span className="bp-cart-total">
                      {formatPrice(cartTotal)}
                    </span>
                  </div>
                  <button
                    className="bp-button-secondary"
                    onClick={clearCart}
                  >
                    Isprazni košaricu
                  </button>
                  <button className="bp-button-primary" disabled>
                    Plaćanje (demo)
                  </button>
                  <p className="bp-cart-note">
                    Ovo je demo prikaz — košarica i plaćanje nisu povezani s
                    stvarnom narudžbom.
                  </p>
                </footer>
              </>
            )}
          </aside>
        </div>
      )}

      <footer className="bp-footer">
        <span>© {new Date().getFullYear()} demo prikaz čajeva</span>
      </footer>

      <div className="bp-sticky-mobile" role="region" aria-label="Brza narudžba">
        <button
          type="button"
          className="bp-sticky-mobile-primary"
          onClick={addDiscoveryAndOpenCart}
        >
          <span>Uzmi kutiju</span>
          <span className="bp-sticky-mobile-amount">
            {formatPrice(TEA_DISCOVERY_BOX_PRODUCT.priceEur)}
          </span>
        </button>
        <button
          type="button"
          className="bp-sticky-mobile-cart"
          onClick={() => setIsCartOpen(true)}
          aria-label="Otvori košaricu"
        >
          🛒
          {totalItems > 0 ? (
            <span className="bp-sticky-mobile-count">{totalItems}</span>
          ) : null}
        </button>
      </div>
    </div>
  )
}

export default App
