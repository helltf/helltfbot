require('dotenv').config();
const botconfig= require('./config.json');
const request = require('request');
const tmi = require('tmi.js');
const fs = require('fs');
var Timer = require('easytimer.js').Timer;
const si = require('systeminformation');
const channels= require('./channels.json');
const { emitKeypressEvents } = require('readline');
var channelListJSON = fs.readFileSync("./channels.json");
var channelList = JSON.parse(channelListJSON);
let cooldown=false;

const botoptions = botconfig;

const client= new tmi.Client(botoptions);

client.on('chat', (channel,user,message,self)=> {
    if(message==='hb titlecheck'){
        client.say(channel,'deprecated');
    }
    if(message.substring(0,12)==='hb forcejoin'&&user['display-name'].toLowerCase()==='helltf'){
        var parts = message.split(' ');
        var newChannel = parts[2];
        botconfig.channels.push(newChannel);
        client.join(newChannel);
        editConfig();
    }
    if(message.substring(0,13)==='hb forceleave'&&user['display-name'].toLowerCase()==='helltf'){
        var parts = message.split(' ');
        var leaveChannel = parts[2];
        botconfig.channels.push(leaveChannel);
        client.join(leaveChannel);
        editConfig();
    }
    if(message==='hb joinmychannel'){
        var hit=false;
        var newChannel = user['display-name'].toLowerCase();
        for(var i=0;i<botconfig.channels.length;++i){
            if(botconfig.channels[i]===newChannel||botconfig.channels[i]==='#' + newChannel){
               hit=true;
            }
        }
        if(hit){
            client.say(channel,'Sorry but you are already in the channelslist!');
        }
        else{
            botconfig.channels.push(newChannel);
            client.join(newChannel);
            client.say(channel,'helltfbot should be available in your channel!');
            editConfig();
        }
    }
    if(message==='hb removemychannel'){
        var hit=false;
        var index;
        var leaveChannel = user['display-name'].toLowerCase();
        for(var i=0;i<botconfig.channels.length;++i){
            if(botconfig.channels[i]===leaveChannel||botconfig.channels[i]==='#' + leaveChannel){
               hit=true;
               index=i;
            }
        }
        if(hit){
            botconfig.channels.splice(index,1);
            client.say(channel,'helltfbot should no longer be available in your channel!');
            client.part(leaveChannel)
            editConfig()
        }
        else{
            client.say(channel,'Sorry but you are not in the channelslist!')
        }
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
        client.say(channel,'All available commands are hb [git, ping, supported, removestreamer, addstreamer, notify, removeme, notified,joinmychannel,removemychannel] You can get more information about commands with hb commandinfo <cmd> ! ');
    }
    if(message.substring(0,14)==='hb commandinfo'){
        var command=message.substring(15,message.length);
        switch(command){
            case 'git':client.say(channel,"It's a link to my git page");
            break;
            case 'ping':client.say(channel,"If the programm is running the bot will send a Pong message in the channel!")
            break;
            case 'supported':client.say(channel,'Bot will send a message with all available channels for notifies');
            break;
            case 'removestreamer': client.say(channel,'Admincommand to remove a streamer from the notify list');
            break;
            case 'addstreamer': client.say(channel,'Admincommand to add a new streamer to the notify list');
            break;
            case'notify':client.say(channel,'Correct command usage is hb notify <streamer>, to get notified on an event for a certain streamer');
            break;
            case'removeme':client.say(channel,'Currect usage is hb removeme <streamer>, to remove yourself from notifications for a certain streamer');
            break;
            case'joinmychannel':client.say(channel,'Upon next restart, the bot will send notifications in your channel');
            break;
            case'removemychannel':client.say(channel,'Upon next restart, the bot will no longer send notifications in your chat');
            break;
            default:client.say(channel,'the given command is not supported');
            break;
        }
    }
    if(message==='hb supported'){
        var array = [];
        for(let[channelName] of Object.entries(channelList)){
           array.push(channelName);
        }
        var messages= createStrings(array,"Currently available streamers are  ","","","")
        messages.forEach(message => client.say(channel,message))
    }
    if(message.substring(0,11)==='hb notified'){
        var words = message.split(' ');
        var result= '';
        var key = words[2]
        if(words.length===3){
            for(let[channelName,channeldata]of Object.entries(channelList)){
                if(channeldata.notified[key].includes(user['display-name'])){
                    result+= ' ' + channelName;
                }
            }
            client.say(channel,'Your notified streamer(s) are' + result);
        }
        else if(words.length===4){
            var hit=0;
            checkuser =words[3]
            for(let[channelName,channeldata]of Object.entries(channelList)){
                if(channeldata.notified[key].includes(checkuser)){
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
            var words = message.split(' ');
            var contains= false;
            var streamer = words[2].toLowerCase();
            userlc = user['display-name'].toLowerCase();
            for(let[channelName] of Object.entries(channelList) ){
                if(channelName===streamer)contains=true;
            }
            if(words.length===3&&contains){
                if(channelList[streamer].outputchannels.includes(userlc)){
                    var index = channelList[streamer].outputchannels.indexOf(userlc);
                    channelList[streamer].outputchannels.splice(index,1);
                }
                if(channelList[streamer].outputchannels.length===0){
                    delete channelList[streamer];
                    delete enabledChannels[streamer];
                    //client.say('helltf',`$remind helltf  ${streamer} is empty DinkDonk`);
                }
                client.say(channel,`Successfully removed ${streamer} from channel ${user['display-name']}!`);
                toJSON();
            }
            else if(!contains){
                client.say(channel, 'Sry but the channel is not in the list!')
            }
            else{
                client.say(channel,'Sorry, wrong input provided: Command is hb removestreamer <name> !');
            }
    }
    if(message.substring(0,14)==='hb addstreamer'){
            var words = message.split(' ');
            if(words.length===3){
                var streamer = words[2];
            doChannelAPIUpdate(streamer,async (data)=>{
                try{
                    if(data!=undefined&&!cooldown){
                        if(channelList[streamer]===undefined){
                            var channelInfo={}
                            var notifyinfo={};
                            channelInfo.id=parseInt(data.id);
                            notifyinfo.title=[];
                            notifyinfo.game=[];
                            notifyinfo.status=[];
                             channelInfo.outputchannels=[];
                            channelInfo.notified=notifyinfo;
                            channelList[streamer]=channelInfo;
                            client.say(channel,`${streamer} is new and a new instance has been created!`);
                        }
                            if(!channelList[streamer].outputchannels.includes(user['display-name'])){
                                channelList[streamer].outputchannels.push(user['display-name']);
                                client.say(channel,`Successfully added ${streamer} to messages in channel ${user['display-name']}`);
                            }
                            else{
                                client.say(channel,`Sorry but ${streamer} is already added to messages in channel ${user['display-name']}`);
                            }
                        toJSON();
                    }
                   else{
                       client.say(channel,"Couldn't find that streamer! or command is on cooldown ppHop");
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
        }
    if(message.substring(0,11)==='hb removeme'){
        var parts=message.split(' ');
        var streamer = parts[2];
        var key = parts[3];
        if(channelList[streamer]!=undefined&&enabledChannels[streamer]!=undefined&&parts.length===4){
            if(key==='status'||key==='title'||key==='game'){
            if(!cooldown){
                if(channelList[streamer].notified[key].includes(user['display-name'])){
                    var index = channelList[streamer].notified[key].indexOf(user['display-name']);
                    channelList[streamer].notified[key].splice(index,1);
                    client.say(channel, `Successfully removed ${user['display-name'] } from ${streamer} on the ${key}change event FeelsOkayMan`);
                }
                else{
                    client.say(channel,`Sorry you are not registered for ${streamer} on the ${key}change event FeelsBadMan`);
                }
                toJSON();
            }else{
                client.say(channel, 'Command is currently on cooldown. Please wait a second ppHop');
                }
         }else{
             client.say(channel,'Sorry but you can only unregister from events like status, title or game!');
         }
        }
        else{
            client.say(channel,"Couldn't find that streamer " +  streamer + " in my database or the input was wrong => right input: hb removeme <streamer> <event>!");
        }
    }
    if(message.substring(0,9)==='hb notify'){
        var parts = message.split(' ');
        var streamer = parts[2].toLowerCase();
        var key = parts[3];
        var userlc = user['display-name'].toLowerCase();
        if(channelList[streamer]!=undefined&&enabledChannels[streamer]!=undefined&&parts.length===4){
            if(key==='status'||key==='title'||key==='game'){
                if(!cooldown){
                    if(channelList[streamer].notified[key].includes(userlc)){
                         client.say(channel,`Sorry you are already registered for  ${streamer} on the ${key}change event FeelsOkayMan `);
                        return;
                        }
                     else{
                            channelList[streamer].notified[key].push(userlc) ;
                            client.say(channel,`I added you ${user['display-name'] } to ${key} notifications for ${streamer}`);
                            } 
                        toJSON()
                    }
            else{
                client.say(channel, 'Command is currently on cooldown. Please wait a second ppHop');
            }
        }else{
            client.say(channel,'Sorry but you can only register for events like status, title or game!');
        }
        }
        else{
            client.say(channel,"Couldn't find that streamer " +  streamer + " in my database or the input was wrong => right input: hb notify <streamer> <event>");
        }
    }
    if(message.substring(0,12)==='hb livecheck'){
        client.say(channel,'deprecated');
    }
});
const toJSON = ()=>{
    cooldown=true;
    fs.writeFile("./channels.json", JSON.stringify(channelList), function writeJSON(err) {
        if (err) return console.log(err);
    });
    setTimeout(()=>{
    cooldown=false;
    channelListJSON = fs.readFileSync("./channels.json");
    channelList = JSON.parse(channelListJSON);
    initAvailableChannel();
    },5000)

}
const initAvailableChannel= ()=>{
    for(let [channelName,data] of Object.entries(channelList)){
        var channelInfo={}
            channelInfo.id=data.id;
            channelInfo.title=undefined;
            channelInfo.is_live=undefined;
            channelInfo.game_id=undefined;
            channelInfo.notifycd=false;
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
const promisifiedRequest = function(options) {
    return new Promise((resolve,reject) => {
      request(options, (error, response, body) => {
        if (response) {
          return resolve(response);
        }
        if (error) {
          return reject(error);
        }
      });
    });
  };
  
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
    let response = await promisifiedRequest(gameoptions);
    if(resjson!=undefined){
        var resjson  = JSON.parse(response.body);
        var gamename = resjson?.data?.[0]?.name;
    }
    else{
        var gamename = "error";
    }
    return gamename

}
const editConfig = ()=>{
    fs.writeFile("./config.json", JSON.stringify(botconfig), function writeJSON(err) {
        if (err) return console.log(err);
    });
}
async function notify(key, value,channelName){
    switch(key){
        case 'title':
            var messages =  await buildMessages(channelList[channelName].notified.title,key,channelName,value);
            for(var i=0;i<channelList[channelName].outputchannels.length;++i){
                var channel=channelList[channelName].outputchannels[i];
                if(client.getChannels().includes(channel)||client.getChannels().includes("#"+ channel)){
                   messages.forEach(message=>client.say(channel,message));
                }
            }
        break;
        case 'is_live':
            if(!enabledChannels[channelName].notifycd){
                var messages =  await buildMessages(channelList[channelName].notified.status,key,channelName,value);
                for(var i=0;i<channelList[channelName].outputchannels.length;++i){
                    var channel=channelList[channelName].outputchannels[i];
                    if(client.getChannels().includes(channel)||client.getChannels().includes("#"+ channel)){
                       messages.forEach(message=>client.say(channel,message));
                    }
                }
            enabledChannels[channelName].notifycd=true;
            setTimeout(()=>{
                enabledChannels[channelName].notifycd=false;
            },180000)
            }
        break;
        case'game_id':
        var messages =await   buildMessages(channelList[channelName].notified.game,key,channelName,value);
        for(var i=0;i<channelList[channelName].outputchannels.length;++i){
            var channel=channelList[channelName].outputchannels[i];
            if(client.getChannels().includes(channel)||client.getChannels().includes("#"+ channel)){
               messages.forEach(message=>client.say(channel,message));
            }
        }
            break;
        default:client.say('helltf','wrong key helltf DinkDonk');
        }
    }
    const buildMessages = async(array,key,channelName,value)=>{
        if(key==='game_id')key='game';
        if(key==='is_live')key='status';
        switch(key){
            case'game': 
             var data = await getGame(value,(res)=>{
             })
                    firstmessage=`PagMan 👉 ${channelName} has changed his/her game to ${data} DinkDonk`;
                    othermessage=`PagMan 👉 new game DinkDonk`;
                        return createStrings(array,firstmessage,othermessage,key,channelName);
            case 'title': firstmessage=`PagMan 👉 ${channelName} has changed his/her title to ${value} DinkDonk`;
                            othermessage=`PagMan 👉 new title DinkDonk `;
                            return createStrings(array,firstmessage,othermessage,key,channelName);
            case 'status': 
            if(value){
                firstmessage=`PagMan 👉 ${channelName} went live!  DinkDonk`;
                othermessage=`PagMan 👉 live DinkDonk`;
                return createStrings(array,firstmessage,othermessage,key,channelName);
            }
            else{
                firstmessage=`FeelsBadMan 👉 ${channelName} went offline!  DinkDonk`;
                othermessage=`FeelsBadMan 👉 offline DinkDonk`;
                return createStrings(array,firstmessage,othermessage,key,channelName);
            }
        }
    }
const createStrings = (array,firstmessage,othermessage,key,channelName) =>{
    var messages  = [];
    var firstmessage;
    var othermessage;
    var maxstringlength=420;
    var index;
for(var i =0;i<array.length;++i){
    if(firstmessage.length<maxstringlength){
        firstmessage += " " + array[i];
    }
    else{
        index=i;
        break;
    }
}messages.push(firstmessage);
    var moremessage=othermessage;
    for(index;index<array.length;++index){
        if(moremessage.length<maxstringlength){
            moremessage+= " "+ array[index];
        }
        else{
            messages.push(moremessage);
            moremessage=othermessage;
        }
    }
    if(moremessage!=othermessage){
        messages.push(moremessage);
    }
    return messages;
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
