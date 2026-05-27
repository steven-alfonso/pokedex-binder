let pokedexData = [];
let rows = 3;
let columns = 3;
let pages = 40;
let spreadStart = 1;
let totalPages = 1;
let binderSlots = [];
let selectedPokemon = null;

fetch('/api/pokedex')
  .then(res => res.json())
  .then(data => {
    pokedexData = data;
    const saved = loadBinder();
    if (saved) {
      binderSlots = saved.binderSlots;
      rows = saved.rows;
      columns = saved.columns;
      pages = saved.pages || 40;
      const capacity = pages * rows * columns;
      if (binderSlots.length < capacity) {
        binderSlots = [...binderSlots, ...new Array(capacity - binderSlots.length).fill(null)];
      }
      $('rows').value = rows;
      $('columns').value = columns;
      $('pages').value = pages;
      $('menuPages').value = pages;
      $('setup').classList.add('hidden');
      $('search').classList.remove('hidden');
      $('binder').classList.remove('hidden');
      spreadStart = 1;
      renderBinderPage();
    }
  })
  .catch(err => console.error('Failed to load Pokédex:', err));

const $ = id => document.getElementById(id);

$('applySettings').addEventListener('click', () => {
  rows = parseInt($('rows').value, 10);
  columns = parseInt($('columns').value, 10);
  pages = parseInt($('pages').value, 10);

  $('setup').classList.add('hidden');
  $('search').classList.remove('hidden');
  $('binder').classList.remove('hidden');

  initBinder();
});

$('searchInput').addEventListener('input', () => {
  const query = $('searchInput').value.toLowerCase().trim();
  const results = $('searchResults');
  if (!query) {
    results.innerHTML = '';
    results.classList.add('hidden');
    return;
  }
  results.classList.remove('hidden');
  const perPage = rows * columns;
  const matches = pokedexData.filter(p =>
    p.name.toLowerCase().includes(query) ||
    p.number.toString() === query
  ).slice(0, 20);
  results.innerHTML = matches.map(p => {
    const inBinder = (p.number - 1) < binderSlots.length && binderSlots[p.number - 1] != null;
    const t1class = p.type1.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const t2class = p.type2 ? p.type2.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null;
    const typeBadges = `<span class="result-type ${t1class}">${p.type1}</span>${t2class ? `<span class="result-type ${t2class}">${p.type2}</span>` : ''}`;
    return `<div class="result-item${inBinder ? ' in-binder' : ''}" data-number="${p.number}" data-in-binder="${inBinder}" tabindex="0" role="option">#${p.number} ${p.name} — ${typeBadges}${inBinder ? ' <span class="binder-badge">✓ In binder</span>' : ''}</div>`;
  }).join('');
});

function glowCard(slotIndex) {
  const pokemon = pokedexData.find(p => p.number === slotIndex + 1);
  if (!pokemon) return;
  const t1 = pokemon.type1.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const typeColor = getComputedStyle(document.documentElement).getPropertyValue(`--type-${t1}`).trim();
  const r = parseInt(typeColor.slice(1, 3), 16);
  const g = parseInt(typeColor.slice(3, 5), 16);
  const b = parseInt(typeColor.slice(5, 7), 16);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const card = document.querySelector(`.binder-slot[data-index="${slotIndex}"]`);
      if (card) {
        card.style.setProperty('--glow-color', `rgba(${r}, ${g}, ${b}, 0.6)`);
        card.classList.add('glow');
        setTimeout(() => {
          card.classList.remove('glow');
          card.style.removeProperty('--glow-color');
        }, 3000);
      }
    });
  });
}

function handleResultClick(num, inBinder) {
  const perPage = rows * columns;
  if (inBinder) {
    selectedPokemon = null;
    const page = Math.floor((num - 1) / perPage) + 1;
    if (page === 1) {
      spreadStart = 1;
    } else if (page % 2 === 0) {
      spreadStart = page;
    } else {
      spreadStart = page - 1;
    }
    $('searchInput').value = '';
    $('searchResults').innerHTML = '';
    $('searchResults').classList.add('hidden');
    renderBinderPage();
    glowCard(num - 1);
  } else {
    $('searchResults').querySelectorAll('.result-item').forEach(r => r.classList.remove('selected'));
    const el = $('searchResults').querySelector(`.result-item[data-number="${num}"]`);
    if (el) el.classList.add('selected');
    selectedPokemon = num;
  }
}

