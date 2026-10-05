const {spawn}=require('node:child_process');
const net=require('node:net'),assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname, '../artifacts/api-server');
const pause=ms=>new Promise(r=>setTimeout(r,ms));
const valid={title:'Local fixture',match_context:'training',opponent_style:'balanced',match_description:'Guard practice',boxer_profile:{stance:'Orthodox',experience_level:'Intermediate',weight_class:'Middleweight'}};
(async()=>{
 const allocator=net.createServer();await new Promise(r=>allocator.listen(0,'127.0.0.1',r));const port=allocator.address().port;await new Promise(r=>allocator.close(r));
 const child=spawn(process.execPath,['dist/index.mjs'],{cwd:root,windowsHide:true,env:{...process.env,NODE_ENV:'production',PORT:String(port),DATABASE_URL:'postgres://fixture:fixture@127.0.0.1:9/fixture',OPENAI_API_KEY:'fixture-no-real-provider-key',BOXER_AI_ENABLED:'true',PLAY_SIGNING_CERTIFICATE_SHA256:'fixture-certificate'},stdio:['ignore','pipe','pipe']});
 let errors='';child.stderr.on('data',b=>errors+=b);child.stdout.resume();
 try {
   let ready=false;
   for(let i=0;i<40;i++){
    if(child.exitCode!==null)throw Error('API exited: '+errors.slice(-1000));
    try {const r=await fetch(`http://127.0.0.1:${port}/api/healthz`,{signal:AbortSignal.timeout(500)});if(r.ok){ready=true;break}}catch{}
    await pause(250);
   }
   assert(ready,'API ready within 10 seconds');
   const results=[];
   async function post(route,body,status){const r=await fetch(`http://127.0.0.1:${port}${route}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(3000)});assert.equal(r.status,status);results.push({route,status:r.status});}
   await post('/api/analyze',valid,401);
   await post('/api/analyze',{...valid,has_video:true},400);
   for(const resource of ['gyms','fighters','tournaments'])await post('/api/community/'+resource,{name:'Must not persist',rankAmateur:1},405);
   const policy=await fetch(`http://127.0.0.1:${port}/api/privacy`);assert.equal(policy.status,200);assert((await policy.text()).includes('not ready for release'));results.push({route:'/api/privacy',status:200,publisherSetupStillRequired:true});
   console.log(JSON.stringify({mode:'Actual compiled Express API over local HTTP; invalid DB port and fake provider key, no paid operations',checks:results},null,2));
 } finally {child.kill();await new Promise(r=>{if(child.exitCode!==null)r();else child.once('exit',r)});}
})().catch(e=>{console.error(e.stack);process.exitCode=1});
