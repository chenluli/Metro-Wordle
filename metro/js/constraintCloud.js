
var minBoxSize = 8;

function Tree(x, y, r, b) {
	    this.x = x;
	    this.y = y;
	    this.r = r;
	    this.b = b;
	    this.children = null;
}
     
// 递归地把形状的边界框分成更小的矩形，生成一棵由矩形框生成的树，其叶子节点包含单词的形状分块。
//The algorithm of BuildQuadTree from Copyright (c) 2013, Jason Davies, http://www.jasondavies.com/
// https://www.jasondavies.com/wordcloud/about/
// License: https://raw.github.com/jasondavies/d3-cloud/master/LICENSE
function makeTree(shape, x, y, r, b) {
    if (contains(shape, x, y, r, b)) {
      return new Tree(x, y, r, b);
    } 
    else if (intersects(shape, x, y, r, b)){//intersec is not FULLY_CONTAIN
      var cx = (x + r) >> 1,
          cy = (y + b) >> 1,
          tree = new Tree(x, y, r, b);
      if (r - x > minBoxSize || b - y > minBoxSize) {
      //generate 4 sub-box.foreach (sub-box b in boxlist) BuildRQTree(geometry, minGridLength, b)
        var children = [],
            c0 = makeTree(shape,  x,  y, cx, cy),
            c1 = makeTree(shape, cx,  y,  r, cy),
            c2 = makeTree(shape,  x, cy, cx,  b),
            c3 = makeTree(shape, cx, cy,  r,  b);
        if (c0) children.push(c0);
        if (c1) children.push(c1);
        if (c2) children.push(c2);
        if (c3) children.push(c3);
        if (children.length) tree.children = children;
      }
      return tree;
    }
    return null; //x,y,r,b为对角线上两顶点坐标
}

//遍历tree中的矩形转化为数组存储
function flatten(root) {
    var nodes = [];
    var leaf=[];
    // console.log(root)
    recurse(root, 0);
    return [nodes,leaf];

    function recurse(node, depth) {
      node.depth = depth;
      if (node.children) node.children.forEach(function(d) { recurse(d, depth + 1); });
      nodes.push(node);
      if(node.children===null) leaf.push(node);

    }
}
  
function contains(shape, x, y, r, b) {
    if (x < shape.x || y < shape.y || r >= shape.r || b >= shape.b) return false;
    x -= shape.x;
    y -= shape.y;
    r -= shape.x;
    b -= shape.y;
    var w = shape.r - shape.x,
        sprite = shape.sprite;

    for (var j=y; j<b; j++) {
      for (var i=x; i<r; i++) 
        if (!sprite[j * w + i]){
           return false;
        } 
    }

    return true;
}

function intersects(shape, x, y, r, b) {
    x = Math.max(0, x - shape.x);
    y = Math.max(0, y - shape.y);
    r = Math.min(shape.r, r) - shape.x;
    b = Math.min(shape.b, b) - shape.y;
    var w = shape.r - shape.x,
        sprite = shape.sprite;
    for (var j=y; j<b; j++) {
      for (var i=x; i<r; i++) if (sprite[j * w + i]) return true;
    }
    return false;
}

