import {
    generateXId,
    checkWords,
    checkChineseNumbers,
    msgSecCheck,
    checkString
} from '../../utils/util'
import {
    addMarker,
    updateMarker
} from '../../utils/apis'
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        markerTypeIndex: {
            type: Number,
            value: -1,
            observer(newVal, oldVal) {
                if (newVal > -1) {
                    let title = ''
                    let place = ''
                    let bgColor = ''
                    let required = false
                    switch (newVal) {
                        case 0:
                            title = '楼号'
                            place = '必填，最多10个字'
                            bgColor = '#0074FE'
                            required = true
                            break;
                        case 1:
                            title = '出入口'
                            place = '选填，最多10个字'
                            bgColor = '#E85827'
                            required = false
                            break;
                        case 2:
                            title = '公厕'
                            place = '选填，最多10个字'
                            bgColor = '#8c444f'
                            required = false
                            break;
                        case 3:
                            title = '维修点'
                            place = '选填，最多10个字'
                            bgColor = '#8c444f'
                            required = false
                            break;
                        case 4:
                            title = '换电站'
                            place = '选填，最多10个字'
                            bgColor = '#8c444f'
                            required = false
                            break;
                        case 5:
                            title = '外卖柜'
                            place = '选填，最多10个字'
                            bgColor = '#8c444f'
                            required = false
                            break;
                        case 6:
                            title = '生活类'
                            place = '必填，最多10个字'
                            bgColor = '#8c444f'
                            required = true
                            break;
                        default:
                            break;
                    }
                    this.setData({
                        pointsCount: 0,
                        title,
                        place,
                        bgColor,
                        required,
                        currentTagList: this.data[`tagList${newVal}`] || []
                    })
                }
            }
        },
        showChooseMarker: {
            type: Boolean,
            value: false
        },
        showForm: {
            type: Boolean,
            value: false
        },
        markerDetail: {
            type: Object,
            value: {},
            observer(newVal, oldVal) {
                if (newVal) {

                    this.onUserMarkerEdit(newVal)
                }
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        pointsCount: 0,
        action: '新增',
        title: '楼号',
        // showChooseMarker: false, //是否显示选点按钮
        showForm: false, //是否显示底部的编辑表单
        markerType: ['楼号', '出入口', '公厕', '其他'],
        // markerTypeIndex: 0,
        remarkTagList: [], //用于显示标记点详情用

        tagDirection: [{
            name: '➡️',
            checked: false
        }, {
            name: '⬇️',
            checked: false
        }, {
            name: '⬅️',
            checked: false
        }, {
            name: '⬆️',
            checked: false
        }, {
            name: '↗️',
            checked: false
        }, {
            name: '↘️',
            checked: false
        }, {
            name: '↙️',
            checked: false
        }, {
            name: '↖️',
            checked: false
        }],
        tagList0: [{ //楼栋标签
            name: '有门禁',
            checked: false
        }, {
            name: '大门常开',
            checked: false
        }, {
            name: '有电梯',
            checked: false
        }, {
            name: '无电梯',
            checked: false
        }],
        tagList1: [{ //出入口标签
            name: '需要登记',
            checked: false
        }, {
            name: '禁止骑行',
            checked: false
        }, {
            name: '可以骑行',
            checked: false
        }, {
            name: '需要刷卡',
            checked: false
        }],
        tagList2: [{ //出入口标签
            name: '比较干净',
            checked: false
        }, {
            name: '有纸巾',
            checked: false
        }, {
            name: '24小时开放',
            checked: false
        }],
        tagList3: [{ //维修店
            name: '服务周到',
            checked: false
        }, {
            name: '价格公道',
            checked: false
        }, {
            name: '高效便捷',
            checked: false
        }],
        tagList4: [{ //换电站
            name: '便捷高效',
            checked: false
        }, {
            name: '安全可靠',
            checked: false
        }, {
            name: '经济实惠',
            checked: false
        }],
        tagList5: [{ //换电站
            name: '便捷高效',
            checked: false
        }, {
            name: '安全存放',
            checked: false
        }],
        tagList6: [{ //生活
            name: '经济实惠',
            checked: false
        }, {
            name: '安全卫生',
            checked: false
        }],
        currentTagList: [], //当前标签，通过markerTypeIndex来取值
        tagNameList: [], //选中的标签
        place: '必填，最多10个字',
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onChooseMarker() {
            let pointsCount = this.data.pointsCount
            pointsCount += 1
            this.setData({
                pointsCount
            })
            this.triggerEvent('onChooseMarker', false)
        },
        onBackChooseMarker() {
            let pointsCount = this.data.pointsCount
            pointsCount -= 1
            this.setData({
                pointsCount
            })
            this.triggerEvent('onBackChooseMarker')
        },
        onFinishChooseMarker() {
            this.triggerEvent('onFinishChooseMarker')
        },
        onCancelChooseMarker() {
            this.triggerEvent('onCancelChooseMarker')
        },
        resetForm() {
            this.selectedMarker = null
            this.resetName()
            this.resetDirection()
            this.resetTagList()
        },
        resetName() {
            this.setData({
                name: ''
            })
        },
        resetDirection() {
            let tagDirection = []
            for (const item of this.data.tagDirection) {
                item.checked = false
                tagDirection.push(item)
            }

            this.setData({
                tagDirection
            })
        },
        resetTagList() {
            let tagList0 = this.data.tagList0.map(item => {
                return {
                    name: item.name,
                    checked: false
                }
            })
            let tagList1 = this.data.tagList1.map(item => {
                return {
                    name: item.name,
                    checked: false
                }
            })
            let tagList2 = this.data.tagList2.map(item => {
                return {
                    name: item.name,
                    checked: false
                }
            })
            this.setData({
                tagList0,
                tagList1,
                tagList2
            })
        },
        onSelectMarkerType(event) {
            const index = event.detail.value
            let place = ''
            switch (index) {
                case 0:
                    place = '必填，最多10个字'
                    break;
                case 1:
                    place = '选填，最多10个字'
                    break;
                case 2:
                    place = '选填，最多10个字'
                    break;
                case 3:
                    place = '必填，最多10个字'
                    break;
                default:
                    place = '必填，最多10个字'
                    break;
            }
            this.data.tagNameList = []

            this.setData({
                name: '',
                markerTypeIndex: index,
                place: place
            });
        },
        //方向标签选择
        onTagDirectionChange(e) {
            let item = e.currentTarget.dataset.item
            let tagDirection = []
            for (const t of this.data.tagDirection) {
                if (t.name === item.name) {
                    t.checked = !item.checked
                } else {
                    t.checked = false
                }
                tagDirection.push(t)
            }

            this.setData({
                tagDirection
            })
        },
        onTagChange(e) {
            let item = e.currentTarget.dataset.item;
            let tagList = this.data[`tagList${this.data.markerTypeIndex}`]
            tagList = tagList.map(t => {
                if (t.name === item.name) {
                    t.checked = !item.checked;
                }
                return t;
            })
            this.setData({
                // [`tagList${this.data.markerTypeIndex}`]: tagList
                currentTagList: tagList
            });

        },
        onSaveMarker() {
            switch (this.data.markerTypeIndex) {
                case 0:
                    if (!this.data.name) {
                        wx.showToast({
                            title: '请输入楼号名称',
                            icon: 'none'
                        })
                        return
                    }
                    wx.setStorage({
                        key: 'name',
                        data: this.data.name.trim()
                    })
                    break;
                case 1:
                    if (!this.data.name) {
                        this.data.name = '出入口'
                    }
                    break;
                case 2:
                    if (!this.data.name) {
                        this.data.name = '公厕'
                    }
                    break;
                case 3:
                    if (!this.data.name) {
                        this.data.name = '维修点'
                    }
                    break;
                case 4:
                    if (!this.data.name) {
                        this.data.name = '换电站'
                    }
                    break;
                case 5:
                    if (!this.data.name) {
                        this.data.name = '外卖柜'
                    }
                    break;
                case 6:
                    if (!this.data.name) {
                        wx.showToast({
                            title: '请输入名称',
                            icon: 'none'
                        })
                        return
                    }
                    break;
                default:
                    break;
            }
            //当前用户marker不为空为更新，否则为新增
            if (!checkWords(this.data.name)) {
                wx.showToast({
                    title: '您输入的内容疑似违规，请重新输入',
                    icon: 'none'
                })
                return
            }
            // if (hasConsecutive4Digits(this.data.name)) {
            //   this.showWarnMessage('您输入的内容疑似密码，请重新输入')
            //   return
            // }
            let userInfo = wx.getStorageSync('userInfo')
            //2024-11-9去掉&& !userInfo.isAdmin
            if (checkChineseNumbers(this.data.name)) {
                wx.showToast({
                    title: '您输入的内容疑似密码，请重新输入',
                    icon: 'none'
                })
                return
            }

            msgSecCheck(this.data.name).then(res => {
                if (res) {
                    wx.showLoading({
                        title: '正在保存',
                        mask: true
                    })
                    const that = this
                    getApp().globalData.mapCtx.getCenterLocation({
                        success: function (res) {
                            const {
                                longitude,
                                latitude
                            } = res
                            if (that.selectedMarker) {
                                that.updateMarker(longitude, latitude)
                            } else {
                                that.addMarker(longitude, latitude)
                            }
                        },
                        fail: function (res) {
                            console.log(res)
                        }
                    })
                }
            })
        },
        //获取方位箭头
        getDirection() {
            let o = this.data.tagDirection.find(item => item.checked)
            return o ? o.name : ''
        },
        //不能输入密码等
        addMarker(longitude, latitude) {
            let uid = generateXId(latitude, longitude)
            //如果为true，则delete = 0 表示直接通过，为-1表示需要审核
            let deleted = checkString(this.data.name) ? 0 : -1
            let direction = this.getDirection()
            this.data.name = this.data.name + direction
            let enableMap = wx.getStorageSync('enableMap')
            let mapType = wx.getStorageSync('mapType')
            let isPersonal = mapType === 2 //1为公共地图，2为个人地图
            let param = {
                xId: uid,
                userId: wx.getStorageSync('userId'),
                type: this.data.markerTypeIndex,
                name: this.data.name,
                remark: this.getRemark(),
                deleted,
                lat: latitude,
                lng: longitude,
                isPersonal
            }
            const that = this
            addMarker(param).then(res => {
                if (res > 0) {
                    wx.showToast({
                        title: '添加成功',
                    })
                    that.triggerEvent('onFormClose')
                    that.triggerEvent('addUserMarkerByUser', {
                        latitude,
                        longitude,
                        uid,
                        name: that.data.name,
                        markerTypeIndex: that.data.markerTypeIndex,
                        deleted
                    })

                    let suggestionsName = that.data.name
                    that.resetForm()
                    // wx.showTabBar()
                    that.setData({
                        action: '新增',
                        showCenterMarker: false,
                        showForm: false,
                        markerTypeIndex: 0,
                        name: '',
                        tagNameList: [],
                        suggestionsName
                    });
                } else if (res === -3) {
                    wx.showToast({
                        title: '移动一下位置再保存',
                        icon: 'none',
                        duration: 3000
                    })
                } else {
                    wx.showToast({
                        title: '添加失败，请稍后重试',
                        icon: 'none'
                    })
                }
            })
        },
        updateMarker(longitude, latitude) {
            //如果为true，则delete = 0 表示直接通过，为-1表示需要审核
            let deleted = checkString(this.data.name) ? 0 : -1
            let direction = this.getDirection()
            this.data.name = this.data.name + direction
            let mapType = wx.getStorageSync('mapType')
            let isPersonal = mapType === 2 //1为公共地图，2为个人地图
            let param = {
                xId: this.selectedMarker.xId,
                userId: this.selectedMarker.userId,
                type: this.data.markerTypeIndex,
                name: this.data.name,
                remark: this.getRemark(),
                deleted,
                lng: longitude,
                lat: latitude,
                updateUserId: wx.getStorageSync('userId'),
                isPersonal
            }
            const that = this
            updateMarker(param).then(res => {
                wx.showToast({
                    title: '修改成功',
                })
                that.triggerEvent('onFormClose')
                that.triggerEvent('updateUserMarkerByUser', {
                    xId: that.selectedMarker.xId,
                    name: that.data.name,
                    longitude,
                    latitude,
                    deleted
                })

                //改变子组件的属性，从而重新生成你想输入的词
                let suggestionsName = that.data.name
                that.resetForm()
                wx.showTabBar()
                that.setData({
                    showCenterMarker: false,
                    showForm: false,
                    xId: 0,
                    showPOI: false,
                    markerTypeIndex: 0,
                    name: '',
                    tagNameList: [],
                    suggestionsName
                });
            })
        },
        onFormClose() {
            this.resetForm()
            // wx.showTabBar()
            this.setData({
                showCenterMarker: false,
                showForm: false
            })
            //编辑的时候，关闭form,需要显示添加和定位按钮
            this.triggerEvent('onFormClose', this.data.action === '编辑')
            // this.triggerEvent('showCenterMarker', false)
        },
        getRemark() {
            let arr = this.data.currentTagList.filter(item => {
                if (item.checked) {
                    return item.name
                }
            })
            return arr.map(item => item.name).join(',')
        },
        //编辑用户标记点
        onUserMarkerEdit(marker) {
            this.selectedMarker = marker
            let has = this.hasDirection(this.selectedMarker.name)
            let name = this.initName(this.selectedMarker.name, has)
            this.initDirection(this.selectedMarker.name, has)

            let currentTagList = this.data[`tagList${this.selectedMarker.type}`]
            for (const item of currentTagList) {
                for (const s of this.selectedMarker.remark.split(',')) {
                    if (item.name === s) {
                        item.checked = true
                    }
                }
            }
            this.setData({
                action: '编辑',
                showCenterMarker: true,
                markerTypeIndex: -1, //和settimout一起生效，不然有bug，标签无法选中
                name: name,
                remark: this.selectedMarker.remark,
                currentTagList: this.data[`tagList${this.selectedMarker.type}`],
            })

            setTimeout(() => {
                this.setData({
                    markerTypeIndex: this.selectedMarker.type
                })
            }, 10);
        },
        //最后一个字符是否以箭头结束
        hasDirection(name) {
            const direction = '➡️⬇️⬅️⬆️↗️↘️↙️↖️'
            if (name.length > 0) {
                let c = name[name.length - 1]
                return direction.includes(c)
            } else {
                return false
            }
        },
        //在编辑marker时调用,分解name
        initName(name, hasDirection) {
            if (hasDirection) {
                return name.substring(0, name.length - 2)
            } else {
                return name
            }
        },
        //在编辑marker时调用,分解name
        initDirection(name, hasDirection) {
            if (hasDirection) {
                let direction = name.slice(name.length - 2) //name.substring(100, 2)
                let tagDirection = []
                console.log('direction', direction, this.data.tagDirection)
                for (const item of this.data.tagDirection) {
                    if (item.name === direction) {
                        item.checked = true
                    }
                    tagDirection.push(item)
                }
                this.setData({
                    tagDirection
                })
            }
        },
        //获取猜你想输入
        getSuggestions(event) {
            let name = event.detail.name
            this.setData({
                name
            })
        },
    }
})