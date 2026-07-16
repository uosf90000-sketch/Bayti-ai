import {createHash} from "node:crypto";
export const hash=(s:string)=>createHash("sha256").update(s).digest("hex").slice(0,20);
export const txt=(v:unknown)=>v==null?null:String(v).trim()||null;
export const num=(v:unknown)=>{if(v==null||v==="")return null; const n=Number(String(v).replace(/[,\s]/g,"").replace(/[^\d.-]/g,"")); return Number.isFinite(n)?n:null};
export const arr=(v:unknown)=>Array.isArray(v)?[...new Set(v.map(String))]:v==null||v===""?[]:[...new Set(String(v).split(/[|,;،]/).map(s=>s.trim()).filter(Boolean))];
export const url=(v:unknown)=>{const s=txt(v); if(!s)return null; try{const u=new URL(s); return ["http:","https:"].includes(u.protocol)?u.toString():null}catch{return null}};
export const domain=(u:string|null)=>{if(!u)return null; try{return new URL(u).hostname.replace(/^www\./,"")}catch{return null}};
