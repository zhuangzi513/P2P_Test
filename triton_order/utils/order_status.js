const ORDERSTATUS0 = {
  CREATED : -1,
  INIT: 0,
  CONFRIM: 1,
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
'Initialization',
'Confirm',
'SendToSaler',
'ConfirmRecived',
'Exhibition',
'Hitted',
'Selled',
'Payed',
'Done',
'Canceled',
'Backing',
'Backed',
'Closed'
];

const ORDERSTATUS1 = {
CREATED: -1,
AGREED: 0,
CONFIRM: 1,
PAYED: 2,
SENDTORECVER: 3,
RECVED0: 4,
DONE: 5,
CANCELLED: 6,
BACKING: 7,
BACKED: 8,
CLOSE: 9
};

const statusMapType1 = [
'Initialization',
'AGREE',
'CONFIRM',
'PAYED',
'SENDTORECVER',
'RECVED0',
'DONE',
'CANCELLED',
'BACKING',
'BACKED',
'CLOSED'
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

