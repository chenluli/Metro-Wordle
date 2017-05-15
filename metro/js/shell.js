//生成页面框架+加载其他模块

var WIDTH=1510;//document.body.clientWidth;//为初始大小 后续会由document.documentElement.clientWidth+viewBox调整;
var HEIGHT=1210;//WIDTH*$("#main").height()/$("#main").width();

var PADDING=0;//20;
var linecolor=["#E4002B","#97D700","#FFD100","#5F259F","#AC4FC6","#D71671","#FF6900","#009EDB", "#71C5E8","#C1A7E2","#76232F","#007B5F","#EF95CF","","","#2CD5C4"];

var svgs=d3.selectAll("#main svg");

var legendVis=d3.select('#legend');


//todo svg主画布改成可伸缩的 实际大小可以很大，显示在页面上的为一个固定大小的窗口?->注意这样易导致文字重叠
(function initialLayout() {
    //mainVis 可伸缩
    for(let svg of svgs[0]){
        svg=d3.select(svg);
        if(svg.attr("id")==="legend") break;
        svg.attr("width",WIDTH).attr("height",HEIGHT);
        svg.attr('viewBox','50 -50 '+WIDTH+' '+HEIGHT);

        let height=$("#main").height()*0.95;
        let width=$("#main").width()*0.7;//height*WIDTH/HEIGHT;
        console.log(width,height);
        svg.attr("width",width).attr("height",height);
    }
    
    $("#sideBar").width($("#main").width()*0.3).height($("#main").height())
    
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
    legend(legendVis) ;

})();



$("#menu li").click(function (e) {

    if(e.target.innerHTML==="Origin"){
        originVis.style("display","block");
        $("#menu li").removeClass("selected");
        $(e.target).addClass("selected");
        wordleVis.style("display","none");
    }
    else{
        wordleVis.style("display","block");
        $("#menu li").removeClass("selected");
        $(e.target).addClass("selected");
        originVis.style("display","none");
    }
});


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

var query="美食$酒店$景点";
$("#query").click(function (e) {
    if(e.target.nodeName==="LI"){

        query=e.target.innerHTML;

        let button=$("#query button");
        $(e.target).text(button.text());
        button.html(query+"<i class=\"fa fa-caret-down\"></i>");
        if(query==="综合") query="美食$酒店$景点";
        queryClick.publish(query)
    }
});

//todo 增加等待图标指示
function waitLoad(){

}
//TODO  如果单词所属词云不同则应增加碰撞检测中相隔的最小间距
//TODO 单词在画布缩放后有重叠 （其画布缩放时字体大小也要自动计算(basefont)？？


//todo 引入wordlefilling 第一次点击tab标签时开始渲染 渲染后设标识位，之后直接切换display的方式，不再重新渲染
//todo 把联动响应也做成模块 不要再写一块儿了

window.addEventListener("resize", resizeHandler, false);
function resizeHandler(){

}

var onQueryChange = function(data) {//订阅者对象 
  // process data
  console.log(data);

   //只执行一次发布操作
  // arguments.callee.unsubscribe(queryClick);
  
};
onQueryChange.subscribe(queryClick);  

var onOriData = function(data){
    createOriginVis(data);
}
onOriData.subscribe(originData);

var onData = function(data){
    createFilter(data);
    drawPois(data.poisArray);
    createMetroWordle(data);
    console.log(data.regions);
    updateWordState(data.poisArray);
}
onData.subscribe(dataLoader);

//监听范围被选择事件
var onFilter=function(data){
    drawPois(data);
    updateWordState(data);
}
onFilter.subscribe(filterChange)

//监听tag被点击事件
var onctgClick=function(ctg){
    drawPois(ctg.values);
    updateWordState(ctg.values);
    filterInit(ctg.values);
}
onctgClick.subscribe(ctgClick)
