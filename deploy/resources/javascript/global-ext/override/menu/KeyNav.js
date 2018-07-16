Ext.define('Gw.override.menu.KeyNav', {
  override: 'Ext.menu.KeyNav',

  //modify escape key listener, so it will fire event
  escape: function (e) {
    Ext.menu.Manager.hideAll();
    this.menu.fireEvent('escape', this);
  }

});
