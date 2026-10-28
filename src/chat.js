// Chat box commands, in the spirit of EssentialsX: plain text goes to every online friend, / starts a command.
// Every command goes through the hub, so the same checks apply as for the Friends sheet. Results appear as notes.
export const COMMANDS=[
 ['/msg name message','Private message to one friend (also /w, /tell)'],
 ['/r message','Reply to the last private message'],
 ['/friend add name','Send a friend request (also accept, deny, remove, list)'],
 ['/list','Which friends are online and where'],
 ['/nick name','Change your nickname'],
 ['/afk','Mark yourself away, or back'],
 ['/mute name','Hide a friend’s messages on this device (/unmute to undo)'],
 ['/online, /offline','Show or hide yourself to friends'],
 ['/help','This list']
];
const usage=text=>{throw Error(`Usage: ${text}`);};
const nameOf=(hub,uid)=>{const f=hub.friends.get(uid);return f?.presence?.nick||f?.nick||'that friend';};
export async function runChat(hub,input,{setMuted=()=>{}}={}){
 const text=String(input??'').trim();if(!text)return;
 if(!text.startsWith('/')){await hub.say(text);return;}
 const [word,...rest]=text.slice(1).split(/\s+/),command=word.toLowerCase(),args=rest.join(' ');
 const [first='',...more]=rest,body=more.join(' ');
 switch(command){
  case 'msg':case 'w':case 'tell':case 'whisper':case 'm':
   if(!first||!body)usage('/msg name message');
   await hub.whisper(first,body);return;
  case 'r':case 'reply':{
   if(!hub.replyTo||!hub.friends.has(hub.replyTo))throw Error('Nobody to reply to yet.');
   if(!args)usage('/r message');
   await hub.whisper(nameOf(hub,hub.replyTo),args);return;
  }
  case 'friend':case 'friends':case 'f':{
   const action=(first||'list').toLowerCase(),name=more[0]||'';
   if(action==='list'){const names=hub.roster().slice(1).map(p=>p.online?`${p.nick} (${p.area}${p.afk?', away':''})`:`${p.nick} (offline)`);hub.note(names.length?`Friends: ${names.join(', ')}`:'No friends yet. /friend add name sends a request.');return;}
   if(!name)usage(`/friend ${action} name`);
   if(action==='add'){const result=await hub.addByName(name);hub.note(result==='accepted'?`You and ${name} are now friends.`:`Friend request sent to ${name}.`);return;}
   const request=[...hub.requests.values()].find(r=>r.nick.toLowerCase()===name.toLowerCase());
   if(action==='accept'||action==='deny'){if(!request)throw Error(`No friend request from ${name}.`);await hub.answer(request.uid,action==='accept');hub.note(action==='accept'?`You and ${request.nick} are now friends.`:`Declined ${request.nick}’s request.`);return;}
   if(action==='remove'){const friend=hub.friendNamed(name);if(!friend)throw Error(`${name} is not on your friends list.`);await hub.unfriend(friend.uid);hub.note(`${name} is no longer your friend.`);return;}
   usage('/friend add|accept|deny|remove|list name');return;
  }
  case 'list':case 'who':case 'online-list':{
   if(hub.state!=='online')throw Error('Go online to see where your friends are.');
   const on=hub.roster().slice(1).filter(p=>p.online);
   hub.note(on.length?`${on.length} friend${on.length>1?'s':''} online: ${on.map(p=>`${p.nick} (${p.area}${p.afk?', away':''})`).join(', ')}`:'None of your friends are online.');return;
  }
  case 'nick':case 'nickname':
   if(!first)usage('/nick name');
   await hub.setNick(first);hub.note(`Your friends now see you as ${hub.nick}.`);return;
  case 'afk':case 'away':
   hub.setAfk(!hub.afk);hub.note(hub.afk?'You are marked away.':'You are back.');return;
  case 'mute':case 'ignore':case 'unmute':case 'unignore':{
   if(!first)usage(`/${command} name`);
   const friend=hub.friendNamed(first);if(!friend)throw Error(`${first} is not on your friends list.`);
   const muted=new Set(hub.muted);const on=command==='mute'||command==='ignore';
   if(on)muted.add(friend.uid);else muted.delete(friend.uid);
   hub.setMuted([...muted]);setMuted([...muted]);hub.note(on?`${first}’s messages are hidden. /unmute ${first} shows them again.`:`${first}’s messages show again.`);return;
  }
  case 'online':await hub.goOnline();hub.note(hub.state==='online'?'You are online. Friends in the same area can see you.':'Could not go online.');return;
  case 'offline':await hub.goOffline();hub.note('You are offline. Your friends cannot see you.');return;
  case 'help':case '?':hub.note(COMMANDS.map(([c])=>c).join(' · '));return;
  default:throw Error(`Unknown command /${command}. Type /help for the list.`);
 }
}
