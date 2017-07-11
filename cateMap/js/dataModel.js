//缓存多份数据 根据选项直接调用 不用后台生成
var file={
	"stations":"data/sta2.json",
	"paths":"data/path2.json",
	"regions":"data/regions2.json",
	"pois":"data/poidata.csv",
	"originS":"data/originsta.json",
	"originP":"data/originpath.json",
    "keywords":"data/keywords.json",
    "clustered":"data/clustered.json"
}

var maxLon=121.9254676,minLon=121.0995216,maxLat=31.40999864,minLat=30.90948392;
var gWIDTH=1510;//document.body.clientWidth;//为初始大小 后续会由document.documentElement.clientWidth+viewBox调整;
var gHEIGHT=1210;//WIDTH*$("#main").height()/$("#main").width();
var PADDING=0;
var colorPannel={
    "面包甜点":"#CC9933",
    "火锅":"#993333",
    "其他":"#99CCCC",
    "tag":"#0066CC",
    "小吃快餐":"#CC9966",
    "日本菜":"#669966",
    "西餐":"#CC00FF",
    "本帮江浙菜":"#CC6666",
    "川菜":"#CC3333",
    "粤菜":"#CC99FF",
    "东南亚菜":"#CCCC66",
    "下午茶":"#66CC99",
    "湘菜":"#CC0033",
    "烧烤":"#CC6633",
    "韩国料理":"#669999",
    "咖啡厅":"#663300",
    "酒吧":"#CC00CC",
    "工作餐":"#99CC66",
}
var data={};
//add color legend
var $colorPannel=$("#categry"); //todo 之后用一个对象缓存所有选择器
(function colorLengendInit(ctgries){

    for(let key in colorPannel){
        renderButton(key)
    }
    $colorPannel.append("\<span class=\"button button-rounded ctg\"\>reset\</span\>")
    
    function renderButton(key){
        var btnHtml="\<span class=\"button button-small button-rounded button-primary ctg\"\>"
        +key
        // +"   \<button class=\"button button-tiny button-plain button-border button-circle\"\>\<i class=\"fa fa-close\" aria-hidden=\"true\"\"\>\</i\>\</button\>"
        +"</span>"
        ; 

        $colorPannel.append(btnHtml);

        $("#categry span:last-child").css("background",colorPannel[key])
                                .hover(function() {
                                    $( this ).addClass( "solast" );
                                  }, function() {
                                    $( this ).removeClass( "solast" );
                                });
    }
})(colorPannel)


