/**
 * Wallet Session Management
 * 
 * Handles secure storage of walletKey in localStorage with 12-hour expiry.
 * The walletKey is used to decrypt the encrypted_blob stored in Supabase profiles.
 * 
 * Security Model:
 * - walletKey is stored in localStorage (persists across browser sessions)
 * - 12-hour expiry ensures re-authentication for long sessions
 * - privateKey is ONLY held in memory after decryption
 * - encrypted_blob in Supabase can only be decrypted with walletKey
 * - Key is cleared on explicit logout
 */

const WALLET_KEY_STORAGE = 'bb_wallet_key';
const WALLET_KEY_EXPIRY = 'bb_wallet_key_expiry';
const WALLET_ADDRESS_STORAGE = 'bb_wallet_address';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ═══════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes;
}

// ═══════════════════════════════════════════════════════════════
// SESSION STORAGE FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Store walletKey in localStorage with 7-day expiry
 * Called after successful wallet creation
 */
export function storeWalletKey(vaultKey: Uint8Array): void {
  if (typeof window === 'undefined') return;
  
  const expiry = Date.now() + SESSION_DURATION;
  localStorage.setItem(WALLET_KEY_STORAGE, bytesToHex(vaultKey));
  localStorage.setItem(WALLET_KEY_EXPIRY, expiry.toString());
}

/**
 * Retrieve walletKey from localStorage if not expired
 * Returns null if expired or not found
 */
export function getStoredWalletKey(): Uint8Array | null {
  if (typeof window === 'undefined') return null;
  
  const expiry = localStorage.getItem(WALLET_KEY_EXPIRY);
  if (!expiry || Date.now() > parseInt(expiry)) {
    clearWalletKey();
    return null;
  }
  
  const keyHex = localStorage.getItem(WALLET_KEY_STORAGE);
  return keyHex ? hexToBytes(keyHex) : null;
}

/**
 * Check if walletKey exists and is valid
 */
export function hasValidWalletKey(): boolean {
  return getStoredWalletKey() !== null;
}

/**
 * Get time remaining until session expires (in milliseconds)
 */
export function getSessionTimeRemaining(): number {
  if (typeof window === 'undefined') return 0;
  
  const expiry = sessionStorage.getItem(WALLET_KEY_EXPIRY);
  if (!expiry) return 0;
  
  const remaining = parseInt(expiry) - Date.now();
  return remaining > 0 ? remaining : 0;
}

/**
 * Clear walletKey from localStorage
 * Called on logout or session expiry
 */
export function clearWalletKey(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem(WALLET_KEY_STORAGE);
  localStorage.removeItem(WALLET_KEY_EXPIRY);
  localStorage.removeItem(WALLET_ADDRESS_STORAGE);
}

/**
 * Store wallet address for quick access
 */
export function storeWalletAddress(address: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(WALLET_ADDRESS_STORAGE, address);
}

/**
 * Get stored wallet address
 */
export function getStoredWalletAddress(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(WALLET_ADDRESS_STORAGE);
}

// ═══════════════════════════════════════════════════════════════
// CRYPTOGRAPHIC FUNCTIONS (Browser-compatible)
// ═══════════════════════════════════════════════════════════════

const AUTH_FORK_DOMAIN = "BLACKBOOK_AUTH_V2";
const VAULT_FORK_DOMAIN = "BLACKBOOK_VAULT_V2";

/**
 * SHA-256 hash function
 */
export async function sha256(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer.buffer.slice(dataBuffer.byteOffset, dataBuffer.byteOffset + dataBuffer.byteLength) as ArrayBuffer);
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Generate cryptographically secure random bytes
 */
export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Fork password into authKey and vaultKey
 * 
 * @param password - User's password
 * @param authSalt - Salt for auth key (stored in Supabase)
 * @param vaultSalt - Salt for vault key (stored in Supabase)
 * @returns { authKey: string, vaultKey: Uint8Array }
 * 
 * authKey → sent to server for authentication
 * vaultKey → NEVER sent, used locally to decrypt wallet
 */
