export default function Header() {
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="Service Synthetic Factory">
        <span className="brand-mark">SF</span>
        <span>
          <strong>Ideal-IT / Synthetic Factory</strong>
          <small>Command Center · laboratorio local</small>
        </span>
      </a>
      <span className="local-pill"><span /> AISLADO · 0.1.0</span>
    </header>
  );
}
