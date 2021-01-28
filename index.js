require('dotenv').config();
const request = require('request');

const tmi = require('tmi.js');
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
    channels:['helltf','anniiikaa'],
};
//create new istance of Client
const client= new tmi.Client(botoptions);

//event if Client connects
client.on('connected',(address,port)=> {
});

//event if chat message in a connected Channel appears
client.on('chat', (channel,user,message,self)=> {
    if(message==='hb titlecheck'){
        getTitle(process.env.GET_GAMES,AT,(res) =>{
            var ob=JSON.parse(res.body);
            client.say(channel,ob.data[0].broadcaster_name+ "'s current streamtitle is: " + ob.data[0].title);
            },channel)
    }
    if(message==='hb git'){
        client.say(channel , "Here you'll find my github repository Okayge 👉 https://github.com/helltf/helltfbot . Nevertheless it's Pepege Code  ");
    }
    if(message==='hb ping'){
        client.say(channel,'PONG! Programm is currently running');
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
// function to get the current title
const getTitle = (url,accessToken,callback,channel)=>{

    const gameOptions = {
        url:process.env.GET_TITLE,
        method:'GET',
        headers:{
            'Client-ID':process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request.get(gameOptions,(err,res,body)=>{
        if(err){
            return console.log(err);
        }
        console.log('Status:' +  res.statusCode);
        callback(res);
    });

};
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
    for (let [channelName, channelID]  of Object.entries(enabledChannels)){
        await doChannelAPIUpdate(channelName,channelID,async (data)=>{
            await updateChannelProperty(channelName, "title", data.title);
            await updateChannelProperty(channelName, "game_id", data.game_id);
            await updateChannelProperty(channelName, "is_live", data.is_live);
        });
    }
    console.log('data refreshed');
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
        case 'title':client.say('helltf', 'DinkDonk helltf PagMan 👉 ' + channelName+ ' has changed his title to ' + value);
        client.say('anniiikaa', 'DinkDonk helltf PagMan 👉 ' + channelName+ ' has changed his title to ' + value);
        break;
        case 'is_live':  if(value){
            client.say('helltf', 'DinkDonk helltf PagMan 👉 ' + channelName+ ' went Live');
            client.say('anniiikaa', 'DinkDonk helltf PagMan 👉 ' + channelName+ ' went Live');
        }
        else{
            client.say('helltf', 'DinkDonk helltf FeelsBadMan 👉 ' + channelName+ ' went offline');
            client.say('anniiikaa', 'DinkDonk helltf FeelsBadMan 👉 ' + channelName+ ' went offline');
        }
        break;
        case'game_id':client.say('helltf', 'DinkDonk helltf PagMan 👉 ' + channelName+ ' has changed his game to ' + value);
        client.say('anniiikaa', 'DinkDonk helltf PagMan 👉 ' + channelName+ ' has changed his game to ' + value);
        default:client.say('helltf','wrong key helltf DinkDonk');
    }
}
initializeAT(process.env.TOKEN_URL,(res)=>{
    AT=res.body.access_token;
    return AT;
    })
  
setTimeout(()=>{
    connect()
},2000)

async function connect(){
    await client.connect()
    refreshData()
    setInterval(refreshData,5*1000);
}
let currentdata = {};

let enabledChannels = {
        papaplatte:{
            id:50985620,
            title:undefined,
            is_live:undefined,
            game_id:undefined,
        },
        nebelniek:{
            id:53292169,
            title:undefined,
            is_live:undefined,
            game_id:undefined,
        },
        helltf:{
            id:109035947,
            title:undefined,
            is_live:undefined,
            game_id:undefined,
        },
        schmortyy:{
            id:210120795,
            title:undefined,
            is_live:undefined,
            game_id:undefined,
        }
}