interface Props {
  text?: string;
}

export default function Spinner({ text = 'Cargando...' }: Props) {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <span className="spinner-text">{text}</span>
    </div>
  );
}
