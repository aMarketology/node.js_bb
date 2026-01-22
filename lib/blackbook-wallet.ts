/**
 * BlackBook L1 Wallet SDK - TypeScript Browser Wrapper
 * 
 * WALLET UNLOCK FLOW:
 *   STEP 1: password + salt → encryption_key (PBKDF2, 100k iterations)
 *   STEP 2: encryption_key + vault_blob → seed (AES-256-GCM decrypt)
 *   STEP 3: seed → keypair (modern Ed25519 with @noble/ed25519)
 *   VERIFY: derived public_key === stored public_key → wallet unlocked!
 * 
 * SECURITY: Private keys are NEVER stored. They are derived on-demand
 * from the encrypted vault using the encryption key (derived from password).
 */

import { 
  createKeyPair as createEd25519KeyPair,
  signMessage as signEd25519Message,
  bytesToHex as utilBytesToHex,
  hexToBytes as utilHexToBytes
} from './signature-utils';
import { deriveL1Address, deriveL2Address } from './address-utils';

// Domain separation for auth key derivation
const AUTH_FORK_DOMAIN = "BB_AUTH:";
const VAULT_FORK_DOMAIN = "BB_VAULT:";

// Chain domain prefixes for signing
export const L1_DOMAIN_PREFIX = new Uint8Array([0x01]);
export const L2_DOMAIN_PREFIX = new Uint8Array([0x02]);
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
// PBKDF2 KEY DERIVATION
// ═══════════════════════════════════════════════════════════════

/**
 * Derive encryption key from password and salt using PBKDF2
 * STEP 1: password + salt → encryption_key
 * 
 * @param password - User's plaintext password
 * @param salt - Salt from user_vaults table (hex string)
 * @returns 32-byte encryption key for AES-256
 */
export async function deriveEncryptionKey(
  password: string, 
  salt: string
): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const passwordBytes = encoder.encode(password);
  const saltBytes = hexToBytes(salt);
  
  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBytes,
    'PBKDF2',
    false,
    ['deriveBits']
  );
  
  // PBKDF2 with 100,000 iterations (matches your spec)
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes.buffer.slice(saltBytes.byteOffset, saltBytes.byteOffset + saltBytes.byteLength) as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256 // 32 bytes for AES-256
  );
  
  return new Uint8Array(derivedBits);
}

/**
 * Fork password into auth_key and vault_key (encryption_key)
 * @deprecated Use deriveEncryptionKey for vault decryption
 * 
 * @param password - User's plaintext password
 * @param salt - Salt from profiles/user_vaults table (hex string)
 * @returns authKey (for Supabase) and vaultKey (for AES decryption)
 */
export async function forkPassword(
  password: string, 
  salt: string
): Promise<{ authKey: string; vaultKey: Uint8Array }> {
  // PATH A: Auth Key (fast SHA256) - used for Supabase auth
  const authInput = AUTH_FORK_DOMAIN + salt + password;
  const authKey = await sha256(authInput);
  
  // PATH B: Vault Key using PBKDF2 (100,000 iterations)
  const vaultKey = await deriveEncryptionKey(password, salt);
  
  return {
    authKey,
    vaultKey
  };
}

// ═══════════════════════════════════════════════════════════════
// VAULT ENCRYPTION (AES-256-GCM)
// ═══════════════════════════════════════════════════════════════

/**
 * Encrypt vault with AES-256-GCM
 * @param seed - 32-byte seed to encrypt (or JSON string for legacy)
 * @param encryptionKey - 32-byte AES key derived from PBKDF2
 * @returns Base64 ciphertext and hex nonce
 */
export async function encryptVault(
  seed: Uint8Array | string, 
  encryptionKey: Uint8Array
): Promise<{ ciphertext: string; nonce: string }> {
  const nonce = randomBytes(12);
  
  // Convert to bytes if string (legacy JSON format)
  let dataBytes: Uint8Array;
  if (typeof seed === 'string') {
    dataBytes = new TextEncoder().encode(seed);
  } else {
    dataBytes = seed;
  }
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encryptionKey.buffer.slice(encryptionKey.byteOffset, encryptionKey.byteOffset + encryptionKey.byteLength) as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  // No additional authenticated data - matches decryptVault
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer
    },
    cryptoKey,
    dataBytes.buffer.slice(dataBytes.byteOffset, dataBytes.byteOffset + dataBytes.byteLength) as ArrayBuffer
  );
  
  return {
    ciphertext: btoa(String.fromCharCode(...Array.from(new Uint8Array(ciphertext)))),
    nonce: bytesToHex(nonce)
  };
}

