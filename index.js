var AWS = require('aws-sdk');
var docClient = new AWS.DynamoDB.DocumentClient();
var util = require('util');
var Twitter = require('twitter');


// ツイッターのキーとシークレットトークンを初期化（環境変数を使用）
var twitter = new Twitter({
    consumer_key: process.env['CONSUMER_KEY'],
    consumer_secret: process.env['CONSUMER_SECRET'],
    access_token_key: process.env['ACCESS_TOKEN_KEY'],
    access_token_secret: process.env['ACCESS_TOKEN_SECRET']
  })



exports.handler = function (event, context) {

    let length;

    var params = {
        TableName: 'tips',
        Select: "COUNT" // アイテム総数を返すパラメーター。コマンドであれば`aws dynamodb scan --table-name tips --select COUNT`
    };

    docClient.scan(params, function(err, data){
        if(err){
              console.log(err);
        }else{
            console.log('バカボンのママ');
            console.log('Scanデータは　' + util.inspect(data,false,null));  //結果：Scanデータは　{ Count: 90, ScannedCount: 90 }
            console.log('data["Count"]は　' + data["Count"]); //結果：data["Count"]は　90
            let count = data["Count"];
            getKai(count);
            console.log('countは、' + count);
            
        }
    });


    // countsテーブルから現在のnum値をゲット
    function getKai(count) {
        let length = count;

        let params = {
            TableName: 'counts',
            Key:{
                "id": 1,
            },
            "ProjectionExpression": "kai"
        }

        docClient.get(params, function(err, data) {
            if(err) {
                console.log(err);
            }else{
                console.log("成功 = " + JSON.stringify( data ));
                console.log(' data.Item.kai は ' + data.Item.kai);
                var kai = data.Item.kai;
                console.log('kai は ' + kai);

                callTipAndTweet(kai);

                if(kai >= length) { kai = 1; }else{ kai++;}
                console.log('++されたkai は ' + kai);
                console.log('lengthは、' + length)

                updateKai(kai);
            }
        })
    }

    function updateKai(kai) {
        let updatekai = kai;

        let params = {
            TableName: 'counts',
            Key:{
                "id": 1,
            },
            UpdateExpression: "SET kai = :k",
            ExpressionAttributeValues: { 
                ":k": updatekai
            }
        }
        
        docClient.update(params, function (err, data) {
            if (err) {
              console.log(err);
            } else {
              console.log('kaiデータは　' + data + 'にアップデートされました');
            }
          });   
    }

    // countsテーブルに格納した整数kaiを引数にtipsテーブルからid:kaiのTip文字列を獲得、それをツイート
    function callTipAndTweet(arg){
        var kai = arg;
        var params = {
            TableName: 'tips',
            Key: {                   // SQLのwhere条件文にあたるパラメーター。Keyの'K'は大文字であることに注意！
                'id': kai
            }
        };
        docClient.get(params, function(err,data) {
            if(err){
                console.log(err);
            }else{
                console.log('バカボンのパパ')
                var result = JSON.stringify(data.Item)
                console.log('data.Itemは　' + result);
                var result = JSON.parse(result);            
                console.log('tip文字列は　'　+ result.tip); 

                // ツイート自動投稿
                twitter.post('statuses/update', {status: result.tip}, (err, tweet, response)=> {
                    if(err) {
                        return console.log(err)
                    }else{
                        return console.log(tweet)
                    }
                })
            }
        })
    }
}