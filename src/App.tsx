import { type ReactNode, useMemo, useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QRCode from 'qrcode';
import {
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Calculator,
  CalendarDays,
  CaseSensitive,
  Check,
  ChevronRight,
  Clock3,
  Copy,
  CreditCard,
  Database,
  Dices,
  FileText,
  HeartPulse,
  KeyRound,
  Menu,
  Palette,
  Percent,
  QrCode,
  RefreshCw,
  Ruler,
  Search,
  ShieldCheck,
  Tag,
  TextCursorInput,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Link, Route, Switch, useLocation, useParams, Router as WouterRouter } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type ToolKey =
  | 'percentage'
  | 'age'
  | 'word-count'
  | 'qr-code'
  | 'unit-converter'
  | 'bmi'
  | 'discount'
  | 'tip'
  | 'loan'
  | 'currency'
  | 'password'
  | 'color'
  | 'case'
  | 'character'
  | 'random'
  | 'date'
  | 'time'
  | 'data'
  | 'percentage-change'
  | 'reverse';

type Category = 'All tools' | 'Calculators' | 'Text tools' | 'Converters' | 'Generators';

type Tool = {
  key: ToolKey;
  name: string;
  description: string;
  category: Exclude<Category, 'All tools'>;
  icon: LucideIcon;
  featured?: boolean;
};

const tools: Tool[] = [
  { key: 'percentage', name: 'Percentage Calculator', description: 'Find percentages, totals, and changes in a few taps.', category: 'Calculators', icon: Percent, featured: true },
  { key: 'age', name: 'Age Calculator', description: 'Get an exact age between two dates.', category: 'Calculators', icon: CalendarDays, featured: true },
  { key: 'word-count', name: 'Word Counter', description: 'Count words, sentences, and reading time.', category: 'Text tools', icon: FileText, featured: true },
  { key: 'qr-code', name: 'QR Code Generator', description: 'Turn a link or message into a scannable code.', category: 'Generators', icon: QrCode },
  { key: 'unit-converter', name: 'Unit Converter', description: 'Convert length, weight, temperature, and more.', category: 'Converters', icon: Ruler },
  { key: 'bmi', name: 'BMI Calculator', description: 'Check body mass index with a useful range.', category: 'Calculators', icon: HeartPulse },
  { key: 'discount', name: 'Discount Calculator', description: 'See your sale price and exactly what you save.', category: 'Calculators', icon: Tag },
  { key: 'tip', name: 'Tip Calculator', description: 'Split a bill and land on a fair tip.', category: 'Calculators', icon: CreditCard },
  { key: 'loan', name: 'Loan Calculator', description: 'Estimate monthly repayments and total interest.', category: 'Calculators', icon: Calculator },
  { key: 'currency', name: 'Currency Converter', description: 'Convert with daily updated exchange rates across 35 currencies.', category: 'Converters', icon: ArrowLeftRight },
  { key: 'password', name: 'Password Generator', description: 'Create a strong, random password locally.', category: 'Generators', icon: KeyRound },
  { key: 'color', name: 'Color Picker', description: 'Pick a color and copy useful formats.', category: 'Generators', icon: Palette },
  { key: 'case', name: 'Case Converter', description: 'Switch text between common writing cases.', category: 'Text tools', icon: CaseSensitive },
  { key: 'character', name: 'Character Counter', description: 'Track characters with and without spaces.', category: 'Text tools', icon: TextCursorInput },
  { key: 'random', name: 'Random Number Generator', description: 'Generate a number within any range.', category: 'Generators', icon: Dices },
  { key: 'date', name: 'Date Calculator', description: 'Add days or find the distance between dates.', category: 'Calculators', icon: CalendarDays },
  { key: 'time', name: 'Time Converter', description: 'Translate time across familiar global zones.', category: 'Converters', icon: Clock3 },
  { key: 'data', name: 'Data Unit Converter', description: 'Move between bytes, KB, MB, GB, and TB.', category: 'Converters', icon: Database },
  { key: 'percentage-change', name: 'Percentage Change Calculator', description: 'Measure the increase or decrease between values.', category: 'Calculators', icon: RefreshCw },
  { key: 'reverse', name: 'Text Reverser', description: 'Flip text instantly, character by character.', category: 'Text tools', icon: ArrowLeftRight },
];

const categories: Category[] = ['All tools', 'Calculators', 'Text tools', 'Converters', 'Generators'];

const currencyOptions = [
  ['USD', 'US Dollar'], ['EUR', 'Euro'], ['GBP', 'British Pound'], ['PKR', 'Pakistani Rupee'],
  ['INR', 'Indian Rupee'], ['AED', 'UAE Dirham'], ['SAR', 'Saudi Riyal'], ['AUD', 'Australian Dollar'],
  ['CAD', 'Canadian Dollar'], ['NZD', 'New Zealand Dollar'], ['JPY', 'Japanese Yen'], ['CNY', 'Chinese Yuan'],
  ['HKD', 'Hong Kong Dollar'], ['SGD', 'Singapore Dollar'], ['CHF', 'Swiss Franc'], ['KRW', 'South Korean Won'],
  ['MYR', 'Malaysian Ringgit'], ['THB', 'Thai Baht'], ['IDR', 'Indonesian Rupiah'], ['PHP', 'Philippine Peso'],
  ['BDT', 'Bangladeshi Taka'], ['LKR', 'Sri Lankan Rupee'], ['NPR', 'Nepalese Rupee'], ['ZAR', 'South African Rand'],
  ['BRL', 'Brazilian Real'], ['MXN', 'Mexican Peso'], ['RUB', 'Russian Ruble'], ['TRY', 'Turkish Lira'],
  ['NOK', 'Norwegian Krone'], ['SEK', 'Swedish Krona'], ['DKK', 'Danish Krone'], ['PLN', 'Polish Zloty'],
  ['CZK', 'Czech Koruna'], ['HUF', 'Hungarian Forint'], ['ILS', 'Israeli New Shekel'],
] as const;

type ExchangeRateResponse = {
  result: string;
  base_code?: string;
  rates?: Record<string, number>;
  time_last_update_utc?: string;
  time_next_update_utc?: string;
};

function formatNumber(value: number, digits = 2) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: digits }).format(value);
}

