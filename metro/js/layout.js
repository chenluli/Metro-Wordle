//MetroMap
const HEIGHT=1100;
const WIDTH=1650;//为初始大小 后续会由document.documentElement.clientWidth+viewBox调整;
const PADDING=20;
const linecolor=["#E4002B","#97D700","#FFD100","#5F259F","#AC4FC6","#D71671","#FF6900","#009EDB", "#71C5E8","#C1A7E2","#76232F","#007B5F","#EF95CF","","","#2CD5C4"];

function createMetroMap(svg,paths,dataS,stations,sWithLable) {
    createPath(paths,svg);
    createPannel(dataS);
    createNode(stations,svg);
    addLabels(sWithLable,svg);
    legend(svg) ; //todo 最好不要随着地铁图一起缩放和移动
    // textLabel(data,svg);

    stationEventHandler();
    zoomHandler(svg);
}

//定义缩放行为
//todo 添加滑块和上下左右回到起始按钮
//refer: http://www.cnblogs.com/xljzlw/p/3669543.html
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

function stationEventHandler() {
    document.querySelector(".stations").addEventListener("mouseover",function(e) {
        if(e.target && e.target.nodeName == "circle") {
            d3.select(e.target).attr('r','8')
        }
    });
    document.querySelector(".stations").addEventListener("mouseout",function(e) {
        if(e.target && e.target.nodeName == "circle") {
            d3.select(e.target).attr('r','6')
        }
    });

    document.querySelector(".stations").addEventListener("click",function(e) {
        if(e.target && e.target.nodeName == "circle") {

            if(event.ctrlKey){// 若按住ctrl时点击了station,则hiddable设为0，松开ctrl恢复为0
                e.target.__data__['hiddable']=0; //todo 还未初始化为1
            }

            if(sWLabel.indexOf(e.target.__data__)!==-1){
                //切换已有worddle的显示状态即可

            }
            else{
                addAWordle(e.target.__data__,regions,data)
            }
        }
    });

    document.addEventListener('keyup',function (e) {
        if(e.keyCode===17){//若松开了ctrl键，则把station的hiddable属性恢复为1

        }
    });
}

//添加线路图标
let legend=function(svg){
    let legend=svg.append('g').attr('class','legend')
    let labels=legend.selectAll("rect").data(linecolor);

    labels.enter().append('rect')
          .attr('x',function(d,i){if(d!="")return 10})
          .attr('y',function(d,i){if(i==15)return 210; if(d!="")return 15*(i+1)})
          .attr('width',function(d,i){if(d!="")return 8})
          .attr('height',function(d,i){if(d!="")return 8})
          .attr('fill',function(d,i){if(d!=""){return d}})

    let texts=legend.selectAll("text").data(linecolor);
    
    texts.text(function(d,i){if(d!="") return i+1; })
          .attr('x',25)
          .attr('y',function(d,i){if(i==15)return 210; if(d!="")return 15*(i+1)})
          .attr('dy',8)
          .attr('font-size',14)
          .attr('fill',function(d,i){if(d!=""){return d}})
          .attr('stroke',function(d,i){if(d!=""){return d}})

    texts.enter().append("text")
          .text(function(d,i){if(d!="") return i+1; })
          .attr('x',25)
          .attr('y',function(d,i){if(i==15)return 210; if(d!="")return 15*(i+1)})
          .attr('dy',8)
          .attr('font-size',14)
          .attr('fill',function(d,i){if(d!=""){return d}})
          .attr('stroke',function(d,i){if(d!=""){return d}})
}

//创建站点结点
let createNode=function(stations,svg){
    let circles=svg.append('g').attr('class','stations').selectAll("circle").data(stations);
    circles.attr("cx",function(d,i){return d["x"]+PADDING})
         .attr("cy",function(d,i){return d["y"]+PADDING})
         .attr("r",6)
         .attr('class',function(d){return 'line'+d['line']})
         .attr("fill",function(d){if(isNaN(d)) return 'white';else return 'white';})
         .attr("stroke",function(d){if(isNaN(d)) return 'gray';else return 'green';})
         .classed(function (d) {return d['name'];},true);
	circles.enter().append('circle')
          .attr("cx",function(d,i){return d["x"]+PADDING})
          .attr("cy",function(d,i){return d["y"]+PADDING})
          .attr("r",6)
          .attr('class',function(d){return 'line'+d['line']})
          .attr("fill",function(d){if(isNaN(d)) return 'white';else return 'white';})
          .attr("stroke",function(d){if(isNaN(d)) return 'gray';else return 'green';})
          .classed(function (d) {return d['name'];},true); //todo 确认下这种加class的方法是否正确

  };

