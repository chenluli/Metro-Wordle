/**
 * Created by chenlu l on 2017/4/2 0002.
 */

//todo 因为加了站点名，加粗了线，因此需要使文字和border之间有一定距离


var WIDTH=1510;//document.body.clientWidth;//为初始大小 后续会由document.documentElement.clientWidth+viewBox调整;
var HEIGHT=1210;//WIDTH*$("#main").height()/$("#main").width();

const PADDING=0;//20;
const linecolor=["#E4002B","#97D700","#FFD100","#5F259F","#AC4FC6","#D71671","#FF6900","#009EDB", "#71C5E8","#C1A7E2","#76232F","#007B5F","#EF95CF","","","#2CD5C4"];

exist=[];

//生成页面框架
//todo svg主画布改成可伸缩的 实际大小可以很大，显示在页面上的为一个固定大小的窗口?->注意这样易导致文字重叠
(function initialLayout() {
    vis = d3.select("#vis"); //TODO 应该声明为全局变量吗？

    let svgs=d3.selectAll("#main svg");
    for(let svg of svgs[0]){
        svg=d3.select(svg);
        if(svg.attr("id")==="legend") break;
        svg.attr("width",WIDTH).attr("height",HEIGHT);
        svg.attr('viewBox','50 -50 '+WIDTH+' '+HEIGHT);

        let height=$("#main").height()*0.95;
        let width=$("#main").width()*0.8;//height*WIDTH/HEIGHT;
        console.log(width,height);
        svg.attr("width",width).attr("height",height);

        svg.append('g').attr('class','bubbles');
    }


    textGroup=vis.append("g").attr("class","text").attr("transform", "translate(" + PADDING+","+PADDING + ")") ;
})();

