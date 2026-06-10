const ORDERSTATUS0 = {
  CREATED : -1,
  INIT: 0,
  CONFIRM: 1,
  SEND0: 2,
  RECVED0: 3,
  ONSALE: 4,
  HITTED: 5,
  SELLED: 6,
  PAYED: 7,
  DONE: 8,
  CANCELLED: 9,
  SEND1: 10,
  RECVED1: 11,
  CLOSE: 12
};
const statusMapType0 = [
'提交',
'确认',
'发货给商家',
'确认接收',
'展示商品',
'买家已出价',
'平台已售出',
'平台已付款',
'订单完成',
'取消订单',
'商品正在寄回',
'商品已寄回',
'关闭订单'
];

const ORDERSTATUS1 = {
CREATED: -1,
AGREED: 0,
CONFIRM: 1,
PAYED: 2,
SENDTORECVER: 3,
RECVED: 4,
DONE: 5,
CANCELLED: 6,
BACKING: 7,
BACKED: 8,
CLOSE: 9
};

const statusMapType1 = [
'提交',
'同意',
'确认',
'已付款',
'发货给买家',
'确认收到',
'订单完成',
'正在取消',
'正在寄回',
'已寄回',
'关闭订单'
];

// 安全获取状态文本，防止数组越界
function getStatusText0(status) {
  const idx = status + 1;
  if (idx >= 0 && idx < statusMapType0.length) {
    return statusMapType0[idx];
  }
  return 'Unknown';
}

function getStatusText1(status) {
  const idx = status + 1;
  if (idx >= 0 && idx < statusMapType1.length) {
    return statusMapType1[idx];
  }
  return 'Unknown';
}

//function checkMyTurn0(curOrderStatus, isBanker, isOwner, isBuyer, isCanceler) {
//      let opEnabled = false;
//      if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CREATED) {
//        //recver firstly see, and then confirm
//        opEnabled = isOwner;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.INIT) {
//        opEnabled = isBanker;
//        needRecverAddr = true;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CONFIRM) {
//        //sender can send it to  recver
//        opEnabled = isOwner;
//      } else if (curOrderStatus >= ORDER_STATUS.ORDERSTATUS_ENUM0.SEND0
//                 && curOrderStatus < ORDER_STATUS.ORDERSTATUS_ENUM0.DONE) {
//        //recver got it, and then sell it, and pay to sender
//        opEnabled = isBanker;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.DONE) {
//        //sender confirm got payed
//        opEnabled = isOwner;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CANCELLED) {
//        //done
//        opEnabled = false;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.SEND1) {
//        //any time, cancel should be confirmed by eachother
//        opEnabled = !isCanceler;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.RECVED1) {
//        opEnabled = isBanker;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CLOSE) {
//        opEnabled = this.data.isOwner;
//      } else {
//        opEnabled = false;
//      }
//}
const TYPE0_BANKER_TURN = [
  ORDERSTATUS0.INIT,
  ORDERSTATUS0.SEND0,
  ORDERSTATUS0.RECVED0,
  ORDERSTATUS0.ONSALE,
  ORDERSTATUS0.HITTED,
  ORDERSTATUS0.SELLED,
  ORDERSTATUS0.PAYED
];
const TYPE0_OWNER_TURN  = [
  ORDERSTATUS0.CREATED,
  ORDERSTATUS0.CONFIRM,
  ORDERSTATUS0.DONE
];
//function checkMyTurn1(curOrderStatus, isBanker, isOwner, isBuyer, isCanceler) {
//      if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CREATED) {
//        //recver firstly see, and then confirm
//        opEnabled = this.data.isBuyer;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.AGREED) {
//        //owner agree
//        opEnabled = this.data.isOwner;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CONFIRM) {
//        cancelingDisabled: true,
//        //buyer can pay
//        opEnabled = this.data.isBanker;
//      } else if (curOrderStatus ==ORDER_STATUS.ORDERSTATUS_ENUM1.PAYED) {
//        //buyer paied for it
//        cancelingDisabled: true,
//        opEnabled = this.data.isBuyer;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.SENDTORECVER) {
//        //banker got paied and then send it to buyer
//        opEnabled = this.data.isBanker;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.RECVED) {
//        //buyer confirm get it
//        opEnabled = this.data.isBuyer;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.DONE) {
//        opEnabled = false;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CANCELLED) {
//        //any time, cancel should be confirmed by eachother
//        opEnabled = !isCanceler && (this.data.isBanker || this.data.isBuyer);
//      //} else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.BACK_CONFIRM) {
//      //  opEnabled = this.data.isBanker;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.BACKING) {
//        opEnabled = this.data.isBanker;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.BACKED) {
//        opEnabled = this.data.isBuyer;
//      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CLOSE) {
//        opEnabled = false;
//      } else {
//        opEnabled = false;
//      }
//}
const TYPE1_BANKER_TURN = [
  ORDERSTATUS1.CONFIRM,
  ORDERSTATUS1.SENDTORECVER,
];
const TYPE1_OWNER_TURN = [
  ORDERSTATUS1.AGREED
];
const TYPE1_BUYER_TURN = [
  ORDERSTATUS1.CREATED,
  ORDERSTATUS1.PAYED,
  ORDERSTATUS1.RECVED
];

module.exports = {
  statusMap0: statusMapType0,
  ORDERSTATUS_ENUM0: ORDERSTATUS0,
  statusMap1: statusMapType1,
  ORDERSTATUS_ENUM1: ORDERSTATUS1,
  getStatusText0,
  getStatusText1,
  type0BankerTurn: TYPE0_BANKER_TURN,
  type1BankerTurn: TYPE1_BANKER_TURN,
  type0OwnerTurn: TYPE0_OWNER_TURN,
  type1OwnerTurn: TYPE1_OWNER_TURN,
  type1BuyerTurn: TYPE1_BUYER_TURN
}

