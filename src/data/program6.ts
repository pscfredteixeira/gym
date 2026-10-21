import type { Exercise, WorkoutPlan, PlannedSet } from "../domain/models.ts";
import type { ProgramDay, Prescription, RepRange } from "./program1010.ts";
import { exerciseId } from "./program1010.ts";

export { exerciseId, repsLabel, rirLabel, seriesCount } from "./program1010.ts";
export type { ProgramDay, Prescription, RepRange } from "./program1010.ts";

export const PROGRAM_NAME = "Treino Fred";
export const PROGRAM_SUBTITLE = "Versão 3.0 · seis dias por semana";
export const PROGRAM_FOCUS = "Hipertrofia com prioridade para dorsais e braços; redução gradual de gordura.";
export const PROGRAM_PRIORITIES = [
  "Dorsais (largura das costas)",
  "Bíceps e tríceps",
  "Deltoides e trapézio",
  "Abdômen"
];

const ex = (
  name: string, muscle: string, equipment: string,
  reps: RepRange, rir: readonly [number, number],
  sets = 2, note?: string
): Prescription => ({
  name, muscle, equipment, ranges: Array.from({length:sets}, () => reps),
  rir, ...(note ? {note} : {})
});

/** Prescrição de seis dias: somente séries efetivas; a recuperação guia os ajustes. */
export const PROGRAM_DAYS: readonly ProgramDay[] = [
  {
    id:"pull-a", weekday:"Segunda",short:"SEG",title:"PULL A",
    subtitle:"Dorsal e bíceps",focus:"Prioridade: largura das costas",dayIndex:0,
    exercises:[
      ex("Puxada neutra","Dorsais","Polia",[6,10],[1,1]),
      ex("Remada unilateral para dorsal","Dorsais","Máquina ou cabo",[8,12],[1,1],2,"Conduza o cotovelo em direção ao quadril."),
      ex("Pullover na polia","Dorsais","Polia",[10,15],[0,1]),
      ex("Remada com apoio para upper back","Costas superiores","Máquina com apoio",[8,12],[1,1]),
      ex("Posterior de ombro na máquina","Ombros","Máquina",[12,20],[0,1]),
      ex("Rosca Scott","Bíceps","Banco Scott",[8,12],[0,1]),
      ex("Rosca martelo","Bíceps","Halteres",[10,15],[0,1])
    ],
    cardio:{minutes:20,label:"Corrida leve a moderada",intensity:"leve/moderada",note:"Após a musculação; reduzir se prejudicar a recuperação."}
  },
  {
    id:"push-a",weekday:"Terça",short:"TER",title:"PUSH A",
    subtitle:"Peito, ombros e tríceps",dayIndex:1,
    exercises:[
      ex("Supino inclinado com halteres","Peito","Halteres",[6,10],[1,2]),
      ex("Chest press convergente","Peito","Máquina",[8,12],[1,1]),
      ex("Desenvolvimento na máquina","Ombros","Máquina",[8,12],[1,1]),
      ex("Elevação lateral no cabo","Ombros","Cabo",[12,20],[0,1],3),
      ex("Tríceps acima da cabeça no cabo","Tríceps","Cabo",[10,15],[0,1]),
      ex("Tríceps na polia com barra","Tríceps","Cabo",[8,12],[0,1])
    ]
  },
  {
    id:"legs-a",weekday:"Quarta",short:"QUA",title:"LEGS A",
    subtitle:"Pernas e abdômen",dayIndex:2,
    exercises:[
      ex("Hack squat","Quadríceps","Máquina hack",[6,10],[1,2],2,"Evitar falha absoluta; preservar técnica."),
      ex("Stiff / RDL","Posterior de coxa","Barra ou halteres",[8,10],[1,2],2,"Evitar falha absoluta; preservar técnica."),
      ex("Leg press","Quadríceps","Máquina",[10,15],[1,1]),
      ex("Flexora","Posterior de coxa","Máquina",[10,15],[0,1]),
      ex("Panturrilha em pé","Panturrilhas","Máquina",[8,15],[0,1]),
      ex("Abdominal no cabo","Abdômen","Cabo",[10,15],[0,1])
    ]
  },
  {
    id:"pull-b",weekday:"Quinta",short:"QUI",title:"PULL B",
    subtitle:"Dorsal, trapézio e bíceps",focus:"Dorsal e parte alta das costas",dayIndex:3,
    exercises:[
      ex("Puxada unilateral no cabo","Dorsais","Cabo",[8,12],[1,1]),
      ex("Remada baixa na máquina focada na dorsal","Dorsais","Máquina",[8,12],[1,1]),
      ex("Remada para parte alta das costas","Costas superiores","Máquina com apoio",[8,12],[1,1]),
      ex("Posterior de ombro no cabo","Ombros","Cabo",[12,20],[0,1]),
      ex("Encolhimento para trapézio","Trapézio","Halteres ou máquina",[10,15],[0,1]),
      ex("Rosca inclinada com halteres","Bíceps","Halteres",[8,12],[0,1]),
      ex("Rosca direta","Bíceps","Barra",[6,10],[0,1])
    ],
    cardio:{minutes:20,label:"Corrida leve a moderada",intensity:"leve/moderada",note:"Após a musculação; reduzir intensidade se houver fadiga nas pernas."}
  },
  {
    id:"push-b",weekday:"Sexta",short:"SEX",title:"PUSH B",
    subtitle:"Ombros e tríceps prioritários",focus:"Deltoide lateral e tríceps",dayIndex:4,
    exercises:[
      ex("Elevação lateral na máquina","Ombros","Máquina",[12,20],[0,1],3),
      ex("Supino reto na máquina","Peito","Máquina",[6,10],[1,1]),
      ex("Crucifixo máquina","Peito","Máquina",[10,15],[0,1]),
      ex("Tríceps testa no cabo","Tríceps","Cabo",[8,12],[0,1]),
      ex("Tríceps corda","Tríceps","Cabo",[10,15],[0,1])
    ]
  },
  {
    id:"legs-b",weekday:"Sábado",short:"SÁB",title:"LEGS B",
    subtitle:"Pernas e abdômen",dayIndex:5,
    exercises:[
      ex("Leg press","Quadríceps","Máquina",[10,15],[1,2]),
      ex("Cadeira extensora","Quadríceps","Máquina",[12,15],[0,1]),
      ex("Flexora sentada","Posterior de coxa","Máquina",[8,12],[0,1]),
      ex("Panturrilha sentada","Panturrilhas","Máquina",[10,15],[0,1]),
      ex("Abdominal na máquina","Abdômen","Máquina",[10,15],[0,1])
    ]
  },
  {
    id:"rest-sun",weekday:"Domingo",short:"DOM",title:"DESCANSO",
    subtitle:"Descanso completo",dayIndex:6,exercises:[],note:"Caminhada leve opcional."
  }
];