//数据处理
d3.json(file.originP,function (e,originP){
    d3.json(file.originS,function (e,originS) {

        let opaths=[],ostations=[];
        let lines=[1,2,4,9];//先直接写，后续动态获取

        //只要优化时选择的line
        for(let x in originP) {
           originP[x]["y1"]=gHEIGHT-originP[x]["y1"];
           originP[x]["y2"]=gHEIGHT-originP[x]["y2"];
           if(lines.indexOf(originP[x]["line"])!=-1){
            
            opaths.push(originP[x]);
           }
        }

        for(let x in originS) {
          originS[x]["y"]=gHEIGHT-originS[x]["y"];
          if(lines.indexOf(originS[x]["line"])!=-1){
            
            ostations.push(originS[x]);
          }      
        }
        
        odata={
        	"paths":opaths,
        	"stations":ostations
        }
        originData.publish(odata);

	    d3.json(file.stations,function (e,dataS){
	      d3.json(file.paths,function(e,dataP){
			d3.json(file.regions,function(e,regionsJson){
				d3.csv(file.pois,function(e,poisArray){

				//数据预处理


	            [data.paths,data.stations]=processMetroData(dataP,dataS,regionsJson);
	            data.poisArray=poiDataProc(poisArray,ostations,regionsJson,originS);

				//todo 可用underscore函数将regionJson转换为array 
				//todo 改变region获取inners的方式，而不是作为judgeRegion副作用
	            
				
                d3.json(file.keywords,function(e,keywords){
                    var keywordsArray=[];
                    for(let key in keywords){
                        keywordsArray.push(keywords[key]);
                    }
                    for(let key in keywords){
                        let keyword=keywords[key];
                        for(let d of keyword){
                            d.x=(d.lon-minLon)/(maxLon-minLon)*gWIDTH//+PADDING;
                            d.y=gHEIGHT-((d.lat-minLat)/(maxLat-minLat)*gHEIGHT)//+PADDING;

                            judgeRegion(d,ostations,regionsJson,originS);
                            distortMap(d,regionsJson)
                          //  console.log(d)
                        }  
                    }

                    console.log("pois",poisArray)
                    poiHandler(keywords,poisArray);

                    d3.json(file.clustered,function(e,clustered){
                        var points=[];
                        for(let word in clustered){
                            let eachW=clustered[word];
                            let ctg=eachW[eachW.length-1];
                            // console.log(eachW)
                            for(let d of eachW){
                                if(typeof(d)==="string") continue;
                                d.name=word;
                                d.ctg=ctg;
                                [d.centroid[0],d.centroid[1]]= coordtransform.gcj02towgs84(parseFloat(d.centroid[0]),parseFloat(d.centroid[1]));
                                d.x=(d.centroid[0]-minLon)/(maxLon-minLon)*gWIDTH//+PADDING;
                                d.y=gHEIGHT-((d.centroid[1]-minLat)/(maxLat-minLat)*gHEIGHT)//+PADDING;
                                d.count=d.cluster.length;//todo 之后改成keyword中该词对应的所有的tag_count相加
                                d.idx=d.clusterInd;

                                judgeRegion(d,ostations,regionsJson,originS);
                                distortMap(d,regionsJson)
                                points.push(d);
                            }
                        }
                        console.log(points[10]);
                        
                        for(let p of points){
                            regionsJson[p.regionid].innerS.push(p);
                            // console.log(regionsJson[p.regionid].innerS)
                        }
                        regionProc(regionsJson,dataS,400);
                        data.regions=regionsJson;
                        //drawKeyword(points);

                        //处理完毕发送消息
                        dataLoader.publish(data)
                    })
                  })
				})		    
			 })
		   })
	     })   
    })
});


function processMetroData(dataP,dataS,regions){
    let paths=[],stations=[],sWithLabel=[];

    for(let x in dataP) {
        paths.push(dataP[x]);
    }

    for(let x in dataS) {
        stations.push(dataS[x]);
    }

    for(let x in regions){
        let region=regions[x];
        region['innerS']=[];
    }


    // for (let station of sWithLabel) {
    //     inRegion(station, regions);
    // }

    return [paths,stations];
}

/**
 * @description find each region has which label 回转数法判断点是否在多边形内部
 * @param sWithL
 * @param regions
 */
function inRegion(station, regions) {

        let leader=station['leader'];

        let px=leader['xp'],py=leader['yp'];

        for (let x in regions){//TODO 更改遍历的顺序，先检查包含station的？
            let sum=0;
            let edges=regions[x]['edges'];
            for(let edge of edges){

                let sx=edge['x1'],sy=edge['y1'],tx=edge['x2'],ty=edge['y2'];
                // 点与相邻顶点连线的夹角
                let angle = Math.atan2(sy - py, sx - px) - Math.atan2(ty - py, tx - px)

                // 确保夹角不超出取值范围（-π 到 π）
                if(angle >= Math.PI) {
                    angle = angle - Math.PI * 2
                } else if(angle <= -Math.PI) {
                    angle = angle + Math.PI * 2
                }

                sum += angle
            }
            if(Math.round(sum / (Math.PI*2))> 0){ //if 回转数不为0，则在多边形内
                regions[x]['innerS'].push(station);

               return regions[x];
            }
        }
}