export async function forkPassword(
  password: string,
  authSalt: string,
  vaultSalt: string
): Promise<{ authKey: string; vaultKey: Uint8Array }> {
  // FORK A: Auth Key (fast SHA256 - server will bcrypt this)
  const authDomain = AUTH_FORK_DOMAIN + authSalt;
  const authKey = await sha256(authDomain + password);
  
  // FORK B: Vault Key (PBKDF2 with high iterations)
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(VAULT_FORK_DOMAIN + vaultSalt + password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const vaultKeyBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(vaultSalt),
      iterations: 100000, // 100k iterations for security
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes
  );
  
  return {
    authKey,
    vaultKey: new Uint8Array(vaultKeyBits)
  };
}

/**
 * Encrypt data with AES-256-GCM
 */
export async function encryptWithKey(
  data: string,
  key: Uint8Array,
  salt: string
): Promise<{ ciphertext: string; nonce: string }> {
  const nonce = randomBytes(12);
  const encoder = new TextEncoder();
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // Use salt as Additional Authenticated Data (AAD)
  const aad = encoder.encode(salt);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer,
      additionalData: aad
    },
    cryptoKey,
    encoder.encode(data)
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertext)))),
    nonce: bytesToHex(nonce)
  };
}

/**
 * Decrypt data with AES-256-GCM
 */
export async function decryptWithKey(
  ciphertext: string,
  nonceHex: string,
  key: Uint8Array,
  salt: string
): Promise<string> {
  const nonce = hexToBytes(nonceHex);
  const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key.buffer.slice(key.byteOffset, key.byteOffset + key.byteLength) as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const encoder = new TextEncoder();
  const aad = encoder.encode(salt);
  
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer,
      additionalData: aad
    },
    cryptoKey,
    ciphertextBytes
  );
  
  return new TextDecoder().decode(decrypted);
}

// ═══════════════════════════════════════════════════════════════
// BIP39 MNEMONIC GENERATION
// ═══════════════════════════════════════════════════════════════

