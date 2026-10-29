'use strict';
const $=id=>document.getElementById(id),C=globalThis.PriceCore,data=globalThis.PriceCatalog;
const fmt=v=>new Intl.NumberFormat('ja-JP',{maximumFractionDigits:0}).format(v);
const percentLabel=v=>Math.abs(v)>0&&Math.abs(v)<1?(v>0?'+1%未満':'−1%未満'):`${v>0?'+':v<0?'−':''}${fmt(Math.abs(v))}%`;
const state={selected:data.find(i=>i.number===17)||data[0],category:'すべて',limit:24,snapshot:null,revealedId:null};
const positions=new Map(data.map((item,index)=>[item.id,index+1]));
const normalize=s=>s.normalize('NFKC').toLocaleLowerCase('ja').replace(/\s/g,'').replace(/ビックマック/g,'ビッグマック');
function text(id,value){$(id).textContent=value;}
function currentYear(){return Number($('year').value);}
function ready(item){return Boolean(C.comparison(item,currentYear(),0));}
function sourceLinks(item){
 $('sources').replaceChildren();
 for(const s of item.sources||[]){const a=document.createElement('a');a.href=s.url;a.textContent=s.title+(s.checkedAt?`（確認：${s.checkedAt}）`:'');a.target='_blank';a.rel='noopener noreferrer';$('sources').append(a);}
 if(!item.sources?.length){const p=document.createElement('p');p.textContent=item.research?.reason||'比較条件を確定できた価格資料がありません。';$('sources').append(p);}
 const candidates=(item.research?.sourceCandidates||[]).filter(s=>s.usage!=='価格根拠に採用済み'&&!(item.sources||[]).some(adopted=>adopted.url===s.url));
 if(candidates.length){const d=document.createElement('details'),summary=document.createElement('summary');summary.textContent='価格の根拠には未採用の資料候補';d.append(summary);for(const s of candidates){const a=document.createElement('a');a.href=s.url;a.textContent=s.title;a.target='_blank';a.rel='noopener noreferrer';d.append(a);}d.className='sources';$('sources').append(d);}
}
function imageFor(item,container){container.replaceChildren();if(item.art){const img=document.createElement('img');img.src=item.art;img.alt=item.name+'の生成イラスト';img.loading='lazy';container.append(img);}else{const s=document.createElement('span');s.className='category-caption';s.textContent=item.category;container.append(s);}}
function selectProduct(item){
 state.selected=item;
 if(!$('keep-year').checked&&!ready(item))$('year').value=String(item.records.find(r=>C.comparison(item,r.from,0)).from);
 render();products();
 $('comparison-heading').focus({preventScroll:true});
 $('compare').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
}
function categories(){
 $('categories').replaceChildren(...['すべて',...new Set(data.map(i=>i.category))].map(category=>{const button=document.createElement('button');button.type='button';button.className='category-button';button.textContent=category;button.setAttribute('aria-pressed',String(category===state.category));button.addEventListener('click',()=>{state.category=category;state.limit=24;categories();products();$('genre-summary').textContent=category==='すべて'?'ジャンル・年代で絞る':`ジャンル：${category}`;});return button;}));
}
function products(){
 const query=normalize($('search').value.trim()),only=$('only-ready').checked;
 const filtered=data.filter(item=>(state.category==='すべて'||item.category===state.category)&&normalize(item.searchText).includes(query)&&(!only||ready(item)));
 const shown=filtered.slice(0,state.limit);
 text('result-count',`${filtered.length}件のうち${shown.length}件を表示`);$('clear-filters').hidden=!query&&state.category==='すべて'&&!only;
 text('catalogue-total',`出典付きの${data.length}商品`);text('ready-year-label',`${currentYear()}年で比較できるもの`);
 $('catalogue-grid').replaceChildren(...shown.map(item=>{
  const button=document.createElement('button');button.type='button';button.className='product'+(item.art?' has-art':'');button.setAttribute('aria-pressed',String(item.id===state.selected.id));button.setAttribute('aria-label',item.brand+' '+item.name+' '+item.spec);
  const no=document.createElement('span');no.className='product-number';no.textContent=String(positions.get(item.id)).padStart(3,'0');
  const visual=document.createElement('span');visual.className='product-visual';imageFor(item,visual);
  const copy=document.createElement('span');copy.className='product-copy';
  const preview=C.comparison(item,currentYear(),0)||(!$('keep-year').checked?item.records.map(r=>C.comparison(item,r.from,0)).find(Boolean):null);
  // Cards never show the answer; prices and years appear only after「答えを見る」.
  for(const [cls,value]of [['product-brand',item.brand],['product-name',item.name],['product-spec',item.spec],preview?['product-badge','いくら変わった？']:['product-price','この年代は未確認'],preview?null:['product-status','資料のある年代に切り替えられます']].filter(Boolean)){const span=document.createElement('span');span.className=cls;span.textContent=value;copy.append(span);}
  button.append(no,visual,copy);button.addEventListener('click',()=>selectProduct(item));return button;
 }));
 $('empty').hidden=filtered.length!==0;$('more').hidden=shown.length>=filtered.length;
}
function render(){
 const item=state.selected,year=currentYear(),before=C.historicalRecord(item.records,year),after=item.current;
 $('comparison').classList.toggle('without-art',!item.art);
 text('selection-help',$('keep-year').checked?'年代を固定しています。資料のない商品は「未確認」と表示します。':'商品を選ぶと、資料のある年代に自動で切り替わります。');
 const beforePrice=C.taxExclusive(before),afterPrice=C.taxExclusive(after),comparison=C.comparison(item,year,0);
 state.snapshot=null;$('save').disabled=true;text('save-status','');$('share').hidden=location.protocol==='file:';$('share').disabled=!comparison;text('share-status','');$('share-fallback').hidden=true;
 const available=[...$('year').options].map(o=>Number(o.value)).filter(y=>C.comparison(item,y,0));
 const referenceYear=!available.length&&!before&&item.records.length?item.records[0].from:null;
 $('available-period').hidden=Boolean(comparison)||(!available.length&&!referenceYear);
 if(available.length||referenceYear){const next=available[0]||referenceYear;text('available-period',available.length?`資料のある${next}年で比べる`:`確認済みの${next}年の価格を見る`);$('available-period').onclick=()=>{$('year').value=String(next);render();products();};}
 $('quantity-comparison').hidden=!comparison?.unitComparison;
 if(comparison?.unitComparison){const u=comparison.unitComparison;text('quantity-comparison',`容量：${comparison.before.quantity.value}${u.unit} → ${comparison.after.quantity.value}${u.unit}。100${u.unit}あたり税抜 ${fmt(u.beforePrice)}円 → ${fmt(u.afterPrice)}円（${percentLabel(u.result.percent)}）。`);}
 text('selected-category',item.category);text('brand',item.brand);text('name',item.name);text('spec',item.spec);
 text('comparison-kind',({generation:'世代・仕様が異なる比較。単純な値上がりとは区別して確認します。','quantity-change':'容量が変わった商品。個数と同じ量あたりの差を併記します。',service:'同じ区分のサービス料金。提供条件の違いも確認します。'})[item.comparisonType]||'同じ商品・仕様の比較を確認しています。');
 $('selected-image').hidden=!item.art;$('no-art').hidden=Boolean(item.art);
 if(item.art){$('selected-image').src=item.art;$('selected-image').alt=item.name+'の生成イラスト';}else{$('selected-image').removeAttribute('src');}
 text('art-note',item.art?item.artNote||'生成イラスト。実物写真・当時の形状資料ではありません。':'');
 text('then-label',`${year}年の価格`);text('before',beforePrice===null?'未確認':fmt(beforePrice)+(before?.lowerBound?'〜':''));$('before-currency').hidden=beforePrice===null;
 text('before-detail',before?before.label:'この年代の条件を確認できた資料がありません。');
 text('after',afterPrice===null?'未確認':fmt(afterPrice)+(after?.lowerBound?'〜':''));$('after-currency').hidden=afterPrice===null;text('after-detail',after?.label||'現在側の同条件価格は未確認です。');
 const longPrice=['before','after'].some(id=>$(id).textContent.length>=6);
 for(const id of ['before','after'])$(id).parentElement.classList.toggle('long-price',longPrice);
 // A comparable product starts with its answer hidden, including shared links; without a comparison nothing is hidden.
 showAnswer(!comparison||state.revealedId===item.id);
 fitPrices();
 text('research-status','');text('conditions',item.notes);text('basis',item.basis||'税区分・容量・型番・地域などを確認してから比較します。');sourceLinks(item);
 if(comparison){
  const {result}=comparison;const change=result.difference===0?'価格は同じ':Math.abs(result.difference)<1?'価格の差は1円未満':`${fmt(Math.abs(result.difference))}円${result.difference>0?'高く':'安く'}`;
  const hasLowerBound=comparison.before.lowerBound||comparison.after.lowerBound;
  text('delta',`${hasLowerBound?'公表の下限価格を含む参考比較：':''}${change}（${percentLabel(result.percent)}）${hasLowerBound?'。利用条件によって価格は異なります。':''}`);
  state.snapshot={item,year,...comparison};$('save').disabled=false;
 }else{
  text('delta',`${year}年との税抜比較はまだできません。未確認の価格から倍率は計算しません。`);
 }
}
function showAnswer(shown){
 $('reveal-panel').hidden=shown;$('answer').hidden=!shown;$('evidence').hidden=!shown;$('reveal').setAttribute('aria-expanded',String(shown));
}
$('reveal').addEventListener('click',()=>{state.revealedId=state.selected.id;showAnswer(true);fitPrices();$('answer').focus({preventScroll:true});});
function fitPrices(){
 for(const id of ['before','after']){
  const value=$(id),box=value.parentElement,currency=box.querySelector('small');box.style.fontSize='';
  const currencyWidth=currency.hidden?0:currency.getBoundingClientRect().width+parseFloat(getComputedStyle(currency).marginLeft);
  const available=box.clientWidth-currencyWidth,width=value.getBoundingClientRect().width;
  if(available>0&&width>available){const size=parseFloat(getComputedStyle(box).fontSize);box.style.fontSize=Math.max(12,Math.floor(size*available/width))+'px';}
 }
}
new ResizeObserver(fitPrices).observe($('before').closest('.price-pair'));
function wrap(ctx,message,x,y,width,lineHeight){let line='';for(const ch of message){if(ctx.measureText(line+ch).width>width){ctx.fillText(line,x,y);y+=lineHeight;line=ch;}else line+=ch;}if(line)ctx.fillText(line,x,y);return y+lineHeight;}
function fittedPrice(ctx,message,x,y,width){let size=72;do{ctx.font=`bold ${size}px sans-serif`;if(ctx.measureText(message).width<=width)break;size-=2;}while(size>28);ctx.fillText(message,x,y);}
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);}
const inlineArtLoads=new Map();
async function exportArt(item){
 let source=item.art;
 // File-origin images taint a canvas. Load the identical PNG as data only when exporting.
 if(location.protocol==='file:'){
  if(!inlineArtLoads.has(source)){
   const load=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src=source+'.js';script.async=true;
    const finish=error=>{script.remove();error?reject(error):resolve();};
    script.onload=()=>finish(/^data:image\/png;base64,/.test(globalThis.PriceInlineArt?.[source]||'')?null:Error('Missing illustration'));
    script.onerror=()=>finish(Error('Illustration could not be loaded'));
    document.head.append(script);
   });
   inlineArtLoads.set(source,load);
   load.catch(()=>inlineArtLoads.delete(source));
  }
  await inlineArtLoads.get(source);source=globalThis.PriceInlineArt[source];
 }
 const image=new Image();image.src=source;await image.decode();return image;
}
$('save').addEventListener('click',async()=>{
 const s=state.snapshot;if(!s)return;const includeArt=Boolean(s.item.art);$('save').disabled=true;text('save-status','画像を作成しています。');
 try{
  const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=4000;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#f5f1e7';ctx.fillRect(0,0,1200,4000);ctx.fillStyle='#293e35';ctx.font='bold 34px sans-serif';ctx.fillText('あの日のねだん。',70,90);
  ctx.font='25px sans-serif';ctx.fillText('資料でたどる、ねだんの変化。',70,155);
  ctx.font='bold 50px sans-serif';let y=wrap(ctx,s.item.brand+' '+s.item.name,70,240,1060,66);
  ctx.font='24px sans-serif';y=wrap(ctx,s.item.spec,70,y+6,1060,34);
  if(includeArt){const img=await exportArt(s.item);const ratio=Math.min(430/img.width,300/img.height);ctx.drawImage(img,(1200-img.width*ratio)/2,y,img.width*ratio,img.height*ratio);}
  if(state.snapshot!==s)return;
  const priceY=Math.max(includeArt?720:430,y+(includeArt?350:80));
  ctx.font='26px sans-serif';ctx.fillText(`${s.year}年`,90,priceY);ctx.fillText('比較する価格',650,priceY);
  fittedPrice(ctx,`${fmt(s.beforePrice)}円${s.before.lowerBound?'〜':''}`,90,priceY+110,460);ctx.fillStyle='#b95b3e';fittedPrice(ctx,`${fmt(s.afterPrice)}円${s.after.lowerBound?'〜':''}`,650,priceY+110,460);
  ctx.fillStyle='#293e35';ctx.font='bold 38px sans-serif';ctx.fillText(`税抜で ${percentLabel(s.result.percent)}${s.before.lowerBound||s.after.lowerBound?'（下限価格を含む比較）':''}`,70,priceY+210);
  ctx.font='22px sans-serif';y=priceY+280;if(s.unitComparison){const u=s.unitComparison;y=wrap(ctx,`100${u.unit}あたり税抜 ${fmt(u.beforePrice)}円 → ${fmt(u.afterPrice)}円（${percentLabel(u.result.percent)}）`,70,y,1060,32);}y=wrap(ctx,'価格は円単位に四捨五入。変化率は丸める前の価格から計算。',70,y+10,1060,32);y=wrap(ctx,s.item.basis,70,y+10,1060,32);y=wrap(ctx,`${s.before.label} → ${s.after.label}`,70,y+15,1060,32);
  ctx.font='18px sans-serif';y=wrap(ctx,s.item.notes,70,y+20,1060,28);y=wrap(ctx,includeArt?s.item.artNote||'生成イラストは実物写真・当時の形状資料ではありません。':'この商品にはイラストを収録していません。',70,y+15,1060,28);
  const footerY=Math.max(1150,y+70);ctx.fillText('資料の確認日は出典テキストに記録。今日の実売価格とは限りません。',70,footerY);ctx.fillText('出典URL・比較条件は、画面の「出典テキスト」から保存できます。',70,footerY+40);
  const output=document.createElement('canvas');output.width=1200;output.height=footerY+100;output.getContext('2d').drawImage(canvas,0,0);
  const blob=await new Promise(resolve=>output.toBlob(resolve,'image/png'));if(state.snapshot!==s)return;if(!blob)throw Error('image');download(blob,`あの日のねだん_${s.item.id}_${s.year}.png`);
  text('save-status','比較画像を作成しました。');
  const sourceText=[s.item.brand+' '+s.item.name,s.item.spec,s.item.basis,'表示価格は円単位に四捨五入。変化率は元の数値から計算。',`${s.year}年 ${fmt(s.beforePrice)}円${s.before.lowerBound?'〜（公表の下限）':''} / ${s.after.label} ${fmt(s.afterPrice)}円${s.after.lowerBound?'〜（公表の下限）':''}`,`資料の時点：${s.before.label} → ${s.after.label}`,s.item.notes,s.unitComparison?`100${s.unitComparison.unit}あたり税抜 ${fmt(s.unitComparison.beforePrice)}円 → ${fmt(s.unitComparison.afterPrice)}円（${percentLabel(s.unitComparison.result.percent)}）`:'',...(s.item.sources||[]).map(source=>source.title+'\n'+source.url+'\n確認日：'+source.checkedAt+'（日本時間）')].join('\n\n');
  const url=URL.createObjectURL(new Blob([sourceText],{type:'text/plain;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`${s.item.id}_出典.txt`;a.textContent='出典テキストも保存';$('save-status').append(' ',a);setTimeout(()=>URL.revokeObjectURL(url),300000);
 }catch{ if(state.snapshot===s)text('save-status','画像を保存できませんでした。ブラウザの保存設定を確認してください。'); }
 finally{if(state.snapshot===s)$('save').disabled=false;}
});
$('custom-form').addEventListener('submit',event=>{event.preventDefault();if(!$('custom-form').reportValidity())return;try{const name=$('custom-name').value.trim();if(!name)throw Error('商品名を入力してください。');const r=C.compare(Number($('custom-before').value),Number($('custom-after').value),0);text('custom-result',`「${name}」の価格の変化は${percentLabel(r.percent)}。あなたの入力による参考比較で、公表データではありません。`);}catch(error){text('custom-result',error.message);}});
$('keep-year').addEventListener('change',()=>{if(!$('keep-year').checked&&!ready(state.selected))$('year').value=String(state.selected.records.find(r=>C.comparison(state.selected,r.from,0)).from);render();products();});
$('search').addEventListener('input',()=>{state.limit=24;products();});$('only-ready').addEventListener('change',()=>{state.limit=24;products();});$('year').addEventListener('change',()=>{$('keep-year').checked=true;state.limit=24;render();products();});$('more').addEventListener('click',()=>{state.limit+=24;products();});
const years=[...new Set([1996,2006,2016,...data.flatMap(i=>i.records.map(r=>r.from))])].filter(y=>y>=1900&&y<=2026).sort((a,b)=>a-b);
$('year').replaceChildren(...years.map(y=>{const o=document.createElement('option');o.value=String(y);o.textContent=y===1996?'1996年・三十年前':`${y}年・資料の時点`;return o;}));$('year').value='1996';
const shared=new URLSearchParams(location.search),sharedItem=data.find(i=>i.id===shared.get('item')),sharedYear=Number(shared.get('year'));
if(sharedItem){state.selected=sharedItem;const valid=C.comparison(sharedItem,sharedYear,0);$('year').value=String(valid?sharedYear:sharedItem.records.find(r=>C.comparison(sharedItem,r.from,0)).from);}
const documented=data.filter(i=>i.status==='documented').length;
text('coverage-summary',`出典付きで比較できる${documented}商品を収録。比較する年代は商品ごとに異なります。すべてが1996年と2026年の比較ではありません。`);
categories();render();products();

$('clear-filters').addEventListener('click',()=>{state.category='すべて';state.limit=24;$('search').value='';$('only-ready').checked=false;categories();products();$('genre-summary').textContent='ジャンル・年代で絞る';$('search').focus({preventScroll:true});});
document.querySelector('.back-to-products').addEventListener('click',()=>{$('search').focus({preventScroll:true});});
$('share').addEventListener('click',async()=>{
 const s=state.snapshot;if(!s)return;
 const url=new URL(location.href);url.search='';url.hash='';url.searchParams.set('item',s.item.id);url.searchParams.set('year',String(s.year));
 try{if(navigator.share){await navigator.share({title:'あの日のねだん。',text:s.item.name+'の価格を比較',url:url.href});return;}}
 catch(error){if(error.name==='AbortError')return;}
 $('share-fallback').hidden=false;$('share-url').value=url.href;$('share-url').focus();$('share-url').select();text('share-status','このリンクから同じ商品と年代を開けます。');
});
if(location.protocol!=='file:'&&'serviceWorker' in navigator){navigator.serviceWorker.register('sw.js').catch(()=>{});}

if(sharedItem)requestAnimationFrame(()=>{$('comparison-heading').focus({preventScroll:true});$('compare').scrollIntoView({block:'start'});});