function addSelectedPokemon() {
  if (selectedPokemon === null) return;
  const slotIndex = selectedPokemon - 1;
  if (binderSlots[slotIndex] != null) return;
  binderSlots[slotIndex] = selectedPokemon;
  saveBinder();

  const perPage = rows * columns;
  const page = Math.floor(slotIndex / perPage) + 1;

  if (page === 1) {
    spreadStart = 1;
  } else if (page % 2 === 0) {
    spreadStart = page;
  } else {
    spreadStart = page - 1;
  }

  const slotOnPage = (slotIndex % perPage) + 1;
  const pokemon = pokedexData.find(p => p.number === selectedPokemon);
  showToast(`${pokemon.name} added → Page ${page}, Slot ${slotOnPage}`);

  selectedPokemon = null;
  $('searchInput').value = '';
  $('searchResults').innerHTML = '';
  $('searchResults').classList.add('hidden');
  renderBinderPage();
  glowCard(slotIndex);
}

$('searchResults').addEventListener('click', (e) => {
  const item = e.target.closest('.result-item');
  if (!item) return;
  handleResultClick(parseInt(item.dataset.number, 10), item.dataset.inBinder === 'true');
});

$('searchResults').addEventListener('dblclick', (e) => {
  const item = e.target.closest('.result-item');
  if (!item) return;
  const inBinder = item.dataset.inBinder === 'true';
  if (!inBinder) {
    selectedPokemon = parseInt(item.dataset.number, 10);
    addSelectedPokemon();
  }
});

$('searchResults').addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' && e.key !== ' ') return;
  const item = e.target.closest('.result-item');
  if (!item) return;
  e.preventDefault();
  handleResultClick(parseInt(item.dataset.number, 10), item.dataset.inBinder === 'true');
});

$('addSelected').addEventListener('click', addSelectedPokemon);

function goPrevPage() {
  if (spreadStart === 1) return;
  if (spreadStart === 2) {
    spreadStart = 1;
  } else {
    spreadStart -= 2;
  }
  renderBinderPage();
}

function goNextPage() {
  const rightMost = spreadStart === 1 ? 1 : Math.min(spreadStart + 1, totalPages);
  if (rightMost >= totalPages) return;
  if (spreadStart === 1) {
    spreadStart = 2;
  } else {
    spreadStart += 2;
  }
  renderBinderPage();
}

$('prevPage').addEventListener('click', goPrevPage);
$('nextPage').addEventListener('click', goNextPage);
$('prevPageTop').addEventListener('click', goPrevPage);
$('nextPageTop').addEventListener('click', goNextPage);

$('menuToggle').addEventListener('click', () => {
  $('menuDropdown').classList.toggle('hidden');
});

$('clearData').addEventListener('click', () => {
  if (!confirm('Clear all collected Pokémon and reset binder to defaults? This cannot be undone.')) return;
  localStorage.removeItem('pokedex-binder');
  binderSlots = [];
  spreadStart = 1;
  pages = 40;
  $('setup').classList.remove('hidden');
  $('search').classList.add('hidden');
  $('binder').classList.add('hidden');
  $('rows').value = 3;
  $('columns').value = 3;
  $('pages').value = 40;
  $('menuPages').value = 40;
  $('searchInput').value = '';
  $('searchResults').innerHTML = '';
  $('menuDropdown').classList.add('hidden');
});

$('applyPages').addEventListener('click', () => {
  const newPages = parseInt($('menuPages').value, 10);
  const capacity = newPages * rows * columns;
  if (capacity < binderSlots.length) {
    const removed = binderSlots.filter(s => s !== null).length;
    binderSlots = binderSlots.slice(0, capacity);
    if (removed > 0) {
      showToast(`Reduced to ${newPages} pages — ${removed} Pokémon removed from overflow slots`);
    }
  } else if (binderSlots.length < capacity) {
    binderSlots = [...binderSlots, ...new Array(capacity - binderSlots.length).fill(null)];
  }
  pages = newPages;
  $('pages').value = newPages;
  saveBinder();
  $('menuDropdown').classList.add('hidden');
  if (spreadStart > pages) spreadStart = pages;
  renderBinderPage();
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.menu-container') && e.target.id !== 'applyPages') {
    $('menuDropdown').classList.add('hidden');
  }
});