const BIP39_WORDLIST = [
  'abandon','ability','able','about','above','absent','absorb','abstract','absurd','abuse',
  'access','accident','account','accuse','achieve','acid','acoustic','acquire','across','act',
  'action','actor','actress','actual','adapt','add','addict','address','adjust','admit',
  'adult','advance','advice','aerobic','affair','afford','afraid','again','age','agent',
  'agree','ahead','aim','air','airport','aisle','alarm','album','alcohol','alert',
  'alien','all','alley','allow','almost','alone','alpha','already','also','alter',
  'always','amateur','amazing','among','amount','amused','analyst','anchor','ancient','anger',
  'angle','angry','animal','ankle','announce','annual','another','answer','antenna','antique',
  'anxiety','any','apart','apology','appear','apple','approve','april','arch','arctic',
  'area','arena','argue','arm','armed','armor','army','around','arrange','arrest',
  'arrive','arrow','art','artefact','artist','artwork','ask','aspect','assault','asset',
  'assist','assume','asthma','athlete','atom','attack','attend','attitude','attract','auction',
  'audit','august','aunt','author','auto','autumn','average','avocado','avoid','awake',
  'aware','away','awesome','awful','awkward','axis','baby','bachelor','bacon','badge',
  'bag','balance','balcony','ball','bamboo','banana','banner','bar','barely','bargain',
  'barrel','base','basic','basket','battle','beach','bean','beauty','because','become',
  'beef','before','begin','behave','behind','believe','below','belt','bench','benefit',
  'best','betray','better','between','beyond','bicycle','bid','bike','bind','biology',
  'bird','birth','bitter','black','blade','blame','blanket','blast','bleak','bless',
  'blind','blood','blossom','blouse','blue','blur','blush','board','boat','body',
  'boil','bomb','bone','bonus','book','boost','border','boring','borrow','boss',
  'bottom','bounce','box','boy','bracket','brain','brand','brass','brave','bread',
  'breeze','brick','bridge','brief','bright','bring','brisk','broccoli','broken','bronze',
  'broom','brother','brown','brush','bubble','buddy','budget','buffalo','build','bulb',
  'bulk','bullet','bundle','bunker','burden','burger','burst','bus','business','busy',
  'butter','buyer','buzz','cabbage','cabin','cable','cactus','cage','cake','call',
  'calm','camera','camp','can','canal','cancel','candy','cannon','canoe','canvas',
  'canyon','capable','capital','captain','car','carbon','card','cargo','carpet','carry',
  'cart','case','cash','casino','castle','casual','cat','catalog','catch','category',
  'cattle','caught','cause','caution','cave','ceiling','celery','cement','census','century',
  'cereal','certain','chair','chalk','champion','change','chaos','chapter','charge','chase',
  'chat','cheap','check','cheese','chef','cherry','chest','chicken','chief','child',
  'chimney','choice','choose','chronic','chuckle','chunk','churn','cigar','cinnamon','circle',
  'citizen','city','civil','claim','clap','clarify','claw','clay','clean','clerk',
  'clever','click','client','cliff','climb','clinic','clip','clock','clog','close',
  'cloth','cloud','clown','club','clump','cluster','clutch','coach','coast','coconut',
  'code','coffee','coil','coin','collect','color','column','combine','come','comfort',
  'comic','common','company','concert','conduct','confirm','congress','connect','consider','control',
  'convince','cook','cool','copper','copy','coral','core','corn','correct','cost',
  'cotton','couch','country','couple','course','cousin','cover','coyote','crack','cradle',
  'craft','cram','crane','crash','crater','crawl','crazy','cream','credit','creek',
  'crew','cricket','crime','crisp','critic','crop','cross','crouch','crowd','crucial',
  'cruel','cruise','crumble','crunch','crush','cry','crystal','cube','culture','cup',
  'cupboard','curious','current','curtain','curve','cushion','custom','cute','cycle','dad',
  'damage','damp','dance','danger','daring','dash','daughter','dawn','day','deal',
  'debate','debris','decade','december','decide','decline','decorate','decrease','deer','defense',
  'define','defy','degree','delay','deliver','demand','demise','denial','dentist','deny',
  'depart','depend','deposit','depth','deputy','derive','describe','desert','design','desk',
  'despair','destroy','detail','detect','develop','device','devote','diagram','dial','diamond',
  'diary','dice','diesel','diet','differ','digital','dignity','dilemma','dinner','dinosaur',
  'direct','dirt','disagree','discover','disease','dish','dismiss','disorder','display','distance',
  'divert','divide','divorce','dizzy','doctor','document','dog','doll','dolphin','domain',
  'donate','donkey','donor','door','dose','double','dove','draft','dragon','drama',
  'drastic','draw','dream','dress','drift','drill','drink','drip','drive','drop',
  'drum','dry','duck','dumb','dune','during','dust','dutch','duty','dwarf',
  'dynamic','eager','eagle','early','earn','earth','easily','east','easy','echo',
  'ecology','economy','edge','edit','educate','effort','egg','eight','either','elbow',
  'elder','electric','elegant','element','elephant','elevator','elite','else','embark','embody',
  'embrace','emerge','emotion','employ','empower','empty','enable','enact','end','endless',
  'endorse','enemy','energy','enforce','engage','engine','enhance','enjoy','enlist','enough',
  'enrich','enroll','ensure','enter','entire','entry','envelope','episode','equal','equip',
  'era','erase','erode','erosion','error','erupt','escape','essay','essence','estate',
  'eternal','ethics','evidence','evil','evoke','evolve','exact','example','excess','exchange',
  'excite','exclude','excuse','execute','exercise','exhaust','exhibit','exile','exist','exit',
  'exotic','expand','expect','expire','explain','expose','express','extend','extra','eye',
  'eyebrow','fabric','face','faculty','fade','faint','faith','fall','false','fame',
  'family','famous','fan','fancy','fantasy','farm','fashion','fat','fatal','father',
  'fatigue','fault','favorite','feature','february','federal','fee','feed','feel','female',
  'fence','festival','fetch','fever','few','fiber','fiction','field','figure','file',
  'film','filter','final','find','fine','finger','finish','fire','firm','first',
  'fiscal','fish','fit','fitness','fix','flag','flame','flash','flat','flavor',
  'flee','flight','flip','float','flock','floor','flower','fluid','flush','fly',
  'foam','focus','fog','foil','fold','follow','food','foot','force','forest',
  'forget','fork','fortune','forum','forward','fossil','foster','found','fox','fragile',
  'frame','frequent','fresh','friend','fringe','frog','front','frost','frown','frozen',
  'fruit','fuel','fun','funny','furnace','fury','future','gadget','gain','galaxy',
  'gallery','game','gap','garage','garbage','garden','garlic','garment','gas','gasp',
  'gate','gather','gauge','gaze','general','genius','genre','gentle','genuine','gesture',
  'ghost','giant','gift','giggle','ginger','giraffe','girl','give','glad','glance',
  'glare','glass','glide','glimpse','globe','gloom','glory','glove','glow','glue',
  'goat','goddess','gold','good','goose','gorilla','gospel','gossip','govern','gown',
  'grab','grace','grain','grant','grape','grass','gravity','great','green','grid',
  'grief','grit','grocery','group','grow','grunt','guard','guess','guide','guilt',
  'guitar','gun','gym','habit','hair','half','hammer','hamster','hand','happy',
  'harbor','hard','harsh','harvest','hat','have','hawk','hazard','head','health',
  'heart','heavy','hedgehog','height','hello','helmet','help','hen','hero','hidden',
  'high','hill','hint','hip','hire','history','hobby','hockey','hold','hole',
  'holiday','hollow','home','honey','hood','hope','horn','horror','horse','hospital',
  'host','hotel','hour','hover','hub','huge','human','humble','humor','hundred',
  'hungry','hunt','hurdle','hurry','hurt','husband','hybrid','ice','icon','idea',
  'identify','idle','ignore','ill','illegal','illness','image','imitate','immense','immune',
  'impact','impose','improve','impulse','inch','include','income','increase','index','indicate',
  'indoor','industry','infant','inflict','inform','inhale','inherit','initial','inject','injury',
  'inmate','inner','innocent','input','inquiry','insane','insect','inside','inspire','install',
  'intact','interest','into','invest','invite','involve','iron','island','isolate','issue',
  'item','ivory','jacket','jaguar','jar','jazz','jealous','jeans','jelly','jewel',
  'job','join','joke','journey','joy','judge','juice','jump','jungle','junior',
  'junk','just','kangaroo','keen','keep','ketchup','key','kick','kid','kidney',
  'kind','kingdom','kiss','kit','kitchen','kite','kitten','kiwi','knee','knife',
  'knock','know','lab','label','labor','ladder','lady','lake','lamp','language',
  'laptop','large','later','latin','laugh','laundry','lava','law','lawn','lawsuit',
  'layer','lazy','leader','leaf','learn','leave','lecture','left','leg','legal',
  'legend','leisure','lemon','lend','length','lens','leopard','lesson','letter','level',
  'liar','liberty','library','license','life','lift','light','like','limb','limit',
  'link','lion','liquid','list','little','live','lizard','load','loan','lobster',
  'local','lock','logic','lonely','long','loop','lottery','loud','lounge','love',
  'loyal','lucky','luggage','lumber','lunar','lunch','luxury','lyrics','machine','mad',
  'magic','magnet','maid','mail','main','major','make','mammal','man','manage',
  'mandate','mango','mansion','manual','maple','marble','march','margin','marine','market',
  'marriage','mask','mass','master','match','material','math','matrix','matter','maximum',
  'maze','meadow','mean','measure','meat','mechanic','medal','media','melody','melt',
  'member','memory','mention','menu','mercy','merge','merit','merry','mesh','message',
  'metal','method','middle','midnight','milk','million','mimic','mind','minimum','minor',
  'minute','miracle','mirror','misery','miss','mistake','mix','mixed','mixture','mobile',
  'model','modify','mom','moment','monitor','monkey','monster','month','moon','moral',
  'more','morning','mosquito','mother','motion','motor','mountain','mouse','move','movie',
  'much','muffin','mule','multiply','muscle','museum','mushroom','music','must','mutual',
  'myself','mystery','myth','naive','name','napkin','narrow','nasty','nation','nature',
  'near','neck','need','negative','neglect','neither','nephew','nerve','nest','net',
  'network','neutral','never','news','next','nice','night','noble','noise','nominee',
  'noodle','normal','north','nose','notable','note','nothing','notice','novel','now',
  'nuclear','number','nurse','nut','oak','obey','object','oblige','obscure','observe',
  'obtain','obvious','occur','ocean','october','odor','off','offer','office','often',
  'oil','okay','old','olive','olympic','omit','once','one','onion','online',
  'only','open','opera','opinion','oppose','option','orange','orbit','orchard','order',
  'ordinary','organ','orient','original','orphan','ostrich','other','outdoor','outer','output',
  'outside','oval','oven','over','own','owner','oxygen','oyster','ozone','pact',
  'paddle','page','pair','palace','palm','panda','panel','panic','panther','paper',
  'parade','parent','park','parrot','party','pass','patch','path','patient','patrol',
  'pattern','pause','pave','payment','peace','peanut','pear','peasant','pelican','pen',
  'penalty','pencil','people','pepper','perfect','permit','person','pet','phone','photo',
  'phrase','physical','piano','picnic','picture','piece','pig','pigeon','pill','pilot',
  'pink','pioneer','pipe','pistol','pitch','pizza','place','planet','plastic','plate',
  'play','please','pledge','pluck','plug','plunge','poem','poet','point','polar',
  'pole','police','pond','pony','pool','popular','portion','position','possible','post',
  'potato','pottery','poverty','powder','power','practice','praise','predict','prefer','prepare',
  'present','pretty','prevent','price','pride','primary','print','priority','prison','private',
  'prize','problem','process','produce','profit','program','project','promote','proof','property',
  'prosper','protect','proud','provide','public','pudding','pull','pulp','pulse','pumpkin',
  'punch','pupil','puppy','purchase','purity','purpose','purse','push','put','puzzle',
  'pyramid','quality','quantum','quarter','question','quick','quit','quiz','quote','rabbit',
  'raccoon','race','rack','radar','radio','rail','rain','raise','rally','ramp',
  'ranch','random','range','rapid','rare','rate','rather','raven','raw','razor',
  'ready','real','reason','rebel','rebuild','recall','receive','recipe','record','recycle',
  'reduce','reflect','reform','refuse','region','regret','regular','reject','relax','release',
  'relief','rely','remain','remember','remind','remove','render','renew','rent','reopen',
  'repair','repeat','replace','report','require','rescue','resemble','resist','resource','response',
  'result','retire','retreat','return','reunion','reveal','review','reward','rhythm','rib',
  'ribbon','rice','rich','ride','ridge','rifle','right','rigid','ring','riot',
  'ripple','risk','ritual','rival','river','road','roast','robot','robust','rocket',
  'romance','roof','rookie','room','rose','rotate','rough','round','route','royal',
  'rubber','rude','rug','rule','run','runway','rural','sad','saddle','sadness',
  'safe','sail','salad','salmon','salon','salt','salute','same','sample','sand',
  'satisfy','satoshi','sauce','sausage','save','say','scale','scan','scare','scatter',
  'scene','scheme','school','science','scissors','scorpion','scout','scrap','screen','script',
  'scrub','sea','search','season','seat','second','secret','section','security','seed',
  'seek','segment','select','sell','seminar','senior','sense','sentence','series','service',
  'session','settle','setup','seven','shadow','shaft','shallow','share','shed','shell',
  'sheriff','shield','shift','shine','ship','shiver','shock','shoe','shoot','shop',
  'short','shoulder','shove','shrimp','shrug','shuffle','shy','sibling','sick','side',
  'siege','sight','sign','silent','silk','silly','silver','similar','simple','since',
  'sing','siren','sister','situate','six','size','skate','sketch','ski','skill',
  'skin','skirt','skull','slab','slam','sleep','slender','slice','slide','slight',
  'slim','slogan','slot','slow','slush','small','smart','smile','smoke','smooth',
  'snack','snake','snap','sniff','snow','soap','soccer','social','sock','soda',
  'soft','solar','soldier','solid','solution','solve','someone','song','soon','sorry',
  'sort','soul','sound','soup','source','south','space','spare','spatial','spawn',
  'speak','special','speed','spell','spend','sphere','spice','spider','spike','spin',
  'spirit','split','spoil','sponsor','spoon','sport','spot','spray','spread','spring',
  'spy','square','squeeze','squirrel','stable','stadium','staff','stage','stairs','stamp',
  'stand','start','state','stay','steak','steel','stem','step','stereo','stick',
  'still','sting','stock','stomach','stone','stool','story','stove','strategy','street',
  'strike','strong','struggle','student','stuff','stumble','style','subject','submit','subway',
  'success','such','sudden','suffer','sugar','suggest','suit','summer','sun','sunny',
  'sunset','super','supply','supreme','sure','surface','surge','surprise','surround','survey',
  'suspect','sustain','swallow','swamp','swap','swarm','swear','sweet','swift','swim',
  'swing','switch','sword','symbol','symptom','syrup','system','table','tackle','tag',
  'tail','talent','talk','tank','tape','target','task','taste','tattoo','taxi',
  'teach','team','tell','ten','tenant','tennis','tent','term','test','text',
  'thank','that','theme','then','theory','there','they','thing','this','thought',
  'three','thrive','throw','thumb','thunder','ticket','tide','tiger','tilt','timber',
  'time','tiny','tip','tired','tissue','title','toast','tobacco','today','toddler',
  'toe','together','toilet','token','tomato','tomorrow','tone','tongue','tonight','tool',
  'tooth','top','topic','topple','torch','tornado','tortoise','toss','total','tourist',
  'toward','tower','town','toy','track','trade','traffic','tragic','train','transfer',
  'trap','trash','travel','tray','treat','tree','trend','trial','tribe','trick',
  'trigger','trim','trip','trophy','trouble','truck','true','truly','trumpet','trust',
  'truth','try','tube','tuition','tumble','tuna','tunnel','turkey','turn','turtle',
  'twelve','twenty','twice','twin','twist','two','type','typical','ugly','umbrella',
  'unable','unaware','uncle','uncover','under','undo','unfair','unfold','unhappy','uniform',
  'unique','unit','universe','unknown','unlock','until','unusual','unveil','update','upgrade',
  'uphold','upon','upper','upset','urban','urge','usage','use','used','useful',
  'useless','usual','utility','vacant','vacuum','vague','valid','valley','valve','van',
  'vanish','vapor','various','vast','vault','vehicle','velvet','vendor','venture','venue',
  'verb','verify','version','very','vessel','veteran','viable','vibrant','vicious','victory',
  'video','view','village','vintage','violin','virtual','virus','visa','visit','visual',
  'vital','vivid','vocal','voice','void','volcano','volume','vote','voyage','wage',
  'wagon','wait','walk','wall','walnut','want','warfare','warm','warrior','wash',
  'wasp','waste','water','wave','way','wealth','weapon','wear','weasel','weather',
  'web','wedding','weekend','weird','welcome','west','wet','whale','what','wheat',
  'wheel','when','where','whip','whisper','wide','width','wife','wild','will',
  'win','window','wine','wing','wink','winner','winter','wire','wisdom','wise',
  'wish','witness','wolf','woman','wonder','wood','wool','word','work','world',
  'worry','worth','wrap','wreck','wrestle','wrist','write','wrong','yard','year',
  'yellow','you','young','youth','zebra','zero','zone','zoo'
];

