export const photos = {
  hero: "https://images.unsplash.com/photo-1646072507379-c6c9dca7de0c?auto=format&fit=crop&w=1400&q=82",
  lat: "https://images.pexels.com/photos/18060085/pexels-photo-18060085.jpeg?auto=compress&cs=tinysrgb&w=900",
  row: "https://images.unsplash.com/photo-1697019921949-d5ec698cb6ca?auto=format&fit=crop&w=900&q=82",
  running: "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=1000",
  equipment: "https://images.unsplash.com/photo-1646072507379-c6c9dca7de0c?auto=format&fit=crop&w=700&q=75",
};
export type DemoExercise = {
  id: string; name: string; muscle: string; equipment: string; sets: number;
  reps: string; rest: number; image: string; cues: string[]; secondary: string;
};
export const exercises: DemoExercise[] = [
  { id:"lat", name:"Puxada alta na polia", muscle:"Costas", equipment:"Polia alta", sets:3, reps:"8–12", rest:90, image:photos.lat, secondary:"Dorsal, bíceps", cues:["Ajuste o banco e mantenha o tronco estável.","Conduza os cotovelos para baixo, aproximando a barra da parte superior do peito.","Retorne devagar, sem soltar a tensão de forma brusca."] },
  { id:"row", name:"Remada curvada", muscle:"Costas", equipment:"Barra", sets:2, reps:"8–10", rest:120, image:photos.row, secondary:"Dorsal, romboides", cues:["Incline o tronco com a coluna em posição neutra.","Puxe a barra em direção ao quadril, aproximando os cotovelos do corpo.","Evite impulsionar o tronco ao longo das repetições."] },
  { id:"pull", name:"Pulldown na polia", muscle:"Costas", equipment:"Polia", sets:2, reps:"12–15", rest:75, image:photos.lat, secondary:"Grande dorsal", cues:["Mantenha uma leve flexão dos cotovelos.","Puxe em arco na direção do quadril.","Retorne lentamente até o alongamento confortável."] },
  { id:"curl", name:"Rosca direta", muscle:"Braços", equipment:"Barra", sets:2, reps:"10–12", rest:75, image:photos.row, secondary:"Bíceps braquial", cues:["Mantenha cotovelos próximos ao tronco.","Eleve a carga sem balançar as costas.","Controle a fase de descida."] },
  { id:"hammer", name:"Rosca martelo", muscle:"Braços", equipment:"Halteres", sets:2, reps:"10–12", rest:75, image:photos.equipment, secondary:"Braquial, braquiorradial", cues:["Segure os halteres com pegada neutra.","Flexione os cotovelos sem mover os ombros.","Desça devagar, mantendo o controle."] },
];
export const mockWeights: Record<string,number> = { lat:42,row:40,pull:30,curl:16,hammer:14 };
export const mockReps: Record<string,number> = { lat:10,row:9,pull:12,curl:11,hammer:10 };
