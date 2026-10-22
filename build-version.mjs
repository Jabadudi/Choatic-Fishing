import {createHash} from 'node:crypto';
export function releaseFingerprint(files){
 const hash=createHash('sha256');
 for(const [name,bytes] of [...files].sort(([a],[b])=>a.localeCompare(b)))hash.update(name).update('\0').update(bytes).update('\0');
 return hash.digest('hex').slice(0,12);
}
