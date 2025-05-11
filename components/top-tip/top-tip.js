import {
    formatTime
} from '../../utils/util'
Component({
    properties: {
        tip: {
            type: String,
            value: '请勿输入门禁密码等敏感信息，违者停用账号'
        },
        noticeList: {
            type: Array,
            //这个默认value没有效果？为啥？？？
            value: ['请勿输入门禁密码等敏感信息，违者停用账号']
        }
    },
    lifetimes: {
        created() {
            // console.log('组件被创建');
        },
        attached() {
            // console.log('组件被附加');
        },
        ready() {
            this.showNotices()
        },
        moved() {
            // console.log('组件被移动');
        },
        detached() {
            // console.log('组件被移除');
        }
    },
    /**
     * 组件的初始数据
     */
    data: {
        show: true, //默认显示
        noticeList: [], //
        // noticeListAppWithoutVIP: ['免费试用7天，结束后需要订阅 →'], //不是app会员时显示
        noticeListApp: [],
        content: [
            // '请勿标记门禁密码，违者停用账号',
            // '轻触右上角···添加小程序，使用更方便',
            // '已开通抖音：小区楼号分布图，欢迎关注',      
            // 'VIP将终身免费使用并移除所有广告',
            // '管理员免看广告删除违规和错误的标记',
        ],
    },
    lifetimes: {
        attached() {
            const userInfo = wx.getStorageSync('userInfo')
            if (userInfo.isIOSVip || userInfo.isAndroidVip) {
                this.setData({
                    noticeListApp: ['请勿标记门禁密码，违者停用账号', '已开通抖音：小区楼号分布图，欢迎关注']
                })
            } else {
                this.setData({
                    noticeListApp: ['免费试用7天，结束后需要订阅 →']
                })
            }
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        showNotices() {
            let currentDate = new Date();
            //当提示语被关闭时写入缓存，有效期一天
            let noticeExpiredDate = new Date(wx.getStorageSync('noticeExpiredDate'))
            if (currentDate > noticeExpiredDate || isNaN(noticeExpiredDate)) {
                this.setData({
                    show: true
                })
            } else {
                this.setData({
                    show: false
                })
            }
        },
        onClick() {
            const userInfo = wx.getStorageSync('userInfo')
            if (!userInfo.isIOSVip && !userInfo.isAndroidVip) {
                wx.navigateTo({
                    url: '/pages/my/vip/vip',
                })
            }
        },
        onAppNoticeClick() {
            const userInfo = wx.getStorageSync('userInfo')
            if (userInfo.openId || userInfo.appleId) {
                wx.navigateTo({
                    url: '/pages/my/login/login',
                })
            } else if (!userInfo.isIOSVip && !userInfo.isAndroidVip) {
                wx.navigateTo({
                    url: '/pages/my/vip/vip',
                })
            }
        },
        onClose() {
            this.setData({
                show: false
            })
            let currentDate = new Date();
            currentDate.setDate(currentDate.getDate() + 1);
            wx.setStorageSync('noticeExpiredDate', formatTime(currentDate))
        }
    }
})