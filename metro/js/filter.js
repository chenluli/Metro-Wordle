
//todo 之后变成动态渲染，前端用模板填充数据，生成页面
var charWidth=150;
var chartHeight=50;
//regions 
//点击 事件触发
function drawRegionIcon(regions){
	var iconSvg=d3.select("#regionIc").append("svg").attr("width",1300).attr("height",1300)
	var posx=10,posy=10;
	for(let regionid in regions){
		let region=regions[regionid];
		let boundR=Math.floor(Math.sqrt(region.space/1600));
		if(boundR<25) boundR=25;
		var boundary= boundGenerator(regionF(region.edges, [region.cx,region.cy], 400), boundR, [posx,posy]); //todo boundaryG改成返回一个和R有关的函数
	    posx+=2*boundR;
	    if(posx>=280) {
	    	posx=10;
	    	posy+=50;
	    }
	    boundary.draw(iconSvg.append("g").attr("class","regIc"+regionid));
	}
}

//categories
//事件：点击是高亮 点叉是删除分类，重新布局
// <button class="button button-pill button-primary">火锅</button> 
// <button class="button button-small button-plain button-border button-circle"><i class="fa fa-trash-o"></i></button>
var $ctgContainer=$("#categry"); //todo 之后用一个对象缓存所有选择器
function ctgryInit(ctgries){

 	ctgries.forEach(function(elem){
 		renderButton(elem.key)
 	})
    
    $ctgContainer.append("\<span class=\"button button-rounded ctg\"\>reset\</span\>")


 	function renderButton(key){
 		var btnHtml="\<span class=\"button button-small button-rounded button-primary ctg\"\>"
 		+key
 		+"   \<button class=\"button button-tiny button-plain button-border button-circle\"\>\<i class=\"fa fa-close\" aria-hidden=\"true\"\"\>\</i\>\</button\>"
 		+"</span>"
 		; 

 		$ctgContainer.append(btnHtml);
 	}
}

	
var createFilter=function(data){
    //模块变量： 数据范围，数据属性
    poisArray=data.poisArray;
    var nestByCtgrz = d3.nest().key(function(d) { return d.shop_categories; }).entries(poisArray);
    var nestByCtgrzF=nestByCtgrz.filter(function(d){return d.values.length>200});

    var nestByRegion=d3.nest().key(function(d) { return d.regionid; }).entries(poisArray);
    ctgryInit(nestByCtgrzF);
    
    $ctgContainer.click(function(e){
		//如果点击的是span，则高亮选中类别
		
		if(e.target.nodeName==="SPAN"){
			var $selectCtg=$(e.target);
			var key=$selectCtg.text().trim();

			if(key==="reset"){
				$("#categry span").removeClass("selected");
                filterInit(poisArray);
			}
			else{
				$("#categry span").removeClass("selected");
		        $selectCtg.addClass("selected");
           
		        ctgClick.publish(_.where(nestByCtgrzF,{"key":key})[0]);
			}
		   
		}
		
       
		//如果删去 则改变数据 且更新整个地铁图
	})
                       

    filterInit(poisArray);
    // drawRegionIcon(data.regions)

}


