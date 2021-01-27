require('dotenv').config();
const { S_IFBLK } = require('constants');
const { TIMEOUT } = require('dns');
const request = require('request');
const { setInterval } = require('timers');
var CG;
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
    channels:['helltf','anniiikaa','splatoxic'],
};
//create new istance of Client
const client= new tmi.Client(botoptions);

//event if Client connects
client.on('connected',(address,port)=> {
});

//event if chat message in a connected Channel appears
client.on('chat', (channel,user,message,self)=> {
    if(message==='hb titlecheck'){
        getTitle(process.env.GET_GAMES,AT,(response) =>{
            },channel)
    }
    if(message==='hb git'){
        client.say(channel , "Here you'll find my github repository Okayge 👉 https://github.com/helltf/helltfbot . Nevertheless it's Pepege Code  ");
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
        console.log('Status: ${res.statusCode}');
        var ob=JSON.parse(body);
        client.say(channel,ob.data[0].broadcaster_name+ "'s current streamtitle is: " + ob.data[0].title);
        callback(res);
    });
};
async function getLive(url,accessToken,callback,streamer){
    const LiveOptions = {
        url:process.env.GET_LIVE + streamer,
        method:'GET',
        headers:{
            'Client-ID':process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request.get(LiveOptions,(err,res,body)=>{
        if(err){
            return console.log(err);
        }
        callback(res,streamer);
    })
};

async function getGamebyID(url,accessToken,callback,gameid){
    const GIDOptions = {
        url:process.env.GET_GAME + gameid,
        method:'GET',
        headers:{
            'Client-ID':process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request.get(GIDOptions,(err,res,body)=>{
        if(err){
            return console.log(err);
        }
        var ob = (JSON.parse(res.body));
        CG=ob.data[0].name;
        return CG;
        callback(res);
    })
};

function initializeAT(url,callback){
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
async function connect(){
    try{
        console.log('init AT');
        await client.connect();
        console.log('client connected')
        await initData();
        console.log('init Data');
        setTimeout(()=>{
            refreshData();
        },1000)
    }
    catch(error){
        console.log(error);
    }
    setInterval(refreshData,5*1000);
    setInterval(initAT,3300000);
}

async function refreshData(){
    getLive(process.env.GET_GAMES,AT,(res,streamer) =>{
        var ob=JSON.parse(res.body);
        if(ob!=undefined){
            for(i=0;i<ob.data.length;++i){
                if(ob.data[i].display_name===streamer){
                    currentData = ob.data[i];
                    break;
                }
            }
            getGamebyID(process.env.GET_GAME,AT,(res)=>{
            },currentData.game_id)
            if(currentData.game_id!=OLDDATA.game_id){
                client.say('helltf','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 '+ currentData.display_name+' changed his game to ' + CG);
                client.say('anniiikaa','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 '+ currentData.display_name+' changed his game to ' + CG);
                OLDDATA=currentData;
            }
            else if(currentData.is_live!=OLDDATA.is_live){
                if(currentData){
                client.say('helltf','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 ' + currentData.display_name + ' went live PagMan');
                client.say('anniiikaa','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 ' + currentData.display_name + ' went live PagMan');
                OLDDATA=currentData;
                }
                else{
                    client.say('helltf','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 ' + currentData.display_name + ' went offline Sadge');
                    client.say('anniiikaa','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 ' + currentData.display_name + ' went offline Sadge');
                    OLDDATA=currentData;
                }
            }
            else if(currentData.title!=OLDDATA.title){
                client.say('helltf','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 '+ currentData.display_name +' changed his title to ' + currentData.title);
                client.say('anniiikaa','DinkDonk helltf flushedjulian anniiikaa pagshake pepegepaul einleo 👉 '+ currentData.display_name +' changed his title to ' + currentData.title);
                OLDDATA=currentData;
            }
        }},'papaplatte');
        console.log('data refreshed');
    }
function initAT(){
     initializeAT(process.env.TOKEN_URL,(res)=>{
        AT=res.body.access_token;
        console.log('initialized AT');
        return AT;
    })
}
async function initData(){
    await getInitLive(process.env.GET_GAMES,AT,(res,streamer)=>{
    },'papaplatte')
}  
async function getInitLive(url,accessToken,callback,streamer){
    const iLiveOptions = {
        url:process.env.GET_LIVE + streamer,
        method:'GET',
        headers:{
            'Client-ID':process.env.CLIENT_ID,
            'Authorization': 'Bearer ' + accessToken
        }
    };
    request.get(iLiveOptions,(err,res,body)=>{
        if(err){
            return console.log(err);
        }
       var ob =JSON.parse(res.body);
       for(i=0;i<ob.data.length;++i){
        if(ob.data[i].display_name===streamer){
            OLDDATA = ob.data[i];
            break;
        }
       }
        callback(res,streamer);
    })
};


initAT()
setTimeout(()=>{
    connect();
},2000)