//todo 检查一下regionF第三个参数含义，是否应该是400
//todo 之后将region包装成对象
//得到region中心点坐标,面积，边界,单词密度
function regionProc(regionsJson,dataS,boundaryR){

	for(let regionid in regionsJson){
        let region=regionsJson[regionid];
        
        let count=0;
        region["cx"]=0
        region["cy"]=0;
        for(let s of region['allS']){
            if(!dataS[s]) continue;
            region.cx+=dataS[s].x;
            region.cy+=dataS[s].y;
            count+=1;
        }
        region.cx/=count;   
        region.cy/=count;  

        let origin=[region.cx,region.cy]

        //todo !!要用isinregion检查是否真的在内部，不在的话，x和y每次+或-5来尝试，直到找到一个内部的点
        let originx0=origin[0],originy0=origin[1],flag1=-1,flag2=0,origin0=[originx0,originy0];
        let k=1;
        while(!isinRegion(origin,region) && k<=20){
            // if(region.stations.length<5) continue;
            // console.log(origin,k)
            origin[flag2]=origin0[flag2]+45*flag1*k;
            if(flag2==1) flag1*=-1;
            flag2=(flag2+1)%2;
            if(flag1===1 && flag2===1) k+=1;
        }
        
        [region.cx,region.cy]=origin;

        region.boundary= boundGenerator(regionF(region.edges, origin, 400), boundaryR, origin); //todo boundaryG改成返回一个和R有关的函数

        region.space=getRegionSpace(region);
        region.innerS=getInnerWords(region.innerS);
        region.heat=region.innerS.space/region.space;
	    // console.log(regionid,region.innerS.length)

    }
    console.log(regionsJson)
}

/**
* region边界的极坐标方程
* TODO 思考是否要将origin及其对应的方程写成region的属性
* @param edges
* @param origin
* @returns {regionfunc} 以origin为极点的边界上点的坐标函数 传入theta放回r
*/
function regionF(edges,origin,boundR){
    // console.log(region)
    for (let edge of edges){
        let x1=-origin[0]+edge['x1'],x2=-origin[0]+edge['x2'],y1=origin[1]-edge['y1'],y2=origin[1]-edge['y2'];
        edge['r1']= Math.sqrt(x1**2+y1**2);
        edge['theta1']=(x1===0)?(y1<0?Math.PI/2:Math.PI*3/2): (Math.atan(y1/x1)+(x1<0?1:2)*Math.PI)%(Math.PI*2); //Math.atan的范围-pi/2,pi/2;
        edge['r2']= Math.sqrt(x2**2+y2**2);

        edge['theta2']=(x2===0)?(y2<0?Math.PI/2:Math.PI*3/2): (Math.atan(y2/x2)+(x2<0?1:2)*Math.PI)%(Math.PI*2); //Math.atan的范围-pi/2,pi/2;
        edge['alpha']=((x1-x2)===0)?((y1-y2)<0?Math.PI/2:Math.PI*3/2): (Math.atan((y1-y2)/(x1-x2))+(((x1-x2))<0?1:2)*Math.PI)%(Math.PI*2) ;//记录直线与极轴的夹角 【注意不能用dir，因为可能不准】

        //记录每点的极坐标
        edge['range']=[];
        if(edge['theta1']<edge['theta2']) {
            edge['range'][0]=edge['theta1'];
            edge['range'][1]=edge['theta2'];
        }
        else if(edge['theta1']-edge['theta2']>Math.PI){
            edge['range'][0]=0;
            edge['range'][1]= edge['theta2'];
            edge['range'][2]= edge['theta1'];
            edge['range'][3]= Math.PI*2;
        }
        else{
            edge['range'][0]=edge['theta2'];
            edge['range'][1]=edge['theta1'];
        }

    }

    function regionfunc(theta){
        let intersecP=[] ;//TODO write into buffer??
        for(let edge of edges){
            // var maxR = Math.max( edge['func'](edge['theta1']),edge['func'](edge['theta2']) ) //用于将最大值归一？
            if(edge['range'].length===2){
                if(theta>edge['range'][0] && theta<=edge['range'][1] ){
                    let r=Math.abs(edge['r1']*Math.sin(edge['alpha']-edge['theta1'])/Math.sin(edge['alpha']-theta));
                    if(isFinite(r)) intersecP.push(r/400);
                    // if((theta-edge['range'][0])<0.001||(-theta+edge['range'][1])<0.001) console.log(r,theta,edge['range']);
                    // return r/400;
                }
            }
            else{
                if((theta>=edge['range'][0] && theta<=edge['range'][1])||(theta>=edge['range'][2] && theta<=edge['range'][3])){
                    let r=Math.abs(edge['r1']*Math.sin(edge['alpha']-edge['theta1'])/Math.sin(edge['alpha']-theta));
                    if(isFinite(r)) intersecP.push(r/boundR);
                }
            }
        }

        return intersecP;
    }
    return regionfunc;
}

