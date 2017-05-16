//发布者构造函数
function Publisher() {
  this.subscribers = []; //订阅和发布都是围绕这个数组进项
}
//执行发布的方法，遍历订阅者对方法
Publisher.prototype.publish = function(data) {
  this.subscribers.forEach(
    function(fn) {
      fn(data);
    }
  );
  return this;
};

//订阅的方法，订阅者对象写入subscribers数组
//下面这两个方法挂载在Function原型上
Function.prototype.subscribe = function(publisher) {
  var that = this;
  var alreadyExists = publisher.subscribers.some(
    function(el) {
      if ( el === that ) { //如果已经订阅的话，立即返回
        return;
      }
    }
  );
  if ( !alreadyExists ) { //订阅者的订阅对象插入数组
    publisher.subscribers.push(this);//注意命名空间
  }
  return this;
};
//取消订阅的方法
Function.prototype.unsubscribe = function(publisher) {
  var that = this;
  publisher.subscribers = publisher.subscribers.filter(
    function(el) {
      if ( el !== that ) { //如果是订阅对象就过滤掉
        return el;
      }
    }
  );
  return this;
};

//发布者对象
var originData=new Publisher;
var dataLoader = new Publisher;
var queryClick= new Publisher;
var filterChange= new Publisher;
var ctgClick=new Publisher;
var wordleComplete=new Publisher;