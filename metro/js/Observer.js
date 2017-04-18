/**
 * Created by chenlu l on 2017/4/2 0002.
 */
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