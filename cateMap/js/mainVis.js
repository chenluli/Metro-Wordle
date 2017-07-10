var option={
    "font-family":"ariel",
    "drawSprite":false,
    "drawBoundary":false,
    minBoxSize:4,
    rotate:0,
    "baseSize":40,
    fast:true,
    color:'#3'+'369'[Math.floor(Math.random()*2)]+'9C'[Math.floor(Math.random()*2)],
}

//属性数据判断 underscore库可用
//单词高亮 通过增减class

//todo mainVis会改变 可能是origin也可能是wordle
var originVis=d3.select("#origin");
var wordleVis=d3.select("#wordle");
var poiVisg=originVis.append("g").attr("class","pois");
var keyWordVisg=originVis.append("g").attr("class","keyword");
var wordsG=wordleVis.append("g").attr("class","text").attr("transform", "translate(" + PADDING+","+PADDING + ")") ;
var wordCircleTip=d3.tip().attr("class", "d3-tip");
var poiTip=d3.tip().attr("class", "d3-tip");
keyWordVisg.call(wordCircleTip);
wordleVis.call(poiTip);

function drawPois(data){
    let circles=poiVisg.selectAll("circle").data(data);
    
    //todo 不太对 应该把之前画得移除 不然白色会覆盖蓝色
    circles.exit().remove() ; //.attr()

    circles.attr("cx",function(d,i){return d["x"]})
        .attr("cy",function(d,i){return d["y"]})
        .attr("r",5)
        .attr('class',function(d){return 'shop'+d.shop_id})
        .attr("fill","rgba(0,0,230,0.5)");
   
        // .classed(function (d) {console.log(d['name']);return d['name'];},true);
    circles.enter().append('circle')
        .attr("cx",function(d,i){return d["x"]})
        .attr("cy",function(d,i){return d["y"]})
        .attr("r",5)
        .attr('class',function(d){return 'shop'+d.shop_id})
        .attr("fill","rgba(0,0,230,0.5)")   
}

//画出推荐菜的聚类结果
function drawKeyword(data){
    let circles=keyWordVisg.selectAll("circle").data(data);
    
    //todo 不太对 应该把之前画得移除 不然白色会覆盖蓝色
    circles.exit().remove()  //.attr()
    
    circles.attr("cx",function(d,i){return d["x"]})
        .attr("cy",function(d,i){return d["y"]})
        .attr("r",function(d){return Math.min(25,d.count**0.5)})
        .attr("fill","rgba(230,0,0,0.5)")
   
        // .classed(function (d) {console.log(d['name']);return d['name'];},true);
    circles.enter().append('circle')
        .attr("cx",function(d,i){return d["x"]})
        .attr("cy",function(d,i){return d["y"]})
        .attr("r",function(d){return Math.min(25,d.count**0.5)}) //todo 具体的规则还要进一步确定
        .attr("fill","rgba(230,0,0,0.5)")
        .on("mouseover",function(d){
            //使用d3.tip
            wordCircleTip.html(function() {
                return d.name;
            });
            wordCircleTip.show();
        })
        .on("mouseout",function(){
            wordCircleTip.hide();
        })
        .on("click",function(data){
            var points=[];


            for(let d of data.cluster){
                [d[0],d[1]]= coordtransform.gcj02towgs84(parseFloat(d[0]),parseFloat(d[1]));
                d.x=(d[0]-minLon)/(maxLon-minLon)*gWIDTH//+PADDING;
                d.y=gHEIGHT-((d[1]-minLat)/(maxLat-minLat)*gHEIGHT)//+PADDING;
                points.push(d);
            }

            drawPois(points);
        })

    //点击clustered keyword触发事件：所有与之关联的地点位置出现并高亮
}

var　createOriginVis=function(data){
    createMetroMap(originVis,data.paths,data.stations);
}

var createMetroWordle=function(data){
    createMetroMap(wordleVis,data.paths,data.stations);
    
    let cachedata=[];
    for(let regionid in data.regions){
        let region=data.regions[regionid];


        fillWordle(region,regionid,cachedata);

       // break;
    }

    console.log(cachedata)
    createAndDownloadFile("cachedata.json",JSON.stringify(cachedata));
    wordleComplete.publish();

}

