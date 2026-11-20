const https = require('https');

const RESPONSE_SCHEMA = {
  type:'object',properties:{dishes:{type:'array',items:{type:'object',
    properties:{
      dishName:{type:'string'},originalName:{type:'string'},category:{type:'string'},price:{type:'string'},
      ingredients:{type:'array',items:{type:'object',properties:{englishName:{type:'string'},displayName:{type:'string'},eu14Allergens:{type:'array',items:{type:'object',properties:{allergen:{type:'string'},confidence:{type:'number'}},required:['allergen','confidence']}}},required:['englishName','displayName','eu14Allergens']}},
      dietaryType:{type:'string'},dietaryExplanation:{type:'string'},allergenSummary:{type:'string'},
      nutritionEstimate:{type:'object',properties:{calories:{type:'number'},proteinG:{type:'number'},fatG:{type:'number'},carbsG:{type:'number'}}},
      sourceImageUrl:{type:'string'},confidence:{type:'number'},needsReview:{type:'boolean'}
    },required:['dishName','originalName','ingredients','dietaryType','dietaryExplanation','allergenSummary','nutritionEstimate','sourceImageUrl','confidence','needsReview']}
  }},required:['dishes']};

var SI=`You are an expert EU-14 allergen extraction AI. Analyze the provided restaurant menu image.
Extract EVERY SINGLE DISH listed on the menu.
For each dish, return a JSON object with a 'dishes' array containing:
- dishName: string (translated to English)
- originalName: string
- category: string or null
- price: string or null
- ingredients: array of objects with 'englishName', 'displayName', and 'eu14Allergens' (array of {allergen, confidence})
- dietaryType: 'vegan', 'vegetarian', 'pescetarian', or 'other'
- allergenSummary: string
- confidence: number between 0 and 1

Scan the menu for any dates indicating when this menu is valid (e.g., 'Summer 2026', 'Valid from May 1'). Add a top-level field to your JSON output called 'menuEffectiveDate' containing this string, or null if no date is found.

Do not skip dishes. Do not invent dishes. If an allergen is likely but not certain, assign a confidence score below 0.8.`;

function callApi(k,ct,m){return new Promise((ok,no)=>{var d=JSON.stringify({contents:[{parts:ct}],generationConfig:{responseMimeType:'application/json',responseSchema:RESPONSE_SCHEMA},systemInstruction:{parts:[{text:SI}]}});var o={hostname:'generativelanguage.googleapis.com',port:443,path:'/v1beta/models/'+m+':generateContent?key='+encodeURIComponent(k),method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}};var r=https.request(o,function(res){var b='';res.on('data',function(c){b+=c});res.on('end',function(){if(res.statusCode>=400){console.error('[gem] HTTP',res.statusCode,':',b);no(new Error('API error '+res.statusCode))}else try{ok(JSON.parse(b))}catch(e){no(new Error('Invalid JSON'))}})});r.on('error',no);r.write(d);r.end();})}
async function genBackoff(k,c,m,a){a=a||0;try{return await callApi(k,c,m)}catch(err){var m2=err.message||'';var rl=/429/i.test(m2);var tr=/5\\d{2}/.test(m2)||/transient/i.test(m2);if((rl||tr)&&a<4){await new Promise(function(x){setTimeout(x,1000*Math.pow(2,a)+Math.random()*1000)});return genBackoff(k,c,m,a+1)}throw err}}

async function extractDishes(opts){
  opts=opts||{};
  if(!opts.geminiApiKey) throw new Error('geminiApiKey is required');
  var images=opts.images||[];
  var ct=images.map(function(i){if(i.inlineData)return{inlineData:{data:i.inlineData.data,mimeType:i.inlineData.mimeType}};if(i.buffer)return{inlineData:{data:i.buffer.toString('base64'),mimeType:i.mimeType||'image/jpeg'}};return{fileData:{fileUri:i.url}}});

  var resp;
  try{resp=await genBackoff(opts.geminiApiKey,ct,'gemini-3.8-flash')}catch(e1){
    console.warn('[gem] flash failed, retry lite...');
    try{resp=await genBackoff(opts.geminiApiKey,ct,'gemini-3.5-flash')}catch(e2){throw e2}
  }

  var cc=(resp&&resp.candidates)||[];
  if(cc.length===0){console.warn('[gem] no candidates');return[]}

  var text=(cc[0]&&cc[0].content&&cc[0].content.parts&&cc[0].content.parts[0]&&cc[0].content.parts[0].text)||'';
  var parsed;
  try{parsed=JSON.parse(text)}catch(e3){
    console.warn('[gem] parse fail, retrying...');
    try{var rr=await genBackoff(opts.geminiApiKey,ct,'gemini-2.5-pro');var rt=(rr&&rr.candidates&&rr.candidates[0]&&rr.candidates[0].content&&rr.candidates[0].content.parts&&rr.candidates[0].content.parts[0]&&rr.candidates[0].content.parts[0].text)||'{}';parsed=JSON.parse(rt)}catch(e4){throw new Error('Gemini parse failed after retries')}
  }

  var arr=parsed.dishes||[parsed];
  return {dishes:arr.map(function(d){
    var conf=typeof d.confidence==='number'?d.confidence:0.8;
    return{
      dishName:d.dishName||'',originalName:d.originalName||d.dishName||'',
      category:d.category||null,price:d.price||null,
      ingredients:(d.ingredients||[]).map(function(g){return{englishName:g.englishName||'',displayName:g.displayName||g.englishName||'',eu14Allergens:Array.isArray(g.eu14Allergens)?g.eu14Allergens.map(function(a){return{allergen:a.allergen,confidence:a.confidence||0.8}}):[]}}),
      dietaryType:d.dietaryType||'other',dietaryExplanation:d.dietaryExplanation||'',
      allergenSummary:d.allergenSummary||'',
      nutritionEstimate:d.nutritionEstimate||{calories:null,proteinG:null,fatG:null,carbsG:null},
      sourceImageUrl:d.sourceImageUrl||'',
      confidence:conf,needsReview:conf<0.6
    };
  })};
}

module.exports={extractDishes};