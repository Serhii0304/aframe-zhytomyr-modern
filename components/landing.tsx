'use client';
import {
  useEffect,
  useRef,
  useState,
  type SubmitEvent,
  type MouseEvent,
} from 'react';
import {
  ArrowUpRight,
  ArrowRight,
  ArrowDown,
  Phone,
  Menu,
  X,
  MapPin,
  Plus,
  Expand,
  Mail,
  LoaderCircle,
  MessageCircle,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { imageDimensions } from '@/lib/images';
import { PhotoViewer } from '@/components/photo-viewer';
import { useReveal } from '@/hooks/use-reveal';
import { normalizePhone, viberLink, telegramLink } from '@/lib/contact';
import {
  asset,
  PHONE,
  PHONE_LABEL,
  EMAIL,
  navigation,
  gallery,
  services,
  faq,
} from '@/lib/content';

function Brand() {
  return (
    <a className="brand" href="#home" aria-label="А-ФРЕЙМ — на головну">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path
          d="M16 3 29 29H3Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
        />
        <path d="m16 14 6 15H10Z" fill="currentColor" />
      </svg>
      <span>
        А-ФРЕЙМ<small>КАРКАСНЕ БУДІВНИЦТВО</small>
      </span>
    </a>
  );
}
function Photo({
  name,
  alt,
  priority = false,
  sizes = '(max-width: 680px) 100vw, 45vw',
}: {
  name: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
}) {
  const meta = imageDimensions[name];
  const srcSet = [
    asset(name + '-360') + ' 360w',
    ...(meta.medium ? [asset(name + '-600') + ' 600w'] : []),
    asset(name) + ' ' + meta.width + 'w',
  ].join(', ');
  return (
    <img
      src={asset(name)}
      srcSet={srcSet}
      sizes={sizes}
      width={meta.width}
      height={meta.height}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding="async"
    />
  );
}

export default function Landing() {
  const revealRoot = useReveal();
  const [menu, setMenu] = useState(false);
  const [filter, setFilter] = useState('portfolio');
  const [selected, setSelected] = useState<number | null>(null);
  const [type, setType] = useState<string | null>('Будинки А-фрейм');
  const [consent, setConsent] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ kind: string; text: string } | null>(
    null,
  );
  const [messenger, setMessenger] = useState<string | null>(null);
  const appCleanup = useRef<(() => void) | null>(null);
  useEffect(() => () => appCleanup.current?.(), []);
  function openViber(event: MouseEvent<HTMLAnchorElement>, call = false) {
    event.preventDefault();
    appCleanup.current?.();
    setMessenger(
      call
        ? 'Для дзвінка у Viber натисніть значок трубки у відкритому чаті.'
        : null,
    );
    let leftPage = false;
    const markHidden = () => {
      if (document.visibilityState === 'hidden') leftPage = true;
    };
    const markLeft = () => {
      leftPage = true;
    };
    document.addEventListener('visibilitychange', markHidden);
    window.addEventListener('pagehide', markLeft);
    const timer = window.setTimeout(() => {
      if (!leftPage && document.visibilityState === 'visible')
        setMessenger(
          'Viber не відкрився? Перевірте, чи встановлено застосунок, або скористайтеся звичайним дзвінком.',
        );
      cleanup();
    }, 1800);
    const cleanup = () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', markHidden);
      window.removeEventListener('pagehide', markLeft);
    };
    appCleanup.current = cleanup;
    window.location.href = viberLink(
      PHONE,
      navigator.userAgent,
      window.location.origin + window.location.pathname + '#contact',
    );
  }
  const filtered = gallery.filter(
    (photo) => filter === 'all' || photo.category === filter,
  );
  function selectService(value: string) {
    setType(value);
    document.getElementById('contact')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  }
  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget,
      data = new FormData(form);
    const fieldText = (key: string) => {
      const value = data.get(key);
      return typeof value === 'string' ? value : '';
    };
    if (fieldText('_honey').trim()) return;
    const name = fieldText('name').trim();
    const normalizedPhone = normalizePhone(fieldText('phone'));
    if (name.length < 2) {
      setFieldError('name');
      setStatus({ kind: 'error', text: 'Вкажіть ім’я: щонайменше 2 символи.' });
      form.querySelector<HTMLInputElement>('[name="name"]')?.focus();
      return;
    }
    if (!normalizedPhone) {
      setFieldError('phone');
      setStatus({
        kind: 'error',
        text: 'Перевірте номер: 0XX XXX XX XX або +380 XX XXX XX XX.',
      });
      form.querySelector<HTMLInputElement>('[name="phone"]')?.focus();
      return;
    }
    if (!consent) {
      setFieldError('consent');
      setStatus({
        kind: 'error',
        text: 'Потрібна згода на використання контактів для відповіді на заявку.',
      });
      return;
    }
    setSending(true);
    setStatus(null);
    setFieldError(null);
    const controller = new AbortController(),
      timeout = window.setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(EMAIL)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          signal: controller.signal,
          body: JSON.stringify({
            _subject: 'А-ФРЕЙМ — нова заявка на прорахунок',
            _template: 'table',
            _honey: '',
            'Ім’я': name,
            Телефон: normalizedPhone,
            'Тип будівництва': type || 'Потрібна консультація',
            'Площа, м²': data.get('area') || 'Не визначено',
            'Населений пункт': data.get('location') || 'Не вказано',
            Коментар: data.get('note') || '—',
            'Згода на зворотний зв’язок': 'Так',
          }),
        },
      );
      const result = await response.json();
      if (
        !response.ok ||
        !result ||
        typeof result !== 'object' ||
        !('success' in result) ||
        String(result.success) !== 'true'
      )
        throw new Error('Submission was not accepted');
      setStatus({
        kind: 'success',
        text: 'Заявку передано сервісу доставки. Якщо з вами не зв’язалися, зателефонуйте нам за номером нижче.',
      });
      form.reset();
      setConsent(false);
    } catch {
      setStatus({
        kind: 'error',
        text: 'Не вдалося передати заявку. Ваші дані залишилися у формі. Спробуйте ще раз або зателефонуйте нам.',
      });
    } finally {
      window.clearTimeout(timeout);
      setSending(false);
    }
  }
  return (
    <>
      <a className="skip-link" href="#main">
        Перейти до вмісту
      </a>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="Головна навігація">
            {navigation.map(([title, href]) => (
              <a key={href} href={href}>
                {title}
              </a>
            ))}
          </nav>
          <a className="header-phone" href={`tel:${PHONE}`}>
            {PHONE_LABEL}
          </a>
          <a className="header-cta" href="#contact">
            Обговорити проєкт <ArrowUpRight size={17} />
          </a>
          <button
            className="menu-toggle icon-button"
            aria-label="Відкрити меню"
            aria-expanded={menu}
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
        </div>
      </header>
      <main id="main" ref={revealRoot}>
        <section className="hero landing-hero" id="home">
          <div className="landing-background">
            <Photo
              name="a-frame-concept"
              alt="Концептуальна візуалізація А-фрейму серед дерев"
              priority
              sizes="100vw"
            />
          </div>
          <div className="landing-shade" />
          <div className="container landing-hero-inner">
            <div className="hero-copy">
              <p className="eyebrow">
                <MapPin size={15} /> ЖИТОМИРЩИНА · КИЇВЩИНА
              </p>
              <h1>
                Будуємо дім.
                <br />
                <em>
                  Для вашого
                  <br />
                  життя.
                </em>
              </h1>
              <p className="hero-description">
                А-фрейм, каркасні та модульні будинки під ключ — на вашій
                ділянці, за нашим або вашим проєктом.
              </p>
              <div className="hero-actions">
                <a className="button button-accent" href="#contact">
                  Розрахувати мій будинок <ArrowUpRight />
                </a>
                <a className="button hero-secondary" href="#projects">
                  Дивитися портфоліо <ArrowDown size={19} />
                </a>
              </div>
              <p className="hero-reassurance">
                Ваші побажання. Погоджений склад робіт. Продуманий результат.
              </p>
            </div>
            <a className="hero-project-card" href="#projects">
              <Photo
                name="exterior-1"
                alt="Об’єкт А-фрейм із вихідного портфоліо"
                sizes="120px"
              />
              <div>
                <span>З НАШОГО ПОРТФОЛІО</span>
                <strong>
                  Як ідея
                  <br />
                  набуває форми
                </strong>
                <span className="mini-link">
                  Роздивитися об’єкт <ArrowUpRight size={17} />
                </span>
              </div>
            </a>
            <div className="hero-bottom-bar">
              <p>ВІД ПЕРШОЇ ІДЕЇ — ДО ОЗДОБЛЕННЯ</p>
              <span>
                Концептуальна візуалізація · не фото виконаного об’єкта
              </span>
            </div>
          </div>
        </section>
        <div className="container quick-brief">
          <div>
            <p className="eyebrow">ВІД ІДЕЇ ДО ПРОРАХУНКУ</p>
            <h2>Який дім буде вашим?</h2>
          </div>
          <div className="quick-choice">
            <label htmlFor="quick-object" id="quick-object-label">
              Оберіть формат будівництва
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger
                id="quick-object"
                className="project-select"
                aria-labelledby="quick-object-label"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[
                  ...services.map((item) => item.title),
                  'Потрібна консультація',
                ].map((item) => (
                  <SelectItem value={item} key={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            className="button button-accent"
            onClick={() => selectService(type || 'Потрібна консультація')}
          >
            Почати мій проєкт <ArrowUpRight size={21} />
          </button>
        </div>
        <div className="container value-strip">
          <div>
            <span>01</span>
            <p>
              <strong>На вашій ділянці</strong>Житомирська та Київська області
            </p>
          </div>
          <div>
            <span>02</span>
            <p>
              <strong>Під ваш сценарій життя</strong>Власний проєкт або наше
              рішення
            </p>
          </div>
          <div>
            <span>03</span>
            <p>
              <strong>Від каркаса до оздоблення</strong>Комплектація за
              погодженням
            </p>
          </div>
        </div>
        <section className="section container projects" id="projects">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 — ПРОСТІР У ДЕТАЛЯХ</p>
              <h2>
                Архітектура, яку
                <br />
                хочеться <em>відчути.</em>
              </h2>
            </div>
            <p className="section-intro">
              Дерево, природне світло й виразна геометрія. Роздивіться будинок
              зовні та зсередини, щоб знайти своє рішення.
            </p>
          </div>
          <Tabs
            value={filter}
            onValueChange={(value) => {
              setFilter(String(value));
              setSelected(null);
            }}
          >
            <TabsList
              className="gallery-tabs"
              aria-label="Категорії фотографій"
            >
              <TabsTrigger value="portfolio">
                Портфоліо <span>04</span>
              </TabsTrigger>
              <TabsTrigger value="ideas">
                Приклади та ідеї <span>07</span>
              </TabsTrigger>
              <TabsTrigger value="all">
                Усі фото <span>11</span>
              </TabsTrigger>
            </TabsList>
            {['portfolio', 'ideas', 'all'].map((tab) => (
              <TabsContent key={tab} value={tab}>
                <div
                  className={`gallery-grid ${filter === 'portfolio' ? 'gallery-featured' : ''}`}
                >
                  {filtered.map((photo, index) => (
                    <button
                      key={photo.image}
                      className="gallery-item"
                      onClick={() => setSelected(index)}
                      aria-label={`Збільшити: ${photo.title}`}
                    >
                      <div className="gallery-image">
                        <Photo
                          sizes={
                            filter === 'portfolio' &&
                            (index === 0 || index === 3)
                              ? '(max-width: 680px) 100vw, (max-width: 950px) 50vw, 45vw'
                              : '(max-width: 370px) 100vw, (max-width: 950px) 50vw, 30vw'
                          }
                          name={photo.image}
                          alt={photo.title + '. ' + photo.subtitle}
                        />
                        <span className="image-badge">
                          {photo.category === 'portfolio'
                            ? 'З ПОРТФОЛІО'
                            : 'ПРИКЛАД'}
                        </span>
                        <span className="image-expand">
                          <Expand size={19} />
                        </span>
                      </div>
                      <div className="gallery-caption">
                        <div>
                          <h3>{photo.title}</h3>
                          <p>{photo.subtitle}</p>
                        </div>
                        <ArrowUpRight size={22} />
                      </div>
                    </button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
          <p className="gallery-note">
            Фото з портфоліо та архітектурні приклади розділені. Приклади
            показують можливі рішення й не є виконаними нами об’єктами.
          </p>
        </section>
        <section className="services-section" id="services">
          <div className="container section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">02 — ЩО БУДУЄМО</p>
                <h2>
                  Одна технологія.
                  <br />
                  <em>Різні сценарії життя.</em>
                </h2>
              </div>
              <p className="section-intro">
                Дім для щодня, вихідних або нового початку. Знайдемо формат,
                який відповідає вашій ідеї.
              </p>
            </div>
            <div className="services-grid">
              {services.map((service) => (
                <article
                  className="service-card"
                  key={service.number}
                  data-reveal
                >
                  <div className="service-visual">
                    <Photo
                      name={
                        service.number === '01'
                          ? 'a-frame-concept'
                          : service.number === '02'
                            ? 'frame-3'
                            : 'modular-concept'
                      }
                      alt={
                        service.number === '02'
                          ? 'Приклад дерев’яного каркаса'
                          : 'Концептуальна візуалізація формату будинку'
                      }
                      sizes="(max-width: 680px) 100vw, 33vw"
                    />
                    <span>
                      {service.number === '02'
                        ? 'ПРИКЛАД КОНСТРУКЦІЇ'
                        : 'КОНЦЕПТУАЛЬНА ВІЗУАЛІЗАЦІЯ'}
                    </span>
                  </div>
                  <div className="service-top">
                    <span>{service.number}</span>
                    <ArrowUpRight />
                  </div>
                  <p className="service-tag">{service.tag}</p>
                  <h3>{service.title}</h3>
                  <p className="service-description">{service.text}</p>
                  <div className="service-details">
                    <p>Що можна передбачити</p>
                    <ul>
                      {(
                        {
                          '01': [
                            'Панорамний фронтон',
                            'Мансарду та друге світло',
                            'Терасу за вашим проєктом',
                          ],
                          '02': [
                            'Один або два поверхи',
                            'Планування під вашу сім’ю',
                            'Утеплення для обраного режиму проживання',
                          ],
                          '03': [
                            'Компактне планування',
                            'Розміщення з урахуванням ділянки',
                            'Індивідуальну комплектацію',
                          ],
                        } as Record<string, string[]>
                      )[service.number].map((detail) => (
                        <li key={detail}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                  <button
                    className="service-action"
                    onClick={() => selectService(service.title)}
                  >
                    Обговорити цей формат <ArrowRight size={19} />
                  </button>
                </article>
              ))}
            </div>
            <div className="other-services">
              <p>Також створюємо</p>
              {['Бані та сауни', 'Ангари та склади', 'Паркани та огорожі'].map(
                (item) => (
                  <button key={item} onClick={() => selectService(item)}>
                    {item}
                    <Plus size={17} />
                  </button>
                ),
              )}
            </div>
          </div>
        </section>
        <section className="section container approach" id="included">
          <div className="approach-image" data-reveal>
            <Photo
              name="interior-1"
              alt="Дерев’яний інтер’єр будинку з вихідного портфоліо"
            />
            <span className="photo-label">ІНТЕР’ЄР · З ПОРТФОЛІО</span>
          </div>
          <div className="approach-copy" data-reveal>
            <p className="eyebrow">03 — ПРОДУМАНО ДО ДЕТАЛЕЙ</p>
            <h2>
              Будинок починається
              <br />
              <em>з ваших побажань.</em>
            </h2>
            <p>
              Площа — лише початок. Разом визначимо, що має бути у вашому
              будинку, і на цій основі обговоримо кошторис.
            </p>
            <div className="detail-list">
              {[
                [
                  'Простір і планування',
                  'Кімнати, друге світло, мансарда та тераса.',
                ],
                [
                  'Конструкція й комфорт',
                  'Фундамент, каркас, покрівля, утеплення та скління.',
                ],
                [
                  'Готовність до життя',
                  'Інженерні системи, внутрішні роботи та оздоблення.',
                ],
              ].map(([title, text], i) => (
                <div key={title}>
                  <span>0{i + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="small-note">
              Склад робіт і матеріали погоджуємо для вашого проєкту.
            </p>
            <a href="#contact" className="text-link">
              Почати з консультації <ArrowUpRight size={20} />
            </a>
          </div>
        </section>
        <section className="process-section" id="how-we-build">
          <div className="container section">
            <div className="section-heading">
              <div>
                <p className="eyebrow">04 — ВІД ЗАДУМУ ДО ДОМУ</p>
                <h2>
                  Зрозумілий шлях.
                  <br />
                  <em>На кожному етапі.</em>
                </h2>
              </div>
              <p className="section-intro">
                Спочатку домовляємося про головне: ваші потреби, склад робіт і
                послідовність будівництва.
              </p>
            </div>
            <ol className="process-grid">
              {[
                [
                  'Знайомимося',
                  'Обговорюємо ідею, місце будівництва, бажану площу та ваші пріоритети.',
                ],
                [
                  'Узгоджуємо рішення',
                  'Розглядаємо проєкт, умови ділянки, комплектацію, кошторис і графік.',
                ],
                [
                  'Будуємо',
                  'Виконуємо погоджені роботи: від підготовки й каркаса до обраного оздоблення.',
                ],
                [
                  'Перевіряємо разом',
                  'Оглядаємо результат і перевіряємо виконання погодженого переліку робіт.',
                ],
              ].map(([title, text], i) => (
                <li key={title} data-reveal>
                  <div className="process-number">
                    0{i + 1}
                    <ArrowRight size={21} />
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <div className="stage-result">
                    <span>ОРІЄНТИР ЕТАПУ</span>
                    <strong>
                      {
                        [
                          'Ваші побажання та вихідні дані',
                          'Погоджений склад робіт і кошторис',
                          'Роботи за узгодженим проєктом',
                          'Спільний огляд виконаних робіт',
                        ][i]
                      }
                    </strong>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>
        <section className="section container faq-section" id="faq">
          <div>
            <p className="eyebrow">05 — ПЕРЕД ПОЧАТКОМ</p>
            <h2>
              Важливі
              <br />
              <em>запитання.</em>
            </h2>
            <p className="faq-intro">
              Не знайшли своєї відповіді?
              <br />
              <a href={`tel:${PHONE}`} className="text-link">
                Поговорімо особисто <ArrowUpRight size={17} />
              </a>
            </p>
          </div>
          <div className="faq-list">
            {faq.map(([question, answer], index) => (
              <details key={question} name="faq">
                <summary>
                  <span className="faq-number">0{index + 1}</span>
                  <span>{question}</span>
                  <Plus size={20} />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="project-callout">
          <div className="container" data-reveal>
            <div>
              <p className="eyebrow">УЖЕ УЯВЛЯЄТЕ СВІЙ БУДИНОК?</p>
              <h2>
                Збережіть ідею.
                <br />
                <em>Зробімо наступний крок.</em>
              </h2>
              <p>
                Маєте ескіз чи лише побажання? Почнімо з розмови про вашу
                ділянку, простір та комплектацію.
              </p>
            </div>
            <a className="button button-accent" href="#contact">
              Обговорити будівництво <ArrowUpRight size={22} />
            </a>
          </div>
        </section>
        <section className="contact-section" id="contact">
          <div className="container contact-grid">
            <div className="contact-copy">
              <p className="eyebrow">06 — ЗРОБІМО ПЕРШИЙ КРОК</p>
              <h2>
                Ваша ідея.
                <br />
                <em>Почнімо розмову.</em>
              </h2>
              <p>
                Розкажіть, який будинок ви уявляєте. Обговоримо можливості та
                підготуємо основу для прорахунку.
              </p>
              <a className="contact-phone" href={`tel:${PHONE}`}>
                {PHONE_LABEL} <ArrowUpRight />
              </a>
              <div className="contact-meta">
                <span>
                  <MapPin size={18} /> Житомирська та Київська області
                </span>
                <a href={`mailto:${EMAIL}`}>
                  <Mail size={18} /> {EMAIL}
                </a>
              </div>
              <div className="messengers">
                <a
                  className="viber-action"
                  href={`viber://chat?number=${encodeURIComponent(PHONE)}`}
                  onClick={(event) => openViber(event)}
                >
                  <MessageCircle size={18} /> Написати у Viber
                </a>
                <a
                  className="viber-action"
                  href={`viber://chat?number=${encodeURIComponent(PHONE)}`}
                  onClick={(event) => openViber(event, true)}
                  aria-describedby="viber-call-help"
                >
                  <Phone size={18} /> Дзвінок у Viber
                </a>
                <a
                  href={telegramLink(PHONE)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Send size={18} /> Telegram
                </a>
                <a href={`tel:${PHONE}`}>
                  <Phone size={18} /> Через оператора
                </a>
              </div>
              <p className="messenger-help" id="viber-call-help">
                Viber відкриє чат. Для дзвінка натисніть у ньому значок трубки.
              </p>
              <div className="consultation-prep">
                <p className="eyebrow">ДО ПЕРШОЇ РОЗМОВИ</p>
                <h3>Достатньо трьох орієнтирів</h3>
                <ol>
                  <li>
                    <span>01</span>
                    <div>
                      <strong>Де будуємо</strong>
                      <p>Населений пункт і що вже є на ділянці.</p>
                    </div>
                  </li>
                  <li>
                    <span>02</span>
                    <div>
                      <strong>Який простір потрібен</strong>
                      <p>Орієнтовна площа, кімнати, життя чи відпочинок.</p>
                    </div>
                  </li>
                  <li>
                    <span>03</span>
                    <div>
                      <strong>Що вам подобається</strong>
                      <p>Фото, ескіз або просто опис вашої ідеї.</p>
                    </div>
                  </li>
                </ol>
              </div>
            </div>
            <form
              onInputCapture={() => setFieldError(null)}
              className="lead-form"
              onSubmit={submit}
              action={`https://formsubmit.co/${EMAIL}`}
              method="POST"
            >
              <div className="form-heading">
                <h3>Розкажіть про ваш проєкт</h3>
                <span>01 / ЗНАЙОМСТВО</span>
              </div>
              <input
                type="hidden"
                name="_subject"
                value="А-ФРЕЙМ — заявка на будівництво"
              />
              <input type="hidden" name="object" value={type || ''} />
              <div className="honey" aria-hidden="true">
                <label>
                  Не заповнюйте це поле
                  <input name="_honey" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <div className="form-row">
                <div className="field">
                  <label htmlFor="name">
                    Ваше ім’я <span>*</span>
                  </label>
                  <input
                    aria-invalid={fieldError === 'name' || undefined}
                    aria-describedby={
                      fieldError === 'name' ? 'form-status' : undefined
                    }
                    id="name"
                    name="name"
                    placeholder="Як до вас звертатися?"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={80}
                  />
                </div>
                <div className="field">
                  <label htmlFor="phone">
                    Телефон <span>*</span>
                  </label>
                  <input
                    aria-invalid={fieldError === 'phone' || undefined}
                    aria-describedby={
                      fieldError === 'phone' ? 'form-status' : undefined
                    }
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="+380 __ ___ __ __"
                    required
                    maxLength={22}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="field">
                  <label id="object-label" htmlFor="object">
                    Що плануєте будувати?
                  </label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger
                      id="object"
                      className="project-select"
                      aria-labelledby="object-label"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        ...services.map((s) => s.title),
                        'Бані та сауни',
                        'Ангари та склади',
                        'Паркани та огорожі',
                        'Потрібна консультація',
                      ].map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="field">
                  <label htmlFor="area">Орієнтовна площа, м²</label>
                  <input
                    id="area"
                    name="area"
                    type="number"
                    inputMode="decimal"
                    min={6}
                    max={10000}
                    step="0.1"
                    placeholder="Наприклад, 80"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="location">Де плануєте будівництво?</label>
                <input
                  id="location"
                  name="location"
                  autoComplete="address-level2"
                  placeholder="Область, населений пункт"
                  maxLength={160}
                />
              </div>
              <div className="field">
                <label htmlFor="note">Декілька слів про вашу ідею</label>
                <textarea
                  id="note"
                  name="note"
                  rows={3}
                  maxLength={2000}
                  placeholder="Для життя чи відпочинку? Можливо, вже маєте проєкт?"
                />
              </div>
              <div className="consent">
                <input
                  type="checkbox"
                  aria-invalid={fieldError === 'consent' || undefined}
                  aria-describedby={
                    fieldError === 'consent' ? 'form-status' : undefined
                  }
                  id="consent"
                  name="consent"
                  checked={consent}
                  onChange={(event) => setConsent(event.currentTarget.checked)}
                  required
                />
                <label htmlFor="consent">
                  Погоджуюся на використання моїх контактів для відповіді на
                  заявку.{' '}
                  <button type="button" onClick={() => setPrivacy(true)}>
                    Детальніше
                  </button>
                </label>
              </div>
              <button
                className="button button-accent submit-button"
                type="submit"
                disabled={sending}
              >
                {sending ? (
                  <>
                    Передаємо заявку{' '}
                    <LoaderCircle className="spinner" size={20} />
                  </>
                ) : (
                  <>
                    Обговорити проєкт <ArrowUpRight size={21} />
                  </>
                )}
              </button>
              <p className="form-note">
                Без зобов’язань. Вартість визначаємо після уточнення деталей.
              </p>
              <output
                id="form-status"
                className={status ? `form-status ${status.kind}` : ''}
                aria-live="polite"
              >
                {status?.text}
                {status && <a href={`tel:${PHONE}`}>{PHONE_LABEL}</a>}
              </output>
              <noscript>
                <p className="form-note">
                  Для вибору формату увімкніть JavaScript або вкажіть його в
                  коментарі. Також можна зателефонувати нам.
                </p>
              </noscript>
            </form>
          </div>
        </section>
      </main>
      <footer className="site-footer container">
        <div>
          <Brand />
          <p>Простір, у якому починається ваше.</p>
        </div>
        <div className="footer-links">
          <a href="#projects">Портфоліо</a>
          <a href="#faq">Запитання</a>
          <a
            href="https://www.olx.ua/d/uk/obyavlenie/budvnitstvo-a-freym-karkasnih-modulnih-budinkv-IDZEhWb.html"
            target="_blank"
            rel="noopener noreferrer"
          >
            Ми на OLX <ArrowUpRight size={14} />
          </a>
          <button onClick={() => setPrivacy(true)}>Конфіденційність</button>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} А-ФРЕЙМ</p>
          <p>Житомирщина · Київщина</p>
          <a href="#home">Нагору ↑</a>
        </div>
      </footer>
      <nav className="mobile-actions" aria-label="Швидкий зв’язок">
        <a
          href={`tel:${PHONE}`}
          aria-label="Зателефонувати через мобільного оператора"
        >
          <Phone size={19} />
          <span>Дзвінок</span>
        </a>
        <a
          className="mobile-viber"
          href={`viber://chat?number=${encodeURIComponent(PHONE)}`}
          onClick={(event) => openViber(event)}
          aria-label="Відкрити чат у Viber"
        >
          <MessageCircle size={19} />
          <span>Viber</span>
        </a>
        <a
          href={telegramLink(PHONE)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Відкрити Telegram"
        >
          <Send size={19} />
          <span>Telegram</span>
        </a>
        <a href="#contact">
          <ArrowUpRight size={19} />
          <span>Заявка</span>
        </a>
      </nav>
      {messenger && (
        <output className="contact-notice" aria-live="polite">
          <p>{messenger}</p>
          <a href={`tel:${PHONE}`}>{PHONE_LABEL}</a>
          <button
            className="icon-button"
            onClick={() => setMessenger(null)}
            aria-label="Закрити підказку"
          >
            <X size={18} />
          </button>
        </output>
      )}
      <Dialog open={menu} onOpenChange={setMenu}>
        <DialogContent className="mobile-menu-dialog" showCloseButton={false}>
          <div className="menu-heading">
            <DialogTitle>А-ФРЕЙМ</DialogTitle>
            <DialogClose className="icon-button" aria-label="Закрити меню">
              <X />
            </DialogClose>
          </div>
          <DialogDescription>
            Сучасні будинки на вашій ділянці
          </DialogDescription>
          <nav aria-label="Мобільна навігація">
            {[...navigation, ['Запитання', '#faq']].map(
              ([title, href], index) => (
                <a key={href} href={href} onClick={() => setMenu(false)}>
                  <span>0{index + 1}</span>
                  {title}
                  <ArrowUpRight />
                </a>
              ),
            )}
          </nav>
          <a href={`tel:${PHONE}`} className="button button-accent">
            <Phone size={18} /> {PHONE_LABEL}
          </a>
        </DialogContent>
      </Dialog>
      <PhotoViewer
        photos={filtered}
        index={selected}
        onIndexChange={setSelected}
        onClose={() => setSelected(null)}
      />
      <Dialog open={privacy} onOpenChange={setPrivacy}>
        <DialogContent className="privacy-dialog" showCloseButton={false}>
          <div className="menu-heading">
            <DialogTitle>Ваші контактні дані</DialogTitle>
            <DialogClose className="icon-button" aria-label="Закрити">
              <X />
            </DialogClose>
          </div>
          <DialogDescription>
            Інформація про заявку та зворотний зв’язок
          </DialogDescription>
          <p>
            Ім’я, телефон та опис проєкту використовуються для відповіді на ваш
            запит щодо будівництва. Надсилання заявки не є укладенням договору.
          </p>
          <p>
            Форма передає введені дані сервісу FormSubmit для доставки на{' '}
            {EMAIL}. Без вашого натискання кнопки надсилання дані форми не
            передаються.
          </p>
          <p>
            Щоб уточнити використання ваших даних або попросити їх видалити,
            напишіть на <a href={`mailto:${EMAIL}`}>{EMAIL}</a>.
          </p>
          <a
            href="https://formsubmit.co/privacy.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-link"
          >
            Політика сервісу FormSubmit <ArrowUpRight size={16} />
          </a>
        </DialogContent>
      </Dialog>
    </>
  );
}
