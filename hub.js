'use strict';
const tools=globalThis.AtelierTools,$=id=>document.getElementById(id);
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s/g,'');
let category='すべて';
function render(){
 const query=normalize($('search').value),shown=tools.filter(t=>(category==='すべて'||t.category===category)&&normalize([t.name,t.subtitle,t.description,t.category,t.keywords].join(' ')).includes(query));
 $('tool-count').textContent=`${shown.length}件の道具`;$('reset').hidden=!query&&category==='すべて';$('empty').hidden=shown.length>0;
 $('tool-list').replaceChildren(...shown.map(tool=>{
  const card=document.createElement('article');card.className='tool-card';
  const icon=document.createElement('div');icon.className='tool-icon';icon.setAttribute('aria-hidden','true');icon.textContent=tool.slug==='price-time-machine'?'¥':'＋';
  const content=document.createElement('div');content.className='tool-copy';const meta=document.createElement('p');meta.className='tool-meta';meta.textContent=tool.category+' / '+tool.badge;
  const heading=document.createElement('h3');heading.textContent=tool.name;const sub=document.createElement('p');sub.className='tool-subtitle';sub.textContent=tool.subtitle;const desc=document.createElement('p');desc.className='tool-description';desc.textContent=tool.description;
  const link=document.createElement('a');link.href=tool.href;link.className='open-tool';link.textContent='この道具を使う';link.setAttribute('aria-label',tool.subtitle+'を使う');const arrow=document.createElement('span');arrow.setAttribute('aria-hidden','true');arrow.textContent=' ↗';link.append(arrow);
  content.append(meta,heading,sub,desc,link);card.append(icon,content);return card;
 }));
}
const categories=['すべて',...new Set(tools.map(t=>t.category))];
if(categories.length>2){$('categories').hidden=false;for(const name of categories){const button=document.createElement('button');button.type='button';button.textContent=name;button.setAttribute('aria-pressed',String(name===category));button.onclick=()=>{category=name;for(const b of $('categories').children)b.setAttribute('aria-pressed',String(b===button));render();};$('categories').append(button);}}
$('search').addEventListener('input',render);$('reset').addEventListener('click',()=>{category='すべて';$('search').value='';for(const b of $('categories').children)b.setAttribute('aria-pressed',String(b.textContent===category));render();$('search').focus();});render();