function processData(dataP,dataS,regions){
    let paths=[],stations=[],sWithLabel=[];

    for(let x in dataP) {
        paths.push(dataP[x]);
    }

    for(let x in dataS) {
        stations.push(dataS[x]);
        dataS[x]['hiddable']=1;

        if(dataS[x]['leader']['xj']){
            //todo 之后调整程序流程修改异步方式或阻塞程序的放到后面
            getWordDict(dataS[x]);
            //dataS[x]['wordDic']=getWordDict(dataS[x]);
           // console.log(dataS[x]['wordDic']);
            dataS[x]['rects']=[];
            sWithLabel.push(dataS[x]);
        }
    }

    for(let x in regions){
        let region=regions[x];
        region['innerS']=[];
    }


    for (let station of sWithLabel) {
        inRegion(station, regions);
    }

    return [paths,stations,sWithLabel];
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
originVis=d3.select("#origin");
noWordleVis=d3.select("#no-wordle");
d3.json("data/data.json",function (e,data) {
    let paths=[],stations=[],dataP=data["paths"],dataS=data["stations"];

    for(let x in dataP) {
        paths.push(dataP[x]);
    }

    for(let x in dataS) {
        stations.push(dataS[x]);
    }
    createMetroMap(originVis,paths,stations);
});

d3.json("data/allpath.json",function (e,dataP){
    d3.json("data/allsta.json",function (e,dataS) {
        let regions={};

        let [paths,stations,sWithLable]=processData(dataP,dataS,regions);
        createMetroMap(noWordleVis,paths,stations);
    })
});

$("#menu li").click(function (e) {

    if(e.target.innerHTML==="Origin"){
        originVis.style("display","block");
        $("#menu li").removeClass("selected");
        $(e.target).addClass("selected");
        vis.style("display","none");
        noWordleVis.style("display","none");
    }
    else if(e.target.innerHTML==="No-Wordle"){
        noWordleVis.style("display","block");

        $("#menu li").removeClass("selected");
        $(e.target).addClass("selected");
        vis.style("display","none");
        originVis.style("display","none");
    }
    else{
        vis.style("display","block");
        $("#menu li").removeClass("selected");
        $(e.target).addClass("selected");
        noWordleVis.style("display","none");
        originVis.style("display","none");
    }
});


//生成Metro-Wordle
d3.json("data/path.json",function (e,dataP){
  d3.json("data/sta.json",function (e,dataS) {
    d3.json("data/regions.json", function (e, regions) {
        //createPannel(dataS);
        //1.处理好path，data，regions数据
        let [paths,stations,sWithLable]=processData(dataP,dataS,regions);

        //2.绘制初始布局
        //2.1 绘制metroMap
        createMetroMap(vis,paths,stations);

        //2.2 绘制wordle初始
        let option={
            "font-family":"ariel",
            "drawSprite":false,
            // "drawBoundary":true,
            minBoxSize:4,
            baseSize:48,
        };

        //通过轮询处理异步
        function f() {
            let flag=1;
            for(let s of sWithLable){
                if(!s['wordDic']) flag=0;
            }
            if (!flag) {//if wordDic undefined
                setTimeout(f, 50);
            }
            else {
                addLabels(sWithLable,regions,option,vis);
            }
        }

        setTimeout(f,0);

        //3. 添加交互  todo worddic要改成wordinfo 不仅要存储权重，还要存是否绘制，uid，details等信息
        //3.1 站点相关交互: 点击站点获取找点wordDict ; 添加wordle
        stationEventHandler(sWithLable,regions,dataS);
        //3.2 wordle相关交互 : word的悬浮和点击，显示提示框和details
        wordEventHandler();


    })

})
});

//3.3 控制面板的联动
$(".button-dropdown").click(function (e) {
    e.preventDefault();
    if( $("#selection").css("display")==="block"){
        $("#selection").css("display","none");
    }
    else{
        $("#selection").css("display","block");
    }
});

$("#details i").click(function (e) {
    $("#details").css("display","none")
});

//todo 使用发布订阅模式，使得每次更改都更新页面相关信息
var query="美食$酒店$景点";
$("#filter").click(function (e) {
    if(e.target.nodeName==="LI"){

        query=e.target.innerHTML;

        let button=$("#filter button");
        $(e.target).text(button.text());
        button.html(query+"<i class=\"fa fa-caret-down\"></i>");
        if(query==="综合") query="美食$酒店$景点";
        //todo update other parts:vis
        $("#vis .text").html(" ");
        $("#vis .leaders").html(" ");
    }
});

function createMetroMap(svg,paths,stations) {
    createPath(paths,svg);
    createNode(stations,svg);
    //textLabel(stations,svg);
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
legend(d3.select('#legend')) ;

//创建站点结点
let createNode=function(stations,svg){
    let circles=svg.append('g').attr('class','stations').selectAll("circle").data(stations);
    circles.attr("cx",function(d,i){return d["x"]+PADDING})
        .attr("cy",function(d,i){return d["y"]+PADDING})
        .attr("r",6)
        .attr('class',function(d){return 'line'+d['line']})
        .attr("fill",function(d){if(isNaN(d)) return 'white';else return 'white';})
        .attr("stroke",function(d){if(isNaN(d)) return 'gray';else return 'green';})
        // .classed(function (d) {console.log(d['name']);return d['name'];},true);
    circles.enter().append('circle')
        .attr("cx",function(d,i){return d["x"]+PADDING})
        .attr("cy",function(d,i){return d["y"]+PADDING})
        .attr("r",6)
        .attr('class',function(d){return 'line'+d['line']})
        .attr("fill",function(d){if(isNaN(d)) return 'white';else return 'white';})
        .attr("stroke",function(d){if(isNaN(d)) return 'gray';else return 'green';})
        // .classed(function (d) {console.log(d['name']);return d['name'];},true); //todo 如何添加class？
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
        .attr("stroke-width",10)
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
        .attr("stroke-width",10)
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
        .attr('dy',20)
        .attr('class',function(d){return 'line'+d['line']})
        .attr('font-size',12)
        .attr('fill',"black")
        .attr('rotate',"10")

    texts.enter().append("text")
        .text(function(d){return d["name"]})
        .attr('x',function(d,i){return d["x"]})
        .attr('y',function(d,i){return d["y"]})
        .attr('dy',20)
        .attr('class',function(d){return 'line'+d['line']})
        .attr('font-size',12)
        .attr('fill',"black")
        .style('rotate',"10")
};

//添加大标签
//TODO metro svg and wordle are not complete match  have some offset->由于有padding的设置
//TODO 增加fontweight选项 允许自定义字体,找一些好看的适合用于文字云的字体，注意中英文都要能用
let addLabels=function(sWithLabels,regions,option,svg){
    createLeaders(sWithLabels,svg);
    createWordles(regions,option);

    function createLeaders(sWithLabels,svg){
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

    //todo 继续抽象出drawMultiOrigin等方法
    function createWordles(regions,option){
        let boundaryR = 400;
        for (let x in regions) {
            let region = regions[x];
            // console.log(region);
            let innerS = region['innerS'];
            if (!innerS.length) continue;
            let edges = region['edges'];

            let origin = [];

            let complete = [];// 保存已完成的站点
            let i = 0, flag = 0;
            while (1) {

                for (let s of innerS) {
                        if (s in complete) continue;
                        if (i >= s['wordDic'].length) {
                            // console.log(i,innerS);
                            flag++;
                            complete.push(s);
                            // delete  s;
                            // innerS.splice(innerS.index(s),1);
                        }
                        else {
                            origin[0] = s['leader']['xp'];
                            origin[1] = s['leader']['yp'];

                            option['boundary'] = boundGenerator(regionF(edges, origin, boundaryR), boundaryR, origin); //todo exist应该是每个region的属性/全局变量
                            // option['boundary'] .draw(textGroup);

                            let wordDraw = wordle(s['wordDic'].slice(i, i + 1), option, textGroup, s['name'], exist);

                            for (let word of wordDraw) {
                                s['rects'].push(word['box']);
                            }

                        }

                }

                i += 1;
                if (flag >= innerS.length) break;
            }

        }
    }

    for (let s of sWithLabels) {
        addBubble(s,sWithLabels);
    }

};

function addAlabel(station,regions,origin,sWithLabel) {
    let line=d3.select('#vis').append('line');
    station['leader']={};
    station['leader']["xp"]=origin['x'];
    station['leader']["yp"]=origin['y'];

    line.attr('x1',station['x']+PADDING)
        .attr('y1',station['y']+PADDING)
        .attr('x2',origin['x']+PADDING)
        .attr('y2',origin['y']+PADDING)
        .attr('stroke',"dimgray")
        .attr("stroke-width",2)
        .attr("class",station['name']);
    line[0][0].className=station['line']+" "+station['name'];

    let region=inRegion(station,regions);
    let option={
        "font-family":"ariel",
        "drawSprite":false,
        // "drawBoundary":true,
        minBoxSize:4,
        baseSize:60,
        boundary:boundGenerator(regionF(region['edges'],[origin.x,origin.y],400), 400, [origin.x,origin.y]),
    };

    getWordDict(station,query,2000);
    function f() {
        if (!station["wordDic"]) {//if wordDic undefined
            setTimeout(f, 50);
        }
        else {
            let wordDraw=wordle(station['wordDic'],option,textGroup,station['name'],exist);

            station['rects']=[];
            for(let word of wordDraw){
                station['rects'].push(word['box']);
            }

            addBubble(station,sWithLabel);
            sWithLabel.push(station);
        }
    }

    setTimeout(f,0);


}

//添加bubbleset todo 增加一个bubble时似乎不需要全部遍历一遍
function addBubble(s,sWithLable) {
    s['otherRects'] = [];
    for (let s2 of sWithLable) {
        if (s !== s2) {
            s['otherRects'] = s['otherRects'].concat(s2['rects']);
        }
    }

    let path = d3.select('.bubbles').append('path')[0][0];
    updateOutline(s['rects'], s['otherRects'], '#abdda4', path, s['name']) //'#edfecd'

    //=======bubbleset更新
    function updateOutline(rectangles, otherRectangles, color, path,station) {
        var pad =0;
        var bubbles = new BubbleSet();
        // console.log(rectangles,otherRectangles)
        var list = bubbles.createOutline(
            BubbleSet.addPadding(rectangles, pad),
            BubbleSet.addPadding(otherRectangles, pad),
            null /* lines */
        );
        // rectangles need to have the form { x: 0, y: 0, width: 0, height: 0 }
        // lines need to have the form { x1: 0, x2: 0, y1: 0, y2: 0 }
        // lines can be null to infer lines between rectangles automatically
        var outline = new PointPath(list).transform([
            new ShapeSimplifier(0.0),
            new BSplineShapeGenerator(),
            new ShapeSimplifier(0.0),
        ]);
        // outline is a path that can be used for the attribute d of a path element
        attr(path, {
            "d": outline,
            "opacity": 0.2,
            "fill":color,
            "stroke": "black",
            'class':station,
        });
        function attr(elem, attr) {
            for(let key in attr) {
                var value = attr[key];
                if(value === null) {
                    elem.removeAttribute(key);
                } else {
                    elem.setAttribute(key, value);
                }
            }
        }
    }
}

function stationEventHandler(sWithLabel,regions,dataS) {

    let tooltip=$("#tooltip");
    for(let stationgroup of document.querySelectorAll(".stations")) {
        stationgroup.addEventListener("mouseover", function (e) {

            if (e.target && e.target.nodeName == "circle") {
                d3.select(e.target).attr('r', '8');

                tooltip.css("visibility", 'visible');
                tooltip.html(e.target.__data__.name + "<br>Click to show more info. Press the \"Ctrl\" key to select multi stations");
                tooltip.css("left", (e.clientX + 15) + 'px');
                tooltip.css("top", (e.clientY + 15) + 'px');

            }
        });
        stationgroup.addEventListener("mouseout", function (e) {
            if (e.target && e.target.nodeName == "circle") {
                d3.select(e.target).attr('r', '6');
                tooltip.css("visibility", 'hidden');
            }
        });
    }
    document.querySelector("#vis .stations").addEventListener("click", function (e) {
            if (e.target && e.target.nodeName == "circle") {
                let station = e.target.__data__;

                details.css("display","block");
                if (event.ctrlKey) {// 若按住ctrl时点击了station,则hiddable设为0，松开ctrl恢复为0
                    station['hiddable'] = 0;
                }

                if (sWithLabel.indexOf(station) !== -1) { //是为了缓存已计算过的，不用重新算位置，但现在逻辑上还有误
                    //切换已有worddle的显示状态即可 todo 不对?还是要判断nearby，应该是从缓存中取->或将其从sWithLable里移除（但这样效率会低一些）
                    let wordle = document.querySelectorAll("." + station['name']);
                    for (let elem of wordle) {
                        if (elem.style.visibility === "hidden") {
                            elem.style.visibility = "visible";
                            // exist.push()//todo 还是应该把word2Dinfo存起来
                        }
                        else if (!event.ctrlKey) {
                            elem.style.visibility = "hidden";

                            sWithLabel.splice(sWithLabel.indexOf(station), 1);

                            let tmp = [];
                            // console.log(exist);
                            for (let word of exist) {
                                let i = exist.indexOf(word);
                                console.log(word.station, i, exist[i]) //todo why?? 是否为i未实现let功能 或者其他异步操作改变了exist
                                if (word.station === station['name']) {
                                    tmp.push(i);
                                }
                            }
                            console.log(tmp, exist);
                            exist = exist.filter(function (elem, index) {
                                if (tmp.indexOf(index) !== -1) return false;
                                else return true;
                            });
                            // for(let i of tmp){
                            //exist.splice(i,1); //注意splice会改变exist的下标
                            // }
                            console.log(exist)
                        }
                    }

                }
                else {
                    addAWordle(station, regions, dataS, sWithLabel);
                }
            }
        });


    document.addEventListener('keyup',function (e) {
        if(e.keyCode===17){//若松开了ctrl键，则把station的hiddable属性恢复为1
            for(let x in sWithLabel) {
                sWithLabel[x]['hiddable'] = 1;
            }
        }
    });
}

/**
 * cal and add a wordle on a station when it is clicked
 * todo 设置过渡效果，使其显示更自然
 * @param station,regions,stations
 */
function addAWordle(station,regions,stations,sWithLabel) {
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

    let labelR=35;
    while(labelR>15){//都遍历了一遍也没有，就缩小估算的rect再来一遍
        //尝试每个方向 探索位置 每个方向leader长度（，）
        for(let dir of dirs){
            for(let leaderL=100;leaderL<=300;leaderL+=20){
                // console.log(dir,leaderL)
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
                            // console.log(stations,bubble.className.baseVal);
                            if(stations[bubble.className.baseVal]['hiddable']){//若该nearby能隐藏掉
                                // 隐藏掉nearby
                                let wordle=document.querySelectorAll("."+bubble.className.baseVal);
                                for(let elem of wordle){
                                    elem.style.visibility="hidden";
                                }
                                //todo 将画布上的单词也从already里去掉
                                let station=stations[bubble.className.baseVal];
                                let tmp=[];
                                // console.log(exist);
                                for(let word of exist){
                                    let i=exist.indexOf(word);
                                    console.log(word.station,i,exist[i]) //todo why?? 是否为i未实现let功能 或者其他异步操作改变了exist
                                    if(word.station===station['name']){
                                        tmp.push(i);
                                    }
                                }
                               // console.log(tmp,exist);
                                exist=exist.filter(function (elem,index) {
                                    if(tmp.indexOf(index)!==-1) return false;
                                    else return true;
                                });
                               // for(let i of tmp){
                                    //exist.splice(i,1); //注意splice会改变exist的下标
                               // }
                              //  console.log(exist)

                            }
                            else nearby.push(bubble.className);
                        }
                    }
                }

                if(!nearby.length){//没有nearby 直接在origin上添加
                    addAlabel(station,regions,origin,sWithLabel);
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
                // console.log(edge,label);
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
var details=$("#details");
function wordEventHandler() {
    let wordGroup = document.querySelector('#vis .text');
    let tooltip=$("#tooltip");
    wordGroup.addEventListener('mouseover', function (e) {
        if (e.target && e.target.nodeName == "text") {
            d3.select(e.target).style('font-size', parseFloat(e.target.style.fontSize) * 1.5 + 'px');
            tooltip.css("visibility",'visible');
            tooltip.html(
                $(e.target).text()+"<br>Click to show more details."
            );

            tooltip.css("left",(e.clientX+10)+'px');
            tooltip.css("top",(e.clientY+10)+'px');
        }
    })

    wordGroup.addEventListener('mouseout', function (e) {
        if (e.target && e.target.nodeName == "text") {
            d3.select(e.target).style('font-size', parseFloat(e.target.style.fontSize) / 1.5 + 'px');
            tooltip.css("visibility",'hidden')
        }
    });

    wordGroup.addEventListener('click', function (e) {
        if (e.target && e.target.nodeName == "text") {
            details.css("display","block");
            $(e.target).css('background-color', 'white'); //todo 没效果
        }
    })
}
//生成下拉框等
function createPannel(data) {
    for(let x in data) {
        //为select添加option
        let option=document.createElement("li");
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
//todo 要采取异步编程??不然还未获得就返回了
//百度api http://lbsyun.baidu.com/index.php?title=webapi/guide/webservice-placeapi
//ak bRPsMMG6ZZl5Gj9Haivv0NefdClWgHk0
//e.g. http://api.map.baidu.com/place/v2/search?query=%E9%A4%90%E9%A6%86&location=31.11282503,121.3803799&coord-type=1&radius=2000&output=json&ak=bRPsMMG6ZZl5Gj9Haivv0NefdClWgHk0
function getWordDict(station,query="美食$酒店$景点",radius=2000) {

    if(station['wordDic']) return station['wordDic'];//station['wordDic']不存在才重新获取 todo之后使用本地存储存一点

    //若查询时间过长或参数过少，则返回default
    let defaultdic=[
        {"Hello":0.8},
        {"world":0.6}, "大木桥","9号线",
        "words","wolf", "车站","嘉善路站",
        {"换乘站":0.2}];
    // if(!arguments.length<3){
    //     return defaultdic;
    // }

    let locx=station.gpsy;
    let locy=station.gpsx;
    let api="http://api.map.baidu.com/place/v2/search?output=json&scope=2&filter=sort_name:distance|sort_rule:1&ak=bRPsMMG6ZZl5Gj9Haivv0NefdClWgHk0&coord-type=1&query="
        +encodeURIComponent(query)+"&location="+locx+","+locy+"&rasius="+radius;
    let words=[];

    //Ajax请求 todo 处理一下网络错误的情况
    $.ajax({
        type: "GET",
        dataType: 'jsonp',
        url: api,
        crossDomain : true,
        xhrFields: {
            withCredentials: true
        },
    })
        .done(function(data) {
            success(data);
        })
        .fail( function(xhr, textStatus, errorThrown) {
            console.log(xhr.responseText);
            console.log(textStatus);
            words=defaultdic;
        });

    function success(response) {
        let results=response['results'];
        //todo 研究一下能否得到排序/权重信息
        let i=0;
        for(let resl of results){
            let word={};
            let name=resl['name'].split('(')[0];
            word[name]=(1.1-0.1*i)*0.3+0.3//Math.random().toFixed(1)*0.4+0.2;
            words.push(word)
            i++;
        }

        station['wordDic']=words;
        //console.log(station['wordDic']);
    }

    //todo 将返回数据处理成wordDic,每个word要保留uid,便于用作detail模块
}



//todo 增加等待图标指示
//TODO  如果单词所属词云不同则应增加碰撞检测中相隔的最小间距
//TODO 单词在画布缩放后有重叠 （其画布缩放时字体大小也要自动计算(basefont)？？

var PubSub = {
    //订阅者角色
    subscribe : function(ev, callback){
        //创建_callback对象，除非它已经存在。
        var calls = this._callback || (this._callback = {});
        /*
         * 针对给定的事件ev创建一个数组，除非这个数组已经存在
         * 然后调用函数追加到这个数组中
         * */
        (this._callback[ev] || (this._callback[ev] = [])).push(callback);

        return this;
    },
    //发布者角色
    publish: function(){
        //将arguments对象转换成为真正的数组
        var args = Array.prototype.slice.call(arguments,0);
        //拿出第一个参数，即事件名称
        var ev = args.shift();

        /*
         * 如果不存在_callback对象，则返回
         * 或者如果不包含给定事件对应的数组
         * */
        var list, calls, i, l;
        if(!(calls = this._callback)) return this;
        if(!(list = this._callback[ev])) return this;

        //触发回调
        for(i = 0, l = list.length; i < l; i++){
            list[i].apply(this,args);
        }

        return this;
    }
};

//调用方式
// PubSub.subscribe("wem", function(){
//     alert("Wem");
// });
//
// PubSub.publish("wem");