/* CarQuest4U site JS (static) */
const DATA_URL = 'data/cars.json';

const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const $ = (sel, root=document) => root.querySelector(sel);

function money(n){
  if (n === null || n === undefined || n === '') return '';
  const num = Number(n);
  if (!Number.isFinite(num)) return String(n);
  return num.toLocaleString('en-US', { style:'currency', currency:'USD', maximumFractionDigits:0 });
}
function miles(n){
  const num = Number(n);
  if (!Number.isFinite(num)) return '';
  return num.toLocaleString('en-US') + ' mi';
}
function qs(){
  const p = new URLSearchParams(location.search);
  return Object.fromEntries(p.entries());
}
function setYear(){
  const el = $('#year');
  if (el) el.textContent = new Date().getFullYear();
}
function waLink(){
  const raw = (window.CQX_WA || '+14077707324');
  const digits = raw.replace(/\D/g,'');
  return `https://wa.me/${digits}`;
}
function normalizeImageEntry(entry){
  if (!entry) return { src:'', focus:'50% 50%' };
  if (typeof entry === 'string') return { src: entry, focus:'50% 50%' };
  return {
    src: entry.src || '',
    focus: entry.focus || '50% 50%'
  };
}

function buildCarCard(car){
  const title = `${car.year} ${car.make} ${car.model}${car.trim ? ' ' + car.trim : ''}`;
  const firstImage = normalizeImageEntry((car.images && car.images[0]) ? car.images[0] : '');
  const hot = car.featured ? `<span class="badge badge--hot">Featured</span>` : '';
  const status = car.status ? `<span class="badge">${car.status}</span>` : '';
  return `
    <article class="card car-card">
      <div class="car-card__img">${firstImage.src ? `<img loading="lazy" src="${firstImage.src}" alt="${title}" style="object-position:${firstImage.focus}">` : ''}</div>
      <div class="car-card__body">
        <div class="badges">${hot}${status}</div>
        <h3>${title}</h3>
        <div class="price">${money(car.price)}</div>
        <div class="meta">
          <span>${car.body || ''}</span>
          <span>${miles(car.mileage)}</span>
          <span>${car.transmission || ''}</span>
        </div>
        <div style="margin-top:.9rem; display:flex; gap:.6rem; flex-wrap:wrap;">
          <a class="btn btn--primary" href="car.html?id=${encodeURIComponent(car.id)}">View details</a>
          <a class="btn btn--ghost" target="_blank" rel="noopener" href="${waLink()}?text=${encodeURIComponent('Hi! I am interested in: ' + title)}">WhatsApp</a>
        </div>
      </div>
    </article>
  `;
}

