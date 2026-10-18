'use strict';
const $ = id => document.getElementById(id);
const state = {data:null,workshop:null,index:0,timer:null};
const escapeHtml = value => String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function role(id){return state.data.roles.find(item => item.id === id);}
function card(event){
  const member=role(event.role);
  return '<article class="event-card" data-role="'+escapeHtml(member.id)+'"><div class="event-meta"><span class="avatar">'+escapeHtml(member.initial)+'</span><strong>'+escapeHtml(member.name)+'</strong><time>'+escapeHtml(event.time)+'</time></div><h4>'+escapeHtml(event.title)+'</h4><p class="event-text">'+escapeHtml(event.text)+'</p><p class="event-effect"><span>WHAT CHANGED</span>'+escapeHtml(event.effect)+'</p></article>';
}
function pause(){if(state.timer){clearInterval(state.timer);state.timer=null;}$('playButton').textContent='▶';$('playButton').setAttribute('aria-label','기록 자동 재생');}
function renderEvent(){
  const events=state.workshop.events;
  $('eventFeed').innerHTML=card(events[state.index]);
  $('eventCount').textContent=String(state.index+1).padStart(2,'0')+' / '+events.length;
  $('progress').value=state.index;
  $('progressLabel').textContent=(state.index+1)+' / '+events.length;
  $('prevButton').disabled=state.index===0;
  $('nextButton').disabled=state.index===events.length-1;
  const phase=events[state.index].phase;
  document.querySelectorAll('.phase-step').forEach((button,index)=>{
    button.classList.toggle('active',index===phase);
    button.classList.toggle('past',index<phase);
    button.setAttribute('aria-pressed',String(index===phase));
  });
}
function go(index){state.index=Math.max(0,Math.min(index,state.workshop.events.length-1));renderEvent();}
function play(){
  if(state.timer){pause();return;}
  if(state.index===state.workshop.events.length-1)go(0);
  $('playButton').textContent='Ⅱ';
  $('playButton').setAttribute('aria-label','기록 재생 일시정지');
  state.timer=setInterval(()=>{
    if(state.index>=state.workshop.events.length-1){pause();return;}
    go(state.index+1);
    if(state.index===state.workshop.events.length-1)pause();
  },Number($('speed').value));
}
function changeWorkshop(id){
  const selected=state.data.workshops.find(item=>item.id===id);
  if(!selected)return;
  pause();state.workshop=selected;state.index=0;
  document.querySelectorAll('[data-workshop]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.workshop===id)));
  $('artNumber').textContent=selected.number;
  $('artPlace').textContent=selected.name;
  $('placeEnglish').textContent=selected.eyebrow;
  $('placeName').textContent=selected.name;
  $('placeDescription').textContent=selected.description;
  $('replayTitle').textContent=selected.subtitle;
  $('route').innerHTML=selected.route.map(item=>'<span>'+escapeHtml(item)+'</span>').join('');
  $('sources').innerHTML=selected.sources.map(source=>'<a href="'+escapeHtml(source.url)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(source.name)+' ↗</a>').join('');
  $('phases').innerHTML=state.data.phases.map((phase,index)=>'<button class="phase-step" data-phase="'+index+'" aria-pressed="false"><small>'+escapeHtml(phase.day)+'</small><strong>'+escapeHtml(phase.name)+'</strong></button>').join('');
  $('changeGrid').innerHTML=selected.changes.map((change,index)=>'<article class="change-card"><div class="change-number">0'+(index+1)+'</div><p class="change-before">'+escapeHtml(change.before)+'</p><div class="change-arrow" aria-hidden="true">↓</div><p class="change-after">'+escapeHtml(change.after)+'</p><p class="change-because">'+escapeHtml(change.because)+'</p></article>').join('');
  $('team').innerHTML=state.data.roles.map(member=>'<button class="team-member" data-role="'+escapeHtml(member.id)+'"><span class="avatar">'+escapeHtml(member.initial)+'</span><strong>'+escapeHtml(member.name)+'</strong><small>AI 위원 · 기여 보기 ↗</small></button>').join('');
  $('progress').max=selected.events.length-1;
  renderEvent();
}
function openRole(id){
  pause();
  const member=role(id);
  if(!member)return;
  $('roleName').textContent=member.name;
  $('roleQuestion').textContent=member.question;
  const events=state.workshop.events.filter(event=>event.role===id);
  $('roleContributions').innerHTML='<p class="tiny">'+escapeHtml(state.workshop.name)+' 워크숍의 기여 요약입니다. 역할의 발언 수가 독립성이나 정확성을 뜻하지는 않습니다.</p>'+events.map(card).join('');
  $('roleDialog').showModal();
}
document.querySelectorAll('[data-workshop]').forEach(button=>button.addEventListener('click',()=>changeWorkshop(button.dataset.workshop)));
$('phases').addEventListener('click',event=>{const button=event.target.closest('[data-phase]');if(!button)return;pause();go(state.workshop.events.findIndex(item=>item.phase===Number(button.dataset.phase)));});
$('team').addEventListener('click',event=>{const button=event.target.closest('[data-role]');if(button)openRole(button.dataset.role);});
$('playButton').addEventListener('click',play);
$('prevButton').addEventListener('click',()=>{pause();go(state.index-1);});
$('nextButton').addEventListener('click',()=>{pause();go(state.index+1);});
$('progress').addEventListener('input',()=>{pause();go(Number($('progress').value));});
$('speed').addEventListener('change',()=>{if(state.timer){pause();play();}});
$('showAll').addEventListener('click',()=>{pause();$('allEvents').innerHTML=state.workshop.events.map(card).join('');$('allDialog').showModal();});
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog){const rect=dialog.getBoundingClientRect();if(event.clientX<rect.left||event.clientX>rect.right||event.clientY<rect.top||event.clientY>rect.bottom)dialog.close();}}));
$('downloadReport').addEventListener('click',()=>{
  if(!state.workshop)return;
  const payload={schemaVersion:state.data.schemaVersion,kind:state.data.kind,notice:state.data.notice,roles:state.data.roles,workshop:state.workshop,decision:{recommendation:'GO',scope:'제한된 작동 시제품 하나를 권고',aiRoleVotes:7,humanCustomerValidation:false}};
  const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download='offsite-'+state.workshop.id+'-record.json';document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
$('openDraft').addEventListener('click',()=>{
  pause();$('draftStatus').textContent='';
  try{$('draftTopic').value=localStorage.getItem('offsite-workshop-draft')||'';}catch{$('draftStatus').textContent='이 브라우저에서는 초안 저장을 사용할 수 없습니다.';}
  $('draftDialog').showModal();
});
$('draftForm').addEventListener('submit',event=>{
  event.preventDefault();
  const value=$('draftTopic').value.trim();
  if(!value){$('draftStatus').textContent='맡기고 싶은 과제를 한 줄 적어주세요.';return;}
  try{localStorage.setItem('offsite-workshop-draft',value);$('draftStatus').textContent='이 브라우저에만 저장했습니다. AI는 실행되지 않았습니다.';}catch{$('draftStatus').textContent='저장하지 못했습니다. 초안을 복사해 보관해주세요.';}
});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});
async function init(){
  const controls=['playButton','prevButton','nextButton','showAll','downloadReport'];
  controls.forEach(id=>$(id).disabled=true);
  document.querySelectorAll('[data-workshop]').forEach(button=>button.disabled=true);
  $('progress').disabled=true;
  try{
    const response=await fetch('./data/workshops.json');
    if(!response.ok)throw new Error('HTTP '+response.status);
    state.data=await response.json();
    if(!Array.isArray(state.data.roles)||!Array.isArray(state.data.workshops))throw new Error('Invalid record');
    controls.forEach(id=>$(id).disabled=false);
    document.querySelectorAll('[data-workshop]').forEach(button=>button.disabled=false);
    $('progress').disabled=false;
    changeWorkshop('museum');
  }catch{
    $('loadError').hidden=false;
    $('loadError').textContent='워크숍 기록을 불러오지 못했습니다. 연결을 확인하고 새로고침해 주세요.';
    ['playButton','prevButton','nextButton','showAll','downloadReport'].forEach(id=>$(id).disabled=true);
    document.querySelectorAll('[data-workshop]').forEach(button=>button.disabled=true);
    $('progress').disabled=true;
  }
}
init();

