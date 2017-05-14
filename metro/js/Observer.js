//版本一
// var PubSub = {
//     //订阅者角色
//     subscribe : function(ev, callback){
//         //创建_callback对象，除非它已经存在。
//         var calls = this._callback || (this._callback = {});
//         /*
//          * 针对给定的事件ev创建一个数组，除非这个数组已经存在
//          * 然后调用函数追加到这个数组中
//          * */
//         (this._callback[ev] || (this._callback[ev] = [])).push(callback);

//         return this;
//     },
//     //发布者角色
//     publish: function(){
//         //将arguments对象转换成为真正的数组
//         var args = Array.prototype.slice.call(arguments,0);
//         //拿出第一个参数，即事件名称
//         var ev = args.shift();

//         /*
//          * 如果不存在_callback对象，则返回
//          * 或者如果不包含给定事件对应的数组
//          * */
//         var list, calls, i, l;
//         if(!(calls = this._callback)) return this;
//         if(!(list = this._callback[ev])) return this;

//         //触发回调
//         for(i = 0, l = list.length; i < l; i++){
//             list[i].apply(this,args);
//         }

//         return this;
//     }
// };

//调用方式
// PubSub.subscribe("wem", function(){
//     alert("Wem");
// });
//
// PubSub.publish("wem");

//版本二
var observer = {
    //订阅
    addSubscriber: function (callback) {
        this.subscribers[this.subscribers.length] = callback;
    },
    //退订
    removeSubscriber: function (callback) {
        for (var i = 0; i < this.subscribers.length; i++) {
            if (this.subscribers[i] === callback) {
                delete (this.subscribers[i]);
            }
        }
    },
    //发布
    publish: function (what) {
        for (var i = 0; i < this.subscribers.length; i++) {
            if (typeof this.subscribers[i] === 'function') {
                this.subscribers[i](what);
            }
        }
    },
    // 将对象o具有观察者功能
    make: function (o) { 
        for (var i in this) {
            o[i] = this[i];
            o.subscribers = [];
        }
    }
};

//====然后订阅2个对象blogger和user，使用observer.make方法将这2个对象具有观察者功能，代码如下：
var blogger = {
    recommend: function (id) {
        var msg = 'dudu 推荐了的帖子:' + id;
        this.publish(msg);
    }
};

var user = {
    vote: function (id) {
        var msg = '有人投票了!ID=' + id;
        this.publish(msg);
    }
};

observer.make(blogger);
observer.make(user);

//使用方法就比较简单了，订阅不同的回调函数，以便可以注册到不同的观察者对象里（也可以同时注册到多个观察者对象里);
var tom = {
    read: function (what) {
        console.log('Tom看到了如下信息：' + what)
    }
};

var mm = {
    show: function (what) {
        console.log('mm看到了如下信息：' + what)
    }
};
// 订阅
blogger.addSubscriber(tom.read);
blogger.addSubscriber(mm.show);
blogger.recommend(123); //调用发布

//退订
blogger.removeSubscriber(mm.show);
blogger.recommend(456); //调用发布

//另外一个对象的订阅
user.addSubscriber(mm.show);
user.vote(789); //调用发布