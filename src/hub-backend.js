// Firebase Realtime Database paths for the shared world (rules: database.rules.json).
// presence/{uid}         nickname, area and AFK flag; only the player and their friends can read it
// pos/{uid}              area and position while in an outdoor area; same readers
// friends/{uid}/{other}  true once both have agreed; each side's list is private to its owner
// requests/{to}/{from}   a pending friend request carrying the sender's nickname
// profiles/{uid}         the chosen nickname
// nicknames/{lower}      which account owns a nickname, so names stay unique and friends can be found by name
// The server removes presence and position when the player disconnects.
export function realtimeBackend(fb,app,url){
 const db=fb.getDatabase(app,url),at=path=>path?fb.ref(db,path):fb.ref(db);
 const watchChildren=(path,callback,onError)=>{
  const node=at(path),fail=error=>onError?.(error),stops=[fb.onChildAdded(node,s=>callback(s.key,s.val()),fail),fb.onChildChanged(node,s=>callback(s.key,s.val()),fail),fb.onChildRemoved(node,s=>callback(s.key,null),fail)];
  return ()=>stops.forEach(stop=>stop());
 };
 // A friend's entries become unreadable the moment the friendship ends; the listener then reports nothing.
 const watchValue=(path,callback)=>fb.onValue(at(path),s=>callback(s.val()),()=>callback(null));
 return {
  async profile(uid){return (await fb.get(at(`profiles/${uid}`))).val();},
  async lookupNick(nick){return (await fb.get(at(`nicknames/${nick.toLowerCase()}`))).val();},
  // One atomic write: the new name is reserved, the old one released and the profile (and presence when online) renamed together.
  claimNick(uid,nick,old,online){
   const patch={[`nicknames/${nick.toLowerCase()}`]:uid,[`profiles/${uid}/nick`]:nick};
   if(old&&old.toLowerCase()!==nick.toLowerCase())patch[`nicknames/${old.toLowerCase()}`]=null;
   if(online)patch[`presence/${uid}/n`]=nick;
   return fb.update(at(),patch);
  },
  async join(uid,presence){
   await fb.onDisconnect(at(`presence/${uid}`)).remove();await fb.onDisconnect(at(`pos/${uid}`)).remove();
   await fb.set(at(`presence/${uid}`),{...presence,t:fb.serverTimestamp()});
  },
  updatePresence(uid,patch){return fb.update(at(`presence/${uid}`),patch);},
  // pose is null indoors and on the title screen.
  sendPosition(uid,pose){return pose?fb.set(at(`pos/${uid}`),pose):fb.remove(at(`pos/${uid}`));},
  async leave(uid){
   await fb.remove(at(`pos/${uid}`));await fb.remove(at(`presence/${uid}`));
   await fb.onDisconnect(at(`pos/${uid}`)).cancel();await fb.onDisconnect(at(`presence/${uid}`)).cancel();
  },
  watchFriends(uid,callback,onError){return watchChildren(`friends/${uid}`,(id,value)=>callback(id,value===true),onError);},
  watchRequests(uid,callback,onError){return watchChildren(`requests/${uid}`,callback,onError);},
  watchPresence(uid,callback){return watchValue(`presence/${uid}`,callback);},
  watchPosition(uid,callback){return watchValue(`pos/${uid}`,callback);},
  request(from,to,nick){return fb.set(at(`requests/${to}/${from}`),{n:nick,t:fb.serverTimestamp()});},
  // Accepting writes both friend lists and clears the request in one step; declining only clears it.
  answer(me,from,accept){
   const patch={[`requests/${me}/${from}`]:null};
   if(accept)Object.assign(patch,{[`friends/${me}/${from}`]:true,[`friends/${from}/${me}`]:true});
   return fb.update(at(),patch);
  },
  unfriend(me,other){return fb.update(at(),{[`friends/${me}/${other}`]:null,[`friends/${other}/${me}`]:null});}
 };
}
