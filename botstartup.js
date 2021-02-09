require('dotenv').config();
const request = require('request');
const tmi = require('tmi.js');
const fs = require('fs');
var Timer = require('easytimer.js').Timer;
const si = require('systeminformation');
const channels= require('./channels.json');
let cooldown=true;
//set options for chatclient, where password is your OAuthtoken
const botoptions = {
    options:{
        debug: true
    },
    connection:{
        cluster:'aws',
        reconnect:true,
    },
    identity:{
        username:'helltfbot',
        password:process.env.IRC_PASSWORD
    },
    channels:['helltf','anniiikaa']
};
//create new istance of Client
const client= new tmi.Client(botoptions);

//event if Client connects
client.on('connected',(address,port)=> {
});

//event if chat message in a connected Channel appears
client.on('chat', (channel,user,message,self)=> {
    if(message==='hb titlecheck'){
        client.say(channel,'deprecated');
    }

    if(message==='hb git'){
        client.say(channel , "Here you'll find my github repository Okayge 👉 https://github.com/helltf/helltfbot . Nevertheless it's Pepege Code  ");
    }
    if(message==='hb ping'){
        si.cpuTemperature().then((data)=>{
            client.say(channel,'PONG! Programm is up for ' + timer.getTimeValues().days+ ' days, ' + timer.getTimeValues().hours + ' hours, ' + timer.getTimeValues().minutes + ' min. Current CPU-temperature is ' +
         data.main + '°C');
        }).catch((err)=>{
            console.log(err);
        })
    }
    if(message==='hb commands'){
        client.say(channel,'All available commands are hb [git, ping, supported, removestreamer, addstreamer, notify, removeme, notified]');
    }
    if(message==='hb supported'){
        var result="";
        for(let[channelName] of Object.entries(channelList)){
            result+= ' '+ channelName;
        }
        client.say(channel,'Currently available streamers are ' + result);
    }
    if(message.substring(0,11)==='hb notified'){
        var words = message.split(' ');
        var result= '';
        if(words.length===2){
            for(let[channelName,channeldata]of Object.entries(channelList)){
                if(channeldata.notified.includes(user['display-name'])){
                    result+= ' ' + channelName;
                }
            }
            client.say(channel,'Your notified streamer(s) are' + result);
        }
        else if(words.length===3){
            var hit=0;
            checkuser =words[2]
            for(let[channelName,channeldata]of Object.entries(channelList)){
                if(channeldata.notified.includes(checkuser)){
                    hit=hit+1;
                    result+= ' ' + channelName;
                }
            }
            if(hit===0){
                client.say(channel, "Sry couldn't find that user in my database :( ");
            }
            else{
                client.say(channel, checkuser + ' notified streamer(s) are' + result);
            }
        }
        else{
            client.say(channel,'Wrong input provided FeelsBadMan');
        }
    }
    if(message.substring(0,17)==='hb removestreamer'){
        if(user['display-name']==='helltf'){
            var words = message.split(' ');
            var contains= false;
            for(let[channelName] of Object.entries(channelList) ){
                if(channelName===words[2])contains=true;
            }
            if(words.length===3&&channelList&&contains){
                delete channelList[words[2]];
                delete enabledChannels[words[2]];
                client.say(channel,'Successfully removed ' + words[2] + ' from channels!');
                toJSON();
                setTimeout(()=>{
                    initAvailableChannel()
                },5000)  
            }
            else if(!contains){
                client.say(channel, 'Sry but the channel is not in the list!')
            }
            else{
                client.say(channel,'Sorry, wrong input provided: Command is hb removestreamer <name> !');
            }

        }
    }
    if(message.substring(0,14)==='hb addstreamer'){
        if(user['display-name']==='helltf'){
            var words = message.split(' ');
            if(words.length===3){
            doChannelAPIUpdate(words[2],async (data)=>{
                try{
                    if(data!=undefined){
                        var channelInfo={}
                        channelInfo.id=parseInt(data.id);
                        channelInfo.notified="";
                        channelList[words[2]]=channelInfo;
                        client.say(channel,'Successfully added ' + words[2] + ' to channels!');
                        toJSON();
                        setTimeout(()=>{
                            initAvailableChannel()
                        },5000)  
                    }
                   else{
                       client.say(channel,"Couldn't find that streamer!");
                   }
                }
                catch(err){
                    console.log(err);
                }
            }
)
        }
            else{
                client.say(channel,'Sorry, wrong input provided: Command is hb addstreamer <name>');
            }
        }else{
            client.say(channel,'Sorry you are not authorized to perform this command!');
        }
    }
    if(message.substring(0,11)==='hb removeme'){
        var streamer = message.substring(12,message.length);
        if(channelList[streamer]!=undefined&&enabledChannels[streamer]!=undefined){
            if(cooldown){
                if(channelList[streamer].notified.includes(user['display-name'])){
                    var index = channelList[streamer].notified.indexOf(user['display-name']);
                    var stringp1 = channelList[streamer].notified.substring(0,index);
                    var stringp2 = channelList[streamer].notified.substring(index + user['display-name'].length+1,channelList[streamer].notified.length);
                    var result = stringp1 + stringp2;
                    channelList[streamer].notified=result;
                    client.say(channel, 'Successfully removed you '+ user['display-name'] +' from channel: ' + streamer);
                }
                else{
                    client.say(channel, 'Sorry you are not registered for this streamer: ' + streamer + ' FeelsBadMan');
                }
                toJSON();
            }else{
                client.say(channel, 'Command is currently on cooldown. Please wait a second ppHop');
            }
        }
        else{
            client.say(channel,"Couldn't find that streamer " +  streamer + " in my database!");
        }
    }
    if(message.substring(0,9)==='hb notify'){
        var streamer = message.substring(10,message.length);
        if(channelList[streamer]!=undefined&&enabledChannels[streamer]!=undefined){
            if(timer){
                if(channelList[streamer].notified.includes(user['display-name'])){
                    client.say(channel,'Sorry you are already registered for this streamer: ' + streamer + ' FeelsOkayMan 👍 ');
                    return;
                }
                if(channelList[streamer].notified===""){
                    channelList[streamer].notified+=user['display-name'];
                    client.say(channel, 'I added you ' + user['display-name'] + ' to notifications for ' + streamer );
                }
                else{
                    channelList[streamer].notified+=" " + user['display-name'];
                    client.say(channel, 'I added you ' + user['display-name'] + ' to notifications for ' + streamer );
                } 
                toJSON()
            }
            else{
                client.say(channel, 'Command is currently on cooldown. Please wait a second ppHop');
            }
        }
        else{
            client.say(channel,"Couldn't find that streamer " +  streamer + " in my database!");
        }
    }
    //event if message starts with hb livecheck
    if(message.substring(0,12)==='hb livecheck'){
        client.say(channel,'deprecated');
    }
});
const toJSON = ()=>{
    cooldown=false;
    fs.writeFile("./channels.json", JSON.stringify(channelList), function writeJSON(err) {
        if (err) return console.log(err);
    });
    setTimeout(()=>{
    cooldown=true;
    channelListJSON = fs.readFileSync("./channels.json");
    channelList = JSON.parse(channelListJSON);
    },5000)

}
const initAvailableChannel= ()=>{
    for(let [channelName,data] of Object.entries(channelList)){
        var channelInfo={}
        channelInfo.id=data.id;
        channelInfo.title=undefined;
        channelInfo.is_live=undefined;
        channelInfo.game_id=undefined;
        enabledChannels[channelName]=channelInfo;  
    }
}
async function initializeAT(url,callback){
    const options={
        url: process.env.TOKEN_URL,
        json:true,
        body:{
            client_id:process.env.CLIENT_ID,
            client_secret:process.env.CLIENT_SECRET,
            grant_type:'client_credentials'
        }
    };
        request.post(options,(err,res,body)=>{
            if(err){
                return console.log(err);
            }
            callback(res);
        });
};
async function refreshData(){
    for (let [channelName,channeldata]  of Object.entries(enabledChannels)){
        await doChannelAPIUpdate(channelName,async (data)=>{
            try{
            await updateChannelProperty(channelName, "title", data.title);
            await updateChannelProperty(channelName, "game_id", data.game_id);
            await updateChannelProperty(channelName, "is_live", data.is_live);
        }catch(err){
            console.log(err);
            await updateChannelProperty(channelName, "title", data.title);
            await updateChannelProperty(channelName, "game_id", data.game_id);
            await updateChannelProperty(channelName, "is_live", data.is_live);
        }
        });
    }
}
async function doChannelAPIUpdate(channelName,callback){
    const Getoptions={
        url:process.env.GET_LIVE + channelName,
        method:'GET',
        headers:{
            'Client-ID':process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + AT
        }
    };
        request.get(Getoptions,(err,res,body)=>{
            if(err)return console.log(err);
            try{
                var job=JSON.parse(body);
            for(i=0;i<job.data.length;++i){
                if(job.data[i].broadcaster_login===channelName){
                    var data=job.data[i];
                    break;
                }
            }
            callback(data);
        }catch(err){
            console.log(err);
        }});
    }