export const planId = (dayId: string) => "treino-fred-v3-6d-" + dayId;
export const totalWeeklySets = PROGRAM_DAYS.reduce(
  (sum, day) => sum + day.exercises.reduce((n, entry) => n + entry.ranges.length, 0), 0
);

/** IDs novos impedem que uma atualização altere fichas ou sessões da versão 2.0. */
export function buildProgramCatalog(now: string): {exercises: Exercise[]; plans: WorkoutPlan[]} {
  const exerciseMap = new Map<string,Exercise>();
  const plans: WorkoutPlan[] = [];
  for (const day of PROGRAM_DAYS) {
    if (!day.exercises.length) continue;
    const items = day.exercises.map((entry,index) => {
      const id = exerciseId(entry.name);
      if (!exerciseMap.has(id)) exerciseMap.set(id,{
        id,name:entry.name,primaryMuscle:entry.muscle,equipment:entry.equipment,isCustom:false
      });
      const sets: PlannedSet[] = entry.ranges.map(([minReps,maxReps],setIndex) => ({
        id:planId(day.id)+"-"+index+"-set-"+setIndex,kind:"working",
        minReps,maxReps,targetRir:entry.rir[0],targetRirMax:entry.rir[1]
      }));
      const compound = /puxada|remada|supino|chest press|desenvolvimento|hack|leg press|stiff/i.test(entry.name);
      return {
        id:planId(day.id)+"-exercise-"+index,exerciseId:id,order:index,
        restSeconds:compound?150:120,sets,
        ...(entry.note?{notes:entry.note}:{})
      };
    });
    plans.push({id:planId(day.id),name:day.weekday+" — "+day.title,
      createdAt:now,updatedAt:now,exercises:items});
  }
  return {exercises:Array.from(exerciseMap.values()),plans};
}
