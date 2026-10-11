import { useMemo, useState } from "react";
import { Activity, ArrowRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Dumbbell, Footprints, TrendingUp } from "lucide-react";
import type { CardioSession, UserSettings, WorkoutSession } from "../../domain/models";
import { Notice } from "../../components/ui";
import { paceLabel } from "../cardio/cardioDomain";
import {
  cardioSummary,consistencyWeeks,exerciseChoices,exerciseProgress,formatNumber,kgDisplay,
  progressPeriods,recordsInPeriod,strengthSummary,type ProgressPeriod,type StrengthPoint
} from "./progressAnalytics";

type ProgressProps={
  workouts:WorkoutSession[];cardio:CardioSession[];units:UserSettings["units"];
  onOpenStrength:()=>void;onOpenCardio:()=>void;onOpenSharePreview:()=>void;
};
function yAxis(n:number){return Number(n.toFixed(1)).toLocaleString("pt-BR",{maximumFractionDigits:1});}
function dateLabel(value:string){const [,month,day]=value.split("-");return day+"/"+month;}
function ProgressChart({points,units}:{points:StrengthPoint[];units:UserSettings["units"]}){
 if(!points.length)return <div className="real-progress-empty compact"><BarChart3 size={25}/><strong>Sem séries efetivas registradas neste período</strong>
   <p>Ao concluir um treino com cargas salvas, a evolução do exercício aparecerá aqui.</p></div>;
 const values=points.map(p=>kgDisplay(p.maxKg,units)),max=Math.max(1,...values),
   upper=Math.max(5,Math.ceil(max/5)*5),bottom=0;
 const x=(i:number)=>points.length===1?310:49+i*(525/(points.length-1));
 const y=(value:number)=>175-(value-bottom)/(upper-bottom)*136;
 const line=points.map((p,i)=>`${x(i)},${y(values[i])}`).join(" ");
 const dots=points.map((p,i)=>({id:p.date,x:x(i),y:y(values[i]),value:values[i],date:p.date}));
 return <div className="real-progress-chart-wrap">
   <svg className="real-progress-chart" viewBox="0 0 620 225" role="img"
       aria-label={"Maior carga por data: "+points.map((p,i)=>dateLabel(p.date)+" "+values[i]+" "+(units==="metric"?"quilogramas":"libras")).join(", ")}>
     {[0,1,2,3,4].map(k=>{
       const n=upper*k/4;return <g key={k}>
         <line x1="45" x2="578" y1={y(n)} y2={y(n)} stroke="#41454b" strokeDasharray="4 6" strokeWidth="1"/>
         <text x="37" y={y(n)+5} fill="#a9afb6" fontSize="13" textAnchor="end">{yAxis(n)}</text>
       </g>;
     })}
     {points.length>1&&<polyline points={line} fill="none" stroke="#ff8139" strokeWidth="4"
         strokeLinecap="round" strokeLinejoin="round"/>}
     {dots.map(dot=><g key={dot.id}>
       <circle cx={dot.x} cy={dot.y} r="7" fill="#ff8139" stroke="#171b1f" strokeWidth="3"/>
       <title>{dateLabel(dot.date)}: {dot.value} {units==="metric"?"kg":"lb"}</title>
     </g>)}
     <text x="47" y="215" fontSize="13" fill="#b2b6bc">{dateLabel(points[0].date)}</text>
     <text x="578" y="215" textAnchor="end" fontSize="13" fill="#b2b6bc">{dateLabel(points[points.length-1].date)}</text>
   </svg>
   <div className="real-progress-chart-foot"><span>{points.length} {points.length===1?"dia com registro":"dias com registros"}</span>
     <span>Maior carga efetiva em cada dia</span></div>
 </div>;
}
export default function ProgressView({workouts,cardio,units,onOpenStrength,onOpenCardio,onOpenSharePreview}:ProgressProps){
 const [period,setPeriod]=useState<ProgressPeriod>(90);
 const [picked,setPicked]=useState<string>("");
 const chosen=useMemo(()=>recordsInPeriod(workouts,cardio,period),[workouts,cardio,period]);
 const allChoices=useMemo(()=>exerciseChoices(workouts),[workouts]);
 const chosenChoices=useMemo(()=>exerciseChoices(chosen.workouts),[chosen.workouts]);
 const selectedId=chosenChoices.some(ex=>ex.exerciseId===picked)?picked:chosenChoices[0]?.exerciseId??"";
 const selected=chosenChoices.find(ex=>ex.exerciseId===selectedId);
 const allSelected=allChoices.find(ex=>ex.exerciseId===selectedId);
 const series=useMemo(()=>exerciseProgress(chosen.workouts,selectedId),[chosen.workouts,selectedId]);
 const strength=useMemo(()=>strengthSummary(chosen.workouts),[chosen.workouts]);
 const cardioStats=useMemo(()=>cardioSummary(chosen.cardio),[chosen.cardio]);
 const weeks=useMemo(()=>consistencyWeeks(workouts,cardio),[workouts,cardio]);
 const totalDays=new Set([...chosen.workouts.map(x=>x.localDate),...chosen.cardio.map(x=>x.localDate)]).size;
 const maxKg=series.length?Math.max(...series.map(s=>s.maxKg)):undefined;
 const latestKg=series.length?series[series.length-1].maxKg:undefined;
 const unitLabel=units==="metric"?"kg":"lb";
 const meanPace=cardioStats.distanceMeters>0&&cardioStats.knownDistanceSeconds>0
    ?paceLabel(cardioStats.knownDistanceSeconds,cardioStats.distanceMeters):"—";
 const weekMax=7;
 const hasStrength=workouts.some(s=>s.status==="completed");
 const hasCardio=cardio.length>0;
 return <div className="real-progress-page">
   <header className="real-progress-heading">
     <span className="eyebrow">SEU HISTÓRICO. SEM SIMULAÇÕES.</span>
     <h1>Evolução<span>.</span></h1>
     <p>Resultados calculados a partir dos treinos e cardios que você realmente salvou neste aparelho.</p>
   </header>
   <div className="real-progress-period" role="group" aria-label="Filtrar período">
     {progressPeriods.map(opt=><button type="button" key={opt.label} className={period===opt.days?"active":""}
       aria-pressed={period===opt.days} onClick={()=>setPeriod(opt.days)}>{opt.label}</button>)}
   </div>
   {!hasStrength&&!hasCardio&&<div className="real-progress-empty first">
     <TrendingUp size={30}/><strong>Seu progresso começa no primeiro registro</strong>
     <p>Conclua um treino de musculação ou registre um cardio para ativar as estatísticas. Não vamos exibir números de exemplo como se fossem seus.</p>
     <div className="real-progress-empty-actions">
       <button type="button" onClick={onOpenStrength}><Dumbbell size={16}/> Treinar</button>
       <button type="button" onClick={onOpenCardio}><Footprints size={16}/> Registrar cardio</button>
     </div>
   </div>}
   <section aria-label="Resumo do período" className="real-progress-overview">
     <div className="real-progress-metric"><div><CalendarDays size={18}/> DIAS ATIVOS</div>
       <strong>{totalDays}</strong><small>Musculação concluída e/ou cardio salvo</small></div>
     <div className="real-progress-metric"><div><Dumbbell size={18}/> TREINOS CONCLUÍDOS</div>
       <strong>{strength.sessions}</strong><small>Não inclui sessões interrompidas</small></div>
     <div className="real-progress-metric"><div><CheckCircle2 size={18}/> SÉRIES EFETIVAS</div>
       <strong>{formatNumber(strength.workingSets)}</strong><small>{formatNumber(strength.reps)} repetições registradas</small></div>
     <div className="real-progress-metric"><div><Footprints size={18}/> CARDIOS SALVOS</div>
       <strong>{cardioStats.sessions}</strong><small>{formatNumber(Math.round(cardioStats.durationSeconds/60))} minutos no período</small></div>
   </section>
   <section className="real-progress-section">
     <div className="real-progress-section-heading"><div><span className="eyebrow">MUSCULAÇÃO</span><h2>Progressão de carga</h2></div>
       <button type="button" onClick={onOpenStrength}>Histórico <ArrowRight size={16}/></button></div>
     {chosenChoices.length>0?<><label className="real-progress-selector">Exercício
       <select value={selectedId} onChange={e=>setPicked(e.target.value)}>
         {chosenChoices.map(ex=><option value={ex.exerciseId} key={ex.exerciseId}>{ex.name}</option>)}
       </select></label>
       <div className="real-progress-exercise-metrics">
         <div><small>MAIOR CARGA DO PERÍODO</small><strong>{maxKg===undefined?"—":kgDisplay(maxKg,units)} <em>{maxKg===undefined?"":unitLabel}</em></strong></div>
         <div><small>ÚLTIMA CARGA MÁXIMA</small><strong>{latestKg===undefined?"—":kgDisplay(latestKg,units)} <em>{latestKg===undefined?"":unitLabel}</em></strong></div>
       </div>
       <ProgressChart points={series} units={units}/>
       <div className="real-progress-samples" aria-label="Registros de carga por dia">
         {series.slice(-6).reverse().map(point=><div key={point.date}><span>{dateLabel(point.date)}</span>
           <strong>{kgDisplay(point.maxKg,units)} {unitLabel}</strong>
           <small>{point.sets} séries · {point.reps} reps</small></div>)}
       </div>
       <p className="real-progress-smallnote">{selected?.name??allSelected?.name}. O gráfico usa exclusivamente séries efetivas concluídas e a maior carga salva por dia. Uma carga 0 representa o valor informado, não o peso corporal.</p>
       </>:<div className="real-progress-empty compact"><Dumbbell size={24}/><strong>Nenhuma série efetiva neste período</strong>
         <p>{hasStrength?"Escolha um período maior para acompanhar suas cargas.":"Depois de concluir um treino, escolha aqui um exercício para acompanhar sua evolução."}</p></div>}
     <div className="real-progress-volume">
       <div><span>VOLUME EXTERNO REGISTRADO</span>
         <strong>{formatNumber(kgDisplay(strength.volumeKg,units),1)} <em>{unitLabel} × reps</em></strong></div>
       <div><span>SÉRIES DE AQUECIMENTO</span><strong>{formatNumber(strength.warmupSets)}</strong></div>
     </div>
     <p className="real-progress-smallnote">Volume externo = soma de carga × repetições das séries efetivas. Não é estimativa de ganho muscular e exclui o peso corporal não informado.</p>
   </section>
   <section className="real-progress-section">
     <div className="real-progress-section-heading"><div><span className="eyebrow">CARDIO</span><h2>Corridas e caminhadas</h2></div>
       <button type="button" onClick={onOpenCardio}>Abrir cardio <ArrowRight size={16}/></button></div>
     <div className="real-progress-cardio-grid">
       <div><Footprints size={18}/><span>TEMPO TOTAL</span><strong>{formatNumber(Math.round(cardioStats.durationSeconds/60))} <small>min</small></strong></div>
       <div><Activity size={18}/><span>DISTÂNCIA INFORMADA</span><strong>{cardioStats.knownDistanceCount?formatNumber(cardioStats.distanceMeters/1000,2):"—"} <small>{cardioStats.knownDistanceCount?"km":""}</small></strong></div>
       <div><Clock3 size={18}/><span>RITMO DOS CARDIOS COM DISTÂNCIA</span><strong>{meanPace}</strong></div>
     </div>
     <p className="real-progress-smallnote">O ritmo combina apenas atividades com distância positiva. Cardios sem distância entram no tempo total, mas não no ritmo nem na quilometragem.</p>
     {chosen.cardio.length===0&&<div className="real-progress-empty compact"><Footprints size={22}/><strong>Nenhum cardio registrado no período</strong>
       <p>As corridas sugeridas na ficha não são contabilizadas automaticamente.</p></div>}
   </section>
   <section className="real-progress-section">
     <div className="real-progress-section-heading"><div><span className="eyebrow">CONSTÂNCIA</span><h2>Últimas seis semanas</h2></div>
       <span className="real-progress-aside">Dias por semana</span></div>
     <div className="real-progress-weeks" role="img" aria-label={"Dias ativos nas últimas seis semanas: "+weeks.map(w=>dateLabel(w.weekStart)+", "+w.days+" dias").join("; ")}>
       {weeks.map(w=><div key={w.weekStart} className="real-progress-week">
         <strong>{w.days} <small>dias</small></strong>
         <div className="real-progress-weektrack"><span style={{height:100*w.days/weekMax+"%"}}/></div>
         <small>{dateLabel(w.weekStart)}</small>
       </div>)}
     </div>
     <p className="real-progress-smallnote">Um dia com musculação concluída e cardio conta apenas uma vez. Sessões interrompidas e planos sem execução não entram nesta estatística.</p>
   </section>
   <button type="button" className="real-progress-share" onClick={onOpenSharePreview}>
     <BarChart3 size={19}/><span><strong>Estúdio de cards</strong><small>Ainda usa dados fictícios, identificados como exemplo.</small></span><ArrowRight size={17}/>
   </button>
   <Notice>Os dados ficam neste navegador e são recalculados quando você altera ou restaura seu histórico. Faça backup pelo Perfil. O GYM não infere calorias, GPS ou mudanças corporais.</Notice>
 </div>;
}