//得到word的四叉树形式
function getWordInfo(word,weight=0.5,baseSize=120){
	var fontSize=~~(baseSize*weight); //weight set to be 0.1~1.1
	var canvas = document.createElement("canvas"); 
	canvas.width = fontSize*10;
	canvas.height = fontSize*2;
	//document.querySelector("#mainVis").appendChild(canvas)
	var ctx = canvas.getContext("2d",{ willReadFrequently: true });
	var ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);//1px??
	ctx.font = ~~(fontSize / ratio) + "px "+word.fontStyle; //~~:取整
   
	var textW=Math.ceil(ctx.measureText(word).width);
	var textH = Math.ceil(Math.max(fontSize ,ctx.measureText('m').width,ctx.measureText('\uFF37').width));
	var boxH=Math.ceil(textH*1.5)

	var fillTextOffsetY =textH;
	ctx.fillText(word, 0, fillTextOffsetY); 
    
    //Get pixels of text
	function sprite(w, h) {
	    var pixels = ctx.getImageData(0, 0, w / ratio, h / ratio).data,
	        sprite = [];
	    for (var i = w * h; --i >= 0;) sprite[i] = pixels[(i << 2) + 3];
	    return sprite;
	}

	function textTree() {
		var shape={
			sprite: sprite(textW, boxH), 
			x: 0, y: 0, 
			r: textW, b: boxH,
		}
	    return makeTree(shape, 0, 0, textW, boxH);
	}

    var textTree=textTree()
    var array=flatten(textTree)
    // console.log(array[0])
	return{
    	text: word,
    	fontSize:fontSize,
    	width:textW,
    	height:textH,
    	tree: textTree,
    	treeArray: array[0],
    	leafArray: array[1],
    }
}

//将所有文字一次性画在SVG上，可选择是否显示sprite
function draw(wordInfo,w,h,sprite=true) {
    var wordDraw=wordInfo.filter(function(elem){return elem['fit']}); //过滤掉不能放上的

	var textGroup=vis.append("g").attr("class","text")
    var g = textGroup.selectAll("g")
        .data(wordDraw)
        .attr("pointer-events", "all");

    g.enter().append("g")
        .attr("transform", function(d) { return "translate(" + d.position + ")"; }) //textBox相对svg的位置
        .call(d3.behavior.drag()
          .origin(function(d) { return {x: d.position[0], y: d.position[1]}; })
          .on("drag", function(d) {
            d.position = [Math.max(0, Math.min(w - d.width, d3.event.x)), Math.max(0, Math.min(h - d.height, d3.event.y))];
            d3.select(this)
                .attr("transform", function(d) {return "translate(" + d.position + ")"; });
            //collide();

          })
        )
      .append("text")
        .attr("x", 0) 
        .attr("y", function(d){return d.height}) 
        .style("font-size", function(d){return d.fontSize+"px"})
        .style("font-family",function(d){return d.fontStyle} )
        .attr("fill",function(d){return d.color} ) 
        .attr("pointer-events", "all")

    g.select("text").text(function(d) { return d.text; });

 if(sprite){
 	var rect = g.selectAll("rect")
        .data(function(d) {return d.treeArray; });
    rect.enter().append("rect");
    rect.exit().remove();
    rect.attr("width", function(d) {return d.r - d.x; })
        .attr("height", function(d) { return d.b - d.y; })
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .style("stroke-width", function(d) { return 2 - d.depth / 2; });
 }   
}

//!为什么不能一个个更新 而是所有画完才显示?
function drawOneWord(word,w,h,sprite=true) { 
    var g = textGroup.append("text")
        .attr("pointer-events", "all")
        .attr("transform", "translate(" + word.position + ")") //textBox相对svg的位置
        // .call(d3.behavior.drag()
        // 	.origin(function(d) { return {x: d.position[0], y: d.position[1]}; })
        //   .on("drag", function(d) {
        //     d.position = [Math.max(0, Math.min(w - d.width, d3.event.x)), Math.max(0, Math.min(h - d.height, d3.event.y))];
        //     d3.select(this)
        //         .attr("transform", function(d) {return "translate(" + d.position + ")"; });
        //     //collide();

        //   })
        // )
        .attr("x", 0) 
        .attr("y", word.height) 
        .style("font-size", word.fontSize+"px")
        .style("font-family",word.fontStyle)
        .attr("fill", word.color) 
        .text(word.text);

 if(sprite){
 	var rect = g.selectAll("rect")
        .data(function(d) {return d.treeArray; });
    rect.enter().append("rect");
    rect.exit().remove();
    rect.attr("width", function(d) {return d.r - d.x; })
        .attr("height", function(d) { return d.b - d.y; })
        .attr("x", function(d) { return d.x; })
        .attr("y", function(d) { return d.y; })
        .style("stroke-width", function(d) { return 2 - d.depth / 2; });
 }   
}

