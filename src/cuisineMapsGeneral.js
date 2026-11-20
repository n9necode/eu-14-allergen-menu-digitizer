'use strict';

/**
 * General (English-language) EU-14 allergen keyword map.
 * Format: { a: allergen key, c: base confidence, k: keywords (lowercase, substring match) }
 * Layered under every cuisine map.
 */
module.exports = {
  entries: [
    { a: 'gluten', c: 0.95, k: ['wheat','flour','bread','crumb','panko','couscous','semolina','bulgur','seitan','pasta','noodle','pastry','dough','batter','roux','cracker','tortilla','wrap','dumpling','pie crust','barley','malt','rye','oats','farina','durum','spelt','kamut','triticale','cracked wheat','wheat germ','wheat starch','vital wheat gluten','farina di grano','semola','pane','pizza','focaccia','farro','orzo','lasagna','tagliatelle','penne','spaghetti','fusilli','ravioli','tortellini','gnocchi','naan','roti','paratha','puri','chapati','bhatura','samosa','vermicelli','udon','ramen','tempura batter','gyoza wrapper','wonton','komugi','komugiko','maida','atta','suji','rava','harina de trigo','harina','tortilla de harina','bolillo','telera','empanada dough','sopapilla','buñuelo','pan dulce'] },
    { a: 'crustaceans', c: 0.95, k: ['shrimp','prawn','crayfish','crawfish','lobster','crab','krill','langoustine','scampi','gamberi','gamberetti','scampi','aragosta','astice','mazzancolle','jhinga','chingri','ebi','kani','amaebi','camarón','camarones','langosta','jaiba','cangrejo'] },
    { a: 'molluscs', c: 0.95, k: ['clam','mussel','oyster','scallop','squid','calamari','octopus','abalone','snail','whelk','cuttlefish','periwinkle','vongole','cozze','seppia','totano','moscardini','ostriche','capesante','kaki','hotate','ika','tako','awabi','sazae'] },
    { a: 'fish', c: 0.95, k: ['fish','salmon','tuna','cod','haddock','trout','bass','halibut','anchovy','anchovies','sardine','mackerel','herring','snapper','tilapia','swordfish','sea bass','bonito','mahi-mahi','fish sauce','fish stock','acciughe','alici','baccalà','tonno','pesce spada','orata','spigola','sarde','sgombro','machli','meen','pomfret','rawas','surmai','bangda','hilsa','sake','maguro','saba','unagi','hamachi','tai','buri','katsuo','aji','iwashi','sanma','pescado','bacalao','robalo','huachinango'] },
    { a: 'eggs', c: 0.9, k: ['egg','eggs','mayonnaise','mayo','albumin','egg white','egg yolk','meringue','custard','hollandaise','bearnaise','aioli','pasta all uovo','egg noodle','uovo','anda','tamago','dashimaki tamago','huevo'] },
    { a: 'peanuts', c: 0.95, k: ['peanut','peanuts','groundnut','monkey nut','peanut butter','peanut oil','mungfali','singdana','shengdana','cacahuate','cacahuates','cacahuete','maní'] },
    { a: 'soy', c: 0.95, k: ['soy','soya','soy sauce','soya sauce','shoyu','tamari','tofu','edamame','miso','tempeh','soy lecithin','soybean','soy protein','soya bean','natto','nattō','tsuyu','soia'] },
    { a: 'milk', c: 0.95, k: ['milk','cheese','butter','cream','yogurt','yoghurt','cream cheese','mozzarella','parmesan','ricotta','feta','ghee','paneer','curd','whey','casein','lactose','buttermilk','sour cream','creme fraiche','bechamel','béchamel','au gratin','condensed milk','evaporated milk','dairy','mozzarella','parmigiano','pecorino','gorgonzola','mascarpone','panna','burro','formaggio','provolone','taleggio','fontina','asiago','burrata','stracchino','robiola','latte','paneer','ghee','dahi','malai','makhani','khoa','khoya','kulfi','lassi','chaas','rasmalai','rasgulla','sandesh','gyūnyu','queso','crema','mantequilla','queso fresco','cotija','oaxaca','asadero','manchego','crema mexicana'] },
    { a: 'nuts', c: 0.9, k: ['almond','walnut','cashew','pecan','hazelnut','pistachio','macadamia','brazil nut','pine nut','pignolia','marzipan','praline','nougat','almond milk','hazelnut spread','nut oil','mixed nuts','pinoli','noci','mandorle','nocciole','kaju','badam','pista','akhrot','nuez','almendra'] },
    { a: 'celery', c: 0.9, k: ['celery','celery salt','celeriac','lovage','celery seed','sedano'] },
    { a: 'mustard', c: 0.9, k: ['mustard','dijon','mustard seed','mustard flour','mustard powder','mustard seeds','senape','sarson','rai','karashi'] },
    { a: 'sesame', c: 0.95, k: ['sesame','tahini','sesame oil','sesame seed','benne','gomasio','sesame paste','sesamo','til','goma','nerigoma','goma-abura','ajonjolí'] },
    { a: 'sulphites', c: 0.5, k: ['sulphite','sulfite','sulfur dioxide','sulphur dioxide','metabisulfite','metabisulphite','wine','sherry','port','dried fruit','sake'] },
    { a: 'lupin', c: 0.9, k: ['lupin','lupine','lupini','lupin flour','lupine flour','lupini'] }
  ]
};