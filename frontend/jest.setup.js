import '@testing-library/jest-dom'
import 'whatwg-fetch'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: jest.fn(),
      pop: jest.fn(),
      reload: jest.fn(),
      back: jest.fn(),
      prefetch: jest.fn().mockResolvedValue(undefined),
      beforePopState: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
      },
      isFallback: false,
      isLocaleDomain: true,
      isReady: true,
      defaultLocale: 'fa',
      domainLocales: [],
      isPreview: false,
    }
  },
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    )
  }
})

// Mock Next.js Head
jest.mock('next/head', () => {
  return function MockHead({ children }) {
    return <>{children}</>
  }
})

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    form: 'form',
    p: 'p',
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    section: 'section',
    article: 'article',
    nav: 'nav',
    header: 'header',
    footer: 'footer',
    main: 'main',
    aside: 'aside',
    ul: 'ul',
    li: 'li',
    ol: 'ol',
    a: 'a',
    img: 'img',
    input: 'input',
    textarea: 'textarea',
    select: 'select',
    option: 'option',
    label: 'label',
    fieldset: 'fieldset',
    legend: 'legend',
    table: 'table',
    thead: 'thead',
    tbody: 'tbody',
    tr: 'tr',
    td: 'td',
    th: 'th',
    tfoot: 'tfoot',
    caption: 'caption',
    colgroup: 'colgroup',
    col: 'col',
    dl: 'dl',
    dt: 'dt',
    dd: 'dd',
    blockquote: 'blockquote',
    cite: 'cite',
    q: 'q',
    abbr: 'abbr',
    address: 'address',
    b: 'b',
    bdi: 'bdi',
    bdo: 'bdo',
    big: 'big',
    center: 'center',
    code: 'code',
    del: 'del',
    dfn: 'dfn',
    em: 'em',
    font: 'font',
    i: 'i',
    ins: 'ins',
    kbd: 'kbd',
    mark: 'mark',
    meter: 'meter',
    pre: 'pre',
    progress: 'progress',
    s: 's',
    samp: 'samp',
    small: 'small',
    strong: 'strong',
    sub: 'sub',
    sup: 'sup',
    time: 'time',
    tt: 'tt',
    u: 'u',
    var: 'var',
    wbr: 'wbr',
  },
  AnimatePresence: ({ children }) => children,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
  useMotionValue: () => ({
    set: jest.fn(),
    get: jest.fn(),
  }),
  useTransform: () => jest.fn(),
  useSpring: () => ({
    set: jest.fn(),
    get: jest.fn(),
  }),
  useInView: () => [jest.fn(), false],
  useReducedMotion: () => false,
}))

// Mock WebSocket
global.WebSocket = jest.fn(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  send: jest.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}))

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.sessionStorage = sessionStorageMock

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = jest.fn(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
}

// Setup test environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000/api'
process.env.NEXT_PUBLIC_WS_URL = 'ws://localhost:8000'
