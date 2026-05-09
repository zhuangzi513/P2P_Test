const ORDERSTATUS0 = {
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
'AGREED',
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



module.exports = {
statusMap0: statusMapType0,
ORDERSTATUS_ENUM0: ORDERSTATUS0,
statusMap1: statusMapType1,
ORDERSTATUS_ENUM1: ORDERSTATUS1,
}

