/*! For license information please see 883.2efd938bef4fa6d90121.js.LICENSE.txt */
(self.webpackChunkaudiovisual=self.webpackChunkaudiovisual||[]).push([[883],{531:(e,n,t)=>{"use strict";t.d(n,{lX:()=>w,q_:()=>E,ob:()=>d,PP:()=>_,Ep:()=>p});var r=t(462);function o(e){return"/"===e.charAt(0)}function i(e,n){for(var t=n,r=t+1,o=e.length;r<o;t+=1,r+=1)e[t]=e[r];e.pop()}const a=function(e,n){void 0===n&&(n="");var t,r=e&&e.split("/")||[],a=n&&n.split("/")||[],c=e&&o(e),u=n&&o(n),s=c||u;if(e&&o(e)?a=r:r.length&&(a.pop(),a=a.concat(r)),!a.length)return"/";if(a.length){var f=a[a.length-1];t="."===f||".."===f||""===f}else t=!1;for(var l=0,p=a.length;p>=0;p--){var d=a[p];"."===d?i(a,p):".."===d?(i(a,p),l++):l&&(i(a,p),l--)}if(!s)for(;l--;l)a.unshift("..");!s||""===a[0]||a[0]&&o(a[0])||a.unshift("");var h=a.join("/");return t&&"/"!==h.substr(-1)&&(h+="/"),h};var c=t(776);function u(e){return"/"===e.charAt(0)?e:"/"+e}function s(e){return"/"===e.charAt(0)?e.substr(1):e}function f(e,n){return function(e,n){return 0===e.toLowerCase().indexOf(n.toLowerCase())&&-1!=="/?#".indexOf(e.charAt(n.length))}(e,n)?e.substr(n.length):e}function l(e){return"/"===e.charAt(e.length-1)?e.slice(0,-1):e}function p(e){var n=e.pathname,t=e.search,r=e.hash,o=n||"/";return t&&"?"!==t&&(o+="?"===t.charAt(0)?t:"?"+t),r&&"#"!==r&&(o+="#"===r.charAt(0)?r:"#"+r),o}function d(e,n,t,o){var i;"string"==typeof e?(i=function(e){var n=e||"/",t="",r="",o=n.indexOf("#");-1!==o&&(r=n.substr(o),n=n.substr(0,o));var i=n.indexOf("?");return-1!==i&&(t=n.substr(i),n=n.substr(0,i)),{pathname:n,search:"?"===t?"":t,hash:"#"===r?"":r}}(e),i.state=n):(void 0===(i=(0,r.Z)({},e)).pathname&&(i.pathname=""),i.search?"?"!==i.search.charAt(0)&&(i.search="?"+i.search):i.search="",i.hash?"#"!==i.hash.charAt(0)&&(i.hash="#"+i.hash):i.hash="",void 0!==n&&void 0===i.state&&(i.state=n));try{i.pathname=decodeURI(i.pathname)}catch(e){throw e instanceof URIError?new URIError('Pathname "'+i.pathname+'" could not be decoded. This is likely caused by an invalid percent-encoding.'):e}return t&&(i.key=t),o?i.pathname?"/"!==i.pathname.charAt(0)&&(i.pathname=a(i.pathname,o.pathname)):i.pathname=o.pathname:i.pathname||(i.pathname="/"),i}function h(){var e=null,n=[];return{setPrompt:function(n){return e=n,function(){e===n&&(e=null)}},confirmTransitionTo:function(n,t,r,o){if(null!=e){var i="function"==typeof e?e(n,t):e;"string"==typeof i?"function"==typeof r?r(i,o):o(!0):o(!1!==i)}else o(!0)},appendListener:function(e){var t=!0;function r(){t&&e.apply(void 0,arguments)}return n.push(r),function(){t=!1,n=n.filter((function(e){return e!==r}))}},notifyListeners:function(){for(var e=arguments.length,t=new Array(e),r=0;r<e;r++)t[r]=arguments[r];n.forEach((function(e){return e.apply(void 0,t)}))}}}var v=!("undefined"==typeof window||!window.document||!window.document.createElement);function y(e,n){n(window.confirm(e))}var m="popstate",b="hashchange";function g(){try{return window.history.state||{}}catch(e){return{}}}function w(e){void 0===e&&(e={}),v||(0,c.Z)(!1);var n,t=window.history,o=(-1===(n=window.navigator.userAgent).indexOf("Android 2.")&&-1===n.indexOf("Android 4.0")||-1===n.indexOf("Mobile Safari")||-1!==n.indexOf("Chrome")||-1!==n.indexOf("Windows Phone"))&&window.history&&"pushState"in window.history,i=!(-1===window.navigator.userAgent.indexOf("Trident")),a=e,s=a.forceRefresh,w=void 0!==s&&s,x=a.getUserConfirmation,O=void 0===x?y:x,P=a.keyLength,k=void 0===P?6:P,T=e.basename?l(u(e.basename)):"";function E(e){var n=e||{},t=n.key,r=n.state,o=window.location,i=o.pathname+o.search+o.hash;return T&&(i=f(i,T)),d(i,r,t)}function S(){return Math.random().toString(36).substr(2,k)}var _=h();function j(e){(0,r.Z)(q,e),q.length=t.length,_.notifyListeners(q.location,q.action)}function C(e){(function(e){return void 0===e.state&&-1===navigator.userAgent.indexOf("CriOS")})(e)||L(E(e.state))}function $(){L(E(g()))}var A=!1;function L(e){A?(A=!1,j()):_.confirmTransitionTo(e,"POP",O,(function(n){n?j({action:"POP",location:e}):function(e){var n=q.location,t=I.indexOf(n.key);-1===t&&(t=0);var r=I.indexOf(e.key);-1===r&&(r=0);var o=t-r;o&&(A=!0,F(o))}(e)}))}var R=E(g()),I=[R.key];function M(e){return T+p(e)}function F(e){t.go(e)}var U=0;function N(e){1===(U+=e)&&1===e?(window.addEventListener(m,C),i&&window.addEventListener(b,$)):0===U&&(window.removeEventListener(m,C),i&&window.removeEventListener(b,$))}var Z=!1,q={length:t.length,action:"POP",location:R,createHref:M,push:function(e,n){var r="PUSH",i=d(e,n,S(),q.location);_.confirmTransitionTo(i,r,O,(function(e){if(e){var n=M(i),a=i.key,c=i.state;if(o)if(t.pushState({key:a,state:c},null,n),w)window.location.href=n;else{var u=I.indexOf(q.location.key),s=I.slice(0,u+1);s.push(i.key),I=s,j({action:r,location:i})}else window.location.href=n}}))},replace:function(e,n){var r="REPLACE",i=d(e,n,S(),q.location);_.confirmTransitionTo(i,r,O,(function(e){if(e){var n=M(i),a=i.key,c=i.state;if(o)if(t.replaceState({key:a,state:c},null,n),w)window.location.replace(n);else{var u=I.indexOf(q.location.key);-1!==u&&(I[u]=i.key),j({action:r,location:i})}else window.location.replace(n)}}))},go:F,goBack:function(){F(-1)},goForward:function(){F(1)},block:function(e){void 0===e&&(e=!1);var n=_.setPrompt(e);return Z||(N(1),Z=!0),function(){return Z&&(Z=!1,N(-1)),n()}},listen:function(e){var n=_.appendListener(e);return N(1),function(){N(-1),n()}}};return q}var x="hashchange",O={hashbang:{encodePath:function(e){return"!"===e.charAt(0)?e:"!/"+s(e)},decodePath:function(e){return"!"===e.charAt(0)?e.substr(1):e}},noslash:{encodePath:s,decodePath:u},slash:{encodePath:u,decodePath:u}};function P(e){var n=e.indexOf("#");return-1===n?e:e.slice(0,n)}function k(){var e=window.location.href,n=e.indexOf("#");return-1===n?"":e.substring(n+1)}function T(e){window.location.replace(P(window.location.href)+"#"+e)}function E(e){void 0===e&&(e={}),v||(0,c.Z)(!1);var n=window.history,t=(window.navigator.userAgent.indexOf("Firefox"),e),o=t.getUserConfirmation,i=void 0===o?y:o,a=t.hashType,s=void 0===a?"slash":a,m=e.basename?l(u(e.basename)):"",b=O[s],g=b.encodePath,w=b.decodePath;function E(){var e=w(k());return m&&(e=f(e,m)),d(e)}var S=h();function _(e){(0,r.Z)(Z,e),Z.length=n.length,S.notifyListeners(Z.location,Z.action)}var j=!1,C=null;function $(){var e,n,t=k(),r=g(t);if(t!==r)T(r);else{var o=E(),a=Z.location;if(!j&&(n=o,(e=a).pathname===n.pathname&&e.search===n.search&&e.hash===n.hash))return;if(C===p(o))return;C=null,function(e){if(j)j=!1,_();else{S.confirmTransitionTo(e,"POP",i,(function(n){n?_({action:"POP",location:e}):function(e){var n=Z.location,t=I.lastIndexOf(p(n));-1===t&&(t=0);var r=I.lastIndexOf(p(e));-1===r&&(r=0);var o=t-r;o&&(j=!0,M(o))}(e)}))}}(o)}}var A=k(),L=g(A);A!==L&&T(L);var R=E(),I=[p(R)];function M(e){n.go(e)}var F=0;function U(e){1===(F+=e)&&1===e?window.addEventListener(x,$):0===F&&window.removeEventListener(x,$)}var N=!1,Z={length:n.length,action:"POP",location:R,createHref:function(e){var n=document.querySelector("base"),t="";return n&&n.getAttribute("href")&&(t=P(window.location.href)),t+"#"+g(m+p(e))},push:function(e,n){var t="PUSH",r=d(e,void 0,void 0,Z.location);S.confirmTransitionTo(r,t,i,(function(e){if(e){var n=p(r),o=g(m+n);if(k()!==o){C=n,function(e){window.location.hash=e}(o);var i=I.lastIndexOf(p(Z.location)),a=I.slice(0,i+1);a.push(n),I=a,_({action:t,location:r})}else _()}}))},replace:function(e,n){var t="REPLACE",r=d(e,void 0,void 0,Z.location);S.confirmTransitionTo(r,t,i,(function(e){if(e){var n=p(r),o=g(m+n);k()!==o&&(C=n,T(o));var i=I.indexOf(p(Z.location));-1!==i&&(I[i]=n),_({action:t,location:r})}}))},go:M,goBack:function(){M(-1)},goForward:function(){M(1)},block:function(e){void 0===e&&(e=!1);var n=S.setPrompt(e);return N||(U(1),N=!0),function(){return N&&(N=!1,U(-1)),n()}},listen:function(e){var n=S.appendListener(e);return U(1),function(){U(-1),n()}}};return Z}function S(e,n,t){return Math.min(Math.max(e,n),t)}function _(e){void 0===e&&(e={});var n=e,t=n.getUserConfirmation,o=n.initialEntries,i=void 0===o?["/"]:o,a=n.initialIndex,c=void 0===a?0:a,u=n.keyLength,s=void 0===u?6:u,f=h();function l(e){(0,r.Z)(w,e),w.length=w.entries.length,f.notifyListeners(w.location,w.action)}function v(){return Math.random().toString(36).substr(2,s)}var y=S(c,0,i.length-1),m=i.map((function(e){return d(e,void 0,"string"==typeof e?v():e.key||v())})),b=p;function g(e){var n=S(w.index+e,0,w.entries.length-1),r=w.entries[n];f.confirmTransitionTo(r,"POP",t,(function(e){e?l({action:"POP",location:r,index:n}):l()}))}var w={length:m.length,action:"POP",location:m[y],index:y,entries:m,createHref:b,push:function(e,n){var r="PUSH",o=d(e,n,v(),w.location);f.confirmTransitionTo(o,r,t,(function(e){if(e){var n=w.index+1,t=w.entries.slice(0);t.length>n?t.splice(n,t.length-n,o):t.push(o),l({action:r,location:o,index:n,entries:t})}}))},replace:function(e,n){var r="REPLACE",o=d(e,n,v(),w.location);f.confirmTransitionTo(o,r,t,(function(e){e&&(w.entries[w.index]=o,l({action:r,location:o}))}))},go:g,goBack:function(){g(-1)},goForward:function(){g(1)},canGo:function(e){var n=w.index+e;return n>=0&&n<w.entries.length},block:function(e){return void 0===e&&(e=!1),f.setPrompt(e)},listen:function(e){return f.appendListener(e)}};return w}},679:(e,n,t)=>{"use strict";var r=t(864),o={childContextTypes:!0,contextType:!0,contextTypes:!0,defaultProps:!0,displayName:!0,getDefaultProps:!0,getDerivedStateFromError:!0,getDerivedStateFromProps:!0,mixins:!0,propTypes:!0,type:!0},i={name:!0,length:!0,prototype:!0,caller:!0,callee:!0,arguments:!0,arity:!0},a={$$typeof:!0,compare:!0,defaultProps:!0,displayName:!0,propTypes:!0,type:!0},c={};function u(e){return r.isMemo(e)?a:c[e.$$typeof]||o}c[r.ForwardRef]={$$typeof:!0,render:!0,defaultProps:!0,displayName:!0,propTypes:!0},c[r.Memo]=a;var s=Object.defineProperty,f=Object.getOwnPropertyNames,l=Object.getOwnPropertySymbols,p=Object.getOwnPropertyDescriptor,d=Object.getPrototypeOf,h=Object.prototype;e.exports=function e(n,t,r){if("string"!=typeof t){if(h){var o=d(t);o&&o!==h&&e(n,o,r)}var a=f(t);l&&(a=a.concat(l(t)));for(var c=u(n),v=u(t),y=0;y<a.length;++y){var m=a[y];if(!(i[m]||r&&r[m]||v&&v[m]||c&&c[m])){var b=p(t,m);try{s(n,m,b)}catch(e){}}}}return n}},418:e=>{"use strict";var n=Object.getOwnPropertySymbols,t=Object.prototype.hasOwnProperty,r=Object.prototype.propertyIsEnumerable;e.exports=function(){try{if(!Object.assign)return!1;var e=new String("abc");if(e[5]="de","5"===Object.getOwnPropertyNames(e)[0])return!1;for(var n={},t=0;t<10;t++)n["_"+String.fromCharCode(t)]=t;if("0123456789"!==Object.getOwnPropertyNames(n).map((function(e){return n[e]})).join(""))return!1;var r={};return"abcdefghijklmnopqrst".split("").forEach((function(e){r[e]=e})),"abcdefghijklmnopqrst"===Object.keys(Object.assign({},r)).join("")}catch(e){return!1}}()?Object.assign:function(e,o){for(var i,a,c=function(e){if(null==e)throw new TypeError("Object.assign cannot be called with null or undefined");return Object(e)}(e),u=1;u<arguments.length;u++){for(var s in i=Object(arguments[u]))t.call(i,s)&&(c[s]=i[s]);if(n){a=n(i);for(var f=0;f<a.length;f++)r.call(i,a[f])&&(c[a[f]]=i[a[f]])}}return c}},703:(e,n,t)=>{"use strict";var r=t(414);function o(){}function i(){}i.resetWarningCache=o,e.exports=function(){function e(e,n,t,o,i,a){if(a!==r){var c=new Error("Calling PropTypes validators directly is not supported by the `prop-types` package. Use PropTypes.checkPropTypes() to call them. Read more at http://fb.me/use-check-prop-types");throw c.name="Invariant Violation",c}}function n(){return e}e.isRequired=e;var t={array:e,bigint:e,bool:e,func:e,number:e,object:e,string:e,symbol:e,any:e,arrayOf:n,element:e,elementType:e,instanceOf:n,node:e,objectOf:n,oneOf:n,oneOfType:n,shape:n,exact:n,checkPropTypes:i,resetWarningCache:o};return t.PropTypes=t,t}},697:(e,n,t)=>{e.exports=t(703)()},414:e=>{"use strict";e.exports="SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED"},921:(e,n)=>{"use strict";var t="function"==typeof Symbol&&Symbol.for,r=t?Symbol.for("react.element"):60103,o=t?Symbol.for("react.portal"):60106,i=t?Symbol.for("react.fragment"):60107,a=t?Symbol.for("react.strict_mode"):60108,c=t?Symbol.for("react.profiler"):60114,u=t?Symbol.for("react.provider"):60109,s=t?Symbol.for("react.context"):60110,f=t?Symbol.for("react.async_mode"):60111,l=t?Symbol.for("react.concurrent_mode"):60111,p=t?Symbol.for("react.forward_ref"):60112,d=t?Symbol.for("react.suspense"):60113,h=t?Symbol.for("react.suspense_list"):60120,v=t?Symbol.for("react.memo"):60115,y=t?Symbol.for("react.lazy"):60116,m=t?Symbol.for("react.block"):60121,b=t?Symbol.for("react.fundamental"):60117,g=t?Symbol.for("react.responder"):60118,w=t?Symbol.for("react.scope"):60119;function x(e){if("object"==typeof e&&null!==e){var n=e.$$typeof;switch(n){case r:switch(e=e.type){case f:case l:case i:case c:case a:case d:return e;default:switch(e=e&&e.$$typeof){case s:case p:case y:case v:case u:return e;default:return n}}case o:return n}}}function O(e){return x(e)===l}n.AsyncMode=f,n.ConcurrentMode=l,n.ContextConsumer=s,n.ContextProvider=u,n.Element=r,n.ForwardRef=p,n.Fragment=i,n.Lazy=y,n.Memo=v,n.Portal=o,n.Profiler=c,n.StrictMode=a,n.Suspense=d,n.isAsyncMode=function(e){return O(e)||x(e)===f},n.isConcurrentMode=O,n.isContextConsumer=function(e){return x(e)===s},n.isContextProvider=function(e){return x(e)===u},n.isElement=function(e){return"object"==typeof e&&null!==e&&e.$$typeof===r},n.isForwardRef=function(e){return x(e)===p},n.isFragment=function(e){return x(e)===i},n.isLazy=function(e){return x(e)===y},n.isMemo=function(e){return x(e)===v},n.isPortal=function(e){return x(e)===o},n.isProfiler=function(e){return x(e)===c},n.isStrictMode=function(e){return x(e)===a},n.isSuspense=function(e){return x(e)===d},n.isValidElementType=function(e){return"string"==typeof e||"function"==typeof e||e===i||e===l||e===c||e===a||e===d||e===h||"object"==typeof e&&null!==e&&(e.$$typeof===y||e.$$typeof===v||e.$$typeof===u||e.$$typeof===s||e.$$typeof===p||e.$$typeof===b||e.$$typeof===g||e.$$typeof===w||e.$$typeof===m)},n.typeOf=x},864:(e,n,t)=>{"use strict";e.exports=t(921)},585:e=>{e.exports=Array.isArray||function(e){return"[object Array]"==Object.prototype.toString.call(e)}},658:(e,n,t)=>{var r=t(585);e.exports=function e(n,t,o){return r(t)||(o=t||o,t=[]),o=o||{},n instanceof RegExp?function(e,n){var t=e.source.match(/\((?!\?)/g);if(t)for(var r=0;r<t.length;r++)n.push({name:r,prefix:null,delimiter:null,optional:!1,repeat:!1,partial:!1,asterisk:!1,pattern:null});return f(e,n)}(n,t):r(n)?function(n,t,r){for(var o=[],i=0;i<n.length;i++)o.push(e(n[i],t,r).source);return f(new RegExp("(?:"+o.join("|")+")",l(r)),t)}(n,t,o):function(e,n,t){return p(i(e,t),n,t)}(n,t,o)},e.exports.parse=i,e.exports.compile=function(e,n){return c(i(e,n),n)},e.exports.tokensToFunction=c,e.exports.tokensToRegExp=p;var o=new RegExp(["(\\\\.)","([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^\\\\()])+)\\))?|\\(((?:\\\\.|[^\\\\()])+)\\))([+*?])?|(\\*))"].join("|"),"g");function i(e,n){for(var t,r=[],i=0,a=0,c="",f=n&&n.delimiter||"/";null!=(t=o.exec(e));){var l=t[0],p=t[1],d=t.index;if(c+=e.slice(a,d),a=d+l.length,p)c+=p[1];else{var h=e[a],v=t[2],y=t[3],m=t[4],b=t[5],g=t[6],w=t[7];c&&(r.push(c),c="");var x=null!=v&&null!=h&&h!==v,O="+"===g||"*"===g,P="?"===g||"*"===g,k=t[2]||f,T=m||b;r.push({name:y||i++,prefix:v||"",delimiter:k,optional:P,repeat:O,partial:x,asterisk:!!w,pattern:T?s(T):w?".*":"[^"+u(k)+"]+?"})}}return a<e.length&&(c+=e.substr(a)),c&&r.push(c),r}function a(e){return encodeURI(e).replace(/[\/?#]/g,(function(e){return"%"+e.charCodeAt(0).toString(16).toUpperCase()}))}function c(e,n){for(var t=new Array(e.length),o=0;o<e.length;o++)"object"==typeof e[o]&&(t[o]=new RegExp("^(?:"+e[o].pattern+")$",l(n)));return function(n,o){for(var i="",c=n||{},u=(o||{}).pretty?a:encodeURIComponent,s=0;s<e.length;s++){var f=e[s];if("string"!=typeof f){var l,p=c[f.name];if(null==p){if(f.optional){f.partial&&(i+=f.prefix);continue}throw new TypeError('Expected "'+f.name+'" to be defined')}if(r(p)){if(!f.repeat)throw new TypeError('Expected "'+f.name+'" to not repeat, but received `'+JSON.stringify(p)+"`");if(0===p.length){if(f.optional)continue;throw new TypeError('Expected "'+f.name+'" to not be empty')}for(var d=0;d<p.length;d++){if(l=u(p[d]),!t[s].test(l))throw new TypeError('Expected all "'+f.name+'" to match "'+f.pattern+'", but received `'+JSON.stringify(l)+"`");i+=(0===d?f.prefix:f.delimiter)+l}}else{if(l=f.asterisk?encodeURI(p).replace(/[?#]/g,(function(e){return"%"+e.charCodeAt(0).toString(16).toUpperCase()})):u(p),!t[s].test(l))throw new TypeError('Expected "'+f.name+'" to match "'+f.pattern+'", but received "'+l+'"');i+=f.prefix+l}}else i+=f}return i}}function u(e){return e.replace(/([.+*?=^!:${}()[\]|\/\\])/g,"\\$1")}function s(e){return e.replace(/([=!:$\/()])/g,"\\$1")}function f(e,n){return e.keys=n,e}function l(e){return e&&e.sensitive?"":"i"}function p(e,n,t){r(n)||(t=n||t,n=[]);for(var o=(t=t||{}).strict,i=!1!==t.end,a="",c=0;c<e.length;c++){var s=e[c];if("string"==typeof s)a+=u(s);else{var p=u(s.prefix),d="(?:"+s.pattern+")";n.push(s),s.repeat&&(d+="(?:"+p+d+")*"),a+=d=s.optional?s.partial?p+"("+d+")?":"(?:"+p+"("+d+"))?":p+"("+d+")"}}var h=u(t.delimiter||"/"),v=a.slice(-h.length)===h;return o||(a=(v?a.slice(0,-h.length):a)+"(?:"+h+"(?=$))?"),a+=i?"$":o&&v?"":"(?="+h+"|$)",f(new RegExp("^"+a,l(t)),n)}},53:(e,n)=>{"use strict";var t,r,o,i;if("object"==typeof performance&&"function"==typeof performance.now){var a=performance;n.unstable_now=function(){return a.now()}}else{var c=Date,u=c.now();n.unstable_now=function(){return c.now()-u}}if("undefined"==typeof window||"function"!=typeof MessageChannel){var s=null,f=null,l=function(){if(null!==s)try{var e=n.unstable_now();s(!0,e),s=null}catch(e){throw setTimeout(l,0),e}};t=function(e){null!==s?setTimeout(t,0,e):(s=e,setTimeout(l,0))},r=function(e,n){f=setTimeout(e,n)},o=function(){clearTimeout(f)},n.unstable_shouldYield=function(){return!1},i=n.unstable_forceFrameRate=function(){}}else{var p=window.setTimeout,d=window.clearTimeout;if("undefined"!=typeof console){var h=window.cancelAnimationFrame;"function"!=typeof window.requestAnimationFrame&&console.error("This browser doesn't support requestAnimationFrame. Make sure that you load a polyfill in older browsers. https://reactjs.org/link/react-polyfills"),"function"!=typeof h&&console.error("This browser doesn't support cancelAnimationFrame. Make sure that you load a polyfill in older browsers. https://reactjs.org/link/react-polyfills")}var v=!1,y=null,m=-1,b=5,g=0;n.unstable_shouldYield=function(){return n.unstable_now()>=g},i=function(){},n.unstable_forceFrameRate=function(e){0>e||125<e?console.error("forceFrameRate takes a positive int between 0 and 125, forcing frame rates higher than 125 fps is not supported"):b=0<e?Math.floor(1e3/e):5};var w=new MessageChannel,x=w.port2;w.port1.onmessage=function(){if(null!==y){var e=n.unstable_now();g=e+b;try{y(!0,e)?x.postMessage(null):(v=!1,y=null)}catch(e){throw x.postMessage(null),e}}else v=!1},t=function(e){y=e,v||(v=!0,x.postMessage(null))},r=function(e,t){m=p((function(){e(n.unstable_now())}),t)},o=function(){d(m),m=-1}}function O(e,n){var t=e.length;e.push(n);e:for(;;){var r=t-1>>>1,o=e[r];if(!(void 0!==o&&0<T(o,n)))break e;e[r]=n,e[t]=o,t=r}}function P(e){return void 0===(e=e[0])?null:e}function k(e){var n=e[0];if(void 0!==n){var t=e.pop();if(t!==n){e[0]=t;e:for(var r=0,o=e.length;r<o;){var i=2*(r+1)-1,a=e[i],c=i+1,u=e[c];if(void 0!==a&&0>T(a,t))void 0!==u&&0>T(u,a)?(e[r]=u,e[c]=t,r=c):(e[r]=a,e[i]=t,r=i);else{if(!(void 0!==u&&0>T(u,t)))break e;e[r]=u,e[c]=t,r=c}}}return n}return null}function T(e,n){var t=e.sortIndex-n.sortIndex;return 0!==t?t:e.id-n.id}var E=[],S=[],_=1,j=null,C=3,$=!1,A=!1,L=!1;function R(e){for(var n=P(S);null!==n;){if(null===n.callback)k(S);else{if(!(n.startTime<=e))break;k(S),n.sortIndex=n.expirationTime,O(E,n)}n=P(S)}}function I(e){if(L=!1,R(e),!A)if(null!==P(E))A=!0,t(M);else{var n=P(S);null!==n&&r(I,n.startTime-e)}}function M(e,t){A=!1,L&&(L=!1,o()),$=!0;var i=C;try{for(R(t),j=P(E);null!==j&&(!(j.expirationTime>t)||e&&!n.unstable_shouldYield());){var a=j.callback;if("function"==typeof a){j.callback=null,C=j.priorityLevel;var c=a(j.expirationTime<=t);t=n.unstable_now(),"function"==typeof c?j.callback=c:j===P(E)&&k(E),R(t)}else k(E);j=P(E)}if(null!==j)var u=!0;else{var s=P(S);null!==s&&r(I,s.startTime-t),u=!1}return u}finally{j=null,C=i,$=!1}}var F=i;n.unstable_IdlePriority=5,n.unstable_ImmediatePriority=1,n.unstable_LowPriority=4,n.unstable_NormalPriority=3,n.unstable_Profiling=null,n.unstable_UserBlockingPriority=2,n.unstable_cancelCallback=function(e){e.callback=null},n.unstable_continueExecution=function(){A||$||(A=!0,t(M))},n.unstable_getCurrentPriorityLevel=function(){return C},n.unstable_getFirstCallbackNode=function(){return P(E)},n.unstable_next=function(e){switch(C){case 1:case 2:case 3:var n=3;break;default:n=C}var t=C;C=n;try{return e()}finally{C=t}},n.unstable_pauseExecution=function(){},n.unstable_requestPaint=F,n.unstable_runWithPriority=function(e,n){switch(e){case 1:case 2:case 3:case 4:case 5:break;default:e=3}var t=C;C=e;try{return n()}finally{C=t}},n.unstable_scheduleCallback=function(e,i,a){var c=n.unstable_now();switch(a="object"==typeof a&&null!==a&&"number"==typeof(a=a.delay)&&0<a?c+a:c,e){case 1:var u=-1;break;case 2:u=250;break;case 5:u=1073741823;break;case 4:u=1e4;break;default:u=5e3}return e={id:_++,callback:i,priorityLevel:e,startTime:a,expirationTime:u=a+u,sortIndex:-1},a>c?(e.sortIndex=a,O(S,e),null===P(E)&&e===P(S)&&(L?o():L=!0,r(I,a-c))):(e.sortIndex=u,O(E,e),A||$||(A=!0,t(M))),e},n.unstable_wrapCallback=function(e){var n=C;return function(){var t=C;C=n;try{return e.apply(this,arguments)}finally{C=t}}}},840:(e,n,t)=>{"use strict";e.exports=t(53)},462:(e,n,t)=>{"use strict";function r(){return r=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var t=arguments[n];for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r])}return e},r.apply(this,arguments)}t.d(n,{Z:()=>r})},721:(e,n,t)=>{"use strict";function r(e,n){return r=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(e,n){return e.__proto__=n,e},r(e,n)}function o(e,n){e.prototype=Object.create(n.prototype),e.prototype.constructor=e,r(e,n)}t.d(n,{Z:()=>o})},366:(e,n,t)=>{"use strict";function r(e,n){if(null==e)return{};var t,r,o={},i=Object.keys(e);for(r=0;r<i.length;r++)t=i[r],n.indexOf(t)>=0||(o[t]=e[t]);return o}t.d(n,{Z:()=>r})},776:(e,n,t)=>{"use strict";t.d(n,{Z:()=>i});var r=!0,o="Invariant failed";function i(e,n){if(!e){if(r)throw new Error(o);var t="function"==typeof n?n():n,i=t?"".concat(o,": ").concat(t):o;throw new Error(i)}}}}]);