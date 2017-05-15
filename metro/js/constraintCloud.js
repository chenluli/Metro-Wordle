// todo 未完成改进：使用四叉树逐层判断是否在boundary里
//1.缓存。如果单词A和单词B交叠，如果稍微调整A的位置，很有可能A还会和B交叠。把和候选单词最经常交叠的单词缓存起来(当出现了一个重叠时，可以进行一次缓存)，下次进行检测时首先与该缓存项进行检测。，首先测试这些经常交叠的单词。
//2.空间索引为了进一步减少冲突检测次数，采用了计算几何学中的“区域四叉树”算法，它递归地把二维空间划分成4个矩形区域。当一个文本被放置以后，使用类似 BuildRQTree 的方式，计算包含它的最小四叉树节点。
// 在进行检测的时候，通过查询整棵四叉树，可以避免检测根本不可能冲突的文本
//3.为词云和文字留出交互接口  词云可供添加class即可

(function (win) {

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

            g.append('circle').attr("cx",origin[0]).attr("cy",origin[1]).attr("r",5)
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
    win.wordle=function(wordList,option,textGroup,classname="word",exist=[]){ //exist参数是为了适应于画布上已有word的情况
        let boundary=option.boundary;
        console.log(wordList.length)

        //初始化存储每个单词绘图信息的数组,todo 可由option更改 &字体和颜色换些好看的 &旋转功能还未加
        let words2DInfo=d3.range(wordList.length).map(function(d,i){
            let word,weight;
            
            
             if(typeof wordList[d] === "string"){
                 word=wordList[d];
                 weight=(wordList.length-i)/10+0.3;
             }
             else{
                 word=wordList[d].word;
                 weight=wordList[d].weight;
                 // console.log(word,weight,wordList[d]);
                 // if(word||weight) continue;
             }
            let word2D=getWordInfo(word,weight,option.baseSize);
            word2D["position"]=[0,0];
            word2D["color"]='#3'+'369ce'[Math.floor(Math.random()*5)]+'69ce'[Math.floor(Math.random()*4)]//(Math.random()*0xffffff<<0).toString(16);
            word2D["fontStyle"]=option["font-family"];
            word2D["rotation"]=0;
            word2D['fit']=true;
            word2D['classname']=classname
            word2D["data"]=wordList[d];
            return word2D;
        });

        //尝试放入每个word，若不能放入则不显示
        for(let word of words2DInfo){
            if(!putAWord(word,boundary,exist)){
                word['fit']=false;
            }
            else{
                exist.push(word);
                drawOneWord(word,classname);
            }
        }

        if(option.drawBoundary) boundary.draw(textGroup);

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
                        return r*boundary.maxR-3;//留3px的间隙
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
                .attr("transform", "translate(" + word.position + ")") //textBox相对svg的位置
                .attr("x", 0)
                .attr("y", word.height)
                .style("font-size", word.fontSize+"px")
                .style("font-family",word.fontStyle)
                .style("font-weight","bold")
                .attr("fill", word.color)
                .attr('class',word.classname)
                .datum(word.data)
                .text(word.text);

            word['box']=theText[0][0].getBBox();
            word['box'].x+=word.position[0];
            word['box'].y+=word.position[1];
            // console.log(word['box'])?


            if(sprite){
                let rect = g.selectAll("rect")
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

        /**
         * 得到word的四叉树形式
         * @param word
         * @param weight
         * @param baseSize
         * @returns {{text: *, fontSize: number, width: (*|number), height: (*|number), tree: *, treeArray: (*|*), leafArray: (*|*)}}
         */
        function getWordInfo(word,weight=0.5,baseSize=120){
            let fontSize=~~(baseSize*weight); //weight set to be 0.1~1.1
            let canvas = document.createElement("canvas");
            canvas.width = fontSize*10;
            canvas.height = fontSize*2;
            //document.querySelector("#main").appendChild(canvas)
            let ctx = canvas.getContext("2d",{ willReadFrequently: true });
            let ratio = Math.sqrt(canvas.getContext("2d").getImageData(0, 0, 1, 1).data.length >> 2);//1px??
            ctx.font = ~~(fontSize / ratio) + "px bolder "+word.fontStyle; //~~:取整
            let textW=Math.ceil(ctx.measureText(word).width);
            let textH = Math.ceil(Math.max(fontSize ,ctx.measureText('m').width,ctx.measureText('\uFF37').width));
            let boxH=Math.ceil(textH*1.5);

            ctx.fillText(word, 0, textH); //texH is the text offset along Y

            //Get pixels of text
            function sprite(w, h) {
                try{
                    let pixels = ctx.getImageData(0, 0, w / ratio, h / ratio).data,
                    sprite = [];
                    for (let i = w * h; --i >= 0;) sprite[i] = pixels[(i << 2) + 3];
                    return sprite;
                }
                catch(e){
                    console.log(e);

                }
                
            }

            function makeTextTree() {
                let shape={
                    sprite: sprite(textW, boxH),
                    x: 0, y: 0,
                    r: textW, b: boxH,
                };
                return makeTree(shape, 0, 0, textW, boxH);
            }

            let textTree=makeTextTree();
            let array=flatten(textTree);
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

        // return{
        //     addOneWord:addOneWord,
        //
        // }

        return words2DInfo.filter(function(elem){return elem['fit']}); //返回绘制的信息
    }

})(window);
