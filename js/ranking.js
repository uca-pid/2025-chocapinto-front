(function(){
  const escapeHtml = (s)=> String(s||'').replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]));

  function computeScore(u){
    if(typeof u.clubsCount === 'number') return u.clubsCount;
    return (u.commentsCount||0)*2 + (u.booksAddedCount||0);
  }

  function podiumTemplate(u, rank){
    const count = (typeof u.clubsCount === 'number') ? u.clubsCount : computeScore(u);
    const medal = rank===1? '🥇' : rank===2? '🥈' : '🥉';
    const accent = rank===1? 'accent-1' : rank===2? 'accent-2' : 'accent-3';
    const photo = u.avatarUrl ? `<img src="${u.avatarUrl}" alt="${u.username}"/>`
                              : `<div class="avatar-fallback">${(u.username||'U')[0].toUpperCase()}</div>`;
    return `
      <div class="card ${accent}">
        <div class="rank-badge">#${rank}</div>
        <div class="avatar-wrap">${photo}<span class="medal" aria-hidden="true">${medal}</span></div>
        <h3 class="name">${escapeHtml(u.name||u.username)}</h3>
        <p class="handle">@${escapeHtml(u.username||'usuario')}</p>
        <hr class="sep" />
        <div class="count"><strong>${count}</strong><span>clubes de lectura</span></div>
      </div>`;
  }

  const ENDPOINTS = [
    window.__RANKING_ENDPOINT || '',
  ].filter(Boolean);

  async function fetchFrom(url){
    const res = await fetch(url, { headers: { 'Accept':'application/json' } });
    if(!res.ok) throw new Error(`HTTP ${res.status} @ ${url}`);
    const data = await res.json();
    const arr = Array.isArray(data) ? data :
                Array.isArray(data?.ranking) ? data.ranking :
                Array.isArray(data?.data) ? data.data :
                Array.isArray(data?.results) ? data.results :
                Array.isArray(data?.items) ? data.items : [];
    return arr.map(x=>({
      username: x.username || x.user?.username || 'usuario',
      name: x.name || x.user?.name || x.username || 'Usuario',
      avatarUrl: x.avatarUrl || x.user?.avatarUrl,
      clubsCount: x.clubsCount ?? x.totalClubs ?? undefined,
      commentsCount: x.commentsCount ?? x.totalComments ?? 0,
      booksAddedCount: x.booksAddedCount ?? x.totalBooks ?? 0
    }));
  }

  async function fetchRanking(){
    let lastErr;
    for(const url of ENDPOINTS){
      try{ return await fetchFrom(url); }catch(e){ lastErr = e; console.warn('Ranking fetch fail:', e); }
    }
    throw lastErr || new Error('No endpoint set');
  }

  async function init(){
    const first  = document.getElementById('first');
    const second = document.getElementById('second');
    const third  = document.getElementById('third');
    const empty  = document.getElementById('empty');
    const loading = '<div class="card" style="justify-content:center">Cargando…</div>';
    first.innerHTML = second.innerHTML = third.innerHTML = loading;

    try{
      const data = await fetchRanking();
      if(!data.length){
        first.innerHTML = second.innerHTML = third.innerHTML = '';
        empty.hidden = false; return;
      }
      empty.hidden = true;
      const sorted = [...data].sort((a,b)=> computeScore(b) - computeScore(a)).slice(0,3);
      const [u1,u2,u3] = [sorted[0], sorted[1], sorted[2]];
      first.innerHTML = podiumTemplate(u1,1);
      second.innerHTML = podiumTemplate(u2,2);
      third.innerHTML = podiumTemplate(u3,3);
    }catch(err){
      console.error('No se pudo cargar el ranking:', err);
      const errHtml = `<div class="card" style="justify-content:center">No se pudo cargar el ranking (ver consola)</div>`;
      first.innerHTML = second.innerHTML = third.innerHTML = errHtml;
      empty.hidden = true;
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