function poiDataProc(poisArray,ostations,regionsJson,originS){
	poisArray.forEach(function(d, i) {
	  	d.shop_categories=JSON.parse(d.shop_categories)[2];
	  	d.shop_scores=JSON.parse(d.shop_scores);
	  	d.tags=JSON.parse(d.tags);
	  	d.shop_comment_num=parseInt(d.shop_comment_num);
	  	d.shop_spend=parseInt(d.shop_spend);
	  	//国测局坐标转wgs84坐标
	    [d.longitude,d.latitude]= coordtransform.gcj02towgs84(parseFloat(d.longitude),parseFloat(d.latitude));

	    d.x=(d.longitude-minLon)/(maxLon-minLon)*gWIDTH//+PADDING;
	    d.y=gHEIGHT-((d.latitude-minLat)/(maxLat-minLat)*gHEIGHT)//+PADDING;
	    
	    let mean=0;
	  	d.shop_scores.forEach(function(elem){
	  		elem.score=parseFloat(elem.score);
	  		mean+=elem.score/3;
	  	});
	  	d.shop_scores.push({
	  		"score": parseFloat(mean.toFixed(1)),
	  		"score_title":"mean"
	  	});

	  	if(d.shop_comment_num<100){
	  		d.weight=0.3; //最小字号：12；
	  	}
	  	else if(d.shop_comment_num>1000){
	  		d.weight=Math.min(1,(d.shop_comment_num-100)*0.0004+0.3).toFixed(2)
	  	}
	  	else {
	  		d.weight=Math.min(1,(d.shop_comment_num-100)*0.0005+0.3).toFixed(2)
	  	}
	  	if(isNaN(d.weight)) d.weight=0;

	  	judgeRegion(d,ostations,regionsJson,originS);
    });

    poisArray=poisArray.filter(function(d){return d.shop_scores.length===4});

    // A nest operator, for grouping the list. 
    console.log(poisArray[10])
    return poisArray;
}

