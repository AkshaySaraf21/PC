/**
 * When a combobox is opened, the typeAhead function is scheduled to execute with a delay.
 * If you open a combobox inside a grid editor and quickly switch to another row, the previous will be destroyed, leaving
 * the typeAhead task still running. This produces an error, since the typeAhead function will run on a
 * destroy combo.
 *
 * To fix this, let's make sure the task is canceled when we destroy the grid.
 *
 * Sencha 06/21/13
 * Submitted to the framework EXTJSIV-10337
 *
 * The above problem is fixed in Ext 4.2.2. There now is a onDestroy method in the Sencha implementation that does what was done here
 * in the onDestroy method. I am not sure if the initComponent method is needed for that problem. This files also seems
 * to contain a fix to another Ext bug (see the onKeyUp method).
 *
 * Moved some of the overrides to AutoComplete widget.
 *
 * mstein 4/14/2014
 *
 */
Ext.define('Gw.override.form.field.ComboBox', {
  override: 'Ext.form.field.ComboBox',

  initComponent: function () {
    var me = this;
    me.on("specialkey", me.handleSpecialKey, me);
    me.on("select", me.handleSelect, me);

    me.on("focus", function() {
      me.flush = true;
    });

    me.callParent(arguments);
  },

  // Force change handler on select:
  handleSelect: function (comp) {
    var me = this;
    if (me.flush) {
      comp.flushChange();
    }
  },

  /**
   * Work around ext bug where combo may be expanded when nothing is typed in (when alt or ctrl key is on).
   */
  onKeyUp: function (e) {
    if (e.ctrlKey || e.altKey) {
      Ext.form.ComboBox.superclass.onKeyUp.call(this, e)
      return false; // do not invoke combo function
    }
    this.callOverridden(arguments)
  },

  handleSpecialKey: function(field, e){
    var me = this;

    // Only cares about handling tab key
    if (e.getKey() !== e.TAB) {
      return;
    }

    if (gw.app.isLoadMaskVisible()) {
      e.stopEvent();
      return false;
    }
    me.flush = false;
  }

});