//创建两站之间的路径
let createPath=function(paths,svg){

 	let links=svg.append('g').attr('class','paths').selectAll("line").data(paths);
 	let selected=[];
    links.attr("x1",function(d){return d["x1"]+PADDING})
         .attr("y1",function(d){return d["y1"]+PADDING})
         .attr("x2",function(d){return d["x2"]+PADDING})
         .attr("y2",function(d){return d["y2"]+PADDING})
         .attr('class',function(d){return 'line'+d['line']})
         .attr("stroke-width",4)
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
         .attr("stroke-width",4)
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
          .attr('y',function(d,i){return d["y"]+20})
          // .attr('dy',15)
          .attr('class',function(d){return 'line'+d['line']})
          .attr('font-size',5)
          .attr('fill',"black")
          .attr('rotate',"10")

  texts.enter().append("text")
       .text(function(d){return d["name"]})
       .attr('x',function(d,i){return d["x"]})
       .attr('y',function(d,i){return d["y"]})
       //.attr('dy',5)
       .attr('class',function(d){return 'line'+d['line']})
       .attr('font-size',3)
       .attr('fill',"black")
       .style('rotate',"10")
};

//添加大标签
//TODO metro svg and wordle are not complete match  have some offset->由于有padding的设置
let addLabels=function(sWithLabels,svg){
    createLeaders(sWithLabels,svg);
    // createWordles(sWithLabels,svg);

    let createLeaders=function(sWithLabels,svg){
        let line1=svg.append('g').attr('class','leaders').selectAll('line').data(sWithLabels);
        let line2=svg.select('.leaders').selectAll('line').data(sWithLabels);
        line1.attr('x1',function(d,i){return d['x']+PADDING}) //todo 考虑下一定要加PADDING吗，或者加在整体上 且wordle还没加似乎不匹配 这样不好，导致data数据和显示不匹配
            .attr('y1',function(d,i){return d['y']+PADDING})
            .attr('x2',function(d,i){return d['leader']['xj']+PADDING})
            .attr('y2',function(d,i){return d['leader']['yj']+PADDING})
            .attr('class',function(d){return 'line'+d['line']+' '+d['name']}) //todo 注意一下是两个还是一个
            .attr('stroke',"dimgray")
            .attr("stroke-width",2);
        line1.enter().append("line")
            .attr('x1',function(d,i){return d['x']+PADDING})
            .attr('y1',function(d,i){return d['y']+PADDING})
            .attr('x2',function(d,i){return d['leader']['xj']+PADDING})
            .attr('y2',function(d,i){return d['leader']['yj']+PADDING})
            .attr('class',function(d){return 'line'+d['line']+' '+d['name']})
            .attr('stroke',"dimgray")
            .attr("stroke-width",2);

        line2.attr('x1',function(d,i){return d['leader']['xj']+PADDING})
            .attr('y1',function(d,i){return d['leader']['yj']+PADDING})
            .attr('x2',function(d,i){return d['leader']['xp']+PADDING})
            .attr('y2',function(d,i){return d['leader']['yp']+PADDING})
            .attr('class',function(d){return 'line'+d['line']})
            .attr('stroke',"dimgray")
            .attr("stroke-width",2);
        line2.enter().append("line")
            .attr('x1',function(d,i){return d['leader']['xj']+PADDING})
            .attr('y1',function(d,i){return d['leader']['yj']+PADDING})
            .attr('x2',function(d,i){return d['leader']['xp']+PADDING})
            .attr('y2',function(d,i){return d['leader']['yp']+PADDING})
            .attr('class',function(d){return 'line'+d['line']})
            .attr('stroke',"dimgray")
            .attr("stroke-width",2);
    };
};

/**
 * cal and add a wordle on a station when it is clicked
 * todo 设置过渡效果，使其显示更自然
 * @param station
 */
