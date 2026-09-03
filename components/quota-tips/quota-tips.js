const COLLAPSE_DELAY_MS = 20000
const COLLAPSE_ANIM_MS = 450

Component({
  properties: {
    visible: {
      type: Boolean,
      value: false
    },
    deadlineText: {
      type: String,
      value: ''
    },
    expanded: {
      type: Boolean,
      value: false
    },
    locked: {
      type: Boolean,
      value: false
    },
    unlocked: {
      type: Boolean,
      value: false
    }
  },

  data: {
    phase: 'collapsed',
    countdown: 0
  },

  observers: {
    'visible, expanded, locked, unlocked': function (visible, expanded, locked, unlocked) {
      this.syncPhase(visible, expanded, locked, unlocked)
    }
  },

  lifetimes: {
    ready() {
      this.syncPhase(this.properties.visible, this.properties.expanded, this.properties.locked, this.properties.unlocked)
    },
    detached() {
      this.clearTimers()
    }
  },

  methods: {
    syncPhase(visible, expanded, locked, unlocked) {
      if (!visible) {
        this.clearTimers()
        this._didAutoExpand = false
        this._collapsing = false
        if (this.data.phase !== 'collapsed' || this.data.countdown !== 0) {
          this.setData({ phase: 'collapsed', countdown: 0 })
        }
        return
      }
      if (unlocked) {
        this.clearTimers()
        this._collapsing = false
        if (this._wasLocked) {
          this._wasLocked = false
          if (this.data.phase !== 'collapsed' || this.data.countdown !== 0) {
            this.setData({ phase: 'collapsed', countdown: 0 })
          }
        }
        return
      }
      if (locked) {
        this._wasLocked = true
        this.clearTimers()
        this._collapsing = false
        if (this.data.phase !== 'expanded' || this.data.countdown !== 0) {
          this.setData({ phase: 'expanded', countdown: 0 })
        }
        return
      }
      if (expanded && !this._didAutoExpand && this.data.phase === 'collapsed' && !this._collapsing) {
        this._didAutoExpand = true
        this.setData({ phase: 'expanded' })
        this.startCountdown()
      }
    },

    startCountdown() {
      this.clearTimers()
      const totalSec = Math.ceil(COLLAPSE_DELAY_MS / 1000)
      this.setData({ countdown: totalSec })
      this._countdownTimer = setInterval(() => {
        const next = this.data.countdown - 1
        if (next <= 0) {
          this.clearCountdownTimer()
          this.setData({ countdown: 0 })
          this.startCollapse()
          return
        }
        this.setData({ countdown: next })
      }, 1000)
      this._expandTimer = setTimeout(() => {
        this._expandTimer = null
        this.startCollapse()
      }, COLLAPSE_DELAY_MS)
    },

    expandManual() {
      if (this.data.phase !== 'collapsed' || this._collapsing) {
        return
      }
      this.clearTimers()
      this.setData({
        phase: 'expanded',
        countdown: 0
      })
    },

    startCollapse() {
      if (!this.properties.visible || this.properties.locked || this._collapsing || this.data.phase === 'collapsed') {
        return
      }
      this._collapsing = true
      this.clearTimers()
      this.setData({
        phase: 'collapsing',
        countdown: 0
      })
      this._collapseAnimTimer = setTimeout(() => {
        this._collapseAnimTimer = null
        this._collapsing = false
        this.setData({ phase: 'collapsed' })
        this.triggerEvent('collapse')
      }, COLLAPSE_ANIM_MS)
    },

    onToggle() {
      if (this.properties.locked) {
        return
      }
      if (this.data.phase === 'expanded') {
        this.startCollapse()
        return
      }
      this.expandManual()
    },

    clearCountdownTimer() {
      if (this._countdownTimer) {
        clearInterval(this._countdownTimer)
        this._countdownTimer = null
      }
    },

    clearTimers() {
      this.clearCountdownTimer()
      if (this._expandTimer) {
        clearTimeout(this._expandTimer)
        this._expandTimer = null
      }
      if (this._collapseAnimTimer) {
        clearTimeout(this._collapseAnimTimer)
        this._collapseAnimTimer = null
      }
    },

    onPlay() {
      this.triggerEvent('play')
    },

    onOpenVip() {
      if (!this.properties.locked) {
        this.startCollapse()
      }
      this.triggerEvent('openvip')
    }
  }
})
