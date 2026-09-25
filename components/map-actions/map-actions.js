Component({
  properties: {
    bottom: {
      type: Number,
      value: 0
    },
    located: {
      type: Boolean,
      value: false
    },
    position: {
      type: String,
      value: 'right'
    },
    showAdd: {
      type: Boolean,
      value: true
    },
    showLocate: {
      type: Boolean,
      value: true
    }
  },

  methods: {
    onAdd() {
      this.triggerEvent('add')
    },
    onLocate() {
      this.triggerEvent('locate')
    }
  }
})