function addAWordle(station,regions,data) {
    console.log(station);
    let tmp=[];
    for(let i=0;i<station['dir'].length;i++) {
        if( !isNaN(parseInt(station['dir'][i]))){
            tmp.push(parseInt(station['dir'][i]));
        }
    }
    station['dir']=tmp;

    let dirs=[];
    for (let i=0; i<8;i++){
        if(station['dir'].indexOf(i)=== -1){
            dirs.push(i);
        }
    }
    //按优先顺序，不同夹角不同优先级 todo 策略还要调整,region的大小和内部已有的个数也应作为判断依据
    dirs.sort(function (x,y) {
        let d1=[],d2=[];
        for(let i=0;i<station['dir'].length;i++){
            d1.push(Math.min(Math.abs(x-station['dir'][i]),8-Math.abs(x-station['dir'][i])));
            d2.push(Math.min(Math.abs(y-station['dir'][i]),8-Math.abs(y-station['dir'][i]))) ;
        }
        let d1min=Math.min.apply(null,d1);
        let d2min=Math.min.apply(null,d2);
        return -d1min+d2min;//由大到小排
    });

    let labelR=25;
    while(labelR>5){//都遍历了一遍也没有，就缩小估算的rect再来一遍
        //尝试每个方向 探索位置 每个方向leader长度（，）
        for(let dir of dirs){
            for(let leaderL=100;leaderL<=200;leaderL+=20){
                console.log(dir,leaderL)
                let origin={};//方向和station坐标共同决定
                switch (dir){
                    case 0: {
                        origin['x']=station['x']+leaderL;
                        origin['y']=station['y'];
                    }break;
                    case 1: {
                        origin['x']=station['x']+leaderL;
                        origin['y']=station['y']-leaderL;
                    }break;
                    case 2: {
                        origin['x']=station['x'];
                        origin['y']=station['y']-leaderL;
                    }break;
                    case 3:{
                        origin['x']=station['x']-leaderL;
                        origin['y']=station['y']-leaderL;
                    }break;
                    case 4:{
                        origin['x']=station['x']-leaderL;
                        origin['y']=station['y'];
                    }break;
                    case 5: {
                        origin['x']=station['x']-leaderL;
                        origin['y']=station['y']+leaderL;
                    }break;
                    case 6:{
                        origin['x']=station['x'];
                        origin['y']=station['y']+leaderL;
                    }break;
                    case 7: {
                        origin['x']=station['x']+leaderL;
                        origin['y']=station['y']+leaderL;
                    }break;
                }
                let labelRect={
                    'x':origin['x']-labelR,
                    'y':origin['y']-labelR,
                    'width':2*labelR,
                    'height':2*labelR,
                };
                let isOverlapFree=overlapFreeLine(labelRect,regions);
                if(!isOverlapFree) break; //若与线路有重叠则换下一个方向

                //不与铁路线重叠
                //判断是否有干扰-> 估算一个origin和rect，判断和wordle的bubble重叠的部分
                let bubbles=document.querySelectorAll('.bubbles path');
                let nearby=[];
                for (let bubble of bubbles){
                    let boundRect=bubble.getBBox();

                    if (boundRect.x + boundRect.width  > labelRect.x &&
                        labelRect.x + labelRect.width  > boundRect.x &&
                        boundRect.y + boundRect.height > labelRect.y &&
                        labelRect.y + labelRect.height > boundRect.y //重叠
                    ){
                        //计算重叠面积
                        let width=boundRect.x + boundRect.width  - labelRect.x;
                        let height=boundRect.y + boundRect.height  - labelRect.y;
                        let ratio=(width*height)/(labelRect.width*labelRect.height);
                        if(ratio>0.33){
                            console.log(data,bubble.className.baseVal)
                            if(data[bubble.className.baseVal]['hiddable']){//若该nearby能隐藏掉
                                // 隐藏掉nearby
                                // //todo 将画布上隐去的单词也从already里去掉 ->应变成region的属性

                            }
                            else nearby.push(bubble.className);
                        }
                    }
                }

                if(!nearby.length){//没有nearby 直接在origin上添加
                    //createALeader(); todo 把addALable变成一个函数
                    let line=d3.select('#main svg').append('line');
                    line.attr('x1',station['x']+PADDING)
                        .attr('y1',station['y']+PADDING)
                        .attr('x2',origin['x']+PADDING)
                        .attr('y2',origin['y']+PADDING)
                        .attr('stroke',"dimgray")
                        .attr("stroke-width",2);
                    line[0][0].className=station['line']+" "+station['name'];
                    // addWords();
                    return;
                }
            }
        }
        labelR-=2;
    }

    /**
     *是否与地铁线路重叠
     * @param label
     * @returns {number}
     */
    function overlapFreeLine(label,regions) {
        let already=[];

        function cross(recP1,recP2,edge) {
            let vec0={
                'x':recP2[0]-recP1[0],
                'y':recP2[1]-recP1[1],
            };
            let vec1={
                'x':edge['x1']-recP1[0],
                'y':edge['y1']-recP1[1],
            };
            let vec2={
                'x':edge['x2']-recP1[0],
                'y':edge['y2']-recP1[1],
            };
            let vec3={
                'x':edge.x1-edge.x2,
                'y':edge.y1-edge.y2,
            };
            let vec4={
                'x':-edge['x1']+recP1[0],
                'y':-edge['y1']+recP1[1],
            };
            let vec5={
                'x':-edge['x1']+recP2[0],
                'y':-edge['y1']+recP2[1],
            };

            //注意快速排斥实验不要遗漏

            if(Math.min(edge['x1'],edge['x2']) <= Math.max(recP1[0],recP2[0]) &&
                Math.min(recP1[0],recP2[0]) <= Math.max(edge['x1'],edge['x2']) &&
                Math.min(edge.y1,edge.y2) <= Math.max(recP1[1],recP2[1]) &&
                Math.min(recP1[1],recP2[1]) <= Math.max(edge.y1,edge.y2)){ //不能快速排斥

                // console.log(Math.min(edge['x1'],edge['x2']) <= Math.max(recP1[0],recP2[0]),edge['x1'],edge['x2'],recP1[0],recP2[0],(vec1.x*vec0.y-vec1.y*vec0.x)*(vec2.x*vec0.y-vec2.y*vec0.x));
                return ((vec1.x*vec0.y-vec1.y*vec0.x)*(vec2.x*vec0.y-vec2.y*vec0.x)<=0 && (vec4.x*vec3.y-vec4.y*vec3.x)*(vec5.x*vec3.y-vec5.y*vec3.x)<=0) ?1:0; //使用叉积的表z方向上分量的来判断线段与线段相交
            }
            else{
                return 0;
            }
        }

        for (let i in regions){
            let region=regions[i];
            for(let edge of region['edges']){
                console.log(edge,label);
                if(already.indexOf(edge['edgeid'])!==-1) continue;

                //矩形和线段不相交条件
                //todo 得出region后就不必每一节path都判断 python代码也可改下
                //线段是否在矩形内部
                if(Math.min(edge['x1'],edge['x2'])>=label.x&&
                    Math.max(edge['x1'],edge['x2'])<=label.x+label.width&&
                    Math.min(edge['y1'],edge['y2'])>=label.y&&
                    Math.max(edge['y1'],edge['y2'])<=label.y+label.width){
                    return 0;//说明重叠
                }
                else{//检查线段与矩形四边是否相交

                    if( cross([label.x,label.y],[label.x+label.width,label.y],edge) ||
                        cross([label.x+label.width,label.y],[label.x+label.width,label.y+label.height],edge) ||
                        cross([label.x+label.width,label.y+label.height],[label.x,label.y+label.height],edge) ||
                        cross([label.x,label.y+label.height],[label.x,label.y],edge)){ //至少一边相交

                        return 0;
                    }
                }

                already.push(edge['edgeid']);
            }
        }

        return 1;//不重叠

    }
}

