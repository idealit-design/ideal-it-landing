import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Hammer, Leaf, X } from 'lucide-react';

const imagePath = (filename: string) => `${import.meta.env.BASE_URL}images/${filename}.webp`;

type Piece = { name: string; type: string; image: string; size: string; stock: string; description: string };
const pieces: Piece[] = [
  { name: 'Cuenco Alba', type: 'Cerámica · gres', image: 'bowl', size: 'piece-tall', stock: 'Disponible', description: 'Gres de alta temperatura, esmalte mate hecho con ceniza de vid. Cada pieza toma su forma en el torno.' },
  { name: 'Mesa Sur', type: 'Madera · petiribí', image: 'table', size: 'piece-wide', stock: 'Por encargo', description: 'Mesa de comedor en madera maciza recuperada, ensamble tradicional y terminación con aceite natural.' },
  { name: 'Vasija Nube', type: 'Cerámica · gres', image: 'vase', size: 'piece-normal', stock: 'Última pieza', description: 'Vasija modelada a mano con engobe blanco y textura suave. Una forma distinta en cada hornada.' },
  { name: 'Banco Raíz', type: 'Madera · paraíso', image: 'stool', size: 'piece-normal', stock: 'Disponible', description: 'Banco bajo de paraíso sólido. Uniones a la vista, proporciones generosas y cero apuro.' },
  { name: 'Jarrón Ocaso', type: 'Cerámica · terracota', image: 'jar', size: 'piece-tall', stock: 'Por encargo', description: 'Barro local, curvas suaves y un esmalte que recuerda la última luz del día.' },
  { name: 'Repisa Umbral', type: 'Madera · roble', image: 'workshop', size: 'piece-wide', stock: 'Disponible', description: 'Roble recuperado con soportes ocultos y acabado a la cera. Se adapta a tu pared y a tus libros.' },
];

function Gallery({ onSelect }: { onSelect: (piece: Piece) => void }) {
  return <div className="craft-gallery">{pieces.map((piece) => <button key={piece.name} className={`gallery-piece ${piece.size}`} onClick={() => onSelect(piece)} aria-label={`Ver detalle de ${piece.name}`}><img src={imagePath(piece.image)} alt={piece.name} /><span className="piece-caption"><span>{piece.type}</span><strong>{piece.name}</strong><i className={piece.stock === 'Disponible' ? 'stock available' : 'stock'}>{piece.stock}</i></span><span className="piece-open"><ArrowUpRight size={17} /></span></button>)}</div>;
}

