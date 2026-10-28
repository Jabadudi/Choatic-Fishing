// Firebase Realtime Database paths for the shared world (rules: database.rules.json).
// presence/{uid}      nickname, area and AFK flag; removed by the server when the player disconnects
// pos/{area}/{uid}    position in one area; removed on disconnect or when the player walks into another area
// profiles/{uid}      the chosen nickname
// nicknames/{lower}   which account owns a nickname, so names stay unique
export function realtimeBackend(fb,app,url){
 const db=fb.getDatabase(app,url),at=path=>path?fb.ref(db,path):fb.ref(db);
 const watchChildren=(path,callback)=>{
  const node=at(path),stops=[fb.onChildAdded(node,s=>callback(s.key,s.val())),fb.onChildChanged(node,s=>callback(s.key,s.val())),fb.onChildRemoved(node,s=>callback(s.key,null))];
  return ()=>stops.forEach(stop=>stop());
 };
 return {
  async profile(uid){return (await fb.get(at(`profiles/${uid}`))).val();},
  // One atomic write: the new name is reserved, the old one released and the profile (and presence when online) renamed together.
  claimNick(uid,nick,old,online){
   const patch={[`nicknames/${nick.toLowerCase()}`]:uid,[`profiles/${uid}/nick`]:nick};
   if(old&&old.toLowerCase()!==nick.toLowerCase())patch[`nicknames/${old.toLowerCase()}`]=null;
   if(online)patch[`presence/${uid}/n`]=nick;
   return fb.update(at(''),patch);
  },
  async join(uid,presence){
   const node=at(`presence/${uid}`);
   await fb.onDisconnect(node).remove();
   await fb.set(node,{...presence,t:fb.serverTimestamp()});
  },
  updatePresence(uid,patch){return fb.update(at(`presence/${uid}`),patch);},
  async changeArea(uid,from,to,pose){
   if(from){const old=at(`pos/${from}/${uid}`);await fb.onDisconnect(old).cancel();await fb.remove(old);}
   await fb.update(at(`presence/${uid}`),{a:to});
   if(pose){const node=at(`pos/${to}/${uid}`);await fb.onDisconnect(node).remove();await fb.set(node,pose);}
  },
  async leaveArea(uid,area){const node=at(`pos/${area}/${uid}`);await fb.onDisconnect(node).cancel();await fb.remove(node);},
  sendPosition(uid,area,pose){return fb.set(at(`pos/${area}/${uid}`),pose);},
  watchPresence(callback){return watchChildren('presence',callback);},
  watchArea(area,callback){return watchChildren(`pos/${area}`,callback);},
  async leave(uid,area){
   if(area)await this.leaveArea(uid,area).catch(()=>{});
   const node=at(`presence/${uid}`);await fb.onDisconnect(node).cancel();await fb.remove(node);
  }
 };
}
