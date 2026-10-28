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
- The SDK is bundled into `vendor/firebase.js` (see `vendor/FIREBASE-LICENSE.txt` for how to rebuild it).
