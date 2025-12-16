(() => {
  const slotStrip = document.getElementById('slot-strip');
  const spinBtn = document.getElementById('spin-btn');
  const toggleHistoryBtn = document.getElementById('toggle-history-btn');
  const themeToggleInput = document.getElementById('theme-toggle');
  const printBtn = document.getElementById('print-btn');
  const selectedName = document.getElementById('selected-name');
  const selectedDetails = document.getElementById('selected-details');
  const statusMessage = document.getElementById('status-message');
  const availabilityMsg = document.getElementById('availability-msg');
  const historyPanel = document.getElementById('history-panel');
  const historyBody = document.getElementById('history-body');
  const historyCount = document.getElementById('history-count');
  const overlay = document.getElementById('prize-overlay');
  const overlayName = document.getElementById('overlay-name');
  const overlayDetails = document.getElementById('overlay-details');
  const overlayDesc = document.getElementById('overlay-desc');
  const overlayClose = document.getElementById('overlay-close');
  const confettiCanvas = document.createElement('canvas');

  const visibleRows = 5;
  const centerIndex = 2;
  const itemHeight = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--slot-item-height')
  );

  let availablePrizes = [];
  let history = [];
  let isSpinning = false;
  let isHolidayTheme = false;
  let confettiCtx = null;
  let confettiPieces = [];
  let confettiFrameId = null;
  let confettiMode = 'confetti';
  const THEME_KEY = 'ruleta-theme';

  const escapeHtml = (value = '') =>
    String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');

  const prizeLabel = (prize) => prize?.nombre || prize?.id || 'Premio';

  const renderStrip = (items) => {
    const html = items
      .map(
        (item, idx) =>
          `<li class="slot-item${idx === centerIndex ? ' highlight' : ''}">${escapeHtml(
            prizeLabel(item)
          )}</li>`
      )
      .join('');
    slotStrip.innerHTML = html;
    slotStrip.style.transition = 'none';
    slotStrip.style.transform = 'translateY(0px)';
  };

  const renderPreview = () => {
    const base = availablePrizes.length ? availablePrizes : [{ nombre: 'Sin premios' }];
    const preview = [];
    for (let i = 0; i < visibleRows; i += 1) {
      preview.push(base[i % base.length]);
    }
    renderStrip(preview);
  };

  const slotSpin = (items, targetItem, totalDurationMs = 6500) =>
    new Promise((resolve) => {
      const base = items.length ? items : [targetItem];
      const targetIndex = base.findIndex((p) => p.id === targetItem.id);
      const fallbackIndex = targetIndex === -1 ? 0 : targetIndex;
      const getWrap = (offset) =>
        base[(fallbackIndex + offset + base.length) % base.length] || targetItem;

      const finalWindow = [
        getWrap(-2),
        getWrap(-1),
        targetItem,
        getWrap(1),
        getWrap(2),
      ];

      const loops = Math.max(6, Math.ceil(24 / base.length));
      const sequence = [];
      for (let i = 0; i < loops; i += 1) {
        sequence.push(...base);
      }
      sequence.push(...finalWindow);

      const html = sequence
        .map((item) => `<li class="slot-item">${escapeHtml(prizeLabel(item))}</li>`)
        .join('');
      slotStrip.innerHTML = html;

      const travel = Math.max(0, sequence.length - visibleRows) * itemHeight;
      slotStrip.style.transition = 'none';
      slotStrip.style.transform = 'translateY(0px)';
      slotStrip.style.willChange = 'transform';
      // Force reflow to ensure the transition applies consistently across clicks.
      void slotStrip.getBoundingClientRect();
      requestAnimationFrame(() => {
        slotStrip.style.transition = `transform ${totalDurationMs}ms cubic-bezier(0.08, 0.8, 0.25, 1)`;
        slotStrip.style.transform = `translateY(-${travel}px)`;
      });

      setTimeout(() => {
        slotStrip.style.transition = 'none';
        slotStrip.style.transform = `translateY(-${travel}px)`;
        slotStrip.style.willChange = 'auto';
        resolve();
      }, totalDurationMs + 80);
    });

  const formatValue = (value) => {
    if (!value) return '--';
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return `$${numeric.toLocaleString('es-MX')}`;
    return value;
  };

  const formatDate = (value) => {
    if (!value) return '--';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const showStatus = (text = '', isError = false) => {
    statusMessage.textContent = text;
    statusMessage.style.color = isError ? '#f97316' : '#22d3ee';
  };

  const resizeConfetti = () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  };

  const setupConfetti = (mode = 'confetti') => {
    confettiMode = mode;
    confettiCanvas.style.position = 'fixed';
    confettiCanvas.style.inset = '0';
    confettiCanvas.style.pointerEvents = 'none';
    confettiCanvas.style.zIndex = '9';
    document.body.appendChild(confettiCanvas);
    confettiCtx = confettiCanvas.getContext('2d');
    resizeConfetti();
    const count = mode === 'snow' ? 160 : 180;
    confettiPieces = Array.from({ length: count }).map(() => {
      if (mode === 'snow') {
        return {
          x: Math.random() * confettiCanvas.width,
          y: Math.random() * confettiCanvas.height - confettiCanvas.height,
          r: Math.random() * 3 + 2,
          d: Math.random() * 0.5 + 0.2,
          color: 'rgba(255, 255, 255, 0.9)',
          sway: Math.random() * Math.PI * 2,
          swaySpeed: Math.random() * 0.02 + 0.01,
          drift: Math.random() * 1.2 + 0.2,
        };
      }
      return {
        x: Math.random() * confettiCanvas.width,
        y: Math.random() * confettiCanvas.height - confettiCanvas.height,
        r: Math.random() * 6 + 3,
        d: Math.random() * 0.7 + 0.3,
        color: `hsl(${Math.random() * 50 + 190}deg 80% 60%)`,
        tilt: Math.random() * 8 - 4,
        tiltAngle: Math.random() * Math.PI,
      };
    });
  };

  const drawConfetti = () => {
    if (!confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiPieces.forEach((p) => {
      confettiCtx.beginPath();
      confettiCtx.fillStyle = p.color;
      if (confettiMode === 'snow') {
        confettiCtx.ellipse(p.x, p.y, p.r, p.r, 0, 0, Math.PI * 2);
        confettiCtx.fill();
        p.y += p.d * 2.4 + Math.random() * 0.6;
        p.x += Math.sin(p.sway) * p.drift;
        p.sway += p.swaySpeed;
        if (p.y > confettiCanvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * confettiCanvas.width;
        }
      } else {
        confettiCtx.ellipse(p.x, p.y, p.r, p.r / 2, p.tilt, 0, Math.PI * 2);
        confettiCtx.fill();
        p.y += p.d * 4 + Math.random() * 2;
        p.x += Math.sin(p.tiltAngle) * 1.5;
        p.tiltAngle += 0.08;
        if (p.y > confettiCanvas.height + 10) {
          p.y = -10;
          p.x = Math.random() * confettiCanvas.width;
        }
      }
    });
    confettiFrameId = requestAnimationFrame(drawConfetti);
  };

  const startConfetti = () => {
    if (confettiFrameId) return;
    const mode = document.body.classList.contains('theme-holiday') ? 'snow' : 'confetti';
    setupConfetti(mode);
    drawConfetti();
    window.addEventListener('resize', resizeConfetti);
  };

  const stopConfetti = () => {
    if (confettiFrameId) cancelAnimationFrame(confettiFrameId);
    confettiFrameId = null;
    confettiPieces = [];
    if (confettiCanvas.parentNode) confettiCanvas.parentNode.removeChild(confettiCanvas);
    confettiCtx = null;
    window.removeEventListener('resize', resizeConfetti);
  };

  const showOverlay = (prize) => {
    if (!prize) return;
    overlayName.textContent = prizeLabel(prize);
    overlayDetails.textContent = `ID ${prize.id || '--'}`;
    overlayDesc.textContent = prize.descripcion ? prize.descripcion : 'Sin descripción';
    overlay.classList.remove('hidden');
    requestAnimationFrame(() => overlay.classList.add('show'));
    startConfetti();
  };

  const hideOverlay = () => {
    overlay.classList.remove('show');
    setTimeout(() => {
      overlay.classList.add('hidden');
      stopConfetti();
    }, 180);
  };

  const updateSelected = (prize) => {
    if (!prize) {
      selectedName.textContent = '--';
      selectedDetails.textContent = 'ID -- · Valor --';
      return;
    }
    selectedName.textContent = prizeLabel(prize);
    selectedDetails.textContent = `ID ${prize.id || '--'} · Valor ${formatValue(prize.valor)}`;
  };

  const updateAvailabilityState = () => {
    if (!availablePrizes.length) {
      spinBtn.disabled = true;
      availabilityMsg.textContent = 'Ya no quedan premios disponibles.';
    } else {
      spinBtn.disabled = isSpinning;
      availabilityMsg.textContent = `${availablePrizes.length} premio(s) disponible(s).`;
    }
  };

  const renderHistory = () => {
    historyCount.textContent = history.length;
    if (!history.length) {
      historyBody.innerHTML =
        '<tr><td colspan="6" class="muted">Aún no hay premios registrados.</td></tr>';
      return;
    }
    const rows = history
      .map(
        (item, idx) => `<tr>
          <td>${idx + 1}</td>
          <td>${escapeHtml(item.id || '')}</td>
          <td>${escapeHtml(item.nombre || '')}</td>
          <td>${escapeHtml(item.descripcion || '--')}</td>
          <td>${escapeHtml(formatValue(item.valor))}</td>
          <td>${escapeHtml(formatDate(item.fechaHora))}</td>
        </tr>`
      )
      .join('');
    historyBody.innerHTML = rows;
  };

  const fetchAvailable = async () => {
    try {
      const res = await fetch('/api/premios');
      if (!res.ok) throw new Error('No se pudieron obtener los premios.');
      availablePrizes = await res.json();
      updateAvailabilityState();
    } catch (err) {
      console.error(err);
      availabilityMsg.textContent = 'Error al leer premios.';
      spinBtn.disabled = true;
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ganados');
      if (!res.ok) throw new Error('No se pudo leer el historial.');
      history = await res.json();
      renderHistory();
    } catch (err) {
      console.error(err);
      historyBody.innerHTML =
        '<tr><td colspan="6" class="muted">No se pudo cargar el historial.</td></tr>';
    }
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;
    showStatus('Girando...', false);
    renderPreview();

    try {
      const res = await fetch('/api/girar', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.error || 'No se pudo completar el giro.';
        showStatus(message, true);
        if (message.includes('No hay premios')) {
          availablePrizes = [];
          updateAvailabilityState();
        }
        return;
      }

      const data = await res.json();
      const premio = data.premio;
      const ruleta = Array.isArray(data.ruleta) && data.ruleta.length ? data.ruleta : availablePrizes;

      await slotSpin(ruleta, premio);
      updateSelected(premio);
      showStatus('Premio guardado en el historial.', false);
      showOverlay(premio);

      availablePrizes = Array.isArray(data.disponibles) ? data.disponibles : availablePrizes;
      await Promise.all([fetchHistory(), fetchAvailable()]);
    } catch (err) {
      console.error(err);
      showStatus('Fallo la comunicación con el servidor.', true);
    } finally {
      isSpinning = false;
      updateAvailabilityState();
    }
  };

  const toggleHistory = () => {
    historyPanel.classList.toggle('hidden');
    if (!historyPanel.classList.contains('hidden')) {
      fetchHistory();
    }
  };

  const applyTheme = (isHoliday) => {
    document.body.classList.toggle('theme-holiday', isHoliday);
    if (themeToggleInput) {
      themeToggleInput.checked = isHoliday;
    }
  };

  const loadTheme = () => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === 'holiday') isHolidayTheme = true;
    } catch (err) {
      console.warn('No se pudo leer el tema guardado.', err);
    }
    applyTheme(isHolidayTheme);
  };

  const toggleTheme = () => {
    if (themeToggleInput) {
      isHolidayTheme = !!themeToggleInput.checked;
    } else {
      isHolidayTheme = !isHolidayTheme;
    }
    applyTheme(isHolidayTheme);
    try {
      localStorage.setItem(THEME_KEY, isHolidayTheme ? 'holiday' : 'classic');
    } catch (err) {
      console.warn('No se pudo guardar el tema.', err);
    }
  };

  const init = async () => {
    await Promise.all([fetchAvailable(), fetchHistory()]);
    renderPreview();
    loadTheme();
  };

  spinBtn.addEventListener('click', handleSpin);
  toggleHistoryBtn.addEventListener('click', toggleHistory);
  if (themeToggleInput) themeToggleInput.addEventListener('change', toggleTheme);
  printBtn.addEventListener('click', () => window.open('/print', '_blank'));
  overlayClose.addEventListener('click', hideOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay || e.target.classList.contains('overlay-backdrop')) hideOverlay();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) hideOverlay();
    if (e.key === 'Enter') {
      if (!overlay.classList.contains('hidden')) hideOverlay();
      handleSpin();
    }
  });

  init();
})();