//判断原地理位置下的所属区域及所在划分块
//为poi增加了regionid和relaX和relaY属性
function judgeRegion(poi,ostations,regionsJson,originS){

    let distances=calcD(poi,ostations);
    poi['regionid']=[];

    for(let regionid in regionsJson){
        let region=regionsJson[regionid]
        let allS=region["allS"];
        let edges=region['edges']

        if(allS.indexOf(distances[0]['station'])!==-1){

            let py=poi.y,px=poi.x;
            let sum=0;

            poi['regionid'].push(regionid);
        }
    }


    //判断是否真的在内部
    poi.regionid.sort(function(a,b){//todo 还是有问题!
        let flaga=rayCasting(poi,regionsJson[a],originS); //?
        let flagb=rayCasting(poi,regionsJson[b],originS);
        // console.log(poi.shop_name,flaga,flagb)
        return -flaga+flagb;
    })
    // console.log(poi.regionid)
    poi.regionid=poi.regionid[0];

    //原地理位置相对整个region的方位
    //todo 目前取的是整体的最大和最小，偏差可能较大
    let minX=2000,minY=2000,maxX=0,maxY=0;
    let alls=regionsJson[poi.regionid]['allS'];

    for(let s of alls){
        // console.log(s,originS,originS[s])
        if(typeof(originS[s]) == "undefined") continue;
        minX=Math.min(minX,originS[s].x);
        maxX=Math.max(maxX,originS[s].x);
        minY=Math.min(minY,originS[s].y);
        maxY=Math.max(maxY,originS[s].y);
    }
    poi.relaX=(poi.x-minX)/(maxX-minX);
    poi.relaY=(poi.y-minY)/(maxY-minY);

    //regionsJson[poi.regionid].innerS.push(poi)
    
    //判断point应归入哪个区域:将point与站点或edges的距离存起来, 找出最近的，再判断方位，从而得到所属区域
	//计算点离各边界的距离
	//注 station的数据为原始数据
	function calcD(poi,stations){
	   let distances=[];
	   for(let s of stations){
	       let d=Math.sqrt((s.x-poi.x)**2+(s.y-poi.y)**2);
	       distances.push({
	        "station":s['name'],
	        "d":d,
	        "dy":poi.y-s.y,
	        "dx":poi.x-s.x,//>0 <0
	       })
	   }

	   distances.sort(function(a,b){
	     return a["d"]-b["d"];
	   })

	   return distances;
	}

	//射线法判断是否在内
	 /**
	   * @description 射线法判断点是否在多边形内部
	   * @param {Object} p 待判断的点，格式:{ x: X坐标, y: Y坐标 }
	   * @param {Array} poly 多边形顶点，数组成员的格式同 p
	   * @return {String} 点 p 和多边形 poly 的几何关系
	*/
	function rayCasting(p, region,dataS) {
	    let px = p.x,
	        py = p.y,
	        flag1 =flag2=flag3=flag4= false

	    let edges=region['edges']
	    let paths=[]
	    for(let edge of edges){
	        if(!edge['paths']) continue;
	        for(let path of edge['paths']){
	            paths.push(path)
	        }
	    }

	    for(let path of paths) {
	      let s1=dataS[path["station_start"]], s2=dataS[path['station_to']]
	      if(!s1||!s2 ) continue;
	      let sx = s1.x,
	          sy = s1.y,
	          tx = s2.x,
	          ty = s2.y;

	        // if(p.name==="上海动物园" &&((s1.name==="虹桥路")||(s2.name==="虹桥路"))) console.log(px,py,s1,s2,sx,sy,tx,ty)


	      // 点与多边形顶点重合
	      if((sx === px && sy === py) || (tx === px && ty === py)) {
	        return 4;
	      }

	      // 判断线段两端点是否在射线两侧
	      if((sy < py && ((ty >py)||Math.abs(ty-py)<0.0001)) || (((sy >py)||Math.abs(sy-py)<0.0001) && ty < py)) {
	        // 线段上与射线 Y 坐标相同的点的 X 坐标
	        let x = sx + (py - sy) * (tx - sx) / (ty - sy)
	        
	        // 点在多边形的边上
	        if(x === px) {
	          return 4; //TRUE
	        }

	        // 射线穿过多边形的边界
	        //向右做射线 
	        if(x > px) {
	          flag1 = !flag1
	        }
	        if(x < px) {  //?
	          flag2 = !flag2
	        } 
	        // if(p.name==="上海动物园") console.log(px,py,s1,s2,sx,sy,tx,ty)

	       }

	        if((sx < px && tx >= px) || (sx >= px && tx < px)) {
	          let y= sy+(px-sx)*(ty-sy)/(tx-sx)
	          if(y === py) {
	            return 4; //TRUE
	          }

	          if(y > py) {
	              flag3 = !flag3
	            }
	          if(y < py) {
	              flag4 = !flag4
	          }

	        // if(p.name==="上海动物园") console.log(px,py,s1,s2,sx,sy,tx,ty)

	        }

	    }

	    // 射线穿过多边形边界的次数为奇数时点在多边形内
	    // console.log(p.name,flag1,flag2,flag3,flag4,region.allS)
	    return flag1+flag2+flag3+flag4
	}
}

