Ext.define('Ext.ux.form.field.MenuText', {
  extend: 'Ext.form.field.Trigger',

  xtype: 'menutextfield',

  requires: [
    'Ext.menu.Menu',
    'Ext.util.KeyNav'
  ],

  triggerCls: Ext.baseCSSPrefix + 'form-combo-trigger',

  hideTrigger: true,

  menu: [],

  menuWidth: 80,

  menuPolicy: 'blur', // [blur | change]

  enableKeyEvents: true,

  menuALign: 'tr-br',

  initComponent: function () {
    var me = this;
    me.callParent();

    if (me.menuPolicy === 'change') {
      me.on('change', function (field, newValue) {
        // hide / change menu based on input (show only if there is something typed)
        me.setHideTrigger(!newValue);
      });
    } else {
      me.on('blur', function (field, newValue) {
        me.setHideTrigger(true);
      });

      me.on('focus', function (field, newValue) {
        me.setHideTrigger(false);
      });
    }

    me.addEvents(
        /**
         * @event menuclick
         * Fires when this menu is clicked
         * @param {Ext.menu.Menu} menu The menu which has been clicked
         * @param {Ext.Component} item The menu item that was clicked. `undefined` if not applicable.
         * @param {Ext.EventObject} e The underlying {@link Ext.EventObject}.
         */
        'menuclick'
    );

    // create menu
    me.menuCmp = Ext.create('Ext.menu.Menu', {
      width: me.menuWidth,
      plain: true,
      items: me.menu,
      listeners: {
        //relay clcik event
        click: function (menu, item, e, eOpts) {
          me.fireEvent('menuclick', menu, item, e, eOpts);
        },
        //fix focus
        hide: function () {
          me.focus();
        }
      }
    });
  },

  initEvents: function () {
    var me = this;
    me.callParent();

    // handle keyboard
    me.keyNav = new Ext.util.KeyNav(me.inputEl, {
      down: function () {
        me.setHideTrigger(false);
        me.onTriggerClick();
      }
    });
  },

  onTriggerClick: function () {
    // show menu aligned to trigger
    var me = this;
    me.onFocus({});
    me.menuCmp.showBy(me, me.menuALign);
  },

  onDestroy: function () {
    this.menuCmp.destroy();
    this.callParent();
  }

});
