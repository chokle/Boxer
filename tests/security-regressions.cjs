const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{EventEmitter}=require('node:events');
const root=path.resolve(__dirname, '..');
const ts=require(root+'/node_modules/typescript');
const checks=[];
function load(file,stubs={},globals={}){const module={exports:{}};const js=ts.transpileModule(fs.readFileSync(root+'/'+file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.React,esModuleInterop:true}}).outputText;vm.runInNewContext(js,{module,exports:module.exports,require:n=>{if(n in stubs)return stubs[n];if(n.startsWith('node:'))return require(n);throw Error('Unstubbed '+n)},process:{env:{}},console,Date,Map,URL,setTimeout,clearTimeout,...globals},{filename:file,timeout:3000});return module.exports;}
function response(){return Object.assign(new EventEmitter(),{locals:{},code:200,status(n){this.code=n;return this},json(v){this.value=v;this.emit('finish');return this},setHeader(){},writeHead(n){this.code=n},end(v){this.value=v}})}
function note(name){checks.push({name,passed:true})}
(async()=>{
 const {isTrustedVerdict,PACKAGE_NAME}=load('artifacts/api-server/src/lib/play-integrity.ts',{'google-auth-library':{GoogleAuth:class{}}});
 const raw='{"title":"session"}',now=Date.now();
 const trusted={requestDetails:{requestPackageName:PACKAGE_NAME,requestHash:crypto.createHash('sha256').update(raw).digest('hex'),timestampMillis:String(now)},appIntegrity:{appRecognitionVerdict:'PLAY_RECOGNIZED',packageName:PACKAGE_NAME,certificateSha256Digest:['cert']},accountDetails:{appLicensingVerdict:'LICENSED'},deviceIntegrity:{deviceRecognitionVerdict:['MEETS_DEVICE_INTEGRITY']}};
 assert.equal(isTrustedVerdict(trusted,raw,['cert'],now),true);
 for(const [name,change] of [['body substitution',v=>v.requestDetails.requestHash='bad'],['wrong package',v=>v.requestDetails.requestPackageName='evil'],['stale token',v=>v.requestDetails.timestampMillis=String(now-121000)],['future token',v=>v.requestDetails.timestampMillis=String(now+11000)],['unsigned app',v=>v.appIntegrity.appRecognitionVerdict='UNRECOGNIZED_VERSION'],['wrong signer',v=>v.appIntegrity.certificateSha256Digest=['other']],['unlicensed install',v=>v.accountDetails.appLicensingVerdict='UNLICENSED'],['untrusted device',v=>v.deviceIntegrity.deviceRecognitionVerdict=[]]]){const v=structuredClone(trusted);change(v);assert.equal(isTrustedVerdict(v,raw,['cert'],now),false);note('Integrity rejects '+name)}
 assert.equal(isTrustedVerdict(trusted,raw,[],now),false);note('Integrity requires configured signing certificate');
 const {validateAnalysis}=load('artifacts/api-server/src/lib/analysis-input.ts');
 const valid={title:'Session',match_context:'training',opponent_style:'balanced',match_description:'Guard practice',boxer_profile:{stance:'Orthodox',experience_level:'Intermediate',weight_class:'Middleweight'}};
 let next=0;validateAnalysis({body:valid},response(),()=>next++);assert.equal(next,1);
 for(const [name,change] of [['video flag',v=>v.has_video=true],['injury transfer',v=>v.boxer_profile.injuries=[]],['name transfer',v=>v.boxer_profile.name='Private'],['oversize notes',v=>v.match_description='x'.repeat(5001)],['remote image URL',v=>v.images=['https://evil.example/image']],['oversize image',v=>v.images=['/9j/'+'A'.repeat(500000)]],['no evidence',v=>v.match_description='']]){const v=structuredClone(valid);change(v);const r=response();validateAnalysis({body:v},r,()=>assert.fail('admitted '+name));assert.equal(r.code,400);note('Input rejects '+name)}
 const env={};let dbCalls=0;const queries=[];let replay=1,quota=1;
 const client={query:async(sql)=>{queries.push(sql);return {rowCount:sql.startsWith('INSERT INTO boxer_ai_used_tokens')?replay:sql.startsWith('INSERT INTO boxer_ai_daily_budget')?quota:1}},release(){}};
 const admission=load('artifacts/api-server/src/lib/analysis-admission.ts',{'@workspace/db':{pool:{connect:async()=>{dbCalls++;return client}}},'./play-integrity':{verifyIntegrityToken:async(t)=>t==='valid'}},{process:{env}});
 const req={get:()=>undefined,ip:'127.0.0.1',socket:{},log:{warn(){}}};let r=response();await admission.admitAnalysis(req,r,()=>assert.fail('unconfigured'));assert.equal(r.code,503);assert.equal(dbCalls,0);note('Unconfigured AI fails closed before database/provider');
 env.PLAY_SIGNING_CERTIFICATE_SHA256='cert';env.BOXER_AI_ENABLED='true';r=response();r.locals.rawAnalysisBody=raw;await admission.admitAnalysis(req,r,()=>assert.fail('anonymous'));assert.equal(r.code,401);assert.equal(dbCalls,0);note('Anonymous AI rejected');
 req.get=()=> 'invalid';r=response();r.locals.rawAnalysisBody=raw;await admission.admitAnalysis(req,r,()=>assert.fail('bad token'));assert.equal(r.code,403);note('Invalid token rejected');
 req.get=()=> 'valid';r=response();r.locals.rawAnalysisBody=raw;next=0;await admission.admitAnalysis(req,r,()=>next++);assert.equal(next,1);assert(queries.includes('COMMIT'));note('Verified request atomically consumes persistent budget');
 replay=0;r=response();r.locals.rawAnalysisBody=raw;await admission.admitAnalysis(req,r,()=>assert.fail('replay'));assert.equal(r.code,409);note('Replay rejected');
 replay=1;quota=0;r=response();r.locals.rawAnalysisBody=raw;await admission.admitAnalysis(req,r,()=>assert.fail('budget'));assert.equal(r.code,429);note('Exhausted daily budget rejected');
 let allowed=0;for(let i=0;i<6;i++){r=response();admission.analysisRateLimit(req,r,()=>{allowed++;r.emit('finish')});if(i===5)assert.equal(r.code,429)}assert.equal(allowed,5);note('Repeated requests rate limited before verification');
 const routes=[];const router={post:(route,...handlers)=>routes.push({route,handlers}),get(){}};
 load('artifacts/api-server/src/routes/community.ts',{'express':{Router:()=>router},'@workspace/db':{db:{insert(){assert.fail('public write')}}},'drizzle-orm':{}});
 for(const route of routes){r=response();await route.handlers[0]({body:{rankAmateur:1}},r);assert.equal(r.code,405)}assert.equal(routes.length,3);note('All three public publication endpoints denied without database write');
 let listener;load('artifacts/mobile/server/serve.js',{'http':{createServer:fn=>{listener=fn;return {listen(){}}}},'fs':{readFileSync:f=>String(f).endsWith('app.json')?'{}':'fixture',existsSync:()=>false},'path':path},{__dirname:root+'/artifacts/mobile/server'});
 for(const host of ['[','<script>','valid.test/evil']){r=response();listener({url:'/',headers:{host}},r);assert.equal(r.code,400)}note('Malformed Host returns 400 without crashing');
 const config=JSON.parse(fs.readFileSync(root+'/artifacts/mobile/app.json'));assert.equal(config.expo.android.allowBackup,false);for(const p of ['RECORD_AUDIO','ACCESS_FINE_LOCATION','CAMERA','READ_MEDIA_IMAGES','READ_MEDIA_VIDEO'])assert(config.expo.android.blockedPermissions.includes('android.permission.'+p));note('Backup and unused permission exclusions configured');
 assert(fs.existsSync(root+'/artifacts/mobile/assets/sounds/bell.wav'));note('Timer sound asset resolves');
 const validateResponse=load('artifacts/mobile/lib/validateAnalysis.ts');
 const analysis={drills:[],key_strengths:[],improvement_areas:[],punches_thrown:20,punches_landed:10};
 for(const k of ['overall_score','stance_score','offense_score','defense_score','footwork_score','combination_score','shot_accuracy'])analysis[k]=70;
 for(const k of ['stance_feedback','offense_feedback','defense_feedback','footwork_feedback','combination_feedback','tactical_summary'])analysis[k]='Review';
 assert(validateResponse.isPerformanceAnalysis(analysis));
 assert.equal(validateResponse.isPerformanceAnalysis({...analysis,overall_score:Infinity}),false);
 assert.equal(validateResponse.isPerformanceAnalysis({...analysis,drills:[{category:'bad'}]}),false);note('Malformed AI output rejected before persistence');
 let capturedBody,verifiedBody;
 const coach=load('artifacts/mobile/lib/aiCoach.ts',{'./appIntegrity':{getIntegrityToken:async body=>{verifiedBody=body;return 'fixture-token'}},'./validateAnalysis':validateResponse},{AbortController,fetch:async(_url,options)=>{capturedBody=options.body;return {ok:true,json:async()=>({success:true,analysis})}},process:{env:{EXPO_PUBLIC_DOMAIN:'fixture.invalid'}}});
 await coach.analyzeMatch({...valid,description:'Local only',boxer_profile:{...valid.boxer_profile,name:'Private name',age:45,injuries:[{notes:'private injury'}],height_cm:180,weight_kg:70}});
 assert.equal(capturedBody,verifiedBody);const sent=JSON.parse(capturedBody);assert.deepEqual(Object.keys(sent.boxer_profile).sort(),['experience_level','stance','weight_class']);assert(!capturedBody.includes('Private name'));assert(!capturedBody.includes('private injury'));note('Only minimal profile sent; attestation binds exact submitted bytes');
 const states=[];const operations=[];let effect;
 const react={createContext:()=>({Provider:'Provider'}),useContext:()=>null,useState:initial=>{const index=states.length;states.push(initial);return [initial,value=>{states[index]=typeof value==='function'?value(states[index]):value}]},useEffect:fn=>{effect=fn},useRef:current=>({current}),useCallback:fn=>fn,createElement:(_type,props)=>props};
 const storage={getItem:async()=>null,setItem:async(key,value)=>{operations.push(['write',key,value])},multiRemove:async(keys)=>{operations.push(['remove',keys])}};
 const context=load('artifacts/mobile/context/BoxingContext.tsx',{'react':react,'@react-native-async-storage/async-storage':storage});
 const provided=context.BoxingProvider({children:null}).value;
 await Promise.all([provided.saveProfile({name:'fixture'}),provided.clearLocalData()]);
 assert.equal(operations[0][0],'write');assert.equal(operations.at(-1)[0],'remove');assert.equal(states[0],null);assert.equal(states[1].length,0);assert.equal(states[2].length,0);note('Local deletion waits for prior writes and clears all three data stores');
 console.log(JSON.stringify({checks,realProviderCalls:0,realDatabaseWrites:0,networkRequests:0},null,2));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
