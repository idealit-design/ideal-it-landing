import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, BookOpen, CalendarDays, X } from 'lucide-react';

const imagePath = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}.webp`;

type Book = { title: string; year: string; genre: string; blurb: string; excerpt: string; colors: string; cover: string };
const books: Book[] = [
  { title: 'La casa de las mareas', year: '2025', genre: 'Novela · 304 páginas', blurb: 'Una casa frente al mar guarda las cartas que tres generaciones nunca se animaron a enviar.', excerpt: '“La casa respiraba al ritmo de las mareas. Cuando el agua se retiraba, dejaba al descubierto pequeñas cosas: una hebilla, una palabra, la memoria de alguien que todavía no se había ido del todo.”', colors: 'cover-sea', cover: 'ocean' },
  { title: 'Los días transparentes', year: '2022', genre: 'Relatos · 192 páginas', blurb: 'Nueve historias mínimas sobre todo aquello que elegimos no decir.', excerpt: '“A veces el silencio no es la falta de una respuesta. Es la respuesta que aprendimos a cuidar.”', colors: 'cover-pink', cover: 'mountain' },
  { title: 'Un mapa para volver', year: '2020', genre: 'Novela · 268 páginas', blurb: 'Dos hermanas reconstruyen la historia familiar siguiendo el margen de un mapa antiguo.', excerpt: '“No había caminos en el mapa, solo nombres. Y aun así, por primera vez, supimos hacia dónde ir.”', colors: 'cover-gold', cover: 'sunset' },
  { title: 'Pequeño atlas del invierno', year: '2018', genre: 'Ensayo breve · 148 páginas', blurb: 'Una invitación a mirar de nuevo los días que parecen detenerse.', excerpt: '“El invierno no es una pausa. Es una forma distinta de prestar atención.”', colors: 'cover-blue', cover: 'winter' },
];
const events = [
  ['14 JUN', 'Presentación · La casa de las mareas', 'Librería Eterna · Palermo · 18:30'],
  ['22 JUN', 'Conversación sobre escribir en voz baja', 'Casa del Lector · 17:00'],
  ['06 JUL', 'Firma y lectura compartida', 'Librería del Fondo · 16:00'],
];

function BookCard({ book, open }: { book: Book; open: (book: Book) => void }) {
  return <article className="book-card"><button className={`book-cover ${book.colors}`} onClick={() => open(book)} aria-label={`Leer sobre ${book.title}`} style={{ backgroundImage: `linear-gradient(180deg,rgba(0,0,0,.02),rgba(17,21,24,.45)),url(${imagePath(book.cover)})` }}><span className="cover-author">CLARA VALDÉS</span><strong>{book.title}</strong><span className="cover-rule" /><small>UNA NOVELA</small></button><div className="book-meta"><span>{book.genre} <i>·</i> {book.year}</span><h3>{book.title}</h3><p>{book.blurb}</p><button className="inline-link" onClick={() => open(book)}>Leer un fragmento <ArrowRight size={14} /></button></div></article>;
}

function App() {
  const [selected, setSelected] = useState<Book | null>(null);
  const [notice, setNotice] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const subscribe = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubscribed(true);
    event.currentTarget.reset();
  };
  const mockPurchase = () => {
    setNotice('Gracias por tu interés. El enlace de compra se habilitará próximamente.');
    window.setTimeout(() => setNotice(''), 4000);
  };
  return <main className="literary-shell min-h-screen bg-[#f5f0e7] text-[#24221f]">
    <header className="literary-nav"><a className="literary-logo" href="#inicio">P<span>&</span>T<small>PLUMA Y TINTA</small></a><button className="literary-toggle" onClick={() => setMobileNav(!mobileNav)} aria-label="Abrir navegación">☰</button><nav className={mobileNav ? 'literary-links show' : 'literary-links'}><a href="#libros" onClick={() => setMobileNav(false)}>Libros</a><a href="#autora" onClick={() => setMobileNav(false)}>La autora</a><a href="#agenda" onClick={() => setMobileNav(false)}>Agenda</a><a className="nav-outline" href="#carta" onClick={() => setMobileNav(false)}>Carta de lectura <ArrowUpRight size={14} /></a></nav></header>

    <section id="inicio" className="author-hero"><div className="hero-ornament" aria-hidden="true">✳</div><div className="author-intro"><span className="literary-kicker">Una historia nueva para llevar</span><h1>Las palabras<br />también saben<br /><em>volver a casa.</em></h1><p>La nueva novela de Clara Valdés. Un viaje íntimo por las cosas que heredamos y las que elegimos soltar.</p><div className="hero-actions"><button className="ink-button" onClick={mockPurchase}>Conseguir el libro <ArrowUpRight size={15} /></button><button className="quiet-button" onClick={() => setSelected(books[0])}><BookOpen size={15} /> Leer una muestra</button></div><div className="hero-review"><span>★★★★★</span> “Una escritura que permanece.” <i>— Revista Sur</i></div></div><div className="featured-book-wrap"><div className="featured-book"><div className="featured-art"><img src={imagePath('ocean')} alt="" /><div className="featured-title"><small>CLARA VALDÉS</small><strong>La casa<br />de las<br /><i>mareas</i></strong><span>UNA NOVELA</span></div></div><div className="book-pages" /></div><p className="cover-caption">Una novela sobre la memoria, el mar y todo lo que permanece.</p></div><a className="hero-scroll" href="#libros"><ArrowDown size={14} /> DESLIZÁ PARA LEER</a></section>

    <section id="autora" className="author-note"><div className="note-mark">“</div><div><span className="literary-kicker">Unas palabras de la autora</span><p>Escribo para hacerle lugar a lo que no siempre encuentra palabras. Me gustan las casas con historias, las preguntas que tardan y los libros que se quedan un rato más en la mesa.</p><a href="#agenda" className="inline-link">Un poco más sobre mí <ArrowRight size={14} /></a></div><div className="author-signature">Clara<small>Clara Valdés</small></div></section>

    <section id="libros" className="bookshelf"><div className="section-title"><span className="literary-kicker">Historias para acompañarte</span><h2>La biblioteca de Clara</h2><p>Novelas, relatos y algunas preguntas sin apuro.</p></div><div className="book-grid">{books.map((book) => <BookCard key={book.title} book={book} open={setSelected} />)}</div></section>

    <section id="agenda" className="event-section"><div className="event-heading"><div><span className="literary-kicker">Nos encontramos</span><h2>Próximas lecturas</h2></div><CalendarDays size={28} strokeWidth={1} /></div><div className="event-list">{events.map(([date, title, place]) => <article className="event-row" key={date}><span>{date}</span><div><h3>{title}</h3><p>{place}</p></div><button onClick={() => setNotice(`Encuentro seleccionado: ${title}. Te esperamos.`)} aria-label={`Ver evento ${title}`}><ArrowUpRight /></button></article>)}</div></section>

    <section id="carta" className="newsletter"><div className="newsletter-copy"><span className="literary-kicker">Una carta cada tanto</span><h2>Palabras que<br /><em>llegan despacio.</em></h2><p>Novedades, lecturas y encuentros. Sin ruido, directamente a tu correo.</p></div><form onSubmit={subscribe}><label htmlFor="reader-email">Tu correo electrónico</label><div className="newsletter-input"><input id="reader-email" type="email" placeholder="nombre@correo.com" required /><button type="submit" aria-label="Suscribirse"><ArrowRight /></button></div><small>{subscribed ? 'Ya estás en la lista. Gracias por leer.' : 'Una nota breve, una vez al mes. Podés salir cuando quieras.'}</small></form></section>
    <footer className="literary-footer"><a className="literary-logo" href="#inicio">P<span>&</span>T<small>PLUMA Y TINTA</small></a><span>© 2025 Clara Valdés · Todas las historias tienen un comienzo.</span><a href="#inicio">Volver a la primera página ↑</a></footer>

    {selected && <div className="book-modal-backdrop" role="presentation" onClick={() => setSelected(null)}><section className="book-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="Cerrar"><X /></button><span className="literary-kicker">Un fragmento</span><h2 id="modal-title">{selected.title}</h2><p className="excerpt">{selected.excerpt}</p><p className="excerpt-credit">— Clara Valdés, <em>{selected.title}</em></p><button className="ink-button" onClick={mockPurchase}>Encontrar el libro <ArrowUpRight size={15} /></button></section></div>}
    {notice && <div className="literary-toast" role="status">{notice}<button onClick={() => setNotice('')} aria-label="Cerrar aviso"><X size={15} /></button></div>}
  </main>;
}
export default App;
