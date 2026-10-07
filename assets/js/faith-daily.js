(()=>{const daily={
"10-07":{g:"Gospodine, nauči nas moliti!",ref:"Lk 11,1-4",desc:"Današnje Evanđelje donosi učenike koji od Isusa traže da ih nauči moliti. Isus ih usmjerava prema jednostavnoj i dubokoj molitvi Očenaša: prema Ocu, njegovu imenu, kraljevstvu, svakodnevnom kruhu, oproštenju i oslobođenju od napasti.",saint:"Blažena Djevica Marija od Krunice",saintDesc:"Danas se Crkva spominje Blažene Djevice Marije od Krunice i poziva vjernike na molitvu krunice, razmatranje Kristova života i povjerenje u Marijin zagovor."},
"10-06":{g:"Marta ga primi u kuću. Marija je izabrala bolji dio.",ref:"Lk 10,38-42",desc:"Isus uči Martu i Mariju da, uz svu brigu i služenje, ne smijemo izgubiti ono najvažnije: zastati, slušati Božju riječ i biti prisutni pred Gospodinom.",saint:"Sveti Bruno",saintDesc:"Sveti Bruno, prezbiter i osnivač kartuzijanskoga reda, ostao je zapamćen po dubokoj molitvi, šutnji i traženju Boga."},
"10-05":{g:"Ljubi Gospodina Boga svojega i svoga bližnjega kao sebe samoga.",ref:"Lk 10,25-37",desc:"Prispodoba o milosrdnom Samarijancu podsjeća da bližnji nije samo onaj koji nam je blizu, nego i čovjek kojemu je potrebna naša pomoć, suosjećanje i ljubav.",saint:"Sveta Faustina Kowalska",saintDesc:"Sveta Faustina poznata je po svjedočanstvu Božjega milosrđa i pozivu da se čovjek pouzda u Boga."},
"10-08":{g:"Zašto me zoveš dobrim? Nitko nije dobar doli Bog jedini.",ref:"Lk 18,18-23",desc:"Današnja poruka poziva na iskren pogled prema vlastitom srcu i na pitanje čemu u životu dajemo prvo mjesto.",saint:"Sveta Pelagija",saintDesc:"Crkvena predaja danas se spominje svete Pelagije, čiji se život veže uz obraćenje i predanje Bogu."}
};
const gospelBooks={Lk:"Evanđelje po Luki",Mt:"Evanđelje po Mateju",Mk:"Evanđelje po Marku",Iv:"Evanđelje po Ivanu"};
const prayers=[
["Oče naš","Oče naš, koji jesi na nebesima, sveti se ime tvoje. Dođi kraljevstvo tvoje. Budi volja tvoja, kako na nebu tako i na zemlji. Kruh naš svagdanji daj nam danas. I otpusti nam duge naše kako i mi otpuštamo dužnicima našim. I ne uvedi nas u napast, nego izbavi nas od Zloga. Amen."],
["Zdravo Marijo","Zdravo, Marijo, milosti puna, Gospodin s tobom. Blagoslovljena ti među ženama i blagoslovljen plod utrobe tvoje, Isus. Sveta Marijo, Majko Božja, moli za nas grešnike, sada i na času smrti naše. Amen."],
["Slava Ocu","Slava Ocu i Sinu i Duhu Svetomu. Kako bijaše na početku, tako i sada i vazda i u vijeke vjekova. Amen."],
["Apostolsko vjerovanje","Vjerujem u Boga, Oca svemogućega, Stvoritelja neba i zemlje. I u Isusa Krista, Sina njegova jedinoga, Gospodina našega, koji je začet po Duhu Svetom, rođen od Marije Djevice, mučen pod Poncijem Pilatom, raspet, umro i pokopan; sašao nad pakao; treći dan uskrsnuo od mrtvih; uzašao na nebesa, sjedi o desnu Boga Oca svemogućega; odatle će doći suditi žive i mrtve. Vjerujem u Duha Svetoga, svetu Crkvu katoličku, općinstvo svetih, oproštenje grijeha, uskrsnuće tijela i život vječni. Amen."],
["Anđele čuvaru","Anđele čuvaru mili, svojom snagom me zakrili. Prema Božjem obećanju, čuvaj mene noću, danju. Osobito pak me brani da mi duša ne zabludi. Amen."],
["Molitva za obitelj","Gospodine, blagoslovi našu obitelj. Daruj nam ljubav koja prašta, strpljenje koje razumije i mudrost koja zna govoriti i šutjeti u pravo vrijeme. Čuvaj naš dom od svađe, mržnje, straha i svakoga zla. Pomozi nam da jedni drugima budemo oslonac, da poštujemo jedni druge i da u teškoćama ne izgubimo nadu. Neka u našem domu bude mira, vjere i zahvalnosti. Čuvaj djecu, roditelje i sve koje si nam povjerio. Vodi nas svojim putem i učini našu obitelj mjestom ljubavi. Amen."],
["Molitva za bolesne","Gospodine Isuse, budi blizu svima koji su bolesni, nemoćni i koji trpe. Podari im snagu za svaki novi dan, mir u srcu, utjehu u teškoći i nadu koja ne prestaje. Blagoslovi liječnike, medicinske sestre, obitelj i sve koji ih njeguju. Daj im mudrosti, strpljenja i suosjećanja. Ako je tvoja volja, podari bolesnima ozdravljenje, a ako put ozdravljenja traje, daj im snagu da ga prođu s tobom. Ne dopusti da se itko tko trpi osjeti zaboravljenim. Amen."],
["Molitva za pokojne","Svemilosrdni Bože, primi naše pokojne u svoje očinsko milosrđe. Oprosti im njihove grijehe i podari im vječni mir u svome kraljevstvu. Tješi sve koji za njima tuguju, osobito njihove obitelji i prijatelje. Daj nam vjeru da smrt nije posljednja riječ i učvrsti u nama nadu u uskrsnuće i život vječni. Pokoj vječni daruj im, Gospodine, i svjetlost vječna neka im svijetli. Počivali u miru. Amen."],
["Molitva zahvalnosti","Hvala ti, Gospodine, za dar života, za obitelj, prijatelje, dom, zdravlje i sve ljude koje stavljaš na naš put. Hvala ti i za male darove koje često ne primjećujemo. Daj da ne budemo nezahvalni ni slijepi za dobro koje primamo. Nauči nas zahvaljivati i onda kada je teško, činiti dobro bez očekivanja i dijeliti ono što imamo s drugima. Čuvaj nas od oholosti i podsjeti nas da je svaki dan novi dar. Amen."],
["Molitva za mir","Gospodine, daruj mir našim srcima, našim obiteljima i našoj domovini. Ondje gdje je svađa, donesi pomirenje; gdje je mržnja, ljubav; gdje je nemir, tišinu i pouzdanje. Pomozi nam da ne vraćamo zlo za zlo, nego da budemo ljudi mira, istine i praštanja. Amen."],
["Molitva u nevolji","Gospodine, kada dođu dani u kojima ne vidimo izlaz, ostani uz nas. Daj nam snagu da izdržimo ono što ne možemo promijeniti i mudrost da učinimo ono što možemo. Sačuvaj nas od očaja, ojačaj našu vjeru i podsjeti nas da nismo sami. U tvoje ruke predajemo svoje brige i svoje nade. Amen."]
];
const now=new Date(),key=String(now.getMonth()+1).padStart(2,"0")+"-"+String(now.getDate()).padStart(2,"0"),d=daily[key]||daily["10-07"];
const set=(sel,val)=>{const e=document.querySelector(sel);if(e)e.textContent=val};
set("[data-faith-date]",now.toLocaleDateString("hr-HR",{weekday:"long",day:"numeric",month:"long",year:"numeric"}));
const gospelKey=(d.ref||"").split(" ")[0];
set("[data-faith-gospel-book]",gospelBooks[gospelKey]||"Evanđelje dana");
set("[data-faith-gospel-title]",d.g);
set("[data-faith-gospel-ref]",d.ref);
set("[data-faith-gospel-text]",d.desc);
set("[data-faith-saint-title]",d.saint);
set("[data-faith-saint-text]",d.saintDesc);
const words=[["Budite jedni drugima dobrostivi, milosrdni.","Ef 4,32"],["Sve mogu u Onome koji me jača.","Fil 4,13"],["Gospodin je pastir moj: ni u čem ja ne oskudijevam.","Ps 23,1"],["Blago mirotvorcima: oni će se sinovima Božjim zvati.","Mt 5,9"],["U nadi budite radosni, u nevolji strpljivi.","Rim 12,12"],["Neka sve što činite bude u ljubavi.","1 Kor 16,14"],["Ne boj se, jer ja sam s tobom.","Iz 41,10"]];
const q=words[Math.floor((Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())-Date.UTC(now.getFullYear(),0,0))/86400000)%words.length];
set("[data-faith-word-text]","„"+q[0]+"”");
set("[data-faith-word-ref]",q[1]);
const grid=document.querySelector(".ps-prayer-grid");
if(grid)grid.innerHTML=prayers.map(p=>"<article class=\"ps-prayer-card\"><h3>"+p[0]+"</h3><p>"+p[1]+"</p></article>").join("");
})();