// Part 1: schema + API layer
const fs = require('fs');
var p = require('path').join(__dirname, 'geminiClient.js');
var c = [
"const https = require('https');",
"",
"const RESPONSE_SCHEMA = {",
"  type:'object',properties:{dishes:{type:'array',items:{type:'object',",
"    properties:{",
"      dishName:{type:'string'},originalName:{type:'string'},category:{type:'string'},price:{type:'string'},",
"      ingredients:{type:'array',items:{type:'object',properties:{englishName:{type:'string'},displayName:{type:'string'},eu14Allergens:{type:'array',items:{type:'object',properties:{allergen:{type:'string'},confidence:{type:'number'}},required:['allergen','confidence']}}},required:['englishName','displayName','eu14Allergens']}},",
"      dietaryType:{type:'string'},dietaryExplanation:{type:'string'},allergenSummary:{type:'string'},",
"      nutritionEstimate:{type:'object',properties:{calories:{type:'number'},proteinG:{type:'number'},fatG:{type:'number'},carbsG:{type:'number'}}},",
"      sourceImageUrl:{type:'string'},confidence:{type:'number'},needsReview:{type:'boolean'}",
"    },required:['dishName','originalName','ingredients','dietaryType','dietaryExplanation','allergenSummary','nutritionEstimate','sourceImageUrl','confidence','needsReview']}",
"  }},required:['dishes']};",
"",
"var SI=`You are an EU-14 allergen extraction expert for restaurant menus. Extract ALL dishes. Return JSON with a \"dishes\" array.`;",
"",
"function callApi(k,ct,m){return new Promise((ok,no)=>{var d=JSON.stringify({contents:[{parts:ct}],generationConfig:{responseMimeType:'application/json',responseSchema:RESPONSE_SCHEMA},systemInstruction:{parts:[{text:SI}]}});var o={hostname:'generativelanguage.googleapis.com',port:443,path:'/v1beta/models/'+m+':generateContent?key='+encodeURIComponent(k),method:'POST',headers:{'Content-Type':'application/json','Content-Length':Buffer.byteLength(d)}};var r=https.request(o,function(res){var b='';res.on('data',function(c){b+=c});res.on('end',function(){if(res.statusCode>=400)no(new Error('API error '+res.statusCode));else try{ok(JSON.parse(b))}catch(e){no(new Error('Invalid JSON'))}})});r.on('error',no);r.write(d);r.end();})}"
];
fs.writeFileSync(p, c.join('\n'));
console.log('Part 1: wrote ' + c.join('\n').length + ' bytes');
