import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

// Tracking snippet served at /script.js. Keep compact; favor correct escaping over minification.
const SCRIPT = [
  `!function(){"use strict";`,
  `var w=window,d=document;`,
  `if(w.ustats&&w.ustats._l)return;`,
  `var s=d.currentScript;`,
  `if(!s||!s.getAttribute("data-key")){`,
  `var all=d.getElementsByTagName("script"),si;`,
  `for(si=all.length-1;si>=0;si--){`,
  `if(all[si].getAttribute("data-key")&&all[si].src&&all[si].src.indexOf("script.js")!==-1){s=all[si];break}`,
  `}`,
  `}`,
  `var endpoint=(s&&s.getAttribute("data-api"))||(s&&s.src?s.src.replace(/\\/script\\.js(?:\\?.*)?$/,"/api/collect"):"/api/collect"),`,
  `errorEndpoint=endpoint.replace(/\\/api\\/collect(?:\\?.*)?$/,"/api/errors/collect"),`,
  `key=(s&&s.getAttribute("data-key"))||"",`,
  `ignorePaths=parseIgnore((s&&s.getAttribute("data-ignore-paths"))||"");`,
  `function parseIgnore(raw){`,
  `if(!raw)return[];`,
  `raw=String(raw).trim().replace(/&quot;/g,'"').replace(/&#39;/g,"'");`,
  `if(raw.charAt(0)==="["){`,
  `try{var j=JSON.parse(raw.replace(/'/g,'"'));if(Array.isArray(j))return j.map(String).filter(Boolean)}catch(e){}`,
  `}`,
  `return raw.split(",").map(function(p){return p.replace(/^\\[|\\]$/g,"").replace(/^["']|["']$/g,"").trim()}).filter(Boolean)`,
  `}`,
  `function matchPath(pathname,pattern){`,
  `var pi=0,gi=0,star=-1,match=0;`,
  `while(pi<pathname.length){`,
  `if(gi<pattern.length&&pattern.charAt(gi)==="*"){star=gi++;match=pi;continue}`,
  `if(gi<pattern.length&&pattern.charAt(gi)===pathname.charAt(pi)){gi++;pi++;continue}`,
  `if(star!==-1){gi=star+1;match++;pi=match;continue}`,
  `return!1`,
  `}`,
  `while(gi<pattern.length&&pattern.charAt(gi)==="*")gi++;`,
  `return gi===pattern.length`,
  `}`,
  `function isIgnored(){`,
  `var path=w.location.pathname,i;`,
  `for(i=0;i<ignorePaths.length;i++){if(matchPath(path,ignorePaths[i]))return!0}`,
  `return!1`,
  `}`,
  `function payload(n,u,r,p){return{k:key,n:n||"pageview",u:u||w.location.href,r:r==null?d.referrer:r,d:w.location.hostname,p:p||{}}}`,
  `function send(url,data){`,
  `if(!key||isIgnored())return;`,
  `var body=JSON.stringify(data);`,
  // Prefer fetch with credentials omitted — sendBeacon is credentialed and
  // application/json forces a CORS preflight that fails without Allow-Credentials.
  `fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:body,keepalive:!0,mode:"cors",credentials:"omit"}).catch(function(){`,
  `if(w.navigator&&typeof w.navigator.sendBeacon==="function"){`,
  // text/plain avoids a preflight; browsers still treat beacon as credentialed.
  `try{w.navigator.sendBeacon(url,new Blob([body],{type:"text/plain"}))}catch(e){}`,
  `}`,
  `})`,
  `}`,
  `function track(name,props){send(endpoint,payload(name,w.location.href,d.referrer,props))}`,
  `function page(){track("pageview")}`,
  `function captureException(err,extra){`,
  `var message,type,stack;`,
  `if(err&&typeof err==="object"){message=String(err.message||err);type=String(err.name||"Error");stack=typeof err.stack==="string"?err.stack:""}`,
  `else{message=String(err);type="Error";stack=""}`,
  `if(!message)return;`,
  `send(errorEndpoint,{k:key,m:message.slice(0,2e3),t:type.slice(0,128),s:stack?String(stack).slice(0,16384):"",u:w.location.href,d:w.location.hostname,l:"error",x:extra&&typeof extra==="object"?extra:{}})`,
  `}`,
  `function onError(msg,source,lineno,colno,error){`,
  `if(error){captureException(error);return}`,
  `captureException({name:"Error",message:String(msg||"Script error"),stack:(source||"")+(lineno!=null?":"+lineno:"")+(colno!=null?":"+colno:"")})`,
  `}`,
  `function onRejection(event){captureException(event&&event.reason!=null?event.reason:"Unhandled rejection")}`,
  `var last=w.location.pathname+w.location.search;`,
  `function onChange(){var now=w.location.pathname+w.location.search;if(now===last)return;last=now;page()}`,
  `var pushState=history.pushState;`,
  `history.pushState=function(){var ret=pushState.apply(this,arguments);onChange();return ret};`,
  `var replaceState=history.replaceState;`,
  `history.replaceState=function(){var ret=replaceState.apply(this,arguments);onChange();return ret};`,
  `w.addEventListener("popstate",onChange);`,
  `w.addEventListener("error",function(event){`,
  `if(event&&event.error){captureException(event.error);return}`,
  `onError(event&&event.message,event&&event.filename,event&&event.lineno,event&&event.colno,event&&event.error)`,
  `});`,
  `w.addEventListener("unhandledrejection",onRejection);`,
  `w.ustats={track:track,page:page,captureException:captureException,ignorePaths:ignorePaths,_l:!0};`,
  `if(d.visibilityState!=="prerender")page()`,
  `}();`,
].join("");

const SCRIPT_ETAG = `"${createHash("sha1").update(SCRIPT).digest("hex")}"`;

export async function GET(request: Request) {
  const ifNoneMatch = request.headers.get("if-none-match");
  if (ifNoneMatch === SCRIPT_ETAG) {
    return new NextResponse(null, {
      status: 304,
      headers: {
        ETag: SCRIPT_ETAG,
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }

  return new NextResponse(SCRIPT, {
    status: 200,
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      ETag: SCRIPT_ETAG,
      // Revalidate on every request so script updates (e.g. ignore-paths) apply immediately.
      "Cache-Control": "public, max-age=0, must-revalidate",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
