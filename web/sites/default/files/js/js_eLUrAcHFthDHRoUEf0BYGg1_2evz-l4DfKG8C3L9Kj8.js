/* @license MIT https://raw.githubusercontent.com/muicss/loadjs/4.3.0/LICENSE.txt */
loadjs=function(){var h=function(){},o={},c={},f={};function u(e,n){if(e){var t=f[e];if(c[e]=n,t)for(;t.length;)t[0](e,n),t.splice(0,1)}}function l(e,n){e.call&&(e={success:e}),n.length?(e.error||h)(n):(e.success||h)(e)}function p(t,r,i,s){var o,e,u,n=document,c=i.async,f=(i.numRetries||0)+1,l=i.before||h,a=t.replace(/[\?|#].*$/,""),d=t.replace(/^(css|img|module|nomodule)!/,"");if(s=s||0,/(^css!|\.css$)/.test(a))(u=n.createElement("link")).rel="stylesheet",u.href=d,(o="hideFocus"in u)&&u.relList&&(o=0,u.rel="preload",u.as="style");else if(/(^img!|\.(png|gif|jpg|svg|webp)$)/.test(a))(u=n.createElement("img")).src=d;else if((u=n.createElement("script")).src=d,u.async=void 0===c||c,e="noModule"in u,/^module!/.test(a)){if(!e)return r(t,"l");u.type="module"}else if(/^nomodule!/.test(a)&&e)return r(t,"l");!(u.onload=u.onerror=u.onbeforeload=function(e){var n=e.type[0];if(o)try{u.sheet.cssText.length||(n="e")}catch(e){18!=e.code&&(n="e")}if("e"==n){if((s+=1)<f)return p(t,r,i,s)}else if("preload"==u.rel&&"style"==u.as)return u.rel="stylesheet";r(t,n,e.defaultPrevented)})!==l(t,u)&&n.head.appendChild(u)}function t(e,n,t){var r,i;if(n&&n.trim&&(r=n),i=(r?t:n)||{},r){if(r in o)throw"LoadJS";o[r]=!0}function s(n,t){!function(e,r,n){var t,i,s=(e=e.push?e:[e]).length,o=s,u=[];for(t=function(e,n,t){if("e"==n&&u.push(e),"b"==n){if(!t)return;u.push(e)}--s||r(u)},i=0;i<o;i++)p(e[i],t,n)}(e,function(e){l(i,e),n&&l({success:n,error:t},e),u(r,e)},i)}if(i.returnPromise)return new Promise(s);s()}return t.ready=function(e,n){return function(e,t){e=e.push?e:[e];var n,r,i,s=[],o=e.length,u=o;for(n=function(e,n){n.length&&s.push(e),--u||t(s)};o--;)r=e[o],(i=c[r])?n(r,i):(f[r]=f[r]||[]).push(n)}(e,function(e){l(n,e)}),t},t.done=function(e){u(e,[])},t.reset=function(){o={},c={},f={}},t.isDefined=function(e){return e in o},t}();;
/* @license GPL-2.0-or-later https://www.drupal.org/licensing/faq */
(function(Drupal,htmx,drupalSettings,loadjs){Drupal.htmx={mergeSettings(current,...sources){if(!current)return {};sources.filter((obj)=>Boolean(obj)).forEach((obj)=>{Object.entries(obj).forEach(([key,value])=>{switch(Object.prototype.toString.call(value)){case '[object Object]':current[key]=current[key]||{};current[key]=Drupal.htmx.mergeSettings(current[key],value);break;case '[object Array]':current[key]=Drupal.htmx.mergeSettings(new Array(value.length),value);break;default:current[key]=value;}});});return current;},addAssets(data){const bundleIds=data.filter(({href,src})=>!loadjs.isDefined(href??src)).map(({href,src,type,...attributes})=>{const bundleId=href??src;let prefix='css!';if(src)prefix=type==='module'?'module!':'';loadjs(prefix+bundleId,bundleId,{async:!src,before(path,element){Object.entries(attributes).forEach(([name,value])=>{element.setAttribute(name,value);});}});return bundleId;});let assetsLoaded=Promise.resolve();if(bundleIds.length)assetsLoaded=new Promise((resolve,reject)=>{loadjs.ready(bundleIds,{success:resolve,error(depsNotFound){const message=Drupal.t(`The following files could not be loaded: @dependencies`,{'@dependencies':depsNotFound.join(', ')});reject(message);}});});return assetsLoaded;}};})(Drupal,htmx,drupalSettings,loadjs);;
(function(Drupal,drupalSettings,htmx){const requestAssetsLoaded=new WeakMap();htmx.on('htmx:beforeRequest',({detail})=>{requestAssetsLoaded.set(detail.xhr,Promise.resolve());});htmx.on('htmx:configRequest',({detail})=>{if(Drupal.url.isLocal(detail.path)){if(detail.elt.hasAttribute('data-hx-drupal-only-main-content')){const url=new URL(detail.path,window.location);url.searchParams.set('_wrapper_format','drupal_htmx');detail.path=url.toString();}const pageState=drupalSettings.ajaxPageState;detail.parameters['ajax_page_state[theme]']=pageState.theme;detail.parameters['ajax_page_state[theme_token]']=pageState.theme_token;detail.parameters['ajax_page_state[libraries]']=pageState.libraries;if(detail.headers['HX-Trigger-Name'])detail.parameters._triggering_element_name=detail.headers['HX-Trigger-Name'];}});htmx.on('htmx:beforeHistoryUpdate',({detail})=>{const url=new URL(detail.history.path,window.location);['_wrapper_format','ajax_page_state[theme]','ajax_page_state[theme_token]','ajax_page_state[libraries]','_triggering_element_name','_triggering_element_value'].forEach((key)=>{url.searchParams.delete(key);});detail.history.path=url.toString();});htmx.on('htmx:beforeSwap',({detail})=>{htmx.trigger(detail.elt,'htmx:drupal:unload');if(!detail.xhr)return;let responseHTML=Document.parseHTMLUnsafe(detail.serverResponse);const settingsElement=responseHTML.querySelector(':is(head, body) > script[type="application/json"][data-drupal-selector="drupal-settings-json"]');settingsElement?.remove();if(settingsElement!==null)Drupal.htmx.mergeSettings(drupalSettings,JSON.parse(settingsElement.textContent));const assetsElements=responseHTML.querySelectorAll('link[rel="stylesheet"][href], script[src]');assetsElements.forEach((element)=>element.remove());const data=Array.from(assetsElements).map(({attributes})=>{const attrs={};Object.values(attributes).forEach(({name,value})=>{attrs[name]=value;});return attrs;});detail.serverResponse=responseHTML.documentElement.outerHTML;responseHTML=null;requestAssetsLoaded.get(detail.xhr).then(()=>Drupal.htmx.addAssets(data));});htmx.on('htmx:afterSettle',({detail})=>{(requestAssetsLoaded.get(detail.xhr)||Promise.resolve()).then(()=>{let processTarget=detail.elt.parentElement;if(detail.elt===document.body||processTarget===null)processTarget=detail.elt;htmx.trigger(processTarget,'htmx:drupal:load');requestAssetsLoaded.delete(detail.xhr);});});})(Drupal,drupalSettings,htmx);;
(function(Drupal,htmx,drupalSettings){let attachFromHtmx=false;htmx.on('htmx:drupal:load',({detail})=>{attachFromHtmx=true;Drupal.attachBehaviors(detail.elt,drupalSettings);attachFromHtmx=false;});htmx.on('htmx:drupal:unload',({detail})=>{Drupal.detachBehaviors(detail.elt,drupalSettings,'unload');});Drupal.behaviors.htmx={attach(context){if(!attachFromHtmx&&context!==document)htmx.process(context);}};})(Drupal,htmx,drupalSettings);;
Drupal.debounce=function(func,wait,immediate){let timeout;let result;return function(...args){const context=this;const later=function(){timeout=null;if(!immediate)result=func.apply(context,args);};const callNow=immediate&&!timeout;clearTimeout(timeout);timeout=setTimeout(later,wait);if(callNow)result=func.apply(context,args);return result;};};;
(function(Drupal,debounce){let liveElement;const announcements=[];Drupal.behaviors.drupalAnnounce={attach(context){if(!liveElement){liveElement=document.createElement('div');liveElement.id='drupal-live-announce';liveElement.className='visually-hidden';liveElement.setAttribute('aria-live','polite');liveElement.setAttribute('aria-busy','false');document.body.appendChild(liveElement);}}};function announce(){const text=[];let priority='polite';let announcement;const il=announcements.length;for(let i=0;i<il;i++){announcement=announcements.pop();text.unshift(announcement.text);if(announcement.priority==='assertive')priority='assertive';}if(text.length){liveElement.innerHTML='';liveElement.setAttribute('aria-busy','true');liveElement.setAttribute('aria-live',priority);liveElement.innerHTML=text.join('\n');liveElement.setAttribute('aria-busy','false');}}Drupal.announce=function(text,priority){announcements.push({text,priority});return debounce(announce,200)();};})(Drupal,Drupal.debounce);;
((Drupal)=>{Drupal.Message=class{constructor(messageWrapper=null){if(!messageWrapper)this.messageWrapper=Drupal.Message.defaultWrapper();else this.messageWrapper=messageWrapper;}static defaultWrapper(){let wrapper=document.querySelector('[data-drupal-messages]')||document.querySelector('[data-drupal-messages-fallback]');if(!wrapper){wrapper=document.createElement('div');document.body.appendChild(wrapper);}if(wrapper.hasAttribute('data-drupal-messages-fallback')){wrapper.removeAttribute('data-drupal-messages-fallback');wrapper.classList.remove('hidden');}wrapper.setAttribute('data-drupal-messages','');return wrapper.innerHTML===''?Drupal.Message.messageInternalWrapper(wrapper):wrapper.firstElementChild;}static getMessageTypeLabels(){return {status:Drupal.t('Status message'),error:Drupal.t('Error message'),warning:Drupal.t('Warning message')};}add(message,options={}){if(!options.hasOwnProperty('type'))options.type='status';if(typeof message!=='string')throw new Error('Message must be a string.');Drupal.Message.announce(message,options);options.id=options.id?String(options.id):`${options.type}-${Math.random().toFixed(15).replace('0.','')}`;if(!Drupal.Message.getMessageTypeLabels().hasOwnProperty(options.type)){const {type}=options;throw new Error(`The message type, ${type}, is not present in Drupal.Message.getMessageTypeLabels().`);}this.messageWrapper.appendChild(Drupal.theme('message',{text:message},options));return options.id;}select(id){return this.messageWrapper.querySelector(`[data-drupal-message-id^="${id}"]`);}remove(id){return this.messageWrapper.removeChild(this.select(id));}clear(){this.messageWrapper.querySelectorAll('[data-drupal-message-id]').forEach((message)=>{this.messageWrapper.removeChild(message);});}static announce(message,options){if(!options.priority&&(options.type==='warning'||options.type==='error'))options.priority='assertive';if(options.announce!=='')Drupal.announce(options.announce||message,options.priority);}static messageInternalWrapper(messageWrapper){const innerWrapper=document.createElement('div');innerWrapper.setAttribute('class','messages__wrapper');messageWrapper.insertAdjacentElement('afterbegin',innerWrapper);return innerWrapper;}};Drupal.theme.message=({text},{type,id})=>{const messagesTypes=Drupal.Message.getMessageTypeLabels();const messageWrapper=document.createElement('div');messageWrapper.setAttribute('class',`messages messages--${type}`);messageWrapper.setAttribute('role',type==='error'||type==='warning'?'alert':'status');messageWrapper.setAttribute('data-drupal-message-id',id);messageWrapper.setAttribute('data-drupal-message-type',type);messageWrapper.setAttribute('aria-label',messagesTypes[type]);messageWrapper.innerHTML=`${text}`;return messageWrapper;};})(Drupal);;
((Drupal)=>{Drupal.theme.message=({text},{type,id})=>{const messagesTypes=Drupal.Message.getMessageTypeLabels();const messageWrapper=document.createElement('div');messageWrapper.setAttribute('class',`messages messages--${type} messages-list__item`);messageWrapper.setAttribute('role',type==='error'||type==='warning'?'alert':'status');messageWrapper.setAttribute('aria-labelledby',`${id}-title`);messageWrapper.setAttribute('data-drupal-message-id',id);messageWrapper.setAttribute('data-drupal-message-type',type);messageWrapper.innerHTML=`
    <div class="messages__header">
      <h2 id="${id}-title" class="messages__title">
        ${messagesTypes[type]}
      </h2>
    </div>
    <div class="messages__content">
      ${text}
    </div>
  `;return messageWrapper;};})(Drupal);;
((Drupal,once)=>{Drupal.theme.message=(_ref,_ref2)=>{let {text}=_ref,{type,id}=_ref2;const messagesTypes=Drupal.Message.getMessageTypeLabels(),messageWrapper=document.createElement("div");return messageWrapper.setAttribute("class",`messages-list__item messages messages--${type}`),messageWrapper.setAttribute("role","error"===type||"warning"===type?"alert":"status"),messageWrapper.setAttribute("data-drupal-message-id",id),messageWrapper.setAttribute("data-drupal-message-type",type),messageWrapper.setAttribute("aria-label",messagesTypes[type]),messageWrapper.innerHTML=`\n    <div class="messages__header">\n      <h2 id="${id}-title" class="messages__title">\n        ${messagesTypes[type]}\n      </h2>\n    </div>\n    <div class="messages__content">\n      ${text}\n    </div>\n    <button type="button" class="button button--dismiss js-message-button-hide" title="${Drupal.t("Hide")}">\n      <span class="icon-close"></span>\n      ${Drupal.t("Hide")}\n    </button>\n  `,Drupal.ginMessages.dismissMessages(messageWrapper),messageWrapper;},Drupal.behaviors.ginMessages={attach:(context)=>{Drupal.ginMessages.dismissMessages(context);}},Drupal.ginMessages={dismissMessages:function(){let context=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document;once("gin-messages-dismiss",".js-message-button-hide",context).forEach(((dismissButton)=>{dismissButton.addEventListener("click",((e)=>{e.preventDefault();const message=dismissButton.parentNode;message.classList.contains("messages-list__item")&&(message.style.opacity=0,message.classList.add("visually-hidden"));}));}));}};})(Drupal,once);;
((Drupal,drupalSettings,htmx)=>{Drupal.bigPipe={};Drupal.bigPipe.commandExecutionQueue=function(response,status){const ajaxCommands=Drupal.bigPipe.commands;return Object.keys(response||{}).reduce((executionQueue,key)=>executionQueue.then(()=>{const {command}=response[key];if(command&&ajaxCommands[command])return ajaxCommands[command](response[key],status);}),Promise.resolve());};Drupal.bigPipe.commands={insert({data,method,selector}){const targets=htmx.findAll(selector);if(!targets||!targets.length)return;const styleMap={replaceWith:'outerHTML',html:'innerHTML',before:'beforebegin',prepend:'afterbegin',append:'beforeend',after:'afterend'};targets.forEach((target)=>{htmx.trigger(target,'htmx:drupal:unload');htmx.swap(target,data,{swapStyle:styleMap[method]||'outerHTML'});});},redirect({url}){window.location=url;},settings({merge,settings}){if(merge)Drupal.htmx.mergeSettings(drupalSettings,settings);},add_css({data}){return Drupal.htmx.addAssets(data);},message({message,messageOptions,messageWrapperQuerySelector,clearPrevious}){const messages=new Drupal.Message(document.querySelector(messageWrapperQuerySelector));if(clearPrevious)messages.clear();messages.add(message,messageOptions);},add_js({data}){return Drupal.htmx.addAssets(data).then(()=>{htmx.trigger(document.body,'htmx:drupal:load');});}};})(Drupal,drupalSettings,htmx);;
((Drupal,drupalSettings)=>{const replacementsSelector=`script[data-big-pipe-replacement-for-placeholder-with-id]`;function mapTextContentToAjaxResponse(content){if(content==='')return false;try{return JSON.parse(content);}catch(e){return false;}}function processReplacement(replacement){const id=replacement.dataset.bigPipeReplacementForPlaceholderWithId;const content=replacement.textContent.trim();if(typeof drupalSettings.bigPipePlaceholderIds[id]==='undefined')return;const response=mapTextContentToAjaxResponse(content);if(response===false)return;delete drupalSettings.bigPipePlaceholderIds[id];Drupal.bigPipe.commandExecutionQueue(response,'success');}function checkMutation(node){return Boolean(node.nodeType===Node.ELEMENT_NODE&&node.nodeName==='SCRIPT'&&node.dataset?.bigPipeReplacementForPlaceholderWithId&&typeof drupalSettings.bigPipePlaceholderIds[node.dataset.bigPipeReplacementForPlaceholderWithId]!=='undefined');}function checkMutationAndProcess(node){if(checkMutation(node))processReplacement(node);else{if(node.parentNode!==null&&checkMutation(node.parentNode))processReplacement(node.parentNode);}}function processMutations(mutations){mutations.forEach(({addedNodes,type,target})=>{addedNodes.forEach(checkMutationAndProcess);if(type==='characterData'&&checkMutation(target.parentNode)&&drupalSettings.bigPipePlaceholderIds[target.parentNode.dataset.bigPipeReplacementForPlaceholderWithId]===true)processReplacement(target.parentNode);});}const observer=new MutationObserver(processMutations);Drupal.attachBehaviors(document);document.querySelectorAll(replacementsSelector).forEach(processReplacement);observer.observe(document.body,{childList:true,subtree:true,characterData:true});window.addEventListener('DOMContentLoaded',()=>{const mutations=observer.takeRecords();observer.disconnect();if(mutations.length)processMutations(mutations);});})(Drupal,drupalSettings);;
(function(Drupal,drupalSettings){Drupal.behaviors.activeLinks={attach(context){const path=drupalSettings.path;const queryString=JSON.stringify(path.currentQuery);const querySelector=queryString?`[data-drupal-link-query="${CSS.escape(queryString)}"]`:':not([data-drupal-link-query])';const originalSelectors=[`[data-drupal-link-system-path="${CSS.escape(path.currentPath)}"]`];let selectors;if(path.isFront)originalSelectors.push('[data-drupal-link-system-path="<front>"]');selectors=[].concat(originalSelectors.map((selector)=>`${selector}:not([data-drupal-language]):not([hreflang])`),originalSelectors.map((selector)=>`li${selector}[data-drupal-language="${path.currentLanguage}"]`),originalSelectors.map((selector)=>`a${selector}[hreflang="${path.currentLanguage}"]`));selectors=selectors.map((current)=>current+querySelector);context.querySelectorAll(selectors.join(',')).forEach((activeLink)=>{activeLink.classList.add('is-active');activeLink.setAttribute('aria-current','page');});},detach(context,settings,trigger){if(trigger==='unload')context.querySelectorAll('[data-drupal-link-system-path].is-active').forEach((activeLink)=>{activeLink.classList.remove('is-active');activeLink.removeAttribute('aria-current');});}};})(Drupal,drupalSettings);;
(function($,Drupal){Drupal.theme.progressBar=function(id){const escapedId=Drupal.checkPlain(id);return (`<div id="${escapedId}" class="progress" aria-live="polite">`+'<div class="progress__label">&nbsp;</div>'+'<div class="progress__track"><div class="progress__bar"></div></div>'+'<div class="progress__percentage"></div>'+'<div class="progress__description">&nbsp;</div>'+'</div>');};Drupal.ProgressBar=function(id,updateCallback,method,errorCallback){this.id=id;this.method=method||'GET';this.updateCallback=updateCallback;this.errorCallback=errorCallback;this.element=$(Drupal.theme('progressBar',id));};$.extend(Drupal.ProgressBar.prototype,{setProgress(percentage,message,label){if(percentage>=0&&percentage<=100){$(this.element).find('div.progress__bar').each(function(){this.style.width=`${percentage}%`;});$(this.element).find('div.progress__percentage').html(`${percentage}%`);}$('div.progress__description',this.element).html(message);$('div.progress__label',this.element).html(label);if(this.updateCallback)this.updateCallback(percentage,message,this);},startMonitoring(uri,delay){this.delay=delay;this.uri=uri;this.sendPing();},stopMonitoring(){clearTimeout(this.timer);this.uri=null;},sendPing(){if(this.timer)clearTimeout(this.timer);if(this.uri){const pb=this;let uri=this.uri;if(!uri.includes('?'))uri+='?';else uri+='&';uri+='_format=json';$.ajax({type:this.method,url:uri,data:'',dataType:'json',success(progress){if(progress.status===0){pb.displayError(progress.data);return;}pb.setProgress(progress.percentage,progress.message,progress.label);pb.timer=setTimeout(()=>{pb.sendPing();},pb.delay);},error(xmlhttp){const e=new Drupal.AjaxError(xmlhttp,pb.uri);pb.displayError(`<pre>${e.message}</pre>`);}});}},displayError(string){const error=$('<div class="messages messages--error"></div>').html(string);$(this.element).before(error).hide();if(this.errorCallback)this.errorCallback(this);}});})(jQuery,Drupal);;
(function($,window,Drupal,drupalSettings,loadjs,{isFocusable,tabbable}){Drupal.behaviors.AJAX={attach(context,settings){function loadAjaxBehavior(base){const elementSettings=settings.ajax[base];if(typeof elementSettings.selector==='undefined')elementSettings.selector=`#${base}`;once('drupal-ajax',$(elementSettings.selector)).forEach((el)=>{elementSettings.element=el;elementSettings.base=base;Drupal.ajax(elementSettings);});}Object.keys(settings.ajax||{}).forEach(loadAjaxBehavior);Drupal.ajax.bindAjaxLinks(document.body);once('ajax','.use-ajax-submit').forEach((el)=>{const elementSettings={url:$(el.form).attr('action'),setClick:true,event:'click',progress:{type:'throbber'},base:el.id,element:el};Drupal.ajax(elementSettings);});},detach(context,settings,trigger){if(trigger==='unload')Drupal.ajax.expired().forEach((instance)=>{Drupal.ajax.instances[instance.instanceIndex]=null;});}};Drupal.AjaxError=function(xmlhttp,uri,customMessage){let statusCode;let statusText;let responseText;if(xmlhttp.status)statusCode=`\n${Drupal.t('An AJAX HTTP error occurred.')}\n${Drupal.t('HTTP Result Code: !status',{'!status':xmlhttp.status})}`;else statusCode=`\n${Drupal.t('An AJAX HTTP request terminated abnormally.')}`;statusCode+=`\n${Drupal.t('Debugging information follows.')}`;const pathText=`\n${Drupal.t('Path: !uri',{'!uri':uri})}`;statusText='';try{statusText=`\n${Drupal.t('StatusText: !statusText',{'!statusText':xmlhttp.statusText.trim()})}`;}catch(e){}responseText='';try{responseText=`\n${Drupal.t('ResponseText: !responseText',{'!responseText':xmlhttp.responseText.trim()})}`;}catch(e){}responseText=responseText.replace(/<("[^"]*"|'[^']*'|[^'">])*>/gi,'');responseText=responseText.replace(/[\n]+\s+/g,'\n');const readyStateText=xmlhttp.status===0?`\n${Drupal.t('ReadyState: !readyState',{'!readyState':xmlhttp.readyState})}`:'';customMessage=customMessage?`\n${Drupal.t('CustomMessage: !customMessage',{'!customMessage':customMessage})}`:'';this.message=statusCode+pathText+statusText+customMessage+responseText+readyStateText;this.name='AjaxError';if(!Drupal.AjaxError.messages)Drupal.AjaxError.messages=new Drupal.Message();Drupal.AjaxError.messages.add(Drupal.t("Oops, something went wrong. Check your browser's developer console for more details."),{type:'error'});};Drupal.AjaxError.prototype=new Error();Drupal.AjaxError.prototype.constructor=Drupal.AjaxError;Drupal.ajax=function(settings){if(arguments.length!==1)throw new Error('Drupal.ajax() function must be called with one configuration object only');const base=settings.base||false;const element=settings.element||false;delete settings.base;delete settings.element;if(!settings.progress&&!element)settings.progress=false;const ajax=new Drupal.Ajax(base,element,settings);ajax.instanceIndex=Drupal.ajax.instances.length;Drupal.ajax.instances.push(ajax);return ajax;};Drupal.ajax.instances=[];Drupal.ajax.expired=function(){return Drupal.ajax.instances.filter((instance)=>instance&&instance.element!==false&&!document.body.contains(instance.element));};Drupal.ajax.bindAjaxLinks=(element)=>{once('ajax','.use-ajax',element).forEach((ajaxLink)=>{const $linkElement=$(ajaxLink);const elementSettings={progress:{type:'throbber'},dialogType:$linkElement.data('dialog-type'),dialog:$linkElement.data('dialog-options'),dialogRenderer:$linkElement.data('dialog-renderer'),base:$linkElement.attr('id'),element:ajaxLink};const href=$linkElement.attr('href');if(href){elementSettings.url=href;elementSettings.event='click';}const httpMethod=$linkElement.data('ajax-http-method');if(httpMethod)elementSettings.httpMethod=httpMethod;Drupal.ajax(elementSettings);});};Drupal.Ajax=function(base,element,elementSettings){const defaults={httpMethod:'POST',event:element?'mousedown':null,keypress:true,selector:base?`#${base}`:null,effect:'none',speed:'none',method:'replaceWith',progress:{type:'throbber',message:Drupal.t('Processing...')},submit:{js:true}};$.extend(this,defaults,elementSettings);this.commands=new Drupal.AjaxCommands();this.instanceIndex=false;if(this.wrapper)this.wrapper=`#${this.wrapper}`;this.element=element;this.preCommandsFocusedElementSelector=null;this.elementSettings=elementSettings;if(this.element?.form)this.$form=$(this.element.form);if(!this.url){const $element=$(this.element);if(this.element.tagName==='A')this.url=$element.attr('href');else{if(this.element&&element.form)this.url=this.$form.attr('action');}}const originalUrl=this.url;this.url=this.url.replace(/\/nojs(\/|$|\?|#)/,'/ajax$1');if(drupalSettings.ajaxTrustedUrl.hasOwnProperty(originalUrl))drupalSettings.ajaxTrustedUrl[this.url]=true;const ajax=this;ajax.options={url:ajax.url,data:ajax.submit,isInProgress(){return ajax.ajaxing;},beforeSerialize(elementSettings,options){return ajax.beforeSerialize(elementSettings,options);},beforeSubmit(formValues,elementSettings,options){ajax.ajaxing=true;ajax.preCommandsFocusedElementSelector=null;return ajax.beforeSubmit(formValues,elementSettings,options);},beforeSend(xmlhttprequest,options){ajax.ajaxing=true;return ajax.beforeSend(xmlhttprequest,options);},success(response,status,xmlhttprequest){ajax.preCommandsFocusedElementSelector=document.activeElement.getAttribute('data-drupal-selector');if(typeof response==='string')response=JSON.parse(response);if(response!==null&&!drupalSettings.ajaxTrustedUrl.hasOwnProperty(ajax.url))if(xmlhttprequest.getResponseHeader('X-Drupal-Ajax-Token')!=='1'){const customMessage=Drupal.t('The response failed verification so will not be processed.');return ajax.error(xmlhttprequest,ajax.url,customMessage);}return (Promise.resolve(ajax.success(response,status)).then(()=>{ajax.ajaxing=false;$(document).trigger('ajaxSuccess',[xmlhttprequest,this]);$(document).trigger('ajaxComplete',[xmlhttprequest,this]);if(--$.active===0)$(document).trigger('ajaxStop');}));},error(xmlhttprequest,status,error){ajax.ajaxing=false;},complete(xmlhttprequest,status){if(status==='error'||status==='parsererror')return ajax.error(xmlhttprequest,ajax.url);},dataType:'json',jsonp:false,method:ajax.httpMethod};if(elementSettings.dialog)ajax.options.data.dialogOptions=elementSettings.dialog;if(!ajax.options.url.includes('?'))ajax.options.url+='?';else ajax.options.url+='&';let wrapper=`drupal_${elementSettings.dialogType||'ajax'}`;if(elementSettings.dialogRenderer)wrapper+=`.${elementSettings.dialogRenderer}`;ajax.options.url+=`${Drupal.ajax.WRAPPER_FORMAT}=${wrapper}`;$(ajax.element).on(elementSettings.event,function(event){if(!drupalSettings.ajaxTrustedUrl.hasOwnProperty(ajax.url)&&!Drupal.url.isLocal(ajax.url))throw new Error(Drupal.t('The callback URL is not local and not trusted: !url',{'!url':ajax.url}));return ajax.eventResponse(this,event);});if(elementSettings.keypress)$(ajax.element).on('keypress',function(event){return ajax.keypressResponse(this,event);});if(elementSettings.prevent)$(ajax.element).on(elementSettings.prevent,false);};Drupal.ajax.WRAPPER_FORMAT='_wrapper_format';Drupal.Ajax.AJAX_REQUEST_PARAMETER='_drupal_ajax';Drupal.Ajax.prototype.execute=function(){if(this.ajaxing)return;try{this.beforeSerialize(this.element,this.options);return $.ajax(this.options);}catch(e){this.ajaxing=false;window.alert(`An error occurred while attempting to process ${this.options.url}: ${e.message}`);return $.Deferred().reject();}};Drupal.Ajax.prototype.keypressResponse=function(element,event){const ajax=this;if(event.which===13||(event.which===32&&element.type!=='text'&&element.type!=='textarea'&&element.type!=='tel'&&element.type!=='number')){event.preventDefault();event.stopPropagation();$(element).trigger(ajax.elementSettings.event);}};Drupal.Ajax.prototype.eventResponse=function(element,event){event.preventDefault();event.stopPropagation();const ajax=this;if(ajax.ajaxing)return;try{if(ajax.$form){if(ajax.setClick)element.form.clk=element;ajax.$form.ajaxSubmit(ajax.options);}else{ajax.beforeSerialize(ajax.element,ajax.options);$.ajax(ajax.options);}}catch(e){ajax.ajaxing=false;window.alert(`An error occurred while attempting to process ${ajax.options.url}: ${e.message}`);}};Drupal.Ajax.prototype.beforeSerialize=function(element,options){if(this.$form&&document.body.contains(this.$form.get(0))){const settings=this.settings||drupalSettings;Drupal.detachBehaviors(this.$form.get(0),settings,'serialize');}options.data[Drupal.Ajax.AJAX_REQUEST_PARAMETER]=1;const pageState=drupalSettings.ajaxPageState;options.data['ajax_page_state[theme]']=pageState.theme;options.data['ajax_page_state[theme_token]']=pageState.theme_token;options.data['ajax_page_state[libraries]']=pageState.libraries;};Drupal.Ajax.prototype.beforeSubmit=function(formValues,element,options){};Drupal.Ajax.prototype.beforeSend=function(xmlhttprequest,options){if(this.$form){options.extraData=options.extraData||{};options.extraData.ajax_iframe_upload='1';const v=$.fieldValue(this.element);if(v!==null)options.extraData[this.element.name]=v;}$(this.element).prop('disabled',true);if(!this.progress||!this.progress.type)return;const progressIndicatorMethod=`setProgressIndicator${this.progress.type.slice(0,1).toUpperCase()}${this.progress.type.slice(1).toLowerCase()}`;if(progressIndicatorMethod in this&&typeof this[progressIndicatorMethod]==='function')this[progressIndicatorMethod].call(this);};Drupal.theme.ajaxProgressThrobber=(message)=>{const messageMarkup=typeof message==='string'?Drupal.theme('ajaxProgressMessage',message):'';const throbber='<div class="throbber">&nbsp;</div>';return `<div class="ajax-progress ajax-progress-throbber">${throbber}${messageMarkup}</div>`;};Drupal.theme.ajaxProgressIndicatorFullscreen=()=>'<div class="ajax-progress ajax-progress-fullscreen">&nbsp;</div>';Drupal.theme.ajaxProgressMessage=(message)=>`<div class="message">${message}</div>`;Drupal.theme.ajaxProgressBar=($element)=>$('<div class="ajax-progress ajax-progress-bar"></div>').append($element);Drupal.Ajax.prototype.setProgressIndicatorBar=function(){const progressBar=new Drupal.ProgressBar(`ajax-progress-${this.element.id}`,$.noop,this.progress.method,$.noop);if(this.progress.message)progressBar.setProgress(-1,this.progress.message);if(this.progress.url)progressBar.startMonitoring(this.progress.url,this.progress.interval||1500);this.progress.element=$(Drupal.theme('ajaxProgressBar',progressBar.element));this.progress.object=progressBar;$(this.element).after(this.progress.element);};Drupal.Ajax.prototype.setProgressIndicatorThrobber=function(){this.progress.element=$(Drupal.theme('ajaxProgressThrobber',this.progress.message));if($(this.element).closest('[data-drupal-ajax-container]').length)$(this.element).closest('[data-drupal-ajax-container]').after(this.progress.element);else $(this.element).after(this.progress.element);};Drupal.Ajax.prototype.setProgressIndicatorFullscreen=function(){this.progress.element=$(Drupal.theme('ajaxProgressIndicatorFullscreen'));$('body').append(this.progress.element);};Drupal.Ajax.prototype.commandExecutionQueue=function(response,status){const ajaxCommands=this.commands;return Object.keys(response||{}).reduce((executionQueue,key)=>executionQueue.then(()=>{const {command}=response[key];if(command&&ajaxCommands[command])return ajaxCommands[command](this,response[key],status);}),Promise.resolve());};Drupal.Ajax.prototype.success=function(response,status){if(this.progress.element)$(this.progress.element).remove();if(this.progress.object)this.progress.object.stopMonitoring();$(this.element).prop('disabled',false);const elementParents=$(this.element).parents('[data-drupal-selector]').addBack().toArray();const focusChanged=Object.keys(response||{}).some((key)=>{const {command,method}=response[key];return (command==='focusFirst'||command==='openDialog'||(command==='invoke'&&method==='focus'));});return (this.commandExecutionQueue(response,status).then(()=>{if(!focusChanged){let target=false;if(this.element){if($(this.element).data('refocus-blur')&&this.preCommandsFocusedElementSelector)target=document.querySelector(`[data-drupal-selector="${this.preCommandsFocusedElementSelector}"]`);if(!target&&!$(this.element).data('disable-refocus')){for(let n=elementParents.length-1;!target&&n>=0;n--)target=document.querySelector(`[data-drupal-selector="${elementParents[n].getAttribute('data-drupal-selector')}"]`);}}if(target)$(target).trigger('focus');}if(this.$form&&document.body.contains(this.$form.get(0))){const settings=this.settings||drupalSettings;Drupal.attachBehaviors(this.$form.get(0),settings);}this.settings=null;}).catch((error)=>console.error(Drupal.t('An error occurred during the execution of the Ajax response: !error',{'!error':error}))));};Drupal.Ajax.prototype.getEffect=function(response){const type=response.effect||this.effect;const speed=response.speed||this.speed;const effect={};if(type==='none'){effect.showEffect='show';effect.hideEffect='hide';effect.showSpeed='';}else if(type==='fade'){effect.showEffect='fadeIn';effect.hideEffect='fadeOut';effect.showSpeed=speed;}else{effect.showEffect=`${type}Toggle`;effect.hideEffect=`${type}Toggle`;effect.showSpeed=speed;}return effect;};Drupal.Ajax.prototype.error=function(xmlhttprequest,uri,customMessage){if(this.progress.element)$(this.progress.element).remove();if(this.progress.object)this.progress.object.stopMonitoring();$(this.wrapper).show();$(this.element).prop('disabled',false);if(this.$form&&document.body.contains(this.$form.get(0))){const settings=this.settings||drupalSettings;Drupal.attachBehaviors(this.$form.get(0),settings);}throw new Drupal.AjaxError(xmlhttprequest,uri,customMessage);};Drupal.theme.ajaxWrapperNewContent=($newContent,ajax,response)=>(response.effect||ajax.effect)!=='none'&&$newContent.filter((i)=>!(($newContent[i].nodeName==='#comment'||($newContent[i].nodeName==='#text'&&/^(\s|\n|\r)*$/.test($newContent[i].textContent))))).length>1?Drupal.theme('ajaxWrapperMultipleRootElements',$newContent):$newContent;Drupal.theme.ajaxWrapperMultipleRootElements=($elements)=>$('<div></div>').append($elements);Drupal.AjaxCommands=function(){};Drupal.AjaxCommands.prototype={insert(ajax,response){const $wrapper=response.selector?$(response.selector):$(ajax.wrapper);const method=response.method||ajax.method;const effect=ajax.getEffect(response);const settings=response.settings||ajax.settings||drupalSettings;const parseHTML=(htmlString)=>{const fragment=document.createDocumentFragment();const template=fragment.appendChild(document.createElement('template'));template.innerHTML=htmlString;return template.content.childNodes;};let $newContent=$(parseHTML(response.data));$newContent=Drupal.theme('ajaxWrapperNewContent',$newContent,ajax,response);switch(method){case 'html':case 'replaceWith':case 'replaceAll':case 'empty':case 'remove':Drupal.detachBehaviors($wrapper.get(0),settings);break;default:break;}$wrapper[method]($newContent);if(effect.showEffect!=='show')$newContent.hide();const $ajaxNewContent=$newContent.find('.ajax-new-content');if($ajaxNewContent.length){$ajaxNewContent.hide();$newContent.show();$ajaxNewContent[effect.showEffect](effect.showSpeed);}else{if(effect.showEffect!=='show')$newContent[effect.showEffect](effect.showSpeed);}$newContent.each((index,element)=>{if(element.nodeType===Node.ELEMENT_NODE&&document.documentElement.contains(element))Drupal.attachBehaviors(element,settings);});},remove(ajax,response,status){const settings=response.settings||ajax.settings||drupalSettings;$(response.selector).each(function(){Drupal.detachBehaviors(this,settings);}).remove();},changed(ajax,response,status){const $element=$(response.selector);if(!$element.hasClass('ajax-changed')){$element.addClass('ajax-changed');if(response.asterisk)$element.find(response.asterisk).append(` <abbr class="ajax-changed" title="${Drupal.t('Changed')}">*</abbr> `);}},alert(ajax,response,status){window.alert(response.text);},announce(ajax,response){if(response.priority)Drupal.announce(response.text,response.priority);else Drupal.announce(response.text);},redirect(ajax,response,status){window.location=response.url;},css(ajax,response,status){$(response.selector).css(response.argument);},settings(ajax,response,status){const ajaxSettings=drupalSettings.ajax;if(ajaxSettings)Drupal.ajax.expired().forEach((instance)=>{if(instance.selector){const selector=instance.selector.replace('#','');if(selector in ajaxSettings)delete ajaxSettings[selector];}});if(response.merge)$.extend(true,drupalSettings,response.settings);else ajax.settings=response.settings;},data(ajax,response,status){$(response.selector).data(response.name,response.value);},focusFirst(ajax,response,status){let focusChanged=false;const container=document.querySelector(response.selector);if(container){const tabbableElements=tabbable(container);if(tabbableElements.length){tabbableElements[0].focus();focusChanged=true;}else{if(isFocusable(container)){container.focus();focusChanged=true;}}}if(ajax.hasOwnProperty('element')&&!focusChanged)ajax.element.focus();},invoke(ajax,response,status){const $element=$(response.selector);$element[response.method](...response.args);},restripe(ajax,response,status){$(response.selector).find('> tbody > tr:visible, > tr:visible').removeClass('odd even').filter(':even').addClass('odd').end().filter(':odd').addClass('even');},update_build_id(ajax,response,status){document.querySelectorAll(`input[name="form_build_id"][value="${response.old}"]`).forEach((item)=>{item.value=response.new;});},add_css(ajax,response,status){const allUniqueBundleIds=response.data.map(function(style){const uniqueBundleId=style.href;if(!loadjs.isDefined(uniqueBundleId))loadjs(`css!${style.href}`,uniqueBundleId,{before(path,styleEl){Object.keys(style).forEach((attributeKey)=>{styleEl.setAttribute(attributeKey,style[attributeKey]);});}});return uniqueBundleId;});return new Promise((resolve,reject)=>{loadjs.ready(allUniqueBundleIds,{success(){resolve();},error(depsNotFound){const message=Drupal.t(`The following files could not be loaded: @dependencies`,{'@dependencies':depsNotFound.join(', ')});reject(message);}});});},message(ajax,response){const messages=new Drupal.Message(document.querySelector(response.messageWrapperQuerySelector));if(response.clearPrevious)messages.clear();messages.add(response.message,response.messageOptions);},add_js(ajax,response,status){const parentEl=document.querySelector(response.selector||'body');const settings=ajax.settings||drupalSettings;const allUniqueBundleIds=response.data.map((script)=>{const uniqueBundleId=script.src;if(!loadjs.isDefined(uniqueBundleId))loadjs(script.src,uniqueBundleId,{async:false,before(path,scriptEl){Object.keys(script).forEach((attributeKey)=>{scriptEl.setAttribute(attributeKey,script[attributeKey]);});parentEl.appendChild(scriptEl);return false;}});return uniqueBundleId;});return new Promise((resolve,reject)=>{loadjs.ready(allUniqueBundleIds,{success(){Drupal.attachBehaviors(parentEl,settings);resolve();},error(depsNotFound){const message=Drupal.t(`The following files could not be loaded: @dependencies`,{'@dependencies':depsNotFound.join(', ')});reject(message);}});});},scrollTop(ajax,response){document.querySelector(response.selector)?.scrollIntoView();}};const stopEvent=(xhr,settings)=>{return (xhr.getResponseHeader('X-Drupal-Ajax-Token')==='1'&&typeof settings.isInProgress==='function'&&settings.isInProgress());};$.extend(true,$.event.special,{ajaxSuccess:{trigger(event,xhr,settings){if(stopEvent(xhr,settings))return false;}},ajaxComplete:{trigger(event,xhr,settings){if(stopEvent(xhr,settings)){$.active++;return false;}}}});})(jQuery,window,Drupal,drupalSettings,loadjs,window.tabbable);;
((Drupal)=>{Drupal.theme.ajaxProgressIndicatorFullscreen=()=>'<div class="ajax-progress ajax-progress--fullscreen"><div class="ajax-progress__throbber ajax-progress__throbber--fullscreen">&nbsp;</div></div>';Drupal.theme.ajaxProgressThrobber=(message)=>{const messageMarkup=typeof message==='string'?Drupal.theme('ajaxProgressMessage',message):'';const throbber='<div class="ajax-progress__throbber">&nbsp;</div>';return `<div class="ajax-progress ajax-progress--throbber">${throbber}${messageMarkup}</div>`;};Drupal.theme.ajaxProgressMessage=(message)=>`<div class="ajax-progress__message">${message}</div>`;})(Drupal);;
(function($,Drupal,debounce){const cache={right:0,left:0,bottom:0,top:0};const cssVarPrefix='--drupal-displace-offset';const documentStyle=document.documentElement.style;const offsetKeys=Object.keys(cache);const offsetProps={};offsetKeys.forEach((edge)=>{offsetProps[edge]={enumerable:true,get(){return cache[edge];},set(value){if(value!==cache[edge])documentStyle.setProperty(`${cssVarPrefix}-${edge}`,`${value}px`);cache[edge]=value;}};});const offsets=Object.seal(Object.defineProperties({},offsetProps));function getRawOffset(el,edge){const $el=$(el);const documentElement=document.documentElement;let displacement=0;const horizontal=edge==='left'||edge==='right';let placement=$el.offset()[horizontal?'left':'top'];placement-=window[`scroll${horizontal?'X':'Y'}`]||document.documentElement[`scroll${horizontal?'Left':'Top'}`]||0;switch(edge){case 'top':displacement=placement+$el.outerHeight();break;case 'left':displacement=placement+$el.outerWidth();break;case 'bottom':displacement=documentElement.clientHeight-placement;break;case 'right':displacement=documentElement.clientWidth-placement;break;default:displacement=0;}return displacement;}function calculateOffset(edge){let edgeOffset=0;document.querySelectorAll(`[data-offset-${edge}]`).forEach((el)=>{if(el.style.display==='none')return;let displacement=parseInt(el.getAttribute(`data-offset-${edge}`),10);if(isNaN(displacement))displacement=getRawOffset(el,edge);edgeOffset=Math.max(edgeOffset,displacement);});return edgeOffset;}function displace(broadcast=true){const newOffsets={};offsetKeys.forEach((edge)=>{newOffsets[edge]=calculateOffset(edge);});offsetKeys.forEach((edge)=>{offsets[edge]=newOffsets[edge];});if(broadcast)$(document).trigger('drupalViewportOffsetChange',offsets);return offsets;}Drupal.behaviors.drupalDisplace={attach(){if(this.displaceProcessed)return;this.displaceProcessed=true;$(window).on('resize.drupalDisplace',debounce(displace,200));}};Drupal.displace=displace;Object.defineProperty(Drupal.displace,'offsets',{value:offsets,writable:false});Drupal.displace.calculateOffset=calculateOffset;})(jQuery,Drupal,Drupal.debounce);;
(($)=>{let cachedScrollbarWidth=null;const {max,abs}=Math;const regexHorizontal=/left|center|right/;const regexVertical=/top|center|bottom/;const regexOffset=/[+-]\d+(\.[\d]+)?%?/;const regexPosition=/^\w+/;const _position=$.fn.position;function getOffsets(offsets,width,height){return [parseFloat(offsets[0])*(typeof offsets[0]==='string'&&offsets[0].endsWith('%')?width/100:1),parseFloat(offsets[1])*(typeof offsets[1]==='string'&&offsets[1].endsWith('%')?height/100:1)];}function parseCss(element,property){return parseInt(window.getComputedStyle(element)[property],10)||0;}function getDimensions(elem){const raw=elem[0];if(raw.nodeType===Node.DOCUMENT_NODE)return {width:elem.width(),height:elem.height(),offset:{top:0,left:0}};if(!!raw&&raw===raw.window)return {width:elem.width(),height:elem.height(),offset:{top:elem.scrollTop(),left:elem.scrollLeft()}};if(raw.preventDefault)return {width:0,height:0,offset:{top:raw.pageY,left:raw.pageX}};return {width:elem.outerWidth(),height:elem.outerHeight(),offset:elem.offset()};}const collisions={fit:{left(position,data){const {within}=data;const withinOffset=within.isWindow?within.scrollLeft:within.offset.left;const outerWidth=within.width;const collisionPosLeft=position.left-data.collisionPosition.marginLeft;const overLeft=withinOffset-collisionPosLeft;const overRight=collisionPosLeft+data.collisionWidth-outerWidth-withinOffset;let newOverRight;if(data.collisionWidth>outerWidth)if(overLeft>0&&overRight<=0){newOverRight=position.left+overLeft+data.collisionWidth-outerWidth-withinOffset;position.left+=overLeft-newOverRight;}else if(overRight>0&&overLeft<=0)position.left=withinOffset;else if(overLeft>overRight)position.left=withinOffset+outerWidth-data.collisionWidth;else position.left=withinOffset;else if(overLeft>0)position.left+=overLeft;else if(overRight>0)position.left-=overRight;else position.left=max(position.left-collisionPosLeft,position.left);},top(position,data){const {within}=data;const withinOffset=within.isWindow?within.scrollTop:within.offset.top;const outerHeight=data.within.height;const collisionPosTop=position.top-data.collisionPosition.marginTop;const overTop=withinOffset-collisionPosTop;const overBottom=collisionPosTop+data.collisionHeight-outerHeight-withinOffset;let newOverBottom;if(data.collisionHeight>outerHeight)if(overTop>0&&overBottom<=0){newOverBottom=position.top+overTop+data.collisionHeight-outerHeight-withinOffset;position.top+=overTop-newOverBottom;}else if(overBottom>0&&overTop<=0)position.top=withinOffset;else if(overTop>overBottom)position.top=withinOffset+outerHeight-data.collisionHeight;else position.top=withinOffset;else if(overTop>0)position.top+=overTop;else if(overBottom>0)position.top-=overBottom;else position.top=max(position.top-collisionPosTop,position.top);}},flip:{left(position,data){const {within}=data;const withinOffset=within.offset.left+within.scrollLeft;const outerWidth=within.width;const offsetLeft=within.isWindow?within.scrollLeft:within.offset.left;const collisionPosLeft=position.left-data.collisionPosition.marginLeft;const overLeft=collisionPosLeft-offsetLeft;const overRight=collisionPosLeft+data.collisionWidth-outerWidth-offsetLeft;const myOffset=data.my[0]==='left'?-data.elemWidth:data.my[0]==='right'?data.elemWidth:0;const atOffset=data.at[0]==='left'?data.targetWidth:data.at[0]==='right'?-data.targetWidth:0;const offset=-2*data.offset[0];let newOverRight;let newOverLeft;if(overLeft<0){newOverRight=position.left+myOffset+atOffset+offset+data.collisionWidth-outerWidth-withinOffset;if(newOverRight<0||newOverRight<abs(overLeft))position.left+=myOffset+atOffset+offset;}else{if(overRight>0){newOverLeft=position.left-data.collisionPosition.marginLeft+myOffset+atOffset+offset-offsetLeft;if(newOverLeft>0||abs(newOverLeft)<overRight)position.left+=myOffset+atOffset+offset;}}},top(position,data){const {within}=data;const withinOffset=within.offset.top+within.scrollTop;const outerHeight=within.height;const offsetTop=within.isWindow?within.scrollTop:within.offset.top;const collisionPosTop=position.top-data.collisionPosition.marginTop;const overTop=collisionPosTop-offsetTop;const overBottom=collisionPosTop+data.collisionHeight-outerHeight-offsetTop;const top=data.my[1]==='top';const myOffset=top?-data.elemHeight:data.my[1]==='bottom'?data.elemHeight:0;const atOffset=data.at[1]==='top'?data.targetHeight:data.at[1]==='bottom'?-data.targetHeight:0;const offset=-2*data.offset[1];let newOverTop;let newOverBottom;if(overTop<0){newOverBottom=position.top+myOffset+atOffset+offset+data.collisionHeight-outerHeight-withinOffset;if(newOverBottom<0||newOverBottom<abs(overTop))position.top+=myOffset+atOffset+offset;}else{if(overBottom>0){newOverTop=position.top-data.collisionPosition.marginTop+myOffset+atOffset+offset-offsetTop;if(newOverTop>0||abs(newOverTop)<overBottom)position.top+=myOffset+atOffset+offset;}}}},flipfit:{left(...args){collisions.flip.left.apply(this,args);collisions.fit.left.apply(this,args);},top(...args){collisions.flip.top.apply(this,args);collisions.fit.top.apply(this,args);}}};$.position={scrollbarWidth(){if(cachedScrollbarWidth!==undefined)return cachedScrollbarWidth;const div=$('<div '+"style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'>"+"<div style='height:100px;width:auto;'></div></div>");const innerDiv=div.children()[0];$('body').append(div);const w1=innerDiv.offsetWidth;div[0].style.overflow='scroll';let w2=innerDiv.offsetWidth;if(w1===w2)w2=div[0].clientWidth;div.remove();cachedScrollbarWidth=w1-w2;return cachedScrollbarWidth;},getScrollInfo(within){const overflowX=within.isWindow||within.isDocument?'':window.getComputedStyle(within.element[0])['overflow-x'];const overflowY=within.isWindow||within.isDocument?'':window.getComputedStyle(within.element[0])['overflow-y'];const hasOverflowX=overflowX==='scroll'||(overflowX==='auto'&&within.width<within.element[0].scrollWidth);const hasOverflowY=overflowY==='scroll'||(overflowY==='auto'&&within.height<within.element[0].scrollHeight);return {width:hasOverflowY?$.position.scrollbarWidth():0,height:hasOverflowX?$.position.scrollbarWidth():0};},getWithinInfo(element){const withinElement=$(element||window);const isWindow=!!withinElement[0]&&withinElement[0]===withinElement[0].window;const isDocument=!!withinElement[0]&&withinElement[0].nodeType===Node.DOCUMENT_NODE;const hasOffset=!isWindow&&!isDocument;return {element:withinElement,isWindow,isDocument,offset:hasOffset?$(element).offset():{left:0,top:0},scrollLeft:withinElement.scrollLeft(),scrollTop:withinElement.scrollTop(),width:withinElement.outerWidth(),height:withinElement.outerHeight()};}};$.fn.position=function(options){if(!options||!options.of)return _position.apply(this,arguments);options=$.extend({},options);const within=$.position.getWithinInfo(options.within);const scrollInfo=$.position.getScrollInfo(within);const collision=(options.collision||'flip').split(' ');const offsets={};const target=typeof options.of==='string'?$(document).find(options.of):$(options.of);const dimensions=getDimensions(target);const targetWidth=dimensions.width;const targetHeight=dimensions.height;const targetOffset=dimensions.offset;if(target[0].preventDefault)options.at='left top';const basePosition=$.extend({},targetOffset);$.each(['my','at'],function(){let pos=(options[this]||'').split(' ');if(pos.length===1)pos=regexHorizontal.test(pos[0])?pos.concat(['center']):regexVertical.test(pos[0])?['center'].concat(pos):['center','center'];pos[0]=regexHorizontal.test(pos[0])?pos[0]:'center';pos[1]=regexVertical.test(pos[1])?pos[1]:'center';const horizontalOffset=regexOffset.exec(pos[0]);const verticalOffset=regexOffset.exec(pos[1]);offsets[this]=[horizontalOffset?horizontalOffset[0]:0,verticalOffset?verticalOffset[0]:0];options[this]=[regexPosition.exec(pos[0])[0],regexPosition.exec(pos[1])[0]];});if(collision.length===1)collision[1]=collision[0];if(options.at[0]==='right')basePosition.left+=targetWidth;else{if(options.at[0]==='center')basePosition.left+=targetWidth/2;}if(options.at[1]==='bottom')basePosition.top+=targetHeight;else{if(options.at[1]==='center')basePosition.top+=targetHeight/2;}const atOffset=getOffsets(offsets.at,targetWidth,targetHeight);basePosition.left+=atOffset[0];basePosition.top+=atOffset[1];return this.each(function(){let using;const elem=$(this);const elemWidth=elem.outerWidth();const elemHeight=elem.outerHeight();const marginLeft=parseCss(this,'marginLeft');const marginTop=parseCss(this,'marginTop');const collisionWidth=elemWidth+marginLeft+parseCss(this,'marginRight')+scrollInfo.width;const collisionHeight=elemHeight+marginTop+parseCss(this,'marginBottom')+scrollInfo.height;const position=$.extend({},basePosition);const myOffset=getOffsets(offsets.my,elem.outerWidth(),elem.outerHeight());if(options.my[0]==='right')position.left-=elemWidth;else{if(options.my[0]==='center')position.left-=elemWidth/2;}if(options.my[1]==='bottom')position.top-=elemHeight;else{if(options.my[1]==='center')position.top-=elemHeight/2;}position.left+=myOffset[0];position.top+=myOffset[1];const collisionPosition={marginLeft,marginTop};$.each(['left','top'],function(i,dir){if(collisions[collision[i]])collisions[collision[i]][dir](position,{targetWidth,targetHeight,elemWidth,elemHeight,collisionPosition,collisionWidth,collisionHeight,offset:[atOffset[0]+myOffset[0],atOffset[1]+myOffset[1]],my:options.my,at:options.at,within,elem});});if(options.using)using=function(props){const left=targetOffset.left-position.left;const right=left+targetWidth-elemWidth;const top=targetOffset.top-position.top;const bottom=top+targetHeight-elemHeight;const feedback={target:{element:target,left:targetOffset.left,top:targetOffset.top,width:targetWidth,height:targetHeight},element:{element:elem,left:position.left,top:position.top,width:elemWidth,height:elemHeight},horizontal:right<0?'left':left>0?'right':'center',vertical:bottom<0?'top':top>0?'bottom':'middle'};if(targetWidth<elemWidth&&abs(left+right)<targetWidth)feedback.horizontal='center';if(targetHeight<elemHeight&&abs(top+bottom)<targetHeight)feedback.vertical='middle';if(max(abs(left),abs(right))>max(abs(top),abs(bottom)))feedback.important='horizontal';else feedback.important='vertical';options.using.call(this,props,feedback);};elem.offset($.extend(position,{using}));});};if(!$.hasOwnProperty('ui'))$.ui={};$.ui.position=collisions;})(jQuery);;
(function($,Drupal,once){if(once('drupal-dialog-deprecation-listener','html').length){const eventSpecial={handle($event){const $element=$($event.target);const event=$event.originalEvent;const dialog=event.dialog;const dialogArguments=[$event,dialog,$element,event?.settings];$event.handleObj.handler.apply(this,dialogArguments);}};$.event.special['dialog:beforecreate']=eventSpecial;$.event.special['dialog:aftercreate']=eventSpecial;$.event.special['dialog:beforeclose']=eventSpecial;$.event.special['dialog:afterclose']=eventSpecial;const listenDialogEvent=(event)=>{const windowEvents=$._data(window,'events');const isWindowHasDialogListener=windowEvents[event.type];if(isWindowHasDialogListener)Drupal.deprecationError({message:`jQuery event ${event.type} is deprecated in 10.3.0 and is removed from Drupal:12.0.0. See https://www.drupal.org/node/3422670`});};['dialog:beforecreate','dialog:aftercreate','dialog:beforeclose','dialog:afterclose'].forEach((e)=>window.addEventListener(e,listenDialogEvent));window.addEventListener('dialog:beforecreate',(event)=>{const dialog=event.target;$(dialog).on('dialogButtonsChange.dialogDeprecation',(e)=>{if(!e?.originalEvent){Drupal.deprecationError({message:`jQuery event dialogButtonsChange is deprecated in 11.2.0 and is removed from Drupal:12.0.0. See https://www.drupal.org/node/3464202`});dialog.dispatchEvent(new CustomEvent('dialogButtonsChange'));}});});window.addEventListener('dialog:beforeclose',(event)=>{const dialog=event.target;$(dialog).off(`dialogButtonsChange.dialogDeprecation`);});}})(jQuery,Drupal,once);;
class DrupalDialogEvent extends Event{constructor(type,dialog,settings=null){super(`dialog:${type}`,{bubbles:true});this.dialog=dialog;this.settings=settings;}}(function($,Drupal,drupalSettings,bodyScrollLock){drupalSettings.dialog={autoOpen:true,buttonClass:'button',buttonPrimaryClass:'button--primary',close(event){Drupal.dialog(event.target).close();Drupal.detachBehaviors(event.target,null,'unload');}};Drupal.dialog=function(element,options){let undef;const $element=$(element);const domElement=$element.get(0);const dialog={open:false,returnValue:undef};function openDialog(settings){settings=$.extend({},drupalSettings.dialog,options,settings);if(settings.dialogClass)Drupal.deprecationError({message:'dialogClass is deprecated in drupal:10.4.x and will be removed from drupal:12.0.0.'});const event=new DrupalDialogEvent('beforecreate',dialog,settings);domElement.dispatchEvent(event);$element.dialog(event.settings);dialog.open=true;if(event.settings.modal)bodyScrollLock.lock(domElement);domElement.dispatchEvent(new DrupalDialogEvent('aftercreate',dialog,event.settings));}function closeDialog(value){domElement.dispatchEvent(new DrupalDialogEvent('beforeclose',dialog));bodyScrollLock.clearBodyLocks();$element.dialog('close');dialog.returnValue=value;dialog.open=false;domElement.dispatchEvent(new DrupalDialogEvent('afterclose',dialog));}dialog.show=()=>{openDialog({modal:false,uiDialogTitleHeadingLevel:2});};dialog.showModal=()=>{openDialog({modal:true,uiDialogTitleHeadingLevel:1});};dialog.close=closeDialog;return dialog;};})(jQuery,Drupal,drupalSettings,bodyScrollLock);;
(function($,Drupal,drupalSettings,debounce,displace){drupalSettings.dialog=$.extend({autoResize:true,maxHeight:'95%'},drupalSettings.dialog);function resetPosition(options){const offsets=displace.offsets;const left=offsets.left-offsets.right;const top=offsets.top-offsets.bottom;const leftString=`${(left>0?'+':'-')+Math.abs(Math.round(left/2))}px`;const topString=`${(top>0?'+':'-')+Math.abs(Math.round(top/2))}px`;options.position={my:`center${left!==0?leftString:''} center${top!==0?topString:''}`,of:window};return options;}function resetSize(event){const positionOptions=['width','height','minWidth','minHeight','maxHeight','maxWidth','position'];let adjustedOptions={};let windowHeight=$(window).height();let option;let optionValue;let adjustedValue;for(let n=0;n<positionOptions.length;n++){option=positionOptions[n];optionValue=event.data.settings[option];if(optionValue)if(typeof optionValue==='string'&&optionValue.endsWith('%')&&/height/i.test(option)){windowHeight-=displace.offsets.top+displace.offsets.bottom;adjustedValue=parseInt(0.01*parseInt(optionValue,10)*windowHeight,10);if(option==='height'&&Math.round(event.data.$element.parent().outerHeight())<adjustedValue)adjustedValue='auto';adjustedOptions[option]=adjustedValue;}}if(!event.data.settings.modal)adjustedOptions=resetPosition(adjustedOptions);event.data.$element.dialog('option',adjustedOptions);event.data.$element?.get(0)?.dispatchEvent(new CustomEvent('dialogContentResize',{bubbles:true}));}window.addEventListener('dialog:aftercreate',(e)=>{const autoResize=debounce(resetSize,20);const $element=$(e.target);const {settings}=e;const eventData={settings,$element};if(settings.autoResize===true||settings.autoResize==='true'){const uiDialog=$element.dialog('option',{resizable:false,draggable:false}).dialog('widget');uiDialog[0].style.position='fixed';$(window).on('resize.dialogResize scroll.dialogResize',eventData,autoResize).trigger('resize.dialogResize');$(document).on('drupalViewportOffsetChange.dialogResize',eventData,autoResize);}});window.addEventListener('dialog:beforeclose',()=>{$(window).off('.dialogResize');$(document).off('.dialogResize');});})(jQuery,Drupal,drupalSettings,Drupal.debounce,Drupal.displace);;
(function($,{tabbable,isTabbable}){$.widget('ui.dialog',$.ui.dialog,{options:{buttonClass:'button',buttonPrimaryClass:'button--primary'},_createButtons(){const opts=this.options;let primaryIndex;let index;const il=opts.buttons.length;for(index=0;index<il;index++)if(opts.buttons[index].primary&&opts.buttons[index].primary===true){primaryIndex=index;delete opts.buttons[index].primary;break;}this._super();const $buttons=this.uiButtonSet.children().addClass(opts.buttonClass);if(typeof primaryIndex!=='undefined')$buttons.eq(index).addClass(opts.buttonPrimaryClass);},_createWrapper(){this.uiDialog=$('<div>').hide().attr({tabIndex:-1,role:'dialog','aria-modal':this.options.modal?'true':null}).appendTo(this._appendTo());this._addClass(this.uiDialog,'ui-dialog','ui-widget ui-widget-content ui-front');this._on(this.uiDialog,{keydown(event){if(this.options.closeOnEscape&&!event.isDefaultPrevented()&&event.keyCode&&event.keyCode===$.ui.keyCode.ESCAPE){event.preventDefault();this.close(event);return;}if(event.keyCode!==$.ui.keyCode.TAB||event.isDefaultPrevented())return;const tabbableElements=tabbable(this.uiDialog[0]);if(tabbableElements.length){const first=tabbableElements[0];const last=tabbableElements[tabbableElements.length-1];if((event.target===last||event.target===this.uiDialog[0])&&!event.shiftKey){this._delay(function(){$(first).trigger('focus');});event.preventDefault();}else{if((event.target===first||event.target===this.uiDialog[0])&&event.shiftKey){this._delay(function(){$(last).trigger('focus');});event.preventDefault();}}}},mousedown(event){if(this._moveToTop(event))this._focusTabbable();}});if(!this.element.find('[aria-describedby]').length)this.uiDialog.attr({'aria-describedby':this.element.uniqueId().attr('id')});},_focusTabbable(){let hasFocus=this._focusedElement?this._focusedElement.get(0):null;if(!hasFocus)hasFocus=this.element.find('[autofocus]').get(0);if(!hasFocus){const $elements=[this.element,this.uiDialogButtonPane];for(let i=0;i<$elements.length;i++){const element=$elements[i].get(0);if(element){const elementTabbable=tabbable(element);hasFocus=elementTabbable.length?elementTabbable[0]:null;}if(hasFocus)break;}}if(!hasFocus){const closeBtn=this.uiDialogTitlebarClose.get(0);hasFocus=closeBtn&&isTabbable(closeBtn)?closeBtn:null;}if(!hasFocus)hasFocus=this.uiDialog.get(0);$(hasFocus).eq(0).trigger('focus');}});})(jQuery,window.tabbable);;
(($)=>{$.widget('ui.dialog',$.ui.dialog,{_allowInteraction(event){if(event.target.classList===undefined)return this._super(event);return event.target.classList.contains('ck')||this._super(event);}});})(jQuery);;
(function($,Drupal,{focusable}){Drupal.behaviors.dialog={attach(context,settings){if(!document.querySelector('#drupal-modal'))document.body.insertAdjacentHTML('beforeend','<div id="drupal-modal" class="ui-front" style="display:none"></div>');if(context!==document){const dialog=context.closest('.ui-dialog-content');if(dialog){if($(dialog).dialog('option','drupalAutoButtons'))dialog.dispatchEvent(new CustomEvent('dialogButtonsChange'));setTimeout(function(){if(!dialog.contains(document.activeElement)){const autoFocusElement=dialog?.querySelector('[autofocus]');if(autoFocusElement){autoFocusElement.focus();return;}const focusableElements=focusable(dialog);if(focusableElements.length>0){focusableElements[0].focus();return;}const dialogWrapper=dialog.closest('.ui-dialog');const buttonPane=dialogWrapper?.querySelector('.ui-dialog-buttonpane');const focusableButtons=focusable(buttonPane);if(focusableButtons.length>0){focusableButtons[0].focus();return;}const closeButton=dialogWrapper?.querySelector('.ui-dialog-titlebar-close');if(closeButton){closeButton.focus();return;}dialog.focus();}},0);}}const originalClose=settings.dialog.close;settings.dialog.close=function(event,...args){originalClose.apply(settings.dialog,[event,...args]);const $element=$(event.target);const ajaxContainer=$element.data('uiDialog')?$element.data('uiDialog').opener.closest('[data-drupal-ajax-container]'):[];if(ajaxContainer.length&&(document.activeElement===document.body||$(document.activeElement).not(':visible'))){const focusableChildren=focusable(ajaxContainer[0]);if(focusableChildren.length>0)setTimeout(()=>{focusableChildren[0].focus();},0);}$(event.target).remove();};},prepareDialogButtons($dialog){const buttons=[];const buttonSelectors='.form-actions input[type=submit], .form-actions a.button, .form-actions a.action-link';const buttonElements=$dialog[0].querySelectorAll(buttonSelectors);buttonElements.forEach((button)=>{button.style.display='none';buttons.push({text:button.innerHTML||button.getAttribute('value'),class:button.getAttribute('class'),'data-once':button.dataset.once,click(e){if(button.tagName==='A')button.click();else ['mousedown','mouseup','click'].forEach((event)=>button.dispatchEvent(new MouseEvent(event)));e.preventDefault();}});});return buttons;}};Drupal.AjaxCommands.prototype.openDialog=function(ajax,response,status){if(!response.selector)return false;let dialog=document.querySelector(response.selector);if(!dialog){dialog=document.createElement('div');dialog.id=response.selector.replace(/^#/,'');dialog.classList.add('ui-front');document.body.appendChild(dialog);}if(!ajax.wrapper)ajax.wrapper=dialog.id;response.command='insert';response.method='html';ajax.commands.insert(ajax,response,status);response.dialogOptions=response.dialogOptions||{};if(typeof response.dialogOptions.drupalAutoButtons==='undefined')response.dialogOptions.drupalAutoButtons=true;else if(response.dialogOptions.drupalAutoButtons==='false')response.dialogOptions.drupalAutoButtons=false;else response.dialogOptions.drupalAutoButtons=!!response.dialogOptions.drupalAutoButtons;if(!response.dialogOptions.buttons&&response.dialogOptions.drupalAutoButtons)response.dialogOptions.buttons=Drupal.behaviors.dialog.prepareDialogButtons($(dialog));const dialogButtonsChange=()=>{const buttons=Drupal.behaviors.dialog.prepareDialogButtons($(dialog));$(dialog).dialog('option','buttons',buttons);};dialog.addEventListener('dialogButtonsChange',dialogButtonsChange);dialog.addEventListener('dialog:beforeclose',(event)=>{dialog.removeEventListener('dialogButtonsChange',dialogButtonsChange);});const createdDialog=Drupal.dialog(dialog,response.dialogOptions);if(response.dialogOptions.modal)createdDialog.showModal();else createdDialog.show();dialog.parentElement?.querySelector('.ui-dialog-buttonset')?.classList.add('form-actions');};Drupal.AjaxCommands.prototype.closeDialog=function(ajax,response,status){const dialog=document.querySelector(response.selector);if(dialog){Drupal.dialog(dialog).close();if(!response.persist)dialog.remove();}};Drupal.AjaxCommands.prototype.setDialogOption=function(ajax,response,status){const dialog=document.querySelector(response.selector);if(dialog)$(dialog).dialog('option',response.optionName,response.optionValue);};window.addEventListener('dialog:aftercreate',(event)=>{const dialog=event.dialog;const cancelButton=event.target.querySelector('.dialog-cancel');const cancelClick=(e)=>{dialog.close('cancel');e.preventDefault();e.stopPropagation();};cancelButton?.removeEventListener('click',cancelClick);cancelButton?.addEventListener('click',cancelClick);});Drupal.AjaxCommands.prototype.openModalDialogWithUrl=function(ajax,response){const dialogOptions=response.dialogOptions||{};const elementSettings={progress:{type:'throbber'},dialogType:'modal',dialog:dialogOptions,url:response.url,httpMethod:'GET'};Drupal.ajax(elementSettings).execute();};})(jQuery,Drupal,window.tabbable);;
(function($,Drupal){const states={postponed:[]};Drupal.states=states;function invert(a,invertState){return invertState&&typeof a!=='undefined'?!a:a;}function compare(a,b){if(a===b)return typeof a==='undefined'?a:true;return typeof a==='undefined'||typeof b==='undefined';}function ternary(a,b){if(typeof a==='undefined')return b;if(typeof b==='undefined')return a;return a&&b;}Drupal.behaviors.states={attach(context,settings){const elements=once('states','[data-drupal-states]',context);const il=elements.length;for(let i=0;i<il;i++){const config=JSON.parse(elements[i].getAttribute('data-drupal-states'));Object.keys(config||{}).forEach((state)=>{new states.Dependent({element:$(elements[i]),state:states.State.sanitize(state),constraints:config[state]});});}while(states.postponed.length)states.postponed.shift()();}};states.Dependent=function(args){$.extend(this,{values:{},oldValue:null},args);this.dependees=this.getDependees();Object.keys(this.dependees||{}).forEach((selector)=>{this.initializeDependee(selector,this.dependees[selector]);});};states.Dependent.comparisons={RegExp(reference,value){return reference.test(value);},Function(reference,value){return reference(value);},Array(reference,value){if(!Array.isArray(value))return false;return JSON.stringify(reference.sort())===JSON.stringify(value.sort());},Number(reference,value){return typeof value==='string'?compare(reference.toString(),value):compare(reference,value);}};states.Dependent.prototype={initializeDependee(selector,dependeeStates){this.values[selector]={};Object.keys(dependeeStates).forEach((i)=>{let state=dependeeStates[i];if($.inArray(state,dependeeStates)===-1)return;state=states.State.sanitize(state);this.values[selector][state.name]=null;$(selector).on(`state:${state}`,{selector,state},(e)=>{this.update(e.data.selector,e.data.state,e.value);});new states.Trigger({selector,state});});},compare(reference,selector,state){const value=this.values[selector][state.name];if(reference.constructor.name in states.Dependent.comparisons)return states.Dependent.comparisons[reference.constructor.name](reference,value);return compare(reference,value);},update(selector,state,value){if(value!==this.values[selector][state.name]){this.values[selector][state.name]=value;this.reevaluate();}},reevaluate(){let value=this.verifyConstraints(this.constraints);if(value!==this.oldValue){this.oldValue=value;value=invert(value,this.state.invert);this.element.trigger({type:`state:${this.state}`,value,trigger:true});}},verifyConstraints(constraints,selector){let result;if(Array.isArray(constraints)){const hasXor=$.inArray('xor',constraints)===-1;const len=constraints.length;for(let i=0;i<len;i++)if(constraints[i]!=='xor'){const constraint=this.checkConstraints(constraints[i],selector,i);if(constraint&&(hasXor||result))return hasXor;result=result||constraint;}}else{if($.isPlainObject(constraints)){for(const n in constraints)if(constraints.hasOwnProperty(n)){result=ternary(result,this.checkConstraints(constraints[n],selector,n));if(result===false)return false;}}}return result;},checkConstraints(value,selector,state){if(typeof state!=='string'||/[0-9]/.test(state[0]))state=null;else{if(typeof selector==='undefined'){selector=state;state=null;}}if(state!==null){state=states.State.sanitize(state);return invert(this.compare(value,selector,state),state.invert);}return this.verifyConstraints(value,selector);},getDependees(){const cache={};const _compare=this.compare;this.compare=function(reference,selector,state){(cache[selector]||(cache[selector]=[])).push(state.name);};this.verifyConstraints(this.constraints);this.compare=_compare;return cache;}};states.Trigger=function(args){$.extend(this,args);if(this.state in states.Trigger.states){this.element=$(this.selector);if(!this.element.data(`trigger:${this.state}`))this.initialize();}};states.Trigger.prototype={initialize(){const trigger=states.Trigger.states[this.state];if(typeof trigger==='function')trigger.call(window,this.element);else Object.keys(trigger||{}).forEach((event)=>{this.defaultTrigger(event,trigger[event]);});this.element.data(`trigger:${this.state}`,true);},defaultTrigger(event,valueFn){let oldValue=valueFn.call(this.element);this.element.on(event,function(e){const value=valueFn.call(this.element,e);if(oldValue!==value){this.element.trigger({type:`state:${this.state}`,value,oldValue});oldValue=value;}}.bind(this));states.postponed.push(function(){this.element.trigger({type:`state:${this.state}`,value:oldValue,oldValue:null});}.bind(this));}};states.Trigger.states={empty:{keyup(){return this.val()==='';},change(){return this.val()==='';}},checked:{change(){let checked=false;this.each(function(){checked=$(this).prop('checked');return !checked;});return checked;}},value:{keyup(){if(this.length>1)return this.filter(':checked').val()||false;return this.val();},change(){if(this.length>1)return this.filter(':checked').val()||false;return this.val();}},collapsed:{collapsed(e){return typeof e!=='undefined'&&'value' in e?e.value:!this[0].hasAttribute('open');}}};states.State=function(state){this.pristine=state;this.name=state;let process=true;do{while(this.name.charAt(0)==='!'){this.name=this.name.substring(1);this.invert=!this.invert;}if(this.name in states.State.aliases)this.name=states.State.aliases[this.name];else process=false;}while(process);};states.State.sanitize=function(state){if(state instanceof states.State)return state;return new states.State(state);};states.State.aliases={enabled:'!disabled',invisible:'!visible',invalid:'!valid',untouched:'!touched',optional:'!required',filled:'!empty',unchecked:'!checked',irrelevant:'!relevant',expanded:'!collapsed',open:'!collapsed',closed:'collapsed',readwrite:'!readonly'};states.State.prototype={invert:false,toString(){return this.name;}};const $document=$(document);$document.on('state:disabled',(e)=>{const tagsSupportDisable='button, fieldset, optgroup, option, select, textarea, input';if(e.trigger)$(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggleClass('form-disabled',e.value).find(tagsSupportDisable).addBack(tagsSupportDisable).prop('disabled',e.value);});$document.on('state:readonly',(e)=>{if(e.trigger)$(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggleClass('form-readonly',e.value).find('input, textarea').prop('readonly',e.value);});$document.on('state:required',(e)=>{if(e.trigger)if(e.value){const label=`label${e.target.id?`[for=${e.target.id}]`:''}`;const $label=$(e.target).attr({required:'required'}).closest('.js-form-item, .js-form-wrapper').find(label);if(!$label.hasClass('js-form-required').length)$label.addClass('js-form-required form-required');}else $(e.target).removeAttr('required').closest('.js-form-item, .js-form-wrapper').find('label.js-form-required').removeClass('js-form-required form-required');});$document.on('state:visible',(e)=>{if(e.trigger){let $element=$(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper');if(e.target.tagName==='A')$element=$(e.target);$element.toggle(e.value);}});$document.on('state:checked',(e)=>{if(e.trigger)$(e.target).closest('.js-form-item, .js-form-wrapper').find('input').prop('checked',e.value).trigger('change');});$document.on('state:collapsed',(e)=>{if(e.trigger)if(e.target.hasAttribute('open')===e.value)$(e.target).find('> summary').trigger('click');});})(jQuery,Drupal);;
((Drupal,drupalSettings,once)=>{Drupal.behaviors.ginEscapeAdmin={attach:(context)=>{once("ginEscapeAdmin","[data-gin-toolbar-escape-admin]",context).forEach(((el)=>{const escapeAdminPath=sessionStorage.getItem("escapeAdminPath");drupalSettings.path.currentPathIsAdmin&&null!==escapeAdminPath&&el.setAttribute("href",escapeAdminPath);}));}};})(Drupal,drupalSettings,once);;
((Drupal,once)=>{Drupal.behaviors.ginCoreNavigation={attach:(context)=>{Drupal.ginCoreNavigation.initKeyboardShortcut(context);}},Drupal.ginCoreNavigation={initKeyboardShortcut:function(context){once("ginToolbarKeyboardShortcut",".admin-toolbar__expand-button",context).forEach((()=>{document.addEventListener("keydown",((e)=>{!0===e.altKey&&"KeyT"===e.code&&this.toggleToolbar();}));})),once("ginToolbarClickHandler",".top-bar__burger, .admin-toolbar__expand-button",context).forEach(((button)=>{button.addEventListener("click",(()=>{window.innerWidth<1280&&button.getAttribute("aria-expanded","false")&&Drupal.ginSidebar?.collapseSidebar();}));}));},toggleToolbar(){let toolbarTrigger=document.querySelector(".admin-toolbar__expand-button");toolbarTrigger&&toolbarTrigger.click();},collapseToolbar:function(){document.querySelectorAll(".top-bar__burger, .admin-toolbar__expand-button").forEach(((button)=>{button.setAttribute("aria-expanded","false");})),document.documentElement.setAttribute("data-admin-toolbar","collapsed"),Drupal.displace(!0);}};})(Drupal,once);;
((Drupal,drupalSettings,once)=>{Drupal.behaviors.ginAccent={attach:function(context){once("ginAccent","body",context).forEach((()=>{Drupal.ginAccent.checkDarkmode(),Drupal.ginAccent.setAccentColor(),Drupal.ginAccent.setFocusColor();}));}},Drupal.ginAccent={setAccentColor:function(){let preset=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,color=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;const accentColorPreset=null!=preset?preset:drupalSettings.gin.preset_accent_color;document.body.setAttribute("data-gin-accent",accentColorPreset),"custom"===accentColorPreset&&this.setCustomAccentColor(color);},setCustomAccentColor:function(){let color=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,element=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.body;const accentColor=null!=color?color:drupalSettings.gin.accent_color;if(accentColor){this.clearAccentColor(element);const strippedAccentColor=accentColor.replace("#",""),darkAccentColor=this.mixColor("ffffff",strippedAccentColor,65).replace("#",""),style=document.createElement("style");style.className="gin-custom-colors",style.innerHTML=`\n          [data-gin-accent="custom"] {\n            --gin-color-primary-rgb: ${this.hexToRgb(accentColor)};\n            --gin-color-primary-hover: ${this.shadeColor(accentColor,-10)};\n            --gin-color-primary-active: ${this.shadeColor(accentColor,-15)};\n            --gin-bg-app-rgb: ${this.hexToRgb(this.mixColor("ffffff",strippedAccentColor,97))};\n            --gin-bg-header: ${this.mixColor("ffffff",strippedAccentColor,85)};\n            --gin-color-sticky-rgb: ${this.hexToRgb(this.mixColor("ffffff",strippedAccentColor,92))};\n          }\n          .gin--dark-mode[data-gin-accent="custom"],\n          .gin--dark-mode [data-gin-accent="custom"] {\n            --gin-color-primary-rgb: ${this.hexToRgb(darkAccentColor)};\n            --gin-color-primary-hover: ${this.mixColor("ffffff",strippedAccentColor,55)};\n            --gin-color-primary-active: ${this.mixColor("ffffff",strippedAccentColor,50)};\n            --gin-bg-header: ${this.mixColor("2A2A2D",darkAccentColor,88)};\n          }\n        `,element.append(style);}},clearAccentColor:function(){let element=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.body;if(element.querySelectorAll(".gin-custom-colors").length>0){const removeElement=element.querySelector(".gin-custom-colors");removeElement.parentNode.removeChild(removeElement);}},setFocusColor:function(){let preset=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,color=arguments.length>1&&void 0!==arguments[1]?arguments[1]:null;const focusColorPreset=null!=preset?preset:drupalSettings.gin.preset_focus_color;document.body.setAttribute("data-gin-focus",focusColorPreset),"custom"===focusColorPreset&&this.setCustomFocusColor(color);},setCustomFocusColor:function(){let color=arguments.length>0&&void 0!==arguments[0]?arguments[0]:null,element=arguments.length>1&&void 0!==arguments[1]?arguments[1]:document.body;const accentColor=null!=color?color:drupalSettings.gin.focus_color;if(accentColor){this.clearFocusColor(element);const strippedAccentColor=accentColor.replace("#",""),darkAccentColor=this.mixColor("ffffff",strippedAccentColor,65),style=document.createElement("style");style.className="gin-custom-focus",style.innerHTML=`\n          [data-gin-focus="custom"] {\n            --gin-color-focus: ${accentColor};\n          }\n          .gin--dark-mode[data-gin-focus="custom"],\n          .gin--dark-mode [data-gin-focus="custom"] {\n            --gin-color-focus: ${darkAccentColor};\n          }`,element.append(style);}},clearFocusColor:function(){let element=arguments.length>0&&void 0!==arguments[0]?arguments[0]:document.body;if(element.querySelectorAll(".gin-custom-focus").length>0){const removeElement=element.querySelector(".gin-custom-focus");removeElement.parentNode.removeChild(removeElement);}},checkDarkmode:()=>{const darkmodeClass=drupalSettings.gin.darkmode_class;window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change",((e)=>{e.matches&&"auto"===window.ginDarkmode&&document.querySelector("html").classList.add(darkmodeClass);})),window.matchMedia("(prefers-color-scheme: light)").addEventListener("change",((e)=>{e.matches&&"auto"===window.ginDarkmode&&document.querySelector("html").classList.remove(darkmodeClass);}));},hexToRgb:(hex)=>{hex=hex.replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i,(function(m,r,g,b){return r+r+g+g+b+b;}));var result=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);return result?`${parseInt(result[1],16)}, ${parseInt(result[2],16)}, ${parseInt(result[3],16)}`:null;},mixColor:(color_1,color_2,weight)=>{function h2d(h){return parseInt(h,16);}weight=void 0!==weight?weight:50;for(var color="#",i=0;i<=5;i+=2){for(var v1=h2d(color_1.substr(i,2)),v2=h2d(color_2.substr(i,2)),val=Math.floor(v2+weight/100*(v1-v2)).toString(16);val.length<2;)val="0"+val;color+=val;}return color;},shadeColor:(color,percent)=>{const num=parseInt(color.replace("#",""),16),amt=Math.round(2.55*percent),R=(num>>16)+amt,B=(num>>8&255)+amt,G=(255&num)+amt;return `#${(16777216+65536*(R<255?R<1?0:R:255)+256*(B<255?B<1?0:B:255)+(G<255?G<1?0:G:255)).toString(16).slice(1)}`;}};})(Drupal,drupalSettings,once);;
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
      (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FloatingUICore = {}));
})(this, (function (exports) { 'use strict';

  function getAlignment(placement) {
    return placement.split('-')[1];
  }

  function getLengthFromAxis(axis) {
    return axis === 'y' ? 'height' : 'width';
  }

  function getSide(placement) {
    return placement.split('-')[0];
  }

  function getMainAxisFromPlacement(placement) {
    return ['top', 'bottom'].includes(getSide(placement)) ? 'x' : 'y';
  }

  function computeCoordsFromPlacement(_ref, placement, rtl) {
    let {
      reference,
      floating
    } = _ref;
    const commonX = reference.x + reference.width / 2 - floating.width / 2;
    const commonY = reference.y + reference.height / 2 - floating.height / 2;
    const mainAxis = getMainAxisFromPlacement(placement);
    const length = getLengthFromAxis(mainAxis);
    const commonAlign = reference[length] / 2 - floating[length] / 2;
    const side = getSide(placement);
    const isVertical = mainAxis === 'x';
    let coords;
    switch (side) {
      case 'top':
        coords = {
          x: commonX,
          y: reference.y - floating.height
        };
        break;
      case 'bottom':
        coords = {
          x: commonX,
          y: reference.y + reference.height
        };
        break;
      case 'right':
        coords = {
          x: reference.x + reference.width,
          y: commonY
        };
        break;
      case 'left':
        coords = {
          x: reference.x - floating.width,
          y: commonY
        };
        break;
      default:
        coords = {
          x: reference.x,
          y: reference.y
        };
    }
    switch (getAlignment(placement)) {
      case 'start':
        coords[mainAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
        break;
      case 'end':
        coords[mainAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
        break;
    }
    return coords;
  }

  /**
   * Computes the `x` and `y` coordinates that will place the floating element
   * next to a reference element when it is given a certain positioning strategy.
   *
   * This export does not have any `platform` interface logic. You will need to
   * write one for the platform you are using Floating UI with.
   */
  const computePosition = async (reference, floating, config) => {
    const {
      placement = 'bottom',
      strategy = 'absolute',
      middleware = [],
      platform
    } = config;
    const validMiddleware = middleware.filter(Boolean);
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
    let rects = await platform.getElementRects({
      reference,
      floating,
      strategy
    });
    let {
      x,
      y
    } = computeCoordsFromPlacement(rects, placement, rtl);
    let statefulPlacement = placement;
    let middlewareData = {};
    let resetCount = 0;
    for (let i = 0; i < validMiddleware.length; i++) {
      const {
        name,
        fn
      } = validMiddleware[i];
      const {
        x: nextX,
        y: nextY,
        data,
        reset
      } = await fn({
        x,
        y,
        initialPlacement: placement,
        placement: statefulPlacement,
        strategy,
        middlewareData,
        rects,
        platform,
        elements: {
          reference,
          floating
        }
      });
      x = nextX != null ? nextX : x;
      y = nextY != null ? nextY : y;
      middlewareData = {
        ...middlewareData,
        [name]: {
          ...middlewareData[name],
          ...data
        }
      };
      if (reset && resetCount <= 50) {
        resetCount++;
        if (typeof reset === 'object') {
          if (reset.placement) {
            statefulPlacement = reset.placement;
          }
          if (reset.rects) {
            rects = reset.rects === true ? await platform.getElementRects({
              reference,
              floating,
              strategy
            }) : reset.rects;
          }
          ({
            x,
            y
          } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
        }
        i = -1;
        continue;
      }
    }
    return {
      x,
      y,
      placement: statefulPlacement,
      strategy,
      middlewareData
    };
  };

  function evaluate(value, param) {
    return typeof value === 'function' ? value(param) : value;
  }

  function expandPaddingObject(padding) {
    return {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      ...padding
    };
  }

  function getSideObjectFromPadding(padding) {
    return typeof padding !== 'number' ? expandPaddingObject(padding) : {
      top: padding,
      right: padding,
      bottom: padding,
      left: padding
    };
  }

  function rectToClientRect(rect) {
    return {
      ...rect,
      top: rect.y,
      left: rect.x,
      right: rect.x + rect.width,
      bottom: rect.y + rect.height
    };
  }

  /**
   * Resolves with an object of overflow side offsets that determine how much the
   * element is overflowing a given clipping boundary on each side.
   * - positive = overflowing the boundary by that number of pixels
   * - negative = how many pixels left before it will overflow
   * - 0 = lies flush with the boundary
   * @see https://floating-ui.com/docs/detectOverflow
   */
  async function detectOverflow(state, options) {
    var _await$platform$isEle;
    if (options === void 0) {
      options = {};
    }
    const {
      x,
      y,
      platform,
      rects,
      elements,
      strategy
    } = state;
    const {
      boundary = 'clippingAncestors',
      rootBoundary = 'viewport',
      elementContext = 'floating',
      altBoundary = false,
      padding = 0
    } = evaluate(options, state);
    const paddingObject = getSideObjectFromPadding(padding);
    const altContext = elementContext === 'floating' ? 'reference' : 'floating';
    const element = elements[altBoundary ? altContext : elementContext];
    const clippingClientRect = rectToClientRect(await platform.getClippingRect({
      element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
      boundary,
      rootBoundary,
      strategy
    }));
    const rect = elementContext === 'floating' ? {
      ...rects.floating,
      x,
      y
    } : rects.reference;
    const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
    const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) ? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
      x: 1,
      y: 1
    } : {
      x: 1,
      y: 1
    };
    const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
      rect,
      offsetParent,
      strategy
    }) : rect);
    return {
      top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
      bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
      left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
      right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
    };
  }

  const min = Math.min;
  const max = Math.max;

  function within(min$1, value, max$1) {
    return max(min$1, min(value, max$1));
  }

  /**
   * Provides data to position an inner element of the floating element so that it
   * appears centered to the reference element.
   * @see https://floating-ui.com/docs/arrow
   */
  const arrow = options => ({
    name: 'arrow',
    options,
    async fn(state) {
      const {
        x,
        y,
        placement,
        rects,
        platform,
        elements
      } = state;
      // Since `element` is required, we don't Partial<> the type.
      const {
        element,
        padding = 0
      } = evaluate(options, state) || {};
      if (element == null) {
        return {};
      }
      const paddingObject = getSideObjectFromPadding(padding);
      const coords = {
        x,
        y
      };
      const axis = getMainAxisFromPlacement(placement);
      const length = getLengthFromAxis(axis);
      const arrowDimensions = await platform.getDimensions(element);
      const isYAxis = axis === 'y';
      const minProp = isYAxis ? 'top' : 'left';
      const maxProp = isYAxis ? 'bottom' : 'right';
      const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';
      const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
      const startDiff = coords[axis] - rects.reference[axis];
      const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
      let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;

      // DOM platform can return `window` as the `offsetParent`.
      if (!clientSize || !(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))) {
        clientSize = elements.floating[clientProp] || rects.floating[length];
      }
      const centerToReference = endDiff / 2 - startDiff / 2;

      // If the padding is large enough that it causes the arrow to no longer be
      // centered, modify the padding so that it is centered.
      const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
      const minPadding = min(paddingObject[minProp], largestPossiblePadding);
      const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);

      // Make sure the arrow doesn't overflow the floating element if the center
      // point is outside the floating element's bounds.
      const min$1 = minPadding;
      const max = clientSize - arrowDimensions[length] - maxPadding;
      const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
      const offset = within(min$1, center, max);

      // If the reference is small enough that the arrow's padding causes it to
      // to point to nothing for an aligned placement, adjust the offset of the
      // floating element itself. This stops `shift()` from taking action, but can
      // be worked around by calling it again after the `arrow()` if desired.
      const shouldAddOffset = getAlignment(placement) != null && center != offset && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
      const alignmentOffset = shouldAddOffset ? center < min$1 ? min$1 - center : max - center : 0;
      return {
        [axis]: coords[axis] - alignmentOffset,
        data: {
          [axis]: offset,
          centerOffset: center - offset + alignmentOffset
        }
      };
    }
  });

  const sides = ['top', 'right', 'bottom', 'left'];
  const allPlacements = /*#__PURE__*/sides.reduce((acc, side) => acc.concat(side, side + "-start", side + "-end"), []);

  const oppositeSideMap = {
    left: 'right',
    right: 'left',
    bottom: 'top',
    top: 'bottom'
  };
  function getOppositePlacement(placement) {
    return placement.replace(/left|right|bottom|top/g, side => oppositeSideMap[side]);
  }

  function getAlignmentSides(placement, rects, rtl) {
    if (rtl === void 0) {
      rtl = false;
    }
    const alignment = getAlignment(placement);
    const mainAxis = getMainAxisFromPlacement(placement);
    const length = getLengthFromAxis(mainAxis);
    let mainAlignmentSide = mainAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
    if (rects.reference[length] > rects.floating[length]) {
      mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
    }
    return {
      main: mainAlignmentSide,
      cross: getOppositePlacement(mainAlignmentSide)
    };
  }

  const oppositeAlignmentMap = {
    start: 'end',
    end: 'start'
  };
  function getOppositeAlignmentPlacement(placement) {
    return placement.replace(/start|end/g, alignment => oppositeAlignmentMap[alignment]);
  }

  function getPlacementList(alignment, autoAlignment, allowedPlacements) {
    const allowedPlacementsSortedByAlignment = alignment ? [...allowedPlacements.filter(placement => getAlignment(placement) === alignment), ...allowedPlacements.filter(placement => getAlignment(placement) !== alignment)] : allowedPlacements.filter(placement => getSide(placement) === placement);
    return allowedPlacementsSortedByAlignment.filter(placement => {
      if (alignment) {
        return getAlignment(placement) === alignment || (autoAlignment ? getOppositeAlignmentPlacement(placement) !== placement : false);
      }
      return true;
    });
  }
  /**
   * Optimizes the visibility of the floating element by choosing the placement
   * that has the most space available automatically, without needing to specify a
   * preferred placement. Alternative to `flip`.
   * @see https://floating-ui.com/docs/autoPlacement
   */
  const autoPlacement = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'autoPlacement',
      options,
      async fn(state) {
        var _middlewareData$autoP, _middlewareData$autoP2, _placementsThatFitOnE;
        const {
          rects,
          middlewareData,
          placement,
          platform,
          elements
        } = state;
        const {
          crossAxis = false,
          alignment,
          allowedPlacements = allPlacements,
          autoAlignment = true,
          ...detectOverflowOptions
        } = evaluate(options, state);
        const placements = alignment !== undefined || allowedPlacements === allPlacements ? getPlacementList(alignment || null, autoAlignment, allowedPlacements) : allowedPlacements;
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const currentIndex = ((_middlewareData$autoP = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP.index) || 0;
        const currentPlacement = placements[currentIndex];
        if (currentPlacement == null) {
          return {};
        }
        const {
          main,
          cross
        } = getAlignmentSides(currentPlacement, rects, await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating)));

        // Make `computeCoords` start from the right place.
        if (placement !== currentPlacement) {
          return {
            reset: {
              placement: placements[0]
            }
          };
        }
        const currentOverflows = [overflow[getSide(currentPlacement)], overflow[main], overflow[cross]];
        const allOverflows = [...(((_middlewareData$autoP2 = middlewareData.autoPlacement) == null ? void 0 : _middlewareData$autoP2.overflows) || []), {
          placement: currentPlacement,
          overflows: currentOverflows
        }];
        const nextPlacement = placements[currentIndex + 1];

        // There are more placements to check.
        if (nextPlacement) {
          return {
            data: {
              index: currentIndex + 1,
              overflows: allOverflows
            },
            reset: {
              placement: nextPlacement
            }
          };
        }
        const placementsSortedByMostSpace = allOverflows.map(d => {
          const alignment = getAlignment(d.placement);
          return [d.placement, alignment && crossAxis ?
            // Check along the mainAxis and main crossAxis side.
            d.overflows.slice(0, 2).reduce((acc, v) => acc + v, 0) :
            // Check only the mainAxis.
            d.overflows[0], d.overflows];
        }).sort((a, b) => a[1] - b[1]);
        const placementsThatFitOnEachSide = placementsSortedByMostSpace.filter(d => d[2].slice(0,
          // Aligned placements should not check their opposite crossAxis
          // side.
          getAlignment(d[0]) ? 2 : 3).every(v => v <= 0));
        const resetPlacement = ((_placementsThatFitOnE = placementsThatFitOnEachSide[0]) == null ? void 0 : _placementsThatFitOnE[0]) || placementsSortedByMostSpace[0][0];
        if (resetPlacement !== placement) {
          return {
            data: {
              index: currentIndex + 1,
              overflows: allOverflows
            },
            reset: {
              placement: resetPlacement
            }
          };
        }
        return {};
      }
    };
  };

  function getExpandedPlacements(placement) {
    const oppositePlacement = getOppositePlacement(placement);
    return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
  }

  function getSideList(side, isStart, rtl) {
    const lr = ['left', 'right'];
    const rl = ['right', 'left'];
    const tb = ['top', 'bottom'];
    const bt = ['bottom', 'top'];
    switch (side) {
      case 'top':
      case 'bottom':
        if (rtl) return isStart ? rl : lr;
        return isStart ? lr : rl;
      case 'left':
      case 'right':
        return isStart ? tb : bt;
      default:
        return [];
    }
  }
  function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
    const alignment = getAlignment(placement);
    let list = getSideList(getSide(placement), direction === 'start', rtl);
    if (alignment) {
      list = list.map(side => side + "-" + alignment);
      if (flipAlignment) {
        list = list.concat(list.map(getOppositeAlignmentPlacement));
      }
    }
    return list;
  }

  /**
   * Optimizes the visibility of the floating element by flipping the `placement`
   * in order to keep it in view when the preferred placement(s) will overflow the
   * clipping boundary. Alternative to `autoPlacement`.
   * @see https://floating-ui.com/docs/flip
   */
  const flip = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'flip',
      options,
      async fn(state) {
        var _middlewareData$flip;
        const {
          placement,
          middlewareData,
          rects,
          initialPlacement,
          platform,
          elements
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = true,
          fallbackPlacements: specifiedFallbackPlacements,
          fallbackStrategy = 'bestFit',
          fallbackAxisSideDirection = 'none',
          flipAlignment = true,
          ...detectOverflowOptions
        } = evaluate(options, state);
        const side = getSide(placement);
        const isBasePlacement = getSide(initialPlacement) === initialPlacement;
        const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
        const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
        if (!specifiedFallbackPlacements && fallbackAxisSideDirection !== 'none') {
          fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
        }
        const placements = [initialPlacement, ...fallbackPlacements];
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const overflows = [];
        let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
        if (checkMainAxis) {
          overflows.push(overflow[side]);
        }
        if (checkCrossAxis) {
          const {
            main,
            cross
          } = getAlignmentSides(placement, rects, rtl);
          overflows.push(overflow[main], overflow[cross]);
        }
        overflowsData = [...overflowsData, {
          placement,
          overflows
        }];

        // One or more sides is overflowing.
        if (!overflows.every(side => side <= 0)) {
          var _middlewareData$flip2, _overflowsData$filter;
          const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
          const nextPlacement = placements[nextIndex];
          if (nextPlacement) {
            // Try next placement and re-run the lifecycle.
            return {
              data: {
                index: nextIndex,
                overflows: overflowsData
              },
              reset: {
                placement: nextPlacement
              }
            };
          }

          // First, find the candidates that fit on the mainAxis side of overflow,
          // then find the placement that fits the best on the main crossAxis side.
          let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

          // Otherwise fallback.
          if (!resetPlacement) {
            switch (fallbackStrategy) {
              case 'bestFit':
              {
                var _overflowsData$map$so;
                const placement = (_overflowsData$map$so = overflowsData.map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$map$so[0];
                if (placement) {
                  resetPlacement = placement;
                }
                break;
              }
              case 'initialPlacement':
                resetPlacement = initialPlacement;
                break;
            }
          }
          if (placement !== resetPlacement) {
            return {
              reset: {
                placement: resetPlacement
              }
            };
          }
        }
        return {};
      }
    };
  };

  function getSideOffsets(overflow, rect) {
    return {
      top: overflow.top - rect.height,
      right: overflow.right - rect.width,
      bottom: overflow.bottom - rect.height,
      left: overflow.left - rect.width
    };
  }
  function isAnySideFullyClipped(overflow) {
    return sides.some(side => overflow[side] >= 0);
  }
  /**
   * Provides data to hide the floating element in applicable situations, such as
   * when it is not in the same clipping context as the reference element.
   * @see https://floating-ui.com/docs/hide
   */
  const hide = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'hide',
      options,
      async fn(state) {
        const {
          rects
        } = state;
        const {
          strategy = 'referenceHidden',
          ...detectOverflowOptions
        } = evaluate(options, state);
        switch (strategy) {
          case 'referenceHidden':
          {
            const overflow = await detectOverflow(state, {
              ...detectOverflowOptions,
              elementContext: 'reference'
            });
            const offsets = getSideOffsets(overflow, rects.reference);
            return {
              data: {
                referenceHiddenOffsets: offsets,
                referenceHidden: isAnySideFullyClipped(offsets)
              }
            };
          }
          case 'escaped':
          {
            const overflow = await detectOverflow(state, {
              ...detectOverflowOptions,
              altBoundary: true
            });
            const offsets = getSideOffsets(overflow, rects.floating);
            return {
              data: {
                escapedOffsets: offsets,
                escaped: isAnySideFullyClipped(offsets)
              }
            };
          }
          default:
          {
            return {};
          }
        }
      }
    };
  };

  function getBoundingRect(rects) {
    const minX = min(...rects.map(rect => rect.left));
    const minY = min(...rects.map(rect => rect.top));
    const maxX = max(...rects.map(rect => rect.right));
    const maxY = max(...rects.map(rect => rect.bottom));
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  function getRectsByLine(rects) {
    const sortedRects = rects.slice().sort((a, b) => a.y - b.y);
    const groups = [];
    let prevRect = null;
    for (let i = 0; i < sortedRects.length; i++) {
      const rect = sortedRects[i];
      if (!prevRect || rect.y - prevRect.y > prevRect.height / 2) {
        groups.push([rect]);
      } else {
        groups[groups.length - 1].push(rect);
      }
      prevRect = rect;
    }
    return groups.map(rect => rectToClientRect(getBoundingRect(rect)));
  }
  /**
   * Provides improved positioning for inline reference elements that can span
   * over multiple lines, such as hyperlinks or range selections.
   * @see https://floating-ui.com/docs/inline
   */
  const inline = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'inline',
      options,
      async fn(state) {
        const {
          placement,
          elements,
          rects,
          platform,
          strategy
        } = state;
        // A MouseEvent's client{X,Y} coords can be up to 2 pixels off a
        // ClientRect's bounds, despite the event listener being triggered. A
        // padding of 2 seems to handle this issue.
        const {
          padding = 2,
          x,
          y
        } = evaluate(options, state);
        const nativeClientRects = Array.from((await (platform.getClientRects == null ? void 0 : platform.getClientRects(elements.reference))) || []);
        const clientRects = getRectsByLine(nativeClientRects);
        const fallback = rectToClientRect(getBoundingRect(nativeClientRects));
        const paddingObject = getSideObjectFromPadding(padding);
        function getBoundingClientRect() {
          // There are two rects and they are disjoined.
          if (clientRects.length === 2 && clientRects[0].left > clientRects[1].right && x != null && y != null) {
            // Find the first rect in which the point is fully inside.
            return clientRects.find(rect => x > rect.left - paddingObject.left && x < rect.right + paddingObject.right && y > rect.top - paddingObject.top && y < rect.bottom + paddingObject.bottom) || fallback;
          }

          // There are 2 or more connected rects.
          if (clientRects.length >= 2) {
            if (getMainAxisFromPlacement(placement) === 'x') {
              const firstRect = clientRects[0];
              const lastRect = clientRects[clientRects.length - 1];
              const isTop = getSide(placement) === 'top';
              const top = firstRect.top;
              const bottom = lastRect.bottom;
              const left = isTop ? firstRect.left : lastRect.left;
              const right = isTop ? firstRect.right : lastRect.right;
              const width = right - left;
              const height = bottom - top;
              return {
                top,
                bottom,
                left,
                right,
                width,
                height,
                x: left,
                y: top
              };
            }
            const isLeftSide = getSide(placement) === 'left';
            const maxRight = max(...clientRects.map(rect => rect.right));
            const minLeft = min(...clientRects.map(rect => rect.left));
            const measureRects = clientRects.filter(rect => isLeftSide ? rect.left === minLeft : rect.right === maxRight);
            const top = measureRects[0].top;
            const bottom = measureRects[measureRects.length - 1].bottom;
            const left = minLeft;
            const right = maxRight;
            const width = right - left;
            const height = bottom - top;
            return {
              top,
              bottom,
              left,
              right,
              width,
              height,
              x: left,
              y: top
            };
          }
          return fallback;
        }
        const resetRects = await platform.getElementRects({
          reference: {
            getBoundingClientRect
          },
          floating: elements.floating,
          strategy
        });
        if (rects.reference.x !== resetRects.reference.x || rects.reference.y !== resetRects.reference.y || rects.reference.width !== resetRects.reference.width || rects.reference.height !== resetRects.reference.height) {
          return {
            reset: {
              rects: resetRects
            }
          };
        }
        return {};
      }
    };
  };

  async function convertValueToCoords(state, options) {
    const {
      placement,
      platform,
      elements
    } = state;
    const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
    const side = getSide(placement);
    const alignment = getAlignment(placement);
    const isVertical = getMainAxisFromPlacement(placement) === 'x';
    const mainAxisMulti = ['left', 'top'].includes(side) ? -1 : 1;
    const crossAxisMulti = rtl && isVertical ? -1 : 1;
    const rawValue = evaluate(options, state);

    // eslint-disable-next-line prefer-const
    let {
      mainAxis,
      crossAxis,
      alignmentAxis
    } = typeof rawValue === 'number' ? {
      mainAxis: rawValue,
      crossAxis: 0,
      alignmentAxis: null
    } : {
      mainAxis: 0,
      crossAxis: 0,
      alignmentAxis: null,
      ...rawValue
    };
    if (alignment && typeof alignmentAxis === 'number') {
      crossAxis = alignment === 'end' ? alignmentAxis * -1 : alignmentAxis;
    }
    return isVertical ? {
      x: crossAxis * crossAxisMulti,
      y: mainAxis * mainAxisMulti
    } : {
      x: mainAxis * mainAxisMulti,
      y: crossAxis * crossAxisMulti
    };
  }

  /**
   * Modifies the placement by translating the floating element along the
   * specified axes.
   * A number (shorthand for `mainAxis` or distance), or an axes configuration
   * object may be passed.
   * @see https://floating-ui.com/docs/offset
   */
  const offset = function (options) {
    if (options === void 0) {
      options = 0;
    }
    return {
      name: 'offset',
      options,
      async fn(state) {
        const {
          x,
          y
        } = state;
        const diffCoords = await convertValueToCoords(state, options);
        return {
          x: x + diffCoords.x,
          y: y + diffCoords.y,
          data: diffCoords
        };
      }
    };
  };

  function getCrossAxis(axis) {
    return axis === 'x' ? 'y' : 'x';
  }

  /**
   * Optimizes the visibility of the floating element by shifting it in order to
   * keep it in view when it will overflow the clipping boundary.
   * @see https://floating-ui.com/docs/shift
   */
  const shift = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'shift',
      options,
      async fn(state) {
        const {
          x,
          y,
          placement
        } = state;
        const {
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = false,
          limiter = {
            fn: _ref => {
              let {
                x,
                y
              } = _ref;
              return {
                x,
                y
              };
            }
          },
          ...detectOverflowOptions
        } = evaluate(options, state);
        const coords = {
          x,
          y
        };
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const mainAxis = getMainAxisFromPlacement(getSide(placement));
        const crossAxis = getCrossAxis(mainAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];
        if (checkMainAxis) {
          const minSide = mainAxis === 'y' ? 'top' : 'left';
          const maxSide = mainAxis === 'y' ? 'bottom' : 'right';
          const min = mainAxisCoord + overflow[minSide];
          const max = mainAxisCoord - overflow[maxSide];
          mainAxisCoord = within(min, mainAxisCoord, max);
        }
        if (checkCrossAxis) {
          const minSide = crossAxis === 'y' ? 'top' : 'left';
          const maxSide = crossAxis === 'y' ? 'bottom' : 'right';
          const min = crossAxisCoord + overflow[minSide];
          const max = crossAxisCoord - overflow[maxSide];
          crossAxisCoord = within(min, crossAxisCoord, max);
        }
        const limitedCoords = limiter.fn({
          ...state,
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        });
        return {
          ...limitedCoords,
          data: {
            x: limitedCoords.x - x,
            y: limitedCoords.y - y
          }
        };
      }
    };
  };
  /**
   * Built-in `limiter` that will stop `shift()` at a certain point.
   */
  const limitShift = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      options,
      fn(state) {
        const {
          x,
          y,
          placement,
          rects,
          middlewareData
        } = state;
        const {
          offset = 0,
          mainAxis: checkMainAxis = true,
          crossAxis: checkCrossAxis = true
        } = evaluate(options, state);
        const coords = {
          x,
          y
        };
        const mainAxis = getMainAxisFromPlacement(placement);
        const crossAxis = getCrossAxis(mainAxis);
        let mainAxisCoord = coords[mainAxis];
        let crossAxisCoord = coords[crossAxis];
        const rawOffset = evaluate(offset, state);
        const computedOffset = typeof rawOffset === 'number' ? {
          mainAxis: rawOffset,
          crossAxis: 0
        } : {
          mainAxis: 0,
          crossAxis: 0,
          ...rawOffset
        };
        if (checkMainAxis) {
          const len = mainAxis === 'y' ? 'height' : 'width';
          const limitMin = rects.reference[mainAxis] - rects.floating[len] + computedOffset.mainAxis;
          const limitMax = rects.reference[mainAxis] + rects.reference[len] - computedOffset.mainAxis;
          if (mainAxisCoord < limitMin) {
            mainAxisCoord = limitMin;
          } else if (mainAxisCoord > limitMax) {
            mainAxisCoord = limitMax;
          }
        }
        if (checkCrossAxis) {
          var _middlewareData$offse, _middlewareData$offse2;
          const len = mainAxis === 'y' ? 'width' : 'height';
          const isOriginSide = ['top', 'left'].includes(getSide(placement));
          const limitMin = rects.reference[crossAxis] - rects.floating[len] + (isOriginSide ? ((_middlewareData$offse = middlewareData.offset) == null ? void 0 : _middlewareData$offse[crossAxis]) || 0 : 0) + (isOriginSide ? 0 : computedOffset.crossAxis);
          const limitMax = rects.reference[crossAxis] + rects.reference[len] + (isOriginSide ? 0 : ((_middlewareData$offse2 = middlewareData.offset) == null ? void 0 : _middlewareData$offse2[crossAxis]) || 0) - (isOriginSide ? computedOffset.crossAxis : 0);
          if (crossAxisCoord < limitMin) {
            crossAxisCoord = limitMin;
          } else if (crossAxisCoord > limitMax) {
            crossAxisCoord = limitMax;
          }
        }
        return {
          [mainAxis]: mainAxisCoord,
          [crossAxis]: crossAxisCoord
        };
      }
    };
  };

  /**
   * Provides data that allows you to change the size of the floating element —
   * for instance, prevent it from overflowing the clipping boundary or match the
   * width of the reference element.
   * @see https://floating-ui.com/docs/size
   */
  const size = function (options) {
    if (options === void 0) {
      options = {};
    }
    return {
      name: 'size',
      options,
      async fn(state) {
        const {
          placement,
          rects,
          platform,
          elements
        } = state;
        const {
          apply = () => {},
          ...detectOverflowOptions
        } = evaluate(options, state);
        const overflow = await detectOverflow(state, detectOverflowOptions);
        const side = getSide(placement);
        const alignment = getAlignment(placement);
        const axis = getMainAxisFromPlacement(placement);
        const isXAxis = axis === 'x';
        const {
          width,
          height
        } = rects.floating;
        let heightSide;
        let widthSide;
        if (side === 'top' || side === 'bottom') {
          heightSide = side;
          widthSide = alignment === ((await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating))) ? 'start' : 'end') ? 'left' : 'right';
        } else {
          widthSide = side;
          heightSide = alignment === 'end' ? 'top' : 'bottom';
        }
        const overflowAvailableHeight = height - overflow[heightSide];
        const overflowAvailableWidth = width - overflow[widthSide];
        const noShift = !state.middlewareData.shift;
        let availableHeight = overflowAvailableHeight;
        let availableWidth = overflowAvailableWidth;
        if (isXAxis) {
          const maximumClippingWidth = width - overflow.left - overflow.right;
          availableWidth = alignment || noShift ? min(overflowAvailableWidth, maximumClippingWidth) : maximumClippingWidth;
        } else {
          const maximumClippingHeight = height - overflow.top - overflow.bottom;
          availableHeight = alignment || noShift ? min(overflowAvailableHeight, maximumClippingHeight) : maximumClippingHeight;
        }
        if (noShift && !alignment) {
          const xMin = max(overflow.left, 0);
          const xMax = max(overflow.right, 0);
          const yMin = max(overflow.top, 0);
          const yMax = max(overflow.bottom, 0);
          if (isXAxis) {
            availableWidth = width - 2 * (xMin !== 0 || xMax !== 0 ? xMin + xMax : max(overflow.left, overflow.right));
          } else {
            availableHeight = height - 2 * (yMin !== 0 || yMax !== 0 ? yMin + yMax : max(overflow.top, overflow.bottom));
          }
        }
        await apply({
          ...state,
          availableWidth,
          availableHeight
        });
        const nextDimensions = await platform.getDimensions(elements.floating);
        if (width !== nextDimensions.width || height !== nextDimensions.height) {
          return {
            reset: {
              rects: true
            }
          };
        }
        return {};
      }
    };
  };

  exports.arrow = arrow;
  exports.autoPlacement = autoPlacement;
  exports.computePosition = computePosition;
  exports.detectOverflow = detectOverflow;
  exports.flip = flip;
  exports.hide = hide;
  exports.inline = inline;
  exports.limitShift = limitShift;
  exports.offset = offset;
  exports.rectToClientRect = rectToClientRect;
  exports.shift = shift;
  exports.size = size;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
;
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('@floating-ui/core')) :
    typeof define === 'function' && define.amd ? define(['exports', '@floating-ui/core'], factory) :
      (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.FloatingUIDOM = {}, global.FloatingUICore));
})(this, (function (exports, core) { 'use strict';

  function getWindow(node) {
    var _node$ownerDocument;
    return ((_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
  }

  function getComputedStyle$1(element) {
    return getWindow(element).getComputedStyle(element);
  }

  function isNode(value) {
    return value instanceof getWindow(value).Node;
  }
  function getNodeName(node) {
    if (isNode(node)) {
      return (node.nodeName || '').toLowerCase();
    }
    // Mocked nodes in testing environments may not be instances of Node. By
    // returning `#document` an infinite loop won't occur.
    // https://github.com/floating-ui/floating-ui/issues/2317
    return '#document';
  }

  function isHTMLElement(value) {
    return value instanceof getWindow(value).HTMLElement;
  }
  function isElement(value) {
    return value instanceof getWindow(value).Element;
  }
  function isShadowRoot(node) {
    // Browsers without `ShadowRoot` support.
    if (typeof ShadowRoot === 'undefined') {
      return false;
    }
    return node instanceof getWindow(node).ShadowRoot || node instanceof ShadowRoot;
  }
  function isOverflowElement(element) {
    const {
      overflow,
      overflowX,
      overflowY,
      display
    } = getComputedStyle$1(element);
    return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !['inline', 'contents'].includes(display);
  }
  function isTableElement(element) {
    return ['table', 'td', 'th'].includes(getNodeName(element));
  }
  function isContainingBlock(element) {
    const safari = isSafari();
    const css = getComputedStyle$1(element);

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    return css.transform !== 'none' || css.perspective !== 'none' || !safari && (css.backdropFilter ? css.backdropFilter !== 'none' : false) || !safari && (css.filter ? css.filter !== 'none' : false) || ['transform', 'perspective', 'filter'].some(value => (css.willChange || '').includes(value)) || ['paint', 'layout', 'strict', 'content'].some(value => (css.contain || '').includes(value));
  }
  function isSafari() {
    if (typeof CSS === 'undefined' || !CSS.supports) return false;
    return CSS.supports('-webkit-backdrop-filter', 'none');
  }
  function isLastTraversableNode(node) {
    return ['html', 'body', '#document'].includes(getNodeName(node));
  }

  const min = Math.min;
  const max = Math.max;
  const round = Math.round;
  const floor = Math.floor;
  const createEmptyCoords = v => ({
    x: v,
    y: v
  });

  function getCssDimensions(element) {
    const css = getComputedStyle$1(element);
    // In testing environments, the `width` and `height` properties are empty
    // strings for SVG elements, returning NaN. Fallback to `0` in this case.
    let width = parseFloat(css.width) || 0;
    let height = parseFloat(css.height) || 0;
    const hasOffset = isHTMLElement(element);
    const offsetWidth = hasOffset ? element.offsetWidth : width;
    const offsetHeight = hasOffset ? element.offsetHeight : height;
    const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
    if (shouldFallback) {
      width = offsetWidth;
      height = offsetHeight;
    }
    return {
      width,
      height,
      $: shouldFallback
    };
  }

  function unwrapElement(element) {
    return !isElement(element) ? element.contextElement : element;
  }

  function getScale(element) {
    const domElement = unwrapElement(element);
    if (!isHTMLElement(domElement)) {
      return createEmptyCoords(1);
    }
    const rect = domElement.getBoundingClientRect();
    const {
      width,
      height,
      $
    } = getCssDimensions(domElement);
    let x = ($ ? round(rect.width) : rect.width) / width;
    let y = ($ ? round(rect.height) : rect.height) / height;

    // 0, NaN, or Infinity should always fallback to 1.

    if (!x || !Number.isFinite(x)) {
      x = 1;
    }
    if (!y || !Number.isFinite(y)) {
      y = 1;
    }
    return {
      x,
      y
    };
  }

  const noOffsets = /*#__PURE__*/createEmptyCoords(0);
  function getVisualOffsets(element, isFixed, floatingOffsetParent) {
    var _win$visualViewport, _win$visualViewport2;
    if (isFixed === void 0) {
      isFixed = true;
    }
    if (!isSafari()) {
      return noOffsets;
    }
    const win = element ? getWindow(element) : window;
    if (!floatingOffsetParent || isFixed && floatingOffsetParent !== win) {
      return noOffsets;
    }
    return {
      x: ((_win$visualViewport = win.visualViewport) == null ? void 0 : _win$visualViewport.offsetLeft) || 0,
      y: ((_win$visualViewport2 = win.visualViewport) == null ? void 0 : _win$visualViewport2.offsetTop) || 0
    };
  }

  function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
    if (includeScale === void 0) {
      includeScale = false;
    }
    if (isFixedStrategy === void 0) {
      isFixedStrategy = false;
    }
    const clientRect = element.getBoundingClientRect();
    const domElement = unwrapElement(element);
    let scale = createEmptyCoords(1);
    if (includeScale) {
      if (offsetParent) {
        if (isElement(offsetParent)) {
          scale = getScale(offsetParent);
        }
      } else {
        scale = getScale(element);
      }
    }
    const visualOffsets = getVisualOffsets(domElement, isFixedStrategy, offsetParent);
    let x = (clientRect.left + visualOffsets.x) / scale.x;
    let y = (clientRect.top + visualOffsets.y) / scale.y;
    let width = clientRect.width / scale.x;
    let height = clientRect.height / scale.y;
    if (domElement) {
      const win = getWindow(domElement);
      const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
      let currentIFrame = win.frameElement;
      while (currentIFrame && offsetParent && offsetWin !== win) {
        const iframeScale = getScale(currentIFrame);
        const iframeRect = currentIFrame.getBoundingClientRect();
        const css = getComputedStyle(currentIFrame);
        const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
        const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
        x *= iframeScale.x;
        y *= iframeScale.y;
        width *= iframeScale.x;
        height *= iframeScale.y;
        x += left;
        y += top;
        currentIFrame = getWindow(currentIFrame).frameElement;
      }
    }
    return core.rectToClientRect({
      width,
      height,
      x,
      y
    });
  }

  function getDocumentElement(node) {
    return ((isNode(node) ? node.ownerDocument : node.document) || window.document).documentElement;
  }

  function getNodeScroll(element) {
    if (isElement(element)) {
      return {
        scrollLeft: element.scrollLeft,
        scrollTop: element.scrollTop
      };
    }
    return {
      scrollLeft: element.pageXOffset,
      scrollTop: element.pageYOffset
    };
  }

  function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
    let {
      rect,
      offsetParent,
      strategy
    } = _ref;
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    if (offsetParent === documentElement) {
      return rect;
    }
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    let scale = createEmptyCoords(1);
    const offsets = createEmptyCoords(0);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && strategy !== 'fixed') {
      if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        const offsetRect = getBoundingClientRect(offsetParent);
        scale = getScale(offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      }
    }
    return {
      width: rect.width * scale.x,
      height: rect.height * scale.y,
      x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
      y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
    };
  }

  function getWindowScrollBarX(element) {
    // If <html> has a CSS width greater than the viewport, then this will be
    // incorrect for RTL.
    return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft;
  }

  // Gets the entire size of the scrollable document area, even extending outside
  // of the `<html>` and `<body>` rect bounds if horizontally scrollable.
  function getDocumentRect(element) {
    const html = getDocumentElement(element);
    const scroll = getNodeScroll(element);
    const body = element.ownerDocument.body;
    const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
    const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
    let x = -scroll.scrollLeft + getWindowScrollBarX(element);
    const y = -scroll.scrollTop;
    if (getComputedStyle$1(body).direction === 'rtl') {
      x += max(html.clientWidth, body.clientWidth) - width;
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  function getParentNode(node) {
    if (getNodeName(node) === 'html') {
      return node;
    }
    const result =
      // Step into the shadow DOM of the parent of a slotted node.
      node.assignedSlot ||
      // DOM Element detected.
      node.parentNode ||
      // ShadowRoot detected.
      isShadowRoot(node) && node.host ||
      // Fallback.
      getDocumentElement(node);
    return isShadowRoot(result) ? result.host : result;
  }

  function getNearestOverflowAncestor(node) {
    const parentNode = getParentNode(node);
    if (isLastTraversableNode(parentNode)) {
      return node.ownerDocument ? node.ownerDocument.body : node.body;
    }
    if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
      return parentNode;
    }
    return getNearestOverflowAncestor(parentNode);
  }

  function getOverflowAncestors(node, list) {
    var _node$ownerDocument;
    if (list === void 0) {
      list = [];
    }
    const scrollableAncestor = getNearestOverflowAncestor(node);
    const isBody = scrollableAncestor === ((_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.body);
    const win = getWindow(scrollableAncestor);
    if (isBody) {
      return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : []);
    }
    return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor));
  }

  function getViewportRect(element, strategy) {
    const win = getWindow(element);
    const html = getDocumentElement(element);
    const visualViewport = win.visualViewport;
    let width = html.clientWidth;
    let height = html.clientHeight;
    let x = 0;
    let y = 0;
    if (visualViewport) {
      width = visualViewport.width;
      height = visualViewport.height;
      const visualViewportBased = isSafari();
      if (!visualViewportBased || visualViewportBased && strategy === 'fixed') {
        x = visualViewport.offsetLeft;
        y = visualViewport.offsetTop;
      }
    }
    return {
      width,
      height,
      x,
      y
    };
  }

  // Returns the inner client rect, subtracting scrollbars if present.
  function getInnerBoundingClientRect(element, strategy) {
    const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
    const top = clientRect.top + element.clientTop;
    const left = clientRect.left + element.clientLeft;
    const scale = isHTMLElement(element) ? getScale(element) : createEmptyCoords(1);
    const width = element.clientWidth * scale.x;
    const height = element.clientHeight * scale.y;
    const x = left * scale.x;
    const y = top * scale.y;
    return {
      width,
      height,
      x,
      y
    };
  }
  function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
    let rect;
    if (clippingAncestor === 'viewport') {
      rect = getViewportRect(element, strategy);
    } else if (clippingAncestor === 'document') {
      rect = getDocumentRect(getDocumentElement(element));
    } else if (isElement(clippingAncestor)) {
      rect = getInnerBoundingClientRect(clippingAncestor, strategy);
    } else {
      const visualOffsets = getVisualOffsets(element);
      rect = {
        ...clippingAncestor,
        x: clippingAncestor.x - visualOffsets.x,
        y: clippingAncestor.y - visualOffsets.y
      };
    }
    return core.rectToClientRect(rect);
  }
  function hasFixedPositionAncestor(element, stopNode) {
    const parentNode = getParentNode(element);
    if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
      return false;
    }
    return getComputedStyle$1(parentNode).position === 'fixed' || hasFixedPositionAncestor(parentNode, stopNode);
  }

  // A "clipping ancestor" is an `overflow` element with the characteristic of
  // clipping (or hiding) child elements. This returns all clipping ancestors
  // of the given element up the tree.
  function getClippingElementAncestors(element, cache) {
    const cachedResult = cache.get(element);
    if (cachedResult) {
      return cachedResult;
    }
    let result = getOverflowAncestors(element).filter(el => isElement(el) && getNodeName(el) !== 'body');
    let currentContainingBlockComputedStyle = null;
    const elementIsFixed = getComputedStyle$1(element).position === 'fixed';
    let currentNode = elementIsFixed ? getParentNode(element) : element;

    // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
    while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
      const computedStyle = getComputedStyle$1(currentNode);
      const currentNodeIsContaining = isContainingBlock(currentNode);
      if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
        currentContainingBlockComputedStyle = null;
      }
      const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === 'static' && !!currentContainingBlockComputedStyle && ['absolute', 'fixed'].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
      if (shouldDropCurrentNode) {
        // Drop non-containing blocks.
        result = result.filter(ancestor => ancestor !== currentNode);
      } else {
        // Record last containing block for next iteration.
        currentContainingBlockComputedStyle = computedStyle;
      }
      currentNode = getParentNode(currentNode);
    }
    cache.set(element, result);
    return result;
  }

  // Gets the maximum area that the element is visible in due to any number of
  // clipping ancestors.
  function getClippingRect(_ref) {
    let {
      element,
      boundary,
      rootBoundary,
      strategy
    } = _ref;
    const elementClippingAncestors = boundary === 'clippingAncestors' ? getClippingElementAncestors(element, this._c) : [].concat(boundary);
    const clippingAncestors = [...elementClippingAncestors, rootBoundary];
    const firstClippingAncestor = clippingAncestors[0];
    const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
      const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
      accRect.top = max(rect.top, accRect.top);
      accRect.right = min(rect.right, accRect.right);
      accRect.bottom = min(rect.bottom, accRect.bottom);
      accRect.left = max(rect.left, accRect.left);
      return accRect;
    }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
    return {
      width: clippingRect.right - clippingRect.left,
      height: clippingRect.bottom - clippingRect.top,
      x: clippingRect.left,
      y: clippingRect.top
    };
  }

  function getDimensions(element) {
    return getCssDimensions(element);
  }

  function getTrueOffsetParent(element, polyfill) {
    if (!isHTMLElement(element) || getComputedStyle$1(element).position === 'fixed') {
      return null;
    }
    if (polyfill) {
      return polyfill(element);
    }
    return element.offsetParent;
  }
  function getContainingBlock(element) {
    let currentNode = getParentNode(element);
    while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
      if (isContainingBlock(currentNode)) {
        return currentNode;
      } else {
        currentNode = getParentNode(currentNode);
      }
    }
    return null;
  }

  // Gets the closest ancestor positioned element. Handles some edge cases,
  // such as table ancestors and cross browser bugs.
  function getOffsetParent(element, polyfill) {
    const window = getWindow(element);
    if (!isHTMLElement(element)) {
      return window;
    }
    let offsetParent = getTrueOffsetParent(element, polyfill);
    while (offsetParent && isTableElement(offsetParent) && getComputedStyle$1(offsetParent).position === 'static') {
      offsetParent = getTrueOffsetParent(offsetParent, polyfill);
    }
    if (offsetParent && (getNodeName(offsetParent) === 'html' || getNodeName(offsetParent) === 'body' && getComputedStyle$1(offsetParent).position === 'static' && !isContainingBlock(offsetParent))) {
      return window;
    }
    return offsetParent || getContainingBlock(element) || window;
  }

  function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
    const isOffsetParentAnElement = isHTMLElement(offsetParent);
    const documentElement = getDocumentElement(offsetParent);
    const isFixed = strategy === 'fixed';
    const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
    let scroll = {
      scrollLeft: 0,
      scrollTop: 0
    };
    const offsets = createEmptyCoords(0);
    if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
      if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
        scroll = getNodeScroll(offsetParent);
      }
      if (isHTMLElement(offsetParent)) {
        const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
        offsets.x = offsetRect.x + offsetParent.clientLeft;
        offsets.y = offsetRect.y + offsetParent.clientTop;
      } else if (documentElement) {
        offsets.x = getWindowScrollBarX(documentElement);
      }
    }
    return {
      x: rect.left + scroll.scrollLeft - offsets.x,
      y: rect.top + scroll.scrollTop - offsets.y,
      width: rect.width,
      height: rect.height
    };
  }

  const platform = {
    getClippingRect,
    convertOffsetParentRelativeRectToViewportRelativeRect,
    isElement,
    getDimensions,
    getOffsetParent,
    getDocumentElement,
    getScale,
    async getElementRects(_ref) {
      let {
        reference,
        floating,
        strategy
      } = _ref;
      const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
      const getDimensionsFn = this.getDimensions;
      return {
        reference: getRectRelativeToOffsetParent(reference, await getOffsetParentFn(floating), strategy),
        floating: {
          x: 0,
          y: 0,
          ...(await getDimensionsFn(floating))
        }
      };
    },
    getClientRects: element => Array.from(element.getClientRects()),
    isRTL: element => getComputedStyle$1(element).direction === 'rtl'
  };

  // https://samthor.au/2021/observing-dom/
  function observeMove(element, onMove) {
    let io = null;
    let timeoutId;
    const root = getDocumentElement(element);
    function cleanup() {
      clearTimeout(timeoutId);
      io && io.disconnect();
      io = null;
    }
    function refresh(skip, threshold) {
      if (skip === void 0) {
        skip = false;
      }
      if (threshold === void 0) {
        threshold = 1;
      }
      cleanup();
      const {
        left,
        top,
        width,
        height
      } = element.getBoundingClientRect();
      if (!skip) {
        onMove();
      }
      if (!width || !height) {
        return;
      }
      const insetTop = floor(top);
      const insetRight = floor(root.clientWidth - (left + width));
      const insetBottom = floor(root.clientHeight - (top + height));
      const insetLeft = floor(left);
      const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
      let isFirstUpdate = true;
      io = new IntersectionObserver(entries => {
        const ratio = entries[0].intersectionRatio;
        if (ratio !== threshold) {
          if (!isFirstUpdate) {
            return refresh();
          }
          if (ratio === 0) {
            timeoutId = setTimeout(() => {
              refresh(false, 1e-7);
            }, 100);
          } else {
            refresh(false, ratio);
          }
        }
        isFirstUpdate = false;
      }, {
        rootMargin,
        threshold
      });
      io.observe(element);
    }
    refresh(true);
    return cleanup;
  }

  /**
   * Automatically updates the position of the floating element when necessary.
   * Should only be called when the floating element is mounted on the DOM or
   * visible on the screen.
   * @returns cleanup function that should be invoked when the floating element is
   * removed from the DOM or hidden from the screen.
   * @see https://floating-ui.com/docs/autoUpdate
   */
  function autoUpdate(reference, floating, update, options) {
    if (options === void 0) {
      options = {};
    }
    const {
      ancestorScroll = true,
      ancestorResize = true,
      elementResize = true,
      layoutShift = typeof IntersectionObserver === 'function',
      animationFrame = false
    } = options;
    const referenceEl = unwrapElement(reference);
    const ancestors = ancestorScroll || ancestorResize ? [...(referenceEl ? getOverflowAncestors(referenceEl) : []), ...getOverflowAncestors(floating)] : [];
    ancestors.forEach(ancestor => {
      ancestorScroll && ancestor.addEventListener('scroll', update, {
        passive: true
      });
      ancestorResize && ancestor.addEventListener('resize', update);
    });
    const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
    let resizeObserver = null;
    if (elementResize) {
      resizeObserver = new ResizeObserver(update);
      if (referenceEl && !animationFrame) {
        resizeObserver.observe(referenceEl);
      }
      resizeObserver.observe(floating);
    }
    let frameId;
    let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
    if (animationFrame) {
      frameLoop();
    }
    function frameLoop() {
      const nextRefRect = getBoundingClientRect(reference);
      if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
        update();
      }
      prevRefRect = nextRefRect;
      frameId = requestAnimationFrame(frameLoop);
    }
    update();
    return () => {
      ancestors.forEach(ancestor => {
        ancestorScroll && ancestor.removeEventListener('scroll', update);
        ancestorResize && ancestor.removeEventListener('resize', update);
      });
      cleanupIo && cleanupIo();
      resizeObserver && resizeObserver.disconnect();
      resizeObserver = null;
      if (animationFrame) {
        cancelAnimationFrame(frameId);
      }
    };
  }

  /**
   * Computes the `x` and `y` coordinates that will place the floating element
   * next to a reference element when it is given a certain CSS positioning
   * strategy.
   */
  const computePosition = (reference, floating, options) => {
    // This caches the expensive `getClippingElementAncestors` function so that
    // multiple lifecycle resets re-use the same result. It only lives for a
    // single call. If other functions become expensive, we can add them as well.
    const cache = new Map();
    const mergedOptions = {
      platform,
      ...options
    };
    const platformWithCache = {
      ...mergedOptions.platform,
      _c: cache
    };
    return core.computePosition(reference, floating, {
      ...mergedOptions,
      platform: platformWithCache
    });
  };

  Object.defineProperty(exports, 'arrow', {
    enumerable: true,
    get: function () { return core.arrow; }
  });
  Object.defineProperty(exports, 'autoPlacement', {
    enumerable: true,
    get: function () { return core.autoPlacement; }
  });
  Object.defineProperty(exports, 'detectOverflow', {
    enumerable: true,
    get: function () { return core.detectOverflow; }
  });
  Object.defineProperty(exports, 'flip', {
    enumerable: true,
    get: function () { return core.flip; }
  });
  Object.defineProperty(exports, 'hide', {
    enumerable: true,
    get: function () { return core.hide; }
  });
  Object.defineProperty(exports, 'inline', {
    enumerable: true,
    get: function () { return core.inline; }
  });
  Object.defineProperty(exports, 'limitShift', {
    enumerable: true,
    get: function () { return core.limitShift; }
  });
  Object.defineProperty(exports, 'offset', {
    enumerable: true,
    get: function () { return core.offset; }
  });
  Object.defineProperty(exports, 'shift', {
    enumerable: true,
    get: function () { return core.shift; }
  });
  Object.defineProperty(exports, 'size', {
    enumerable: true,
    get: function () { return core.size; }
  });
  exports.autoUpdate = autoUpdate;
  exports.computePosition = computePosition;
  exports.getOverflowAncestors = getOverflowAncestors;
  exports.platform = platform;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