async function updateChannelProperty(channelName,key,value){
    let oldValue= enabledChannels[channelName][key];
    if(oldValue===undefined){
        enabledChannels[channelName][key]=value;
    }
    if(value!=undefined&&oldValue!=undefined&&oldValue!=value){
        await notify(key,value,channelName);
        enabledChannels[channelName][key]=value;
    }
}
async function getGame(gameid,callback){
    const gameoptions={
        url:process.env.GET_GAME + gameid,
        method:'GET',
        headers:{
            'Client-ID':process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + AT
        }
    };
    request.get(gameoptions,(err,res,body)=>{
        if(err){
            return console.log(err);
        }
        if(res!=undefined){
            var job = JSON.parse(res.body);
            console.log(job)
            if(data!=[]){
                try{
                    var data = job.data[0].name;
                    callback(data);
                }
                catch(err){
                    console.log(err);
                    callback('Error');
                }
                
            }
            else{
                callback('error');
            }
            
        }else{
            callback('error');
        }
        
    });

}
async function notify(key, value,channelName){
    switch(key){
        case 'title':client.say('anniiikaa','PagMan 👉 ' + channelName+ ' has changed his title to ' + value + ' DinkDonk ' + channelList[channelName].notified);
            client.say('helltf', 'PagMan 👉 ' + channelName+ ' has changed his title to ' + value+ ' DinkDonk ' + channelList[channelName].notified);
        break;
        case 'is_live':  if(value){
            client.say('anniiikaa','PagMan 👉 ' + channelName+ ' went Live'+ ' DinkDonk ' + channelList[channelName].notified);
            client.say('helltf','PagMan 👉 ' + channelName+ ' went Live'+ ' DinkDonk ' + channelList[channelName].notified);
        }
        else{
            client.say('anniiikaa','FeelsBadMan 👉 ' + channelName+ ' went offline'+ ' DinkDonk ' + channelList[channelName].notified);
            client.say('helltf','FeelsBadMan 👉 ' + channelName+ ' went offline'+ ' DinkDonk ' + channelList[channelName].notified);
        }
        break;
        case'game_id':
        console.log(value);
        getGame(value,(data)=>{
            if(data!=undefined){
                client.say('anniiikaa','PagMan 👉 ' + channelName+ ' has changed his game to ' + data+ ' DinkDonk ' + channelList[channelName].notified);
                client.say('helltf','PagMan 👉 ' + channelName+ ' has changed his game to ' + data+ ' DinkDonk ' + channelList[channelName].notified);
            }
            else{
                client.say('helltf', 'Error while fetching game for ' + channelName);
                client.say('anniiikaa', 'Error while fetching game for ' + channelName);
            }
            
        })
        break;
        default:client.say('helltf','wrong key helltf DinkDonk');
    }
}
async function initAT(){
    initializeAT(process.env.TOKEN_URL,(res)=>{
        AT=res.body.access_token;
        return AT;
        })
}
async function connect(){
    await client.connect()
    try{
        refreshData()
        timer.start({precision: 'seconds'});
    }
    catch(err){
        console.log(err);
    }
    setInterval(refreshData,5*1000);
    setInterval(initAT,3300000)
}
let enabledChannels = {}
initAT();
initAvailableChannel();
var timer = new Timer();
setTimeout(()=>{
    connect();
},2000)