//选中线路 【还要加上legend的选中效果】
function selectLines(lines){
  if(lines.length){
    d3.select('#main').selectAll('line').attr('opacity','0.3');
    d3.select('#main').selectAll('image').attr('opacity','0.3');
    d3.select('#main').selectAll('circle').attr('opacity','0.3');//.style('visibility','hidden')
    d3.select('#main').select('.legend').attr('opacity','1');//.style('visibility','visible')
      for (i of lines){
        elements=d3.selectAll('.line'+i);
        elements.attr('opacity','1');//.style('visibility','visible')
      }
  }
}

//生成下拉框等
function createPannel(data) {
  for(let x in data) {
    //为select添加option
    let option=document.createElement("option");
    option.appendChild(document.createTextNode(data[x]['name']));  
    option.setAttribute("value",data[x]['name']);  
    document.getElementById('stations').appendChild(option);  

    if(data[x]['leader']['xj']){
     //添加checkboxes
      let swithLable = document.getElementById('selectedS');//todo 注意别和sWLable弄混 或统一一下
      let oli=document.createElement("li");
      let oCheckbox=document.createElement("input");
      oCheckbox.checked=true;
      let myText=document.createTextNode(data[x]['name']);
      oCheckbox.setAttribute("type","checkbox");
      oli.appendChild(oCheckbox);
      oli.appendChild(myText);

      swithLable.appendChild(oli);
        
    } 
  }
}

let btn = document.querySelector('#bubble');
btn.onclick=function () {
    let paths=d3.select('.bubbles').selectAll('path');
    if(btn.innerHTML==="Bubble On"){
        paths.attr('opacity','0');
        btn.innerHTML="Bubble Off"
    }
    else{
        paths.attr('opacity','0.2');
        btn.innerHTML="Bubble On"
    }
};

//上传和下载
// d3.select('svg#chart')
// .call(downloadable());



/**
 * show tool tip when a station is hoverd
 */
function showTip() {

}

/**
 * show details when a word is clicked or click "details"
 */
function showDetails() {

}

//画出未经处理过得图
function drawBeforeProcess() {
    d3.json("original.json",function (e,data){
        for(let pathid in data["paths"]){
            path=data["paths"][pathid]
            startid=path["line"]+'s'+path["line_id_start"]
            toid=path["line"]+'s'+path["line_id_to"]
            path["x1"]=data["stations"][startid]["x"]
            path["y1"]=data["stations"][startid]["y"]
            path["x2"]=data["stations"][toid]["x"]
            path["y2"]=data["stations"][toid]["y"]
    }

    createPath(data["paths"],svg2);
    createNode(data["stations"],svg2);
    })
}


