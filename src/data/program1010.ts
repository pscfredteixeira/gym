import type { Exercise, WorkoutPlan, PlannedSet } from "../domain/models";

export const PROGRAM_NAME = "Programa 10/10";
export const PROGRAM_SUBTITLE = "Treino Fred · versão 2.0";
export const PROGRAM_FOCUS = "Hipertrofia e redução gradual de gordura";
export const PROGRAM_PRIORITIES = ["Dorsais (largura das costas)","Bíceps e tríceps","Ombros e trapézio","Abdômen"];
export type RepRange = readonly [number,number];
export interface Prescription {
  name: string;
  muscle: string;
  equipment: string;
  ranges: readonly RepRange[];
  rir: readonly [number,number];
  note?: string;
}
export interface ProgramCardio {
  minutes?: number;
  label: string;
  intensity?: string;
  optional?: boolean;
  note?: string;
}
export interface ProgramDay {
  id: string;
  weekday: string;
  short: string;
  title: string;
  focus?: string;
  subtitle: string;
  note?: string;
  exercises: readonly Prescription[];
  cardio?: ProgramCardio;
  dayIndex: number;
}
const ex = (
  name:string,muscle:string,equipment:string,reps:RepRange,rir:readonly [number,number],
  opts: {differentSecondSet?:RepRange;note?:string}={}
):Prescription=>({
  name,muscle,equipment,ranges:opts.differentSecondSet?[reps,opts.differentSecondSet]:[reps,reps],
  rir, ...(opts.note?{note:opts.note}:{})
});
// A ficha especifica apenas séries efetivas: não presumir aquecimentos, cargas ou descanso.
export const PROGRAM_DAYS:readonly ProgramDay[] = [
  {
    id:"push",weekday:"Segunda",short:"SEG",title:"PUSH",subtitle:"Peito, ombros e tríceps",
    dayIndex:0,
    exercises:[
      ex("Supino inclinado com halteres","Peito","Halteres",[6,9],[1,1],{differentSecondSet:[9,12]}),
      ex("Chest press convergente","Peito","Máquina",[8,12],[1,1]),
      ex("Desenvolvimento na máquina","Ombros","Máquina",[8,12],[1,1]),
      ex("Elevação lateral no cabo","Ombros","Cabo",[12,15],[0,1]),
      ex("Tríceps acima da cabeça no cabo","Tríceps","Cabo",[10,15],[0,1])
    ],
    cardio:{minutes:20,label:"Corrida moderada",intensity:"moderada"}
  },
  {
    id:"pull",weekday:"Terça",short:"TER",title:"PULL",subtitle:"Costas, trapézio e bíceps",
    focus:"Prioridade máxima: dorsal",dayIndex:1,
    exercises:[
      ex("Puxada neutra","Dorsais","Polia",[6,10],[1,1]),
      ex("Remada unilateral para dorsal","Dorsais","Máquina ou cabo",[8,12],[1,1]),
      ex("Pullover na polia","Dorsais","Polia",[10,15],[0,1]),
      ex("Remada com apoio para upper back","Costas superiores","Apoio",[8,12],[1,1]),
      ex("Posterior de ombro na máquina","Ombros","Máquina",[12,15],[0,1]),
      ex("Encolhimento para trapézio","Trapézio","Equipamento à escolha",[10,15],[0,1]),
      ex("Rosca Scott","Bíceps","Banco Scott",[8,12],[0,1])
    ]
  },
  {
    id:"legs",weekday:"Quarta",short:"QUA",title:"LEGS + ABDÔMEN",subtitle:"Pernas e abdômen",dayIndex:2,
    exercises:[
      ex("Hack squat","Quadríceps","Máquina hack",[8,12],[1,2]),
      ex("Stiff / RDL","Posterior de coxa","Barra ou halteres",[8,10],[1,2]),
      ex("Flexora","Posterior de coxa","Máquina flexora",[10,15],[0,1]),
      ex("Cadeira extensora","Quadríceps","Máquina",[10,15],[0,1]),
      ex("Panturrilha","Panturrilhas","Equipamento à escolha",[10,15],[0,1]),
      ex("Abdominal no cabo","Abdômen","Cabo",[10,15],[0,1])
    ]
  },
  {
    id:"rest-thu",weekday:"Quinta",short:"QUI",title:"DESCANSO",subtitle:"Recuperação ativa opcional",
    dayIndex:3,exercises:[],
    cardio:{minutes:20,label:"Corrida leve",intensity:"leve",optional:true,note:"Se as pernas estiverem muito fatigadas, substituir por caminhada leve ou descansar completamente."}
  },
  {
    id:"upper",weekday:"Sexta",short:"SEX",title:"UPPER",subtitle:"Dorsal, braços e ombros",dayIndex:4,
    exercises:[
      ex("Puxada unilateral no cabo","Dorsais","Cabo",[8,12],[1,1]),
      ex("Remada baixa na máquina focada na dorsal","Dorsais","Máquina",[8,12],[1,1],{note:"Foco na dorsal."}),
      ex("Supino reto na máquina","Peito","Máquina",[8,12],[1,1]),
      ex("Elevação lateral","Ombros","Equipamento à escolha",[12,15],[0,1]),
      ex("Tríceps corda","Tríceps","Cabo",[10,15],[0,1]),
      ex("Rosca direta","Bíceps","Barra",[8,12],[0,1]),
      ex("Remada para parte alta das costas","Costas superiores","Equipamento à escolha",[10,12],[1,1]),
      ex("Tríceps francês no cabo","Tríceps","Cabo",[10,15],[0,1])
    ]
  },
  {
    id:"lower",weekday:"Sábado",short:"SÁB",title:"LOWER + BÍCEPS",subtitle:"Pernas, bíceps e abdômen",dayIndex:5,
    exercises:[
      ex("Rosca inclinada com halteres","Bíceps","Halteres",[8,12],[0,1]),
      ex("Rosca martelo","Bíceps","Halteres",[10,12],[0,1]),
      ex("Leg press","Quadríceps","Máquina",[10,15],[1,1]),
      ex("Flexora sentada","Posterior de coxa","Máquina",[10,15],[0,1]),
      ex("Cadeira extensora","Quadríceps","Máquina",[12,15],[0,1]),
      ex("Panturrilha","Panturrilhas","Equipamento à escolha",[10,15],[0,1]),
      ex("Abdominal na máquina","Abdômen","Máquina",[10,15],[0,1])
    ]
  },
  {
    id:"rest-sun",weekday:"Domingo",short:"DOM",title:"DESCANSO",subtitle:"Descanso completo",dayIndex:6,
    exercises:[],note:"Caminhada leve opcional."
  }
];