/**
 * Decrypt vault with AES-256-GCM
 * @param encryptedBlob - Base64 encoded ciphertext (includes auth tag)
 * @param nonceHex - Hex encoded nonce/IV (12 bytes)
 * @param vaultKey - 32-byte AES key derived from Argon2id
 * @returns Decrypted JSON string containing private_key
 */
export async function decryptVault(
  encryptedBlob: string, 
  nonceHex: string, 
  vaultKey: Uint8Array
): Promise<string> {
  // Decode base64 ciphertext
  const ciphertextBytes = Uint8Array.from(atob(encryptedBlob), c => c.charCodeAt(0));
  
  // Decode hex nonce
  const nonce = hexToBytes(nonceHex);
  
  // Import vault key for AES-GCM
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    vaultKey.buffer.slice(vaultKey.byteOffset, vaultKey.byteOffset + vaultKey.byteLength) as ArrayBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  // Decrypt (no additional authenticated data)
  const decrypted = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer
    },
    cryptoKey,
    ciphertextBytes
  );
  
  return new TextDecoder().decode(decrypted);
}

// ═══════════════════════════════════════════════════════════════
// ADDRESS DERIVATION
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// ED25519 OPERATIONS (using @noble/ed25519)
// ═══════════════════════════════════════════════════════════════

/**
 * Create keypair from seed using modern Ed25519 implementation
 * @param seed - 32-byte seed for key generation
 * @returns Object with publicKey and secretKey as Uint8Array
 */
export async function createKeyPair(seed: Uint8Array): Promise<{ publicKey: Uint8Array; secretKey: Uint8Array }> {
  const keyPair = await createEd25519KeyPair(seed);
  return {
    publicKey: utilHexToBytes(keyPair.publicKey),
    secretKey: utilHexToBytes(keyPair.privateKey)
  };
}

/**
 * Sign a message with Ed25519 using modern implementation
 * @param message - Message to sign
 * @param secretKey - Private key for signing
 * @returns Signature as Uint8Array
 */