;
((Drupal,once,{computePosition,offset,arrow,shift,flip})=>{let sidebar;const breakpointLarge=1280;let firstFocusableEl;const firstLevelToolbarItems=Array.from(document.querySelectorAll('.navigation__logo, .toolbar-menu > .toolbar-menu__item--level-1 > .toolbar-link'));const keys={tab:9,esc:27,space:32};let currentIndex,subIndex;function isNavExpanded(){return document.documentElement.classList.contains('admin-toolbar-expanded');}function autoExpandToActiveMenuItem(){const activeItems=sidebar.querySelectorAll('.is-active');closeAllSubmenus();activeItems.forEach((activeItem)=>{activeItem?.closest('.toolbar-menu__item.toolbar-menu__item--level-2')?.classList.add('toolbar-menu__item--expanded');activeItem?.closest('.toolbar-menu__item.toolbar-menu__item--level-2')?.classList.add('active-path');activeItem?.closest('.toolbar-menu__item.toolbar-menu__item--level-1')?.classList.add('active-path');});const expandedTray=sidebar.querySelector('.toolbar-menu__item.toolbar-menu__item--expanded');expandedTray?.scrollIntoView({behavior:'smooth'});}function markCurrentPageInMenu(){const sidebarLinks=sidebar.querySelectorAll('a.toolbar-link:not(.menu--shortcuts *):not(.toolbar-link--create)');sidebarLinks.forEach((link)=>{if(link.href===document.URL)link.parentElement.classList.add('current','is-active');});const sidebarTitles=sidebar.querySelectorAll('.toolbar-menu__item--level-1[data-url]');sidebarTitles.forEach((title)=>{if(title.getAttribute('data-url')===window.location.pathname)title.querySelector('a.toolbar-link')?.classList.add('current','is-active');});}function expandCollapseSidebar(toState){const expandCollapseButton=sidebar.querySelector('[aria-controls="admin-toolbar"]');if(toState)closeTooltip();document.documentElement.classList.toggle('admin-toolbar-expanded',toState);Drupal.displace(true);sidebar.querySelector('#sidebar-state').textContent=toState?Drupal.t('Collapse sidebar'):Drupal.t('Expand sidebar');expandCollapseButton.setAttribute('aria-expanded',toState);localStorage.setItem('Drupal.navigation.sidebarExpanded',toState);autoExpandToActiveMenuItem();if(toState)flyoutTooltipDetach();else flyoutTooltipInit();if(toState===true&&window.innerWidth<breakpointLarge)Drupal.ginSidebar?.collapseSidebar();}function positionFlyout(hoveredEl){const anchorEl=hoveredEl.querySelector('.toolbar-link');const flyoutEl=document.getElementById(anchorEl.getAttribute('aria-controls'));const arrowEl=flyoutEl?.querySelector('.toolbar-menu__arrow-ref');computePosition(anchorEl,flyoutEl,{placement:'right',middleware:[offset(6),flip({padding:16}),shift({padding:16}),arrow({element:arrowEl})]}).then(({x,y,placement,middlewareData})=>{Object.assign(flyoutEl.style,{left:`${x}px`,top:`${y}px`});const {x:arrowX,y:arrowY}=middlewareData.arrow;const staticSide={top:'bottom',right:'left',bottom:'top',left:'right'}[placement.split('-')[0]];Object.assign(arrowEl.style,{left:arrowX!=null?`${arrowX}px`:'',top:arrowY!=null?`${arrowY}px`:'',right:'',bottom:'',[staticSide]:'-4px'});});}function positionTooltip(hoveredEl){const anchorEl=hoveredEl.querySelector('.toolbar-link');const tooltipEl=document.querySelector('.gin-tooltip-navigation');computePosition(anchorEl,tooltipEl,{placement:'right',middleware:[offset(6),flip({padding:16}),shift({padding:16})]}).then(({x,y})=>{Object.assign(tooltipEl.style,{left:`${x}px`,top:`${y}px`});});}function closeFlyoutOnClickOutside(e){if(isNavExpanded())return;if(!e.target.closest('.cloned-flyout'))closeFlyout();}function openFlyout(e){const hoveredEl=e.target?e.target:e.parentElement;const buttonEl=hoveredEl.querySelector('.toolbar-link');const clonedFlyout=hoveredEl.querySelector('.toolbar-menu__submenu').cloneNode(true);const clonedFlyoutId=`${hoveredEl.id}--flyout-clone`;closeFlyout();closeTooltip();buttonEl.setAttribute('aria-controls',clonedFlyoutId);buttonEl.setAttribute('aria-expanded',true);clonedFlyout.setAttribute('id',clonedFlyoutId);clonedFlyout.classList.add('cloned-flyout');document.querySelector('body').append(clonedFlyout);clonedFlyout.querySelectorAll('.toolbar-menu__item--has-dropdown > button').forEach((el)=>el.addEventListener('click',(e)=>{const dataUrl=el.getAttribute('data-url');if((e.ctrlKey||e.shiftKey||e.altKey||e.metaKey)&&dataUrl)window.open(dataUrl,'_blank');else openCloseSubmenu(e.currentTarget.parentElement);}));const flyoutEls=document.querySelectorAll('.cloned-flyout .toolbar-menu__item--level-2 > .toolbar-link, .cloned-flyout .toolbar-menu__item--level-3 > .toolbar-link');flyoutEls?.forEach((el)=>{el.addEventListener('keydown',handleKeydownFlyout,false);});positionFlyout(hoveredEl);hoveredEl.classList.add('toolbar-menu__item--expanded');clonedFlyout.addEventListener('mouseleave',delayedFlyoutClose,false);document.addEventListener('click',closeFlyoutOnClickOutside,false);autoExpandToActiveMenuItem();}function openTooltip(e){closeFlyout();closeTooltip();const hoveredEl=e.target;const clonedTooltip=hoveredEl.querySelector('.toolbar-link > span').cloneNode(true);clonedTooltip.classList.add('gin-tooltip-navigation');document.querySelector('body').append(clonedTooltip);if(!hoveredEl.classList.contains('toolbar-menu__item--expanded'))positionTooltip(hoveredEl);}function closeFlyout(){if(!isNavExpanded()){const flyoutEls=document.querySelectorAll('.cloned-flyout .toolbar-menu__item--level-2, .cloned-flyout .toolbar-menu__item--level-3');flyoutEls?.forEach((el)=>{el.removeEventListener('keydown',handleKeydownFlyout);});const clonedFlyout=document.querySelector('.cloned-flyout');const clonedFlyoutControl=document.querySelector(`[aria-controls=${clonedFlyout?.id}]`);clonedFlyoutControl?.removeAttribute('aria-controls');clonedFlyoutControl?.setAttribute('aria-expanded',false);closeAllSubmenus();clonedFlyout?.removeEventListener('mouseleave',delayedFlyoutClose);clonedFlyout?.remove();document.removeEventListener('click',closeFlyoutOnClickOutside);}}function closeTooltip(){if(!isNavExpanded()){const clonedTooltip=document.querySelector('.gin-tooltip-navigation');clonedTooltip?.remove();}}function delayedFlyoutClose(e){const parentListItem=e.currentTarget;const currentFlyout=document.querySelector('.cloned-flyout');if(currentFlyout.contains(document.activeElement))return;timer=setTimeout(()=>{closeFlyout();parentListItem.removeEventListener('mouseover',()=>clearTimeout(timer),{once:true});},400);parentListItem.addEventListener('mouseover',()=>clearTimeout(timer),{once:true});}function handleKeydownTopLevel(event){currentIndex=firstLevelToolbarItems.indexOf(event.target);switch(event.keyCode){case keys.tab:if(event.shiftKey){currentIndex--;firstLevelToolbarItems[currentIndex]?.focus();}else{currentIndex++;if(firstLevelToolbarItems[currentIndex])firstLevelToolbarItems[currentIndex].focus();else firstFocusableEl.focus();}event.preventDefault();break;case keys.space:if(this.parentElement.classList.contains('toolbar-menu__item--has-dropdown')){openFlyout(this);window.setTimeout(()=>document.querySelector('.cloned-flyout .toolbar-menu__item--level-2 .toolbar-link').focus(),0);}event.preventDefault();break;case keys.esc:firstFocusableEl.focus();event.preventDefault();break;}}function handleKeydownFlyout(event){let flyoutEls=Array.from(document.querySelectorAll('.cloned-flyout .toolbar-menu__item--level-2 > .toolbar-link, .cloned-flyout .toolbar-menu__item--expanded .toolbar-menu__item--level-3 .toolbar-link'));;subIndex=flyoutEls.indexOf(event.target);switch(event.keyCode){case keys.tab:if(event.shiftKey)if(document.activeElement==event.target.parentElement.querySelector('li:nth-child(2) .toolbar-link')&&document.activeElement.parentElement.classList.contains('toolbar-menu__item--level-2')){currentIndex--;window.setTimeout(()=>firstLevelToolbarItems[currentIndex].focus(),0);closeFlyout();subIndex=1;}else{subIndex--;window.setTimeout(()=>flyoutEls[subIndex].focus(),0);}else if(document.activeElement==event.target.parentElement.querySelector('li:last-of-type .toolbar-link')&&document.activeElement.parentElement.classList.contains('toolbar-menu__item--level-2')){currentIndex++;window.setTimeout(()=>firstLevelToolbarItems[currentIndex].focus(),0);closeFlyout();subIndex=1;}else{subIndex++;window.setTimeout(()=>flyoutEls[subIndex].focus(),0);}event.preventDefault();break;case keys.space:{const thirdLevel=event.target.parentElement.querySelectorAll('.toolbar-menu__item--level-3 .toolbar-link');let indexToAdd=flyoutEls.indexOf(event.target)+1;thirdLevel.forEach((item)=>{flyoutEls.splice(indexToAdd,0,item);indexToAdd++;});subIndex++;window.setTimeout(()=>flyoutEls[subIndex].focus(),0);break;}case keys.esc:if(document.querySelector('.cloned-flyout')){currentIndex++;firstLevelToolbarItems[currentIndex].focus();closeFlyout();subIndex=1;}event.preventDefault();break;}}function flyoutTooltipInit(){sidebar.querySelectorAll('.toolbar-menu__item--level-1 > .toolbar-menu__submenu')?.forEach((flyoutEl)=>{const parentListItem=flyoutEl.parentElement;parentListItem.addEventListener('mouseenter',openFlyout,false);});sidebar.querySelectorAll('.toolbar-menu__item--level-1:not(.toolbar-menu__item--has-dropdown) > .toolbar-link')?.forEach((tooltipEl)=>{const parentListItem=tooltipEl.parentElement;parentListItem.addEventListener('mouseenter',openTooltip,false);parentListItem.addEventListener('mouseleave',closeTooltip,false);});currentIndex=0;subIndex=1;firstFocusableEl=getFirstFocusableEl();firstLevelToolbarItems?.forEach((firstLevelEl)=>{firstLevelEl.addEventListener('keydown',handleKeydownTopLevel,false);});}function flyoutTooltipDetach(){sidebar.querySelectorAll('.toolbar-menu__item--level-1 > .toolbar-menu__submenu')?.forEach((flyoutEl)=>{const parentListItem=flyoutEl.parentElement;parentListItem.removeEventListener('mouseenter',openFlyout);});sidebar.querySelectorAll('.toolbar-menu__item--level-1:not(.toolbar-menu__item--has-dropdown) > .toolbar-link')?.forEach((tooltipEl)=>{const parentListItem=tooltipEl.parentElement;parentListItem.removeEventListener('mouseenter',openTooltip);parentListItem.removeEventListener('mouseleave',closeTooltip);});firstLevelToolbarItems?.forEach((firstLevelEl)=>{firstLevelEl.removeEventListener('keydown',handleKeydownTopLevel);});}function closeAllSubmenus(Element){const submenuParentElement=Element??sidebar;const selectorsToIgnore='.sidebar-toggle';let itemsToClose=submenuParentElement.querySelectorAll('.toolbar-menu__item--expanded');if(!isNavExpanded())itemsToClose=submenuParentElement.querySelectorAll('.toolbar-menu__item--expanded:not(.active-path)');itemsToClose.forEach((el)=>el.classList.remove('toolbar-menu__item--expanded'));submenuParentElement.querySelectorAll(`.toolbar-link[aria-expanded="true"]:not(:is(${selectorsToIgnore}))`).forEach((el)=>{el.setAttribute('aria-expanded',false);el.querySelector('.toolbar-link__action').textContent=Drupal.t('Extend');});}function openCloseSubmenu(parentListItem,state){toState=state??parentListItem.classList.contains('toolbar-menu__item--expanded');const buttonEl=parentListItem.querySelector('button.toolbar-link');if(buttonEl.matches('.toolbar-menu__item.toolbar-menu__item--level-1 > *'))closeAllSubmenus();else closeAllSubmenus(parentListItem.parentElement);parentListItem.classList.toggle('toolbar-menu__item--expanded',!toState);buttonEl.setAttribute('aria-expanded',toState);buttonEl.querySelector('.toolbar-link__action').textContent=toState?Drupal.t('Extend'):Drupal.t('Collapse');}function initDisplace(){const displaceElement=sidebar.querySelector('.admin-toolbar__displace-placeholder');const edge=document.documentElement.dir==='rtl'?'right':'left';displaceElement.setAttribute(`data-offset-${edge}`,'');Drupal.displace(true);}function getFirstFocusableEl(){const nextEl=sidebar.nextElementSibling.tagName=='SCRIPT'?sidebar.nextElementSibling.nextElementSibling:sidebar.nextElementSibling;const focusableEls=nextEl.querySelectorAll('input:not([disabled]), select:not([disabled]), textarea:not([disabled]), iframe, [href], button, [tabindex="-1"]');return focusableEls[0];}function init(el){sidebar=el;firstFocusableEl=getFirstFocusableEl();const expandCollapseButton=sidebar.querySelector('[aria-controls="admin-toolbar"]');markCurrentPageInMenu();expandCollapseSidebar(localStorage.getItem('Drupal.navigation.sidebarExpanded')!=='false');initDisplace();expandCollapseButton.addEventListener('click',()=>expandCollapseSidebar(!isNavExpanded()));sidebar.addEventListener('click',(e)=>{if(e.target.matches('button, button *'))e.target.closest('button').focus();});sidebar.querySelectorAll('.toolbar-menu__item--has-dropdown > button').forEach((el)=>el.addEventListener('click',(e)=>{openCloseSubmenu(e.currentTarget.parentElement);}));document.addEventListener('keydown',(e)=>{if(e.altKey===true&&e.code==='KeyT')expandCollapseSidebar(!isNavExpanded());});}Drupal.behaviors.ginNavigation={attach(context){once('navigation','.admin-toolbar',context).forEach(init);},collapseSidebar(){expandCollapseSidebar(false);}};})(Drupal,once,FloatingUIDOM);;
((Drupal,once,_ref)=>{let {computePosition,offset,shift,flip}=_ref;Drupal.theme.ginTooltipWrapper=(dataset,title)=>`<div class="gin-tooltip ${dataset.drupalTooltipClass||""}">\n      ${dataset.drupalTooltip||title}\n    </div>`,Drupal.behaviors.ginTooltip={attach:(context)=>{Drupal.ginTooltip.init(context);}},Drupal.ginTooltip={init:function(context){once("ginTooltipInit","[data-gin-tooltip]",context).forEach(((trigger)=>{const title=trigger.title;title&&(trigger.title=""),trigger.insertAdjacentHTML("afterend",Drupal.theme.ginTooltipWrapper(trigger.dataset,title));const tooltip=trigger.nextElementSibling,updatePosition=()=>{this.computePosition(trigger,tooltip);};new ResizeObserver(updatePosition).observe(trigger),new MutationObserver(updatePosition).observe(trigger,{attributes:!0,childList:!0,subtree:!0}),trigger.addEventListener("mouseover",updatePosition),trigger.addEventListener("focus",updatePosition);}));},computePosition:function(trigger,tooltip){let placement=arguments.length>2&&void 0!==arguments[2]?arguments[2]:"bottom-end";computePosition(trigger,tooltip,{strategy:"absolute",placement:trigger.dataset.drupalTooltipPosition||placement,middleware:[flip({padding:16}),offset(6),shift({padding:16})]}).then(((_ref2)=>{let {x,y}=_ref2;Object.assign(tooltip.style,{"inset-inline-start":`${x}px`,"inset-block-start":`${y}px`});}));}};})(Drupal,once,FloatingUIDOM);;
((Drupal)=>{Drupal.behaviors.ginSticky={attach:()=>{once("ginSticky",".region-sticky-watcher").forEach((()=>{const observer=new IntersectionObserver(((_ref)=>{let [e]=_ref;const regionSticky=document.querySelector(".region-sticky");regionSticky.classList.toggle("region-sticky--is-sticky",e.intersectionRatio<1),regionSticky.toggleAttribute("data-offset-top",e.intersectionRatio<1),Drupal.displace(!0);}),{threshold:[1]}),element=document.querySelector(".region-sticky-watcher");element&&observer.observe(element);}));}};})(Drupal);;
/* @license GPL-2.0-or-later https://raw.githubusercontent.com/jquery-form/form/master/LICENSE */
(function(factory){if(typeof define==='function'&&define.amd)define(['jquery'],factory);else if(typeof module==='object'&&module.exports)module.exports=function(root,jQuery){if(typeof jQuery==='undefined')if(typeof window!=='undefined')jQuery=require('jquery');else jQuery=require('jquery')(root);factory(jQuery);return jQuery;};else factory(jQuery);}(function($){'use strict';var rCRLF=/\r?\n/g;var feature={};feature.fileapi=$('<input type="file">').get(0).files!==undefined;feature.formdata=(typeof window.FormData!=='undefined');var hasProp=!!$.fn.prop;$.fn.attr2=function(){if(!hasProp)return this.attr.apply(this,arguments);var val=this.prop.apply(this,arguments);if((val&&val.jquery)||typeof val==='string')return val;return this.attr.apply(this,arguments);};$.fn.ajaxSubmit=function(options,data,dataType,onSuccess){if(!this.length){log('ajaxSubmit: skipping submit process - no element selected');return this;}var method,action,url,isMsie,iframeSrc,$form=this;if(typeof options==='function')options={success:options};else if(typeof options==='string'||(options===false&&arguments.length>0)){options={'url':options,'data':data,'dataType':dataType};if(typeof onSuccess==='function')options.success=onSuccess;}else{if(typeof options==='undefined')options={};}method=options.method||options.type||this.attr2('method');action=options.url||this.attr2('action');url=(typeof action==='string')?action.trim():'';url=url||window.location.href||'';if(url)url=(url.match(/^([^#]+)/)||[])[1];isMsie=/(MSIE|Trident)/.test(navigator.userAgent||'');iframeSrc=(isMsie&&/^https/i.test(window.location.href||''))?'javascript:false':'about:blank';options=$.extend(true,{url,success:$.ajaxSettings.success,type:method||$.ajaxSettings.type,iframeSrc},options);var veto={};this.trigger('form-pre-serialize',[this,options,veto]);if(veto.veto){log('ajaxSubmit: submit vetoed via form-pre-serialize trigger');return this;}if(options.beforeSerialize&&options.beforeSerialize(this,options)===false){log('ajaxSubmit: submit aborted via beforeSerialize callback');return this;}var traditional=options.traditional;if(typeof traditional==='undefined')traditional=$.ajaxSettings.traditional;var elements=[];var qx,a=this.formToArray(options.semantic,elements,options.filtering);if(options.data){var optionsData=typeof (options.data)==="function"?options.data(a):options.data;options.extraData=optionsData;qx=$.param(optionsData,traditional);}if(options.beforeSubmit&&options.beforeSubmit(a,this,options)===false){log('ajaxSubmit: submit aborted via beforeSubmit callback');return this;}this.trigger('form-submit-validate',[a,this,options,veto]);if(veto.veto){log('ajaxSubmit: submit vetoed via form-submit-validate trigger');return this;}var q=$.param(a,traditional);if(qx)q=(q?(q+'&'+qx):qx);if(options.type.toUpperCase()==='GET'){options.url+=(options.url.indexOf('?')>=0?'&':'?')+q;options.data=null;}else options.data=q;var callbacks=[];if(options.resetForm)callbacks.push(function(){$form.resetForm();});if(options.clearForm)callbacks.push(function(){$form.clearForm(options.includeHidden);});if(!options.dataType&&options.target){var oldSuccess=options.success||function(){};callbacks.push(function(data,textStatus,jqXHR){var successArguments=arguments,fn=options.replaceTarget?'replaceWith':'html';$(options.target)[fn](data).each(function(){oldSuccess.apply(this,successArguments);});});}else{if(options.success)if(Array.isArray(options.success))callbacks=callbacks.concat(options.success);else callbacks.push(options.success);}options.success=function(data,status,xhr){var context=options.context||this;for(var i=0,max=callbacks.length;i<max;i++)callbacks[i].apply(context,[data,status,xhr||$form,$form]);};if(options.error){var oldError=options.error;options.error=function(xhr,status,error){var context=options.context||this;oldError.apply(context,[xhr,status,error,$form]);};}if(options.complete){var oldComplete=options.complete;options.complete=function(xhr,status){var context=options.context||this;oldComplete.apply(context,[xhr,status,$form]);};}var fileInputs=$('input[type=file]:enabled',this).filter(function(){return $(this).val()!=='';});var hasFileInputs=fileInputs.length>0;var mp='multipart/form-data';var multipart=($form.attr('enctype')===mp||$form.attr('encoding')===mp);var fileAPI=feature.fileapi&&feature.formdata;log('fileAPI :'+fileAPI);var shouldUseFrame=(hasFileInputs||multipart)&&!fileAPI;var jqxhr;if(options.iframe!==false&&(options.iframe||shouldUseFrame))if(options.closeKeepAlive)$.get(options.closeKeepAlive,function(){jqxhr=fileUploadIframe(a);});else jqxhr=fileUploadIframe(a);else if((hasFileInputs||multipart)&&fileAPI)jqxhr=fileUploadXhr(a);else jqxhr=$.ajax(options);$form.removeData('jqxhr').data('jqxhr',jqxhr);for(var k=0;k<elements.length;k++)elements[k]=null;this.trigger('form-submit-notify',[this,options]);return this;function deepSerialize(extraData){var serialized=$.param(extraData,options.traditional).split('&');var len=serialized.length;var result=[];var i,part;for(i=0;i<len;i++){serialized[i]=serialized[i].replace(/\+/g,' ');part=serialized[i].split('=');result.push([decodeURIComponent(part[0]),decodeURIComponent(part[1])]);}return result;}function fileUploadXhr(a){var formdata=new FormData();for(var i=0;i<a.length;i++)formdata.append(a[i].name,a[i].value);if(options.extraData){var serializedData=deepSerialize(options.extraData);for(i=0;i<serializedData.length;i++)if(serializedData[i])formdata.append(serializedData[i][0],serializedData[i][1]);}options.data=null;var s=$.extend(true,{},$.ajaxSettings,options,{contentType:false,processData:false,cache:false,type:method||'POST'});if(options.uploadProgress)s.xhr=function(){var xhr=$.ajaxSettings.xhr();if(xhr.upload)xhr.upload.addEventListener('progress',function(event){var percent=0;var position=event.loaded||event.position;var total=event.total;if(event.lengthComputable)percent=Math.ceil(position/total*100);options.uploadProgress(event,position,total,percent);},false);return xhr;};s.data=null;var beforeSend=s.beforeSend;s.beforeSend=function(xhr,o){if(options.formData)o.data=options.formData;else o.data=formdata;if(beforeSend)beforeSend.call(this,xhr,o);};return $.ajax(s);}function fileUploadIframe(a){var form=$form[0],el,i,s,g,id,$io,io,xhr,sub,n,timedOut,timeoutHandle;var deferred=$.Deferred();deferred.abort=function(status){xhr.abort(status);};if(a)for(i=0;i<elements.length;i++){el=$(elements[i]);if(hasProp)el.prop('disabled',false);else el.removeAttr('disabled');}s=$.extend(true,{},$.ajaxSettings,options);s.context=s.context||s;id='jqFormIO'+new Date().getTime();var ownerDocument=form.ownerDocument;var $body=$form.closest('body');if(s.iframeTarget){$io=$(s.iframeTarget,ownerDocument);n=$io.attr2('name');if(!n)$io.attr2('name',id);else id=n;}else{$io=$('<iframe name="'+id+'" src="'+s.iframeSrc+'" />',ownerDocument);$io.css({position:'absolute',top:'-1000px',left:'-1000px'});}io=$io[0];xhr={aborted:0,responseText:null,responseXML:null,status:0,statusText:'n/a',getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(status){var e=(status==='timeout'?'timeout':'aborted');log('aborting upload... '+e);this.aborted=1;try{if(io.contentWindow.document.execCommand)io.contentWindow.document.execCommand('Stop');}catch(ignore){}$io.attr('src',s.iframeSrc);xhr.error=e;if(s.error)s.error.call(s.context,xhr,e,status);if(g)$.event.trigger('ajaxError',[xhr,s,e]);if(s.complete)s.complete.call(s.context,xhr,e);}};g=s.global;if(g&&$.active++===0)$.event.trigger('ajaxStart');if(g)$.event.trigger('ajaxSend',[xhr,s]);if(s.beforeSend&&s.beforeSend.call(s.context,xhr,s)===false){if(s.global)$.active--;deferred.reject();return deferred;}if(xhr.aborted){deferred.reject();return deferred;}sub=form.clk;if(sub){n=sub.name;if(n&&!sub.disabled){s.extraData=s.extraData||{};s.extraData[n]=sub.value;if(sub.type==='image'){s.extraData[n+'.x']=form.clk_x;s.extraData[n+'.y']=form.clk_y;}}}var CLIENT_TIMEOUT_ABORT=1;var SERVER_ABORT=2;function getDoc(frame){var doc=null;try{if(frame.contentWindow)doc=frame.contentWindow.document;}catch(err){log('cannot get iframe.contentWindow document: '+err);}if(doc)return doc;try{doc=frame.contentDocument?frame.contentDocument:frame.document;}catch(err){log('cannot get iframe.contentDocument: '+err);doc=frame.document;}return doc;}var csrf_token=$('meta[name=csrf-token]').attr('content');var csrf_param=$('meta[name=csrf-param]').attr('content');if(csrf_param&&csrf_token){s.extraData=s.extraData||{};s.extraData[csrf_param]=csrf_token;}function doSubmit(){var t=$form.attr2('target'),a=$form.attr2('action'),mp='multipart/form-data',et=$form.attr('enctype')||$form.attr('encoding')||mp;form.setAttribute('target',id);if(!method||/post/i.test(method))form.setAttribute('method','POST');if(a!==s.url)form.setAttribute('action',s.url);if(!s.skipEncodingOverride&&(!method||/post/i.test(method)))$form.attr({encoding:'multipart/form-data',enctype:'multipart/form-data'});if(s.timeout)timeoutHandle=setTimeout(function(){timedOut=true;cb(CLIENT_TIMEOUT_ABORT);},s.timeout);function checkState(){try{var state=getDoc(io).readyState;log('state = '+state);if(state&&state.toLowerCase()==='uninitialized')setTimeout(checkState,50);}catch(e){log('Server abort: ',e,' (',e.name,')');cb(SERVER_ABORT);if(timeoutHandle)clearTimeout(timeoutHandle);timeoutHandle=undefined;}}var extraInputs=[];try{if(s.extraData)for(var n in s.extraData)if(s.extraData.hasOwnProperty(n))if($.isPlainObject(s.extraData[n])&&s.extraData[n].hasOwnProperty('name')&&s.extraData[n].hasOwnProperty('value'))extraInputs.push($('<input type="hidden" name="'+s.extraData[n].name+'">',ownerDocument).val(s.extraData[n].value).appendTo(form)[0]);else extraInputs.push($('<input type="hidden" name="'+n+'">',ownerDocument).val(s.extraData[n]).appendTo(form)[0]);if(!s.iframeTarget)$io.appendTo($body);if(io.attachEvent)io.attachEvent('onload',cb);else io.addEventListener('load',cb,false);setTimeout(checkState,15);try{form.submit();}catch(err){var submitFn=document.createElement('form').submit;submitFn.apply(form);}}finally{form.setAttribute('action',a);form.setAttribute('enctype',et);if(t)form.setAttribute('target',t);else $form.removeAttr('target');$(extraInputs).remove();}}if(s.forceSync)doSubmit();else setTimeout(doSubmit,10);var data,doc,domCheckCount=50,callbackProcessed;function cb(e){if(xhr.aborted||callbackProcessed)return;doc=getDoc(io);if(!doc){log('cannot access response document');e=SERVER_ABORT;}if(e===CLIENT_TIMEOUT_ABORT&&xhr){xhr.abort('timeout');deferred.reject(xhr,'timeout');return;}if(e===SERVER_ABORT&&xhr){xhr.abort('server abort');deferred.reject(xhr,'error','server abort');return;}if(!doc||doc.location.href===s.iframeSrc)if(!timedOut)return;if(io.detachEvent)io.detachEvent('onload',cb);else io.removeEventListener('load',cb,false);var status='success',errMsg;try{if(timedOut)throw 'timeout';var isXml=s.dataType==='xml'||doc.XMLDocument||$.isXMLDoc(doc);log('isXml='+isXml);if(!isXml&&window.opera&&(doc.body===null||!doc.body.innerHTML))if(--domCheckCount){log('requeing onLoad callback, DOM not available');setTimeout(cb,250);return;}var docRoot=doc.body?doc.body:doc.documentElement;xhr.responseText=docRoot?docRoot.innerHTML:null;xhr.responseXML=doc.XMLDocument?doc.XMLDocument:doc;if(isXml)s.dataType='xml';xhr.getResponseHeader=function(header){var headers={'content-type':s.dataType};return headers[header.toLowerCase()];};if(docRoot){xhr.status=Number(docRoot.getAttribute('status'))||xhr.status;xhr.statusText=docRoot.getAttribute('statusText')||xhr.statusText;}var dt=(s.dataType||'').toLowerCase();var scr=/(json|script|text)/.test(dt);if(scr||s.textarea){var ta=doc.getElementsByTagName('textarea')[0];if(ta){xhr.responseText=ta.value;xhr.status=Number(ta.getAttribute('status'))||xhr.status;xhr.statusText=ta.getAttribute('statusText')||xhr.statusText;}else{if(scr){var pre=doc.getElementsByTagName('pre')[0];var b=doc.getElementsByTagName('body')[0];if(pre)xhr.responseText=pre.textContent?pre.textContent:pre.innerText;else{if(b)xhr.responseText=b.textContent?b.textContent:b.innerText;}}}}else{if(dt==='xml'&&!xhr.responseXML&&xhr.responseText)xhr.responseXML=toXml(xhr.responseText);}try{data=httpData(xhr,dt,s);}catch(err){status='parsererror';xhr.error=errMsg=(err||status);}}catch(err){log('error caught: ',err);status='error';xhr.error=errMsg=(err||status);}if(xhr.aborted){log('upload aborted');status=null;}if(xhr.status)status=((xhr.status>=200&&xhr.status<300)||xhr.status===304)?'success':'error';if(status==='success'){if(s.success)s.success.call(s.context,data,'success',xhr);deferred.resolve(xhr.responseText,'success',xhr);if(g)$.event.trigger('ajaxSuccess',[xhr,s]);}else{if(status){if(typeof errMsg==='undefined')errMsg=xhr.statusText;if(s.error)s.error.call(s.context,xhr,status,errMsg);deferred.reject(xhr,'error',errMsg);if(g)$.event.trigger('ajaxError',[xhr,s,errMsg]);}}if(g)$.event.trigger('ajaxComplete',[xhr,s]);if(g&&!--$.active)$.event.trigger('ajaxStop');if(s.complete)s.complete.call(s.context,xhr,status);callbackProcessed=true;if(s.timeout)clearTimeout(timeoutHandle);setTimeout(function(){if(!s.iframeTarget)$io.remove();else $io.attr('src',s.iframeSrc);xhr.responseXML=null;},100);}var toXml=$.parseXML||function(s,doc){if(window.ActiveXObject){doc=new ActiveXObject('Microsoft.XMLDOM');doc.async='false';doc.loadXML(s);}else doc=(new DOMParser()).parseFromString(s,'text/xml');return (doc&&doc.documentElement&&doc.documentElement.nodeName!=='parsererror')?doc:null;};var httpData=function(xhr,type,s){var ct=xhr.getResponseHeader('content-type')||'',xml=((type==='xml'||!type)&&ct.indexOf('xml')>=0),data=xml?xhr.responseXML:xhr.responseText;if(xml&&data.documentElement.nodeName==='parsererror')if($.error)$.error('parsererror');if(s&&s.dataFilter)data=s.dataFilter(data,type);if(typeof data==='string')if((type==='json'||!type)&&ct.indexOf('json')>=0)data=JSON.parse(data);else{if((type==='script'||!type)&&ct.indexOf('javascript')>=0)$.globalEval(data);}return data;};return deferred;}};$.fn.ajaxForm=function(options,data,dataType,onSuccess){if(typeof options==='string'||(options===false&&arguments.length>0)){options={'url':options,'data':data,'dataType':dataType};if(typeof onSuccess==='function')options.success=onSuccess;}options=options||{};options.delegation=options.delegation&&typeof $.fn.on==='function';if(!options.delegation&&this.length===0){var o={s:this.selector,c:this.context};if(!$.isReady&&o.s){log('DOM not ready, queuing ajaxForm');$(function(){$(o.s,o.c).ajaxForm(options);});return this;}log('terminating; zero elements found by selector'+($.isReady?'':' (DOM not ready)'));return this;}if(options.delegation){$(document).off('submit.form-plugin',this.selector,doAjaxSubmit).off('click.form-plugin',this.selector,captureSubmittingElement).on('submit.form-plugin',this.selector,options,doAjaxSubmit).on('click.form-plugin',this.selector,options,captureSubmittingElement);return this;}if(options.beforeFormUnbind)options.beforeFormUnbind(this,options);return this.ajaxFormUnbind().on('submit.form-plugin',options,doAjaxSubmit).on('click.form-plugin',options,captureSubmittingElement);};function doAjaxSubmit(e){var options=e.data;if(!e.isDefaultPrevented()){e.preventDefault();$(e.target).closest('form').ajaxSubmit(options);}}function captureSubmittingElement(e){var target=e.target;var $el=$(target);if(!$el.is('[type=submit],[type=image]')){var t=$el.closest('[type=submit]');if(t.length===0)return;target=t[0];}var form=target.form;form.clk=target;if(target.type==='image')if(typeof e.offsetX!=='undefined'){form.clk_x=e.offsetX;form.clk_y=e.offsetY;}else if(typeof $.fn.offset==='function'){var offset=$el.offset();form.clk_x=e.pageX-offset.left;form.clk_y=e.pageY-offset.top;}else{form.clk_x=e.pageX-target.offsetLeft;form.clk_y=e.pageY-target.offsetTop;}setTimeout(function(){form.clk=form.clk_x=form.clk_y=null;},100);}$.fn.ajaxFormUnbind=function(){return this.off('submit.form-plugin click.form-plugin');};$.fn.formToArray=function(semantic,elements,filtering){var a=[];if(this.length===0)return a;var form=this[0];var formId=this.attr('id');var els=(semantic||typeof form.elements==='undefined')?form.getElementsByTagName('*'):form.elements;var els2;if(els)els=$.makeArray(els);if(formId&&(semantic||/(Edge|Trident)\//.test(navigator.userAgent))){els2=$(':input[form="'+formId+'"]').get();if(els2.length)els=(els||[]).concat(els2);}if(!els||!els.length)return a;if(typeof (filtering)==="function")els=$.map(els,filtering);var i,j,n,v,el,max,jmax;for(i=0,max=els.length;i<max;i++){el=els[i];n=el.name;if(!n||el.disabled)continue;if(semantic&&form.clk&&el.type==='image'){if(form.clk===el){a.push({name:n,value:$(el).val(),type:el.type});a.push({name:n+'.x',value:form.clk_x},{name:n+'.y',value:form.clk_y});}continue;}v=$.fieldValue(el,true);if(v&&v.constructor===Array){if(elements)elements.push(el);for(j=0,jmax=v.length;j<jmax;j++)a.push({name:n,value:v[j]});}else if(feature.fileapi&&el.type==='file'){if(elements)elements.push(el);var files=el.files;if(files.length)for(j=0;j<files.length;j++)a.push({name:n,value:files[j],type:el.type});else a.push({name:n,value:'',type:el.type});}else{if(v!==null&&typeof v!=='undefined'){if(elements)elements.push(el);a.push({name:n,value:v,type:el.type,required:el.required});}}}if(!semantic&&form.clk){var $input=$(form.clk),input=$input[0];n=input.name;if(n&&!input.disabled&&input.type==='image'){a.push({name:n,value:$input.val()});a.push({name:n+'.x',value:form.clk_x},{name:n+'.y',value:form.clk_y});}}return a;};$.fn.formSerialize=function(semantic){return $.param(this.formToArray(semantic));};$.fn.fieldSerialize=function(successful){var a=[];this.each(function(){var n=this.name;if(!n)return;var v=$.fieldValue(this,successful);if(v&&v.constructor===Array)for(var i=0,max=v.length;i<max;i++)a.push({name:n,value:v[i]});else{if(v!==null&&typeof v!=='undefined')a.push({name:this.name,value:v});}});return $.param(a);};$.fn.fieldValue=function(successful){for(var val=[],i=0,max=this.length;i<max;i++){var el=this[i];var v=$.fieldValue(el,successful);if(v===null||typeof v==='undefined'||(v.constructor===Array&&!v.length))continue;if(Array.isArray(v))val=val.concat(v);else val.push(v);}return val;};$.fieldValue=function(el,successful){var n=el.name,t=el.type,tag=el.tagName.toLowerCase();if(typeof successful==='undefined')successful=true;if(successful&&(!n||el.disabled||t==='reset'||t==='button'||(t==='checkbox'||t==='radio')&&!el.checked||(t==='submit'||t==='image')&&el.form&&el.form.clk!==el||tag==='select'&&el.selectedIndex===-1))return null;if(tag==='select'){var index=el.selectedIndex;if(index<0)return null;var a=[],ops=el.options;var one=(t==='select-one');var max=(one?index+1:ops.length);for(var i=(one?index:0);i<max;i++){var op=ops[i];if(op.selected&&!op.disabled){var v=op.value;if(!v)v=(op.attributes&&op.attributes.value&&!(op.attributes.value.specified))?op.text:op.value;if(one)return v;a.push(v);}}return a;}return $(el).val().replace(rCRLF,'\r\n');};$.fn.clearForm=function(includeHidden){return this.each(function(){$('input,select,textarea',this).clearFields(includeHidden);});};$.fn.clearFields=$.fn.clearInputs=function(includeHidden){var re=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var t=this.type,tag=this.tagName.toLowerCase();if(re.test(t)||tag==='textarea')this.value='';else if(t==='checkbox'||t==='radio')this.checked=false;else if(tag==='select')this.selectedIndex=-1;else if(t==='file')if(/MSIE/.test(navigator.userAgent))$(this).replaceWith($(this).clone(true));else $(this).val('');else{if(includeHidden)if((includeHidden===true&&/hidden/.test(t))||(typeof includeHidden==='string'&&$(this).is(includeHidden)))this.value='';}});};$.fn.resetForm=function(){return this.each(function(){var el=$(this);var tag=this.tagName.toLowerCase();switch(tag){case 'input':this.checked=this.defaultChecked;case 'textarea':this.value=this.defaultValue;return true;case 'option':case 'optgroup':var select=el.parents('select');if(select.length&&select[0].multiple)if(tag==='option')this.selected=this.defaultSelected;else el.find('option').resetForm();else select.resetForm();return true;case 'select':el.find('option').each(function(i){this.selected=this.defaultSelected;if(this.defaultSelected&&!el[0].multiple){el[0].selectedIndex=i;return false;}});return true;case 'label':var forEl=$(el.attr('for'));var list=el.find('input,select,textarea');if(forEl[0])list.unshift(forEl[0]);list.resetForm();return true;case 'form':if(typeof this.reset==='function'||(typeof this.reset==='object'&&!this.reset.nodeType))this.reset();return true;default:el.find('form,input,label,select,textarea').resetForm();return true;}});};$.fn.enable=function(b){if(typeof b==='undefined')b=true;return this.each(function(){this.disabled=!b;});};$.fn.selected=function(select){if(typeof select==='undefined')select=true;return this.each(function(){var t=this.type;if(t==='checkbox'||t==='radio')this.checked=select;else{if(this.tagName.toLowerCase()==='option'){var $sel=$(this).parent('select');if(select&&$sel[0]&&$sel[0].type==='select-one')$sel.find('option').selected(false);this.selected=select;}}});};$.fn.ajaxSubmit.debug=false;function log(){if(!$.fn.ajaxSubmit.debug)return;var msg='[jquery.form] '+Array.prototype.join.call(arguments,'');if(window.console&&window.console.log)window.console.log(msg);else{if(window.opera&&window.opera.postError)window.opera.postError(msg);}}}));;
/* @license GPL-2.0-or-later https://www.drupal.org/licensing/faq */
(function($,Drupal,debounce){$.fn.drupalGetSummary=function(){const callback=this.data('summaryCallback');if(!this[0]||!callback)return '';const result=callback(this[0]);return result?result.trim():'';};$.fn.drupalSetSummary=function(callback){const self=this;if(typeof callback!=='function'){const val=callback;callback=function(){return val;};}return (this.data('summaryCallback',callback).off('formUpdated.summary').on('formUpdated.summary',()=>{self.trigger('summaryUpdated');}).trigger('summaryUpdated'));};Drupal.behaviors.formSingleSubmit={attach(){function onFormSubmit(e){const $form=$(e.currentTarget);const formValues=new URLSearchParams(new FormData(e.target)).toString();const previousValues=$form.attr('data-drupal-form-submit-last');if(previousValues===formValues)e.preventDefault();else $form.attr('data-drupal-form-submit-last',formValues);}$(once('form-single-submit','body')).on('submit.singleSubmit','form:not([method~="GET"])',onFormSubmit);}};function triggerFormUpdated(element){$(element).trigger('formUpdated');}function fieldsList(form){return [].map.call(form.querySelectorAll('[name][id]'),(el)=>el.id);}Drupal.behaviors.formUpdated={attach(context){const $context=$(context);const contextIsForm=context.tagName==='FORM';const $forms=$(once('form-updated',contextIsForm?$context:$context.find('form')));let formFields;if($forms.length)$.makeArray($forms).forEach((form)=>{const events='change.formUpdated input.formUpdated ';const eventHandler=debounce((event)=>{triggerFormUpdated(event.target);},300);formFields=fieldsList(form).join(',');form.setAttribute('data-drupal-form-fields',formFields);$(form).on(events,eventHandler);});if(contextIsForm){formFields=fieldsList(context).join(',');const currentFields=$(context).attr('data-drupal-form-fields');if(formFields!==currentFields)triggerFormUpdated(context);}},detach(context,settings,trigger){const $context=$(context);const contextIsForm=context.tagName==='FORM';if(trigger==='unload')once.remove('form-updated',contextIsForm?$context:$context.find('form')).forEach((form)=>{form.removeAttribute('data-drupal-form-fields');$(form).off('.formUpdated');});}};Drupal.behaviors.fillUserInfoFromBrowser={attach(context,settings){const userInfo=['name','mail','homepage'];const $forms=$(once('user-info-from-browser','[data-user-info-from-browser]'));if($forms.length)userInfo.forEach((info)=>{const $element=$forms.find(`[name=${info}]`);const browserData=localStorage.getItem(`Drupal.visitor.${info}`);if(!$element.length)return;const emptyValue=$element[0].value==='';const defaultValue=$element.attr('data-drupal-default-value')===$element[0].value;if(browserData&&(emptyValue||defaultValue))$element.each(function(index,item){item.value=browserData;});});$forms.on('submit',()=>{userInfo.forEach((info)=>{const $element=$forms.find(`[name=${info}]`);if($element.length)localStorage.setItem(`Drupal.visitor.${info}`,$element[0].value);});});}};const handleFragmentLinkClickOrHashChange=(e)=>{let url;if(e.type==='click')url=e.currentTarget.location?e.currentTarget.location:e.currentTarget;else url=window.location;const hash=url.hash.substring(1);if(hash){const $target=$(`#${hash}`);$('body').trigger('formFragmentLinkClickOrHashChange',[$target]);setTimeout(()=>$target.trigger('focus'),300);}};const debouncedHandleFragmentLinkClickOrHashChange=debounce(handleFragmentLinkClickOrHashChange,300,true);$(window).on('hashchange.form-fragment',debouncedHandleFragmentLinkClickOrHashChange);$(document).on('click.form-fragment','a[href*="#"]',debouncedHandleFragmentLinkClickOrHashChange);})(jQuery,Drupal,Drupal.debounce);;
(function($,Drupal){function DropButton(dropbutton,settings){const options=$.extend({title:Drupal.t('List additional actions')},settings);const $dropbutton=$(dropbutton);this.$dropbutton=$dropbutton;this.$list=$dropbutton.find('.dropbutton');this.$actions=this.$list.find('li').addClass('dropbutton-action');if(this.$actions.length>1){const $primary=this.$actions.slice(0,1);const $secondary=this.$actions.slice(1);$secondary.addClass('secondary-action');$primary.after(Drupal.theme('dropbuttonToggle',options));this.$dropbutton.addClass('dropbutton-multiple').on({'mouseleave.dropbutton':this.hoverOut.bind(this),'mouseenter.dropbutton':this.hoverIn.bind(this),'focusout.dropbutton':this.focusOut.bind(this),'focusin.dropbutton':this.focusIn.bind(this)});}else this.$dropbutton.addClass('dropbutton-single');}function dropbuttonClickHandler(e){e.preventDefault();$(e.target).closest('.dropbutton-wrapper').toggleClass('open');}Drupal.behaviors.dropButton={attach(context,settings){const dropbuttons=once('dropbutton','.dropbutton-wrapper',context);if(dropbuttons.length){const body=once('dropbutton-click','body');if(body.length)$(body).on('click','.dropbutton-toggle',dropbuttonClickHandler);dropbuttons.forEach((dropbutton)=>{DropButton.dropbuttons.push(new DropButton(dropbutton,settings.dropbutton));});}}};$.extend(DropButton,{dropbuttons:[]});$.extend(DropButton.prototype,{toggle(show){const isBool=typeof show==='boolean';show=isBool?show:!this.$dropbutton.hasClass('open');this.$dropbutton.toggleClass('open',show);},hoverIn(){if(this.timerID)window.clearTimeout(this.timerID);},hoverOut(){this.timerID=window.setTimeout(this.close.bind(this),500);},open(){this.toggle(true);},close(){this.toggle(false);},focusOut(e){this.hoverOut.call(this,e);},focusIn(e){this.hoverIn.call(this,e);}});$.extend(Drupal.theme,{dropbuttonToggle(options){return `<li class="dropbutton-toggle"><button type="button"><span class="dropbutton-arrow"><span class="visually-hidden">${options.title}</span></span></button></li>`;}});Drupal.DropButton=DropButton;})(jQuery,Drupal);;
((Drupal)=>{Drupal.theme.dropbuttonToggle=(options)=>`<li class="dropbutton-toggle"><button type="button" class="dropbutton__toggle"><span class="visually-hidden">${options.title}</span></button></li>`;})(Drupal);;
((Drupal,once)=>{Drupal.behaviors.ginDropbutton={attach:function(context){once("ginDropbutton",".dropbutton-multiple:has(.dropbutton--gin)",context).forEach(((el)=>{const toggle=el.querySelector(".dropbutton__toggle");toggle&&toggle.addEventListener("click",(()=>{this.positionDropdown(el);}));}));},positionDropdown:function(el){const secondaryAction=el.querySelector(".secondary-action"),dropMenu=el.querySelector(".dropbutton__items");if(!secondaryAction||!dropMenu)return;const toolbarTotalHeight=(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gin-toolbar-y-offset"))||0)+(parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--gin-toolbar-height"))||0),boundingRect=secondaryAction.getBoundingClientRect(),spaceBelow=window.innerHeight-boundingRect.bottom,halfVh=Math.floor(window.innerHeight/2),upperBound=el.closest("form")||document.querySelector("#block-gin-content")||document.body,upperTop=Math.max(upperBound.getBoundingClientRect().top,0),effectiveSpaceAbove=Math.max(boundingRect.top-upperTop,0);dropMenu.style.position="absolute",dropMenu.style.overflowY="auto",spaceBelow>=effectiveSpaceAbove?(dropMenu.style.top="100%",dropMenu.style.bottom="auto",dropMenu.style.maxHeight=`${Math.max(spaceBelow-32,120)}px`):(dropMenu.style.top="auto",dropMenu.style.bottom="100%",dropMenu.style.maxHeight=Math.max(Math.min(effectiveSpaceAbove,halfVh),0)-toolbarTotalHeight+"px");}};})(Drupal,once);;
(function($,Drupal,drupalSettings){Drupal.Views={};Drupal.Views.parseQueryString=function(query){const args={};if(query.includes('?'))query=query.substring(query.indexOf('?')+1);let pair;const pairs=query.split('&');for(let i=0;i<pairs.length;i++){pair=pairs[i].split('=');if(pair[0]!=='q')if(pair[1])args[decodeURIComponent(pair[0].replace(/\+/g,' '))]=decodeURIComponent(pair[1].replace(/\+/g,' '));else args[decodeURIComponent(pair[0].replace(/\+/g,' '))]='';}return args;};Drupal.Views.parseViewArgs=function(href,viewPath){const returnObj={};const path=Drupal.Views.getPath(href);const viewHref=Drupal.url(viewPath).substring(drupalSettings.path.baseUrl.length);if(viewHref&&path.startsWith(`${viewHref}/`)){returnObj.view_args=decodeURIComponent(path.substring(viewHref.length+1,path.length));returnObj.view_path=path;}return returnObj;};Drupal.Views.pathPortion=function(href){const protocol=window.location.protocol;if(href.startsWith(protocol))href=href.substring(href.indexOf('/',protocol.length+2));return href;};Drupal.Views.getPath=function(href){href=Drupal.Views.pathPortion(href);href=href.substring(drupalSettings.path.baseUrl.length,href.length);if(href.startsWith('?q='))href=href.substring(3,href.length);const chars=['#','?','&'];for(let i=0;i<chars.length;i++)if(href.includes(chars[i]))href=href.substring(0,href.indexOf(chars[i]));return href;};})(jQuery,Drupal,drupalSettings);;
(function($,Drupal,drupalSettings){Drupal.behaviors.ViewsAjaxView={};Drupal.behaviors.ViewsAjaxView.attach=function(context,settings){if(settings?.views?.ajaxViews){const {views:{ajaxViews}}=settings;Object.keys(ajaxViews||{}).forEach((i)=>{Drupal.views.instances[i]=new Drupal.views.ajaxView(ajaxViews[i]);});}};Drupal.behaviors.ViewsAjaxView.detach=(context,settings,trigger)=>{if(trigger==='unload')if(settings?.views?.ajaxViews){const {views:{ajaxViews}}=settings;Object.keys(ajaxViews||{}).forEach((i)=>{const selector=`.js-view-dom-id-${ajaxViews[i].view_dom_id}`;if($(selector,context).length){delete Drupal.views.instances[i];delete settings.views.ajaxViews[i];}});}};Drupal.views={};Drupal.views.instances={};Drupal.views.ajaxView=function(settings){const selector=`.js-view-dom-id-${settings.view_dom_id}`;this.$view=$(selector);this.$exposed_form=$(`form#views-exposed-form-${settings.view_name.replace(/_/g,'-')}-${settings.view_display_id.replace(/_/g,'-')}`);let ajaxPath=drupalSettings.views.ajax_path;if(ajaxPath.constructor.toString().includes('Array'))ajaxPath=ajaxPath[0];let queryString=window.location.search||'';if(queryString!==''){queryString=queryString.slice(1);const params=decodeURI(queryString).split('&').filter((param)=>{const [name,value]=param.split('=');return (this.$exposed_form.find(`input[name="${name}"]`).length===0&&!['page','reset','sort','order','q','render'].includes(name));});queryString=encodeURI(params.join('&'));if(queryString!=='')queryString=(ajaxPath.includes('?')?'&':'?')+queryString;}this.element_settings={url:ajaxPath+queryString,submit:settings,httpMethod:'GET',setClick:true,event:'click',selector,progress:{type:'fullscreen'}};this.settings=settings;once('exposed-form',this.$exposed_form).forEach(this.attachExposedFormAjax.bind(this));once('ajax-pager',this.$view.filter(this.filterNestedViews.bind(this))).forEach(this.attachPagerAjax.bind(this));const selfSettings=$.extend({},this.element_settings,{event:'RefreshView',base:this.selector,httpMethod:'GET',element:this.$view.get(0)});this.refreshViewAjax=Drupal.ajax(selfSettings);};Drupal.views.ajaxView.prototype.attachExposedFormAjax=function(){const that=this;this.exposedFormAjax=[];$('input[type=submit], button[type=submit], input[type=image]',this.$exposed_form).not('[data-drupal-selector=edit-reset]').each(function(index){const selfSettings=$.extend({},that.element_settings,{base:$(this).attr('id'),element:this});that.exposedFormAjax[index]=Drupal.ajax(selfSettings);});};Drupal.views.ajaxView.prototype.filterNestedViews=function(){return !this.$view.parents('.view').length;};Drupal.views.ajaxView.prototype.attachPagerAjax=function(){this.$view.find('.js-pager__items a, th.views-field a, .attachment .views-summary a').each(this.attachPagerLinkAjax.bind(this));};Drupal.views.ajaxView.prototype.attachPagerLinkAjax=function(id,link){const $link=$(link);const viewData={};const href=$link.attr('href');$.extend(viewData,this.settings,Drupal.Views.parseQueryString(href),Drupal.Views.parseViewArgs(href,this.settings.view_base_path));const selfSettings=$.extend({},this.element_settings,{submit:viewData,base:false,element:link,httpMethod:'GET'});this.pagerAjax=Drupal.ajax(selfSettings);};Drupal.AjaxCommands.prototype.setBrowserUrl=(ajax,response)=>{if(ajax.element&&!ajax.element.closest('.ui-dialog-content'))window.history.replaceState(null,'',response.url);};})(jQuery,Drupal,drupalSettings);;
(function($,Drupal,drupalSettings){Drupal.AjaxCommands.prototype.viewsHighlight=function(ajax,response,status){$('.hilited').removeClass('hilited');$(response.selector).addClass('hilited');};Drupal.AjaxCommands.prototype.viewsSetForm=function(ajax,response,status){const $form=$('.js-views-ui-dialog form');const $submitButtons=$(once('views-ajax-submit',$form.find('input[type=submit].js-form-submit, button.js-form-submit')));$submitButtons.on('click mousedown',function(){this.form.clk=this;});once('views-ajax-submit',$form).forEach((form)=>{const $form=$(form);const elementSettings={url:response.url,event:'submit',base:$form.attr('id'),element:form};const ajaxForm=Drupal.ajax(elementSettings);ajaxForm.$form=$form;});};Drupal.AjaxCommands.prototype.viewsShowButtons=function(ajax,response,status){$('div.views-edit-view div.form-actions').removeClass('js-hide');if(response.changed)$('div.views-edit-view div.view-changed.messages').removeClass('js-hide');};Drupal.AjaxCommands.prototype.viewsTriggerPreview=function(ajax,response,status){if($('input#edit-displays-live-preview')[0].checked)$('#preview-submit').trigger('click');};Drupal.AjaxCommands.prototype.viewsReplaceTitle=function(ajax,response,status){const doc=document;const oldTitle=doc.title;const escapedSiteName=response.siteName.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,'\\$&');const re=new RegExp(`.+ (.) ${escapedSiteName}`);doc.title=oldTitle.replace(re,`${response.title} $1 ${response.siteName}`);document.querySelectorAll('h1.page-title').forEach((item)=>{item.textContent=response.title;});};Drupal.theme.tableDragChangedWarning=function(){return [];};Drupal.behaviors.livePreview={attach(context){$(once('views-ajax','input#edit-displays-live-preview',context)).on('click',function(){if(this.checked)$('#preview-submit').trigger('click');});}};Drupal.behaviors.syncPreviewDisplay={attach(context){$(once('views-ajax','#views-tabset a')).on('click',function(){const href=$(this).attr('href');const displayId=href.substring(11);const viewsPreviewId=document.querySelector('#views-live-preview #preview-display-id');if(viewsPreviewId)viewsPreviewId.value=displayId;});}};Drupal.behaviors.viewsAjax={collapseReplaced:false,attach(context,settings){const baseElementSettings={event:'click',progress:{type:'fullscreen'}};once('views-ajax','a.views-ajax-link',context).forEach((link)=>{const $link=$(link);const elementSettings=baseElementSettings;elementSettings.base=$link.attr('id');elementSettings.element=link;if($link.attr('href'))elementSettings.url=$link.attr('href');Drupal.ajax(elementSettings);});once('views-ajax','div#views-live-preview a').forEach((link)=>{const $link=$(link);if(!$link.attr('href'))return true;const elementSettings=baseElementSettings;elementSettings.url=$link.attr('href');if(!Drupal.Views.getPath(elementSettings.url).startsWith('admin/structure/views'))return true;elementSettings.wrapper='views-preview-wrapper';elementSettings.method='replaceWith';elementSettings.base=link.id;elementSettings.element=link;Drupal.ajax(elementSettings);});once('views-ajax','div#views-live-preview input[type=submit]').forEach((submit)=>{const $submit=$(submit);$submit.on('click',function(){this.form.clk=this;return true;});const elementSettings=baseElementSettings;elementSettings.url=$(submit.form).attr('action');if(!Drupal.Views.getPath(elementSettings.url).startsWith('admin/structure/views'))return true;elementSettings.wrapper='views-preview-wrapper';elementSettings.method='replaceWith';elementSettings.event='click';elementSettings.base=submit.id;elementSettings.element=submit;Drupal.ajax(elementSettings);});}};})(jQuery,Drupal,drupalSettings);;
(function($,Drupal,drupalSettings,bodyScrollLock){function handleDialogResize(e){const $modal=$(e.currentTarget);const $viewsOverride=$modal.find('[data-drupal-views-offset]');const $scroll=$modal.find('[data-drupal-views-scroll]');let offset=0;let modalHeight;if($scroll.length){$modal.closest('.views-ui-dialog').addClass('views-ui-dialog-scroll');$scroll.each(function(){Object.assign(this.style,{overflow:'visible',height:'auto'});});modalHeight=$modal.height();$viewsOverride.each(function(){offset+=$(this).outerHeight();});const scrollOffset=$scroll.outerHeight()-$scroll.height();$scroll.height(modalHeight-offset-scrollOffset);$modal.each(function(){this.style.overflow='hidden';});$scroll.each(function(){this.style.overflow='auto';});}}Drupal.behaviors.viewsModalContent={attach(context){$(once('viewsDialog','body')).on('dialogContentResize.viewsDialog','.ui-dialog-content',handleDialogResize);$(once('detailsUpdate','.scroll',context)).on('click','summary',(e)=>{e.currentTarget?.dispatchEvent(new CustomEvent('dialogContentResize',{bubbles:true}));});},detach(context,settings,trigger){if(trigger==='unload')$(once.remove('viewsDialog','body')).off('.viewsDialog');}};window.addEventListener('dialog:aftercreate',(e)=>{const $element=$(e.target);const $scroll=$element.find('.scroll');if($scroll.length){bodyScrollLock.unlock($element.get(0));bodyScrollLock.lock($scroll.get(0));}});})(jQuery,Drupal,drupalSettings,bodyScrollLock);;
(function($,Drupal,drupalSettings){Drupal.viewsUi={};Drupal.behaviors.viewsUiEditView={attach(){$('[data-drupal-selector="edit-query-options-disable-sql-rewrite"]').on('click',()=>{$('.sql-rewrite-warning').toggleClass('js-hide');});}};Drupal.behaviors.viewsUiAddView={attach(context){const $context=$(context);const exclude=new RegExp('[^a-z0-9\\-]+','g');const replace='-';let suffix;const $fields=$context.find('[id^="edit-page-title"], [id^="edit-block-title"], [id^="edit-page-link-properties-title"]');if($fields.length)if(!this.fieldsFiller)this.fieldsFiller=new Drupal.viewsUi.FormFieldFiller($fields);else this.fieldsFiller.rebind($fields);const $pathField=$context.find('[id^="edit-page-path"]');if($pathField.length)if(!this.pathFiller)this.pathFiller=new Drupal.viewsUi.FormFieldFiller($pathField,exclude,replace);else this.pathFiller.rebind($pathField);const $feedField=$context.find('[id^="edit-page-feed-properties-path"]');if($feedField.length)if(!this.feedFiller){suffix='.xml';this.feedFiller=new Drupal.viewsUi.FormFieldFiller($feedField,exclude,replace,suffix);}else this.feedFiller.rebind($feedField);}};Drupal.viewsUi.FormFieldFiller=function($target,exclude,replace,suffix){this.source=$('#edit-label');this.target=$target;this.exclude=exclude||false;this.replace=replace||'';this.suffix=suffix||'';const self=this;this.populate=function(){return self._populate.call(self);};this.unbind=function(){return self._unbind.call(self);};this.bind();};$.extend(Drupal.viewsUi.FormFieldFiller.prototype,{bind(){this.unbind();this.source.on('keyup.viewsUi change.viewsUi',this.populate);this.target.on('focus.viewsUi',this.unbind);},getTransliterated(){let from=this.source.length?this.source[0].value:'';if(this.exclude)from=from.toLowerCase().replace(this.exclude,this.replace);return from;},_populate(){const transliterated=this.getTransliterated();const suffix=this.suffix;this.target.each(function(i){const maxlength=$(this).attr('maxlength')-suffix.length;this.value=transliterated.substring(0,maxlength)+suffix;});},_unbind(){this.source.off('keyup.viewsUi change.viewsUi',this.populate);this.target.off('focus.viewsUi',this.unbind);},rebind($fields){this.target=$fields;this.bind();}});Drupal.behaviors.addItemForm={attach(context){const $context=$(context);let $form=$context;if(!(context instanceof HTMLElement&&context.matches('form[id^="views-ui-add-handler-form"]')))$form=$context.find('form[id^="views-ui-add-handler-form"]');if(once('views-ui-add-handler-form',$form).length)new Drupal.viewsUi.AddItemForm($form);}};Drupal.viewsUi.AddItemForm=function($form){this.$form=$form;this.$form.find('.views-filterable-options :checkbox').on('click',this.handleCheck.bind(this));this.$selected_div=this.$form.find('.views-selected-options').parent();this.$selected_div.hide();this.checkedItems=[];};Drupal.viewsUi.AddItemForm.prototype.handleCheck=function(event){const $target=$(event.target);const label=$target.closest('td').next().html().trim();if(event.target.checked){this.$selected_div.show();this.$selected_div[0].style.display='block';this.checkedItems.push(label);}else{const position=$.inArray(label,this.checkedItems);for(let i=0;i<this.checkedItems.length;i++)if(i===position){this.checkedItems.splice(i,1);i--;break;}if(this.checkedItems.length===0)this.$selected_div.hide();}this.refreshCheckedItems();};Drupal.viewsUi.AddItemForm.prototype.refreshCheckedItems=function(){this.$selected_div.find('.views-selected-options').html(this.checkedItems.join(', '));this.$selected_div?.get(0)?.dispatchEvent(new CustomEvent('dialogContentResize',{bubbles:true}));};Drupal.behaviors.viewsUiRenderAddViewButton={attach(context){const menu=once('views-ui-render-add-view-button','#views-display-menu-tabs',context);if(!menu.length)return;const $menu=$(menu);const $addDisplayDropdown=$(`<li class="add"><a href="#"><span class="icon add"></span>${Drupal.t('Add')}</a><ul class="action-list" style="display:none;"></ul></li>`);const $displayButtons=$menu.nextAll('input.add-display, button.add-display').detach();$displayButtons.appendTo($addDisplayDropdown.find('.action-list')).wrap('<li>').parent().eq(0).addClass('first').end().eq(-1).addClass('last');$displayButtons.each(function(){const $this=$(this);this.value=$this.attr('data-drupal-dropdown-label');});$addDisplayDropdown.appendTo($menu);$menu.find('li.add > a').on('click',function(event){event.preventDefault();const $trigger=$(this);Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);});$('li.add',$menu).on('mouseleave',function(event){const $this=$(this);const $trigger=$this.children('a[href="#"]');if(Drupal.elementIsVisible($this.children('.action-list')[0]))Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu($trigger);});}};Drupal.behaviors.viewsUiRenderAddViewButton.toggleMenu=function($trigger){$trigger.parent().toggleClass('open');$trigger.next().slideToggle('fast');};Drupal.behaviors.viewsUiSearchOptions={attach(context){const $context=$(context);let $form=$context;if(!(context instanceof HTMLElement&&context.matches('form[id^="views-ui-add-handler-form"]')))$form=$context.find('form[id^="views-ui-add-handler-form"]');if(once('views-ui-filter-options',$form).length)new Drupal.viewsUi.OptionsSearch($form);}};Drupal.viewsUi.OptionsSearch=function($form){this.$form=$form;this.$form.on('click','td.title',(event)=>{const $target=$(event.currentTarget);$target.closest('tr').find('input').trigger('click');});const searchBoxSelector='[data-drupal-selector="edit-override-controls-options-search"]';const controlGroupSelector='[data-drupal-selector="edit-override-controls-group"]';this.$form.on('formUpdated',`${searchBoxSelector},${controlGroupSelector}`,this.handleFilter.bind(this));this.$searchBox=this.$form.find(searchBoxSelector);this.$controlGroup=this.$form.find(controlGroupSelector);this.options=this.getOptions(this.$form.find('.filterable-option'));this.$searchBox.on('keypress',(event)=>{if(event.which===13)event.preventDefault();});};$.extend(Drupal.viewsUi.OptionsSearch.prototype,{getOptions($allOptions){let $title;let $description;let $option;const options=[];const length=$allOptions.length;for(let i=0;i<length;i++){$option=$($allOptions[i]);$title=$option.find('.title');$description=$option.find('.description');options[i]={searchText:`${$title[0].textContent.toLowerCase()} ${$description[0].textContent.toLowerCase()}
              .toLowerCase()}`,$div:$option};}return options;},handleFilter(event){const search=this.$searchBox[0].value.toLowerCase();const words=search.split(' ');const group=this.$controlGroup[0].value;this.options.forEach((option)=>{function hasWord(word){return option.searchText.includes(word);}let found=true;if(search)found=words.every(hasWord);if(found&&group!=='all')found=option.$div.hasClass(group);option.$div.toggle(found);});event.target?.dispatchEvent(new CustomEvent('dialogContentResize',{bubbles:true}));}});Drupal.behaviors.viewsUiPreview={attach(context){const $contextualFiltersBucket=$(context).find('.views-display-column .views-ui-display-tab-bucket.argument');if($contextualFiltersBucket.length===0)return;const $contextualFilters=$contextualFiltersBucket.find('.views-display-setting a');if($contextualFilters.length)$('#preview-args').parent().show();else $('#preview-args').parent().hide();const $livePreview=$(once('edit-displays-live-preview','#edit-displays-live-preview'));if($livePreview.length&&$livePreview[0].checked)$(once('edit-displays-live-preview','#preview-submit')).trigger('click');}};Drupal.viewsUi.RearrangeFilterHandler=function($table,$operator){this.table=$table;this.operator=$operator;this.hasGroupOperator=this.operator.length>0;this.draggableRows=$table.find('.draggable');this.addGroupButton=$('#views-add-group');this.removeGroupButtons=$table.find('.views-remove-group');this.insertAddRemoveFilterGroupLinks();if(this.hasGroupOperator){this.dropdowns=this.duplicateGroupsOperator();this.syncGroupsOperators();}this.modifyTableDrag();this.redrawOperatorLabels();$(once('views-rearrange-filter-handler',$table.find('.views-group-title select'))).on('change.views-rearrange-filter-handler',this.redrawOperatorLabels.bind(this));$(once('views-rearrange-filter-handler',$table.find('a.views-groups-remove-link'))).on('click.views-rearrange-filter-handler',this.updateRowspans.bind(this)).on('click.views-rearrange-filter-handler',this.redrawOperatorLabels.bind(this));};$.extend(Drupal.viewsUi.RearrangeFilterHandler.prototype,{insertAddRemoveFilterGroupLinks(){$(once('views-rearrange-filter-handler',$(`<ul class="action-links"><li><a id="views-add-group-link" href="#">${this.addGroupButton[0].value}</a></li></ul>`).prependTo(this.table.parent()))).find('#views-add-group-link').on('click.views-rearrange-filter-handler',this.clickAddGroupButton.bind(this));const length=this.removeGroupButtons.length;let i;for(i=0;i<length;i++){const $removeGroupButton=$(this.removeGroupButtons[i]);const buttonId=$removeGroupButton.attr('id');$(once('views-rearrange-filter-handler',$(`<a href="#" class="views-remove-group-link">${Drupal.t('Remove group')}</a>`).insertBefore($removeGroupButton))).on('click.views-rearrange-filter-handler',{buttonId},this.clickRemoveGroupButton.bind(this));}},clickAddGroupButton(event){this.addGroupButton.trigger('mousedown');event.preventDefault();},clickRemoveGroupButton(event){this.table.find(`#${event.data.buttonId}`).trigger('mousedown');event.preventDefault();},duplicateGroupsOperator(){let newRow;let titleRow;const titleRows=once('duplicateGroupsOperator','tr.views-group-title');if(!titleRows.length)return this.operator;this.operator.find('label').add('div.description').addClass('visually-hidden');this.operator.find('select').addClass('form-select');const dropdowns=this.operator;titleRow=$('tr#views-group-title-2');newRow=$('<tr class="filter-group-operator-row"><td colspan="5"></td></tr>');newRow.find('td').append(this.operator);newRow.insertBefore(titleRow);const length=titleRows.length;for(let i=2;i<length;i++){titleRow=$(titleRows[i]);const fakeOperator=this.operator.clone();fakeOperator.attr('id','');newRow=$('<tr class="filter-group-operator-row"><td colspan="5"></td></tr>');newRow.find('td').append(fakeOperator);newRow.insertBefore(titleRow);dropdowns.add(fakeOperator);}return dropdowns;},syncGroupsOperators(){if(this.dropdowns.length<2)return;this.dropdowns.on('change',this.operatorChangeHandler.bind(this));},operatorChangeHandler(event){const $target=$(event.target);const operators=this.dropdowns.find('select').not($target);operators.each(function(index,item){item.value=$target[0].value;});},modifyTableDrag(){const tableDrag=Drupal.tableDrag['views-rearrange-filters'];const filterHandler=this;tableDrag.row.prototype.onSwap=function(){if(filterHandler.hasGroupOperator){const thisRow=$(this.group);const previousRow=thisRow.prev('tr');if(previousRow.length&&!previousRow.hasClass('group-message')&&!previousRow.hasClass('draggable')){const next=thisRow.next();if(next[0].tagName==='TR')this.swap('after',next);}filterHandler.updateRowspans();}filterHandler.redrawOperatorLabels();};tableDrag.onDrop=function(){const changeMarker=$(this.oldRowElement).find('.tabledrag-changed');if(changeMarker.length){const operatorLabel=changeMarker.prevAll('.views-operator-label');if(operatorLabel.length)operatorLabel.insertAfter(changeMarker);}const groupRow=$(this.rowObject.element).prevAll('tr.group-message').get(0);const groupName=groupRow.className.replace(/([^ ]+[ ]+)*group-([^ ]+)-message([ ]+[^ ]+)*/,'$2');const groupField=$('select.views-group-select',this.rowObject.element);if(!groupField[0].matches(`.views-group-select-${groupName}`)){const oldGroupName=groupField.attr('class').replace(/([^ ]+[ ]+)*views-group-select-([^ ]+)([ ]+[^ ]+)*/,'$2');groupField.removeClass(`views-group-select-${oldGroupName}`).addClass(`views-group-select-${groupName}`);groupField[0].value=groupName;}};},redrawOperatorLabels(){for(let i=0;i<this.draggableRows.length;i++){const $draggableRow=$(this.draggableRows[i]);const $firstCell=$draggableRow.find('td').eq(0);if($firstCell.length){const operatorValue=$draggableRow.prevAll('.views-group-title').find('option:selected').html();const operatorLabel=`<span class="views-operator-label">${operatorValue}</span>`;const $nextRow=$draggableRow.nextAll(':visible').eq(0);const $existingOperatorLabel=$firstCell.find('.views-operator-label');if($nextRow.hasClass('draggable'))if($existingOperatorLabel.length)$existingOperatorLabel.replaceWith(operatorLabel);else $firstCell.append(operatorLabel);else $existingOperatorLabel.remove();}}},updateRowspans(){let $row;let $currentEmptyRow;let draggableCount;let $operatorCell;const rows=$(this.table).find('tr');const length=rows.length;for(let i=0;i<length;i++){$row=$(rows[i]);if($row.hasClass('views-group-title')){$operatorCell=$row.find('td.group-operator');draggableCount=0;$currentEmptyRow=$row.next('tr');$currentEmptyRow.removeClass('group-populated').addClass('group-empty');$operatorCell.attr('rowspan',2);}else{if($row.hasClass('draggable')&&Drupal.elementIsVisible(rows[i])){draggableCount++;$currentEmptyRow.removeClass('group-empty').addClass('group-populated');$operatorCell.attr('rowspan',draggableCount+1);}}}}});Drupal.behaviors.viewsFilterConfigSelectAll={attach(context){const selectAll=once('filterConfigSelectAll','.js-form-item-options-value-all',context);if(selectAll.length){const $selectAll=$(selectAll);const $selectAllCheckbox=$selectAll.find('input[type=checkbox]');const $checkboxes=$selectAll.closest('.form-checkboxes').find('.js-form-type-checkbox:not(.js-form-item-options-value-all) input[type="checkbox"]');$selectAll.show();$selectAllCheckbox.on('click',function(){$checkboxes.prop('checked',this.checked);});$checkboxes.on('click',function(){if(this.checked===false)$selectAllCheckbox.prop('checked',false);});}}};Drupal.behaviors.viewsRemoveIconClass={attach(context){$(once('dropbutton-icon','.dropbutton',context)).find('.icon').removeClass('icon');}};Drupal.behaviors.viewsUiCheckboxify={attach(context,settings){const buttons=once('views-ui-checkboxify','[data-drupal-selector="edit-options-expose-button-button"], [data-drupal-selector="edit-options-group-button-button"]').forEach((button)=>new Drupal.viewsUi.Checkboxifier(button));}};Drupal.behaviors.viewsUiChangeDefaultWidget={attach(context){const $context=$(context);function changeDefaultWidget(event){if($(event.target).prop('checked')){$context.find('input.default-radios').parent().hide();$context.find('td.any-default-radios-row').parent().hide();$context.find('input.default-checkboxes').parent().show();}else{$context.find('input.default-checkboxes').parent().hide();$context.find('td.any-default-radios-row').parent().show();$context.find('input.default-radios').parent().show();}}$context.find('input[name="options[group_info][multiple]"]').on('change',changeDefaultWidget).trigger('change');}};Drupal.viewsUi.Checkboxifier=function(button){this.$button=$(button);this.$parent=this.$button.parent('div.views-expose, div.views-grouped');this.$input=this.$parent.find('input:checkbox, input:radio');this.$button.hide();this.$parent.find('.exposed-description, .grouped-description').hide();this.$input.on('click',this.clickHandler.bind(this));};Drupal.viewsUi.Checkboxifier.prototype.clickHandler=function(e){this.$button.trigger('click').trigger('submit');};Drupal.behaviors.viewsUiOverrideSelect={attach(context){once('views-ui-override-button-text','[data-drupal-selector="edit-override-dropdown"]',context).forEach((dropdown)=>{const submit=context.querySelector('[id^=edit-submit]');const oldValue=submit?submit.value:'';$(once('views-ui-override-button-text',submit)).on('mouseup',function(){this.value=oldValue;return true;});$(dropdown).on('change',function(){if(!submit)return;if(this.value==='default')submit.value=Drupal.t('Apply (all displays)');else if(this.value==='default_revert')submit.value=Drupal.t('Revert to default');else submit.value=Drupal.t('Apply (this display)');if(context!==document){const dialog=context.closest('.ui-dialog-content');dialog?.dispatchEvent(new CustomEvent('dialogButtonsChange'));}}).trigger('change');});}};Drupal.behaviors.viewsUiHandlerRemoveLink={attach(context){const $context=$(context);$(once('views','a.views-remove-link',context)).on('click',function(event){const id=$(this).attr('id').replace('views-remove-link-','');$context.find(`#views-row-${id}`).hide();$context.find(`#views-removed-${id}`).prop('checked',true);event.preventDefault();});$(once('display','a.display-remove-link',context)).on('click',function(event){const id=$(this).attr('id').replace('display-remove-link-','');$context.find(`#display-row-${id}`).hide();$context.find(`#display-removed-${id}`).prop('checked',true);event.preventDefault();});}};Drupal.behaviors.viewsUiRearrangeFilter={attach(context){if(typeof Drupal?.tableDrag?.['views-rearrange-filters']==='undefined')return;const table=once('views-rearrange-filters','#views-rearrange-filters',context);const operator=once('views-rearrange-filters','.js-form-item-filter-groups-operator',context);if(table.length)new Drupal.viewsUi.RearrangeFilterHandler($(table),$(operator));}};})(jQuery,Drupal,drupalSettings);;