export const planId = (dayId:string) => "programa-10-10-v2-"+dayId;
export const exerciseId = (name:string) =>
  "programa-10-10-ex-"+name.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export const seriesCount = (day:ProgramDay) => day.exercises.reduce((total,entry)=>total+entry.ranges.length,0);
export const totalWeeklySets = PROGRAM_DAYS.reduce((total,day)=>total+seriesCount(day),0);
export const rirLabel = (min:number,max:number) => min===max?String(min):min+"–"+max;
export const repsLabel = (a:number,b:number) => a===b?String(a):a+"–"+b;

export function buildProgramCatalog(now:string):{ exercises:Exercise[]; plans:WorkoutPlan[] } {
  const exerciseMap = new Map<string,Exercise>();
  const plans:WorkoutPlan[]=[];
  for(const day of PROGRAM_DAYS){
    if(!day.exercises.length)continue;
    const items=day.exercises.map((prescription,index)=>{
      const id=exerciseId(prescription.name);
      if(!exerciseMap.has(id))exerciseMap.set(id,{
        id,name:prescription.name,primaryMuscle:prescription.muscle,equipment:prescription.equipment,
        isCustom:false
      });
      const sets:PlannedSet[]=prescription.ranges.map(([minReps,maxReps],setIndex)=>({
        id:planId(day.id)+"-"+index+"-set-"+setIndex,kind:"working",minReps,maxReps,
        targetRir:prescription.rir[0],targetRirMax:prescription.rir[1]
      }));
      return {
        id:planId(day.id)+"-exercise-"+index,exerciseId:id,order:index,restSeconds:0,sets,
        ...(prescription.note?{notes:prescription.note}:{})
      };
    });
    plans.push({id:planId(day.id),name:day.weekday+" — "+day.title,createdAt:now,updatedAt:now,exercises:items});
  }
  return {exercises:Array.from(exerciseMap.values()),plans};
}
