// Splits the current world message for the exploring HUD: the shiny notice shows mid-screen, the rest in the bottom notice line.
// XP and items gained are left out of the notice line because the overhead popups and the item feed already show them.
const SHINY=/^Something glimmers in .+…$/;
const GAINED=[/^\+\d[^·]*XP\.?$/,/^\+\d+ Wishstones?$/,/^Picked up /,/^Dropped (?!.*Examine it nearby)/,/ tangled in the line$/,/^A Wishstone came up on the hook$/];
const parts=message=>(message||'').split(' · ');
export const shinyNotice=message=>parts(message).find(part=>SHINY.test(part))||'';
export const otherNotices=message=>parts(message).map(part=>part.replace(/^.+? caught!( |$)/,'')).filter(part=>part&&!SHINY.test(part)&&!GAINED.some(rule=>rule.test(part))).join(' · ');
