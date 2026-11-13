# Better Smug Drug · The Online Table

The web version of your handmade Better Smug Drug game for **3–5 players**, built with plain HTML, CSS, and JavaScript. No build step, accounts, API keys, or custom server. Create a room, share its link, and join from separate devices. Practice bots can fill empty seats, and solo practice works without a network connection after the site loads.

## Run locally

```sh
npm start
```

Open `http://localhost:8080`. Python 3 is required only for this local server. The game itself runs entirely in the browser. Use different browser profiles or devices for separate players; tabs in the same session may share a reconnect identity.

## Deploy to GitHub Pages

1. Push these files to a GitHub repository on the `main` branch.
2. In **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions**.
3. Run the included **Deploy to GitHub Pages** workflow, or push another commit.

The workflow runs the game tests and deploys only the static application files. Relative asset paths also work under a repository URL such as `https://username.github.io/repository/`. Alternatively, publish the root of the `main` branch using GitHub’s branch deployment option; no build is needed.

## Play online

- Enter a merchant name and choose **Create a table**. Share the six-character code or invitation link.
- Friends open the deployed site, enter their name and code, and choose **Join table**.
- The host can add bots, remove lobby seats, and start once 3–5 connected players are seated. Pick a character in the lobby on a first-come, first-served basis. Selections reserve the character immediately for everyone; taken choices show their owner. You can switch or release your pick before starting. Unchosen seats receive a random remaining character. The host can also choose characters for bots. Solo practice opens this same lobby before play.
- Smugglers exchange cards, load private envelopes, declare one legal good, and offer euro bribes. The D.E.A. inspects or accepts each envelope. Use table chat or an external voice call to bargain.
- After three full D.E.A. rotations with 3 players, or two with 4–5 players, final scoring includes euros, goods, and legal-goods majority bonuses. Equal final scores share the win.

## Connection behavior