//产生bound边界的极坐标，及outbound范围的四叉树
/**
 * TODO 这里和shape里只需指定一次origin
 * @param option
 * @param maxR
 * @param origin
 * @returns {{shape: *, func: *, draw: drawBoundary, maxR: *, getPointsAtRadius: getPointsAtRadius}}
 */
function boundGenerator(option,maxR,origin){
    // console.log(origin)
	var boundFunc;
    var pointsAtRadius = [];//缓存已经算过的
   if(typeof option==="string"){
   	   switch(option){
   	   	 case "random": boundFunc=function(theta){

   	   	 };break;

   	   	 // case "lines": boundFunc=function(theta){
               //
   	   	 // };break;

   	   	 case "cardioid": boundFunc=function(theta){
   	   	 	return r = 1-0.8*Math.sin(theta);
   	   	 };break;

   	   	 case "circle": boundFunc=function(theta){
   	   	 	return 1;
   	   	 };break;
   	   }
   }

   if(typeof option==="function"){
   	 boundFunc=option; 
   }

   //另一种方法，把限定的范围也建成四叉树
   function sprite(){

   }

   function boundTree() {
		var shape={
			sprite: sprite(boundW, boundH), 
			x: 0, y: 0, 
			r: boundW, b: boundH,
		};
	    return makeTree(shape, 0, 0, boundW, boundH);
	}
   
   var boundaryPoints=getPointsAtRadius(maxR);

   function drawBoundary(origin) {
	   	var g=vis.append('g').attr("class","boundary");
		var circle = g.selectAll("circle").data(boundaryPoints);
		circle.enter().append("circle");
		circle.exit().remove();
		circle.attr("r", 2)
		    .attr("cx", function(d) { return d[0]; })
		    .attr("cy", function(d) { return d[1]; })
		    .style("fill","blue");
		
		g.append('circle').attr("cx",origin[0]).attr("cy",origin[1]).attr("r",5)
   	}

   	function getPointsAtRadius(radius) {
      if (pointsAtRadius[radius]) {
        return pointsAtRadius[radius];
      }

      // Look for these number of points on each radius
      var T = radius * 8;

      // Getting all the points at this radius
      var t = T;
      var points = [];

      if (radius === 0) {
        points.push([origin[0], origin[1], 0]);
      }

      while (t--) {
        // distort the radius to put the cloud in shape

        var rxArray = boundFunc(t / T * 2 * Math.PI); // 0 to 1 数组

          // console.log(rxArray);

        // Push [x, y, t]; t is used solely for getTextColor()
          for(let rx of rxArray){
              points.push([
                  origin[0] + radius * rx * Math.cos(t / T * 2 * Math.PI),
                  origin[1] - radius * rx * Math.sin(t / T * 2 * Math.PI)
                  //*settings.ellipticity？？
                  ,t / T * 2 * Math.PI]);
          }

      }

      pointsAtRadius[radius] = points;
      return points;
    }


   return{
        shape:option,
        func:boundFunc,
        //tree: boundTree(),
        draw:drawBoundary,
        maxR:maxR,
       origin:origin,
   	   getPointsAtRadius:getPointsAtRadius,
   }
}

