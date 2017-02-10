// d3.json("original.json",function (e,data) {
// 	createNode(data["stations"],svg1)
// 	createPath(data["paths"],svg1)
// })
//！！【下一步改进】：1.前后端交互 2.增加交互功能：添加要显示的标签。(是否可以允许用户自己调整位置？) 3.优化代码结构，模块化 4.目前是使用两份数据文件，是否需要合并为一个文件
 
var HEIGHT=1150
var WIDTH=1650
var PADDING=20
var linecolor=["#E4002B","#97D700","#FFD100","#5F259F","#AC4FC6","#D71671","#FF6900","#009EDB",
"#71C5E8","#C1A7E2","#76232F","#007B5F","#EF95CF","","","#2CD5C4"]
var images = new Array() 
var wordleControl=document.getElementById('wordleControl');
var wordleDict={};

//对该函数进行包装一下 调用起来更方便：传递一个文件便依此画出图
// d3.json("original.json",function (e,data){
//   for(var pathid in data["paths"]){
//     path=data["paths"][pathid]
//     startid=path["line"]+'s'+path["line_id_start"]
//     toid=path["line"]+'s'+path["line_id_to"]
//     console.log(startid,toid)
//     path["x1"]=data["stations"][startid]["x"]
//     path["y1"]=data["stations"][startid]["y"]
//     path["x2"]=data["stations"][toid]["x"]
//     path["y2"]=data["stations"][toid]["y"]
//   }
  
//   createPath(data["paths"],svg2);
//   createNode(data["stations"],svg2);
// })


d3.json("data/path.json",function (e,data){
  var svg=d3.select("#main").append("svg")
  svg.attr("width",WIDTH).attr("height",HEIGHT)
  createPath(data,svg);

  d3.json("data/sta.json",function (e,data){

    for(var x in data) {
      //为select添加option
      var option=document.createElement("option");  
      option.appendChild(document.createTextNode(data[x]['name']));  
      option.setAttribute("value",data[x]['name']);  
      document.getElementById('stations').appendChild(option);  

      if(data[x]['leader']['xj']){
        wordleDict[x]=[]

       //添加checkboxes
        var swithLable = document.getElementById('selectedS');
        var oli=document.createElement("li");
        var oCheckbox=document.createElement("input");
        oCheckbox.checked=true;
        var myText=document.createTextNode(data[x]['name']);
        oCheckbox.setAttribute("type","checkbox");
        oli.appendChild(oCheckbox);
        oli.appendChild(myText);

        swithLable.appendChild(oli);
        

        for(var i=1; i<Math.ceil(Math.random()*10)+5; i++){
           wordleDict[x].push(Math.random().toString(16).substr(2).slice(1,6))
        }
        
      } 
    }
      
      createNode(data,svg); 
      addLabels(data,svg);
      legend(svg) ; 
      //textLabel(data,svg)  
  })
})

