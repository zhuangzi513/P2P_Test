const CLOUDFUNC = require('../../utils/cloud.js');
const ORDER_STATUS= require('../../utils/order_status.js');
const UPLOAD = require('../../utils/upload.js');

Page({
    data:{
      isNewOrder:false,
      orderID:0,
      bankerID:0,
      goodsID:0,
      userID:0,
      submitting: false,
      loading: true,
      updatingDisabled: true,
      orderNextStep: "",
      orderPostID0Needed: false,
      orderPostID1Needed: false,
      senderAddrNeeded: false,
      recverAddrNeeded: false,
      isOwner: false,
      isBanker: false,
      isBuyer: false,
      canSee: false,
      goodInfo: {
        name: '',
        imageList: [],
        videoList: [],
      },
      orderDetail: {
      }
    },
    onLoad:function(options){
      this.setData({
        orderID: options.id,
        isNewOrder: (options.is_new == undefined) ? false : options.is_new,
        bankerID: (options.banker_id == undefined) ? -1 : options.banker_id,
	userID: wx.getStorageSync('userID'),
      })
      console.log('orderID:', this.data.orderID)
      console.log('isNewOrder:', this.data.isNewOrder)
      console.log('bankerID:', this.data.bankerID)
    },
    onShow() {
      this.orderDetail().then(res => {
           this.updateButtonStatus()
      });
    },
    async orderDetail() {
      if (!this.data.orderID) {
        return
      }

      if (this.data.isNewOrder) {
        this.setData({
                orderNextStep: ORDER_STATUS.getStatusText0(ORDER_STATUS.ORDERSTATUS_ENUM0.CREATED),
                isOwner: true, //any one see this page may be owner.
                isBanker: (this.data.userID == this.data.bankerID),
                canSee : true 
        });
	console.log('new order, nothing to be shown')
	return;
      }

      wx.showLoading({ title: '' })
      const res = await CLOUDFUNC.callCloudFunction('getOrderInfo', {orderID:this.data.orderID})
      wx.hideLoading()
      if (!res || !res.orderInfo || res.orderInfo.length == 0) {
        wx.showModal({
          content: '订单信息获取失败',
          showCancel: false
        })
        return
      }
      this.setData({ orderDetail: res.orderInfo[0]})
      this.setData({ bankerID: res.orderInfo[0].banker_id})
      this.setData({ ownerID: res.orderInfo[0].owner_id})
      this.setData({ goodsID: res.orderInfo[0].goods_id})
      console.log('this order id:',this.data.orderDetail.order_id)

      let _isOwner  = (this.data.userID == this.data.orderDetail.owner_id)
      let _isBanker = (this.data.userID == this.data.orderDetail.banker_id);
      let _canSee   = (_isOwner || _isBanker);
      this.setData({
              orderNextStep: ORDER_STATUS.getStatusText0(this.data.orderDetail.order_status),
              isOwner: _isOwner,
              isBanker: _isBanker,
              canSee : _canSee
      });
    },
    updateButtonStatus() {
      let opEnabled = false;
      let isCanceler = (this.data.userID == this.data.orderDetail.canceler_id);
      let curOrderStatus = (this.data.isNewOrder == undefined) ? this.data.orderDetail.order_status : ORDER_STATUS.ORDERSTATUS_ENUM0.CREATED;
      console.log('curOrderStatus:', curOrderStatus)
      let needSenderAddr = false;
      let needRecverAddr = false;
      let needPostID0 = false;
      let needPostID1 = false;
      if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CREATED) {
        //recver firstly see, and then confirm
        opEnabled = this.data.isOwner;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.INIT) {
        opEnabled = this.data.isBanker;
        needRecverAddr = true;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CONFIRM) {
        //sender can send it to  recver
        opEnabled = this.data.isOwner;
        needSenderAddr = true;
        needPostID0 = true;
      } else if (curOrderStatus >= ORDER_STATUS.ORDERSTATUS_ENUM0.SEND0
                 && curOrderStatus < ORDER_STATUS.ORDERSTATUS_ENUM0.DONE) {
        //recver got it, and then sell it, and pay to sender
        opEnabled = this.data.isBanker;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.DONE) {
        //sender confirm got payed
        opEnabled = this.data.isOwner;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CANCELLED) {
        //done
        opEnabled = false;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.SEND1) {
        //any time, cancel should be confirmed by eachother
        opEnabled = !isCanceler;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.RECVED1) {
        opEnabled = this.data.isBanker;
        needPostID1 = true;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM0.CLOSE) {
        opEnabled = this.data.isOwner;
      } else {
        opEnabled = false;
      }
      this.setData({
        updatingDisabled: !opEnabled,
        senderAddrNeeded: needSenderAddr,
        recverAddrNeeded: needRecverAddr,
        orderPostID0Needed: needPostID0,
        orderPostID1Needed: needPostID1
      });
    },
    onNameInput(e) { this.setData({ 'goodInfo.name': e.detail.value }); },
    onColorInput(e) { this.setData({ 'goodInfo.color': e.detail.value }); },
    onSizeInputX(e) { this.setData({ 'goodInfo.sizeX': e.detail.value }); },
    onSizeInputY(e) { this.setData({ 'goodInfo.sizeY': e.detail.value }); },
    onSizeInputZ(e) { this.setData({ 'goodInfo.sizeZ': e.detail.value }); },
    onPriceInput(e) { this.setData({ 'goodInfo.price': e.detail.value }); },
    onDescInput(e)  { this.setData({ 'goodInfo.description': e.detail.value }); },
    onSenderAddrInput(e)  { this.setData({ 'orderDetail.senderAddr': e.detail.value }); },
    onRecverAddrInput(e)  { this.setData({ 'orderDetail.recverAddr': e.detail.value }); },
    onPostIDInput(e)  {
      if (this.data.orderPostID0Needed) {
        this.setData({ 'orderDetail.postID0': e.detail.value });
      } else if (this.data.orderPostID1Needed) {
        this.setData({ 'orderDetail.postID1': e.detail.value });
      }
    },
    async updateOrderData() {
      try {
        console.log('updateOrderData, owner_id, goods_id, order_status', this.data.userID, this.data.goodsID, this.data.orderDetail.order_status)
        const res = await CLOUDFUNC.callCloudFunction('updateOrderInfo',
                {
		  orderID: this.data.userID,
		  orderDetail: {
                    owner_id: this.data.userID,
		    goods_id: this.data.goodsID,
		    order_status: this.data.orderDetail.order_status,
		    order_details : this.data.orderDetail
		  }
                });
      } catch (err) {
        wx.showToast({ title: 'updateOrderInfo INTERNET ERROR', icon: 'none' });
        console.error(err);
      }
    },
    cancelOrder()  {
      this.setData({ 'orderDetail.order_status': ORDER_STATUS.ORDERSTATUS_ENUM0.CANCELLED }); 
      this.updateOrderData();
    },
    nextStep()  {
      if (this.data.isNewOrder) {
	if (this.data.bankerID > 0) {
          this.setData({ 'orderDetail.banker_id': this.data.bankerID });
          this.setData({ 'orderDetail.order_id': this.data.orderID});
          this.submitGood();
	} else {
	  wx.showToast({title:'NEW ORDER WITHOUT bankerID', icon:'none'});
	  return;
	}
      }
      this.checkOrder();
      if (this.data.isNewOrder)
        this.setData({ 'orderDetail.order_status': ORDER_STATUS.ORDERSTATUS_ENUM0.INIT });
      else
        this.setData({ 'orderDetail.order_status': this.data.orderDetail.order_status + 1 });
      this.updateOrderData();
    },
    previewImage(e) {
      const urls = this.data.imageList.map(i => i.url);
      wx.previewImage({ current: e.currentTarget.dataset.url, urls });
    },

    async addImage() {
      const remain = 9 - this.data.goodInfo.imageList.length;
      if (remain <= 0) return wx.showToast({ title: 'MAX 9', icon: 'none' });
      const res = await wx.chooseMedia({ count: remain, mediaType: ['image'], sizeType: ['compressed'] });
      wx.showLoading({ title: 'uploading...' });
      try {
        const urls = await UPLOAD.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'image', CLOUDFUNC);
        this.setData({ 'goodInfo.imageList': [...this.data.goodInfo.imageList, ...urls.map(url => ({ url }))] });
        wx.hideLoading();
      } catch (err) {
        wx.hideLoading();
	console.log(err);
        wx.showToast({ title: 'FAILED to upload', icon: 'none' });
      }
    },

    deleteImage(e) {
      const list = [...this.data.goodInfo.imageList];
      list.splice(e.currentTarget.dataset.index, 1);
      this.setData({ 'goodInfo.imageList': list });
    },

    async addVideo() {
      const remain = 3 - this.data.goodInfo.videoList.length;
      if (remain <= 0) return wx.showToast({ title: 'MAX 3', icon: 'none' });
      const res = await wx.chooseMedia({ count: remain, mediaType: ['video'], sourceType: ['album', 'camera'] });
      wx.showLoading({ title: 'uploading...' });
      try {
        const urls = await UPLOAD.uploadFiles(res.tempFiles.map(f => f.tempFilePath), 'video', CLOUDFUNC);
        const newVideos = urls.map(url => ({ url, thumb: '' }));
        this.setData({ 'goodInfo.videoList': [...this.data.goodInfo.videoList, ...newVideos] });
        wx.hideLoading();
      } catch (err) {
        wx.hideLoading();
        wx.showToast({ title: 'FAILED to upload', icon: 'none' });
      }
    },

    deleteVideo(e) {
      const list = [...this.data.goodInfo.videoList];
      list.splice(e.currentTarget.dataset.index, 1);
      this.setData({ 'goodInfo.videoList': list });
    },

    async newGoods() {
      try {
        const res = await CLOUDFUNC.callCloudFunction('newGoods',
                {
                  ownerId: this.data.userID,
                  bankerId: this.data.bankerID, 
                  goodsInfo: this.data.goodInfo
                });
        console.log('new Goods returned')
        if (!res || !res.goodsID) {
          wx.showToast({ title: 'FAIL TO CREATE GOODS', icon: 'none' });
          return;
        }
	this.setData({goodsID : res.goodsID});
        wx.showToast({ title: 'GOODS CREATED', icon: 'none' });
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/goods-details/index?id=' + res.goodsID
          });
        }, 1000);
      } catch (err) {
        wx.showToast({ title: 'newGoods INTERNET ERROR', icon: 'none' });
        console.error(err);
      }
    },
    submitGood() {
      console.log('submitGood')
      this.data.goodInfo.ownerID = wx.getStorageSync("userID");
      this.data.goodInfo.bankID = this.data.bankerID;
      if (!this.data.goodInfo.name.trim()) return wx.showToast({ title: 'NAME NEEDED', icon: 'none' });
      if (!this.data.goodInfo.color.trim()) return wx.showToast({ title: 'COLOR NEEDED', icon: 'none' });
      if (!this.data.goodInfo.sizeX.trim()) return wx.showToast({ title: 'SHAPEX NEEDED', icon: 'none' });
      if (!this.data.goodInfo.sizeY.trim()) return wx.showToast({ title: 'SHAPEY NEEDED', icon: 'none' });
      if (!this.data.goodInfo.sizeZ.trim()) return wx.showToast({ title: 'SHAPEZ NEEDED', icon: 'none' });
      const priceNum = parseFloat(this.data.goodInfo.price);
      if (isNaN(priceNum)) return wx.showToast({ title: 'PRICE NEEDED', icon: 'none' });
      this.newGoods().then();
    },
    checkOrder() {
      if (!this.data.orderDetail.goods_id) return wx.showToast({ title: 'EMPTY GOODS', icon: 'none' });
      if (!this.data.orderDetail.owner_id) return wx.showToast({ title: 'EMPTY ownerID', icon: 'none' });
      if (!this.data.orderDetail.banker_id) return wx.showToast({ title: 'EMPTY bankerID', icon: 'none' });

      if (this.data.senderAddrNeeded) {
        if (!this.data.orderDetail.senderAddr || !this.data.orderDetail.senderAddr.trim())
	  return wx.showToast({ title: 'SENDERADDR NEEDED', icon: 'none' });
      }
      if (this.data.recverAddrNeeded) {
        if (!this.data.orderDetail.recverAddr || !this.data.orderDetail.recverAddr.trim())
	  return wx.showToast({ title: 'RECVERADDR NEEDED', icon: 'none' });
      }

      if (this.data.orderPostID0Needed) {
        if (!this.data.orderDetail.postID0 || !this.data.orderDetail.postID0.trim()) return wx.showToast({title: "EMPTY POSTID", icon: 'none'});
      } else if (this.data.orderPostID1Needed) {
        if (!this.data.orderDetail.postID1 || !this.data.orderDetail.postID1.trim()) return wx.showToast({title: "EMPTY POSTID", icon: 'none'});
      }
    },
    onShareAppMessage: function() {
      return {
          title: `SHARED FROM ${this.data.userName} `,
          path: '/pages/orders/order-type0-details?id=' + this.data.orderID
      };
    },
    onShareTimeline() { 
      return {
        title: '"' + wx.getStorageSync('userName') + '" ' + wx.getStorageSync('share_profile'),
        query: 'inviter_id=' + wx.getStorageSync('userID'),
        imageUrl: wx.getStorageSync('share_pic')
      }
    },
    goGoodsDetail() {
      if (this.data.goodId) {
        wx.navigateTo({
          url: '/pages/goods-details/index?id=' + this.data.goodId
        });
      }
    }
})