The vendored [PeerJS](https://peerjs.com/client/getting-started) 1.5.5 library uses the public PeerServer for signaling and browser WebRTC data channels for gameplay. This avoids maintaining an application server. The room host keeps the authoritative game state and sends each guest only their own hand and public information. Other players’ hidden goods never appear in a guest snapshot. As with an in-person game, the host is trusted.

**Keep the host’s tab open.** There is no backend persistence or host migration: refreshing or closing that tab ends the game. Guest reconnect identity is saved in `sessionStorage`; rejoin from the same browser tab with the original code. A new browser/profile cannot reclaim that identity. If a guest leaves permanently mid-game, the table will wait for them; start a new table to change the roster.

Public signaling availability and direct peer connectivity depend on the network. Corporate firewalls, VPNs, and restrictive NATs may prevent connections; this project does not provision a dedicated TURN relay. Guest disconnects and connection errors are displayed, with a rejoin action. Solo practice does not use PeerJS. No voice/video permissions are requested. Google Fonts are optional and fall back to local fonts.

## Cards and rules

The card data is transcribed from your reference photographs, with mixed-card behavior clarified in this session. All **222 cards across 17 types** are included. Card symbols and the D.E.A. badge have been redrawn as SVGs to follow the handmade originals. The in-game **Cards** guide displays every symbol, value, penalty, and quantity.

| Card | Copies | Value | Inspection penalty | Majority category |
| --- | ---: | ---: | ---: | --- |
| Bread | 48 | €2 | €2 | Bread ×1 |
| Fish | 36 | €3 | €2 | Fish ×1 |
| Meat | 36 | €3 | €2 | Meat ×1 |
| Wine | 24 | €4 | €2 | Wine ×1 |
| Crowbar | 22 | €6 | €4 | — |
| Weed | 20 | €7 | €4 | — |
| Meth | 12 | €8 | €4 | — |
| Heroin | 6 | €9 | €4 | — |
| Cannabread | 2 | €4 | €3 | Bread ×2 |
| Methambreadamine | 2 | €6 | €4 | Bread ×2 |
| Reefer Fish | 2 | €6 | €4 | Fish ×2 |
| Needle Fish | 1 | €9 | €5 | Fish ×2 |
| High Steaks | 2 | €6 | €4 | Meat ×2 |
| Meth Mignon | 1 | €9 | €5 | Meat ×2 |
| Herowine | 2 | €8 | €4 | Wine ×2 |
| Blue Sky | 3 | €10 | €6 | — |
| Burner Phone | 3 | €10 | €6 | — |

**Only ordinary Bread, Fish, Meat, and Wine are legal.** Every mixed card is illegal during inspection, including when declared as its matching food/drink. If delivered, it counts as **two** of that legal good for Kingpin/Queenpin scoring. Its printed value is added only once. Blue Sky and Burner Phone are ordinary illegal goods with no special effects. All thirty character boards below are implemented.

| Category | Kingpin | Queenpin |
| --- | ---: | ---: |
| Bread | €20 | €10 |
| Fish | €15 | €10 |
| Meat | €15 | €10 |
| Wine | €10 | €5 |

The five phases follow your turn-order sheet: **Market → Load envelope → Declaration → Inspection → End of round (new D.E.A.)**. Loading and declaration are separate: all envelopes are locked before declarations begin. Envelopes hold 1–5 cards; the count is always truthful and the declaration names exactly one legal good. Mixed cards still occupy just one envelope slot.

The general settings carried over from the earlier prototype are a €50 starting purse, six-card hands, 3–5 players, and three full D.E.A. rotations for 3 players or two for 4–5 players (9, 8, or 10 total rounds respectively). Market exchanges are simultaneous, limited to one exchange of up to five cards, and draw from the deck. Bribes use euros and can be offered, changed, or revoked from the market phase onward, including during pending inspection decisions. The D.E.A. explicitly accepts the current offer to pass an unopened packet. An acceptance from an outdated screen is rejected if the offer changed or was revoked. Special character fees remain governed by their ability rules. An accepted bribe is paid only for an unopened envelope. If inspected, matching ordinary legal goods are delivered; all other cards are confiscated and their penalties are owed. An entirely honest envelope receives its printed penalties from the agent instead. Unopened illegal goods stay private until final scoring.

When euros cannot cover a penalty, stash goods transfer at face value in the order they entered the stash, with no change. Any remaining debt is waived. Majority ties split bonuses rounded down: tied first places share Kingpin + Queenpin and leave no second award; otherwise the sole Kingpin receives the Kingpin bonus and tied second places share Queenpin. Zero goods receive no bonus. Equal final scores share the win. These general settings can be adjusted as you provide more house rules.

## Characters and abilities

The supplied character photographs are included in `assets/characters/` and framed with CSS for the portraits. The lobby creator can use “Start as D.E.A.” on any player’s card to choose the first agent. The badge then rotates in seat order. Every seat has one unique character. Character choices lock at game start. Human active abilities are triggered through visible buttons, with used/ready status on the player cards; no automatic active-ability activations or browser alerts are used. Inspection responses are inline panels, and reconnecting preserves the pending decision.

| Character | Ability |
| --- | --- |
| Sinister Shinomiya | Once per game, while not D.E.A., challenge another smuggler after loading and before declarations. At round end, compare printed values delivered from the two envelopes; the higher total receives both deliveries. Ties leave deliveries alone. |
| Killer Katagiri | Pays every other player €10 at the start. Until collecting ordinary Bread, Fish, Meat, Wine, and any illegal card, illegal-card fines are doubled. Completing this five-category set permanently stops doubled fines and unlocks a €20 payment from every other player at game end, before scoring. |
| Fearsome Fring | Once per game, while not D.E.A., take over another smuggler’s inspection. Deliver all ordinary legal goods and steal all illegal cards. No normal bribe or fine applies; if every card is legal, Fring pays the owner a flat €3. |
| Slippin’ Jimmy | Once per game, click the ability before the D.E.A. chooses to inspect: pass the envelope and receive €3 per illegal card from Jimmy, or inspect, confiscate illegal cards, deliver all ordinary legal cards, and pay Jimmy €3 per legal card. The original bribe and normal fines are replaced. |
| Lawful Light | Once per game as D.E.A., announce “I’m Kira” while choosing an inspection. If the declaration is false, the owner cannot inspect Light on their next D.E.A. turn. If that turn will never occur before the game ends, Light receives €20 from the bank instead. An honest envelope gets normal compensation. |
| Bootleg Benny | After collecting three crowbars in his stash, crowbars permanently become legal for him, can be declared, and have a €2 penalty. During market exchanges, Benny may replace deck draws with crowbars from anywhere in the discard pile. |
| Duplicity Dana² | Twice per game, after a normal inspection reveals at least two illegal cards, choose two for the D.E.A. to split: one to the agent and one to Dana. Only that pair avoids fines; remaining mismatches receive normal confiscation/fines. Dana earns €4 if the agent takes the higher-value card. |
| Hardline Hank | During each D.E.A. market phase, click to see each smuggler’s first two replacement draws privately. The market waits for Hank to enable or skip surveillance. Initial deals and end-of-round refills are excluded. |
| Criminal Defender Kim | After declaring and before inspection is chosen, offer €15 with at least one illegal card. Acceptance passes the unopened envelope. Refusal delivers all legal cards, confiscates illegal cards, and pays Kim €4 per legal card, without normal fines. |
| L | As D.E.A., sample one random envelope card privately three times per game, optionally reveal it, then inspect or pass. One illegal-type guess per envelope earns €1 per matching illegal card when it is actually opened. Guessing does not spend a sample use. |
| Zach Star Himself | Once per game as D.E.A., use a special inspection. Steal the entire envelope if every card is legal for its owner. If any card is illegal, the owner keeps every card. Ordinary fines and bribes are replaced. |
| Heistmaster Heisenberg | Once per game, respond after the D.E.A. chooses an ordinary inspection but before cards are revealed. If the agent backs down, all goods pass and Heisenberg gets €5 from the bank. If they proceed, ordinary fines and honest compensation double. Meth scores €2 extra and Blue Sky €3 extra while held by Heisenberg. |
| Judgemental Junior | Twice per game as D.E.A., inspect specially: if every card is legal for the owner, Junior earns €8 from the bank and the owner keeps all goods with no compensation. If any card is illegal, the owner still keeps everything. Ordinary fines and bribes are replaced. |
| Safecracker Selena | Three times per game, after an inspection fine is calculated, choose to have the bank pay it directly to the other player. Her own funds and goods remain untouched. Passive: earn €1 from the bank for a positive bribe actually paid between two other players. |
| Windy Wendy | Each ordinary Meth delivered from her own envelope draws one deck card directly into her stash; each Blue Sky draws two. Bonus draws never chain. Only ordinary Meth has no inspection fine; it stays illegal and is confiscated when caught. |
| Resident Advisor Raughn | While D.E.A., Wine becomes illegal and cannot be declared. Each actual illegal card adds €2 to its ordinary fine; legal mismatches retain their ordinary penalty. |
| Skinny Pete & Badger | One board with two independent once-per-game powers. After an honest ordinary inspection, Pete swaps one packet card with any hand card, preserving compensation. After being caught, Badger pays the full fine plus €10 to the bank and keeps the entire packet. Each illegal card in the final stash adds one scoring point. |
| Hellbell Hector | Twice per game as D.E.A., click “This is personal!” on a declared packet to mark its owner and immediately return it unopened. The ordinary offered bribe is paid. If the marked player inspects Hector during their next D.E.A. turn, they pay Hector €5 in addition to the normal inspection outcome. |
| Tariff Trump | Once per game, after delivering at least three illegal cards in one packet, choose to collect €2 per delivered illegal card from each other player (€1 with five or more players). Honest ordinary inspections of packets with at least three cards also award €3 from the bank. |
| Ransack Rick | Starts with €5 extra. Once per game during market, privately exchange exactly three hand cards for any three cards already in the discard pile. This is additional to the ordinary market exchange; activate it while the table is still in the market phase. Also available while Rick holds the badge. |
| Deceptive Dahlia | Twice per game, after ordinary inspection is chosen, secretly remove 1–4 cards while leaving at least one. The D.E.A. continues or accepts the current bribe to cancel; only then are removed cards revealed and discarded. Inspection honesty and compensation use the reduced packet. |
| Stoner Steve | At game end, collect €3 per illegal card held in his stash, with ordinary Weed worth €6 instead. When caught, ordinary Weed costs half the normal fine (rounded up) and returns to his hand. |
| Manhandler Mike | His first honest ordinary inspection waives compensation, once per game. Separately, once per game after finding illegal goods, click No Half Measures to double the normal total fine. |
| Tattletale Timothy | Twice per game while not D.E.A., force inspection of another smuggler’s unopened packet. On a lie, receive €12 from the bank and half the actually collected fine; on an honest packet, split its compensation with the D.E.A. |
| Corrupt Cop Carl | Two independent once/game buttons after opening: steal one caught illegal card while its fine still applies; or discard an illegal card from his hand to frame an honest packet, canceling compensation without adding a fine. |
| Chili Powder Pinkman | Starts with five ordinary cards and one Chili Powder. Passing Chili Powder unopened awards €10 and returns it to his hand; being caught removes it permanently. Chili Powder is illegal but has €0 fine and no stash value. Other actual illegal cards have their fines reduced by €1, to a minimum of zero. |
| Needlestick Nile | Starts with six ordinary cards plus two Used Needles. Pack at most one needle, counting toward the five-card limit; it may be alone. It matches any legal declaration and has no ordinary penalty. Inspection pays Nile €8 in addition to ordinary compensation/fines; passing costs Nile €4 separately from any bribe. The used needle always leaves the game. |
| Temperamental Tuco | Score illegal stash cards at 1.5× their combined printed value, rounding up once. Caught illegal-card fines are 1.5× the combined normal red penalties, rounding down once; mismatching legal-card fines are added separately. |
| Awesome Andrew | His abilities are a mystery. |
| Pickpocket Piper | Starts with €10 extra. Twice per game, a positive paid bribe between two other players opens a 20-second choice to take half, rounded up. The recipient receives the remainder. Skipping or expiration saves the use. |

### Timing and interactions

- **Shinomiya’s window:** before declarations, Shinomiya must challenge or save the ability for another round. Saving does not consume it. All declarations wait for this choice. Only the two envelopes’ delivered goods compete: confiscated goods and goods stolen by Fring are excluded. Goods previously surrendered for debts are not transferred a second time.
- **Katagiri’s categories:** mixed goods satisfy only the illegal category for this ability; they do not substitute for ordinary Bread/Fish/Meat/Wine. Completion is an achievement that remains unlocked even if goods are later lost. Only actual illegal-card penalties double; a mismatching ordinary legal card still has its normal penalty. The usual inability-to-pay rule applies to start/end obligations and inspection penalties (the initial payment is always affordable).
- **Jimmy vs Fring:** these two abilities cannot affect the same envelope. The first valid activation received by the host wins. Jimmy must activate before the D.E.A. chooses to inspect. An ordinary inspection resolves immediately, with no response window for Jimmy. Once Jimmy activates, Fring cannot intervene. No other envelope may be resolved until the offer is settled.
- **Jimmy’s offer:** activation requires at least one illegal card and enough euros to cover €3 per illegal card. The inspector does not see the card counts or contents before choosing. If opened, every ordinary legal card is delivered and compensated, even if it differs from the declaration. Mixed goods are confiscated. If passed, the contents stay hidden. Choosing an ordinary inspection without using the ability does not consume Jimmy’s power.
- **Kira vs Jimmy:** Kira’s inspection resolves immediately, and Jimmy cannot respond afterward. If Jimmy activates first, his offer must be settled; Kira cannot be added to that pending offer.
- **Kira’s protection:** affects only the named rival’s next D.E.A. turn, then expires. The rival can pass Light’s envelope and collect any voluntarily offered bribe, but cannot inspect it. Fring’s personal takeover is a separate inspector’s ability.
- **Benny’s classification:** the three crowbars must be in the stash together, not just in hand. Once unlocked, legality and the €2 penalty persist if goods are lost. The card stays worth €6 and receives no new majority bonus. Fring cannot steal Benny’s now-legal crowbars, and L cannot guess them as illegal. The same card is still illegal for other characters. Discard draws replace, never add to, exchanged cards; discard crowbars are drawn first and can be seen by active Hank surveillance.
- **Dana’s trigger:** an ordinary inspection opens the envelope and pauses for Dana to activate Split Decision or take the normal inspection. Selecting a pair spends one of her two uses. Only two actual illegal card positions may be selected, including two copies of the same type. Dana keeps the card the agent does not take. Tied values earn no bank bonus. A previous conflicting inspection ability (L’s sample, Kira, or Fring) takes priority and does not give Dana a response window. Dana’s retained card counts toward her envelope’s delivered value in Shinomiya’s contest; the agent’s card does not.
- **Hank’s privacy:** only Hank receives the draw values; other peers receive no surveillance data. Activating during the market also shows replacement draws already made in that phase. Once everyone exchanges, market progression waits for Hank to enable or skip; it does not activate automatically for a human. Intel remains available to Hank for that round and is cleared in the next round.
- **L’s sample:** each sample is drawn randomly without replacement from that packet’s unseen card positions. L may spend more of his three uses to sample the same packet again, but cannot draw the same physical card twice. Identical goods on distinct cards can both be drawn. All sampled cards still participate in the final inspection or delivery; sampling does not discard or exempt goods. Only L sees private samples until clicking **Reveal sampled cards to everyone**. Previously revealed samples stay visible when a later sample is drawn. The current inspection remains locked to L’s inspect/pass choice. Sampling uses are tracked separately from the unlimited passive (one guess per envelope). L may record a guess before the full opening, including while reviewing the sample. Rewards are paid only on an actual opening, once per packet, at €1 per matching illegal card; passing a packet does not reveal whether the guess was correct. Earlier guesses can still score when a non-conflicting later effect opens the packet.
- **Kim and inspection priority:** Kim must activate in the inspection phase after declarations are complete, before the D.E.A. chooses inspection. She needs an actual illegal card and €15 available. The fixed offer replaces her ordinary bribe. Conflicting active inspection abilities resolve by the first valid activation received by the host: a pending Kim/Jimmy offer blocks L or Fring, and L’s already activated sample blocks later intervention. Passive information gathering and Shinomiya’s round-end contest continue where their effects are compatible.
- **Zach and Junior:** activate after declarations and before opening the selected envelope. They check whether all cards are legal for the owner, not whether the declaration was truthful. Benny’s unlocked crowbars therefore count as legal. Both fully replace the original bribe and ordinary penalties. Zach’s stolen goods are not a successful delivery for the owner’s Shinomiya contest; goods an owner keeps through either special inspection do count as that envelope’s delivery.
- **Heisenberg’s response:** ordinary inspection first creates a sealed response window. Heisenberg clicks to use the challenge or declines without consuming it. If used, only the inspector chooses to back down or inspect for double stakes. Backing down pays Heisenberg €5 from the bank, passes every card unopened, and waives the earlier bribe. A prior conflicting active inspection (Kira, L’s sample, Fring, Zach, or Junior) takes priority and does not create a response window. Before Heisenberg activates, Fring may take over the request, or a Zach/Junior inspector may activate their special inspection first.
- **Heisenberg’s passive values:** ordinary Meth scores €10 and Blue Sky €13 only while in his stash; mixed cards have no added value. Printed values still apply to Shinomiya’s envelope contest, Dana’s higher-value comparison, and settling debts with goods. The global card catalog is unchanged.
- **Selena’s payment source:** her choice appears after a positive inspection fine is known, before any payment or delivery is committed. It covers both a caught-smuggler fine and compensation owed by Selena as D.E.A., including doubled Heisenberg compensation and mandatory payments from refusing Jimmy/Kim. Choosing normal payment preserves the use; choosing the bank pays the full amount directly to the recipient and spends one use. After three uses, fines resolve normally. This funding effect is compatible with an earlier inspection ability because it does not change the inspection outcome. It does not fund bribes or Katagiri’s start/end payments.
- **Selena’s passive:** fires once per positive bribe actually paid between two other players, including Jimmy/Kim offers and an ordinary pass after L’s sample. Changing an offer, zero or completely unpaid bribes, her own payments/receipts, fines, and bank rewards do not count. A Heisenberg back-down waives the earlier bribe, so it creates no passive reward.
- **Wendy’s bonus:** only ordinary Meth and Blue Sky delivered from her own envelope produce draws. Cards gained by other means, including the bonus cards themselves, do not trigger more draws. The ordinary deck/discard reshuffle is used, and fewer bonuses are awarded if both piles empty. Bonus cards are physical cards taken from the deck, not new copies. Bonus identities are shown privately to Wendy; other players see only public legal stash cards and the total illegal count. They do not increase her envelope’s value for Shinomiya’s contest. Meth remains illegal and confiscatable despite its zero fine; Blue Sky and all mixed cards retain their normal fines.
- **Bot players:** use their abilities and respond to pending offers automatically. Humans always make their own active choices using the table controls.

## Tests

```sh
npm test
```

Uses Node’s built-in test runner, with no installed dependencies. Tests cover the full photographed card manifest, mixed-card inspection and weighted majority scoring, separate loading/declaration phases, private state, payments, room authorization, reconnect identity, and 500 complete simulated games (400 with character abilities active). Browser checks additionally cover complete practice games, three-browser online gameplay, pending-offer reconnects, ability priority, and layouts from 320px to 1440px wide. Direct connections should still be checked on your players’ intended networks.

Files: `engine.js` holds pure game rules; `network.js` handles room connections and private snapshots; `app.js` renders the UI and controls practice bots; `style.css` contains the responsive design.

New board details: Raughn’s €2 increase applies before Katagiri/Heisenberg doubling; Wendy’s ordinary Meth exemption remains €0. The Wine ban ends when the badge moves and does not change Wine majority scoring. Pete/Badger response choices wait for the owner, and a prior conflicting inspection ability blocks them; declining preserves the relevant use. Badger needs the full fine plus €10 in coins. Hector’s mark applies only during the target’s next D.E.A. turn, expires unused if the packet is passed, and never cancels Hector’s own fines. Marking someone with no future D.E.A. turn still returns the packet but creates no future payment. Trump’s delivery choice pauses round progression; skipping saves the ability. Rick’s discard catalog is sent only to Rick, stale selections are rejected, and his replacement cards count toward Hank’s first two market draws.

Dahlia, Mike, and Carl use inline response panels, preserved across reconnects. Opening an ability window does not itself consume a use; the first valid active ability received by the host claims conflicting effects. Dahlia’s removed indices and card identities stay private until the agent decides; the discard pile is unchanged until then. Timothy’s split gives any odd coin to the D.E.A.; indivisible surrendered goods are distributed to balance the collected value, and honest split compensation gives the D.E.A. the extra coin. Selena may fund her actual share or her caught fine with Vault Venture. Carl can steal a caught Weed card instead of returning it to Steve, while Steve still pays the reduced fine. Voluntary bribes stay editable during fixed Jimmy/Kim ability decisions, but do not change their fixed fees or undo an opened/claimed outcome.

### Triggered ability countdowns and special cards

Triggered activation windows last **20 seconds**, show a live countdown, and skip automatically without spending the ability. This covers Piper, Heisenberg/Dahlia’s inspection responses, Dana, Pete/Badger, Mike/Carl, Selena’s payment choice, and Trump’s delivery response. Normal controls and proactive abilities stay available. Required choices after an ability has activated (such as the agent deciding whether to continue after Dahlia) do not time out. Deadlines belong to the host, survive reconnects, and are not extended by chat or bribe changes.

Piper’s available share is held aside when the bribe is paid, so it remains available while she decides. Skipping or reaching the deadline returns that share to the original recipient. The host waits for outstanding Piper choices before advancing the round. Needle passing fees, inspection penalties, unpaid offers, zero offers, and Piper’s own bribes do not create an opportunity.

The normal deck still contains 222 cards. Pinkman adds one exclusive Chili Powder and Nile adds two exclusive Used Needles when those characters are selected. These cards cannot be exchanged into the market. Retired special cards never enter the reshuffle pile or score as stash goods. Unused needles do not reduce Nile’s six ordinary hand slots at refill. A special inspection that catches Chili Powder retires it even if that power otherwise allows contraband through. Fring is responsible for the needle payment when he personally takes over and opens a packet.

### D.E.A. bribe requests

From market through inspection, the D.E.A. can request a separate amount from each smuggler, update it, or withdraw it, even before a packet exists. The owner may accept or decline. Acceptance during inspection atomically pays and passes the packet. Acceptance during market/loading/declaration pays immediately and binds passage: the packet automatically passes after all loading and declarations finish, with no second bribe charge or D.E.A. confirmation. Either side can accept: the D.E.A. accepts a smuggler’s offer, or the smuggler accepts the D.E.A.’s request. Accepted deals cannot be revoked; offers and requests remain changeable before agreement. Special-card and paid-bribe effects still apply. Early deals still require the normal market/loading/declaration steps. An agreed price can exceed the smuggler’s remaining purse during declaration because it was already paid. Requests are ordinary negotiation controls, so they have no ability countdown. They persist across reconnects. Each update has a new request identity, making old acceptances invalid even when the amount happens to match again. Requests cannot override an opened packet or a conflicting activated ability. They may be accepted during L’s review or Dahlia’s continue/cancel choice, and are cleared when inspection actually opens the packet. Insufficient funds leave the request pending without taking any coins.

## Private local analytics casebook

Press **Option/Alt + Shift + A** on the game page, or open `analytics.html` on the same site. The casebook is deliberately absent from game navigation. It reads only this browser’s IndexedDB records; another device or browser has its own empty casebook unless files are imported. This is local storage, not a shared server dashboard or a login-protected account.

Only future **completed games hosted in this browser** are automatically archived. Guests do not receive the host’s audit history, and the casebook cannot reveal live hidden packets. Practice and mixed bot games are saved but excluded from statistics by default. Earlier games and abandoned games are not reconstructed. A notice on the home and lobby screens explains the collection.

Records contain character/seat assignments under random persistent browser IDs, initial/final hands, final stashes and score breakdowns, tied winners, each original declaration and its actual cards, post-ability packet contents, original/effective honesty, full openings and deliveries, paid bribes, and action/hand/coin changes. They exclude player names, IP addresses, chat text, room codes, reconnect secrets, and network credentials. Random IDs identify repeat browsers, not verified people; clearing browser storage changes the ID.

The dashboard shows player and character win rates, bluff frequency, inspection frequency/hit rate, unopened bluff passage, card delivery rates, printed value delivered per card loaded, final-stash holder win rates, scores, paid bribes, and recent action history. Filters include player, character, table size, date range, and practice inclusion. Original bluff rates and post-ability inspection outcomes are kept distinct, so Dahlia’s removal does not erase the original false declaration. Shared victories count as wins for each winner.

The leading-card panel ranks cards with at least 10 final-stash holder outcomes by their 95% Wilson lower confidence bound. This is an observed association, not a causal strength estimate: player skill, characters, table size, and majority scoring can affect it. Sample sizes remain visible.

**Export all data** downloads the versioned JSON archive, including actions and cards. **Packet CSV** exports one row per packet for spreadsheet analysis. **Import games** validates a whole file before writing, removes unrecognized fields, and updates matching game IDs instead of double-counting them. Export files before clearing browser data or moving devices. The delete button asks for confirmation and removes only saved game records; current games are unaffected. GitHub Pages deployment includes all analytics files; no database service, API key, or server is needed.

## Public action log

The table’s Public action log shows important public actions throughout the game and remains available after final scoring. It includes exact market discard counts and card types, replacement draw counts, sealed packet counts, declarations, offers and revocations, requested prices and accepted deals, inspection decisions and reveals, paid passage, and ability outcomes. The log shows the latest 20 matches initially, can expand to the retained history (up to 2,000 events), and supports round/search filters. Each entry has a timestamp and round.

Private deck draws and hands are never logged. Rick’s three discarded hand cards are public, while his three secret discard-pile picks stay hidden. L’s samples remain private until shared; Dahlia’s removals appear only after the agent decides. Passed packet contents remain hidden. The host-only analytics audit is separate from this public log.

## Inspection result popups

A full inspection automatically opens a centered popup with the revealed cards, matching/nonmatching labels, an honest/false declaration verdict, and structured payment receipts. It states whether the current viewer pays or receives money and identifies each payer/recipient. Amounts are already settled by the game; bank-funded payments, shared fines, extra Needle/Hector charges, bank rewards, and insufficient-funds payments are shown separately. Goods surrendered for debt appear as settled value without revealing unrelated card identities.

Pending inspection/ability decisions open in the same window with their existing controls and 20-second triggered deadlines. Sealed cards and unshared L samples retain their normal privacy. Piper’s active bribe opportunities remain accessible inside the popup. Result popups stay until dismissed and have no artificial countdown. Consecutive results queue, and **Review latest inspection** reopens a dismissed result. Chat updates do not reopen acknowledged results. Unopened passes never generate a revealed-card popup.
