//加载并处理数据,异步事件完成后再发送消息进行下一步


//监听tag被点击事件

//监听范围被选择事件

//属性数据判断 underscore库可用
//单词高亮 通过增减class
var gWIDTH=1510;//document.body.clientWidth;//为初始大小 后续会由document.documentElement.clientWidth+viewBox调整;
var gHEIGHT=1210;//WIDTH*$("#main").height()/$("#main").width();
var PADDING=0;

//todo mainVis会改变 可能是origin也可能是wordle
var mainVis=d3.select("#origin").attr("width",1500).attr("height",1200);
var poiVisg=mainVis.append("g").attr("class","pois");
var textG=mainVis.append("g").attr("class","text");

const linecolor=["#E4002B","#97D700","#FFD100","#5F259F","#AC4FC6","#D71671","#FF6900","#009EDB", "#71C5E8","#C1A7E2","#76232F","#007B5F","#EF95CF","","","#2CD5C4"];


function drawPois(data){
    let circles=poiVisg.selectAll("circle").data(data);
    
    //todo 不太对 应该把之前画得移除 不然白色会覆盖蓝色
    circles.exit().remove()  //.attr()

    circles.attr("cx",function(d,i){return d["x"]})
        .attr("cy",function(d,i){return d["y"]})
        .attr("r",5)
        .attr('class',function(d){return 'shop'+d.shop_id})
        .attr("fill","rgba(0,0,230,0.5)")
   
        // .classed(function (d) {console.log(d['name']);return d['name'];},true);
    circles.enter().append('circle')
        .attr("cx",function(d,i){return d["x"]})
        .attr("cy",function(d,i){return d["y"]})
        .attr("r",5)
        .attr('class',function(d){return 'shop'+d.shop_id})
        .attr("fill","rgba(0,0,230,0.5)")
    
}

//todo 注册成regions的函数 region的boundary为属性shape
function fillWordle(region){
    let edges=region['edges']
    option['boundary'] = region.boundary(400); //todo 注意boundary是与R有关的

    //todo exist应该是每个region的属性/全局变量,应缓存布局过的


    let pois=region['innerS']
    // option['boundary'] .draw(textG);
    

    //todo 改变一下算法：1.计算多少词多大字号（结合weight和region面积）合适，据此挑选要布局词 2.是否可以先在一个大的范围上布局再缩小
    wordList=[]
    let tags={};
    for(let poi of pois){
        wordList.push(poi.name)
        let tagArray=poi.detail_info.tag.split(";")
        for(let tag of tagArray){
            if(tag in tags){
                tags[tag]+=1;
            }   
            else{
                tags[tag]=0;
                wordList.unshift(tag);
            }
        }
        
    }

    region['words']=wordList;

    // wordle(wordList,option,textG,regionid);
    console.log(region.id);
}



d3.json("data/originpath.json",function (e,dataP){
  d3.json("data/originsta.json",function (e,dataS){

        let paths=[],stations=[];
        let lines=[1,2,3,4,5,6,7,8,9,10,11,12,13,16];//先直接写，后续动态获取

        //只要优化时选择的line
        for(let x in dataP) {
            dataP[x]["y1"]=1200-dataP[x]["y1"];
           dataP[x]["y2"]=1200-dataP[x]["y2"];
           if(lines.indexOf(dataP[x]["line"])!=-1){
            
            paths.push(dataP[x]);
           }
        }

        for(let x in dataS) {
            dataS[x]["y"]=1200-dataS[x]["y"];
          if(lines.indexOf(dataS[x]["line"])!=-1){
            
            stations.push(dataS[x]);
          }      
        }
        
        createMetroMap(mainVis,paths,stations);

    })
})

function createMetroMap(svg,paths,stations) {
    createPath(paths,svg);
    createNode(stations,svg);
    // textLabel(stations,svg);
    
}

let createPath=function(paths,svg){

    let links=svg.append('g').attr('class','paths').selectAll("line").data(paths);
    let selected=[];
    links.attr("x1",function(d){return d["x1"]+PADDING})
        .attr("y1",function(d){return d["y1"]+PADDING})
        .attr("x2",function(d){return d["x2"]+PADDING})
        .attr("y2",function(d){return d["y2"]+PADDING})
        .attr('class',function(d){return 'line'+d['line']})
        .attr("stroke-width",5)
        .attr("stroke",function(d){return linecolor[d["line"]-1]})
        .on('click',function(d){
            selected.push(d['line']);
            selectLines(selected);//todo 关于该事件的监听，可以和其他一起写
        });

    links.enter().append("line")
        .attr("x1",function(d){return d["x1"]+PADDING})
        .attr("y1",function(d){return d["y1"]+PADDING})
        .attr("x2",function(d){return d["x2"]+PADDING})
        .attr("y2",function(d){return d["y2"]+PADDING})
        .attr('class',function(d){return 'line'+d['line']})
        .attr("stroke-width",5)
        .attr("stroke",function(d){return linecolor[d["line"]-1]})
        .on('click',function(d){
            selected.push(d['line']);
            selectLines(selected);
        });

};