function filterInit(poisArray){

  // Create the crossfilter for the relevant dimensions and groups.
  var pois,all,spend,spends,heat,heats,scoreAvg,scoreAvgs,scoreTaste,scoreTastes,scoreEnv,scoreEnvs,scoreServ,scoreServs;

  var pois = crossfilter(poisArray),
      all = pois.groupAll(),

      spend = pois.dimension(function(d) { return d.shop_spend; }),
      spends = spend.group(function(d) { return Math.floor(d / 5) * 5; }), //?

      heat = pois.dimension(function(d) { return d.shop_comment_num; }),
      heats = heat.group(function(d) { return Math.floor(d / 10) * 10; }),
     
      scoreAvg = pois.dimension(function(d) { return d.shop_scores[3].score; }),
      scoreAvgs = scoreAvg.group(),

      scoreTaste = pois.dimension(function(d) { return d.shop_scores[0].score; }),
      scoreTastes = scoreTaste.group(),

      scoreEnv = pois.dimension(function(d) { return d.shop_scores[1].score; }),
      scoreEnvs = scoreEnv.group(),

      scoreServ = pois.dimension(function(d) { return d.shop_scores[2].score; }),
      scoreServs = scoreServ.group();


  var charts = [

	    barChart()
	        .dimension(spend)
	        .group(spends)
	      .x(d3.scale.linear()
	        .domain([0, 500])
	        .rangeRound([0, charWidth])
	        ),

	    barChart()
	        .dimension(heat)
	        .group(heats)
	      .x(d3.scale.linear()
	        .domain([0, d3.max([2000])])
	        .rangeRound([0, charWidth])),

	    barChart()
	        .dimension(scoreAvg)
	        .group(scoreAvgs)
	      .x(d3.scale.linear()
	        .domain([6, 10])
	        .rangeRound([0, charWidth])),

	    barChart()
	        .dimension(scoreTaste)
	        .group(scoreTastes)
	      .x(d3.scale.linear()
	        .domain([6, 10])
	        .rangeRound([0, charWidth])),

	    barChart()
	        .dimension(scoreEnv)
	        .group(scoreEnvs)
	      .x(d3.scale.linear()
	        .domain([6, 10])
	        .rangeRound([0, charWidth])),

	    barChart()
	        .dimension(scoreServ)
	        .group(scoreServs)
	      .x(d3.scale.linear()
	        .domain([6, 10])
	        .rangeRound([0, charWidth])),
  ];

  // Given our array of charts, which we assume are in the same order as the
  // .chart elements in the DOM, bind the charts to the DOM and render them.
  // We also listen to the chart's brush events to update the display. todo 该事件触发还有其他模块会响应
  var chart = d3.selectAll(".chart")
      .data(charts)
      .each(function(chart) { chart.on("brush", renderAll).on("brushend", renderAll); });

  // Render the total.
  d3.selectAll("#total").text(pois.size());


  
   	
   	renderAll()



  // Renders the specified chart or list.
  function render(method) {
    d3.select(this).call(method);
  }

  // Whenever the brush moves, re-rendering everything.
  function renderAll() {
  	
    chart.each(render);
    d3.select("#active").text(all.value());

    //todo 可以改成发送事件 返回选中的数据 其他的模块监听该事件做出相应改变
    filterChange.publish(scoreAvg.top(Infinity))
    // drawPois(scoreAvg.top(Infinity))
  }
  
  function barChart() {
	    if (!barChart.id) barChart.id = 0;

	    var margin = {top: 10, right: 10, bottom: 20, left: 10},
	        x,
	        y = d3.scale.linear().range([chartHeight, 0]),
	        id = barChart.id++,
	        axis = d3.svg.axis().orient("bottom"),
	        brush = d3.svg.brush(),
	        brushDirty,
	        dimension,
	        group,
	        round;

	    function chart(div) {
	      var width = x.range()[1],
	          height = y.range()[0];

	      y.domain([0, group.top(1)[0].value]);

	      div.each(function() {
	        var div = d3.select(this),
	            g = div.select("g");
            

	        // Create the skeletal chart.
	        if (g.empty()) {
	          div.select(".title").append("a")
	              .attr("href", "javascript:reset(" + id + ")")
	              .attr("class", "reset")
	              .text("reset")
	              .style("display", "none");

	          g = div.append("svg")
	              .attr("width", width + margin.left + margin.right)
	              .attr("height", height + margin.top + margin.bottom)
	            .append("g")
	              .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	          g.append("clipPath")
	              .attr("id", "clip-" + id)
	            .append("rect")
	              .attr("width", width)
	              .attr("height", height);

	          g.selectAll(".bar")
	              .data(["background", "foreground"])
	            .enter().append("path")
	              .attr("class", function(d) { return d + " bar"; })
	              // .datum(group.all());

	          g.selectAll(".foreground.bar")
	              .attr("clip-path", "url(#clip-" + id + ")");

	          g.append("g")
	              .attr("class", "axis")
	              .attr("transform", "translate(0," + height + ")")
	              .call(axis);

	          // Initialize the brush component with pretty resize handles.
	          var gBrush = g.append("g").attr("class", "brush").call(brush);
	          gBrush.selectAll("rect").attr("height", height);
	          gBrush.selectAll(".resize").append("path").attr("d", resizePath);
	        }
            
            g.selectAll("path").datum(group.all())
	        // Only redraw the brush if set externally.
	        if (brushDirty) {
	          brushDirty = false;
	          g.selectAll(".brush").call(brush);
	          div.select(".title a").style("display", brush.empty() ? "none" : null);
	          if (brush.empty()) {
	            g.selectAll("#clip-" + id + " rect")
	                .attr("x", 0)
	                .attr("width", width);
	          } else {
	            var extent = brush.extent();
	            g.selectAll("#clip-" + id + " rect")
	                .attr("x", x(extent[0]))
	                .attr("width", x(extent[1]) - x(extent[0]));
	          }
	        }

	        g.selectAll(".bar").attr("d", barPath);
	      });

	      function barPath(groups) {
	        var path = [],
	            i = -1,
	            n = groups.length,
	            d;
	        while (++i < n) {
	          d = groups[i];
	          path.push("M", x(d.key), ",", height, "V", y(d.value), "h9V", height);
	        }
	        return path.join("");
	      }

	      function resizePath(d) {
	        var e = +(d == "e"),
	            x = e ? 1 : -1,
	            y = height / 3;
	        return "M" + (.5 * x) + "," + y
	            + "A6,6 0 0 " + e + " " + (6.5 * x) + "," + (y + 6)
	            + "V" + (2 * y - 6)
	            + "A6,6 0 0 " + e + " " + (.5 * x) + "," + (2 * y)
	            + "Z"
	            + "M" + (2.5 * x) + "," + (y + 8)
	            + "V" + (2 * y - 8)
	            + "M" + (4.5 * x) + "," + (y + 8)
	            + "V" + (2 * y - 8);
	      }
	    }

	    brush.on("brushstart.chart", function() {
	      var div = d3.select(this.parentNode.parentNode.parentNode);
	      div.select(".title a").style("display", null);
	    });

	    brush.on("brush.chart", function() {
	      var g = d3.select(this.parentNode),
	          extent = brush.extent();
	      if (round) g.select(".brush")
	          .call(brush.extent(extent = extent.map(round)))
	        .selectAll(".resize")
	          .style("display", null);
	      g.select("#clip-" + id + " rect")
	          .attr("x", x(extent[0]))
	          .attr("width", x(extent[1]) - x(extent[0]));
	      dimension.filterRange(extent);
	    });

	    brush.on("brushend.chart", function() {
	      if (brush.empty()) {
	        var div = d3.select(this.parentNode.parentNode.parentNode);
	        div.select(".title a").style("display", "none");
	        div.select("#clip-" + id + " rect").attr("x", null).attr("width", "100%");
	        dimension.filterAll();
	      }
	    });

	    chart.margin = function(_) {
	      if (!arguments.length) return margin;
	      margin = _;
	      return chart;
	    };

	    chart.x = function(_) {
	      if (!arguments.length) return x;
	      x = _;
	      axis.scale(x);
	      brush.x(x);
	      return chart;
	    };

	    chart.y = function(_) {
	      if (!arguments.length) return y;
	      y = _;
	      return chart;
	    };

	    chart.dimension = function(_) {
	      if (!arguments.length) return dimension;
	      dimension = _;
	      return chart;
	    };

	    chart.filter = function(_) {
	      if (_) {
	        brush.extent(_);
	        dimension.filterRange(_);
	      } else {
	        brush.clear();
	        dimension.filterAll();
	      }
	      brushDirty = true;
	      return chart;
	    };

	    chart.group = function(_) {
	      if (!arguments.length) return group;
	      group = _;
	      return chart;
	    };

	    chart.round = function(_) {
	      if (!arguments.length) return round;
	      round = _;
	      return chart;
	    };

	    return d3.rebind(chart, brush, "on");
  }

  window.filter = function(filters) {
    filters.forEach(function(d, i) { charts[i].filter(d); });
    renderAll();
  };

  window.reset = function(i) {
    charts[i].filter(null);
    renderAll();
  };

   for(let i in charts){
   		window.reset(i);
   	}
}


 
//按属性重排功能 sort by
// <span class="button-dropdown" data-buttons="dropdown">
//     <button class="button button-rounded">
//       Select Me <i class="fa fa-caret-down"></i>
//     </button>
 
//     <ul class="button-dropdown-list">
//       <li><a href="http://www.bootcss.com/">Option Link 1</a></li>
//       <li><a href="http://www.bootcss.com/">Option Link 2</a></li>
//       <li class="button-dropdown-divider">
//         <a href="#">Option Link 3</a>
//       </li>
//     </ul>
//   </span>
