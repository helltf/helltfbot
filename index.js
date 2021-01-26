require('dotenv').config();
const { TIMEOUT } = require('dns');
const request = require('request');
const { setInterval } = require('timers');

const tmi = require('tmi.js');

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
    channels:['helltf'],
};
const client= new tmi.Client(botoptions);

client.on('connected',(address,port)=> {
    
});
client.on('chat', (channel,user,message,self)=> {
    if(message==='TriHard'){
        //client.action(channel,'TriHard '+ user['display-name']);
        client.timeout(channel,user['display-name'],1,'no TriHard s allowed')
    }
    if(message==='hb titlecheck'){
        getGames(process.env.GET_GAMES,AT,(response) =>{
            },channel)
    }
    if(message.substring(0,12)==='hb livecheck'){
        var streamer = message.substring(13,message.length);
        getLive(process.env.GET_GAMES,AT,(response) =>{
        },channel,streamer)
    }
});
const getGames = (url,accessToken,callback,channel)=>{

    const gameOptions = {
        url:process.env.GET_GAMES,
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
        console.log('Status: {res.statusCode}');
        var ob=JSON.parse(body);
        client.say(channel,ob.data[0].broadcaster_name+ "'s current streamtitle is: " + ob.data[0].title);
    });
};
const getLive = (url,accessToken,callback,channel,streamer)=>{

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
        var ob=JSON.parse(body);
        let hit=0;
        if(ob!=undefined){
            for(i=0;i<ob.data.length;++i){
                if(ob.data[i].display_name===streamer){
                    client.say(channel, ob.data[i].is_live? ob.data[i].display_name +' is currently live FeelsAmazingMan': ob.data[i].display_name + ' is currently offline FeelsBadMan');
                    hit=1;
                    break;
                }
            }
            if(hit===0){
                client.say(channel,'no streamer found');
            }
        }
        else{
            client.say(channel,'invalid input');
        }
        });
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
        console.log('Status: ${res.statusCode');
        callback(res);
    });
};
async function connect(){
    await initAT();
    await initData();
    await client.connect();
    refreshData();

}
async function refreshData(){

}
async function initAT(){
    initializeAT(process.env.TOKEN_URL,(res)=>{
        AT=res.body.access_token;
        console.log('initialized AT');
        return AT;
    })
}
async function initData();
connect();