//尝试+贪心法+碰撞检测，确定每个单词的position
function putAWord(word,boundary,exist){
	//沿着边界形状一圈圈探测
	for(var r=0; r<boundary.maxR;r+=10){
		for(var point of d3.shuffle(boundary.getPointsAtRadius(r))){
    	   if(tryToPutWordAtPoint(point)){
    	   	// console.log(word)
    	   	//drawOneWord(word,visW,visH,false);
    	   	return true;
    	   }
        }
	}
	//!如果最终没能找到位置，则将该词删除/跳过
	return false;
    
	function tryToPutWordAtPoint(point) {
		word.position[0]=point[0];
		word.position[1]=point[1];

	    for(var another of exist){
           if(collide(word,another)){// If the word collide with another, return false and go to the next position.
              return false;
           }
	    }
        
        // if(collide(word,outBound)){// If the word collide with OutBoundTree
        //       return false;
        // }
        if(!isInBound()){
        	return false;
        }

	    return true;
    }
	//交叠测试-程序递归地处理相互重叠的矩形框，当存在两个叶子节点重叠或者当所有可能存在重叠的分支都被排除时程序就结束。?
	function overlaps(tree, otherTree, aox, aoy, box, boy) {
	    if (rectCollide(tree, otherTree, aox, aoy, box, boy)) {
	      if (tree.children == null) {
	        if (otherTree.children == null) return true;
	        else for (var i=0, n=otherTree.children.length; i<n; i++) {
	          if (overlaps(tree, otherTree.children[i], aox, aoy, box, boy)) return true;
	        }
	      } else for (var i=0, n=tree.children.length; i<n; i++) {
	        if (overlaps(otherTree, tree.children[i], box, boy, aox, aoy)) return true;
	      }
	    }
	    return false;
	}

	function rectCollide(a, b, aox, aoy, box, boy) {
	    return aoy + a.b > boy + b.y
	        && aoy + a.y < boy + b.b
	        && aox + a.r > box + b.x
	        && aox + a.x < box + b.r;
	}

	function collide(word1,word2) {
	    var isCollide=overlaps(word1.tree, word2.tree, word1.position[0], word1.position[1], word2.position[0], word2.position[1]);
	    return isCollide;
	    //vis.classed("collide", isCollide);
	}

	function isInBound(){
		//遍历textTree的叶子节点 (矩形很小 可以视作点) 比较r
		for(var rect of word.leafArray){
			var rectox=(rect.x+rect.r)/2+word.position[0]-boundary.origin[0];
			var rectoy=-((rect.y+rect.b)/2+word.position[1])+boundary.origin[1];
			var theta=(Math.atan(rectoy/rectox)+(rectox<0?1:2)*Math.PI)%(Math.PI*2); //Math.atan的范围-pi/2,pi/2	
			var rBound=boundary.func(theta).map(function (r) {
                    return r*boundary.maxR;
                })
			// console.log(rBound)
			rBound=rBound.sort(function (a,b) {
                return a-b;
            })
			// console.log(rBound)
			var rRect= Math.sqrt(rectox**2+rectoy**2);//distance from origin
			// console.log(rectox,rectoy,rRect)
            if(rBound.length>1){
                for(let i=0;i<rBound.length-1;i+=2){
                    if(rRect>rBound[i]&&rRect<rBound[i+1]) return false;
                }
            }

            if( rRect > rBound[rBound.length-1]){
                return false;
            }
			
		}
		return true;

		//使用四叉树递归  逐层判断矩形是否在多边形内
		if (rectCollide(tree, otherTree, aox, aoy, box, boy)) {
	      if (tree.children == null) {
	        if (otherTree.children == null) return true;
	        else for (var i=0, n=otherTree.children.length; i<n; i++) {
	          if (overlaps(tree, otherTree.children[i], aox, aoy, box, boy)) return true;
	        }
	      } else for (var i=0, n=tree.children.length; i<n; i++) {
	        if (overlaps(otherTree, tree.children[i], box, boy, aox, aoy)) return true;
	      }
	    }
	    return false;
	}
}
// ！！未完成改进：使用四叉树逐层判断是否在boundary里
//1.缓存。如果单词A和单词B交叠，如果稍微调整A的位置，很有可能A还会和B交叠。把和候选单词最经常交叠的单词缓存起来(当出现了一个重叠时，可以进行一次缓存)，下次进行检测时首先与该缓存项进行检测。，首先测试这些经常交叠的单词。
//2.空间索引为了进一步减少冲突检测次数，采用了计算几何学中的“区域四叉树”算法，它递归地把二维空间划分成4个矩形区域。当一个文本被放置以后，使用类似 BuildRQTree 的方式，计算包含它的最小四叉树节点。
// 在进行检测的时候，通过查询整棵四叉树，可以避免检测根本不可能冲突的文本  