//计算词的总面积,处理region内部的词
function getInnerWords(innerS){
	var sum=0;
	
	let wordDics=[];

    let maxCnt=0;
	for(let poi of innerS){	
        maxCnt=Math.max(maxCnt,poi.count);
	}

    for(let poi of innerS){ 
        let wordDic={};
        wordDic.word=poi.name.split("(")[0];

        wordDic.weight=Math.min(poi.count/maxCnt+0.25,1);//todo 改成非线性？;
        wordDic.origin=[poi.afterX,poi.afterY];
        wordDic.idx=poi.idx;
        
        // console.log(poi.ctg)
        if(poi.ctg in colorPannel){
           
           wordDic.color=colorPannel[poi.ctg]; 
        }
        else{
            wordDic.color=colorPannel["其他"]
        }

        wordDics.push(wordDic);
    }
    
    innerS=wordDics.filter(function(d){
        if(d.word){
           return (d.word.length<=5&&d.weight>0.3);  
        }
        else{
            return false;
        }
    });
    
    for(let wordDic of innerS){
        sum+=((wordDic.weight*option.baseSize*wordDic.word.length)*(wordDic.weight*option.baseSize));
    }
    // console.log(innerS,maxTagCnt,maxCtgCnt,sum)

	innerS.space=sum;

	return innerS;
}

//计算region的面积
function getRegionSpace(region){
    var edges=region.edges;
    var sum=0;
    for(let edge of edges){
    	sum+=(edge.x1*(-edge.y2)-edge.x2*(-edge.y1))//由于y坐标系反了
    }

    return sum/2;
}

//判断点是否在region中
function isinRegion(point, region){
    let sum=0;
    let edges=region['edges'];
    let px=point[0],py=point[1]
    for(let edge of edges){
        let sx=edge['x1'],sy=edge['y1'],tx=edge['x2'],ty=edge['y2'];
        // 点与相邻顶点连线的夹角
        let angle = Math.atan2(sy - py, sx - px) - Math.atan2(ty - py, tx - px)

        // 确保夹角不超出取值范围（-π 到 π）
        if(angle >= Math.PI) {
            angle = angle - Math.PI * 2
        } else if(angle <= -Math.PI) {
            angle = angle + Math.PI * 2
        }

        sum += angle
    }

    if(Math.round(sum / (Math.PI*2))> 0){ //if 回转数不为0，则在多边形内
       return true;
    }
    else{
        return false;
    }
}

//变形后到原图的位置映射关系
//todo 变形算法还比较粗糙 不应取整个区域的最大最小 而应该
function distortMap(poi,regionsJson){
    //得到region的边界方程
    // console.log(poi,regionsJson);
    let region=regionsJson[poi.regionid];
    let edges=region.edges;
    let minX=2000,minY=2000,maxX=0,maxY=0;

    for(let edge of edges){
        minX=Math.min(minX,edge.x1,edge.x2);
        maxX=Math.max(maxX,edge.x1,edge.x2);
        minY=Math.min(minY,edge.y1,edge.y2);
        maxY=Math.max(maxY,edge.y1,edge.y2);
    }

    poi.afterX=poi.relaX*(maxX-minX)+minX;
    poi.afterY=poi.relaY*(maxY-minY)+minY;
    //if(poi.regionid=="0") console.log(poi.afterX,poi.relaX,maxX,minX)
    // console.log(poi)
    //todo or 将区域分为很多很多小块 据此来变形 思考这种算法可行性

}

//在一次运行后保存wordle位置 下次直接从文件中读取，不再重新计算 似乎要到wordle函数里修改
function cacheWordle(){

}