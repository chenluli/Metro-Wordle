//缓存多份数据 根据选项直接调用 不用后台生成
var file={
	"stations":"data/sta2.json",
	"paths":"data/path2.json",
	"regions":"data/regions2.json",
	"pois":"data/task_data_520737.csv"
}

var option={
    "font-family":"ariel",
    "drawSprite":false,
    "drawBoundary":false,
    minBoxSize:4,
    rotate:0,
    fast:true,
}

//数据处理
d3.json(file.stations,function (e,dataS){
    d3.json(file.paths,function(e,dataP){
		d3.json(file.regions,function(e,regionsJson){
			d3.json(file.pois,function(e,poisArray){

			
			//数据预处理

			//todo 可用underscore函数将regionJson转换为array 还可改变region获取inners的方式，而不是作为judgeRegion副作用

			//处理完毕发送消息
		    

		   
		    
		    // console.log(regionsJson)
		    // eventHandler(regionsJson)

			})		    
		 })
	})
})


//todo 检查一下regionF第三个参数含义，是否应该是400
//todo 之后将region包装成对象
function regionProc(regionsJson,dataS,boundaryR){
	for(let regionid in regionsJson){
        let region=regionsJson[regionid];
        region.innerS=[]
        
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
            console.log(origin,k)
            origin[flag2]=origin0[flag2]+45*flag1*k;
            if(flag2==1) flag1*=-1;
            flag2=(flag2+1)%2;
            if(flag1===1 && flag2===1) k+=1;
        }
        
        [region.cx,region.cy]=origin;

        region.boundary= boundGenerator(regionF(region.edges, origin, 400), boundaryR, origin); //todo boundaryG改成返回一个和R有关的函数
        region.boundary.draw(d3.select("#regionIc").append("svg"));
    }

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
}


function poiDataProc(){
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
	  	})
	  	d.shop_scores.push({
	  		"score": parseFloat(mean.toFixed(1)),
	  		"score_title":"mean"
	  	})

	  	judgeRegion(d)
  });

  poisArray=poisArray.filter(function(d){return d.shop_scores.length===4});

  // A nest operator, for grouping the list. 
  var nestByCtgrz = d3.nest().key(function(d) { return d.shop_categories; }).entries(poisArray);
  var nestByCtgrzF=nestByCtgrz.filter(function(d){return d.values.length>20})

  var nestByRegion=d3.nest().key(function(d) { return d.regionid; }).entries(poisArray);

  console.log(poisArray[10])

  //触发数据加载完成事件
  judgeRegion(res,stations,regionsJson,dataS)
}

function judgeRegion(poi,stations,regionsJson,dataS){

    let distances=calcD(poi,stations);
    poi['regionid']=[]

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
        let flaga=rayCasting(poi,regionsJson[a],dataS);
        let flagb=rayCasting(poi,regionsJson[b],dataS);
        console.log(poi.shop_name,flaga,flagb)
        
        return -flaga+flagb;
    })

    poi.regionid=poi.regionid[0]
    regionsJson[poi.regionid].innerS.push(poi)
    
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

//确定每个词的权重



//计算词的总面积
function getWordSpace(wordDicts){
	var sum=0;
	// for(){
	// 	sum+=(wordDic.weight*baseSize*wordDic.word.length)*(wordDic.weight*baseSize);
	// }

	// return sum;
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

//将数据分组
