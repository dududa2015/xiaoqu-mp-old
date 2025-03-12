import {
    addPersonalMap,
    updatePersonalMap,
    deletePersonalMap,
    getPersonalMapList
} from '../../apis/personal-map-apis'
Component({
    options: {
        // styleIsolation: "apply-shared"
    },
    /**
     * 组件的属性列表
     */
    properties: {
        showPersonalMap: {
            type: Boolean,
            value: false,
            observer(newVal, oldVal) {
                if (newVal) {
                    this.init()
                }
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        // opened: false,
        name: '',
        mapList: [],
    },

    /**
     * 组件的方法列表
     */
    methods: {
        init() {
            // //下面这行，主要是为了opened能打开右边菜单
            // this.setData({
            //     mapList: []
            // })
            this.getPersonalMapList()
            // this.openedChange()
        },
        onMapChoose(e){
            //当前选中的地图pId
            let currentPId = e.currentTarget.dataset.pid
            wx.setStorageSync('currentPId', currentPId)
            this.setData({
                currentPId
            })
            //TODO: 还未处理
            this.triggerEvent('onPersonalMapChange')
        },
        onClose() {
            this.triggerEvent('onPersonalMapClose')
        },
        onFormClose() {
            this.setData({
                showForm: false
            })
        },
        handleInput() {
            this.setData({
                inputValue: e.detail.value
            });
        },
        //添加个人地图
        onSave() {
            let name = this.data.name.replace(/ |　/g, '');
            if (name === '') {
                wx.showToast({
                    title: '名称不能为空',
                    icon: 'none'
                })
                return
            }
            const param = {
                userId: wx.getStorageSync('userId'),
                name: name
            }
            let method = null
            if (this.currentEditMap) {
                param.pId = this.currentEditMap.pId
                method = updatePersonalMap
            } else {
                method = addPersonalMap
            }
            method(param).then(res => {
                if (res) {
                    wx.showToast({
                        title: '保存成功',
                    })
                    this.setData({
                        showForm: false,
                        name: false
                    })
                    setTimeout(() => {
                        if (this.currentEditMap) {
                            this.getPersonalMapList()
                        } else {
                            this.init()
                        }
                    }, 1000);

                } else {
                    wx.showToast({
                        title: '保存失败，稍后重试',
                        icon: 'none'
                    })
                }
            })
        },
        onEdit(e) {
            //不为null，表示是修改
            this.currentEditMap = e.currentTarget.dataset.item
            this.setData({
                showForm: true,
                name: this.currentEditMap.name
            })
        },
        onDelete(e) {
            let pId = e.currentTarget.dataset.item.pId
            deletePersonalMap({
                pId,
                userId: wx.getStorageSync('userId'),
            }).then(res => {
                if (res) {
                    wx.showToast({
                        title: '删除成功',
                    })
                    this.getPersonalMapList()
                }
            })
        },
        getPersonalMapList() {
            let userId = wx.getStorageSync('userId')
            const that = this
            getPersonalMapList({
                userId
            }).then(res => {
                console.log(res)
                that.setData({
                    mapList: res
                })
            })
        },
        onNameChange(e) {
            this.setData({
                name: e.detail.value
            })
        },
        onAdd() {
            //设置为null，表示是新增
            this.currentEditMap = null
            // this.openedChange()
            if (this.data.mapList.length >= 5) {
                wx.showToast({
                    title: '个人地图数量不能超过5个',
                    icon: 'none'
                })
                return
            }
            this.setData({
                showForm: true
            })
        },
        openedChange() {
            this.setData({
                opened: true
            })
            const that = this
            setTimeout(() => {
                this.setData({
                    opened: false
                })
            }, 1000);
        }
    }
})