// //交互，悬浮出现提示框显示词条详细信息
// function hoverWord(){
// }
// var myCloud=function{
// } 

//尝试放入每个word，若不能放则删除该词
//加上多个origin的情况
function wordle(wordList,boundaryR,option){
    //全局变量【之后重构时修改设定方式】
    visW = 4*boundaryR, visH = 4*boundaryR; //width ,height,padding of svg
	vis = d3.select("#mainVis").append("svg").attr("width", visW).attr("height", visH);
	textGroup=vis.append("g").attr("class","text") ;
	// origin=[300,800]//布局起始点

	boundary=boundGenerator(option["shape"],boundaryR,origin);
	boundary.draw(origin);
	exist=[];//保存已经放置的


	//初始化存储每个单词绘图信息的数组
	var words2DInfo=d3.range(wordList.length).map(function(d,i){
		word2D=getWordInfo(wordList[d],(wordList.length-i)/10+0.2,40); //从高到低的顺序的为每个word分配weight
		word2D["position"]=[0,0];
		word2D["color"]='#'+(Math.random()*0xffffff<<0).toString(16);
		word2D["fontStyle"]=option["font-family"]; 
		word2D["rotation"]=0;
		word2D['fit']=true;
	    return word2D;
	});

	for(var word of words2DInfo){
		// console.log(word)
		if(!putAWord(word,boundary)){
			word['fit']=false;
		}
		else{
			exist.push(word);
		}
	}

	draw(words2DInfo,visW,visH,option["drawSprite"]);

}

function processData(regions, data){
    let sWithL=[]
    for(let x in data) {
        if(data[x]['leader']['xj']){

            data[x]['wordDic']=["Hello","world", "大木桥","9号线","12号线",
                "words","wolf", "车站","嘉善路站","换乘站"];
            //初始化存储每个单词绘图信息的数组
            data[x]['words2DInfo']=d3.range(data[x]['wordDic'].length).map(function(d,i){
                let word2D=getWordInfo(data[x]['wordDic'][d],(data[x]['wordDic'].length-i)/10+0.2,60); //从高到低的顺序的为每个word分配weight
                word2D["position"]=[0,0];
                word2D["color"]='#'+(Math.random()*0xffffff<<0).toString(16);
                word2D["fontStyle"]=option["font-family"];
                word2D["rotation"]=0;
                word2D['fit']=true;
                return word2D;
            });

            sWithL.push(data[x]);
        }
    }

    for(let x in regions) {
        regions[x]['innerS']=[];

    }
    inRegion(sWithL,regions);

    return sWithL;
}

/**
 * find each region has which leaders
 * @param sWithL
 * @param regions
 */
function inRegion(sWithL, regions) {
    for (let station of sWithL){
        // console.log(station)
        let leader=station['leader'];
        let origin=[];
        origin[0]=leader['xp'];
        origin[1]=leader['yp'];
        for (let x in regions){//TODO 更改遍历的顺序，先检查包含station的？
            let region=regions[x];
            let intersec=regionF(region,origin)(Math.PI);//TODO 是否要排除交点为顶点且为凹点的情况
            let count = intersec.length;
            if(count%2 !== 0){
                regions[x]['innerS'].push(station);
                break;
            }
        }
    }
}

/**
 * region边界的极坐标方程
 * TODO 思考是否要将origin及其对应的方程写成region的属性
 * @param region
 * @param origin
 * @returns {regionfunc} 以origin为极点的边界上点的坐标函数 传入theta放回r
 */