export async function signMessage(message: Uint8Array, secretKey: Uint8Array): Promise<Uint8Array> {
  const secretKeyHex = utilBytesToHex(secretKey);
  const signatureHex = await signEd25519Message(message, secretKeyHex);
  return utilHexToBytes(signatureHex);
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
 * Sign a transfer transaction using V2 canonical format
 */
export async function signTransfer(
  secretKey: Uint8Array,
  publicKey: Uint8Array,
  from: string,
  to: string,
  amount: number
): Promise<{
  public_key: string;
  payload_hash: string;
  payload_fields: Record<string, any>;
  operation_type: string;
  schema_version: number;
  timestamp: number;
  nonce: string;
  chain_id: number;
  request_path: string;
  signature: string;
}> {
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = generateNonce();
  const operationType = 'transfer';
  const requestPath = '/transfer';
  
  // V2 Format: Canonical payload with ordered fields
  const payloadFields = { from, to, amount, timestamp, nonce };
  
  // Create canonical hash
  const payloadHash = await createCanonicalPayloadHash(operationType, payloadFields);
  
  // Construct signing message with domain separation
  // Server expects: BLACKBOOK_L{chain_id}{request_path} (no underscore between L1 and path)
  const domainPrefix = `BLACKBOOK_L${CHAIN_ID_L1}${requestPath}`;
  const message = `${domainPrefix}\n${payloadHash}\n${timestamp}\n${nonce}`;
  
  console.log('🔐 V2 Signature Debug:');
  console.log('  Operation:', operationType);
  console.log('  From:', from);
  console.log('  To:', to);
  console.log('  Amount:', amount);
  console.log('  Payload Fields:', payloadFields);
  console.log('  Payload Hash:', payloadHash);
  console.log('  Domain:', domainPrefix);
  console.log('  Message:', message);
  console.log('  PublicKey (hex):', bytesToHex(publicKey));
  
  // Sign with Ed25519
  const messageBytes = new TextEncoder().encode(message);
  const signature = await signMessage(messageBytes, secretKey);

  const signedRequest = {
    public_key: bytesToHex(publicKey),
    payload_hash: payloadHash,
    payload_fields: payloadFields,
    operation_type: operationType,
    schema_version: 2,  // V2 canonical format
    timestamp,
    nonce,
    chain_id: CHAIN_ID_L1,
    request_path: requestPath,
    signature: bytesToHex(signature)
  };
  
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

/**
 * UnlockedWallet - DEPRECATED
 * Use VaultSession + derivePrivateKeyOnDemand() instead
 * Private keys should NEVER be stored, only derived when needed
 */
export interface UnlockedWallet {
  address: string;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
  mnemonic: string;
}

/**
 * VaultSession - Secure wallet session (no private key stored)
 * Contains only the data needed to derive private keys on-demand
 */
export interface VaultSession {
  address: string;           // L1 wallet address
  publicKey: string;         // Public key (hex)
  encryptedBlob: string;     // Encrypted vault data (base64)
  nonce: string;             // AES-GCM nonce (hex)
  salt: string;              // Salt for key derivation (hex)
}

/**
 * Decrypted vault structure (from encrypted_blob)
 * Can be either:
 * - Raw 32-byte seed (binary)
 * - JSON with private_key field (legacy)
 */
export interface DecryptedVault {
  private_key: string;       // 64 hex chars (32 bytes seed)
  mnemonic?: string;         // Optional mnemonic phrase
}

/**
 * Derive encryption key using LEGACY SHA256 method (for old vaults)
 * This was the original method before PBKDF2 was implemented
 */
async function deriveLegacyEncryptionKey(password: string, salt: string): Promise<Uint8Array> {
  // Old method: SHA256(VAULT_FORK_DOMAIN + salt + password)
  const input = VAULT_FORK_DOMAIN + salt + password;
  const hashHex = await sha256(input);
  return hexToBytes(hashHex);
}

/**
 * Unlock wallet: Derive keypair from encrypted vault
 * 
 * STEP 1: password + salt → encryption_key (PBKDF2, 100k iterations)
 * STEP 2: encryption_key + vault_blob → seed (AES-256-GCM decrypt)
 * STEP 3: seed → keypair (modern Ed25519 with @noble/ed25519)
 * VERIFY: derived public_key === stored public_key
 * 
 * @param session - VaultSession with encrypted blob
 * @param password - User's password
 * @returns secretKey (64 bytes), publicKey (32 bytes) for signing
 */
export async function derivePrivateKeyOnDemand(
  session: VaultSession,
  password: string
): Promise<{ secretKey: Uint8Array; publicKey: Uint8Array; address: string }> {
  console.log('🔓 Unlocking wallet...');
  console.log('  Address:', session.address);
  console.log('  Salt:', session.salt?.substring(0, 16) + '...');
  console.log('  Nonce:', session.nonce?.substring(0, 16) + '...');
  
  // Try PBKDF2 first, then fallback to legacy SHA256 method
  let seed: Uint8Array | null = null;
  let usedLegacy = false;
  
  // Decode ciphertext and nonce once
  const ciphertextBytes = Uint8Array.from(atob(session.encryptedBlob), c => c.charCodeAt(0));
  const nonce = hexToBytes(session.nonce);
  
  // Helper function to attempt decryption with a given key
  async function tryDecrypt(encryptionKey: Uint8Array, methodName: string): Promise<Uint8Array | null> {
    try {
      console.log(`  Trying ${methodName}...`);
      
      // Import encryption key for AES-GCM
      const cryptoKey = await crypto.subtle.importKey(
        'raw',
        encryptionKey.buffer.slice(encryptionKey.byteOffset, encryptionKey.byteOffset + encryptionKey.byteLength) as ArrayBuffer,
        { name: 'AES-GCM' },
        false,
        ['decrypt']
      );
      
      // Decrypt
      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: nonce.buffer.slice(nonce.byteOffset, nonce.byteOffset + nonce.byteLength) as ArrayBuffer
        },
        cryptoKey,
        ciphertextBytes.buffer.slice(ciphertextBytes.byteOffset, ciphertextBytes.byteOffset + ciphertextBytes.byteLength) as ArrayBuffer
      );
      
      const decryptedBytes = new Uint8Array(decrypted);
      
      // Check if it's raw 32-byte seed or JSON
      if (decryptedBytes.length === 32) {
        console.log(`  ✓ ${methodName} succeeded (32 bytes raw)`);
        return decryptedBytes;
      } else {
        // Try parsing as JSON (legacy format)
        const decryptedStr = new TextDecoder().decode(decryptedBytes);
        try {
          const vault: DecryptedVault = JSON.parse(decryptedStr);
          console.log(`  ✓ ${methodName} succeeded (from JSON private_key)`);
          return hexToBytes(vault.private_key);
        } catch {
          // Maybe it's hex-encoded seed?
          if (decryptedStr.length === 64 && /^[0-9a-fA-F]+$/.test(decryptedStr)) {
            console.log(`  ✓ ${methodName} succeeded (hex string)`);
            return hexToBytes(decryptedStr);
          } else {
            console.log(`  ✗ ${methodName} failed: Unknown vault format`);
            return null;
          }
        }
      }
    } catch (error) {
      console.log(`  ✗ ${methodName} failed:`, error instanceof Error ? error.message : 'OperationError');
      return null;
    }
  }
  
  // STEP 1a: Try PBKDF2 method first (new method)
  console.log('  STEP 1: Deriving encryption key with PBKDF2...');
  const pbkdf2Key = await deriveEncryptionKey(password, session.salt);
  seed = await tryDecrypt(pbkdf2Key, 'PBKDF2');
  
  // STEP 1b: If PBKDF2 failed, try legacy SHA256 method
  if (!seed) {
    console.log('  STEP 1b: Trying legacy SHA256 key derivation...');
    const legacyKey = await deriveLegacyEncryptionKey(password, session.salt);
    seed = await tryDecrypt(legacyKey, 'Legacy SHA256');
    usedLegacy = true;
  }
  
  if (!seed) {
    throw new Error('Failed to decrypt vault. Wrong password?');
  }
  
  if (usedLegacy) {
    console.log('  ⚠️ Vault uses legacy encryption - consider migrating to PBKDF2');
  }
  
  // STEP 3: seed → keypair
  console.log('  STEP 3: Deriving keypair from seed...');
  const keyPair = await createKeyPair(seed);
  console.log('  ✓ keypair.publicKey derived');
  console.log('  ✓ keypair.secretKey derived (NEVER share)');
  
  // Derive address from public key
  const address = deriveL1Address(keyPair.publicKey);
  
  // VERIFY: derived public_key === stored public_key
  const derivedPubKeyHex = bytesToHex(keyPair.publicKey);
  console.log('  VERIFY: derived public_key === stored public_key?');
  console.log('    Derived:', derivedPubKeyHex.substring(0, 16) + '...');
  console.log('    Stored: ', session.publicKey?.substring(0, 16) + '...');
  
  if (session.publicKey && derivedPubKeyHex.toLowerCase() !== session.publicKey.toLowerCase()) {
    console.error('  ✗ Public key mismatch! Wallet unlock failed.');
    throw new Error('Public key mismatch. Wrong password or corrupted vault.');
  }
  console.log('  ✓ YES - wallet unlocked!');
  
  return {
    secretKey: keyPair.secretKey,  // 64 bytes (seed + pubkey)
    publicKey: keyPair.publicKey,  // 32 bytes
    address
  };
}

