/**
 * BlackBook L1 Wallet SDK - TypeScript Browser Wrapper
 * 
 * Host-Proof Security Model with Fork Architecture V2:
 *   password → forkPassword()
 *   ├─ authKey = SHA256(AUTH_DOMAIN + password + auth_salt)  → sent to server
 *   └─ vaultKey = PBKDF2(VAULT_DOMAIN + password + vault_salt) → NEVER sent
 */

import * as nacl from 'tweetnacl';

// Domain separation for Fork Architecture
const AUTH_FORK_DOMAIN = "BLACKBOOK_AUTH_V2";
const VAULT_FORK_DOMAIN = "BLACKBOOK_VAULT_V2";

export const CHAIN_ID_L1 = 0x01;
export const CHAIN_ID_L2 = 0x02;

// Canonical payload schemas for deterministic signing
const PAYLOAD_SCHEMAS: Record<string, string[]> = {
  transfer: ['from', 'to', 'amount', 'timestamp', 'nonce'],
  bridge_deposit: ['from', 'amount', 'timestamp', 'nonce'],
  bridge_withdraw: ['to', 'amount', 'timestamp', 'nonce'],
};

// BIP39 Wordlist (2048 words)
export const BIP39_WORDLIST = [
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

// ═══════════════════════════════════════════════════════════════
// CRYPTOGRAPHIC UTILITIES
// ═══════════════════════════════════════════════════════════════

export function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

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

export async function sha256(data: string | Uint8Array): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = typeof data === 'string' ? encoder.encode(data) : data;
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer.buffer.slice(dataBuffer.byteOffset, dataBuffer.byteOffset + dataBuffer.byteLength) as ArrayBuffer);
  return bytesToHex(new Uint8Array(hashBuffer));
}

export function generateNonce(): string {
  return crypto.randomUUID();
}

// ═══════════════════════════════════════════════════════════════
// BIP39 MNEMONIC GENERATION
// ═══════════════════════════════════════════════════════════════

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
  
  // Calculate SHA256 checksum of entropy
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
 * Validate a BIP39 mnemonic
 */
export function validateMnemonic(mnemonic: string): boolean {
  const words = mnemonic.trim().toLowerCase().split(/\s+/);
  if (words.length !== 12 && words.length !== 24) {
    return false;
  }
  return words.every(word => BIP39_WORDLIST.includes(word));
}

/**
 * Derive 32-byte seed from mnemonic using BIP39 spec
 */
export async function mnemonicToSeed(mnemonic: string, passphrase: string = ''): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  
  // Import mnemonic as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(mnemonic.normalize('NFKD')),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  
  // BIP39 spec: salt is "mnemonic" + optional passphrase
  const salt = encoder.encode('mnemonic' + passphrase);
  
  // Derive 512 bits (64 bytes) per BIP39
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

// ═══════════════════════════════════════════════════════════════
// FORK ARCHITECTURE - Password Splitting
// ═══════════════════════════════════════════════════════════════

/**
 * Fork password into auth_key and vault_key
 * Uses PBKDF2 for vault key (browser-compatible, production should use Argon2)
 */
export async function forkPassword(
  password: string, 
  authSalt: string, 
  vaultSalt: string
): Promise<{ authKey: string; vaultKey: Uint8Array }> {
  // FORK A: Auth Key (fast SHA256)
  const authDomain = AUTH_FORK_DOMAIN + authSalt;
  const authKey = await sha256(authDomain + password);
  
  // FORK B: Vault Key (PBKDF2 - high iterations for security)
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
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  
  return {
    authKey,
    vaultKey: new Uint8Array(vaultKeyBits)
  };
}

// ═══════════════════════════════════════════════════════════════
// VAULT ENCRYPTION (AES-256-GCM)
// ═══════════════════════════════════════════════════════════════

/**
 * Encrypt vault with AES-256-GCM
 */
export async function encryptVault(
  mnemonic: string, 
  vaultKey: Uint8Array, 
  vaultSalt: string
): Promise<{ ciphertext: string; nonce: string }> {
  const nonce = randomBytes(12);
  const encoder = new TextEncoder();
  const data = encoder.encode(mnemonic);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    vaultKey.buffer.slice(vaultKey.byteOffset, vaultKey.byteOffset + vaultKey.byteLength) as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const aad = encoder.encode(vaultSalt);
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer,
      additionalData: aad
    },
    cryptoKey,
    data
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertext)))),
    nonce: bytesToHex(nonce)
  };
}

/**
 * Decrypt vault with AES-256-GCM
 */
