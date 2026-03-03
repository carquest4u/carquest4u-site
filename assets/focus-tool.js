/* CarQuest4U focus preview tool */
(function(){
  const root = document.getElementById('focusToolRoot');
  if (!root) return;

  const carSel = document.getElementById('ftCar');
  const imageSel = document.getElementById('ftImage');
  const focusInput = document.getElementById('ftFocus');
  const editor = document.getElementById('focusEditor');
  const sourceImg = document.getElementById('ftSourceImage');
  const marker = document.getElementById('focusMarker');
  const previewCard = document.getElementById('ftPreviewCard');
  const previewMain = document.getElementById('ftPreviewMain');
  const previewThumb = document.getElementById('ftPreviewThumb');
  const downloadBtn = document.getElementById('downloadCarsJson');

  let cars = [];
  let dragging = false;

  const toEntry = (entry) => {
    if (typeof entry === 'string') return { src: entry, focus: '50% 50%' };
    return { src: entry?.src || '', focus: entry?.focus || '50% 50%' };
  };

  const parseFocus = (focus) => {
    const m = String(focus || '50% 50%').trim().match(/([\d.]+)%\s+([\d.]+)%/);
    if (!m) return { x: 50, y: 50 };
    return { x: Math.max(0, Math.min(100, Number(m[1]))), y: Math.max(0, Math.min(100, Number(m[2]))) };
  };

  const setFocusUI = (focus) => {
    const { x, y } = parseFocus(focus);
    marker.style.left = `${x}%`;
    marker.style.top = `${y}%`;
    focusInput.value = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
    [previewCard, previewMain, previewThumb].forEach((img) => {
      img.style.objectPosition = `${x}% ${y}%`;
    });
  };

  const currentCar = () => cars.find((c) => c.id === carSel.value);
  const currentImageIndex = () => Math.max(0, Number(imageSel.value || '0'));

  const renderImageOptions = () => {
    const car = currentCar();
    if (!car) return;
    const images = (car.images || []).map(toEntry);
    imageSel.innerHTML = images
      .map((img, i) => `<option value="${i}">Image ${i + 1} - ${img.src.split('/').pop()}</option>`)
      .join('');
  };

  const renderEditor = () => {
    const car = currentCar();
    if (!car) return;
    const images = (car.images || []).map(toEntry);
    const idx = currentImageIndex();
    const item = images[idx] || images[0];
    if (!item) return;

    sourceImg.src = item.src;
    previewCard.src = item.src;
    previewMain.src = item.src;
    previewThumb.src = item.src;
    setFocusUI(item.focus || '50% 50%');
  };

  const saveFocusValue = (x, y) => {
    const car = currentCar();
    if (!car) return;
    const idx = currentImageIndex();
    const entry = toEntry((car.images || [])[idx]);
    entry.focus = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
    if (!Array.isArray(car.images)) car.images = [];
    car.images[idx] = entry;
    setFocusUI(entry.focus);
  };

  const focusFromPointer = (clientX, clientY) => {
    const rect = editor.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y))
    };
  };

  const loadCars = async () => {
    const res = await fetch('data/cars.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Could not load cars data.');
    cars = await res.json();

    carSel.innerHTML = cars
      .map((car) => `<option value="${car.id}">${car.year} ${car.make} ${car.model}</option>`)
      .join('');

    renderImageOptions();
    renderEditor();
  };

  carSel.addEventListener('change', () => {
    renderImageOptions();
    renderEditor();
  });

  imageSel.addEventListener('change', renderEditor);

  editor.addEventListener('mousedown', (e) => {
    dragging = true;
    const { x, y } = focusFromPointer(e.clientX, e.clientY);
    saveFocusValue(x, y);
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const { x, y } = focusFromPointer(e.clientX, e.clientY);
    saveFocusValue(x, y);
  });

  window.addEventListener('mouseup', () => {
    dragging = false;
  });

  editor.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const { x, y } = focusFromPointer(t.clientX, t.clientY);
    saveFocusValue(x, y);
  }, { passive: true });

  editor.addEventListener('touchmove', (e) => {
    const t = e.touches[0];
    if (!t) return;
    const { x, y } = focusFromPointer(t.clientX, t.clientY);
    saveFocusValue(x, y);
  }, { passive: true });

  downloadBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(cars, null, 2) + '\n'], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cars.json';
    a.click();
    URL.revokeObjectURL(url);
  });

  loadCars().catch((err) => {
    console.error(err);
    root.innerHTML = '<div class="notice">Could not load tool data. Make sure data/cars.json exists.</div>';
  });
})();