/**
 * Generate BIP39 compliant 24-word mnemonic
 */
export async function generateMnemonic(): Promise<string> {
  // 256 bits of entropy for 24 words
  const entropy = randomBytes(32);
  
  // Convert entropy to binary string
  const entropyBits = Array.from(entropy)
    .map(b => b.toString(2).padStart(8, '0'))
    .join('');
  
  // Calculate SHA256 checksum
  const hashBuffer = await crypto.subtle.digest('SHA-256', entropy.buffer.slice(entropy.byteOffset, entropy.byteOffset + entropy.byteLength) as ArrayBuffer);
  const hashArray = new Uint8Array(hashBuffer);
  const checksumBits = Array.from(hashArray)
    .map(b => b.toString(2).padStart(8, '0'))
    .join('')
    .slice(0, 8); // First 8 bits for 256-bit entropy
  
  const allBits = entropyBits + checksumBits;
  
  // Split into 24 x 11-bit segments
  const mnemonic: string[] = [];
  for (let i = 0; i < 24; i++) {
    const index = parseInt(allBits.slice(i * 11, (i + 1) * 11), 2);
    mnemonic.push(BIP39_WORDLIST[index]);
  }
  
  return mnemonic.join(' ');
}

/**
 * Validate mnemonic words
 */
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) return false;
  return words.every(word => BIP39_WORDLIST.includes(word));
}

/**
 * Derive seed from mnemonic using BIP39 spec
 */
export async function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(mnemonic.normalize('NFKD')),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  const salt = encoder.encode('mnemonic' + passphrase);
  
  const seed = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 2048,
      hash: 'SHA-512'
    },
    keyMaterial,
    512
  );
  
  // Return first 32 bytes for Ed25519 seed
  return new Uint8Array(seed).slice(0, 32);
}

/**
 * Derive L1 address from public key
 * Address = L1_ + SHA256(pubkey)[0..40].toUpperCase()
 */
export async function deriveL1Address(publicKey: Uint8Array): Promise<string> {
  const hash = await sha256(publicKey);
  return 'L1_' + hash.slice(0, 40).toUpperCase();
}

// Export wordlist for UI display
export { BIP39_WORDLIST };
