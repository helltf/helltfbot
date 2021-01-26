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
var Olddata;
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
        var ob=JSON.parse(response.body);
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
        },streamer);
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
        callback(res);
    })
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
    try{
        request.post(options,(err,res,body)=>{
            if(err){
                return console.log(err);
            }
            console.log('Status: ${res.statusCode');
            callback(res);
        });
    }
    catch(error){
        console.log(error);
    }
};
async function connect(){
    await initAT();
    console.log('init AT');
    client.connect();
    setTimeout(()=>{
        initData();
        console.log('init Data');
        console.log()
        refreshData();
    },1000)
    setInterval(refreshData,5*1000);
    setInterval(initializeAT,3300000);

}
async function refreshData(){
    getLive(process.env.GET_GAMES,AT,(response) =>{
        var ob=JSON.parse(response.body);
        let hit=0;
        if(ob!=undefined){
            for(i=0;i<ob.data.length;++i){
                if(ob.data[i].display_name===streamer){
                    ob.data[i]=currentData;
                    break;
                }
            }
            if(hit===0){
                console.log('no streamer found');
            }
        }
        else{
            console.log(channel,'invalid input');
        }
        },'papaplatte');
        console.log('data refreshed');

    }
async function initAT(){
    await initializeAT(process.env.TOKEN_URL,(res)=>{
        AT=res.body.access_token;
        console.log('initialized AT');
        return AT;
    })
}
async function initData(){
    getGames(process.env.GET_GAMES,AT,(res)=>{
        let ob = JSON.parse(res.body);
        console.log(ob);
        Olddata=ob;
        return Olddata;
    })
}  
connect();
