const CLOUDFUNC = require('../../utils/cloud.js');
const ORDER_STATUS= require('../../utils/order_status.js');
const UPLOAD = require('../../utils/upload.js');

Page({
    data:{
      isNewOrder:false,
      orderID:0,
      goodsID:0,
      ownerID:
      userID:0,
      submitting: false,
      loading: true,
      updatingDisabled: true,
      orderNextStep: "",
      orderPostID0Needed: false,
      orderPostID1Needed: false,
      paymentNeeded: false,
      isOwner: false,
      isBanker: false,
      isBuyer: false,
      canSee: false,
      goodInfo: {
        imageList: [],
        videoList: [],
      },
      orderDetails: {
      }
    },
    onLoad:function(e){
      const orderID = options.id ? String(options.id) : -1;
      const isNewOrder = (options.is_new == undefined) ? false : options.is_new;
      const goodsID = options.goods_id ? String(options.goodsID) : -1;

      this.setData({
        orderID: e.id,
        isNewOrder: isNewOrder,
        goodsID: goodsID,
        userID: wx.getStorageSync('userID'),
      })
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
	console.log('new order, nothing to be shown');
        this.setData({
                orderNextStep: ORDER_STATUS.getStatusText1(ORDER_STATUS.ORDERSTATUS_ENUM1.CREATED),
                isBuyer: true,
                canSee : true,
        });
        const goodsInfo = await loadGoodsInfo(this.data.goodsID);
        this.setData({
                ownerID: goodsInfo.owner_id,
                bankerID: goodsInfo.banker_id,
        });

	return;
      }

      const res = await CLOUDFUNC.callCloudFunction('getOrderInfo', {orderID:this.data.orderID})
      wx.hideLoading()
      if (!res || !res.orderInfo || (res.orderInfo.length == 0)) {
        wx.showModal({
          content: '订单信息获取失败',
          showCancel: false
        })
        return
      }

      this.setData({ orderDetails: res.orderInfo[0].order_details });
      this.setData({ bankerID: res.orderInfo[0].banker_id });
      this.setData({ goodsID: res.orderInfo[0].goods_id });
      if (this.data.orderDetails.banker_id && !this.data.orderDetails.banker_id.toString().trim()) {
          wx.showToast({ title: 'empty bankerID:', icon: 'none' });
      }
      let _isBanker = (this.data.userID == this.data.orderDetails.banker_id);
      let _isBuyer  = (this.data.userID == this.data.orderDetails.buyer_id);
      let _isOwner = (this.data.userID == this.data.orderDetails.owner_id);
      let _canSee   = (_isBanker || _isBuyer);
      this.setData({
	      orderNextStep: ORDER_STATUS.getStatusText1(this.data.orderDetails.order_status),
	      isBanker: _isBanker,
	      isBuyer: _isBuyer, 
	      isOwner: _isOwner, 
	      canSee : _canSee
      });
    },
    async loadGoodsInfo(goodsID) {
      if (!goodsID) {
        console.log('goodsID 为空，无法获取商品信息');
        return;
      }
      
      console.log('开始获取商品信息, goodsID:', goodsID);
      try {
        const res = await CLOUDFUNC.callCloudFunction('getGoodsInfo', { goodsID: goodsID });
        console.log('getGoodsInfo 返回结果:', JSON.stringify(res));
        
        // 处理返回数据结构 { code: 0, data: { goodsInfo: [...] } }
        const goodsList = res.data?.goodsInfo || res.goodsInfo;
        if (goodsList && goodsList.length > 0) {
          const _goodsInfo = goodsList[0].goods_info;
          // 映射字段名：goodsName -> name, pic -> 第一张图片
          this.setData({goodInfo:_goodsInfo});
          console.log('获取到商品数据:', _goodsInfo);
          return _goodsInfo;
        } else {
          console.log('goodsInfo 为空');
        }
      } catch (err) {
        console.error('获取商品信息失败:', err);
      }
    },

    updateButtonStatus() {
      let userID = this.data.userID; 
      let opEnabled = false;
      let isCanceler = (userID == this.data.orderDetails.canceler_id);
      let curOrderStatus = this.data.orderDetails.order_status;
      let needPostID0 = false;
      let needPostID1 = false;
      let needPayment = false;
      if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CREATED) {
        //recver firstly see, and then confirm
        opEnabled = this.data.isBuyer;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.AGREED) {
        //owner agree
        opEnabled = this.data.isOwner;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CONFIRM) {
        //buyer can pay
        opEnabled = this.data.isBanker;
      } else if (curOrderStatus ==ORDER_STATUS.ORDERSTATUS_ENUM1.PAYED) {
        //buyer paied for it
        opEnabled = this.data.isBuyer;
        needPayment = true;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.SENDTORECVER) {
        //banker got paied and then send it to buyer
        opEnabled = this.data.isBanker;
        needPostID0 = true;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.RECVED) {
        //buyer confirm get it
        opEnabled = this.data.isBuyer;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.DONE) {
        opEnabled = false;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CANCELLED) {
        //any time, cancel should be confirmed by eachother
        opEnabled = !isCanceler && (this.data.isBanker || this.data.isBuyer);
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.BACKING) {
        opEnabled = this.data.isBanker;
        needPostID1 = true;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.BACKED) {
        opEnabled = this.data.isBuyer;
      } else if (curOrderStatus == ORDER_STATUS.ORDERSTATUS_ENUM1.CLOSE) {{
        opEnabled = false;
      } else {
        opEnabled = false;
      }
      this.setData({
        updatingDisabled: !opEnabled,
        orderPostID0Needed: needPostID0,
        orderPostID1Needed: needPostID1,
        paymentNeeded: needPayment
      });
    },
    onPriceInput(e) {
      if (this.data.isBuyer) {
        this.setData({ 'orderDetails.price': e.detail.value });
      }
    },
    onSenderAddrInput(e)  { 
      if (this.data.isBanker) {
        this.setData({ 'orderDetails.senderAddr': e.detail.value });
      }
    },
    onRecverAddrInput(e)  {
      if (this.data.isBuyer) {
        this.setData({ 'orderDetails.recverAddr': e.detail.value });
      }
    },
    onPostIDInput(e)  {
      if (this.data.orderPostID0Needed && this.data.isBanker) {
        this.setData({ 'orderDetails.postID0': e.detail.value });
      } else if (this.data.orderPostID1Needed && this.data.isBuyer) {
        this.setData({ 'orderDetails.postID1': e.detail.value });
      }
    },
    async updateOrderData(newStatus) {
      try {
        console.log('updateOrderData, owner_id, goods_id, order_status', this.data.userID, this.data.goodsID, this.data.orderDetails.order_status)
        const res = await CLOUDFUNC.callCloudFunction('updateOrderInfo',
                {
		  orderID: this.data.orderID,
		  orderDetail: {
                    owner_id: this.data.ownerID,
                    banker_id: this.data.bankerID,
                    buyer_id: this.data.userID,
		    goods_id: this.data.goodsID,
		    order_status: newStatus,
		    order_details : this.data.orderDetails
		  }
                });
        return res;
      } catch (err) {
        wx.showToast({ title: 'updateOrderInfo INTERNET ERROR', icon: 'none' });
        console.error(err);
        throw err;
      }
    },
    cancelOrder()  {
      this.setData({ 'orderDetail.order_status': ORDER_STATUS.ORDERSTATUS_ENUM1.CANCELLED }); 
      this.updateOrderData(ORDER_STATUS.ORDERSTATUS_ENUM1.CANCELLED);
    },
    nextStep()  {
      if (this.data.canSee) {
        const _newStatus = this.data.orderDetail.order_status + 1 ;
        this.setData({ 'orderDetail.order_status': _newStatus });
        this.updateOrderData(_newStatus);
      }
    },
    navigateToGoods(e) {
      const goodsID = e.currentTarget.dataset.id;
      if (goodsID) {
        wx.navigateTo({
          url: '/pages/goods-details/index?id=' + goodsID
        });
      }
    },
    previewImage(e) {
      const urls = this.data.imageList ? this.data.imageList.map(i => i.url) : [e.currentTarget.dataset.url];
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
        wx.showToast({ title: 'FAILED to upload', icon: 'none' });
      }
    },

    deleteImage(e) {
      const list = [...this.data.goodInfo.imageList];
      list.splice(e.currentTarget.dataset.index, 1);
      this.setData({ 'goodInfo.imageList': list });
    },
    onShareAppMessage: function() {
      return {
          title: `SHARED FROM ${this.data.userName} `,
          path: '/pages/orders/order-type1-details?id=' + this.data.orderID
      };
    },
    onShareTimeline() { 
      return {
        title: '"' + wx.getStorageSync('userName') + '" ' + wx.getStorageSync('share_profile'),
        query: 'inviter_id=' + wx.getStorageSync('userID'),
        imageUrl: wx.getStorageSync('share_pic')
      }
    }
})