//添加线路标签
var legend=function(svg){
    var legend=svg.append('g').attr('class','legend')
    var labels=legend.selectAll("rect").data(linecolor);

    labels.enter().append('rect')
          .attr('x',function(d,i){if(d!="")return 10})
          .attr('y',function(d,i){if(i==15)return 210; if(d!="")return 15*(i+1)})
          .attr('width',function(d,i){if(d!="")return 8})
          .attr('height',function(d,i){if(d!="")return 8})
          .attr('fill',function(d,i){if(d!=""){return d}})

    var texts=legend.selectAll("text").data(linecolor);
    
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
var createNode=function(data,svg){
	var stations=new Array();

	var lines=new Array(); 
	for(var i=1;i<17;i++) lines[i]=[]

	for(var x in data) {
		stations.push(data[x])
		lines[data[x]["line"]].push(data[x])
	}
	//console.log(lines)

	var circles=svg.append('g').attr('class','stations').selectAll("circle").data(stations);
  circles.attr("cx",function(d,i){return d["x"]+PADDING})
         .attr("cy",function(d,i){return d["y"]+PADDING})
         .attr("r",5)
         .attr('class',function(d){return 'line'+d['line']})
         .attr("fill",function(d){if(isNaN(d)) return 'gray';else return 'white';})
         .attr("stroke",function(d){if(isNaN(d)) return 'white';else return 'green';})
	circles.enter().append('circle')
				 .attr("cx",function(d,i){return d["x"]+PADDING})
         .attr("cy",function(d,i){return d["y"]+PADDING})
         .attr("r",5)
         .attr('class',function(d){return 'line'+d['line']})
         .attr("fill",function(d){if(isNaN(d)) return 'gray';else return 'white';})
         .attr("stroke",function(d){if(isNaN(d)) return 'white';else return 'green';})
       // .attr("transform","translate("+(PADDING.LEFT-xScale.rangeBand()/2-3.5)+","+PADDING.TOP+")");        
  }

//创建两站之间的路径
var createPath=function(data,svg){
	var paths=new Array();
  var lines=new Array(); 
  for(var i=1;i<17;i++) lines[i]=[];

	for(var x in data) {
    paths.push(data[x])
    lines[data[x]["line"]].push(data[x])
  }
  // console.log(line)

 	var links=svg.append('g').attr('class','paths').selectAll("line").data(paths);
 	selected=[];
  links.attr("x1",function(d){return d["x1"]+PADDING})
     .attr("y1",function(d){return d["y1"]+PADDING})
     .attr("x2",function(d){return d["x2"]+PADDING})
     .attr("y2",function(d){return d["y2"]+PADDING})
     .attr('class',function(d){return 'line'+d['line']})
     .attr("stroke-width",3)
     .attr("stroke",function(d){return linecolor[d["line"]-1]})
     .on('click',function(d){
      selected.push(d['line']);
      selectLines(selected);
    });

 	links.enter().append("line")
 	     .attr("x1",function(d){return d["x1"]+PADDING})
 		   .attr("y1",function(d){return d["y1"]+PADDING})
 		   .attr("x2",function(d){return d["x2"]+PADDING})
 		   .attr("y2",function(d){return d["y2"]+PADDING})
       .attr('class',function(d){return 'line'+d['line']})
 		   .attr("stroke-width",3)
       .attr("stroke",function(d){return linecolor[d["line"]-1]})
       .on('click',function(d){
        selected.push(d['line']);
        selectLines(selected);
      });

}

//添加文字标签【只能添加中间，为进行布局优化】
var textLabel=function(data,svg){
  var stations=new Array();
  for(var x in data) {
    stations.push(data[x])
  }
  var texts=svg.append('g').attr('class','stationName').selectAll("text").data(stations)
  console.log(stations)
  texts.text(function(d){return d["name"]})
          .attr('x',function(d,i){return d["x"]})
          .attr('y',function(d,i){return d["y"]})
          //.attr('dy',5)
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
}

//添加图片等大标签
var addLabels=function(data,svg){
    var labels=new Array();
    var stations=new Array();

    for(var x in data) {
      if(data[x]['leader']['xj']){
        labels.push(data[x]);
        stations.push(data[x])
      } 
    }

    createLeaders(labels,svg);
    //createImgs(stations,svg);
    createWordles(stations,svg);
}

var createLeaders=function(labels,svg){
    var line1=svg.append('g').attr('class','leaders').selectAll('line').data(labels);
    var line2=svg.select('.leaders').selectAll('line').data(labels);
    line1.attr('x1',function(d,i){return d['x']+PADDING})
         .attr('y1',function(d,i){return d['y']+PADDING})
         .attr('x2',function(d,i){return d['leader']['xj']+PADDING})
         .attr('y2',function(d,i){return d['leader']['yj']+PADDING})
         .attr('class',function(d){return 'line'+d['line']})
         .attr('stroke',"dimgray")
         .attr("stroke-width",2)
    line1.enter().append("line")
         .attr('x1',function(d,i){return d['x']+PADDING})
         .attr('y1',function(d,i){return d['y']+PADDING})
         .attr('x2',function(d,i){return d['leader']['xj']+PADDING})
         .attr('y2',function(d,i){return d['leader']['yj']+PADDING})
         .attr('class',function(d){return 'line'+d['line']})
         .attr('stroke',"dimgray")
         .attr("stroke-width",2)

    line2.attr('x1',function(d,i){return d['leader']['xj']+PADDING})
         .attr('y1',function(d,i){return d['leader']['yj']+PADDING})
         .attr('x2',function(d,i){return d['leader']['xp']+PADDING})
         .attr('y2',function(d,i){return d['leader']['yp']+PADDING})
         .attr('class',function(d){return 'line'+d['line']})
         .attr('stroke',"dimgray")
         .attr("stroke-width",2)
    line2.enter().append("line")
         .attr('x1',function(d,i){return d['leader']['xj']+PADDING})
         .attr('y1',function(d,i){return d['leader']['yj']+PADDING})
         .attr('x2',function(d,i){return d['leader']['xp']+PADDING})
         .attr('y2',function(d,i){return d['leader']['yp']+PADDING})
         .attr('class',function(d){return 'line'+d['line']})
         .attr('stroke',"dimgray")
         .attr("stroke-width",2)
}

var createImgs=function(stations,svg){
  var nodes_img = svg.append('g').attr('class','pictures').selectAll("image").data(stations);
  var rects = svg.append('g').attr('class','border').selectAll("rect").data(stations);

  nodes_img.attr("xlink:href",function(d){return 'imgs/'+d['name']+'.png';})
           .attr('x',function(d,i){return d['leader']["xp"]-d['leader']["picW"]/2+PADDING})
           .attr('y',function(d,i){return d['leader']["yp"]-d['leader']["picH"]/2+PADDING})
           .attr('class',function(d){return 'line'+d['line']})
           .attr("width",function(d){return d['leader']["picW"]})
           .attr("height",function(d){return d['leader']["picH"]})

  nodes_img.enter().append("image")
                   .attr('x',function(d,i){return d['leader']["xp"]-d['leader']["picW"]/2+PADDING})
                   .attr('y',function(d,i){return d['leader']["yp"]-d['leader']["picH"]/2+PADDING})
                   .attr('class',function(d){return 'line'+d['line']})
                   .attr("width",function(d){return d['leader']["picW"]})
                   .attr("height",function(d){return d['leader']["picH"]})
                   .attr("xlink:href",function(d){
                        return 'imgs/'+d['name']+'.png';
                    })

 // rects.attr('x',function(d,i){return d['leader']["xp"]-d['leader']["picW"]/2+PADDING})
 //           .attr('y',function(d,i){return d['leader']["yp"]-d['leader']["picH"]/2+PADDING})
 //           .attr('class',function(d){return 'line'+d['line']})
 //           .attr("width",function(d){return d['leader']["picW"]})
 //           .attr("height",function(d){return d['leader']["picH"]})
 //           .attr('fill','none')
                  // .attr('stroke','green')
                  // .attr('stroke-width','3')

  // rects.enter().append("rect")
  //                  .attr('x',function(d,i){return d['leader']["xp"]-d['leader']["picW"]/2+PADDING})
  //                  .attr('y',function(d,i){return d['leader']["yp"]-d['leader']["picH"]/2+PADDING})
  //                  .attr('class',function(d){return 'line'+d['line']})
  //                  .attr("width",function(d){return d['leader']["picW"]})
  //                  .attr("height",function(d){return d['leader']["picH"]})
  //                  .attr('fill','none')
                  // .attr('stroke','green')
                  // .attr('stroke-width','3')



                  // .on("mouseover",function(d,i){
                    //     //显示连接线上的文字
                    //     edges_text.style("fill-opacity",function(edge){
                    //         if( edge.source === d || edge.target === d ){
                    //             return 1.0;
                    //         }
                    //     });
                    // })
                    // .on("mouseout",function(d,i){
                    //     //隐去连接线上的文字
                    //     edges_text.style("fill-opacity",function(edge){
                    //         if( edge.source === d || edge.target === d ){
                    //             return 0.0;
                    //         }
                    //     });
                    // })  
}

var createWordles=function(stations,svg){
  
  //WordCloud(document.getElementById('my_canvas'),{ list: list ,'shape':'square'} );
  //调用cloudjs one(x,y,w,h,words):其中x,y是画图的中心坐标位置,w,h是画图的长宽,words是所需布局的词语列表
  var cloudW=160;
  var cloudH=160;


   for(var d in stations){
    var d=stations[d]
    var s=d['name']
    var svg1=svg.append("svg")
       .attr('x',d['leader']["xp"]-cloudW/2+PADDING)
      .attr('y',d['leader']["yp"]-cloudH/2+PADDING)
      .attr("width", cloudW)
      .attr("height", cloudH)
      .attr("id", 'vas'+s)
      //.attr('style','border:1px solid #cd0000;')

    one(cloudW/2,cloudH/2,cloudW,cloudH,wordleDict[s],svg1);
    
   }

  
  var wordles = svg.append('g').attr('class','pictures').selectAll(".wordle").data(stations);
  
  wordles.attr('x',function(d,i){return d['leader']["xp"]-d['leader']["picW"]/2+PADDING})
           .attr('y',function(d,i){return d['leader']["yp"]-d['leader']["picH"]/2+PADDING})
           .attr("width",function(d){return d['leader']["picW"]})
           .attr("height",function(d){return d['leader']["picH"]})
          

  // wordles.enter().append('svg')
  //         .attr('x',function(d,i){return d['leader']["xp"]-d['leader']["picW"]/2+PADDING})
  //         .attr('y',function(d,i){return d['leader']["yp"]-d['leader']["picH"]/2+PADDING})
  //         .attr("width",function(d){return d['leader']["picW"]})
  //         .attr("height",function(d){return d['leader']["picH"]})
  //         .attr('style','border:1px solid #cd0000')
  //         .attr("viewBox","0,0,400,400")
  //         .append(function(d,i){return d3.select('#vas'+d['name'])})
     
}

//选中线路 【还要加上legend的选中效果】
function selectLines(lines){
  if(lines.length){
    d3.select('#main').selectAll('line').attr('opacity','0.3')
    d3.select('#main').selectAll('image').attr('opacity','0.3')
    d3.select('#main').selectAll('circle').attr('opacity','0.3')//.style('visibility','hidden')
    d3.select('#main').select('.legend').attr('opacity','1')//.style('visibility','visible')
      for (i of lines){
        elements=d3.selectAll('.line'+i)
        elements.attr('opacity','1')//.style('visibility','visible')
      }
  }
}
 
//定义缩放行为
// var zoom = d3.behavior.zoom()
//           .scaleExtent([1, 10])
//           .on("zoom", zoomed);
// d3.select('svg').call(zoom)

// function zoomed() {
//       circles_group.attr("transform", 
//         "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
// }
// function preload() {  
//     for (i = 0; i < preload.arguments.length; i++) {  
//         images[i] = new Image()  
//         images[i].src = preload.arguments[i]  
//     }
//    // console.log(images)  
// }

//上传和下载
// d3.select('svg#chart')
// .call(downloadable());

//调用cloudjs one(x,y,w,h,words):其中x,y是画图的中心坐标位置,w,h是画图的长宽,words是所需布局的词语列表
// var fill = d3.scale.category20();
// var cloudW=200;
// var cloudH=200;
// var svg6=d3.select("body").append("svg")
//       .attr("width", cloudW)
//       .attr("height", cloudH)
//       .style({'border':'3px dashed blue'});
// one(cloudW/2,cloudH/2,cloudW,cloudH,
//   ["Hello", "world", "normally", "you", "want", "more", "words","than", "this",
//   "车站","嘉善路站","大木桥路站","9号线","12号线","嘉善路站","换乘站"],
//    svg6);


function one(x,y,w,h,words,svg){
  var fill = d3.scale.category20();
  var layout = d3.layout.cloud()
      .size([w, h])
      .words(words.map(function(d) {
        return {text: d, size: 5 + Math.random() * 10, test: "haha"};
      }))
      .padding(5)
      .rotate(function() { return ~~(Math.random() * 2) * 90; })
      .font("Impact")
      .fontSize(function(d) { return d.size; })
      .on("end", draw);

  layout.start();
  function draw(words) {
      svg.append("g")
        .attr("transform", "translate(" + x + "," + y + ")")
      .selectAll("text")
        .data(words)
      .enter().append("text")
        .style("font-size", function(d) { return d.size + "px"; })
        .style("font-family", "Impact")
        .style("fill", function(d, i) { return fill(i); })
        .attr("text-anchor", "middle")
        .attr("transform", function(d) {
          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
        })
        .text(function(d) { return d.text; });
  }
}


//js动态生成下拉框，并监听onchange事件
// function create() {
// document.getElementByIdx_x('select-btn').disabled=true;

// //模拟数据，写入select
// var buff = new Array(['one','1'],['two','2'],['there','3']);

// var el = document.getElementByIdx_x('select');
// var select = document_createElement_x('select');
// select.size = '1';//为下拉表select添加size属性
// select.id = 'select-id';//为下拉表select添加id属性

// //为select添加chang事件的监听
// select.addEventListener('change', function() {
// (function() {
// change(this,this.selectedIndex)
// }).call(select)
// })
// el.a(select);

// //将为select添加option
// for(var p in buff) {
// var option = document_createElement_x('option');
// select.options.add(option);
// option.value =buff[p][1];
// option.text = buff[p][0];
// }
// }

// //获取select选中的信息
// function change(sel,index) {
// var val = sel.options[index].value;
// var text = sel.options[index].text;
// alert(val);//选中的实际值
// alert(text);//选中的页面上的表现值
// }