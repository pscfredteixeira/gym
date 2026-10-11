import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight, Info } from "lucide-react";

export function DemoLabel({ compact = false }: { compact?: boolean }) {
  return <span className={compact ? "demo-label compact" : "demo-label"}><span className="demo-dot" /> PRÉVIA · DADOS FICTÍCIOS</span>;
}

export function Photo({src,alt,className="",position}: {src:string;alt:string;className?:string;position?:string}) {
  return <div className={"photo " + className}><img src={src} alt={alt} loading="lazy" style={position?{objectPosition:position}:undefined}/></div>;
}

export function Titlebar({eyebrow,title,right}: {eyebrow?:string;title:string;right?:ReactNode}) {
  return <div className="page-title"><div><span className="eyebrow">{eyebrow ?? "GYM / TRAINING"}</span><h1>{title}</h1></div>{right}</div>;
}

export function SectionHead({title,aside,onClick}: {title:string;aside?:string;onClick?:()=>void}) {
  return <div className="section-head"><h2>{title}</h2>{aside && (onClick?<button type="button" className="text-action" onClick={onClick}>{aside} <ChevronRight size={15}/></button>:<span className="micro-muted">{aside}</span>)}</div>;
}

export function BackHeader({label,onBack,action}: {label:string;onBack:()=>void;action?:ReactNode}) {
  return <div className="back-header"><button className="round-control" type="button" onClick={onBack} aria-label="Voltar"><ChevronLeft size={22}/></button><span>{label}</span>{action??<span className="back-action-gap" />}</div>;
}

export function PrimaryButton({children,onClick,disabled=false,secondary=false,icon=true}: {children:ReactNode;onClick:()=>void;disabled?:boolean;secondary?:boolean;icon?:boolean}) {
  return <button type="button" disabled={disabled} onClick={onClick} className={secondary?"action-button secondary":"action-button"}>{children}{icon && <ArrowUpRight size={19}/>}</button>;
}
export function Notice({children}: {children:ReactNode}) {
  return <div className="notice"><Info size={17} aria-hidden="true"/><span>{children}</span></div>;
}
