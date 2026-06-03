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
'平台展示',
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

module.exports = {
  statusMap0: statusMapType0,
  ORDERSTATUS_ENUM0: ORDERSTATUS0,
  statusMap1: statusMapType1,
  ORDERSTATUS_ENUM1: ORDERSTATUS1,
  getStatusText0,
  getStatusText1
}