//todo 如何能添加的位置更好
let textLabel=function(stations,svg){
    let texts=svg.append('g').attr('class','stationName').selectAll("text").data(stations)
    texts.text(function(d){return d["name"]})
        .attr('x',function(d,i){return d["x"]})
        .attr('y',function(d,i){return d["y"]})
        .attr('dy',5)
        .attr('class',function(d){return 'line'+d['line']})
        .attr('font-size',12)
        .attr('fill',"black")
        .attr('rotate',"10")

    texts.enter().append("text")
        .text(function(d){return d["name"]})
        .attr('x',function(d,i){return d["x"]})
        .attr('y',function(d,i){return d["y"]})
        .attr('dy',5)
        .attr('class',function(d){return 'line'+d['line']})
        .attr('font-size',12)
        .attr('fill',"black")
        .style('rotate',"10")
};


//创建站点结点
let createNode=function(stations,svg){
    let circles=svg.append('g').attr('class','stations').selectAll("circle").data(stations);
    circles.attr("cx",function(d,i){return d["x"]+PADDING})
        .attr("cy",function(d,i){return d["y"]+PADDING})
        .attr("r",3)
        .attr('class',function(d){return 'line'+d['line']})
        .attr("fill",function(d){if(isNaN(d)) return 'white';else return 'white';})
        .attr("stroke",function(d){if(isNaN(d)) return 'gray';else return 'green';})
        // .classed(function (d) {console.log(d['name']);return d['name'];},true);
    circles.enter().append('circle')
        .attr("cx",function(d,i){return d["x"]+PADDING})
        .attr("cy",function(d,i){return d["y"]+PADDING})
        .attr("r",3)
        .attr('class',function(d){return 'line'+d['line']})
        .attr("fill",function(d){if(isNaN(d)) return 'white';else return 'white';})
        .attr("stroke",function(d){if(isNaN(d)) return 'gray';else return 'green';})
        // .classed(function (d) {console.log(d['name']);return d['name'];},true); //todo 如何添加class？
};

function eventHandler(regions){
    
    wordleSVG.addEventListener('click',function(e){
        //find the region that the user click
        let mouseX=e.clientX;
        let mouseY=e.clientY;
       
            let targetRegion;
            let targetRegionid;

            // d3.select('#box').attr('left',mouseX).attr('top',mouseY).attr("display","block");
            let box=document.querySelector('#box');
            box.style.display='block';
            
            for(let regionid in regions){
                let region=regions[regionid];

                if(isinRegion([mouseX,mouseY],region)){
                    targetRegionid=regionid;
                    targetRegion=region;
                    break;
                }
            }

            enlarge([mouseX,mouseY],targetRegion,targetRegionid);
            wordleSVG.style.opacity=0.3;
        
        
   })

    // wordleSVG.addEventListener('mouseout',function(e){

    //      $('#box').html(" ");//将之前画的清空
    //      d3.select('#box').attr('display','none');

    //      wordleSVG.style.opacity=1;
    // })

    document.querySelector("body").addEventListener('click',function(e){
        let mouseX=e.clientX;
        let mouseY=e.clientY;
        console.log(mouseX,mouseY)
        if(mouseX>1500 || mouseY>1200){
            // $('#box').html(" ");//将之前画的清空
            d3.select('#box').attr('display','none');
            for(let elem of d3.selectAll('.regionarea')[0]){
                // console.log(elem)
                elem.style.display='none'
            }

           wordleSVG.style.opacity=1;
        }
    })
}

function enlarge(origin,region,regionid){
 //todo 之后变成region的一个方法 region.enlarge
    let boundaryR=400;
    console.log(region)
    var option={
            "font-family":"ariel",
            "drawSprite":false,
            "drawBoundary":true,
            minBoxSize:4,
            rotate:0,
            fast:true,
        }
    
    let edges=region['edges'];
    // let origin=[region.cx,region.cy];
    
    let box=d3.select('#box').select('#region'+regionid);
    if(!box[0][0]){
        box=d3.select('#box').append('svg').attr('id',"region"+regionid).attr('class','regionarea');//放置放大后的
    
        box.attr('width',5*boundaryR)
           .attr('height',5*boundaryR)

        option['boundary']=boundGenerator(regionF(edges, origin, boundaryR), 2*boundaryR, origin);
        option['boundary'].draw(box);
        box[0][0].style.display='block';

        //在新的画布上放词（todo 若建立空间索引后，可以再为region添加exist属性，并放大后不用重新计算已经布局过的词的位置）
        wordle(region['words'],option,box,"tmp")
    }
    else{
        box[0][0].style.display='block';
    }
    

    

}