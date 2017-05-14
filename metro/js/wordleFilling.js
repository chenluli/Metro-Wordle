// todo 未完成改进：使用四叉树逐层判断是否在boundary里
//1.缓存。如果单词A和单词B交叠，如果稍微调整A的位置，很有可能A还会和B交叠。把和候选单词最经常交叠的单词缓存起来(当出现了一个重叠时，可以进行一次缓存)，下次进行检测时首先与该缓存项进行检测。，首先测试这些经常交叠的单词。
//2.空间索引为了进一步减少冲突检测次数，采用了计算几何学中的“区域四叉树”算法，它递归地把二维空间划分成4个矩形区域。当一个文本被放置以后，使用类似 BuildRQTree 的方式，计算包含它的最小四叉树节点。
// 在进行检测的时候，通过查询整棵四叉树，可以避免检测根本不可能冲突的文本
//3.为词云和文字留出交互接口  词云可供添加class即可

(function (win) {

   var defaultdic=[{"Hello":0.8},{"world":0.6}, "大木桥","9号线","words","wolf", "车站","嘉善路站", {"换乘站":0.2},"something","young","happiness","how","telling","jasondavies","sga","alice","rabbit","english",
    "After","atime","she","heard","feet","inthe","distance","something","young","happiness","how","telling","haha",
    "she","heard","feet","inthe","distance","something","young","happiness","how","telling","haha",]

    function Tree(x, y, r, b) {
        this.x = x;
        this.y = y;
        this.r = r;
        this.b = b;
        this.children = null;
    }


    /**
     * 遍历tree中的矩形转化为数组存储
     * @param root
     * @returns {[*,*]}
     */
    function flatten(root) {
        let nodes = [];
        let leaf=[];
        // console.log(root)
        recurse(root, 0);
        // console.log(root)
        return [nodes,leaf];


        function recurse(node, depth) {
            node.depth = depth;
            if (node.children) node.children.forEach(function(d) { recurse(d, depth + 1); });
            nodes.push(node);
            if(node.children===null) leaf.push(node);

        }
    }

    /**
     * TODO 这里和shape里只需指定一次origin
     * 产生bound边界的极坐标，及outbound范围的四叉树
     * @param option
     * @param maxR
     * @param origin
     * @returns {{shape: *, func: *, draw: drawBoundary, maxR: *, getPointsAtRadius: getPointsAtRadius}}
     */
    win.boundGenerator=function(option,maxR,origin){
        // console.log(origin)
        let boundFunc;
        let pointsAtRadius = [];//缓存已经算过的
        if(typeof option==="string"){
            switch(option){
                case "random": boundFunc=function(theta){

                };break;

                // case "lines": boundFunc=function(theta){
                //
                // };break;

                case "cardioid": boundFunc=function(theta){
                    return r = [1-0.8*Math.sin(theta)];
                };break;

                case "circle": boundFunc=function(theta){
                    return [1];
                };break;
            }
        }

        if(typeof option==="function"){
            boundFunc=option;
        }

        let boundaryPoints=getPointsAtRadius(maxR);

        function drawBoundary(vis) { //todo 应检查vis是否为d3类型 若不是则转一下
            let g=vis.append('g').attr("class","boundary");
            let circle = g.selectAll("circle").data(boundaryPoints);
            circle.enter().append("circle");
            circle.exit().remove();
            circle.attr("r", 2)
                .attr("cx", function(d) { return d[0]; })
                .attr("cy", function(d) { return d[1]; })
                .style("fill","blue");

            // g.append('circle').attr("cx",origin[0]).attr("cy",origin[1]).attr("r",5)
        }

        function getPointsAtRadius(radius) {
            if (pointsAtRadius[radius]) {
                return pointsAtRadius[radius];
            }

            // Look for these number of points on each radius
            let T = radius * 8;

            // Getting all the points at this radius
            let t = T;
            let points = [];

            if (radius === 0) {
                points.push([origin[0], origin[1], 0]);
            }

            while (t--) {
                // distort the radius to put the cloud in shape

                let rxArray = boundFunc(t / T * 2 * Math.PI); // 0 to 1 数组

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
    };

    //加上多个origin的情况
    win.wordle=function(wordList,option,textGroup,classname,exist=[]){ //exist参数是为了适应于画布上已有word的情况
        let boundary=option.boundary;

        //初始化存储每个单词绘图信息的数组,todo 可由option更改 &字体和颜色换些好看的 &旋转功能还未加
        let words2DInfo=d3.range(wordList.length).map(function(d,i){
            let word,weight;

             if(typeof wordList[d] === "string"){
                 word=wordList[d];
                 weight=((wordList.length-i)/wordList.length+0.3).toFixed(1);
             }
             else{
                 word=Object.keys(wordList[d])[0];
                 weight=wordList[d][word];
             }
            let word2D=getWordInfo(word,weight,option.baseSize,option.rotate);
            return word2D;
        });
        
        var wsum=0;
        //尝试放入每个word，若不能放入则不显示
        for(let word2D of words2DInfo){
            let fitable=putAWord(word2D,boundary,exist);

            let changeRotate=0;

            //如果不能放入 则旋转 缩小 再尝试 【！！todo 旋转还未加入】
            if(!option.fast){
                while(!fitable && word2D.weight>0.3){
                if(!changeRotate){
                    word2D=getWordInfo(word2D.text,word2D.weight,option.baseSize,(word2D.rotation+=Math.PI/2)%Math.PI);
                   
                   fitable=putAWord(word2D,boundary,exist);
                   changeRotate=1;
                }
                else{
                   word2D=getWordInfo(word2D.text,word2D.weight-=0.15,option.baseSize,option.rotate);
                   // console.log(word2D)
                   fitable=putAWord(word2D,boundary,exist); 
                   changeRotate=0;
                }
                
                }
            }
            
            
            if(fitable){
                exist.push(word2D);
                console.log(word2D)
                
                wsum+=(word2D.weight*36*word2D.text.length)*(word2D.weight*36);
                
                drawOneWord(word2D,classname,option.drawSprite);
            }
            else{
                word2D['fit']=false;   
            }
        }

        if(option.drawBoundary) boundary.draw(textGroup);
        console.log(wsum)

        //todo 是否需要变成类
        /**
         * 递归地把形状的边界框分成更小的矩形，生成一棵由矩形框生成的树，其叶子节点包含单词的形状分块。
         *The algorithm of BuildQuadTree from Copyright (c) 2013, Jason Davies, http://www.jasondavies.com/
         * https://www.jasondavies.com/wordcloud/about/
         * License: https://raw.github.com/jasondavies/d3-cloud/master/LICENSE
         * @param shape
         * @param x
         * @param y
         * @param r
         * @param b
         * @returns {*}
         */
        function makeTree(shape, x, y, r, b) {
            if (contains(shape, x, y, r, b)) {
                return new Tree(x, y, r, b);
            }
            else if (intersects(shape, x, y, r, b)){//intersec is not FULLY_CONTAIN
                var cx = (x + r) >> 1,
                    cy = (y + b) >> 1,
                    tree = new Tree(x, y, r, b);
                if (r - x > option.minBoxSize || b - y > option.minBoxSize) {
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
            return null; //x,y,r,b为对角线上两顶点坐标
        }


        //尝试+贪心法+碰撞检测，确定每个单词的position
        function putAWord(word,boundary,exist){
            //沿着边界形状一圈圈探测
            for(let r=0; r<boundary.maxR;r+=10){
                for(let point of d3.shuffle(boundary.getPointsAtRadius(r))){
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

                for(let another of exist){
                    if(collide(word,another)){// If the word collide with another, return false and go to the next position.
                        return false;
                    }
                }

                // if(collide(word,outBound)){// If the word collide with OutBoundTree
                //       return false;
                // }
                if(!isInBound()) return false;


                return true;
            }
            //交叠测试-程序递归地处理相互重叠的矩形框，当存在两个叶子节点重叠或者当所有可能存在重叠的分支都被排除时程序就结束。?
            function overlaps(tree, otherTree, aox, aoy, box, boy) {
                if (rectCollide(tree, otherTree, aox, aoy, box, boy)) {
                    if (tree.children == null) {
                        if (otherTree.children == null) return true;
                        else for (let i=0, n=otherTree.children.length; i<n; i++) {
                            if (overlaps(tree, otherTree.children[i], aox, aoy, box, boy)) return true;
                        }
                    } else for (let i=0, n=tree.children.length; i<n; i++) {
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
                let isCollide=overlaps(word1.tree, word2.tree, word1.position[0], word1.position[1], word2.position[0], word2.position[1]);
                return isCollide;
                //vis.classed("collide", isCollide);
            }

            function isInBound(){
                //遍历textTree的叶子节点 (矩形很小 可以视作点) 比较r
                for(let rect of word.leafArray){
                    let rectox=(rect.x+rect.r)/2+word.position[0]-boundary.origin[0];
                    let rectoy=-((rect.y+rect.b)/2+word.position[1])+boundary.origin[1];
                    let theta=(Math.atan(rectoy/rectox)+(rectox<0?1:2)*Math.PI)%(Math.PI*2); //Math.atan的范围-pi/2,pi/2
                    let rBound=boundary.func(theta).map(function (r) {
                        return r*boundary.maxR;
                    })
                    // console.log(rBound)
                    rBound=rBound.sort(function (a,b) {
                        return a-b;
                    })
                    // console.log(rBound)
                    let rRect= Math.sqrt(rectox**2+rectoy**2);//distance from origin
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
                        else for (let i=0, n=otherTree.children.length; i<n; i++) {
                            if (overlaps(tree, otherTree.children[i], aox, aoy, box, boy)) return true;
                        }
                    } else for (let i=0, n=tree.children.length; i<n; i++) {
                        if (overlaps(otherTree, tree.children[i], box, boy, aox, aoy)) return true;
                    }
                }
                return false;
            }
        }

        function drawOneWord(word,station,sprite=false) {
            let theText = textGroup.append("text");
            theText.attr("pointer-events", "all")
                .attr("x", word.position[0])
                .attr("y", word.position[1]+word.height+word.trasY)
                .attr("transform", "rotate(" + (-word.rotation*180/Math.PI) +","+word.position[0]+" "+(word.position[1]+word.trasY)+ ")") //textBox相对svg的位置
                .style("font-weight","bold")
                .style("font-size", word.fontSize+"px")
                .style("font-family",word.fontStyle)
                .attr("fill", word.color)
                .attr('class',station)
                .text(word.text);

            word['box']=theText[0][0].getBBox();
            word['box'].x+=word.position[0];
            word['box'].y+=word.position[1];
            // console.log(word['box'])?


            if(sprite){
                let rect = textGroup.selectAll("rect")
                    .data(word.treeArray);
                rect.enter().append("rect");
                rect.exit().remove();
                rect.attr("width", function(d) {return d.r - d.x; })
                    .attr("height", function(d) { return d.b - d.y; })
                    .attr("x", function(d) { return word.position[0]+d.x; })
                    .attr("y", function(d) { return word.position[1]+d.y; })
                    .style("stroke","yellow")
                    .style("fill","none")
                    .style("stroke-width", function(d) { return 2 - d.depth / 2; });
            }
        }

        /**
         * 得到word的四叉树形式
         * @param word
         * @param weight
         * @param baseSize
         * @returns {{text: *, fontSize: number, width: (*|number), height: (*|number), tree: *, treeArray: (*|*), leafArray: (*|*)}}
         */
        function getWordInfo(word,weight=0.5,baseSize=36,rotateDeg=0){
            let fontSize=~~(baseSize*weight); //weight set to be 0.1~1.1
            let canvas = document.createElement("canvas");
            let width=  fontSize*10;
            let height= fontSize*2;
            // console.log(width,Math.abs(Math.sin(rotateDeg)),rotateDeg)

            canvas.width=Math.ceil(width * Math.abs(Math.cos(rotateDeg)) +
                           height * Math.abs(Math.sin(rotateDeg)));
            canvas.height= Math.ceil(width * Math.abs(Math.sin(rotateDeg)) +
                           height * Math.abs(Math.cos(rotateDeg)));
            width=canvas.width;
            height=canvas.height;

            // document.querySelector("body").appendChild(canvas)
            let ctx = canvas.getContext("2d",{ willReadFrequently: true });

            let ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);//1px??
            ctx.font = ~~(fontSize / ratio) + "px bold "+word.fontStyle; //~~:取整
            let textW=Math.ceil(ctx.measureText(word).width);
            let textH = Math.ceil(Math.max(fontSize ,ctx.measureText('m').width,ctx.measureText('\uFF37').width));
      
            let boxH=Math.ceil(textH*1.5);
            // ctx.translate(0, textW*Math.abs(Math.sin(rotateDeg)))
            ctx.translate(0, textW*Math.abs(Math.sin(rotateDeg)))
            
            ctx.rotate(-rotateDeg);
            ctx.fillText(word, 0, textH); //texH is the text offset along Y
            
            // ctx.rotate(rotateDeg);
            // ctx.translate(0, -textW*Math.abs(Math.sin(rotateDeg)))

            //Get pixels of text
            function sprite(w, h) {
                let pixels = ctx.getImageData(0, 0, w / ratio, h / ratio).data,
                    sprite = [];
                for (let i = w * h; --i >= 0;) sprite[i] = pixels[(i << 2) + 3];
                    // console.log(w,h,textW*Math.abs(Math.sin(rotateDeg)),textW,textH)

                return sprite;
            }

            function makeTextTree() {
                let shape={
                    sprite: sprite(width, height),
                    x: 0, y: 0,
                    r: width, b: height,
                };
                return makeTree(shape, 0, 0, width, height);
            }

            let textTree=makeTextTree();
            let array=flatten(textTree);
            // console.log(array[0])
            return{
                text: word,
                fontSize:fontSize,
                weight:weight,
                width:textW,
                height:textH,
                trasY:textW*Math.abs(Math.sin(rotateDeg)),
                tree: textTree,
                treeArray: array[0],
                leafArray: array[1],
                position:[0,0],
                color:weight>0.33?'#369':'#3'+'369ce'[Math.floor(Math.random()*5)]+'69ce'[Math.floor(Math.random()*4)],//'#'+(Math.random()*0xffffff<<0).toString(16),
                fontStyle:option["font-family"],
                rotation:rotateDeg,
                fit:true,
                station:classname,
            }
        }

        // return{
        //     addOneWord:addOneWord,
        //
        // }

        return words2DInfo.filter(function(elem){return elem['fit']}); //返回绘制的信息
    }

})(window);

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
            // getWordDict(dataS[x]);
            //dataS[x]['wordDic']=getWordDict(dataS[x]);
           // console.log(dataS[x]['wordDic']);
            dataS[x]['rects']=[];
            sWithLabel.push(dataS[x]);
        }
    }

    for(let x in regions){
        let region=regions[x];
        // console.log(region)
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

d3.json("data/path2.json",function (e,dataP){
  d3.json("data/sta2.json",function (e,dataS){
     d3.json("data/regions2.json",function(e,regions){

        let svg=d3.select('svg');

        var [paths,stations,sWithLabel]=processData(dataP,dataS,regions)
        createMetroMap(svg,paths,stations);


        // var option={
        //         "font-family":"ariel",
        //         "drawSprite":false,
        //         "drawBoundary":true,
        //         minBoxSize:4,
        //         rotate:0,
        // }

        // let boundaryR = 400;
        // var textG=svg.append("g").attr("class","text");

        // for (let x in regions) {
        //     let region = regions[x];
            

        //     let innerS =[]//region['innerS'];

        //     innerS.push([850,700])
        //     // innerS.pop();
        //     // innerS.pop();
        //     // innerS.pop()
        //     // innerS.pop()
        //     // innerS.pop()
        //     if (!innerS.length) continue;

        //     let edges = region['edges'];

        //     let origin = [];

        //     for (let s of innerS) {
        //         // origin[0] = s['leader']['xp'];
        //         // origin[1] = s['leader']['yp'];
        //         origin[0]=s[0]
        //         origin[1]=s[1]


        //         // console.log(origin,s);
        //         // console.log(innerS);

        //         if (isinRegion(origin,region)) {
        //             console.log(region,s)
        //             option['boundary'] = boundGenerator(regionF(edges, origin, boundaryR), boundaryR, origin); //todo exist应该是每个region的属性/全局变量
        //             option['boundary'] .draw(textG);
                    
        //         }

                
        //     }
        // }
        // for (let x in regions) {
        //     let region = regions[x];
        //     // console.log(region);
        //     let innerS = region['innerS'];
        //     if (!innerS.length) continue;
        //     let edges = region['edges'];

        //     let origin = [];

        //     let complete = [];// 保存已完成的站点
        //     let i = 0, flag = 0;
        //     while (1) {

        //         for (let s of innerS) {
        //                 if (s in complete) continue;
        //                 if (i >= s['wordDic'].length) {
        //                     // console.log(i,innerS);
        //                     flag++;
        //                     complete.push(s);
        //                     // delete  s;
        //                     // innerS.splice(innerS.index(s),1);
        //                 }
        //                 else {
        //                     origin[0] = s['leader']['xp'];
        //                     origin[1] = s['leader']['yp'];

        //                     option['boundary'] = boundGenerator(regionF(edges, origin, boundaryR), boundaryR, origin); //todo exist应该是每个region的属性/全局变量
        //                     // option['boundary'] .draw(textGroup);

        //                     let wordDraw = wordle(s['wordDic'].slice(i, i + 1), option, textGroup, s['name'], exist);

        //                     for (let word of wordDraw) {
        //                         s['rects'].push(word['box']);
        //                     }

        //                 }

        //         }

        //         i += 1;
        //         if (flag >= innerS.length) break;
        //     }

        // }


        // var boundary=boundGenerator("cardioid",200,[400,400]);
        
        
        // wordle(wordList,option,textG,"word");
})
})
})



var WIDTH=1510;//document.body.clientWidth;//为初始大小 后续会由document.documentElement.clientWidth+viewBox调整;
var HEIGHT=1210;//WIDTH*$("#main").height()/$("#main").width();
var PADDING=0;
function createMetroMap(svg,paths,stations) {
    createPath(paths,svg);
    createNode(stations,svg);
    textLabel(stations,svg);
    
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

//const PADDING=0;//20;
const linecolor=["#E4002B","#97D700","#FFD100","#5F259F","#AC4FC6","#D71671","#FF6900","#009EDB", "#71C5E8","#C1A7E2","#76232F","#007B5F","#EF95CF","","","#2CD5C4"];

// exist=[];



// let embedWordle=d3.select("#wordleEmbed");

// if(embedWordle[0][0]){
//      var boundary=boundGenerator("cardioid",300,[400,400]);
//      console.log(embedWordle)

//      var option={
//                 "font-family":"ariel",
//                 "drawSprite":false,
//                 "drawBoundary":true,
//                 minBoxSize:4,
//                 boundary:boundary,
//                 rotate:0,
//         }
//      var defaultdic=[
//         {"Hello":0.8},
//         {"world":0.6}, "大木桥","9号线",
//         "words","wolf", "车站","嘉善路站",
//         {"换乘站":0.2},"something","young","happiness","how","telling","jasondavies","sga","alice","rabbit","english",
//         "After","atime","she","heard","feet","inthe","distance","something","young","happiness","how","telling","haha",
//         "she","heard","feet","inthe","distance","something","young","happiness","how","telling","haha",]
//      let textG=embedWordle.append('g')
//      wordle(defaultdic,option,textG,"word");
// }


originVis=d3.select("#origin");
if(originVis[0][0]){
    d3.json("data/originpath.json",function (e,dataP){
      d3.json("data/originsta.json",function (e,dataS) { 
        // console.log(dataS)
        let paths=[],stations=[];
        let lines=[1,2,4,9];//先直接写，后续动态获取

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
        
        createMetroMap(originVis,paths,stations);
        // zoomHandler(originVis);
       

        var token="bRPsMMG6ZZl5Gj9Haivv0NefdClWgHk0";
        var region=encodeURIComponent("上海");
        var query="景点";

        var results=[];

         d3.json("data/poiJSON.json",function (e,poiJSON) {
            console.log(poiJSON)
            // for(let result of rlist){
            //     result["rank"]=i*20+j;
            //     results.push(result)
            //     j++;
            // }

         })

         function fillinPois(results){
             results.sort(function(a,b){
                    return a['rank']-b['rank'];
                })

                let pois=originVis.append('g').attr("class","pois");
                let tooltip=$("#tooltip");

            let gWIDTH=1500,gHEIGHT=1200,maxLon=121.9254676,minLon=121.0995216,maxLat=31.40999864,minLat=30.90948392;


                // d3.json("data/path.json",function (e,dataP){
                d3.json("data/sta2.json",function (e,dataS2){
                     d3.json("data/regions2.json",function(e,regions){
                        // console.log(regions)
                        for(let regionid in regions){
                            regions[regionid].innerS=[]
                        }
                       for(let res of results){
                            // console.log(res["name"],res["rank"])
                            let bdlon=res["location"]["lng"],bdlat=res["location"]["lat"];
                            //百度经纬度坐标转国测局坐标
                            let gcj02 = coordtransform.bd09togcj02(bdlon,bdlat);
                            //国测局坐标转wgs84坐标
                            let wgs84= coordtransform.gcj02towgs84(gcj02[0],gcj02[1]);
                            // console.log(bdlon,bdlat);
                            // console.log(wgs84,res["name"]);

                            res['x']=(wgs84[0]-minLon)/(maxLon-minLon)*gWIDTH//+PADDING;
                            res['y']=gHEIGHT-((wgs84[1]-minLat)/(maxLat-minLat)*gHEIGHT)//+PADDING;

                            // if(res['name']==="闵行公园") console.log(res['name'],calcD(res,stations))
                            // console.log(originVis)
                            let circle=pois.append("circle")
                               .attr("r","5")
                               .attr("fill","red")
                               .attr("cx",res['x'])
                               .attr("cy",res['y'])
                               .attr("opacity","0.5")
                            circle.datum(res)
                            // pois.append("text")
                            //    // .attr("r","5")
                            //    // .attr("fill","red")
                            //    .attr("x",res['x'])
                            //    .attr("y",res['y'])
                            //    .attr('font-size',12)
                            //    .attr('fill',"black")
                            //    .text(res["name"])

                            judgeRegion(res,stations,regions,dataS)

                        }
                        var option={
                            "font-family":"ariel",
                            "drawSprite":false,
                            "drawBoundary":false,
                            minBoxSize:4,
                            rotate:0,
                            fast:true,
                        }

                        let boundaryR = 400;
                        var textG=d3.select('svg').append("g").attr("class","text");
                        for(let regionid in regions){

                            // console.log(regionid)
                            // if(regionid !=1) continue;//用来debug，查看单个region

                            let region=regions[regionid];
                            let edges=region['edges']

                            var regionSpace=0;
                            for(let edge of edges){
                                console.log(edge.start,edge.to)
                                regionSpace+=(edge.x1*(-edge.y2)-edge.x2*(-edge.y1))//由于y坐标系反了
                            }

                            

                            let count=0;
                            region["cx"]=0
                            region["cy"]=0;
                            for(let s of region['allS']){
                                if(!dataS2[s]) continue;
                                region.cx+=dataS2[s].x;
                                region.cy+=dataS2[s].y;
                                count+=1;
                            }
                            // for(let edge of edges){
        
                            //     region.cx+=edge.x1;
                            //     region.cy+=edge.y1;
                            //     count+=1;
                            // }
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

                            // if(region.stations.length<5) origin=[385,800];
                        
                            let pois=region['innerS']
                            option['boundary'] = boundGenerator(regionF(edges, origin, boundaryR), boundaryR, origin); //todo exist应该是每个region的属性/全局变量
                            option['boundary'] .draw(textG);
                            
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

                            // var wsum=0;
                            

                            
                            console.log("space:",regionSpace/2);

                            wordle(wordList,option,textG,regionid);
                            // console.log(wordList);
                            break;
                        }
                        
                        console.log(regions)
                        eventHandler(regions)

                     })
                    })
                // })

                
                pois[0][0].addEventListener("mouseover", function (e) {
                    console.log("enter")
                    if (e.target && e.target.nodeName == "circle") {
                        d3.select(e.target).attr('r', '8');

                        tooltip.css("visibility", 'visible');
                        tooltip.html(e.target.__data__.name);
                        tooltip.css("left", (e.clientX + 15) + 'px');
                        tooltip.css("top", (e.clientY + 15) + 'px');

                    }
                });
                pois[0][0].addEventListener("mouseout", function (e) {
                    if (e.target && e.target.nodeName == "circle") {
                        d3.select(e.target).attr('r', '6');
                        tooltip.css("visibility", 'hidden');
                    }
                });
         }

         function success(response,i){
            var rlist=response["results"];
            let j=1;
            for(let result of rlist){
                result["rank"]=i*20+j;
                results.push(result)
                j++;
            }

            //已全部获取
            let gWIDTH=1500,gHEIGHT=1200,maxLon=121.9254676,minLon=121.0995216,maxLat=31.40999864,minLat=30.90948392;
            if(results.length===response["total"]){
                console.log("complete",results.length);
                fillinPois(results);
            }
        }

        for(let i=0;i<20;i++){
          
            var api="https://api.map.baidu.com/place/v2/search?output=json&page_size=20&scope=2&filter=sort_name:default|sort_rule:0&coord-type=1&ak="+token
                     +"&query="+encodeURIComponent(query)+"&page_num="+i+"&region="+region;
                     //"&location="+locx+","+locy+"&rasius="+radius;

            //之后自己先爬取并建立一个数据库，从本地文件中获取
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
                    success(data,i);
                })
                .fail( function(xhr, textStatus, errorThrown) {
                    console.log(xhr.responseText);
                    console.log(textStatus);
                    words=defaultdic;
                });         
        }

      })
    });
}



//判断point应归入哪个区域：将point与站点或edges的距离存起来, 找出最近的，再判断方位，从而得到所属区域
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


function judgeRegion(poi,stations,regions,dataS){

    let distances=calcD(poi,stations);
    poi['region']=[]

    for(let regionid in regions){

        let region=regions[regionid]
        let allS=region["allS"];
        let edges=region['edges']


        if(allS.indexOf(distances[0]['station'])!==-1){
            let py=poi.y,px=poi.x;
            let sum=0;

            poi['region'].push(regionid);
            //判断是否真的在内部
            // for(let edge of edges){
            //     if(!edge['paths']) continue;
            //     for(let path of edge['paths']){
            //         let s1=dataS[path["station_start"]],s2=dataS[path['station_to']]
            //         if(!s1||!s2 ) continue;
            //         let sx=s1.x,sy=s1.y,tx=s2.x,ty=s2.y;
            //         // 点与相邻顶点连线的夹角
            //         let angle = Math.atan2(sy - py, sx - px) - Math.atan2(ty - py, tx - px)

            //         // 确保夹角不超出取值范围（-π 到 π）
            //         if(angle >= Math.PI) {
            //             angle = angle - Math.PI * 2
            //         } else if(angle <= -Math.PI) {
            //             angle = angle + Math.PI * 2
            //         }

            //         sum += angle
            //     }       
            // }
            // if(Math.round(sum / (Math.PI*2))> 0){ //if 回转数不为0，则在多边形内
            //    poi['region']=regionid;
            //    regions[regionid].innerS.push(poi)
            //    break;
            // }
        }
        
    }

    // if(poi['region'].length===0) console.log(distances[0],)
    if(Array.isArray(poi['region'])){//说明回转数法失败
        //比较平均距离
        // for(let regionid of poi['region']){
        //     let region=regions[regionid];
        //     let count=0;
        //     region.cx=0,region.cy=0;
        //     for(let s of region['allS']){
        //         if(!dataS[s]) continue;
        //         region.cx+=dataS[s].x;
        //         region.cy+=dataS[s].y;
        //         count+=1;
        //     }
        //     region.cx/=count;   
        //     region.cy/=count;    
        // }
        
        // let tmp=dataS[distances[0]['station']];
        // poi.region.sort(function(a,b){//todo 还是有问题!
        //     let flag1=((regions[a].cx-tmp.x)*distances[0]['dx']>=0)+((regions[a].cy-tmp.y)*distances[0]['dy']>=0);
        //     let flag2=((regions[b].cx-tmp.x)*distances[0]['dx']>=0)+((regions[b].cy-tmp.y)*distances[0]['dy']>=0);
        //     // console.log(poi.name,flag1,flag2)
            
        //     return -flag1+flag2;
        // })

        // poi.region=poi.region[0]
        // regions[poi.region].innerS.push(poi)

        poi.region.sort(function(a,b){//todo 还是有问题!
            let flaga=rayCasting(poi,regions[a],dataS);
            let flagb=rayCasting(poi,regions[b],dataS);
            console.log(poi.name,flaga,flagb)
            
            return -flaga+flagb;
        })

        poi.region=poi.region[0]
        regions[poi.region].innerS.push(poi)
        
    }
    
    // console.log(poi,regions[poi.region])
}

//射线法判断是否在内
 /**
   * @description 射线法判断点是否在多边形内部
   * @param {Object} p 待判断的点，格式：{ x: X坐标, y: Y坐标 }
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

//todo 使用一个放大镜图标 当选用这个图标后，点击区域会放大
// if(){

// }
var wordleSVG=document.querySelector('#wordleEmbed');//todo 之后代码结构 SinglePageA 使用map，一次性选好所有要用的

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
