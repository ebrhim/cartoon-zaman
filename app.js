// app.js - واجهة بسيطة لقراءة data/series.json وعرضها
async function loadSeries(){
  try {
    const res = await fetch('data/series.json');
    if(!res.ok) throw new Error('فشل تحميل البيانات: ' + res.status);
    const data = await res.json();
    return data.series || [];
  } catch (err) {
    console.error(err);
    return [];
  }
}

function createCard(series){
  const el = document.createElement('article');
  el.className = 'card';
  const img = series.poster_file_url || 'placeholder.jpg';
  el.innerHTML = `
    <img loading="lazy" alt="${escapeHtml(series.title)} poster" src="${img}" />
    <div class="card-body">
      <h3>${escapeHtml(series.title)}</h3>
      <p>${escapeHtml(series.description || '')}</p>
      <a class="view-btn" href="#" data-slug="${series.slug}">عرض المسلسل</a>
    </div>
  `;
  return el;
}

function escapeHtml(s){ return String(s||'').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

function openModal(series){
  const modal = document.getElementById('modal');
  const detail = document.getElementById('seriesDetail');
  detail.innerHTML = `
    <h2 id="modalTitle">${escapeHtml(series.title)}</h2>
    <div class="series-meta">
      <img src="${series.poster_file_url || 'placeholder.jpg'}" alt="Poster" />
      <div>
        <p>${escapeHtml(series.description || '')}</p>
        <div class="attribution">
          مصدر البوستر: ${series.poster_wikipedia_page ? `<a href="${series.poster_wikipedia_page}" target="_blank" rel="noopener">صفحة الملف على Wikimedia Commons</a>` : 'غير متوفر'}
          <div>ترخيص/ملاحظة: ${escapeHtml(series.poster_license || 'تحقق من صفحة الملف على Wikimedia Commons')}</div>
        </div>
      </div>
    </div>

    <h3>الحلقات</h3>
    <div class="episodes-list">
      ${series.episodes.length ? series.episodes.map((ep, i)=>`
        <div class="episode-item">
          <div>${i+1}. ${escapeHtml(ep.title)}</div>
          <button data-embed="${escapeHtml(ep.embed_url || '')}" class="play-ep">تشغيل</button>
        </div>
      `).join('') : '<p class="muted">لم تُضَف حلقات لهذا المسلسل بعد. يمكنك تعديل ملف data/series.json لإضافة روابط embed.</p>'}
    </div>

    <div id="player" style="margin-top:12px"></div>
  `;
  modal.hidden = false;

  // أحداث التشغيل
  detail.querySelectorAll('.play-ep').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const embed = btn.getAttribute('data-embed');
      const player = document.getElementById('player');
      if(!embed){
        player.innerHTML = '<p>لا يوجد رابط مضمّن للحلقة. أضف رابط embed صالح (YouTube/Archive.org) في بيانات المسلسل.</p>';
        return;
      }
      // عرض iframe آمن — تأكد أن embed هو رابط iframe (مثل https://www.youtube.com/embed/...)
      player.innerHTML = `<div style="position:relative;padding-top:56.25%"><iframe src="${escapeHtml(embed)}" frameborder="0" allowfullscreen style="position:absolute;inset:0;width:100%;height:100%"></iframe></div>`;
    });
  });
}

function setupSearch(series){
  const input = document.getElementById('search');
  input.addEventListener('input', ()=>renderGrid(series.filter(s=>{
    const q = input.value.trim();
    if(!q) return true;
    return s.title.includes(q) || (s.aliases || []).some(a=>a.includes(q));
  })));
}

function renderGrid(list){
  const grid = document.getElementById('grid');
  grid.innerHTML = '';
  list.forEach(s=> grid.appendChild(createCard(s)));
}

async function render(){
  const series = await loadSeries();
  renderGrid(series);

  const grid = document.getElementById('grid');
  grid.addEventListener('click', e=>{
    const btn = e.target.closest('.view-btn');
    if(!btn) return;
    e.preventDefault();
    const slug = btn.getAttribute('data-slug');
    const s = series.find(x=>x.slug===slug);
    if(s) openModal(s);
  });

  document.getElementById('closeModal').addEventListener('click', ()=>document.getElementById('modal').hidden = true);
  document.getElementById('modal').addEventListener('click', e=>{ if(e.target.id==='modal') document.getElementById('modal').hidden = true });

  setupSearch(series);
}

render();