//todo 注册成regions的函数 region的boundary为属性shape
function fillWordle(region,regionid,cachedata){
    console.log(region)
    let edges=region['edges'];
    let boundaryR=400;
    option.boundary=region.boundary;

    //todo exist应该是每个region的属性/全局变量,应缓存布局过的
    let innerS=region['innerS']

    // option['boundary'] .draw(textG);
    

    //todo 改变一下算法：1.计算多少词多大字号（结合weight和region面积）合适，据此挑选要布局词 2.是否可以先在一个大的范围上布局再缩小
    var count=0;
    var wordToPut=[];
    option.baseSize=(region.heat<100)?option.baseSize:30;
    var maxHeat=(region.heat<100)?2:3;
    for(let wordDic of innerS){
        if(wordDic==="space" || count/region.space > maxHeat) break;
        count+=((wordDic.weight*option.baseSize*wordDic.word.length)*(wordDic.weight*option.baseSize));
        // if(!wordDic.uid) wordDic.color='#9'+'03'[Math.floor(Math.random()*2)]+'CF'[Math.floor(Math.random()*2)];
        wordDic.rotate=Math.floor(Math.random()*2)*Math.PI/2;
        wordToPut.push(wordDic);
    }
    
    wordToPut=wordToPut.filter(function(d){
        return d.word!==""&&d.word!=="非活动评论"&&d.word!=="其他"&& d.weight!==0;
    })
    // for(let word of wordToPut) console.log(word)
    // console.log(regionid,count/region.space)
    
    // console.log(option.rotate)
    let wordledata=wordle(wordToPut,option,wordsG,"region"+regionid);
    //todo 将所有wordledata存下来 之后直接加载 不重新计算布局了
    cachedata.push(wordledata)
    // for(let word of wordToPut){ //todo 为每个单词确定不同的布局起点
    //     //option.rotate=Math.floor(Math.random()*2)*Math.PI/2;
    //     //if(!word.uid) option.color=
    //     console.log(word)
    //     option['boundary'] = boundGenerator(regionF(edges, [region.x,region.y], boundaryR), 2*boundaryR, [region.x,region.y]); //todo 注意boundary是与R有关的
    //     wordle([word],option,wordsG,"region"+regionid);
    // }
    // 类别和tag的词还有问题，属性
    option.baseSize=40;
}

function zoomHandler(svg) {
    let zoom=d3.behavior.zoom()
        .scaleExtent([0.1, 10])
        .on("zoom",zoomed);

    svg.call(zoom);
    let isMouseDown,mousePos_x,mousePos_y,curPos_x,curPos_y;

    let viewBox_x=svg.attr('viewBox').split(' ')[0],viewBox_y=svg.attr('viewBox').split(' ')[1],width=svg.attr('viewBox').split(' ')[2],height=svg.attr('viewBox').split(' ')[3];
    console.log(width,height)
    let oldScale=1;

    svg.on("mousedown", function () {
        isMouseDown = true;
        mousePos_x = d3.mouse(this)[0];
        mousePos_y = d3.mouse(this)[1];
    });

    svg.on("mouseup", function () {
        isMouseDown = false;
        viewBox_x = viewBox_x - d3.mouse(this)[0] + mousePos_x;
        viewBox_y = viewBox_y - d3.mouse(this)[1] + mousePos_y;
        svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
    });

    svg.on("mousemove", function () {
        curPos_x = d3.mouse(this)[0];
        curPos_y = d3.mouse(this)[1];
        // d3.event.sourceEvent.stopPropagation();// silence other listeners 使拖拽行为优于缩放
        if (isMouseDown) {
            viewBox_x = viewBox_x - d3.mouse(this)[0] + mousePos_x;
            viewBox_y = viewBox_y - d3.mouse(this)[1] + mousePos_y;
            svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
        }
    });

    function zoomed() {
        if (oldScale !== d3.event.scale) {
            let scale = oldScale / d3.event.scale;
            oldScale = d3.event.scale;
            viewBox_x = curPos_x - scale * (curPos_x - viewBox_x);
            viewBox_y = curPos_y - scale * (curPos_y - viewBox_y);
            svg.attr("viewBox", viewBox_x + " " + viewBox_y + " " + width / oldScale + " " + height / oldScale);
        }
    }
}

/**
 * 创建并下载文件
 * @param  {String} fileName 文件名
 * @param  {String} content  文件内容
 */
function createAndDownloadFile(fileName, content) {
        var aTag = document.createElement('a');
        var blob = new Blob([content]);
        aTag.download = fileName;
        aTag.href = URL.createObjectURL(blob);
        aTag.click();
        URL.revokeObjectURL(blob);
}

