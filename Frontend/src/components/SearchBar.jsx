// Campo de búsqueda controlado reutilizable en los listados de peluches.
function SearchBar({
  value,
  onChange,
  placeholder = "Buscar peluches...",
}) {
  return (
    <label className="search-bar">
      <span className="visually-hidden">Buscar peluches por nombre</span>
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export default SearchBar;
