export default function NotFound() {
  return (
    <main className="container section">
      <p className="eyebrow">А-ФРЕЙМ / 404</p>
      <h1>
        Тут поки
        <br />
        немає будинку.
      </h1>
      <p>Цієї сторінки не існує. Повернімося до проєктів.</p>
      <a
        className="button button-accent"
        href={`${process.env.BASE_PATH || ''}/`}
      >
        На головну ↗
      </a>
    </main>
  );
}