function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-fade');
    setTimeout(() => toast.remove(), 400);
  }, 2500);
}

function saveBinder() {
  try {
    localStorage.setItem('pokedex-binder', JSON.stringify({ binderSlots, rows, columns, pages }));
  } catch (e) {
    // ignore storage errors
  }
}

function loadBinder() {
  try {
    const raw = localStorage.getItem('pokedex-binder');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function initBinder() {
  const capacity = pages * rows * columns;
  binderSlots = new Array(capacity).fill(null);
  spreadStart = 1;
  $('menuPages').value = pages;
  saveBinder();
  renderBinderPage();
}

function renderPage(pageNum) {
  const perPage = rows * columns;
  const displayCapacity = pages * perPage;
  const start = (pageNum - 1) * perPage;
  let html = '';
  for (let i = 0; i < perPage; i++) {
    const idx = start + i;
    const isOutOfBounds = idx >= displayCapacity;
    if (idx >= binderSlots.length) {
      html += `<div class="binder-slot out-of-bounds"></div>`;
      continue;
    }
    const num = binderSlots[idx];
    if (num === null) {
      html += `<div class="binder-slot${isOutOfBounds ? ' out-of-bounds' : ''}">${isOutOfBounds ? '' : 'Empty'}</div>`;
      continue;
    }
    const pokemon = pokedexData.find(p => p.number === num);
    const t1class = pokemon.type1.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const t2class = pokemon.type2 ? pokemon.type2.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : null;
    const typeBadges = `<span class="type-badge ${t1class}">${pokemon.type1}</span>${t2class ? `<span class="type-badge ${t2class}">${pokemon.type2}</span>` : ''}`;
    const extra = isOutOfBounds ? ' out-of-bounds' : '';
    html += `<div class="binder-slot filled type-${t1class}${extra}" data-index="${idx}"><span class="remove-btn" data-index="${idx}">×</span><div class="card-content"><span class="card-number">#${String(pokemon.number).padStart(4, '0')}</span><span class="card-name">${pokemon.name}</span><div class="card-types">${typeBadges}</div></div></div>`;
  }
  return html;
}

function renderBinderPage() {
  const perPage = rows * columns;
  const spread = $('binderSpread');
  totalPages = Math.max(pages, Math.ceil(binderSlots.length / perPage));

  let leftPage = null, rightPage = null;
  if (spreadStart === 1) {
    rightPage = 1;
  } else {
    leftPage = spreadStart;
    rightPage = spreadStart + 1 <= totalPages ? spreadStart + 1 : null;
  }

  let html = '';
  if (leftPage) {
    html += `<div class="binder-page-wrap"><div class="page-label">${leftPage}</div><div class="binder-page" style="grid-template-columns: repeat(${columns}, 1fr)">${renderPage(leftPage)}</div></div>`;
  } else {
    html += `<div class="binder-page-wrap"></div>`;
  }
  if (rightPage) {
    html += `<div class="binder-page-wrap"><div class="page-label">${rightPage}</div><div class="binder-page" style="grid-template-columns: repeat(${columns}, 1fr)">${renderPage(rightPage)}</div></div>`;
  } else {
    html += `<div class="binder-page-wrap"></div>`;
  }
  spread.innerHTML = html;

  spread.querySelectorAll('.remove-btn').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const idx = parseInt(el.dataset.index, 10);
      binderSlots[idx] = null;
      saveBinder();
      renderBinderPage();
    });
  });

  $('prevPage').disabled = spreadStart <= 1;
  $('prevPageTop').disabled = spreadStart <= 1;
  const rightMost = spreadStart === 1 ? 1 : (rightPage || leftPage);
  $('nextPage').disabled = rightMost >= totalPages;
  $('nextPageTop').disabled = rightMost >= totalPages;
}
