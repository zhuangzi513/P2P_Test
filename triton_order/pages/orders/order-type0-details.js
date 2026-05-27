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
      cancelingDisabled: true,
      orderNextStep: "",
      SENDER_ADDR_ENABLED: false,
      RECVER_ADDR_ENABLED: false,
      POST_ID0_ENABLED: false,
      POST_ID1_ENABLED: false,
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
        fixedprice: false,
      },
      orderDetails: {
      }
    },
    onLoad:function(options){
      // URL 参数都是字符串，orderID 保持字符串以便云函数处理
      const orderID = options.id ? Number(options.id) : 0;
      const bankerID = options.banker_id ? Number(options.banker_id) : -1;
      const isNewOrder = (options.is_new == undefined) ? false : options.is_new;
      
      console.log('onLoad options:', options);
      console.log('orderID:', orderID, 'bankerID:', bankerID, 'isNewOrder:', isNewOrder);

      this.setData({
        orderID: orderID,
        isNewOrder: isNewOrder,
        bankerID: bankerID,
        userID: wx.getStorageSync('userID'),
        ownerID: wx.getStorageSync('userID'),
      })
    },
    
    async fillDefaultAddress() {
      try {
        const res = await CLOUDFUNC.callCloudFunction('queryAddress', {
          token: wx.getStorageSync('token')
        });
        if (res.code === 0 && res.data.result && res.data.result.length) {
          const defaultAddr = res.data.result.find(item => item.isDefault === true);
          if (defaultAddr) {
            const fullAddress = `${defaultAddr.linkMan} ${defaultAddr.mobile} ${defaultAddr.address}`;
            if (!this.data.orderDetails.sender_addr) {
              this.setData({
                'orderDetails.sender_addr': fullAddress
              });
            }
            if (!this.data.orderDetails.recver_addr) {
              this.setData({
                'orderDetails.recver_addr': fullAddress
              });
            }
          }
        }
      } catch (err) {
        console.error('获取默认地址失败', err);
      }
    },
    
    onSelectAddress(e) {
      const type = e.currentTarget.dataset.type;
      wx.navigateTo({
        url: '/pages/my/select_address?selectMode=true',
        events: {
          selectAddress: (address) => {
            const fullAddress = `${address.linkMan} ${address.mobile} ${address.address}`;
            if (type === 'sender') {
              this.setData({
                'orderDetails.sender_addr': fullAddress
              });
            } else {
              this.setData({
                'orderDetails.recver_addr': fullAddress
              });
            }
          }
        }
      });
    },
    onShow() {
      this.orderDetail().then(res => {
           this.updateButtonStatus()
      });
    },
    async orderDetail() {
      if (!this.data.orderID) {
        console.log('orderID 为空，无法获取订单详情');
        return;
      }

      if (this.data.isNewOrder) {
        this.setData({
                orderNextStep: ORDER_STATUS.getStatusText0(ORDER_STATUS.ORDERSTATUS_ENUM0.CREATED),
                isOwner: true, //any one see this page may be owner.
                isBanker: false,
                canSee : true 
        });
	console.log('new order, nothing to be shown');
	return;
      }

      wx.showLoading({ title: '加载中...' });
      console.log('开始获取订单详情, orderID:', this.data.orderID, typeof this.data.orderID);
      
      try {
        const res = await CLOUDFUNC.callCloudFunction('getOrderInfo', {orderID: this.data.orderID});
        console.log('getOrderInfo 返回结果:', res);
        
        wx.hideLoading();
        
        if (!res) {
          console.log('res 为空');
          wx.showModal({ content: '网络错误，请重试', showCancel: false });
          return;
        }
        
        if (!res.orderInfo || res.orderInfo.length == 0) {
          console.log('orderInfo 为空或长度为0');
          wx.showModal({ content: '订单不存在', showCancel: false });
          return;
        }
        
	const _orderInfo = res.orderInfo[0];
        this.setData({
	               orderDetails: _orderInfo.order_details,
                       bankerID    : _orderInfo.banker_id,
                       ownerID     : _orderInfo.owner_id,
                       goodsID     : _orderInfo.goods_id,
                       isOwner     : (_orderInfo.owner_id == this.data.userID),
                       isBanker    : (_orderInfo.banker_id == this.data.userID),
                       canSee      : (_orderInfo.banker_id == this.data.userID || _orderInfo.owner_id == this.data.userID),
                       orderNextStep: ORDER_STATUS.getStatusText0(_orderInfo.order_details.order_status),
		     });
        
        // 加载商品信息
        if (_orderInfo.goods_id) {
          this.loadGoodsInfo(_orderInfo.goods_id);
        }
      } catch (err) {
        wx.hideLoading();
        console.error('获取订单详情失败:', err);
        wx.showModal({ content: '获取订单失败: ' + (err.message || err), showCancel: false });
      }
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
          const goods = goodsList[0].goods_info;
          // 映射字段名：goodsName -> name, pic -> 第一张图片
          const mappedGoodsInfo = {
            ...goods,
            banker_order_id: goods.banker_order_id,
            name: goods.goodsName || goods.name || '',
            price: goods.price || '',
            fixedprice: goods.fixedprice || false,
            color: goods.color || '',
            sizeX: goods.sizeX || '',
            sizeY: goods.sizeY || '',
            sizeZ: goods.sizeZ || '',
            description: goods.description || '',
            imageList: goods.imageList || [],
            videoList: goods.videoList || [],
            pic: goods.pic || (goods.imageList && goods.imageList[0]?.url) || ''
          };
          this.setData({ goodInfo: mappedGoodsInfo });
          console.log('获取到商品数据:', mappedGoodsInfo);
        } else {
          console.log('goodsInfo 为空');
        }
      } catch (err) {
        console.error('获取商品信息失败:', err);
      }
    },
    updateButtonStatus() {
      let opEnabled = false;
      let isCanceler = (this.data.userID == this.data.orderDetails.canceler_id);
      let curOrderStatus = (this.data.isNewOrder) ? ORDER_STATUS.ORDERSTATUS_ENUM0.CREATED : this.data.orderDetails.order_status;
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
	console.log('postdID0 needed===================================')
      } else if (curOrderStatus >= ORDER_STATUS.ORDERSTATUS_ENUM0.SEND0
                 && curOrderStatus < ORDER_STATUS.ORDERSTATUS_ENUM0.DONE) {
        //recver got it, and then sell it, and pay to sender
        needPostID0 = true;
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
        cancelingDisabled: curOrderStatus >= ORDER_STATUS.ORDERSTATUS_ENUM0.HITTED,
        senderAddrNeeded: needSenderAddr,
        recverAddrNeeded: needRecverAddr,
        orderPostID0Needed: needPostID0,
        orderPostID1Needed: needPostID1,
        SENDER_ADDR_ENABLED : needSenderAddr,
        RECVER_ADDR_ENABLED : needRecverAddr,
        POST_ID0_ENABLED    : needPostID0,
        POST_ID1_ENABLED    : needPostID1,
      });
      if (SENDER_ADDR_ENABLED) {
         fillDefaultAddress().then();
      }
      if (RECVER_ADDR_ENABLED) {
         fillDefaultAddress().then();
      }
    },
    onNameInput(e) { this.setData({ 'goodInfo.name': e.detail.value }); },
    onColorInput(e) { this.setData({ 'goodInfo.color': e.detail.value }); },
    onSizeInputX(e) { this.setData({ 'goodInfo.sizeX': e.detail.value }); },
    onSizeInputY(e) { this.setData({ 'goodInfo.sizeY': e.detail.value }); },
    onSizeInputZ(e) { this.setData({ 'goodInfo.sizeZ': e.detail.value }); },
    onPriceInput(e) { this.setData({ 'goodInfo.price': e.detail.value }); },
    onFixedPriceToggle() {
      this.setData({ 'goodInfo.fixedprice': !this.data.goodInfo.fixedprice });
    },
    onDescInput(e)  { this.setData({ 'goodInfo.description': e.detail.value }); },
    onSenderAddrInput(e)  { this.setData({ 'orderDetails.sender_addr': e.detail.value }); },
    onRecverAddrInput(e)  { this.setData({ 'orderDetails.recver_addr': e.detail.value }); },
    onPostIDInput(e)  {
      console.log('PostID Needed:', this.data.orderPostID0Needed, this.data.orderPostID1Needed)
      if (this.data.orderPostID0Needed) {
        this.setData({ 'orderDetails.postID0': e.detail.value });
      } else if (this.data.orderPostID1Needed) {
        this.setData({ 'orderDetails.postID1': e.detail.value });
      }
    },
    async updateOrderData() {
      try {
        console.log('updateOrderData, owner_id, goods_id, order_status', this.data.userID, this.data.goodsID, this.data.orderDetails.order_status)
        console.log('updateOrderData, details:', this.data.orderDetails);
        const res = await CLOUDFUNC.callCloudFunction('updateOrderInfo',
                {
		  orderID: this.data.orderID,
		  orderDetail: {
                    owner_id: this.data.userID,
		    goods_id: this.data.goodsID,
		    order_status: this.data.orderDetails.order_status,
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
      this.setData({ 'orderDetails.order_status': ORDER_STATUS.ORDERSTATUS_ENUM0.CANCELLED }); 
      this.updateOrderData().catch(err => console.error('cancelOrder failed:', err));
    },
    async nextStep()  {
      let goodsID = this.data.goodsID;  // 用局部变量存储，避免依赖 setData 异步更新
      
      if (this.data.isNewOrder) {
	if (this.data.bankerID > 0) {
          this.setData({ 
            'orderDetails.banker_id': this.data.bankerID,
            'orderDetails.order_id': this.data.orderID
          });
          
          try {
            // ✅ submitGood 返回 { goodsID, _setDataDone } 对象
            const result = await this.submitGood();
            if (!result || !result.goodsID) {
              wx.showToast({ title: 'GOODS NOT CREATED', icon: 'none' });
              return;
            }
            // ✅ 使用返回的 goodsID，不依赖 this.data.goodsID
            goodsID = result.goodsID;
            console.log('submitGood returned goodsID:', goodsID);
          } catch (err) {
            console.error('submitGood failed:', err);
            return;
          }
	} else {
	  wx.showToast({title:'NEW ORDER WITHOUT bankerID', icon:'none'});
	  return;
	}
      }
      
      // 验证订单数据（传入 goodsID）
      const validation = this.checkOrder(goodsID);
      if (!validation) return;
      
      if (this.data.isNewOrder) {
        this.setData({ 'orderDetails.order_status': ORDER_STATUS.ORDERSTATUS_ENUM0.INIT });
      } else {
        this.setData({ 'orderDetails.order_status': this.data.orderDetails.order_status + 1 });
      }
      
      // 等待订单更新完成
      await this.updateOrderData();
      
      // ✅ 使用局部变量 goodsID，而不是 this.data.goodsID
      setTimeout(() => {
        const redirectID = goodsID || this.data.goodsID;
        wx.redirectTo({
          url: '/pages/goods-details/index?id=' + redirectID,
        });
      }, 1000);
    },
    /**
     * 提交商品 - 返回 Promise，结果包含 goodsID
     * 避免依赖 setData 异步更新后的 this.data.goodsID
     */
    async submitGood() {
      console.log('submitGood')
      this.data.goodInfo.ownerID = wx.getStorageSync("userID");
      this.data.goodInfo.bankID = this.data.bankerID;
      this.data.goodInfo.banker_order_id = this.data.orderID;
      
      // 验证
      if (!this.data.goodInfo.name.trim()) {
        wx.showToast({ title: 'NAME NEEDED', icon: 'none' });
        throw new Error('NAME NEEDED');
      }
      if (!this.data.goodInfo.color.trim()) {
        wx.showToast({ title: 'COLOR NEEDED', icon: 'none' });
        throw new Error('COLOR NEEDED');
      }
      if (!this.data.goodInfo.sizeX.trim()) {
        wx.showToast({ title: 'SHAPEX NEEDED', icon: 'none' });
        throw new Error('SHAPEX NEEDED');
      }
      if (!this.data.goodInfo.sizeY.trim()) {
        wx.showToast({ title: 'SHAPEY NEEDED', icon: 'none' });
        throw new Error('SHAPEY NEEDED');
      }
      if (!this.data.goodInfo.sizeZ.trim()) {
        wx.showToast({ title: 'SHAPEZ NEEDED', icon: 'none' });
        throw new Error('SHAPEZ NEEDED');
      }
      const priceNum = parseFloat(this.data.goodInfo.price);
      if (isNaN(priceNum)) {
        wx.showToast({ title: 'PRICE NEEDED', icon: 'none' });
        throw new Error('PRICE NEEDED');
      }
      
      // ✅ 等待 newGoods 完成并获取结果
      return await this.newGoods();
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
    /**
     * 创建商品 - 返回 Promise，包含 goodsID
     * ✅ 核心：返回结果对象而不是依赖 setData 后的 this.data
     */
    newGoods() {
      return CLOUDFUNC.callCloudFunction('newGoods', {
        ownerId: this.data.userID,
        bankerId: this.data.bankerID,
        goodsInfo: this.data.goodInfo
      }).then(res => {
        console.log('new Goods returned:', res);
        if (!res || !res.goodsID) {
          wx.showToast({ title: 'FAIL TO CREATE GOODS', icon: 'none' });
          throw new Error('FAIL TO CREATE GOODS');
        }
        
        // ✅ 同时更新 setData（用于 UI）和返回结果（用于逻辑）
        const goodsID = res.goodsID;
        const setDataDone = new Promise(resolve => {
          this.setData({ goodsID: goodsID }, resolve);
        });
        
        // 返回对象，包含 goodsID 和 setData 完成 Promise
        return { 
          goodsID: goodsID,
          _setDataDone: setDataDone
        };
      }).catch(err => {
        wx.showToast({ title: 'newGoods INTERNET ERROR', icon: 'none' });
        console.error(err);
        throw err;
      });
    },
    /**
     * 验证订单数据
     * @param {number|null} passedGoodsID - 从 newGoods 返回的 goodsID，避免依赖 setData 异步
     */
    checkOrder(passedGoodsID) {
      // ✅ 优先使用传入的 goodsID，新订单模式下不依赖 setData 异步更新
      let _goodsID  = (passedGoodsID || this.data.goodsID);
      let _ownerID  = this.data.ownerID ;
      let _bankerID = this.data.bankerID;
      if (!_goodsID) {
        wx.showToast({ title: 'EMPTY GOODS', icon: 'none' });
	console.log('checkOrder, goodsid', _goodsID )
        return false;
      }
      if (!_ownerID) {
        wx.showToast({ title: 'EMPTY ownerID', icon: 'none' });
	console.log('checkOrder ownerid', _ownerID )
        return false;
      }
      if (!_bankerID) {
        wx.showToast({ title: 'EMPTY bankerID', icon: 'none' });
	console.log('checkOrder bankerid', _bankerID )
        return false;
      }

      if (this.data.senderAddrNeeded) {
        if (!this.data.orderDetails.sender_addr || !this.data.orderDetails.sender_addr.trim()) {
          wx.showToast({ title: 'SENDERADDR NEEDED', icon: 'none' });
          return false;
        }
      }
      if (this.data.recverAddrNeeded) {
        if (!this.data.orderDetails.recver_addr || !this.data.orderDetails.recver_addr.trim()) {
          wx.showToast({ title: 'RECVERADDR NEEDED', icon: 'none' });
          return false;
        }
      }

      if (this.data.orderPostID0Needed) {
        if (!this.data.orderDetails.postID0 || !this.data.orderDetails.postID0.trim()) {
          wx.showToast({ title: "EMPTY POSTID", icon: 'none' });
          return false;
        }
      } else if (this.data.orderPostID1Needed) {
        if (!this.data.orderDetails.postID1 || !this.data.orderDetails.postID1.trim()) {
          wx.showToast({ title: "EMPTY POSTID", icon: 'none' });
          return false;
        }
      }
      return true;
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
