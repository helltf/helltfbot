require('dotenv').config();
const request = require('request');
const tmi = require('tmi.js');
const fs = require('fs');
var channelListJSON = fs.readFileSync("./channels.json");
var channelList = JSON.parse(channelListJSON);
console.log(channelList);
let timer=true;
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
        client.say(channel,'PONG! Programm is currently running');
    }
    if(message==='hb supported'){
        var result="";
        for(let[channelName] of Object.entries(channelList)){
            result+= ' '+ channelName;
        }
        client.say(channel,'Currently available streamers are ' + result);
    }
    if(message.substring(0,14)==='hb addstreamer'){
        if(user['display-name']==='helltf'){
            console.log('helltf');
            var words = message.split(' ');
            if(words.length===4){
                console.log('in if');
                var channelInfo={}
                channelInfo.id=parseInt(words[3]);
                channelInfo.notified="";
                channelList[words[2]]=channelInfo;
                client.say(channel,'Successfully added ' + words[2] + 'to channels!');
                toJSON();
                setTimeout(()=>{
                    initAvailableChannel()
                },5000)  
            }
            else{
                client.say(channel,'Sorry, wrong input provided: Command is hb add <name> <id>');
            }
        }
        else{
            client.say(channel,'Sorry you are not authorized to perform this command!')
        }
    }
    if(message.substring(0,9)==='hb remove'){
        var streamer = message.substring(10,message.length);
        if(channelList[streamer]!=undefined&&enabledChannels[streamer]!=undefined){
            if(timer){
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
        var streamer = message.substring(13,message.length);
        //GET request to API -> returns JSON in response 
        getLive(process.env.GET_GAMES,AT,(response) =>{
        var ob=JSON.parse(response.body);
        let hit=0;
        if(ob!=undefined){
            //if our JSON defined search for the right streamer in Array-> output islive ? live : offline
            for(i=0;i<ob.data.length;++i){
                if(ob.data[i].display_name===streamer){
                    client.say(channel, ob.data[i].is_live? ob.data[i].display_name +' is currently live FeelsAmazingMan': ob.data[i].display_name + ' is currently offline FeelsBadMan');
                    hit=1;
                    break;
                }
            }
            // if streamer is not in Array -> not found 
            if(hit===0){
                client.say(channel,'no streamer found');
            }
        }
        // query cant look up that name -> invalid input
        else{
            client.say(channel,'invalid input');
        }
        },streamer);
    }
});
const toJSON = ()=>{
    timer=false;
    console.log('Writing');
    fs.writeFile("./channels.json", JSON.stringify(channelList), function writeJSON(err) {
        if (err) return console.log(err);
    });
    setTimeout(()=>{
    timer=true;
    var channelListJSON = fs.readFileSync("./channels.json");
    var channelList = JSON.parse(channelListJSON);
    console.log(channelList);
    console.log('list has been updated');
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
            console.log('Status: ${res.statusCode}');
            callback(res);
        });
};
async function refreshData(){
    for (let [channelName,channeldata]  of Object.entries(enabledChannels)){
        await doChannelAPIUpdate(channelName,channeldata.id,async (data)=>{
            await updateChannelProperty(channelName, "title", data.title);
            await updateChannelProperty(channelName, "game_id", data.game_id);
            await updateChannelProperty(channelName, "is_live", data.is_live);
        });
    }
}
async function doChannelAPIUpdate(channelName,channelID,callback){
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
            var job=JSON.parse(body);
            for(i=0;i<job.data.length;++i){
                if(job.data[i].display_name===channelName){
                    var data=job.data[i];
                    break;
                }
            }
            callback(data);
        });
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
async function notify(key, value,channelName){
    switch(key){
        case 'title':client.say('helltf', 'DinkDonk ' + channelList[channelName].notified + ' PagMan 👉 ' + channelName+ ' has changed his title to ' + value);
        break;
        case 'is_live':  if(value){
            client.say('helltf', 'DinkDonk ' + channelList[channelName].notified + '  PagMan 👉 ' + channelName+ ' went Live');
        }
        else{
            client.say('helltf', 'DinkDonk ' + channelList[channelName].notified + '  FeelsBadMan 👉 ' + channelName+ ' went offline');
        }
        break;
        case'game_id':client.say('helltf', 'DinkDonk ' + channelList[channelName].notified + ' PagMan 👉 ' + channelName+ ' has changed his game to ' + value);
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
setTimeout(()=>{
    connect();
},2000)
