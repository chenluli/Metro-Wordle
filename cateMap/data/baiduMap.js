
var superagent = require('superagent');
var async = require('async');
var fs=require('fs');
var coordtransform=require('coordtransform');
var EventProxy=require('eventproxy');
var nodejieba = require("nodejieba");

var token="bRPsMMG6ZZl5Gj9Haivv0NefdClWgHk0";
var region=encodeURIComponent("上海");
var query="景点";

var results=[];

(function(){
    "use strict"


    for(let i=0;i<20;i++){
        var api="https://api.map.baidu.com/place/v2/search?output=json&page_size=20&scope=2&filter=sort_name:default|sort_rule:0&coord-type=1&ak="+token
             +"&query="+encodeURIComponent(query)+"&page_num="+i+"&region="+region;
             //"&location="+locx+","+locy+"&rasius="+radius;

        superagent.get(api)
        // Http请求的Header信息
        // .set('Accept','text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8')
        // .set('Content-Type','json; charset=UTF-8')
        .set('Accept','json')
        // .set('User-Agent','Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.99 Safari/537.36')
        .end(function(err, res){
            // 请求返回后的处理

            var rlist=JSON.parse(res.text)["results"];
            let j=1;
            for(let result of rlist){
                result["rank"]=i*20+j;
                results.push(result)
                j++;
            }

            if(results.length===JSON.parse(res.text)["total"]){//已全部获取
                console.log("complete",results.length);
                results.sort(function(a,b){
                    return a['rank']-b['rank'];
                })

                var resultJSON={}//数据存储方式还需再衡量，注意使用json在js和python之间传递时，可能中文字符等存在问题
                var gWIDTH=1500,gHEIGHT=1200,maxLon=121.9254676,minLon=121.0995216,maxLat=31.40999864,minLat=30.90948392;
                let count=0;
                for(let res of results){
                    //console.log(res);
                    // console.log(res["name"],res["rank"])
                    let bdlon=res["location"]["lng"],bdlat=res["location"]["lat"];
                    //百度经纬度坐标转国测局坐标
                    let gcj02 = coordtransform.bd09togcj02(bdlon,bdlat);
                    //国测局坐标转wgs84坐标
                    let wgs84= coordtransform.gcj02towgs84(gcj02[0],gcj02[1]);
                    // console.log(bdlon,bdlat);
                    // console.log(wgs84,res["name"]);

                    res['x']=(wgs84[0]-minLon)/(maxLon-minLon)*gWIDTH//+PADDING;
                    res['y']=gHEIGHT-((wgs84[1]-minLat)/(maxLat-minLat)*gHEIGHT)//+PADDING;
                    let poiApi="http://api.map.baidu.com/place/v2/detail?uid="+res.uid+"&output=json&scope=2&ak="+token
                    resultJSON[res['name']]=res;

                    // console.log(resultJSON[res['name']]);
                    superagent.get(poiApi).set('Accept','json')
                    .end(function(err,res){

                        let result=JSON.parse(res.text)["result"];
                        //console.log(poiApi,count);
                        if(result){
                            count++;
                            let detail=result['detail_info'];
                            let descript=result['description'];
                            resultJSON[result['name']]['detail']=detail;
                            resultJSON[result['name']]['descript']=descript;
                            let keywords = nodejieba.extract($(descript).text(),10);
                            //todo 有些没有detail信息 则要从detail-info获取
                            for(let tag of detail["tag"].split(";")){
                                keywords.unshift(tag)
                            }
                            for(let reviewK of detail["di_review_keyword"]){
                                keywords.unshift(reviewK['keyword'])
                            }
                            if(){

                            }else{

                            }
                            resultJSON[result['name']]['descript']=keywords;
                            console.log(result.name,keywords,count);
                        }

                        if(count===400){
                            fs.writeFile("poiJSON.json", JSON.stringify(resultJSON), function (err) {
                                if (err) throw err;
                                console.log("Export pois Success!"+results.length);
                            });
                        }

                    })

                }

                


            }

        });

    }
})();




