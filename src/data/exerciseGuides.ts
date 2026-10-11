import type { Exercise } from "../domain/models";
import { PROGRAM_DAYS, exerciseId } from "./program1010";

/** Guia editorial específico da prescrição 10/10; não é avaliação clínica individual. */
export interface ExerciseGuide {
  id: string;
  execution: readonly string[];
  avoid: readonly string[];
  focus: string;
  alternatives: readonly string[];
}
type Row = readonly [string, string, string, string, string, string, string, string, string];
const rows: Row[] = [
["Supino inclinado com halteres","Ajuste o banco em inclinação moderada; apoie cabeça e costas.","Abaixe os halteres com controle até uma amplitude confortável para os ombros.","Empurre para cima sem bater os halteres no topo.","Não arquear demais a lombar para levantar mais peso.","Evite abrir os cotovelos a 90° do tronco se causar desconforto.","Peitoral superior; deltoide anterior e tríceps auxiliam.","Chest press convergente","Supino reto na máquina"],
["Chest press convergente","Ajuste a altura do assento para que as pegadas fiquem próximas da linha do peito.","Mantenha escápulas apoiadas e empurre acompanhando a trajetória da máquina.","Volte devagar sem deixar a pilha bater.","Evite elevar os ombros na fase de empurrar.","Não encurte demais a volta só para aumentar a carga.","Peitoral; deltoide anterior e tríceps auxiliam.","Supino reto na máquina","Supino inclinado com halteres"],
["Desenvolvimento na máquina","Ajuste banco e pegadas para começar numa posição confortável perto dos ombros.","Empurre acima da cabeça sem perder o contato do tronco com o encosto.","Desça controlando sem forçar amplitude dolorosa.","Evite compensar arqueando excessivamente a lombar.","Não force amplitude que provoque dor no ombro.","Deltoides; tríceps auxiliam.","Elevação lateral","Elevação lateral no cabo"],
["Elevação lateral no cabo","Deixe o cabo criar tensão ao longo da subida lateral do braço.","Eleve até uma altura confortável, com cotovelo levemente flexionado.","Desça lentamente, mantendo controle e postura.","Evite balançar o tronco para iniciar a subida.","Não eleve os ombros junto com o braço de forma exagerada.","Deltoide lateral; trapézio estabiliza.","Elevação lateral","Desenvolvimento na máquina"],
["Tríceps acima da cabeça no cabo","Posicione-se de costas para a polia, com o cabo passando atrás.","Mantenha cotovelos relativamente estáveis e estenda os braços.","Retorne devagar para sentir o alongamento do tríceps.","Evite mover os ombros para transformar o exercício em impulso.","Não force os cotovelos além de uma amplitude confortável.","Tríceps, especialmente a cabeça longa.","Tríceps francês no cabo","Tríceps corda"],
["Puxada neutra","Segure uma barra com pegada neutra e mantenha o tronco estável.","Puxe os cotovelos em direção às laterais do tronco; aproxime a pegada da parte alta do peito.","Deixe os braços subirem controladamente, sem perder a posição.","Evite transformar a puxada em uma grande inclinação para trás.","Não leve a barra atrás da nuca.","Grande dorsal; bíceps e músculos escapulares auxiliam.","Puxada unilateral no cabo","Remada unilateral para dorsal"],
["Remada unilateral para dorsal","Apoie o tronco ou estabilize o corpo com a mão livre.","Puxe o cotovelo em direção ao quadril, mantendo o braço próximo ao corpo.","Retorne o braço à frente devagar sem girar excessivamente o tronco.","Evite rodar o tronco para tirar a carga da dorsal.","Não conduza o cotovelo muito aberto se a intenção é priorizar dorsal.","Grande dorsal, com estabilizadores escapulares.","Remada baixa na máquina focada na dorsal","Puxada unilateral no cabo"],
["Pullover na polia","Fique em pé diante da polia alta, com braços quase estendidos.","Leve a barra ou corda em arco na direção das coxas, movimentando o ombro.","Retorne até sentir alongamento confortável sem dobrar muito os cotovelos.","Evite usar o quadril para gerar impulso.","Não transforme em extensão de cotovelo como no tríceps.","Grande dorsal e redondo maior.","Puxada unilateral no cabo","Puxada neutra"],
["Remada com apoio para upper back","Ajuste o apoio peitoral e segure as alças com estabilidade.","Puxe cotovelos mais abertos para trás, aproximando as escápulas.","Retorne com controle sem perder apoio do peito.","Evite tirar o peito do apoio ao puxar.","Não confunda com uma remada baixa focada nos cotovelos junto ao quadril.","Romboides, trapézio médio e deltoide posterior.","Remada para parte alta das costas","Posterior de ombro na máquina"],
["Posterior de ombro na máquina","Ajuste a altura para que as mãos fiquem alinhadas aos ombros.","Abra os braços em arco mantendo os cotovelos levemente flexionados.","Retorne devagar sem bater os pesos.","Evite inclinar o tronco para gerar impulso.","Não elevar os ombros continuamente.","Deltoide posterior; musculatura escapular auxilia.","Remada para parte alta das costas","Remada com apoio para upper back"],
["Encolhimento para trapézio","Mantenha o tronco ereto, segurando a carga ao lado do corpo.","Eleve os ombros em direção às orelhas com movimento controlado.","Faça uma breve contração e desça sem deixar o peso despencar.","Evite girar os ombros em círculos grandes.","Não usar impulso dos joelhos para levantar a carga.","Trapézio superior.","Remada para parte alta das costas","Remada com apoio para upper back"],
["Rosca Scott","Ajuste o banco para apoiar as axilas sem levantar o tronco.","Flexione os cotovelos mantendo braços apoiados e punhos neutros.","Desça com controle sem travar os cotovelos bruscamente.","Evite tirar os braços do apoio na subida.","Não deixe o peso cair na descida.","Bíceps braquial e braquial.","Rosca direta","Rosca inclinada com halteres"],
["Hack squat","Posicione os pés na plataforma em uma largura confortável.","Desça com controle, mantendo quadril e costas apoiados.","Empurre a plataforma de forma estável sem travar os joelhos bruscamente.","Evite descolar o quadril do encosto.","Não force uma profundidade além da mobilidade confortável.","Quadríceps e glúteos.","Leg press","Cadeira extensora"],
["Stiff / RDL","Mantenha joelhos ligeiramente flexionados e a carga próxima das pernas.","Leve o quadril para trás, inclinando o tronco sem arredondar excessivamente as costas.","Suba estendendo o quadril até retornar à postura ereta.","Evite transformar o movimento em agachamento profundo.","Não aumente a amplitude às custas da posição das costas.","Posterior de coxa e glúteos; eretores estabilizam.","Flexora sentada","Flexora"],
["Flexora","Ajuste os apoios da máquina à altura das pernas e alinhe o joelho ao eixo.","Flexione os joelhos de forma controlada, mantendo quadril apoiado.","Retorne lentamente, evitando choque entre placas.","Evite tirar o quadril do banco para ganhar amplitude.","Não use impulso rápido com a lombar.","Posterior de coxa.","Flexora sentada","Stiff / RDL"],
["Cadeira extensora","Ajuste o banco e o rolo de apoio para alinhar joelho e eixo da máquina.","Estenda os joelhos com controle até uma amplitude confortável.","Desça sem deixar a carga despencar.","Evite levantar o quadril do assento.","Não force extensão final dolorosa.","Quadríceps.","Leg press","Hack squat"],
["Panturrilha","Deixe a parte da frente dos pés apoiada na plataforma.","Eleve os calcanhares de forma controlada e faça uma pausa curta.","Abaixe até sentir alongamento confortável.","Evite usar pequenos saltos ou balanços.","Não dobre e estenda o joelho para substituir a ação da panturrilha.","Gastrocnêmio e sóleo, conforme a posição do joelho.","Panturrilha","Leg press"],
["Abdominal no cabo","Ajoelhe-se diante do cabo alto e mantenha quadril relativamente estável.","Flexione o tronco aproximando as costelas da região pélvica.","Volte devagar sem deixar a polia puxar o corpo.","Evite puxar a corda com os braços.","Não transforme em flexão exagerada de quadril.","Reto abdominal e oblíquos estabilizadores.","Abdominal na máquina","Abdominal no cabo"],
["Puxada unilateral no cabo","Segure a alça com um braço, mantendo tronco estável.","Puxe o cotovelo em direção à lateral do tronco e ao quadril.","Retorne lentamente até um alongamento confortável.","Evite girar o corpo para levantar mais carga.","Não deixe o ombro subir continuamente.","Grande dorsal; bíceps auxilia.","Puxada neutra","Remada unilateral para dorsal"],
["Remada baixa na máquina focada na dorsal","Ajuste o banco e fique estabilizado, usando pegada que permita cotovelos próximos.","Puxe com os cotovelos voltados ao quadril em vez de abri-los muito.","Volte devagar, mantendo controle do tronco.","Evite jogar o tronco para trás com a carga.","Não transformar em remada alta se a prioridade é dorsal.","Grande dorsal, com romboides e bíceps auxiliando.","Remada unilateral para dorsal","Pullover na polia"],
["Supino reto na máquina","Ajuste o banco para alinhar as alças à altura do peito.","Empurre acompanhando a trajetória da máquina, com ombros estabilizados.","Retorne lentamente sem soltar o controle.","Evite elevar os ombros ou rebater a carga.","Não forçar posição dolorosa dos cotovelos.","Peitoral; tríceps e deltoide anterior.","Chest press convergente","Supino inclinado com halteres"],
["Elevação lateral","Comece com braços ao lado do corpo e leve-os lateralmente.","Eleve até uma altura confortável sem perder a posição do tronco.","Volte controlando a descida.","Evite usar o balanço do corpo para subir.","Não encolher excessivamente os ombros.","Deltoide lateral.","Elevação lateral no cabo","Desenvolvimento na máquina"],
["Tríceps corda","Fique de frente para o cabo alto com cotovelos próximos ao corpo.","Estenda os cotovelos e afaste suavemente as pontas da corda no final.","Retorne sem deixar os ombros girarem muito.","Evite empurrar com o peso do corpo.","Não mover os cotovelos para frente e para trás a cada repetição.","Tríceps.","Tríceps francês no cabo","Tríceps acima da cabeça no cabo"],
["Rosca direta","Segure barra à frente do corpo com cotovelos próximos do tronco.","Flexione os cotovelos, elevando a barra com o tronco estável.","Desça em ritmo controlado.","Evite inclinar a lombar para trás para mover a carga.","Não deixar os punhos dobrados exageradamente.","Bíceps e braquial.","Rosca Scott","Rosca inclinada com halteres"],
["Remada para parte alta das costas","Use uma pegada que permita abrir moderadamente os cotovelos.","Puxe na direção da parte superior do tronco, aproximando as escápulas.","Retorne com controle sem perder estabilidade.","Evite tirar o tronco do apoio, se houver.","Não usar a lombar como impulso.","Trapézio médio, romboides e deltoide posterior.","Remada com apoio para upper back","Posterior de ombro na máquina"],
["Tríceps francês no cabo","Ajuste o cabo para permitir extensão de cotovelos com ombros estáveis.","Estenda os braços sem deixar os cotovelos abrirem excessivamente.","Retorne de forma lenta e confortável.","Evite compensar com tronco ou ombros.","Não forçar flexão de cotovelo desconfortável.","Tríceps, com ênfase na cabeça longa quando acima da cabeça.","Tríceps acima da cabeça no cabo","Tríceps corda"],
["Rosca inclinada com halteres","Sente-se em banco inclinado com braços ao lado do tronco.","Flexione os cotovelos mantendo os ombros relativamente estáveis.","Abaixe lentamente até extensão confortável.","Evite projetar ombros para frente durante a subida.","Não deixar halteres caírem na descida.","Bíceps braquial, especialmente em alongamento.","Rosca direta","Rosca Scott"],
["Rosca martelo","Segure os halteres com palmas voltadas uma para a outra.","Flexione os cotovelos sem balançar o tronco.","Desça devagar mantendo a pegada neutra.","Evite rodar exageradamente o punho no meio da série.","Não usar impulso do quadril.","Braquial, braquiorradial e bíceps.","Rosca direta","Rosca inclinada com halteres"],
["Leg press","Ajuste o banco para permitir amplitude confortável sem tirar o quadril do apoio.","Empurre a plataforma com toda a planta do pé apoiada.","Desça a carga em ritmo controlado mantendo joelhos alinhados aos pés.","Evite deixar a lombar arredondar excessivamente no fundo.","Não trave bruscamente os joelhos.","Quadríceps e glúteos; posterior auxilia.","Hack squat","Cadeira extensora"],
["Flexora sentada","Ajuste as almofadas sobre as coxas e atrás dos tornozelos.","Flexione os joelhos mantendo coxas firmes no banco.","Retorne de modo controlado até extensão confortável.","Evite erguer os quadris para mover a carga.","Não deixar o tronco oscilar para compensar.","Posterior de coxa.","Flexora","Stiff / RDL"],
["Abdominal na máquina","Ajuste banco e alças para que o movimento seja uma flexão do tronco.","Aproxime o tórax do abdômen mantendo o quadril estável.","Volte devagar sem rebater o peso.","Evite apenas puxar com os braços.","Não usar movimento explosivo com o quadril.","Reto abdominal; oblíquos estabilizam.","Abdominal no cabo","Abdominal na máquina"]
];
const GUIDES:Record<string,ExerciseGuide>={};
for(const row of rows){
 const [name,step1,step2,step3,mistake1,mistake2,focus,...alternatives]=row;
 GUIDES[exerciseId(name)]={id:exerciseId(name),execution:[step1,step2,step3],avoid:[mistake1,mistake2],focus,alternatives:alternatives.filter(a=>a!==name).map(exerciseId)};
}
export const EXERCISE_GUIDES:Readonly<Record<string,ExerciseGuide>>=GUIDES;
export function guideFor(exercise:Exercise):ExerciseGuide|undefined{
 return EXERCISE_GUIDES[exercise.id];
}
export function matchingAlternatives(exercise:Exercise,catalog:Exercise[]):Exercise[]{
 const guide=guideFor(exercise);
 const byId=new Map(catalog.map(item=>[item.id,item]));
 const explicit=(guide?.alternatives??[]).map(id=>byId.get(id)).filter((x):x is Exercise=>Boolean(x)&&x.id!==exercise.id);
 const rest=catalog.filter(candidate=>candidate.id!==exercise.id&&candidate.primaryMuscle===exercise.primaryMuscle&&!explicit.some(item=>item.id===candidate.id));
 return [...explicit,...rest].slice(0,8);
}
export function normalized(value:string):string{
 return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
}
export function searchExercises(catalog:Exercise[],term:string,muscle:string,equipment:string):Exercise[]{
 const query=normalized(term);
 return catalog.filter(ex=>{
  if(muscle!=="Todos"&&ex.primaryMuscle!==muscle)return false;
  if(equipment!=="Todos"&&ex.equipment!==equipment)return false;
  return normalized([ex.name,ex.primaryMuscle,ex.equipment??"",...(ex.secondaryMuscles??[])].join(" ")).includes(query);
 }).sort((a,b)=>a.name.localeCompare(b.name,"pt-BR"));
}
export function usedInPlans(exerciseIdValue:string,plans:{name:string;exercises:{exerciseId:string}[]}[]):string[]{
 return plans.filter(plan=>plan.exercises.some(row=>row.exerciseId===exerciseIdValue)).map(plan=>plan.name);
}
export const ORIGINAL_PROGRAM_EXERCISE_IDS = [...new Set(PROGRAM_DAYS.flatMap(day=>day.exercises.map(e=>exerciseId(e.name))))];
