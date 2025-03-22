// components/user-info/user-info.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        userInfo: {
            type: Object,
            value: {},
            observer(newVal, oldVal) {
                if (newVal) {
                    this.setData({
                        isVip: newVal.isVip,
                        isAdmin: newVal.isAdmin,
                        points: this.convertToWan(newVal.points),
                        markers: this.convertToWan(newVal.markers),
                        friends: this.convertToWan(newVal.friends),
                        deleted: this.convertToWan(newVal.deleted),
                        showRank: newVal.points > 0
                    })
                }
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {

    },

    /**
     * 组件的方法列表
     */
    methods: {
        onChooseAvatar(e) {
            const {
                avatarUrl
            } = e.detail
            this.setData({
                avatarUrl,
            })
        },
        onAvatarTap() {
            wx.showToast({
                title: '当前版本：v5.0',
                icon: 'none'
            })
        },
        toEdit() {
            wx.navigateTo({
                url: '/pages/my/edit/edit',
            })
        },
        showToast(event) {
            const {
                number,
                type
            } = event.currentTarget.dataset
            let title = ''
            switch (type) {
                case 'score':
                    title = `您的积分为${number}`
                    break;
                case 'marker':
                    title = `您标记了${number}个点`
                    break;
                case 'friend':
                    title = `您邀请了${number}个朋友`
                    break;
                case 'delete':
                    title = `您被删除了${number}个标记`
                    break;
                default:
                    title = '好像出错了'
                    break;
            }
            wx.showToast({
                title: title,
                icon: 'none'
            })
        },
        toMarkers(event) {
            const {
                deleted
            } = event.currentTarget.dataset
            wx.navigateTo({
                url: '/pages/my/markers/markers?deleted=' + deleted,
            })
        },
        convertToWan(num) {
            if (num > 100000) {
                return (num / 10000).toFixed(1) + "万";
            } else if (num > 10000) {
                return (num / 10000).toFixed(2) + "万";
            }
            return num;
        },
    }
})