function App() {
  const [selected, setSelected] = useState<Piece | null>(null);
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const sendRequest = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  };
  const whatsappDemo = () => {
    setToast(true);
    window.setTimeout(() => setToast(false), 3500);
  };
  return <main className="craft-page min-h-screen text-[#2a2a22]">
    <header className="craft-nav"><a className="craft-logo" href="#inicio"><span className="logo-mark">M<span>✳</span></span><span>MANOS<br />MAESTRAS</span></a><button className="craft-menu" aria-label="Abrir navegación" onClick={() => setNavOpen(!navOpen)}>☰</button><nav className={navOpen ? 'craft-links active' : 'craft-links'}><a href="#oficio" onClick={() => setNavOpen(false)}>El oficio</a><a href="#piezas" onClick={() => setNavOpen(false)}>Piezas únicas</a><a href="#encargos" onClick={() => setNavOpen(false)}>A medida</a><a href="#encargos" className="craft-nav-cta" onClick={() => setNavOpen(false)}>Hablemos <ArrowUpRight size={14} /></a></nav></header>

    <section id="inicio" className="craft-hero"><div className="craft-hero-image"><img src={imagePath('workshop')} alt="Taller de carpintería artesanal bañado por luz natural" /></div><div className="craft-hero-overlay" /><div className="craft-hero-content"><span className="craft-eyebrow"><span /> Taller abierto · San Telmo</span><h1>Hecho a mano.<br /><em>Hecho para durar.</em></h1><p>Objetos con historia, creados despacio con madera recuperada y barro local.</p><a className="craft-button" href="#piezas">Conocé nuestro trabajo <ArrowDown size={15} /></a></div><div className="hero-vertical">OFICIO · MATERIA · TIEMPO</div><div className="hero-index">EST. 2016 <span>—</span> BUENOS AIRES</div></section>

    <section id="oficio" className="craft-intro"><div className="craft-intro-mark"><Hammer size={27} strokeWidth={1.2} /><Leaf size={19} strokeWidth={1.2} /></div><span className="craft-eyebrow">Un taller, muchas manos</span><h2>La materia propone.<br /><em>Nosotros escuchamos.</em></h2><p>Somos Inés y Julián. En nuestro taller, la madera que otros descartan encuentra otra forma y el barro local se vuelve parte de la vida diaria. No hacemos dos piezas iguales porque ninguna historia se repite.</p><div className="craft-values"><span>01 <b>Materiales nobles</b></span><span>02 <b>Manos locales</b></span><span>03 <b>Sin apuro</b></span></div></section>

    <section id="piezas" className="craft-work"><div className="work-heading"><div><span className="craft-eyebrow">Pequeñas series · Grandes historias</span><h2>Piezas con <em>presencia.</em></h2></div><p>Algunas esperan en el taller. Otras empiezan cuando nos contás qué necesitás.</p></div><Gallery onSelect={setSelected} /><div className="gallery-footnote"><span>UNA PIEZA = UNA HISTORIA</span><span>SELECCIONÁ PARA VER DETALLES ↗</span></div></section>

    <section id="encargos" className="commission"><div className="commission-copy"><span className="craft-eyebrow">Tu idea, nuestras manos</span><h2>¿Y si lo hacemos<br /><em>para vos?</em></h2><p>Un mueble que entra justo, una vajilla para todos los días, una pieza que todavía no existe. Nos gusta empezar escuchando.</p><ol className="commission-steps"><li><span>01</span><div><strong>Nos contás</strong><small>La idea, el espacio y lo que imaginás.</small></div></li><li><span>02</span><div><strong>Dibujamos juntos</strong><small>Definimos materiales, medidas y tiempos.</small></div></li><li><span>03</span><div><strong>Lo hacemos realidad</strong><small>Te compartimos el proceso y la pieza terminada.</small></div></li></ol></div><form className="commission-form" onSubmit={sendRequest}><p className="form-eyebrow">Primera charla, sin compromiso</p><label>Tu nombre<input name="name" required placeholder="Nombre y apellido" /></label><label>¿Qué te gustaría hacer?<select name="project" defaultValue=""><option value="" disabled>Elegí una idea</option><option>Un mueble a medida</option><option>Una pieza de cerámica</option><option>Quiero conversar primero</option></select></label><label>Contanos un poco más<textarea name="details" rows={3} placeholder="Medidas, materiales, una idea suelta..." /></label><button className="craft-button dark" type="submit">Enviar consulta <ArrowRight size={15} /></button>{sent && <p className="request-ok" role="status">¡Listo! Tu idea quedó anotada en esta demo. Nos pondremos en contacto.</p>}<small>Formulario demostrativo: no se envían ni guardan datos.</small></form></section>
    <footer className="craft-footer"><a className="craft-logo" href="#inicio"><span className="logo-mark">M<span>✳</span></span><span>MANOS<br />MAESTRAS</span></a><span>Un taller de puertas abiertas · San Telmo, Buenos Aires</span><a href="#inicio">Subir al taller ↑</a></footer>
    <button className="whatsapp-float" onClick={whatsappDemo} aria-label="Contactar por WhatsApp"><span>WA</span><i>Hablemos de tu idea</i></button>

    {selected && <div className="piece-lightbox" role="presentation" onClick={() => setSelected(null)}><section role="dialog" aria-modal="true" aria-labelledby="piece-title" className="piece-dialog" onClick={(event) => event.stopPropagation()}><button className="piece-close" aria-label="Cerrar detalle" onClick={() => setSelected(null)}><X /></button><img src={imagePath(selected.image)} alt={selected.name} /><div className="piece-detail"><span className="craft-eyebrow">{selected.type}</span><h2 id="piece-title">{selected.name}</h2><p>{selected.description}</p><span className={selected.stock === 'Disponible' ? 'stock available' : 'stock'}>{selected.stock}</span><button className="craft-button dark" onClick={() => { setSelected(null); document.getElementById('encargos')?.scrollIntoView({ behavior: 'smooth' }); }}>Consultar por esta pieza <ArrowRight size={14} /></button></div></section></div>}
    {toast && <div className="craft-toast" role="status">¡Hola! La conversación de WhatsApp es una simulación local. <button onClick={() => setToast(false)} aria-label="Cerrar"><X size={14} /></button></div>}
  </main>;
}
export default App;