/**
 * Create vault session from Supabase profile data
 * This should be called after user login to set up the session
 * 
 * @param profileData - Data from profiles + user_vaults tables
 */
export function createVaultSession(
  address: string,
  publicKey: string,
  encryptedBlob: string,
  nonce: string,
  salt: string
): VaultSession {
  return {
    address,
    publicKey,
    encryptedBlob,
    nonce,
    salt
  };
}

/**
 * Sign a blockchain request using on-demand key derivation
 * Private key is derived, used for signing, then cleared from memory
 * 
 * @param session - VaultSession from Supabase data
 * @param password - User's password
 * @param payload - The payload to sign
 * @param chainId - 1 for L1, 2 for L2
 */
export async function signRequestSecure(
  session: VaultSession,
  password: string,
  payload: object,
  chainId: number = 1
): Promise<{ payload: object; signature: string; public_key: string }> {
  // Derive private key on-demand
  const { secretKey, publicKey } = await derivePrivateKeyOnDemand(session, password);
  
  try {
    // Serialize payload
    const message = JSON.stringify(payload);
    const messageBytes = new TextEncoder().encode(message);
    
    // Domain separation: prepend chain ID
    const domainPrefix = chainId === 1 ? L1_DOMAIN_PREFIX : L2_DOMAIN_PREFIX;
    const fullMessage = new Uint8Array([...domainPrefix, ...messageBytes]);
    
    // Sign with Ed25519
    const signature = await signMessage(fullMessage, secretKey);
    
    return {
      payload,
      signature: bytesToHex(signature),
      public_key: bytesToHex(publicKey)
    };
  } finally {
    // Clear sensitive data from memory (best effort)
    secretKey.fill(0);
  }
}

