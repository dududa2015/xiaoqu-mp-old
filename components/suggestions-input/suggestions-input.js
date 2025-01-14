// components/suggestions-input/suggestions-input.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        markerTypeIndex: {
            type: Number,
            value: -1,
            observer: function (newVal, oldVal) {
                if (newVal === 0) {
                    let name = wx.getStorageSync('name')
                    this.buildSuggestions(name)
                }
                if (newVal === 3) {
                    let tagSuggestions = []
                    tagSuggestions.push({
                        name: '维修点',
                        checked: false
                    })
                    tagSuggestions.push({
                        name: '换电站',
                        checked: false
                    })
                    tagSuggestions.push({
                        name: '外卖柜',
                        checked: false
                    })
                    this.setData({
                        tagSuggestions
                    })
                }
            }
        },
        suggestionsName: {
            type: String,
            value: '',
            observer: function (newVal, oldVal) {
                // 属性变化时执行的逻辑，可以触发事件  
                this.buildSuggestions(newVal)
            }
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        tagSuggestions: [], //猜你想输入列表

    },
    lifetimes: {
        created() {
            // console.log('组件被创建');

        },
        attached() {
            // console.log('组件被附加');
        },
        ready() {
            // console.log('组件准备完成');

        },
        moved() {
            // console.log('组件被移动');
        },
        detached() {
            // console.log('组件被移除');
        }
    },
    /**
     * 组件的方法列表
     */
    methods: {
        //输入建议
        onTagSuggestionChange(e) {
            let item = e.currentTarget.dataset.item
            console.log(item)
            let tagSuggestions = []
            for (const t of this.data.tagSuggestions) {
                if (t.name === item.name) {
                    t.checked = !item.checked
                } else {
                    t.checked = false
                }
                tagSuggestions.push(t)
            }
            console.log(JSON.stringify(tagSuggestions))
            let name = ''
            if (!item.checked) {
                name = item.name
            }
            console.log(name)
            this.triggerEvent('getSuggestions', { name });
            this.setData({
                tagSuggestions
            })
            //如果楼号，则继续提示
            if (this.data.markerTypeIndex === 0) {
                setTimeout(() => {
                    this.buildSuggestions(name)
                }, 200);
            }

        },
        buildSuggestions(name) {
            if (name.length > 0) {
                let o = this.extractChineseAndNumber(name)
                if (!o) {
                    this.setData({
                        tagSuggestions: []
                    })
                    return
                }
                let prev = ''
                let next = ''
                if (o.number.includes('-')) {
                    let arr = o.number.split('-')
                    prev = arr[0] + '-' + (arr[1].length > 0 ? parseInt(arr[1]) - 1 : 1)
                    next = arr[0] + '-' + (arr[1].length > 0 ? parseInt(arr[1]) + 1 : 2)
                } else {
                    prev = parseInt(o.number) - 1
                    next = parseInt(o.number) + 1
                }
                let tagSuggestions = []
                tagSuggestions.push({
                    name: o.chinese1 + prev + o.chinese2,
                    checked: false
                })
                tagSuggestions.push({
                    name: o.chinese1 + next + o.chinese2,
                    checked: false
                })
                console.log('tagSuggestions', tagSuggestions)
                this.setData({
                    tagSuggestions
                })
            } else {
                this.setData({
                    tagSuggestions: []
                })
            }
        },
        extractChineseAndNumber(input) {
            // 正则表达式匹配中文和数字（包括中间可能有'-'的数字）  
            const regex = /([^\x00-\x7F]*)([\d-]+)([^\x00-\x7F]*)/;

            const match = input.match(regex);

            if (match) {
                const chinesePart1 = match[1]; // 第一个中文部分（可能为空）  
                const numberPart = match[2];    // 数字部分（可能包含'-'）  
                const chinesePart2 = match[3]; // 第二个中文部分（可能为空）  

                return {
                    chinese1: chinesePart1,
                    number: numberPart,
                    chinese2: chinesePart2
                };
            } else {
                // 如果没有匹配，返回null  
                return null;
            }
        },
    }
})