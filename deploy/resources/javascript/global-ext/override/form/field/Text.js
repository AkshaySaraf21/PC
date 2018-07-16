Ext.define('Gw.override.form.field.Text', {
  override: 'Ext.form.field.Text',

  enableKeyEvents: true,

  shrinkWrap: 1, // adjust for width only

  getFieldStyle: function () {
    return (this.suffix || this.prefix ? '' : 'width:100%;') + (Ext.isObject(this.fieldStyle) ? Ext.DomHelper.generateStyles(this.fieldStyle) : this.fieldStyle || '');
  },

  initComponent: function () {
    var me = this;
    if (me.regex && Ext.isString(me.regex)) {
      me.regex = eval(me.regex);
    }
    if (me.gNumCols) {   // The size of the text field in characters
      me.inputWidth = me.gNumCols * 8;   // Convert to number of pixels
    }

    me.callParent(arguments);
  },

  listeners: {
    // PL-30055 In slow connections, stop typing while AJAX call is active
    // Load Mask should does NOT prevent typing (confirmed by Sencha support)
    // We let the tab key through since we want to let user tab to next field before POC
    'keydown': function(field, e) {
      if (gw.app.isLoadMaskVisible() && e.getKey() !== Ext.EventObject.TAB) {
        e.stopEvent();
      }
    },

    'focus': function(field, e) {
      if (gw.app.isLoadMaskVisible()) {
        if (field.keyNav) {
          field.keyNav.disable();
        }
      } else if (field.keyNav && field.keyNav.disabled) {
        field.keyNav.enable();
      }
    }

  },

  hasAltValue: function () {
    return this.altVal !== undefined ? true : false;
  },

  setAltValue: function (text, value) {
    var me = this;
    if (me.hasAltValue()) {
      me.altVal = text;
      var altValEl = me.el.down('.g-form-altVal');
      altValEl.update(text);
      altValEl.dom.setAttribute('value', value);
    }
  }
});