export async function decryptVault(
  ciphertext: string, 
  nonceHex: string, 
  vaultKey: Uint8Array, 
  vaultSalt: string
): Promise<string> {
  const nonce = hexToBytes(nonceHex);
  const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    vaultKey.buffer.slice(vaultKey.byteOffset, vaultKey.byteOffset + vaultKey.byteLength) as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const encoder = new TextEncoder();
  const aad = encoder.encode(vaultSalt);
  
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
// ADDRESS DERIVATION
// ═══════════════════════════════════════════════════════════════

/**
 * Derive L1 address from public key
 * Address = L1_ + SHA256(pubkey)[0..40].toUpperCase()
 */
export async function deriveL1Address(publicKey: Uint8Array): Promise<string> {
  const hash = await sha256(publicKey);
  return 'L1_' + hash.slice(0, 40).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════
// ED25519 OPERATIONS (using tweetnacl loaded globally)
// ═══════════════════════════════════════════════════════════════

declare global {
  interface Window {
    nacl?: {
      sign: {
        keyPair: {
          fromSeed: (seed: Uint8Array) => { publicKey: Uint8Array; secretKey: Uint8Array };
        };
        detached: (message: Uint8Array, secretKey: Uint8Array) => Uint8Array;
      };
    };
  }
}

/**
 * Get nacl library (loaded via script tag)
 */
function getNacl() {
  if (typeof window !== 'undefined' && window.nacl) {
    return window.nacl;
  }
  throw new Error('tweetnacl not loaded. Add: <script src="https://cdn.jsdelivr.net/npm/tweetnacl/nacl-fast.min.js"></script>');
}

/**
 * Create keypair from seed
 */
export function createKeyPair(seed: Uint8Array): { publicKey: Uint8Array; secretKey: Uint8Array } {
  const nacl = getNacl();
  return nacl.sign.keyPair.fromSeed(seed);
}

/**
 * Sign a message with Ed25519
 */
export function signMessage(message: Uint8Array, secretKey: Uint8Array): Uint8Array {
  const nacl = getNacl();
  return nacl.sign.detached(message, secretKey);
}

// ═══════════════════════════════════════════════════════════════
// CANONICAL SIGNING
// ═══════════════════════════════════════════════════════════════

/**
 * Create canonical payload hash for deterministic signing
 */
export async function createCanonicalPayloadHash(
  operationType: string, 
  fields: Record<string, unknown>
): Promise<string> {
  const schema = PAYLOAD_SCHEMAS[operationType];
  if (!schema) {
    throw new Error(`Unknown operation type: ${operationType}`);
  }
  
  const orderedValues = schema.map(key => {
    const value = fields[key];
    if (value === undefined) throw new Error(`Missing field: ${key}`);
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
  
  const canonical = orderedValues.join('|');
  return await sha256(canonical);
}

/**
 * Sign a transfer transaction using V1 format
 */
export async function signTransfer(
  secretKey: Uint8Array,
  publicKey: Uint8Array,
  from: string,
  to: string,
  amount: number
): Promise<{
  public_key: string;
  wallet_address: string;
  payload: string;
  timestamp: number;
  nonce: string;
  chain_id: number;
  schema_version: number;
  signature: string;
}> {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = generateNonce();
  
  // V1 Format: Raw JSON payload (NOT hashed)
  const payload = { to, amount };
  const payloadJson = JSON.stringify(payload);
  
  // Message: {payload}\n{timestamp}\n{nonce}
  const message = `${payloadJson}\n${timestamp}\n${nonce}`;
  
  console.log('🔐 V1 Signature Debug:');
  console.log('  From:', from);
  console.log('  To:', to);
  console.log('  Amount:', amount);
  console.log('  Payload JSON:', payloadJson);
  console.log('  Message:', message);
  console.log('  PublicKey (hex):', bytesToHex(publicKey));
  console.log('  SecretKey length:', secretKey.length);
  
  // Prepend chain_id byte (0x01 for L1)
  const chainIdByte = new Uint8Array([CHAIN_ID_L1]);
  const messageBytes = new TextEncoder().encode(message);
  const fullMessage = new Uint8Array(chainIdByte.length + messageBytes.length);
  fullMessage.set(chainIdByte);
  fullMessage.set(messageBytes, chainIdByte.length);
  
  console.log('  Full Message (with chain_id):', bytesToHex(fullMessage));
  
  // Sign with Ed25519
  const signature = signMessage(fullMessage, secretKey);
  
  const signedRequest = {
    public_key: bytesToHex(publicKey),
    wallet_address: from,
    payload: payloadJson,  // Raw JSON string
    timestamp,
    nonce,
    chain_id: CHAIN_ID_L1,
    schema_version: 1,  // V1 format
    signature: bytesToHex(signature)
  };
  
  console.log('  Public Key (hex):', signedRequest.public_key);
  console.log('  Signature (hex):', signedRequest.signature);
  console.log('  Full Request:', JSON.stringify(signedRequest, null, 2));
  
  return signedRequest;
}

// ═══════════════════════════════════════════════════════════════
// WALLET INTERFACES
// ═══════════════════════════════════════════════════════════════

export interface EncryptedVaultData {
  version: number;
  salt: string;
  ciphertext: string;
  nonce: string;
}

export interface WalletCreationResult {
  mnemonic: string;
  address: string;
  publicKey: string;
  encryptedVault: EncryptedVaultData;
  authKey: string;
  vaultKey: string;  // Hex-encoded vault key for session storage
  authSalt: string;
  vaultSalt: string;
}

export interface UnlockedWallet {
  address: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  mnemonic: string;
}

// ═══════════════════════════════════════════════════════════════
// WALLET OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new wallet with encrypted vault
 */
export async function createWallet(password: string, mnemonic?: string): Promise<WalletCreationResult> {
  // Generate or use provided mnemonic
  const actualMnemonic = mnemonic || await generateMnemonic();
  
  // Derive seed and keypair
  const seed = await mnemonicToSeed(actualMnemonic);
  const keyPair = createKeyPair(seed);
  
  // Derive L1 address
  const address = await deriveL1Address(keyPair.publicKey);
  
  // Generate salts
  const authSalt = bytesToHex(randomBytes(32));
  const vaultSalt = bytesToHex(randomBytes(32));
  
  // Fork password
  const { authKey, vaultKey } = await forkPassword(password, authSalt, vaultSalt);
  
  // Encrypt vault
  const { ciphertext, nonce } = await encryptVault(actualMnemonic, vaultKey, vaultSalt);
  
  return {
    mnemonic: actualMnemonic,
    address,
    publicKey: bytesToHex(keyPair.publicKey),
    encryptedVault: {
      version: 2,
      salt: vaultSalt,
      ciphertext,
      nonce
    },
    authKey,
    vaultKey: bytesToHex(vaultKey),  // Include vaultKey for session storage
    authSalt,
    vaultSalt
  };
}

/**
 * Unlock wallet from encrypted vault
 * Can unlock with password OR directly with vaultKey (for session-based auto-unlock)
 */
export async function unlockWallet(
  password: string,
  encryptedBlob: string,
  nonce: string,
  authSalt: string,
  vaultSalt: string,
  existingVaultKey?: Uint8Array
): Promise<UnlockedWallet> {
  // Use provided vaultKey or derive from password
  let vaultKey: Uint8Array;
  if (existingVaultKey) {
    vaultKey = existingVaultKey;
  } else {
    const derived = await forkPassword(password, authSalt, vaultSalt);
    vaultKey = derived.vaultKey;
  }
  
  // Decrypt vault
  const mnemonic = await decryptVault(encryptedBlob, nonce, vaultKey, vaultSalt);
  
  // Derive keypair
  const seed = await mnemonicToSeed(mnemonic);
  const keyPair = createKeyPair(seed);
  
  // Derive address
  const address = await deriveL1Address(keyPair.publicKey);
  
  return {
    address,
    publicKey: keyPair.publicKey,
    secretKey: keyPair.secretKey,
    mnemonic
  };
}

/**
 * Send a transfer transaction
 */
export async function sendTransfer(
  l1ApiUrl: string,
  wallet: UnlockedWallet,
  to: string,
  amount: number
): Promise<{ success: boolean; tx_id?: string; error?: string }> {
  console.log('📤 Sending transfer:', { from: wallet.address, to, amount });
  
  // Handle both secretKey (from unlocked wallet) and privateKey (from test accounts)
  let privateKey = (wallet as any).privateKey || wallet.secretKey;
  let publicKey = wallet.publicKey;
  
  // Convert hex strings to Uint8Array if needed
  if (typeof privateKey === 'string') {
    privateKey = hexToBytes(privateKey);
  }
  if (typeof publicKey === 'string') {
    publicKey = hexToBytes(publicKey);
  }
  
  // Ed25519 requires 64-byte secret key (32-byte seed + 32-byte public key)
  // If we only have the 32-byte seed, derive the proper keypair using nacl
  if (privateKey.length === 32) {
    const keyPair = nacl.sign.keyPair.fromSeed(privateKey);
    privateKey = keyPair.secretKey;
    // Verify the public key matches
    if (bytesToHex(keyPair.publicKey) !== bytesToHex(publicKey)) {
      console.warn('⚠️ Public key mismatch! Using derived public key from seed.');
      publicKey = keyPair.publicKey;
    }
  }
  
  const signedRequest = await signTransfer(
    privateKey,
    publicKey,
    wallet.address,
    to,
    amount
  );
  
  console.log('📡 Posting transfer via API proxy');
  
  // Use Next.js API proxy to avoid CORS issues
  const response = await fetch('/api/l1-proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      endpoint: '/transfer',
      method: 'POST',
      data: signedRequest
    })
  });
  
  const result = await response.json();
  console.log('📥 Transfer response:', result);
  
  return result;
}

/**
 * Get balance for an address
 */
export async function getBalance(l1ApiUrl: string, address: string): Promise<{ balance: number; pending?: number }> {
  // Use Next.js API proxy to avoid CORS issues
  const endpoint = `/balance/${address}`;
  const response = await fetch(`/api/l1-proxy?endpoint=${encodeURIComponent(endpoint)}`);
  return await response.json();
}

/**
 * Get transaction history for an address
 */
export async function getTransactionHistory(
  l1ApiUrl: string, 
  address: string, 
  limit: number = 20
): Promise<{ success: boolean; transactions: any[] }> {
  try {
    // Use Next.js API proxy to avoid CORS issues - encode the full endpoint with query params
    const endpoint = `/explorer/account/${address}/history?limit=${limit}`;
    const response = await fetch(`/api/l1-proxy?endpoint=${encodeURIComponent(endpoint)}`);
    return await response.json();
  } catch (error) {
    return { success: false, transactions: [] };
  }
}