function regionF(region,origin){
    // console.log(region)
    for (let edge of region){
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
        for(let edge of region){
            // var maxR = Math.max( edge['func'](edge['theta1']),edge['func'](edge['theta2']) ) //用于将最大值归一？
            if(edge['range'].length===2){
                if(theta>edge['range'][0] && theta<=edge['range'][1] ){
                    let r=Math.abs(edge['r1']*Math.sin(edge['alpha']-edge['theta1'])/Math.sin(edge['alpha']-theta));
                    intersecP.push(r/400);
                    // if((theta-edge['range'][0])<0.001||(-theta+edge['range'][1])<0.001) console.log(r,theta,edge['range']);
                    // return r/400;
                }
            }
            else{
                if((theta>=edge['range'][0] && theta<=edge['range'][1])||(theta>=edge['range'][2] && theta<=edge['range'][3])){
                    let r=Math.abs(edge['r1']*Math.sin(edge['alpha']-edge['theta1'])/Math.sin(edge['alpha']-theta));
                    intersecP.push(r/400);
                    // console.log(r);
                    // return r/400;
                }
            }
        }

        return intersecP;
    }
    return regionfunc;
}

// var origin=[1150,760] //region[3]
// var origin=[300,800]  //region[0] //查一下shape生成器别人是怎么确定中心的
// var origin=[950,550];//region[4]
// var origin=[1220,350];//region[15]
let option={
    // "shape": regionfunc,
    "font-family":"ariel",
    "drawSprite":false
    // "drawBoundary":true,
};

d3.json("data/sta.json",function (e,dataS){
    d3.json("data/regions.json",function(e,regions){
        console.log(regions)
        processData(regions,dataS);
        // console.log(regions);
        let boundaryR=400;
        visW = 4*boundaryR, visH = 4*boundaryR; //width ,height,padding of svg
        vis = d3.select("#mainVis").append("svg").attr("width", visW).attr("height", visH);
        textGroup=vis.append("g").attr("class","text") ;


        for (let x in regions){
            let region=regions[x];
            let innerS=region['innerS'];

            let origin=[];

            let exist=[];//保存已经放置的word
            let complete=[] ;// 保存已完成的站点
            let i=0,flag=0;
            while(1){

                for(let s of innerS){
                    if(s in complete) continue;
                    if(i>=s['wordDic'].length){
                        // console.log(i,innerS);
                        flag++;
                        complete.push(s);
                        // delete  s;
                        // innerS.splice(innerS.index(s),1);
                    }
                    else{
                        origin[0]=s['leader']['xp'];
                        origin[1]=s['leader']['yp'];

                        option['shape']=regionF(region,origin);
                        let boundary=boundGenerator(option["shape"],boundaryR,origin);
                        boundary.draw(origin);
                        let word=s['words2DInfo'][i];
                        if(!putAWord(word,boundary,exist)){
                            word['fit']=false;
                        } //TODO 把画一个word的功能加上，放置一个画一个
                        else{
                            exist.push(word);
                            // console.log(word);
                            drawOneWord(word,visW,visH,false);
                        }
                    }
                }

                i+=1;
                if(flag>=innerS.length) break;
            }
            // draw(words2DInfo,visW,visH,option["drawSprite"]);
        }
    })
});

//Todo 动态的改变词组的时候要怎么比较方便； 逐个显示单词，避免空白时间过短-》可能需将单词放在独立的svg
//TODO wordle中处理一下画circle和text的错误:如果不是number或是infinity则跳过
//TODO 错误：出现了uexpected boundary 出现了几处重叠。猜测：是每次遍历使生成的boundaries不同，且可能由于origin找的不对的原因出错 region的格式似乎不对 python中改了，这里好像没改？
//TODO region的格式似乎不对 python中改了，这里好像没改？