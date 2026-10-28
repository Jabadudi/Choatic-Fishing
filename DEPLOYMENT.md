# GitHub Pages and online lobbies

The public repository is https://github.com/Jabadudi/Choatic-Fishing and the game is published at https://jabadudi.github.io/Choatic-Fishing/. Pushes to main run the tests, build the game, and deploy through GitHub Actions.

## Publish

1. Publish this repository to GitHub (public for GitHub Free Pages).
2. In GitHub repository Settings → Pages, choose **GitHub Actions** as the source.
3. Open Actions → **Test and deploy game** → Run workflow on `main`.
4. Open the URL reported by the successful deployment job.

The included workflow tests the game, builds `dist/`, and deploys the browser files. Relative asset paths support repository URLs such as `https://USERNAME.github.io/REPOSITORY/`.

## Play with friends

Open the published URL, enter a name, and choose **Create online lobby**. Copy the invite link and share it. Friends open it and press Join. Everyone readies up; the host starts the five-second countdown. Online matches support 2–4 human players. Practice mode has one bot.

GitHub Pages serves the files; the host browser runs the match. Keep the host tab open and active. PeerJS Cloud provides free connection setup, then WebRTC carries game traffic. Restrictive networks may require a TURN relay, which is not configured in this prototype. There is no host migration: a disconnected participant ends the match, and a disconnected host closes the lobby. Only share invites with intended players.

The host validates guest inputs and owns game state. This is a friendly-match prototype, not a cheat-resistant ranked service. Guests receive updates at 20 Hz and may feel network latency.

Localhost invite links only work on the same computer. Friends need the published URL.

## Verification

Two local browser tabs connected through PeerJS, joined the same lobby, readied up, received the shared countdown, and replicated guest fishing to the host. Separate-network connectivity and the published Pages URL still need verification.

References: [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site), [PeerJS connections](https://peerjs.com/client/faq).


## Google sign-in and cloud saves

Players can optionally sign in with Google. Every save is also copied to their account, so they can continue on another device. The game still saves locally and works offline when signed out.

- Firebase project: `the-wilds-ce2d5` (Spark, free). The web config is in `src/cloud-save.js`; it identifies the project and is safe to publish.
- Auth: Google provider enabled. `jabadudi.github.io` must stay in Authentication → Settings → Authorized domains (add any new domain the game is served from, `localhost` is allowed by default).
- Firestore: one document per player at `saves/{uid}` holding the newest save (`current`) and a set-aside journey (`previous`), each as save-file JSON text. Uploads happen at most once a minute, immediately on manual saves, and when the tab is hidden.
- Security rules: `firestore.rules` lets each player read and write only their own document. After changing it, paste it into Firestore → Rules in the Firebase console and click Publish.
- The SDK is bundled into `vendor/firebase-12.19.0-db2.js` (see `vendor/FIREBASE-LICENSE.txt` for how to rebuild it). Give a rebuilt bundle a new file name so phones do not keep an old cached copy.


## Shared world with friends

Signed-in players open **Friends**, pick a nickname, add friends by nickname and choose **Go online**. A friend request must be accepted before anything is shared, and either friend can remove the other. Online friends see each other walking in the same area, with name tags, and see which area every friend is in. Players who are not friends never see each other. Story, animals, drops and progress stay in each player's own game; only nickname, area, AFK and position are shared with friends. Rooms (the cabin, the chief's house, the guest lodge) share no position.

- Backend: Firebase Realtime Database in the same project. `databaseURL` in `src/cloud-save.js` assumes the default database in the United States (`https://the-wilds-ce2d5-default-rtdb.firebaseio.com`). If the database is created in another region, copy the URL shown at the top of the Realtime Database page into `databaseURL`.
- Data: `presence/{uid}` (nickname, area, AFK) and `pos/{uid}` (area, x, y, facing, walking), readable only by the player and their friends; `friends/{uid}/{other}`, private to its owner; `requests/{to}/{from}`; `profiles/{uid}` (nickname) and `nicknames/{name}` (which account owns a name). The server removes presence and position when a player disconnects.
- Security rules: `database.rules.json`. Each player writes only their own entries, a friendship needs the other player's request, nicknames are unique and checked, positions are range checked, and signed-out visitors can read nothing.
- Chat: the chat box (Enter, or the Chat button) sends plain text to every online friend and `/msg name text` to one friend. Data: `chat/{uid}` (the newest 30 lines, readable by friends), `dm/{to}` (private messages waiting for one friend, deleted once shown) and `rate/{uid}` (time of the last message). The rules check the nickname, cap messages at 200 characters, allow only friends to send private messages and allow at most one message every 0.7 seconds.
- Traffic: a moving player sends about four position updates a second, only while moving, and players only receive positions of friends in the same area. The free Spark plan allows 100 simultaneous connections and 360 MB downloaded a day.

### One-time setup

1. Firebase console → project `the-wilds-ce2d5` → Build → **Realtime Database** → Create Database. Choose **United States (us-central1)** and **Start in locked mode**.
2. Open the **Rules** tab, replace everything with the contents of `database.rules.json`, and click **Publish**. Publish again whenever that file changes.
3. Nothing else changes: Google sign-in and Firestore stay as they are.

### Verification

`scripts/database-rules-check.mjs` runs 38 rule cases against the Realtime Database emulator (nicknames, friend requests, impersonation, strangers reading, removed friends). `scripts/hub-preview.cjs` runs four browsers against the emulator with the real rules: nicknames, a request and acceptance, a stranger standing beside them staying invisible, walking with smoothing, AFK, changing areas, phone landscape, and going offline.