function formatCurrencyAmount(value: number, currency: string) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    maximumFractionDigits: ['JPY', 'KRW', 'IDR', 'VND'].includes(currency) ? 0 : 4,
  }).format(value);
}

function formatRateTimestamp(value?: string) {
  if (!value) return 'the latest available time';
  return new Date(value).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function randomInt(max: number) {
  if (max <= 0) return 0;
  const cryptoObject = globalThis.crypto;
  if (cryptoObject?.getRandomValues) {
    const values = new Uint32Array(1);
    cryptoObject.getRandomValues(values);
    return values[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="site-nav">
      <div className="nav-inner">
        <Link href="/" className="brand" data-testid="link-brand">
          <span className="brand-mark"><Zap size={17} strokeWidth={2.7} /></span>
          <span>My Tool Hub</span>
        </Link>
        <nav className={`nav-links${open ? ' open' : ''}`} aria-label="Primary navigation">
          <a href="/#tools" onClick={() => setOpen(false)} data-testid="link-browse-tools">Browse tools</a>
          <a href="/#popular" onClick={() => setOpen(false)} data-testid="link-popular-tools">Popular</a>
          <a href="/#about" onClick={() => setOpen(false)} data-testid="link-about">About</a>
          <a href="/#contact" onClick={() => setOpen(false)} data-testid="link-contact">Contact</a>
        </nav>
        <a href="/#tools" className="nav-cta" data-testid="link-open-tool">Open a tool <ArrowRight size={13} /></a>
        <button className="mobile-menu" onClick={() => setOpen((value) => !value)} aria-label="Toggle navigation" data-testid="button-toggle-navigation">
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div>
          <Link href="/" className="brand" data-testid="link-footer-brand">
            <span className="brand-mark"><Zap size={15} /></span><span>My Tool Hub</span>
          </Link>
          <p style={{ marginTop: 12 }}>Small tools. Clear answers. No account required.</p>
        </div>
        <div className="footer-links">
          <a href="/#tools" data-testid="link-footer-tools">All tools</a>
          <a href="/#popular" data-testid="link-footer-popular">Popular</a>
          <a href="/#about" data-testid="link-footer-about">About</a>
          <a href="/#contact" data-testid="link-footer-contact">Contact</a>
        </div>
        <p>Built for the in-between moments.</p>
      </div>
    </footer>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  const Icon = tool.icon;
  return (
    <Link href={`/tools/${tool.key}`} className="tool-card" data-testid={`link-tool-${tool.key}`}>
      <div>
        <span className="tool-icon"><Icon size={17} /></span>
        <h3>{tool.name}</h3>
        <p>{tool.description}</p>
      </div>
      <div className="tool-card-footer"><span>{tool.category}</span><ChevronRight size={15} /></div>
    </Link>
  );
}

function Home() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<Category>('All tools');
  const filteredTools = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return tools.filter((tool) => {
      const matchesCategory = category === 'All tools' || tool.category === category;
      const matchesQuery = !normalized || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [category, query]);
  const featured = tools.filter((tool) => tool.featured);

  return (
    <div className="app-shell">
      <Header />
      <main>
        <section className="hero">
          <div className="container hero-grid">
            <div className="fade-in">
              <div className="eyebrow">A better starting point</div>
              <h1>Useful tools.<br /><span>Zero friction.</span></h1>
              <p className="hero-copy">Twenty quick, private utilities for the little problems that slow your day down. Calculate, convert, generate, and get back to what matters.</p>
              <div className="hero-actions">
                <a href="#tools" className="primary-button" data-testid="button-explore-tools">Explore all tools <ArrowRight size={14} /></a>
                <Link href="/tools/percentage" className="secondary-button" data-testid="link-try-calculator">Try the percentage calculator</Link>
              </div>
              <p className="hero-note"><ShieldCheck size={13} style={{ verticalAlign: '-2px', marginRight: 5 }} /> <strong>Private by default.</strong> Your inputs stay in your browser.</p>
            </div>
            <div className="orbit-card fade-in delay-1" aria-label="A constellation of fast browser tools">
              <div className="orbit-center"><div className="orbit-word">20<br />TOOLS</div></div>
              <span className="orbit-label one">calculate</span><span className="orbit-label two">convert</span><span className="orbit-label three">create</span>
            </div>
          </div>
        </section>

        <section className="section" id="tools">
          <div className="container">
            <div className="section-heading">
              <div><div className="eyebrow">The toolbox</div><h2>Find the right shortcut.</h2></div>
              <p>One focused tool per task. No dashboards to learn, no sign-in wall, and no mystery buttons.</p>
            </div>
            <div className="search-bar" style={{ marginBottom: 18 }}>
              <Search size={19} />
              <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tools by name or task…" aria-label="Search tools" data-testid="input-search-tools" />
            </div>
            <div className="category-row" aria-label="Tool categories">
              {categories.map((item) => <button key={item} className={`category-chip${category === item ? ' active' : ''}`} onClick={() => setCategory(item)} data-testid={`button-category-${item.toLowerCase().replaceAll(' ', '-')}`}>{item}</button>)}
            </div>
            <div className="tools-grid" style={{ marginTop: 16 }}>
              {filteredTools.length ? filteredTools.map((tool) => <ToolCard key={tool.key} tool={tool} />) : <div className="empty-state"><Search size={20} /><h3>No tool found</h3><p>Try a broader search or choose All tools.</p></div>}
            </div>
          </div>
        </section>

        <section className="section featured-section" id="popular">
          <div className="container featured-layout">
            <div className="featured-intro">
              <div className="eyebrow">Start here</div>
              <h2>The everyday<br />heavy hitters.</h2>
              <p>These are the tools people reach for first — designed to answer a question before it becomes a project.</p>
              <Link href="/tools/word-count" className="secondary-button" style={{ display: 'inline-flex', marginTop: 13 }} data-testid="link-featured-word-counter">Count some words <ArrowRight size={14} /></Link>
            </div>
            <div className="feature-list">
              {featured.map((tool) => {
                const Icon = tool.icon;
                return <Link key={tool.key} href={`/tools/${tool.key}`} className="feature-row" data-testid={`link-featured-${tool.key}`}>
                  <span className="tool-icon"><Icon size={17} /></span><div><h3>{tool.name}</h3><p>{tool.description}</p></div><ArrowRight size={15} className="feature-arrow" />
                </Link>;
              })}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-heading"><div><div className="eyebrow">Good to know</div><h2>Made for quick answers.</h2></div><p>A quiet, dependable corner of the internet for the tasks that don't deserve a spreadsheet.</p></div>
            <div className="trust-strip">
              <div className="trust-item"><strong>20</strong><span>free browser utilities</span></div>
              <div className="trust-item"><strong>0</strong><span>accounts or downloads</span></div>
              <div className="trust-item"><strong>1 tap</strong><span>to reset every tool</span></div>
            </div>
          </div>
        </section>

        <section className="section info-section" id="about">
          <div className="container info-grid">
            <div>
              <div className="eyebrow">About the hub</div>
              <h2>Useful by design.</h2>
            </div>
            <p>My Tool Hub keeps small everyday jobs in one calm, private place. Every tool runs in your browser, with clear inputs, understandable results, and no account to create.</p>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div className="container contact-card">
            <div>
              <div className="eyebrow">Have a suggestion?</div>
              <h2>Make the toolbox better.</h2>
              <p>Tell us which small task you would like to see made simpler. Product feedback and tool ideas are welcome.</p>
              <a className="contact-email" href="mailto:gewadeveloper@gmail.com">gewadeveloper@gmail.com</a>
            </div>
            <a className="primary-button" href="mailto:gewadeveloper@gmail.com" data-testid="link-contact-email">Email the team <ArrowRight size={14} /></a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder, min, step }: { label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; min?: string; step?: string }) {
  return <div className="field"><label className="panel-label">{label}</label><input type={type} value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} min={min} step={step} data-testid={`input-${label.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')}`} /></div>;
}

function ColorField({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const pickerValue = /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#5DD5FF';
  return (
    <div className="color-field">
      <div className="color-picker-control">
        <input
          type="color"
          value={pickerValue}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
          aria-label="Choose a color"
          data-testid="input-color-picker"
        />
        <div>
          <span className="color-swatch" style={{ backgroundColor: pickerValue }} />
          <span className="color-picker-value">{pickerValue.toUpperCase()}</span>
        </div>
      </div>
      <div className="field">
        <label className="panel-label" htmlFor="hex-color-input">Hex color</label>
        <input
          id="hex-color-input"
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#5DD5FF"
          spellCheck={false}
          data-testid="input-hex-color"
        />
        <p className="hint color-hint">Choose a swatch or enter a six-digit hex value.</p>
      </div>
    </div>
  );
}

function PercentageFields({ percent, amount, onPercentChange, onAmountChange }: { percent: string; amount: string; onPercentChange: (value: string) => void; onAmountChange: (value: string) => void }) {
  return (
    <div className="percentage-form">
      <div className="percentage-formula" aria-label="Percentage calculation inputs">
        <div className="percentage-input">
          <label className="panel-label" htmlFor="percentage-input">What percent?</label>
          <div className="input-suffix">
            <input id="percentage-input" type="number" value={percent} onChange={(event) => onPercentChange(event.target.value)} placeholder="18" step="any" data-testid="input-percentage" />
            <span>%</span>
          </div>
        </div>
        <span className="formula-word">of</span>
        <div className="percentage-input">
          <label className="panel-label" htmlFor="amount-input">Of which amount?</label>
          <input id="amount-input" type="number" value={amount} onChange={(event) => onAmountChange(event.target.value)} placeholder="240" step="any" data-testid="input-amount" />
        </div>
      </div>
      <p className="hint">Formula: amount × percentage ÷ 100</p>
    </div>
  );
}

function Result({ value, subtext, copied, onCopy }: { value?: string; subtext?: string; copied?: boolean; onCopy?: () => void }) {
  return <div className="result-box"><div>{value ? <><div className="result-value" data-testid="text-result-value">{value}</div>{subtext && <div className="result-subtext" data-testid="text-result-subtext">{subtext}</div>}{onCopy && <button className="secondary-button" style={{ marginTop: 17 }} onClick={onCopy} data-testid="button-copy-result">{copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy result</>}</button>}</> : <div className="hint">Your result will appear here.</div>}</div></div>;
}

function QRPreview({ value }: { value: string }) {
  const [dataUrl, setDataUrl] = useState('');
  useEffect(() => {
    let cancelled = false;
    void QRCode.toDataURL(value, {
      width: 220,
      margin: 1,
      color: { dark: '#07111e', light: '#d7f4ff' },
    }).then((url) => {
      if (!cancelled) setDataUrl(url);
    }).catch(() => {
      if (!cancelled) setDataUrl('');
    });
    return () => { cancelled = true; };
  }, [value]);
  return dataUrl
    ? <img src={dataUrl} alt={`QR code for ${value}`} style={{ display: 'block', width: 220, height: 220, margin: '0 auto', borderRadius: 8 }} />
    : <div className="hint" aria-busy="true">Creating your QR code…</div>;
}

function ToolWorkspace({ tool }: { tool: Tool }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState('');
  const [subtext, setSubtext] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef(0);
  const setValue = (key: string, value: string) => setValues((current) => ({ ...current, [key]: value }));
  const val = (key: string) => values[key] ?? (key === 'time' ? '09:00' : key === 'at' || key === 'date' ? todayString() : '');
  const reset = () => { requestRef.current += 1; setValues({}); setResult(''); setSubtext(''); setError(''); setCopied(false); setIsLoading(false); };
  const copyResult = () => { if (result) { void navigator.clipboard?.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } };
  const calculate = async () => {
    setError(''); setCopied(false); setIsLoading(false); let output = ''; let detail = '';
    const number = (key: string) => Number.parseFloat(val(key));
    const requireNumbers = (...keys: string[]) => keys.every((key) => val(key).trim() !== '' && Number.isFinite(number(key)));
    if (tool.key === 'percentage') {
      if (!requireNumbers('percent', 'amount')) return setError('Enter a valid percentage and amount.');
      output = formatNumber(number('amount') * number('percent') / 100); detail = `${val('percent')}% of ${formatNumber(number('amount'))}`;
    } else if (tool.key === 'age') {
      if (!val('birth')) return setError('Choose a date of birth to calculate an age.');
      const birth = new Date(`${val('birth')}T00:00:00`); const at = new Date(`${val('at') || todayString()}T00:00:00`);
      if (birth > at) return setError('The birth date must be before the date you are checking.');
      let years = at.getFullYear() - birth.getFullYear(); const monthDiff = at.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && at.getDate() < birth.getDate())) years--;
      const days = Math.floor((at.getTime() - new Date(birth.getFullYear() + years, birth.getMonth(), birth.getDate()).getTime()) / 86400000);
      output = `${years} years`; detail = `${days} additional days`;
    } else if (tool.key === 'word-count') {
      const text = val('text').trim(); if (!text) return setError('Paste or type some text first.');
      const words = text.split(/\s+/).length; const sentences = text.split(/[.!?]+/).filter(Boolean).length; output = `${words} words`; detail = `${text.length} characters · ${sentences} sentences · about ${Math.max(1, Math.ceil(words / 200))} min read`;
    } else if (tool.key === 'qr-code') {
      if (!val('text').trim()) return setError('Enter a link or message to create a code.');
      output = val('text').trim(); detail = 'A local preview pattern based on your input.';
    } else if (tool.key === 'unit-converter') {
      if (!requireNumbers('amount')) return setError('Enter a valid amount to convert.');
      const amount = number('amount'); const from = val('from') || 'km'; const to = val('to') || 'mi';
      const meters: Record<string, number> = { km: 1000, mi: 1609.344, m: 1, ft: .3048, cm: .01 };
      if (!meters[from] || !meters[to]) return setError('Choose supported units.');
      output = formatNumber(amount * meters[from] / meters[to], 4); detail = `${from} → ${to}`;
    } else if (tool.key === 'bmi') {
      if (!requireNumbers('weight', 'height') || number('weight') <= 0 || number('height') <= 0) return setError('Enter a valid weight and height.');
      const bmi = number('weight') / ((number('height') / 100) ** 2); output = formatNumber(bmi, 1); detail = bmi < 18.5 ? 'Below the typical range' : bmi < 25 ? 'Within the typical range' : bmi < 30 ? 'Above the typical range' : 'High range';
    } else if (tool.key === 'discount') {
      if (!requireNumbers('price', 'discount')) return setError('Enter a valid price and discount.');
      const saved = number('price') * number('discount') / 100; output = formatNumber(number('price') - saved); detail = `You save ${formatNumber(saved)} (${val('discount')}% off)`;
    } else if (tool.key === 'tip') {
      if (!requireNumbers('bill', 'tip')) return setError('Enter a valid bill and tip percentage.');
      const tip = number('bill') * number('tip') / 100; const people = Math.max(1, number('people') || 1); output = formatNumber((number('bill') + tip) / people); detail = `${formatNumber(tip)} tip · ${formatNumber(number('bill') + tip)} total · each of ${people}`;
    } else if (tool.key === 'loan') {
      if (!requireNumbers('principal', 'rate', 'months') || number('principal') <= 0 || number('months') <= 0) return setError('Enter a valid principal, rate, and term.');
      const monthlyRate = number('rate') / 1200; const payment = monthlyRate ? number('principal') * monthlyRate * (1 + monthlyRate) ** number('months') / ((1 + monthlyRate) ** number('months') - 1) : number('principal') / number('months'); output = formatNumber(payment); detail = `${formatNumber(payment * number('months'))} total repayment · ${formatNumber(payment * number('months') - number('principal'))} interest`;
    } else if (tool.key === 'currency') {
      if (!requireNumbers('amount')) return setError('Enter a valid amount.');
      const from = val('from') || 'USD';
      const to = val('to') || 'EUR';
      const requestId = ++requestRef.current;
      setIsLoading(true);
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from)}`, { cache: 'no-store' });
        if (!response.ok) throw new Error('The rate service is unavailable.');
        const data = await response.json() as ExchangeRateResponse;
        if (requestId !== requestRef.current) return;
        const fetchedRate = data.rates?.[to];
        if (data.result !== 'success' || typeof fetchedRate !== 'number' || !Number.isFinite(fetchedRate)) throw new Error('This currency pair is not available right now.');
        const rate = fetchedRate;
        output = `${formatCurrencyAmount(number('amount') * rate, to)} ${to}`;
        const updatedAt = formatRateTimestamp(data.time_last_update_utc);
        const nextUpdate = data.time_next_update_utc ? formatRateTimestamp(data.time_next_update_utc) : '';
        detail = `1 ${from} = ${formatNumber(rate, 6)} ${to} · Rate updated ${updatedAt}${nextUpdate ? ` · Next update ${nextUpdate}` : ''}`;
        setResult(output); setSubtext(detail);
      } catch (requestError) {
        if (requestId === requestRef.current) setError(requestError instanceof Error ? requestError.message : 'Could not load the latest exchange rate.');
      } finally {
        if (requestId === requestRef.current) setIsLoading(false);
      }
      return;
    } else if (tool.key === 'password') {
      const length = Math.min(64, Math.max(8, Math.round(number('length') || 16))); const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*'; let password = '';
      for (let index = 0; index < length; index++) password += chars[randomInt(chars.length)];
      output = password; detail = `${length} characters · generated locally`;
    } else if (tool.key === 'color') {
      const color = val('color') || '#5DD5FF'; const hex = color.replace('#', ''); if (!/^[0-9a-fA-F]{6}$/.test(hex)) return setError('Use a six-digit hex color, such as #5DD5FF.');
      const r = parseInt(hex.slice(0, 2), 16); const g = parseInt(hex.slice(2, 4), 16); const b = parseInt(hex.slice(4, 6), 16); output = `rgb(${r}, ${g}, ${b})`; detail = color.toUpperCase(); 
    } else if (tool.key === 'case') {
      const text = val('text'); if (!text.trim()) return setError('Enter text to transform.'); const words = text.trim().toLowerCase().split(/\s+/); const mode = val('mode') || 'title';
      output = mode === 'upper' ? text.toUpperCase() : mode === 'lower' ? text.toLowerCase() : mode === 'sentence' ? `${text.trim().charAt(0).toUpperCase()}${text.trim().slice(1).toLowerCase()}` : words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); detail = mode === 'title' ? 'Title Case' : `${mode.charAt(0).toUpperCase()}${mode.slice(1)} case`;
    } else if (tool.key === 'character') {
      const text = val('text'); if (!text) return setError('Enter text to count.'); output = `${text.length}`; detail = `${text.replace(/\s/g, '').length} without spaces · ${text.split(/\n/).length} lines`;
    } else if (tool.key === 'random') {
      if (!requireNumbers('min', 'max') || number('min') > number('max')) return setError('Enter a valid minimum and maximum.');
      const low = Math.ceil(number('min')); const high = Math.floor(number('max')); if (low > high) return setError('Choose a range that contains at least one whole number.'); output = `${low + randomInt(high - low + 1)}`; detail = `Between ${low} and ${high}`;
    } else if (tool.key === 'date') {
      const date = new Date(`${val('date') || todayString()}T00:00:00`); const days = number('days'); if (!Number.isFinite(days)) return setError('Enter a valid number of days.'); date.setDate(date.getDate() + days); output = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); detail = `${days >= 0 ? 'After' : 'Before'} ${Math.abs(days)} days`;
    } else if (tool.key === 'time') {
      if (!val('time')) return setError('Choose a time to convert.'); const [hours, minutes] = val('time').split(':').map(Number); const offsets: Record<string, number> = { UTC: 0, 'New York': -5, London: 0, 'Berlin': 1, 'Tokyo': 9, Sydney: 10 }; const fromOffset = offsets[val('from')] ?? 0; const toOffset = offsets[val('to')] ?? 0; const total = (hours * 60 + minutes) + (toOffset - fromOffset) * 60; const normalized = (total + 1440) % 1440; output = `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`; detail = `${val('from') || 'UTC'} → ${val('to') || 'Tokyo'} · fixed standard offsets`;
    } else if (tool.key === 'data') {
      if (!requireNumbers('amount')) return setError('Enter a valid amount.'); const units: Record<string, number> = { B: 1, KB: 1024, MB: 1048576, GB: 1073741824, TB: 1099511627776 }; const from = val('from') || 'MB'; const to = val('to') || 'GB'; output = formatNumber(number('amount') * units[from] / units[to], 6); detail = `${from} → ${to} · binary units`;
    } else if (tool.key === 'percentage-change') {
      if (!requireNumbers('old', 'new') || number('old') === 0) return setError('Enter valid values; the original value cannot be zero.'); const change = (number('new') - number('old')) / Math.abs(number('old')) * 100; output = `${change >= 0 ? '+' : ''}${formatNumber(change)}%`; detail = change >= 0 ? 'Increase from the original value' : 'Decrease from the original value';
    } else if (tool.key === 'reverse') {
      if (!val('text')) return setError('Enter text to reverse.'); output = [...val('text')].reverse().join(''); detail = `${val('text').length} characters reversed`;
    }
    setResult(output); setSubtext(detail);
  };

  const commonText = <textarea value={val('text')} onChange={(event) => setValue('text', event.target.value)} placeholder="Type or paste here…" data-testid="input-text-content" />;
  const select = (label: string, key: string, options: string[]) => <div className="field"><label className="panel-label">{label}</label><select value={val(key) || options[0]} onChange={(event) => setValue(key, event.target.value)} data-testid={`select-${key}`}>{options.map((option) => <option key={option}>{option}</option>)}</select></div>;
  let form: ReactNode;
  if (tool.key === 'percentage') form = <PercentageFields percent={val('percent')} amount={val('amount')} onPercentChange={(value) => setValue('percent', value)} onAmountChange={(value) => setValue('amount', value)} />;
  else if (tool.key === 'age') form = <div className="field-grid"><Field label="Date of birth" value={val('birth')} onChange={(value) => setValue('birth', value)} type="date" /><Field label="Calculate age at" value={val('at') || todayString()} onChange={(value) => setValue('at', value)} type="date" /></div>;
  else if (tool.key === 'word-count' || tool.key === 'character' || tool.key === 'reverse') form = <div className="field"><label className="panel-label">Your text</label>{commonText}</div>;
  else if (tool.key === 'qr-code') form = <Field label="Link or message" value={val('text')} onChange={(value) => setValue('text', value)} placeholder="https://example.com" />;
  else if (tool.key === 'unit-converter') form = <><Field label="Amount" value={val('amount')} onChange={(value) => setValue('amount', value)} type="number" placeholder="e.g. 10" /><div className="field-grid">{select('From', 'from', ['km', 'mi', 'm', 'ft', 'cm'])}{select('To', 'to', ['mi', 'km', 'm', 'ft', 'cm'])}</div></>;
  else if (tool.key === 'bmi') form = <div className="field-grid"><Field label="Weight (kg)" value={val('weight')} onChange={(value) => setValue('weight', value)} type="number" placeholder="e.g. 72" /><Field label="Height (cm)" value={val('height')} onChange={(value) => setValue('height', value)} type="number" placeholder="e.g. 175" /></div>;
  else if (tool.key === 'discount') form = <div className="field-grid"><Field label="Original price" value={val('price')} onChange={(value) => setValue('price', value)} type="number" placeholder="e.g. 89.99" /><Field label="Discount %" value={val('discount')} onChange={(value) => setValue('discount', value)} type="number" placeholder="e.g. 20" /></div>;
  else if (tool.key === 'tip') form = <div className="field-grid"><Field label="Bill total" value={val('bill')} onChange={(value) => setValue('bill', value)} type="number" placeholder="e.g. 84" /><Field label="Tip %" value={val('tip')} onChange={(value) => setValue('tip', value)} type="number" placeholder="e.g. 18" /><Field label="People" value={val('people') || '1'} onChange={(value) => setValue('people', value)} type="number" min="1" /></div>;
  else if (tool.key === 'loan') form = <><Field label="Loan principal" value={val('principal')} onChange={(value) => setValue('principal', value)} type="number" placeholder="e.g. 18000" /><div className="field-grid"><Field label="Annual rate %" value={val('rate')} onChange={(value) => setValue('rate', value)} type="number" placeholder="e.g. 6.5" step=".1" /><Field label="Term (months)" value={val('months')} onChange={(value) => setValue('months', value)} type="number" placeholder="e.g. 48" /></div></>;
   else if (tool.key === 'currency') {
     const currencySelect = (label: string, key: string, fallback: string) => <div className="field"><label className="panel-label">{label}</label><select value={val(key) || fallback} onChange={(event) => setValue(key, event.target.value)} data-testid={`select-${key}`}>{currencyOptions.map(([code, name]) => <option key={code} value={code}>{code} — {name}</option>)}</select></div>;
     form = <><Field label="Amount" value={val('amount')} onChange={(value) => setValue('amount', value)} type="number" placeholder="e.g. 100" step="any" /><div className="field-grid">{currencySelect('From', 'from', 'USD')}{currencySelect('To', 'to', 'EUR')}</div><button className="secondary-button currency-swap" type="button" onClick={() => setValues((current) => ({ ...current, from: val('to') || 'EUR', to: val('from') || 'USD' }))}><ArrowLeftRight size={14} /> Swap currencies</button><p className="hint">Rates are fetched when you calculate. The provider updates them daily, and the exact update time appears in the result.</p></>;
   }
  else if (tool.key === 'password') form = <Field label="Password length" value={val('length') || '16'} onChange={(value) => setValue('length', value)} type="number" min="8" />;
   else if (tool.key === 'color') form = <ColorField value={val('color') || '#5DD5FF'} onChange={(value) => setValue('color', value)} />;
  else if (tool.key === 'case') form = <><div className="field"><label className="panel-label">Your text</label>{commonText}</div>{select('Transform to', 'mode', ['title', 'upper', 'lower', 'sentence'])}</>;
  else if (tool.key === 'random') form = <div className="field-grid"><Field label="Minimum" value={val('min')} onChange={(value) => setValue('min', value)} type="number" placeholder="1" /><Field label="Maximum" value={val('max')} onChange={(value) => setValue('max', value)} type="number" placeholder="100" /></div>;
  else if (tool.key === 'date') form = <div className="field-grid"><Field label="Starting date" value={val('date') || todayString()} onChange={(value) => setValue('date', value)} type="date" /><Field label="Days to add" value={val('days')} onChange={(value) => setValue('days', value)} type="number" placeholder="e.g. 30 or -7" /></div>;
  else if (tool.key === 'time') form = <><Field label="Time" value={val('time') || '09:00'} onChange={(value) => setValue('time', value)} type="time" /><div className="field-grid">{select('From zone', 'from', ['UTC', 'New York', 'London', 'Berlin', 'Tokyo', 'Sydney'])}{select('To zone', 'to', ['Tokyo', 'UTC', 'New York', 'London', 'Berlin', 'Sydney'])}</div></>;
  else if (tool.key === 'data') form = <><Field label="Amount" value={val('amount')} onChange={(value) => setValue('amount', value)} type="number" placeholder="e.g. 512" /><div className="field-grid">{select('From', 'from', ['MB', 'B', 'KB', 'GB', 'TB'])}{select('To', 'to', ['GB', 'MB', 'B', 'KB', 'TB'])}</div></>;
  else form = <div className="field-grid"><Field label="Original value" value={val('old')} onChange={(value) => setValue('old', value)} type="number" placeholder="e.g. 80" /><Field label="New value" value={val('new')} onChange={(value) => setValue('new', value)} type="number" placeholder="e.g. 95" /></div>;

  return <div className="tool-workspace">
    <section className="panel">
      <h2>Enter your details</h2>{form}
      {error && <p className="error-message" role="alert" data-testid="status-tool-error">{error}</p>}
       <div className="button-row"><button className="primary-button" onClick={() => void calculate()} disabled={isLoading} data-testid="button-calculate">{isLoading ? 'Loading rate…' : 'Calculate'} <ArrowRight size={14} /></button><button className="secondary-button" onClick={reset} data-testid="button-reset">Clear <RefreshCw size={14} /></button></div>
    </section>
    <section className="panel result-panel">
      <h2>Result</h2>
      {tool.key === 'qr-code' && result ? <div className="result-box" style={{ display: 'block' }}><QRPreview value={result} /><div className="result-subtext" style={{ marginTop: 16 }}>{subtext}</div></div> : <Result value={result} subtext={subtext} copied={copied} onCopy={result ? copyResult : undefined} />}
    </section>
  </div>;
}

function ToolPage() {
  const params = useParams<{ key: string }>();
  const tool = tools.find((item) => item.key === params.key);
  if (!tool) return <NotFound />;
  const Icon = tool.icon;
  return <div className="app-shell"><Header /><main className="tool-page"><div className="container">
    <Link href="/#tools" className="tool-breadcrumb" data-testid="link-back-tools"><ArrowLeft size={14} /> All tools</Link>
    <div className="tool-header"><div className="eyebrow"><Icon size={13} /> {tool.category}</div><h1>{tool.name}</h1><p>{tool.description} Built to give you a clear answer without leaving your browser.</p></div>
    <ToolWorkspace tool={tool} />
  </div></main><Footer /></div>;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  useEffect(() => {
    document.title = 'My Tool Hub — Useful tools. Zero friction.';
    const description = 'Fast, free browser tools for calculations, conversions, text, dates, and everyday tasks.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) { meta = document.createElement('meta'); meta.setAttribute('name', 'description'); document.head.appendChild(meta); }
    meta.setAttribute('content', description);
  }, []);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><RoutedErrorBoundary><Switch><Route path="/" component={Home} /><Route path="/tools/:key" component={ToolPage} /><Route component={NotFound} /></Switch></RoutedErrorBoundary></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;