function createMetroMap(svg,paths,stations) {
    var createPath=function(paths,svg){

        let links=svg.append('g').attr('class','paths').selectAll("line").data(paths);
        let selected=[];
        links.attr("x1",function(d){return d["x1"]+PADDING})
            .attr("y1",function(d){return d["y1"]+PADDING})
            .attr("x2",function(d){return d["x2"]+PADDING})
            .attr("y2",function(d){return d["y2"]+PADDING})
            .attr('class',function(d){return 'line'+d['line']})
            .attr("stroke-width",15)
            .attr("stroke",function(d){return linecolor[d["line"]-1]})
            // .attr("fill",function(d){return linecolor[d["line"]-1]})
            // .on('click',function(d){
            //     selected.push(d['line']);
            //     selectLines(selected);//todo 关于该事件的监听，可以和其他一起写
            // });

        links.enter().append("line")
            .attr("x1",function(d){return d["x1"]+PADDING})
            .attr("y1",function(d){return d["y1"]+PADDING})
            .attr("x2",function(d){return d["x2"]+PADDING})
            .attr("y2",function(d){return d["y2"]+PADDING})
            .attr('class',function(d){return 'line'+d['line']})
            .attr("stroke-width",12)
            .attr("stroke",function(d){return "#003366";})
            // .on('click',function(d){
            //     selected.push(d['line']);
            //     selectLines(selected);
            // });
    };

    //todo 如何能添加的位置更好
    var textLabel=function(stations,svg){
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
    var createNode=function(stations,svg){
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
            .attr("r",5)
            .attr('class',function(d){return 'line'+d['line']})
            .attr("fill",function(d){if(isNaN(d)) return 'white';else return 'white';})
            .attr("stroke",function(d){if(isNaN(d)) return 'gray';else return 'green';})
            // .classed(function (d) {console.log(d['name']);return d['name'];},true); //todo 如何添加class？
    };

    createPath(paths,svg);
    createNode(stations,svg);
    //textLabel(stations,svg);
    zoomHandler(svg);
}


function regionHandler(regions){  
    wordleVis.addEventListener('click',function(e){
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
            wordleVis.style.opacity=0.3;
        
        
   })

    // wordleVis.addEventListener('mouseout',function(e){

    //      $('#box').html(" ");//将之前画的清空
    //      d3.select('#box').attr('display','none');

    //      wordleVis.style.opacity=1;
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

           wordleVis.style.opacity=1;
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
            color:'#3'+'369'[Math.floor(Math.random()*2)]+'9C'[Math.floor(Math.random()*2)],
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

function updateWordState(data){
    
    let d3words=wordsG.selectAll("text");

    for(let word of d3words[0]){
       if(_.findWhere(data,{"shop_id":word.__data__.uid})){
          d3.select(word).classed("active",true);
          d3.select(word).classed("unactive",false);

       }
       else{
          d3.select(word).classed("unactive",true);
          d3.select(word).classed("active",false);
       }
       // console.log(_.findWhere(data,{"shop_id":word.__data__.uid}),data);

    }

    
    // words.exit().classed("unactive",true)  //.attr()
    // words.classed("active",true)
    // words.enter().classed("active",true) 
}


function poiHandler(keywords){
    document.querySelector("#wordle").addEventListener('click',function(e){
        //隐藏其他词 高亮（复制一遍）所选中的词
        document.querySelector("#wordle .text").style.opacity=0.3;
        console.log(e.target,keywords);

        $("#wordle").append(e.target) //todo 放入单独一个g中，每次只高亮一个
        let data=e.target.__data__;
        let pois=[];
        for(let idx of data.idx){
            pois.push(keywords[data.word][idx]);
        }

        //drawPois(pois);
        //显示与其相关的餐馆的点
        //为这些点也监听事件 --显示详情 todo 放到一个函数中
        //todo 绘制的点应先进行judgeregion和distort
        // distortMap(poi,regionsJson);
        console.log(pois)
        let circles=d3.select("#wordle").append('g').selectAll("circle").data(pois); //todo 后续更改：不能点击一次就加一个g，只增加一次
        
        circles.exit().remove()  //.attr()
        circles.enter().append('circle')
            .attr("cx",function(d,i){return d["afterX"]})
            .attr("cy",function(d,i){return d["afterY"]})
            .attr("r",5)
            .attr('class',function(d){return 'shop'+d.shop_id})
            .attr("fill","rgba(0,0,230,0.5)")
            .on('mouseover',function(d){

            }) 
            .on('mouseout',function(d) {
                // body...
            })
        
        
   })

}

// function stationEventHandler(sWithLabel,regions,dataS) {

//     let tooltip=$("#tooltip");
//     for(let stationgroup of document.querySelectorAll(".stations")) {
//         stationgroup.addEventListener("mouseover", function (e) {

//             if (e.target && e.target.nodeName == "circle") {
//                 d3.select(e.target).attr('r', '8');

//                 tooltip.css("visibility", 'visible');
//                 tooltip.html(e.target.__data__.name + "<br>Click to show more info. Press the \"Ctrl\" key to select multi stations");
//                 tooltip.css("left", (e.clientX + 15) + 'px');
//                 tooltip.css("top", (e.clientY + 15) + 'px');

//             }
//         });
//         stationgroup.addEventListener("mouseout", function (e) {
//             if (e.target && e.target.nodeName == "circle") {
//                 d3.select(e.target).attr('r', '6');
//                 tooltip.css("visibility", 'hidden');
//             }
//         });
//     }
//     document.querySelector("#vis .stations").addEventListener("click", function (e) {
//             if (e.target && e.target.nodeName == "circle") {
//                 let station = e.target.__data__;

//                 details.css("display","block");
//                 if (event.ctrlKey) {// 若按住ctrl时点击了station,则hiddable设为0，松开ctrl恢复为0
//                     station['hiddable'] = 0;
//                 }

//                 if (sWithLabel.indexOf(station) !== -1) { //是为了缓存已计算过的，不用重新算位置，但现在逻辑上还有误
//                     //切换已有worddle的显示状态即可 todo 不对?还是要判断nearby，应该是从缓存中取->或将其从sWithLable里移除（但这样效率会低一些）
//                     let wordle = document.querySelectorAll("." + station['name']);
//                     for (let elem of wordle) {
//                         if (elem.style.visibility === "hidden") {//todo 将visibility改成display
//                             elem.style.visibility = "visible";
//                             // exist.push()//todo 还是应该把word2Dinfo存起来
//                         }
//                         else if (!event.ctrlKey) {
//                             elem.style.visibility = "hidden";

//                             sWithLabel.splice(sWithLabel.indexOf(station), 1);

//                             let tmp = [];
//                             // console.log(exist);
//                             for (let word of exist) {
//                                 let i = exist.indexOf(word);
//                                 console.log(word.station, i, exist[i]) //todo why?? 是否为i未实现let功能 或者其他异步操作改变了exist
//                                 if (word.station === station['name']) {
//                                     tmp.push(i);
//                                 }
//                             }
//                             console.log(tmp, exist);
//                             exist = exist.filter(function (elem, index) {
//                                 if (tmp.indexOf(index) !== -1) return false;
//                                 else return true;
//                             });
//                             // for(let i of tmp){
//                             //exist.splice(i,1); //注意splice会改变exist的下标
//                             // }
//                             console.log(exist)
//                         }
//                     }

//                 }
//                 else {
//                     addAWordle(station, regions, dataS, sWithLabel);
//                 }
//             }
//         });


//     document.addEventListener('keyup',function (e) {
//         if(e.keyCode===17){//若松开了ctrl键，则把station的hiddable属性恢复为1
//             for(let x in sWithLabel) {
//                 sWithLabel[x]['hiddable'] = 1;
//             }
//         }
//     });
// }

// var details=$("#details");
// function wordEventHandler() {
//     let wordGroup = document.querySelector('#vis .text');
//     let tooltip=$("#tooltip");
//     wordGroup.addEventListener('mouseover', function (e) {
//         if (e.target && e.target.nodeName == "text") {
//             d3.select(e.target).style('font-size', parseFloat(e.target.style.fontSize) * 1.5 + 'px');
//             tooltip.css("visibility",'visible');
//             tooltip.html(
//                 $(e.target).text()+"<br>Click to show more details."
//             );

//             tooltip.css("left",(e.clientX+10)+'px');
//             tooltip.css("top",(e.clientY+10)+'px');
//         }
//     })

//     wordGroup.addEventListener('mouseout', function (e) {
//         if (e.target && e.target.nodeName == "text") {
//             d3.select(e.target).style('font-size', parseFloat(e.target.style.fontSize) / 1.5 + 'px');
//             tooltip.css("visibility",'hidden')
//         }
//     });

//     wordGroup.addEventListener('click', function (e) {
//         if (e.target && e.target.nodeName == "text") {
//             details.css("display","block");
//             $(e.target).css('background-color', 'white'); //todo 没效果
//         }
//     })
// }
// //选中线路 【还要加上legend的选中效果】
// function selectLines(lines){
//     if(lines.length){
//         d3.select('#main').selectAll('line').attr('opacity','0.3');
//         d3.select('#main').selectAll('image').attr('opacity','0.3');
//         d3.select('#main').selectAll('circle').attr('opacity','0.3');//.style('visibility','hidden')
//         d3.select('#main').select('.legend').attr('opacity','1');//.style('visibility','visible')
//         for (i of lines){
//             elements=d3.selectAll('.line'+i);
//             elements.attr('opacity','1');//.style('visibility','visible')
//         }
//     }
// }
