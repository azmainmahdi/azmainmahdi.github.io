/* Case-study demos. BeeBooks: the same invoice filled by hand (left) and from one spoken sentence (right).
   On both sides a person presses Send: the AI fills the form, it never sends it. */
(function(){
var root=document.querySelector('[data-bd]');if(!root)return;
var SAY='Create an invoice for Rahim for 2 MacBook Pro at $1,500, with a 5% discount and $5 shipping.';
var FINAL={customer:'Rahim',date:'12 Nov 2026',due:'26 Nov 2026',item:'MacBook Pro',qty:'2',rate:'1,500.00',amount:'3,000.00',discount:'5',shipping:'5.00',total:'$2,855.00'};
var still=matchMedia('(prefers-reduced-motion: reduce)').matches;
var ARROW='<span class="bd-cursor" aria-hidden="true"><svg viewBox="0 0 24 24" width="22" height="22"><path d="M4 2l15 11-6.5 1.2L16 21l-2.6 1.2-3.4-6.8L5 20z" fill="#111" stroke="#fff" stroke-width="1.4" stroke-linejoin="round"/></svg></span>';

function field(f,label,kind,ph){return '<span class="bd-f bd-'+f+'">'+(label?'<span class="bd-l">'+label+'</span>':'')+'<span class="bd-in'+(kind?' bd-'+kind:'')+'" data-f="'+f+'"><span class="bd-v"></span><span class="bd-ph">'+(ph||'')+'</span>'+(kind==='sel'?'<i class="ti ti-chevron-down"></i>':kind==='date'?'<i class="ti ti-calendar"></i>':'')+'</span></span>'}
function form(note){return '<div class="bd-form">'+
  '<div class="bd-row">'+field('customer','Customer','sel','Select customer')+'</div>'+
  '<div class="bd-row bd-2">'+field('date','Invoice date','date','DD/MM/YYYY')+field('due','Due date','date','DD/MM/YYYY')+'</div>'+
  '<div class="bd-items"><div class="bd-ih"><span>Item</span><span>Qty</span><span>Rate</span><span>Amount</span></div>'+
  '<div class="bd-ir">'+field('item','','sel','Select')+field('qty','','','0')+field('rate','','','0.00')+field('amount','','ro','0.00')+'</div></div>'+
  '<div class="bd-row bd-2">'+field('discount','Discount (%)','','0')+field('shipping','Shipping','','0.00')+'</div>'+
  '<div class="bd-tot"><span>Total</span><b data-f="total"><span class="bd-v"></span><span class="bd-ph">$0.00</span></b></div>'+
  '<div class="bd-btns"><span class="bd-note">'+note+'</span><span class="bd-b">Save draft</span><span class="bd-b bd-send">Send</span></div>'+
  '<div class="bd-menu" hidden></div></div>'}
var hand=root.querySelector('[data-mode="hand"]'),voice=root.querySelector('[data-mode="voice"]');
hand.querySelector('.bd-app').insertAdjacentHTML('beforeend',form('')+ARROW);
voice.querySelector('.bd-app').insertAdjacentHTML('beforeend',form('Bee AI filled this. Check it, then send.')+ARROW);
var said=voice.querySelector('.bd-said'),ask=voice.querySelector('.bd-ask');
voice.querySelector('.bd-top').insertAdjacentHTML('beforeend','<span class="bd-ai"><span class="bd-dots"><i></i><i></i><i></i></span><span class="bd-st"></span></span>');
root.insertAdjacentHTML('beforeend','<div class="bd-replay" aria-hidden="true"><i class="ti ti-refresh"></i>Playing again</div>');
var chip=voice.querySelector('.bd-ai'),st=chip.querySelector('.bd-st');
function status(t,done){st.textContent=t;chip.classList.toggle('show',!!t);chip.classList.toggle('done',!!done)}
function el(side,f){return side.querySelector('[data-f="'+f+'"]')}
function set(side,f,v){var e=el(side,f);e.querySelector('.bd-v').textContent=v;e.classList.toggle('on',!!v)}
function reset(side){Object.keys(FINAL).forEach(function(f){set(side,f,'');el(side,f).classList.remove('focus','lit')});
  var s=side.querySelector('.bd-send');s.classList.remove('ready','sent');s.textContent='Send';side.querySelector('.bd-note').classList.remove('show');side.querySelector('.bd-menu').hidden=true}
function fill(side){Object.keys(FINAL).forEach(function(f){set(side,f,FINAL[f])});side.querySelector('.bd-send').classList.add('ready');side.querySelector('.bd-note').classList.add('show')}

if(still){fill(hand);fill(voice);said.textContent=SAY;return}

var visible=false,wakers=[];
new IntersectionObserver(function(es){visible=es[0].isIntersecting;if(visible)wakers.splice(0).forEach(function(w){w()})},{threshold:.3}).observe(root);
function gate(){return visible?Promise.resolve():new Promise(function(r){wakers.push(r)})}
function wait(ms){return gate().then(function(){return new Promise(function(r){setTimeout(r,ms)})})}

function point(side,target,dx,dy){var a=side.querySelector('.bd-app').getBoundingClientRect(),b=target.getBoundingClientRect(),c=side.querySelector('.bd-cursor');
  c.classList.add('show');c.style.transform='translate('+(b.left-a.left+(dx==null?b.width*.3:dx))+'px,'+(b.top-a.top+(dy==null?b.height*.55:dy))+'px)';return wait(620)}
function click(side){var c=side.querySelector('.bd-cursor');c.classList.add('down');return wait(140).then(function(){c.classList.remove('down');return wait(120)})}
function send(side){var s=side.querySelector('.bd-send');return point(side,s).then(function(){return wait(500)}).then(function(){return click(side)}).then(function(){s.classList.remove('ready');s.classList.add('sent');s.textContent='Sent';return wait(400)})}
function type(f,text){var e=el(hand,f),i=0;hand.querySelectorAll('.focus').forEach(function(x){x.classList.remove('focus')});e.classList.add('focus');
  return (function step(){if(i>=text.length)return wait(160);set(hand,f,text.slice(0,++i));return wait(85+Math.random()*60).then(step)})()}
function menu(anchor,opts){var m=hand.querySelector('.bd-menu'),a=hand.querySelector('.bd-form').getBoundingClientRect(),b=anchor.getBoundingClientRect();
  m.innerHTML=opts.map(function(o){return '<span>'+o+'</span>'}).join('');m.style.left=(b.left-a.left)+'px';m.style.top=(b.bottom-a.top+4)+'px';m.style.width=Math.max(b.width,150)+'px';m.hidden=false;return m}
function pick(f,opts,typed){var e=el(hand,f);return point(hand,e).then(function(){return click(hand)}).then(function(){return typed?type(f,typed):null})
  .then(function(){var m=menu(e,opts);return wait(380).then(function(){return point(hand,m.children[0])})}).then(function(){return click(hand)})
  .then(function(){hand.querySelector('.bd-menu').hidden=true;set(hand,f,FINAL[f]);e.classList.remove('focus')})}
function by(f){return point(hand,el(hand,f)).then(function(){return click(hand)}).then(function(){return type(f,FINAL[f])})}

/* by hand: every field is a click, a menu or typing */
function runHand(){reset(hand);
  return pick('customer',['Rahim','Sample Customer','Another Customer'])
  .then(function(){return by('date')}).then(function(){return by('due')})
  .then(function(){return pick('item',['MacBook Pro','MacBook Air'],'MacB')})
  .then(function(){return by('qty')}).then(function(){return by('rate')})
  .then(function(){set(hand,'amount',FINAL.amount);return by('discount')}).then(function(){return by('shipping')})
  .then(function(){hand.querySelectorAll('.focus').forEach(function(x){x.classList.remove('focus')});set(hand,'total',FINAL.total);hand.querySelector('.bd-send').classList.add('ready');return send(hand)})}

/* by voice: speech arrives word by word, Bee AI reads it, then fills one field at a time and stops.
   The owner reads the form and presses Send. */
var mic=ask.querySelector('.bd-mic'),wave=ask.querySelector('.bd-wave');
wave.innerHTML='<i></i><i></i><i></i><i></i><i></i><i></i><i></i>';
ask.insertAdjacentHTML('beforeend','<span class="bd-rec"><i></i><span>0:00</span></span>');
var clock=ask.querySelector('.bd-rec span');
/* the owner taps the mic, speaks (words come in as grey guesses, then settle), taps again to stop.
   Bee AI reads the request and fills the form field by field, then stops for the owner to check and send. */
function runVoice(){reset(voice);status('');said.textContent='';clock.textContent='0:00';var tick,t0;
  return wait(300).then(function(){return point(voice,mic,8,8)}).then(function(){return click(voice)})
  .then(function(){ask.classList.add('listen');t0=Date.now();
    tick=setInterval(function(){clock.textContent='0:0'+Math.floor((Date.now()-t0)/1000);
      [].forEach.call(wave.children,function(b){b.style.height=(4+Math.random()*16)+'px'})},120);
    var w=SAY.split(' '),n=0;
    return wait(900).then(function step(){if(n>=w.length)return wait(700);
      var k=Math.min(w.length,n+2+Math.floor(Math.random()*2));
      said.innerHTML=w.slice(0,n).join(' ')+(n?' ':'')+'<span class="bd-int">'+w.slice(n,k).join(' ')+'</span>';n=k;
      return wait(420+Math.random()*260).then(step)})})
  .then(function(){said.textContent=SAY;return point(voice,mic,8,8)}).then(function(){return click(voice)})
  .then(function(){clearInterval(tick);ask.classList.remove('listen');voice.querySelector('.bd-cursor').classList.remove('show');status('Reading your request');return wait(1200)})
  .then(function(){status('Filling the form');return Object.keys(FINAL).reduce(function(p,f){return p.then(function(){
    set(voice,f,FINAL[f]);var e=el(voice,f);e.classList.add('lit');setTimeout(function(){e.classList.remove('lit')},700);return wait(120)})},Promise.resolve())})
  .then(function(){status('Done. Check it, then send',true);voice.querySelector('.bd-send').classList.add('ready');voice.querySelector('.bd-note').classList.add('show');
    return wait(700).then(function(){return point(voice,el(voice,'customer'))})}).then(function(){return point(voice,el(voice,'qty'))}).then(function(){return point(voice,voice.querySelector('.bd-tot b'))})
  .then(function(){return send(voice)}).then(function(){status('')})}

/* between loops: dim both forms and say it is starting again, so the restart reads as a replay */
function replay(){root.classList.add('replay');root.querySelectorAll('.bd-cursor').forEach(function(c){c.classList.remove('show')});
  return wait(900).then(function(){reset(hand);reset(voice);status('');said.textContent='';return wait(600)}).then(function(){root.classList.remove('replay');return wait(500)})}

(function loop(){Promise.all([runHand(),wait(900).then(runVoice)]).then(function(){return wait(2400)}).then(replay).then(loop)})();
})();
