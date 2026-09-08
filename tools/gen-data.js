const fs=require('fs'),path=require('path');
const dir=process.cwd();
global.window={};
function run(f){ eval(fs.readFileSync(path.join(dir,f),'utf8')); }
run('assets/js/store.js'); run('assets/js/library.js');
const LO=global.window.LO;
// blank state shape, dates stripped, as the canonical schema mirror
const blank=JSON.parse(LO.store.export());
blank.meta={schema:1,created:"YYYY-MM-DD",lastOpen:"YYYY-MM-DD",opens:0,streak:0};
fs.writeFileSync('data/schema.json',JSON.stringify(blank,null,2));
fs.writeFileSync('data/drills.json',JSON.stringify(LO.lib.drills,null,2));
fs.writeFileSync('data/prompts.json',JSON.stringify(LO.lib.prompts,null,2));
fs.writeFileSync('data/taxonomy.json',JSON.stringify({domains:LO.lib.domains,horizons:LO.lib.horizons,traits:LO.lib.traits,valueWords:LO.lib.valueWords},null,2));
console.log('drills',LO.lib.drills.length,'prompts',LO.lib.prompts.length,'traits',LO.lib.traits.length);
