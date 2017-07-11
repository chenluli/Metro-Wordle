//监听区域被选中事件
//显示区域详细信息（统计信息）
// var baseStationOverview = {
//     name:"baseStationOverview",
//     $bsView:undefined,
//     _tip: d3.tip().attr("class", "d3-tip").attr('id', 'celltip'),
//     _height:undefined,
//     _width:undefined,
//     _svgHeight:undefined,
//     _svgWidth:undefined,
//     _timematrix:undefined,
//     _defaultStation:1,
//
//     initialize: function() {
//         var self = this;
//         self._addListener();
//
//         self.$bsView=$("#basestation-view");
//         var $rbDiv=$("#right-bottom-bottom-div");
//
//         self._width=$rbDiv.width();
//         self._height=$rbDiv.height();
//         self._svgWidth=self._width*0.8;
//         // self._svgHeight=self._height;
//
//         self._getData(self._defaultStation);
//         self._createLegend();
//     },
//
//     _addListener: function() {
//         var self = this;
//         observerManager.addListener(self);
//     },
//
//     //day-24hour matrix
//     _createTimeMatrix:function(data){
//
//     },
//
//     //初始化celltip
//     _updateCellTip:function(data){
//
//     },
//
//     _createLegend:function(){
//         //todo 显示基站id,region的颜色图例
//
//     },
//
//     _getData:function(selectedBaseStation){
//         var self=this;
//         //遍历该基站对应的所有电话号码，获取数据
//         var url="/getJizhanBitMap?jizhan="+selectedBaseStation;
//
//         d3.json("testdata/view1.json", function(error, data){
//         	self._createTimeMatrix(data);
//         })
//     },
//
//
//     OMListen: function(message, data) {
//         var self = this;
//         if(message === "set:selectedBaseStation") {
//             //handle message
//             var station=dataCenter.globalVariables.selectedBaseStation;
//             if(station){
//                 self._getData(station);
//             }
//             else{
//                 self._getData(self._defaultStation);
//             }
//         }
//     }
// };
var $details=$("#details");

var detailInfo=function(poi){
	var originhtml="<span>详情</span><i class=\"fa fa-close\" aria-hidden=\"true\"></i>"
    $details.css("display","block");
    var link="https://www.dianping.com/shop/"+poi.shop_id;
    $details.html(
        originhtml+"<br>"+"<br>"+
        "商铺名："+poi.shop_name+"<br>"+"<br>"+
        "分类："+poi.shop_categories+"<br>"+"<br>"+
        "评分：<br>"
    );
    for(let score of poi.shop_scores){
    	$details.append(score.score_title+":"+score.score+"<br>")
    }
    $details.append("<br>"+"<a href="+link+">see more @大众点评</a>");

    $("#details i").click(function(){
		$details.css("display","none");
	})
};



//监听word被选中事件
//显示word详细信息