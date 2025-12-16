(() => {
  const body = document.getElementById('print-body');
  const printNow = document.getElementById('print-now');

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const formatValue = (value) => {
    if (!value) return '—';
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return `$${numeric.toLocaleString('es-MX')}`;
    return value;
  };

  const formatDate = (value) => {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const renderRows = (data) => {
    if (!data.length) {
      body.innerHTML = '<tr><td colspan="6" class="muted">Aún no hay premios registrados.</td></tr>';
      return;
    }
    body.innerHTML = data
      .map(
        (item, idx) => `<tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(item.id || '')}</td>
          <td>${escapeHtml(item.nombre || '')}</td>
          <td>${escapeHtml(item.descripcion || '—')}</td>
          <td>${escapeHtml(formatValue(item.valor))}</td>
          <td>${escapeHtml(formatDate(item.fechaHora))}</td>
        </tr>`
      )
      .join('');
  };

  const loadData = async () => {
    try {
      const res = await fetch('/api/ganados');
      if (!res.ok) throw new Error();
      const data = await res.json();
      renderRows(data);
    } catch (err) {
      body.innerHTML =
        '<tr><td colspan="6" class="muted">No se pudo cargar el historial.</td></tr>';
    }
  };

  printNow.addEventListener('click', () => window.print());
  loadData();
})();