// ═══════════════════════════════════════════════════════════════
// WALLET OPERATIONS
// ═══════════════════════════════════════════════════════════════

/**
 * Create a new wallet with encrypted vault
 * Uses Argon2id for vault key derivation
 */
export async function createWallet(password: string, mnemonic?: string): Promise<WalletCreationResult> {
  // Generate or use provided mnemonic
  const actualMnemonic = mnemonic || await generateMnemonic();
  
  // Derive seed and keypair
  const seed = await mnemonicToSeed(actualMnemonic);
  const keyPair = await createKeyPair(seed);
  
  // Derive L1 address
  const address = deriveL1Address(keyPair.publicKey);
  
  // Generate salt (single salt used for both auth and vault)
  const salt = bytesToHex(randomBytes(32));
  
  // Derive encryption key using PBKDF2
  const encryptionKey = await deriveEncryptionKey(password, salt);
  
  // Get auth key (for Supabase login)
  const { authKey } = await forkPassword(password, salt);
  
  // Create vault data containing private key (not mnemonic for simpler decryption)
  const vaultData = JSON.stringify({
    private_key: bytesToHex(seed),  // 32-byte seed as hex
    mnemonic: actualMnemonic        // Optional: include mnemonic for backup
  });
  
  // Encrypt vault with PBKDF2-derived key
  const { ciphertext, nonce } = await encryptVault(vaultData, encryptionKey);
  
  return {
    mnemonic: actualMnemonic,
    address,
    publicKey: bytesToHex(keyPair.publicKey),
    encryptedVault: {
      version: 2,
      salt: salt,
      ciphertext,
      nonce
    },
    authKey,
    vaultKey: bytesToHex(encryptionKey),  // Include encryption key for session storage
    authSalt: salt,
    vaultSalt: salt
  };
}

/**
 * Unlock wallet from encrypted vault (LEGACY - for test accounts)
 * For user wallets, use derivePrivateKeyOnDemand() instead
 * 
 * @deprecated Use derivePrivateKeyOnDemand for production
 */
export async function unlockWallet(
  password: string,
  encryptedBlob: string,
  nonce: string,
  salt: string,
  existingVaultKey?: Uint8Array
): Promise<UnlockedWallet> {
  // Use provided vaultKey or derive from password
  let vaultKey: Uint8Array;
  if (existingVaultKey) {
    vaultKey = existingVaultKey;
  } else {
    const derived = await forkPassword(password, salt);
    vaultKey = derived.vaultKey;
  }
  
  // Decrypt vault
  const decryptedJson = await decryptVault(encryptedBlob, nonce, vaultKey);
  
  // Parse decrypted data - could be JSON or raw mnemonic
  let privateKeySeed: Uint8Array;
  let mnemonic: string;
  
  try {
    const vault = JSON.parse(decryptedJson);
    privateKeySeed = hexToBytes(vault.private_key);
    mnemonic = vault.mnemonic || '';
  } catch {
    // Legacy format: decrypted data is raw mnemonic
    mnemonic = decryptedJson;
    const seed = await mnemonicToSeed(mnemonic);
    privateKeySeed = seed;
  }
  
  // Derive keypair
  const keyPair = await createKeyPair(privateKeySeed);
  
  // Derive address
  const address = deriveL1Address(keyPair.publicKey);
  
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
  // If we only have the 32-byte seed, derive the proper keypair using modern Ed25519
  if (privateKey.length === 32) {
    const keyPair = await createKeyPair(privateKey);
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
 * Send a transfer transaction using on-demand key derivation (SECURE)
 * Private key is derived, used for signing, and immediately discarded
 * 
 * @param session - VaultSession with encrypted vault data
 * @param password - User's password for key derivation
 * @param to - Recipient address
 * @param amount - Amount to send
 */
export async function sendTransferSecure(
  session: VaultSession,
  password: string,
  to: string,
  amount: number
): Promise<{ success: boolean; tx_id?: string; error?: string }> {
  console.log('📤 Sending secure transfer:', { from: session.address, to, amount });
  
  // Derive private key on-demand
  const { secretKey, publicKey, address } = await derivePrivateKeyOnDemand(session, password);
  
  try {
    const signedRequest = await signTransfer(
      secretKey,
      publicKey,
      address,
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
  } finally {
    // Clear sensitive data from memory (best effort)
    secretKey.fill(0);
  }
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
