// public/app.js
// Frontend-only implementation usando localStorage

function loadRegions(){
  const regions = ["Aracruz","Barra do Riacho","Vila do Riacho","Barra do Sahy"];
  const sel = document.getElementById('region');
  regions.forEach(r=>{ const o = document.createElement('option'); o.value = r; o.textContent = r; sel.appendChild(o); });
}

function getListings(){
  try{
    const raw = localStorage.getItem('construon_listings');
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}

function saveListings(list){
  localStorage.setItem('construon_listings', JSON.stringify(list));
}

function getSchedules(){
  try{
    const raw = localStorage.getItem('construon_schedules');
    return raw ? JSON.parse(raw) : [];
  }catch(e){ return []; }
}

function saveSchedules(list){
  localStorage.setItem('construon_schedules', JSON.stringify(list));
}

function openScheduleModal(name, contact) {
  const modal = document.getElementById('scheduleModal');
  const title = document.getElementById('scheduleTitle');
  title.textContent = `Agendar com ${name}`;
  modal.dataset.professional = name;
  modal.dataset.contact = contact;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden', 'false');
  document.getElementById('scheduleCustomerName').focus();
}

function closeScheduleModal(){
  const modal = document.getElementById('scheduleModal');
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden', 'true');
  document.getElementById('scheduleForm').reset();
}

function search(){
  const q = document.getElementById('q').value.toLowerCase();
  const role = document.getElementById('role').value;
  const region = document.getElementById('region').value;
  const listings = getListings();
  let filtered = listings.filter(item => {
    if(role && item.role !== role) return false;
    if(region && item.region !== region) return false;
    if(q){
      const hay = (item.name+' '+item.contact+' '+(item.specialties||'')+' '+(item.extra||'')).toLowerCase();
      return hay.includes(q);
    }
    return true;
  });
  const results = document.getElementById('results');
  results.innerHTML = '';
  if(!filtered.length){ results.textContent = 'Nenhum resultado'; return; }
  filtered.forEach(item => {
    const el = document.createElement('div'); el.className='card';
    const scheduleInfo = item.schedule ? 
      `<p><strong>Agendamento:</strong> ${item.schedule.date || 'Data a combinar'} ${item.schedule.time ? `às ${item.schedule.time}` : ''}${item.schedule.notes ? ` • ${item.schedule.notes}` : ''}</p>` : '';
    el.innerHTML = `<h3>${item.name} — ${item.role}</h3>
      <p><strong>Contato:</strong> ${item.contact}</p>
      <p><strong>Região:</strong> ${item.region||''}</p>
      <p><strong>Especialidades:</strong> ${item.specialties ? item.specialties.join(', ') : '-'}</p>
      <p><strong>Diária:</strong> ${item.daily_rate? 'R$ '+item.daily_rate : '-'}</p>
      ${scheduleInfo}
      <p><small>Publicado: ${new Date(item.created_at).toLocaleString()}</small></p>`;
    const actions = document.createElement('div'); actions.className = 'card-actions';
    const scheduleBtn = document.createElement('button');
    scheduleBtn.type = 'button';
    scheduleBtn.className = 'secondary-btn';
    scheduleBtn.textContent = 'Agendar orçamento';
    scheduleBtn.addEventListener('click', () => openScheduleModal(item.name, item.contact));
    actions.appendChild(scheduleBtn);
    el.appendChild(actions);
    // fotos (se houver)
    if(item.photos && item.photos.length){
      const photosDiv = document.createElement('div'); photosDiv.className = 'photos';
      item.photos.forEach(src => {
        const img = document.createElement('img'); img.src = src; photosDiv.appendChild(img);
      });
      el.appendChild(photosDiv);
    }
    results.appendChild(el);
  })
}

function setTab(role){
  document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active', b.dataset.role===role));
  document.getElementById('formRole').value = role;
  document.getElementById('pedreiroFields').style.display = role==='pedreiro'? 'block':'none';
  document.getElementById('ajudanteFields').style.display = role==='ajudante'? 'block':'none';
  document.getElementById('empreiteiraFields').style.display = role==='empreiteira'? 'block':'none';
}

function createListing(payload){
  const listings = getListings();
  const id = Date.now();
  const item = Object.assign({}, payload, { id, created_at: new Date().toISOString() });
  listings.unshift(item);
  saveListings(listings);
}

document.addEventListener('DOMContentLoaded', ()=>{
  loadRegions();
  document.getElementById('searchBtn').addEventListener('click', search);
  document.querySelectorAll('.tab').forEach(b=> b.addEventListener('click', ()=> setTab(b.dataset.role)));
  document.getElementById('closeScheduleModal').addEventListener('click', closeScheduleModal);

  document.getElementById('scheduleModal').addEventListener('click', (event) => {
    if(event.target && event.target.id === 'scheduleModal') closeScheduleModal();
  });

  document.getElementById('scheduleForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const modal = document.getElementById('scheduleModal');
    const professional = modal.dataset.professional || 'profissional';
    const contact = modal.dataset.contact || '';
    const customerName = document.getElementById('scheduleCustomerName').value.trim();
    const date = document.getElementById('scheduleDate').value;
    const time = document.getElementById('scheduleTime').value;
    const notes = document.getElementById('scheduleNotes').value.trim();

    if(!customerName || !date || !time){
      alert('Preencha nome, data e horário para confirmar o agendamento.');
      return;
    }

    const schedules = getSchedules();
    schedules.unshift({
      professional,
      contact,
      customerName,
      date,
      time,
      notes,
      created_at: new Date().toISOString()
    });
    saveSchedules(schedules);
    closeScheduleModal();
    alert(`Agendamento confirmado com ${professional} para ${date} às ${time}.`);
  });

  document.getElementById('submitBtn').addEventListener('click', async ()=>{
    const role = document.getElementById('formRole').value;
    const name = document.getElementById('name').value.trim();
    const contact = document.getElementById('contact').value.trim();
    const region = document.getElementById('regionInput').value.trim();
    if(!name || !contact){ alert('Nome e contato são obrigatórios'); return; }
    const payload = { role, name, contact, region };
    const budgetDate = document.getElementById('budget_date').value;
    const budgetTime = document.getElementById('budget_time').value;
    const budgetNotes = document.getElementById('budget_notes').value.trim();
    if(budgetDate || budgetTime || budgetNotes){
      payload.schedule = { date: budgetDate, time: budgetTime, notes: budgetNotes };
    }
    if(role==='pedreiro'){
      payload.daily_rate = document.getElementById('daily_rate').value;
      payload.availability = document.getElementById('availability').value;
      const specs = Array.from(document.querySelectorAll('input[name="specialty"]:checked')).map(n=>n.value);
      const other = document.getElementById('specialty_other').value.trim();
      if(other) specs.push(other);
      payload.specialties = specs;
      payload.experience_years = document.getElementById('experience_years').value;
    } else if(role==='ajudante'){
      payload.age = document.getElementById('age').value;
      payload.experience_years = document.getElementById('experience').value;
    } else if(role==='empreiteira'){
      payload.company_site = document.getElementById('company_site').value;
      payload.employees_count = document.getElementById('employees_count').value;
      payload.company_age = document.getElementById('company_age').value;
    }
    // anexar fotos (se houver)
    const photoInput = document.getElementById('photos');
    if(photoInput && photoInput.files && photoInput.files.length){
      const files = Array.from(photoInput.files);
      const dataUrls = await Promise.all(files.map(f => new Promise((res, rej) => {
        const r = new FileReader(); r.onload = e => res(e.target.result); r.onerror = rej; r.readAsDataURL(f);
      })));
      payload.photos = dataUrls;
    }
    createListing(payload);
    alert('Cadastro salvo localmente!');
    document.getElementById('form').reset();
    search();
  });
  search();
});

// preview de fotos no formulário
document.addEventListener('change', (e)=>{
  if(e.target && e.target.id==='photos'){
    const container = document.getElementById('photoPreview'); container.innerHTML='';
    const files = Array.from(e.target.files || []);
    files.forEach(f=>{
      const r = new FileReader();
      r.onload = ev => {
        const img = document.createElement('img'); img.src = ev.target.result; img.width = 100; img.style.margin='4px';
        container.appendChild(img);
      };
      r.readAsDataURL(f);
    });
  }
});
