//将地铁线路图抽取成轮廓形状，以布局wordle
//1.补充边框的四个顶点。在每个线路的两头补充节点：方向和最后一段相同，节点为和边界的交点。
//2.使用getRegions得到regions，同时注意记录每段的dir，要取得region每条边的方向和拐点
//3.由2得的region每条边的顶点和方向信息求其极坐标方程。

// var lines=new Array(); 
// for(var i=1;i<17;i++) {
// 	lines[i]={
// 		"paths":new Array(),
// 		"nodes":new Array(),
// 	}
// }



// d3.json("data/path.json",function (e,data){
//    var paths=data;
//    console.log(path);
//    //
   
//    for(var path of paths){
//    	  lines[path["line"]]["paths"].push(path)
//    	  lines[path["line"]]["nodes"].push(path)
//    	  lines[path["line"]]["paths"].push(path)
//    }

// })

// d3.json("data/sta.json",function (e,data){
// 	var stations=data;
// 	console.log(stations)

// })


// var net={}
// for(var s of stations){
    
// }

// //线路
// lines={}
// allLines=path_df["line"].drop_duplicates()
// for i in allLines:
//     lines[i]=set(station_df.ix[station_df["line"]==i,"name"])
// console.log(lines)

// #定义一个字典储存站点之间的连接关系 net={"station_start":["station_to"]}
// #无向图
// net={}
// for s in allStation:
//     nexts=set(path_df.ix[path_df["station_start"]==s,"station_to"])
//     neibors=nexts|set(path_df.ix[path_df["station_to"]==s,"station_start"].values)
//     net[s]=neibors

// def appendToL(u,v,L):
//         while(stations[u]['P']!=stations[v]['P']) :
//             u=stations[u]['P']
//             v=stations[v]['P']
//             L.insert(0,u)
//             L.append(v)
        
//         L.insert(0,stations[u]['P'])

// def getRegions():
//     queue=[] #模拟队列，注意dequeue使用pop(0)

//     #选一点作为源节点
//     s=allStation[allStation.index[0]]
//     stations[s]["color"]=1
//     stations[s]["d"]=0

//     queue.append(s)

//     while len(queue):
//         u=queue.pop(0)
//         for v in net[u]:
//             if stations[v]["color"]==0:
//                 stations[v]["color"]=1
//                 stations[v]["d"]=stations[u]['d']+1
//                 stations[v]['P']=u
//                 queue.append(v)

//             elif stations[v]["color"]==1:
//                 stations[v]['M'].append(u)

//             else: pass

//         stations[u]['color']=2

//     #是否还有节点未搜索到过？
//     closeRegions=[]
//     for u in allStation:
//         if len(stations[u]['M']):
//             v=stations[u]['M'][0]
//             L=[]
//             closeRegions.append(L)
//             if stations[v]["d"]==stations[u]["d"]:
//                 L.append(u)
//                 L.append(v)
//                 appendToL(u,v,L)

//             if stations[v]["d"]==(stations[u]["d"]-1):
//                 L.append(stations[u]['P'])
//                 L.append(u)
//                 L.append(v)
//                 appendToL(stations[u]['P'],v,L)

//         else:
//             pass
    
//     return closeRegions