async function loadCars(){
  const res = await fetch(DATA_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to load cars.json');
  return res.json();
}

function populateMakeModel(cars, makeSel, modelSel){
  const makes = Array.from(new Set(cars.map(c => c.make).filter(Boolean))).sort();
  makeSel.innerHTML = `<option value="">All Makes</option>` + makes.map(m => `<option value="${m}">${m}</option>`).join('');
  makeSel.addEventListener('change', () => {
    const make = makeSel.value;
    const models = Array.from(new Set(cars.filter(c => !make || c.make === make).map(c => c.model).filter(Boolean))).sort();
    modelSel.disabled = models.length === 0;
    modelSel.innerHTML = `<option value="">All Models</option>` + models.map(m => `<option value="${m}">${m}</option>`).join('');
  });
}

function applyFilters(cars, filters){
  return cars.filter(c => {
    if (filters.make && c.make !== filters.make) return false;
    if (filters.model && c.model !== filters.model) return false;
    if (filters.type && (c.body || '').toLowerCase() !== String(filters.type).toLowerCase()) return false;
    if (filters.maxPrice && Number.isFinite(Number(filters.maxPrice)) && Number(c.price) > Number(filters.maxPrice)) return false;
    if (filters.q){
      const q = String(filters.q).toLowerCase();
      const hay = `${c.year} ${c.make} ${c.model} ${c.trim || ''} ${c.body || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

async function homeInit(){
  const newestGrid = $('#newestGrid');
  const statCars = $('#statCars');
  const makeSel = $('#makeSelect');
  const modelSel = $('#modelSelect');
  const maxPrice = $('#maxPrice');
  const form = $('#homeSearchForm');
  if (!newestGrid || !form) return;

  const cars = await loadCars();
  if (statCars) statCars.textContent = String(cars.length);

  populateMakeModel(cars, makeSel, modelSel);

  const featured = cars.filter(c => c.featured).slice(0, 6);
  const newest = [...cars].sort((a,b) => (b.year||0) - (a.year||0)).slice(0, 6);
  const list = featured.length ? featured : newest;

  newestGrid.innerHTML = list.map(buildCarCard).join('');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (makeSel.value) p.set('make', makeSel.value);
    if (modelSel.value) p.set('model', modelSel.value);
    if (maxPrice.value) p.set('maxPrice', maxPrice.value);
    location.href = `inventory.html?${p.toString()}`;
  });
}

async function inventoryInit(){
  const grid = $('#invGrid');
  const form = $('#filterForm');
  if (!grid || !form) return;

  const cars = await loadCars();
  const makeSel = $('#fMake');
  const modelSel = $('#fModel');
  const maxPrice = $('#fMaxPrice');
  const query = $('#fQuery');
  const clearBtn = $('#clearFilters');

  populateMakeModel(cars, makeSel, modelSel);

  const p = qs();
  if (p.make) makeSel.value = p.make;
  makeSel.dispatchEvent(new Event('change'));
  if (p.model) modelSel.value = p.model;
  if (p.maxPrice) maxPrice.value = p.maxPrice;
  if (p.q) query.value = p.q;

  const render = () => {
    const filters = {
      make: makeSel.value || '',
      model: modelSel.value || '',
      maxPrice: maxPrice.value || '',
      q: query.value || '',
      type: p.type || ''
    };
    const list = applyFilters(cars, filters).sort((a,b) => (b.year||0) - (a.year||0));
    const countEl = document.getElementById('invCount');
    if (countEl) countEl.textContent = String(list.length);
    grid.innerHTML = list.length ? list.map(buildCarCard).join('') : `<div class="notice">No cars match these filters. Try clearing filters.</div>`;
  };

  render();

  form.addEventListener('submit', (e)=>{ e.preventDefault(); render(); });
  [makeSel, modelSel, maxPrice].forEach(el => el.addEventListener('change', render));
  query.addEventListener('input', () => { window.clearTimeout(window.__qT); window.__qT = window.setTimeout(render, 200); });

  clearBtn?.addEventListener('click', () => {
    makeSel.value = '';
    makeSel.dispatchEvent(new Event('change'));
    modelSel.value = '';
    maxPrice.value = '';
    query.value = '';
    history.replaceState({}, '', 'inventory.html');
    render();
  });
}

function setText(id, val){
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? '';
}
function setHTML(id, html){
  const el = document.getElementById(id);
  if (el) el.innerHTML = html ?? '';
}

async function carInit(){
  const root = $('#carRoot');
  if (!root) return;

  const p = qs();
  const id = p.id;
  if (!id){
    root.innerHTML = `<div class="notice">Missing car id. Go back to <a class="link" href="inventory.html">Inventory</a>.</div>`;
    return;
  }

  const cars = await loadCars();
  const car = cars.find(c => c.id === id);
  if (!car){
    root.innerHTML = `<div class="notice">Car not found. Go back to <a class="link" href="inventory.html">Inventory</a>.</div>`;
    return;
  }

  const title = `${car.year} ${car.make} ${car.model}${car.trim ? ' ' + car.trim : ''}`;
  document.title = `${title} | CarQuest4U`;

  const mainImg = $('#mainImg');
  const thumbs = $('#thumbs');
  const images = (car.images || []).map(normalizeImageEntry).filter(i => i.src);
  if (mainImg && images.length){
    mainImg.src = images[0].src;
    mainImg.alt = title;
    mainImg.style.objectPosition = images[0].focus;
  }
  if (thumbs){
    thumbs.innerHTML = images.slice(0,6).map((img,i)=>`
      <div class="thumb" role="button" tabindex="0" aria-label="View image ${i+1}" data-src="${img.src}" data-focus="${img.focus}">
        <img loading="lazy" src="${img.src}" alt="${title} photo ${i+1}" style="object-position:${img.focus}">
      </div>
    `).join('');
    $$('.thumb', thumbs).forEach((t)=>{
      const go = () => {
        mainImg.src = t.dataset.src;
        mainImg.style.objectPosition = t.dataset.focus || '50% 50%';
      };
      t.addEventListener('click', go);
      t.addEventListener('keypress', (e)=>{ if (e.key === 'Enter') go(); });
    });
  }

  setText('carTitle', title);
  setText('carPrice', money(car.price));
  setText('carDesc', car.description || '');

  const specs = [
    ['Year', car.year],
    ['Make', car.make],
    ['Model', car.model],
    ['Trim', car.trim || '—'],
    ['Body', car.body || '—'],
    ['Mileage', miles(car.mileage) || '—'],
    ['Transmission', car.transmission || '—'],
    ['Fuel', car.fuel || '—'],
    ['Color', car.color || '—'],
    ['Status', car.status || '—'],
  ];
  setHTML('carSpecs', specs.map(([k,v])=>`
    <div class="spec"><b>${k}</b><span>${v}</span></div>
  `).join(''));

  const wa = waLink();
  const msg = `Hi! I'm interested in the ${title} (${money(car.price)}). Is it still available?`;
  document.getElementById('btnWhatsApp')?.setAttribute('href', `${wa}?text=${encodeURIComponent(msg)}`);
  document.getElementById('btnContact')?.setAttribute('href', `contact.html?car=${encodeURIComponent(title)}`);
}

function contactInit(){
  const form = $('#contactForm');
  if (!form) return;

  const p = qs();
  const car = p.car ? decodeURIComponent(p.car) : '';
  if (car) document.getElementById('cMessage').value = `Hi CarQuest4U,

I'm interested in: ${car}

Please contact me with more details.
`;

  const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mwvndgwq';
  const submitToFormspree = async (payload) => {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    if (!res.ok){
      throw new Error('Form submission failed');
    }
    return res;
  };

  form.addEventListener('submit', async (e)=>{
    e.preventDefault();
    const name = $('#cName').value.trim();
    const email = $('#cEmail').value.trim();
    const phone = $('#cPhone').value.trim();
    const topic = $('#cTopic').value;
    const msg = $('#cMessage').value.trim();
    const btn = form.querySelector('button[type="submit"]');
    const ty = document.getElementById('thankyou');

    if (btn) btn.disabled = true;
    if (ty){
      ty.style.display = 'none';
      ty.textContent = '';
    }

    try{
      await submitToFormspree({
        formType: 'Contact Inquiry',
        car,
        name,
        email,
        phone,
        topic,
        message: msg,
        sourcePage: location.pathname
      });
      if (ty){
        ty.textContent = 'Thanks! Your message was sent successfully. We will contact you shortly.';
        ty.style.display = 'block';
      }
      form.reset();
    }catch(err){
      console.error(err);
      if (ty){
        ty.textContent = 'We could not send your message right now. Please try again in a moment.';
        ty.style.display = 'block';
      }
    }finally{
      if (btn) btn.disabled = false;
    }
  });

  const news = $('#newsletterForm');
  if (news){
    news.addEventListener('submit', async (e)=>{
      e.preventDefault();
      const em = $('#nEmail').value.trim();
      const btn = news.querySelector('button[type="submit"]');
      const nt = document.getElementById('nThanks');

      if (btn) btn.disabled = true;
      if (nt){
        nt.style.display = 'none';
        nt.textContent = '';
      }

      try{
        await submitToFormspree({
          formType: 'Newsletter Signup',
          email: em,
          sourcePage: location.pathname
        });
        if (nt){
          nt.textContent = 'Thanks! You are now subscribed to updates.';
          nt.style.display = 'block';
        }
        news.reset();
      }catch(err){
        console.error(err);
        if (nt){
          nt.textContent = 'Signup failed right now. Please try again in a moment.';
          nt.style.display = 'block';
        }
      }finally{
        if (btn) btn.disabled = false;
      }
    });
  }
}


document.addEventListener('DOMContentLoaded', async ()=>{
  setYear();

  const mark = document.querySelector('.brand__mark');
  if (mark){
    const img = document.createElement('img');
    img.src = 'assets/images/logo.jpeg';
    img.alt = 'CarQuest4U logo';
    img.loading = 'lazy';
    mark.innerHTML = '';
    mark.appendChild(img);
  }

  try{
    await homeInit();
    await inventoryInit();
    await carInit();
    contactInit();
  }catch(err){
    console.error(err);
    const spots = ['newestGrid','invGrid','carRoot'].map(id=>document.getElementById(id)).filter(Boolean);
    spots.forEach(el => el.innerHTML = `<div class="notice">Could not load inventory data. Make sure <b>data/cars.json</b> exists.</div>`);
  }
});
