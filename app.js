(function(){
const KEY='ieltsWords.v1';
const today=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};
let S=Object.assign({known:{},wrong:{},correct:0,total:0,streak:0,lastDay:''},JSON.parse(localStorage.getItem(KEY)||'{}'));
let ALL=WORDS.slice();
const save=()=>localStorage.setItem(KEY,JSON.stringify(S));
const $=s=>document.querySelector(s);
const app=$('#app');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function touchDay(){const t=today();if(S.lastDay===t)return;const y=new Date();y.setDate(y.getDate()-1);
 const ys=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
 S.streak=(S.lastDay===ys)?S.streak+1:1;S.lastDay=t;}
function record(w,ok){touchDay();S.total++;if(ok){S.correct++;S.known[w.w]=1;}else{S.wrong[w.w]=1;delete S.known[w.w];}save();stats();}
function stats(){const acc=S.total?Math.round(S.correct/S.total*100):0;
 $('#stats').innerHTML=`<span>已掌握 ${Object.keys(S.known).length}</span><span>正确率 ${acc}%</span><span>连续打卡 ${S.streak} 天</span><span>错词 ${Object.keys(S.wrong).length}</span>`;
 $('#total').textContent=ALL.length;}
function speak(t){if(!window.speechSynthesis){alert('当前浏览器不支持发音');return;}speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(t);u.lang='en-GB';u.rate=.9;const v=speechSynthesis.getVoices().find(v=>v.lang==='en-GB');if(v)u.voice=v;speechSynthesis.speak(u);}
window.__speak=speak;
const spk=w=>`<button class="speak" onclick="event.stopPropagation();__speak('${esc(w).replace(/&#39;/g,"\\'")}')">🔊 发音</button>`;
// pick: unknown words first
function pick(pool){pool=pool||ALL;const un=pool.filter(w=>!S.known[w.w]);return rnd(un.length&&Math.random()<.8?un:pool);}
function flash(){const w=pick();let shown=false;
 app.innerHTML=`<div class="card flip" id="fc"><div class="word">${esc(w.w)}</div><div class="phon">${esc(w.p)}</div><div>${spk(w.w)}</div><div id="back" class="hint">点击卡片查看释义</div></div>
 <div class="row"><button class="btn bad" id="no">不认识</button><button class="btn good" id="yes">认识</button></div>`;
 $('#fc').onclick=()=>{if(shown)return;shown=true;$('#back').className='';$('#back').innerHTML=`<div class="mean">${esc(w.m)}</div><div class="ex">${esc(w.e)}</div>`;};
 $('#yes').onclick=()=>{record(w,true);flash();};$('#no').onclick=()=>{record(w,false);flash();};}
function quiz(pool){const w=pick(pool);const opts=shuffle([w,...shuffle(ALL.filter(x=>x.w!==w.w)).slice(0,3)]);
 app.innerHTML=`<div class="card"><div class="word">${esc(w.w)}</div><div class="phon">${esc(w.p)}</div>${spk(w.w)}
 <div class="opts">${opts.map((o,i)=>`<button class="opt" data-i="${i}">${esc(o.m)}</button>`).join('')}</div><div class="fb" id="fb"></div></div>`;
 let done=false;app.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{if(done)return;done=true;const o=opts[b.dataset.i],ok=o===w;
  b.classList.add(ok?'right':'wrong');app.querySelectorAll('.opt').forEach(x=>{if(opts[x.dataset.i]===w)x.classList.add('right');});
  record(w,ok);if(pool&&ok)delete S.wrong[w.w],save(),stats();
  $('#fb').innerHTML=`<span class="${ok?'ok':'no'}">${ok?'✓ 正确':'✗ 错了'}</span><div class="ex">${esc(w.e)}</div><div class="row"><button class="btn" id="nx">下一题</button></div>`;
  $('#nx').onclick=()=>pool?wrongMode():quiz();});}
function spell(){const w=pick();
 app.innerHTML=`<div class="card"><div class="mean">${esc(w.m)}</div><div class="hint">首字母 ${esc(w.w[0])} · 共 ${w.w.length} 个字母</div>
 <input class="sp" id="sp" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="输入英文单词">
 <div class="row"><button class="btn ghost" id="sk">不会</button><button class="btn" id="ck">确定</button></div><div class="fb" id="fb"></div></div>`;
 const inp=$('#sp');inp.focus();let done=false;
 const fin=ok=>{if(done)return;done=true;record(w,ok);
  $('#fb').innerHTML=`<span class="${ok?'ok':'no'}">${ok?'✓ 正确':'✗ 正确答案：'+esc(w.w)}</span> ${spk(w.w)}<div class="phon">${esc(w.p)}</div><div class="ex">${esc(w.e)}</div><div class="row"><button class="btn" id="nx">下一题</button></div>`;
  $('#nx').onclick=spell;$('#nx').focus();};
 $('#ck').onclick=()=>fin(inp.value.trim().toLowerCase()===w.w.toLowerCase());$('#sk').onclick=()=>fin(false);
 inp.onkeydown=e=>{if(e.key==='Enter'){if(done)spell();else $('#ck').click();}};}
function wrongMode(){const list=ALL.filter(w=>S.wrong[w.w]);
 if(!list.length){app.innerHTML=`<div class="card"><div class="mean">🎉 错词本是空的</div><div class="hint">在闪卡、选择题或拼写中答错的单词会出现在这里</div></div>`;return;}
 app.innerHTML=`<div class="card"><div class="mean">错词本（${list.length} 个）</div><div class="row"><button class="btn" id="rv">复习错词（答对即移出）</button></div>
 <div class="row"><button class="btn ghost" id="cl">清空错词本</button></div>
 <ul class="list">${list.map(w=>`<li><span><b>${esc(w.w)}</b> ${esc(w.p)}</span><span>${esc(w.m)}</span></li>`).join('')}</ul></div>`;
 $('#rv').onclick=()=>quiz(list.length>=1?list:null);$('#cl').onclick=()=>{if(confirm('确定清空错词本？')){S.wrong={};save();stats();wrongMode();}};}
const modes={flash,quiz:()=>quiz(),spell,wrong:wrongMode};
document.querySelectorAll('#tabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('#tabs button').forEach(x=>x.classList.remove('active'));b.classList.add('active');modes[b.dataset.mode]();});
// optional daily words (network-first via SW)
fetch('./daily.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(d=>{if(d&&Array.isArray(d.words)){const have=new Set(ALL.map(w=>w.w));d.words.forEach(w=>{if(w&&w.w&&!have.has(w.w))ALL.push(w);});stats();}}).catch(()=>{});
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
stats();flash();
})();
