import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDown,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  Clock3,
  FileText,
  HeartPulse,
  Landmark,
  MapPin,
  Menu,
  MessageSquareText,
  Search,
  X,
} from 'lucide-react'
import { budgetViews, news, procedures, services } from './data.js'

const categories = ['Todos', 'Trámites', 'Salud', 'Ciudad']

function Brand({ inverse = false }) {
  return (
    <a className={`brand ${inverse ? 'brand-inverse' : ''}`} href="#inicio" aria-label="Municipalidad de Villa del Lago, inicio">
      <span className="brand-mark"><Landmark size={21} strokeWidth={1.8} /></span>
      <span className="brand-name">
        <strong>Villa del Lago</strong>
        <small>Municipalidad</small>
      </span>
    </a>
  )
}

function SectionHeading({ eyebrow, title, description, light = false }) {
  return (
    <div className={`section-heading ${light ? 'section-heading-light' : ''}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
    </div>
  )
}

function Modal({ item, onClose }) {
  useEffect(() => {
    if (!item) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [item, onClose])

  if (!item) return null

  return (
    <div className="modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose()
    }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <button className="modal-close icon-button" type="button" onClick={onClose} aria-label="Cerrar">
          <X size={20} />
        </button>
        <span className="modal-kicker">{item.kicker ?? 'INFORMACIÓN MUNICIPAL'}</span>
        <h2 id="modal-title">{item.title}</h2>
        <p>{item.description}</p>
        {item.meta && <div className="modal-meta">{item.meta}</div>}
        <div className="demo-notice"><CircleHelp size={17} /> Esta es una demostración. No se envían datos ni se inician trámites reales.</div>
        <button className="button button-primary modal-action" type="button" onClick={onClose}>Entendido <Check size={16} /></button>
      </section>
    </div>
  )
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <>
      <div className="announcement">
        <span><span className="announcement-dot" /> Portal ciudadano · Villa del Lago</span>
        <a href="#presupuesto">Conocé cómo se administra la ciudad <ArrowRight size={14} /></a>
      </div>
      <header className="site-header">
        <div className="header-inner">
          <Brand />
          <button
            className="menu-toggle icon-button"
            type="button"
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav className={`main-nav ${menuOpen ? 'nav-open' : ''}`} aria-label="Navegación principal">
            <a href="#servicios" onClick={closeMenu}>Servicios</a>
            <a href="#presupuesto" onClick={closeMenu}>Presupuesto abierto</a>
            <a href="#noticias" onClick={closeMenu}>Noticias</a>
            <a href="#tramites" className="nav-cta" onClick={closeMenu}>Trámites <ArrowUpRight size={15} /></a>
          </nav>
        </div>
      </header>
    </>
  )
}

function Hero() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-inner page-container">
        <div className="hero-copy">
          <div className="hero-label"><span className="hero-label-dot" /> UNA CIUDAD MÁS CERCA</div>
          <h1>Lo que necesitás,<br />a un <span>clic de distancia.</span></h1>
          <p>Tu ciudad, tus servicios, tu voz. Encontrá todo lo que necesitás para vivir y construir juntos Villa del Lago.</p>
          <div className="hero-actions">
            <a className="button button-primary" href="#tramites">Acceder a trámites <ArrowRight size={17} /></a>
            <a className="button button-text" href="#servicios">Explorar servicios <ArrowDown size={16} /></a>
          </div>
          <div className="hero-note"><span className="note-avatars"><i>ML</i><i>JC</i><i>+</i></span><span>Un portal pensado para <strong>toda la comunidad</strong></span></div>
        </div>
        <div className="hero-visual" role="img" aria-label="Ilustración del edificio municipal de Villa del Lago">
          <div className="visual-sun" />
          <div className="visual-hill hill-back" />
          <div className="visual-hill hill-front" />
          <div className="city-hall">
            <div className="hall-roof" />
            <div className="hall-pediment"><Landmark size={31} strokeWidth={1.5} /></div>
            <div className="hall-columns"><i /><i /><i /><i /></div>
            <div className="hall-base" />
          </div>
          <div className="visual-tree tree-left"><i /><b /></div>
          <div className="visual-tree tree-right"><i /><b /></div>
          <div className="float-card float-card-top"><span className="float-icon"><MapPin size={16} /></span><span><b>Villa del Lago</b><small>Provincia de Córdoba</small></span><span className="live-dot" /></div>
          <div className="float-card float-card-bottom"><span className="float-icon float-icon-mint"><BarChart3 size={17} /></span><span><b>Ciudad abierta</b><small>Información para todos</small></span><ArrowUpRight size={16} className="float-arrow" /></div>
          <span className="visual-caption">31° 25' S · 64° 11' O</span>
        </div>
      </div>
      <div className="hero-bottom page-container">
        <span>UN MUNICIPIO QUE TE ESCUCHA</span>
        <a href="#servicios">Descubrí todo lo que podés hacer <ChevronDown size={15} /></a>
      </div>
    </section>
  )
}

function QuickAccess({ onSelect }) {
  const icons = {
    receipt: FileText,
    calendar: CalendarDays,
    message: MessageSquareText,
  }

  return (
    <section className="quick-access page-container" id="tramites" aria-label="Accesos directos">
      <div className="quick-intro">
        <span className="eyebrow">RESOLVELO EN LÍNEA</span>
        <h2>¿Qué necesitás<br />hacer hoy?</h2>
        <p>Accesos directos a lo que más buscás.</p>
      </div>
      <div className="quick-list">
        {procedures.map((procedure, index) => {
          const Icon = icons[procedure.icon]
          return (
            <button
              className="quick-item"
              type="button"
              key={procedure.title}
              onClick={() => onSelect({
                kicker: 'ACCESO DIRECTO',
                title: procedure.title,
                description: `${procedure.detail}. En el portal real, desde aquí podrías comenzar la gestión.`,
              })}
            >
              <span className={`quick-icon quick-icon-${index}`}><Icon size={20} /></span>
              <span className="quick-text"><strong>{procedure.title}</strong><small>{procedure.detail}</small></span>
              <ArrowUpRight size={18} className="quick-arrow" />
            </button>
          )
        })}
      </div>
    </section>
  )
}

function ServiceDirectory({ onSelect }) {
  const [category, setCategory] = useState('Todos')
  const [query, setQuery] = useState('')

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('es')
    return services.filter((service) => {
      const matchesCategory = category === 'Todos' || service.category === category
      const matchesQuery = !normalizedQuery || `${service.name} ${service.description} ${service.category}`.toLocaleLowerCase('es').includes(normalizedQuery)
      return matchesCategory && matchesQuery
    })
  }, [category, query])

  return (
    <section className="services-section section-pad" id="servicios">
      <div className="page-container">
        <div className="services-top">
          <SectionHeading
            eyebrow="ESTAMOS PARA AYUDARTE"
            title={<>Todo lo que necesitás,<br />en un mismo lugar.</>}
            description="Encontrá información útil y servicios municipales pensados para vos."
          />
          <label className="search-box">
            <Search size={18} />
            <input
              type="search"
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar servicios"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
        </div>
        <div className="directory-controls">
          <div className="category-tabs" role="group" aria-label="Filtrar servicios por categoría">
            {categories.map((item) => (
              <button
                type="button"
                key={item}
                className={`category-tab ${category === item ? 'category-tab-active' : ''}`}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
                {item === 'Todos' && <span className="tab-count">{services.length}</span>}
              </button>
            ))}
          </div>
          <span className="results-count">{filteredServices.length} servicios disponibles</span>
        </div>
        {filteredServices.length ? (
          <div className="service-grid">
            {filteredServices.map((service) => {
              const Icon = service.icon
              return (
                <article className="service-card" key={service.id}>
                  <div className="service-card-top">
                    <span className={`service-icon icon-${service.tone}`}><Icon size={21} strokeWidth={1.8} /></span>
                    <span className="service-category">{service.category}</span>
                  </div>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <div className="service-meta"><MapPin size={14} />{service.location}</div>
                  <div className="service-meta"><Clock3 size={14} />{service.hours}</div>
                  <button
                    className="service-link"
                    type="button"
                    onClick={() => onSelect({
                      kicker: service.category.toUpperCase(),
                      title: service.name,
                      description: service.description,
                      meta: `${service.location} · ${service.hours}`,
                    })}
                  >
                    Ver información <ArrowRight size={15} />
                  </button>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="empty-results">
            <Search size={22} />
            <strong>No encontramos servicios</strong>
            <span>Probá con otra búsqueda o categoría.</span>
            <button type="button" onClick={() => { setQuery(''); setCategory('Todos') }}>Ver todos los servicios</button>
          </div>
        )}
        <a href="#tramites" className="all-services-link">Ver todos los trámites y servicios <ArrowRight size={16} /></a>
      </div>
    </section>
  )
}

function BudgetSection() {
  const [activeView, setActiveView] = useState('Ingresos')
  const rows = budgetViews[activeView]

  return (
    <section className="budget-section section-pad" id="presupuesto">
      <div className="page-container budget-layout">
        <div className="budget-copy">
          <SectionHeading
            eyebrow="GOBIERNO ABIERTO"
            title={<>Las cuentas claras.<br />La ciudad, de todos.</>}
            description="Conocé cómo se usan los recursos públicos y qué estamos haciendo con ellos."
            light
          />
          <div className="budget-total">
            <span>Presupuesto municipal 2026</span>
            <strong>$ 8.420 <small>millones</small></strong>
            <div className="budget-execution"><span><i /></span><b>62% ejecutado</b></div>
          </div>
          <a className="button button-light" href="#presupuesto-detalle">Explorar presupuesto <ArrowUpRight size={16} /></a>
          <span className="demo-caption">Datos ilustrativos · Actualización de ejemplo: octubre 2026</span>
        </div>
        <div className="budget-panel" id="presupuesto-detalle">
          <div className="budget-panel-head">
            <div><span className="eyebrow">PRESUPUESTO ABIERTO</span><h3>¿A dónde va cada peso?</h3></div>
            <span className="budget-year">2026 <ChevronDown size={14} /></span>
          </div>
          <div className="budget-tabs" role="tablist" aria-label="Ver categorías del presupuesto">
            {Object.keys(budgetViews).map((view) => (
              <button
                key={view}
                type="button"
                role="tab"
                aria-selected={activeView === view}
                aria-controls="budget-rows"
                className={activeView === view ? 'budget-tab budget-tab-active' : 'budget-tab'}
                onClick={() => setActiveView(view)}
              >
                {view}
              </button>
            ))}
          </div>
          <div className="budget-rows" id="budget-rows" role="tabpanel">
            {rows.map((row) => (
              <div className="budget-row" key={row.label}>
                <div className="budget-row-heading"><span>{row.label}</span><strong>{row.amount}</strong></div>
                <div className="budget-track" role="progressbar" aria-label={`${row.label}: ${row.percentage}%`} aria-valuenow={row.percentage} aria-valuemin={0} aria-valuemax={100}>
                  <span className={`budget-bar bar-${row.color}`} style={{ width: `${row.percentage}%` }} />
                </div>
                <span className="budget-percent">{row.percentage}%</span>
              </div>
            ))}
          </div>
          <div className="budget-footer"><span><i className="status-dot" /> Información pública y accesible</span><ArrowDownRight size={17} /></div>
        </div>
      </div>
    </section>
  )
}

function NewsSection({ onSelect }) {
  return (
    <section className="news-section section-pad" id="noticias">
      <div className="page-container">
        <div className="news-heading">
          <SectionHeading
            eyebrow="LO QUE PASA EN LA CIUDAD"
            title={<>Buenas noticias,<br />buenas cosas.</>}
            description="Novedades, obras y actividades para estar al día con tu ciudad."
          />
          <a href="#noticias-lista" className="button button-outline">Todas las noticias <ArrowRight size={16} /></a>
        </div>
        <div className="news-grid" id="noticias-lista">
          {news.map((item, index) => (
            <article className={`news-card ${index === 0 ? 'news-featured' : ''}`} key={item.id}>
              <div className={`news-art ${item.color}`}>
                <span className="news-date">{item.date}</span>
                {item.id === 'plaza' && <div className="news-illustration illustration-park"><i /><b /><span /></div>}
                {item.id === 'vacunacion' && <div className="news-illustration illustration-health"><HeartPulse size={49} strokeWidth={1.4} /></div>}
                {item.id === 'cultura' && <div className="news-illustration illustration-culture"><span>V</span><i /><b /></div>}
                <span className="news-art-label">{item.category}</span>
              </div>
              <div className="news-content">
                <div className="news-meta"><span>{item.category}</span><i />{item.readTime}</div>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                <button
                  type="button"
                  className="news-link"
                  onClick={() => onSelect({ kicker: item.category, title: item.title, description: item.summary, meta: `${item.date} · ${item.readTime}` })}
                >
                  Leer noticia <ArrowRight size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function CommunityCallout() {
  return (
    <section className="community-callout page-container">
      <div className="community-card">
        <div className="community-copy">
          <span className="eyebrow">TU VOZ HACE LA DIFERENCIA</span>
          <h2>La ciudad que queremos<br />se construye <span>entre todos.</span></h2>
          <p>Estamos para escucharte. Participá, proponé y ayudanos a hacer de Villa del Lago un mejor lugar.</p>
          <a className="button button-primary" href="#tramites">Conocé cómo participar <ArrowRight size={16} /></a>
        </div>
        <div className="community-art" aria-hidden="true">
          <div className="community-sun" />
          <div className="community-orbit orbit-one" />
          <div className="community-orbit orbit-two" />
          <div className="community-center"><Landmark size={38} strokeWidth={1.5} /></div>
          <span className="community-point point-one"><i /></span>
          <span className="community-point point-two"><i /></span>
          <span className="community-point point-three"><i /></span>
          <span className="community-point point-four"><i /></span>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="site-footer">
      <div className="page-container">
        <div className="footer-main">
          <div className="footer-about">
            <Brand inverse />
            <p>Una ciudad para vivirla.<br />Un municipio para estar cerca.</p>
          </div>
          <div className="footer-column"><strong>Enlaces útiles</strong><a href="#tramites">Trámites</a><a href="#servicios">Servicios</a><a href="#presupuesto">Presupuesto abierto</a></div>
          <div className="footer-column"><strong>Contacto</strong><span>Centro Cívico Municipal</span><span>Av. del Lago 125 · Villa del Lago</span><span>Lun a vie · 8:00 a 14:00</span></div>
          <div className="footer-contact"><span>¿Necesitás ayuda?</span><a href="tel:08004445842">0800 444 5842 <ArrowUpRight size={14} /></a><small>Línea gratuita de atención ciudadana</small></div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Municipalidad de Villa del Lago</span>
          <span className="footer-demo"><i /> Portal de demostración</span>
          <a href="#inicio">Volver arriba <ArrowUpRight size={14} /></a>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  const [modalItem, setModalItem] = useState(null)

  return (
    <div className="min-h-screen bg-[#f7f8f6] text-[#172a3a]">
      <Header />
      <main>
        <Hero />
        <QuickAccess onSelect={setModalItem} />
        <ServiceDirectory onSelect={setModalItem} />
        <BudgetSection />
        <NewsSection onSelect={setModalItem} />
        <CommunityCallout />
      </main>
      <Footer />
      <Modal item={modalItem} onClose={() => setModalItem(null)} />
    </div>
  )
}
