import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, Clock3, MapPin, Menu as MenuIcon,
  Search, Star, X,
} from 'lucide-react';

const imagePath = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}.webp`;

type Dish = { name: string; detail: string; price: string; category: string; mark?: string };

const dishes: Dish[] = [
  { name: 'Buñuelos de acelga', detail: 'Alioli de limón · hojas tiernas', price: '$ 8.400', category: 'Entradas', mark: 'Favorito' },
  { name: 'Provoleta de campo', detail: 'Miel de monte · tomates confitados', price: '$ 9.800', category: 'Entradas' },
  { name: 'Pesca del día', detail: 'Puré de coliflor · manteca de hierbas', price: '$ 24.500', category: 'Principales', mark: 'De estación' },
  { name: 'Ojo de bife', detail: 'Papas rotas · chimichurri de la casa', price: '$ 27.900', category: 'Principales' },
  { name: 'Risotto de hongos', detail: 'Arroz carnaroli · parmesano · tomillo', price: '$ 21.000', category: 'Principales', mark: 'Vegetariano' },
  { name: 'Tarta tibia de peras', detail: 'Crema inglesa · almendras tostadas', price: '$ 9.200', category: 'Postres' },
  { name: 'Flan de la abuela', detail: 'Dulce de leche · crema batida', price: '$ 7.800', category: 'Postres' },
  { name: 'Limonada de estación', detail: 'Jengibre · menta fresca', price: '$ 4.500', category: 'Bebidas' },
  { name: 'Vino de la casa', detail: 'Malbec joven · Valle de Uco', price: '$ 8.000', category: 'Bebidas' },
];
const categories = ['Todo', 'Entradas', 'Principales', 'Postres', 'Bebidas'];
const reviews = [
  ['“Una mesa para volver siempre. Todo tiene sabor a hecho con cariño.”', 'Lucía M.'],
  ['“El menú cambia, pero las ganas de quedarse un rato más no.”', 'Tomás R.'],
  ['“Producto de estación, vino rico y una atención que se siente cercana.”', 'Sofía G.'],
];

function useReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);
}

function MenuSection() {
  const [category, setCategory] = useState('Todo');
  const [query, setQuery] = useState('');
  const visible = dishes.filter((dish) => (category === 'Todo' || dish.category === category)
    && `${dish.name} ${dish.detail}`.toLowerCase().includes(query.toLowerCase()));
  return <section id="menu" className="menu-section section-pad">
    <div className="section-heading reveal"><span className="eyebrow">De la huerta a tu mesa</span><h2>Una carta que sigue<br /><em>el ritmo de la tierra.</em></h2></div>
    <div className="menu-controls reveal">
      <div className="category-tabs" role="tablist" aria-label="Categorías del menú">
        {categories.map((item) => <button key={item} role="tab" aria-selected={category === item} className={category === item ? 'tab active' : 'tab'} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <label className="search-field"><Search size={16} /><span className="sr-only">Buscar en el menú</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar un plato..." /></label>
    </div>
    <div className="dish-grid">{visible.length ? visible.map((dish) => <article className="dish reveal" key={dish.name}>
      <div><h3>{dish.name}{dish.mark && <span className="dish-mark">{dish.mark}</span>}</h3><p>{dish.detail}</p></div><strong>{dish.price}</strong>
    </article>) : <p className="empty-menu">No encontramos platos con esa búsqueda.</p>}</div>
    <p className="menu-note">Nuestra carta cambia con la temporada. Consultá disponibilidad al reservar.</p>
  </section>;
}

function App() {
  useReveal();
  const [review, setReview] = useState(0);
  const [booking, setBooking] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const submitBooking = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setBooking(`¡Gracias, ${String(form.get('name'))}! Guardamos tu solicitud para ${String(form.get('date'))}. Te contactaremos para confirmar.`);
    event.currentTarget.reset();
  };
  return <main className="min-h-screen bg-[#f7f5ef] text-[#223128]">
    <header className="topbar">
      <a href="#inicio" className="wordmark"><span className="brand-icon">R.</span><span>EL RINCÓN<small>COCINA DE ESTACIÓN</small></span></a>
      <button className="mobile-toggle" aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'} onClick={() => setNavOpen(!navOpen)}>{navOpen ? <X /> : <MenuIcon />}</button>
      <nav className={navOpen ? 'nav-links open' : 'nav-links'}><a href="#historia" onClick={() => setNavOpen(false)}>Nuestra historia</a><a href="#menu" onClick={() => setNavOpen(false)}>La carta</a><a href="#contacto" className="nav-cta" onClick={() => setNavOpen(false)}>Reservá tu mesa <ArrowUpRight size={15} /></a></nav>
    </header>

    <section id="inicio" className="hero">
      <img className="hero-image" src={imagePath('hero')} alt="Mesa cálida preparada para una cena de cocina de autor" />
      <div className="hero-shade" />
      <div className="hero-copy"><span className="eyebrow light">Buenos Aires · Desde 2014</span><h1>La mesa es<br />un buen lugar<br /><em>para quedarse.</em></h1><p>Cocina honesta, ingredientes de estación y ese tiempo que siempre vale la pena compartir.</p><a className="button button-light" href="#menu">Descubrí la carta <ArrowDown size={16} /></a></div>
      <div className="hero-stamp"><span>COCINA<br />CON TIEMPO</span><span className="stamp-star">✳</span></div>
      <span className="photo-credit">Producto local · cocina de estación</span>
    </section>

    <section id="historia" className="story section-pad">
      <div className="story-photo reveal"><img src={imagePath('story')} alt="Cocinera preparando ingredientes frescos en la cocina" /><span className="photo-caption">Cocina abierta, puertas abiertas.</span></div>
      <div className="story-copy reveal"><span className="eyebrow">Nuestra casa, tu casa</span><h2>Lo simple,<br /><em>bien hecho.</em></h2><p>Empezamos con una mesa larga, una cocina pequeña y una idea: cocinar lo que tenemos cerca. Hoy seguimos buscando productores que cuiden la tierra y recetas que inviten a compartir.</p><a className="text-link" href="#contacto">Conocé nuestra casa <ArrowRight size={16} /></a><div className="story-sign">Con cariño, <strong>Marina & el equipo</strong></div></div>
    </section>

    <MenuSection />

    <section className="testimonial-section">
      <span className="eyebrow light">Lo que se comparte</span><div className="stars" aria-label="5 de 5 estrellas"><Star /><Star /><Star /><Star /><Star /></div>
      <blockquote>{reviews[review][0]}</blockquote><p className="review-author">{reviews[review][1]} <span>·</span> Visitante</p>
      <div className="review-controls"><button aria-label="Reseña anterior" onClick={() => setReview((review + reviews.length - 1) % reviews.length)}>←</button><span>0{review + 1} <i>/ 0{reviews.length}</i></span><button aria-label="Reseña siguiente" onClick={() => setReview((review + 1) % reviews.length)}>→</button></div>
    </section>

    <section id="contacto" className="contact-section section-pad">
      <div className="contact-intro reveal"><span className="eyebrow">Te guardamos un lugar</span><h2>Nos encontramos<br /><em>alrededor de la mesa.</em></h2><p>Completá la solicitud y te escribimos para confirmar. También recibimos sin reserva, sujeto a disponibilidad.</p><div className="contact-details"><span><MapPin size={17} /> Thames 1876, Palermo · Buenos Aires</span><span><Clock3 size={17} /> Mar–Dom · 12:30–15:00 y 20:00–00:00</span></div>
        <div className="map-card" aria-label="Mapa ilustrativo de ubicación"><span className="map-road road-one" /><span className="map-road road-two" /><span className="map-road road-three" /><span className="map-pin"><MapPin size={18} fill="currentColor" /></span><span className="map-label">EL RINCÓN · PALERMO</span><a href="https://maps.google.com/?q=Thames+1876+Buenos+Aires" target="_blank" rel="noreferrer">Ver en mapa <ArrowUpRight size={13} /></a></div>
      </div>
      <form className="booking-form reveal" onSubmit={submitBooking}><span className="eyebrow">Reservas</span><h3>Tu próxima sobremesa.</h3>
        <label>Tu nombre<input name="name" required placeholder="¿Cómo te llamás?" /></label>
        <div className="form-row"><label>Fecha<input name="date" type="date" required /></label><label>Personas<select name="people" defaultValue="2"><option>1</option><option>2</option><option>3</option><option>4</option><option>5 o más</option></select></label></div>
        <label>Correo electrónico<input name="email" type="email" required placeholder="hola@correo.com" /></label>
        <button className="button button-dark" type="submit">Solicitar reserva <ArrowRight size={16} /></button>
        {booking && <p className="form-feedback" role="status">{booking}</p>}<small>Esta demo guarda la solicitud solo en esta pantalla; no se envían datos.</small>
      </form>
    </section>
    <footer><a className="wordmark" href="#inicio"><span className="brand-icon">R.</span><span>EL RINCÓN<small>COCINA DE ESTACIÓN</small></span></a><span>Hecho para compartir · Palermo, Buenos Aires</span><a href="#inicio">Volver arriba ↑</a></footer>
  </main>;
}

export default App;
