// Story scenes are written as beats; each spoken line becomes its own dialogue page.
// A beat's art, weather and action carry to every page in it, and `beat` keeps saved page indices migratable.
export const NARRATOR='Narrator',VOICE='Mysterious voice';
export const say=(speaker,text)=>({speaker,text});
export const think=(speaker,text)=>({speaker,text,thought:true});
export const narrate=text=>say(NARRATOR,text);
export const script=beats=>beats.flatMap(({lines,...beat},index)=>lines.map(line=>({...beat,...line,beat:index})));
