/**
 * @Sencha
 *
 * Custom model for row selection via radio button. Allows only one row to be selected
 *
 */
Ext.define('Ext.ux.selection.RadioModel', {
  alias: 'selection.radiomodel',

  alternateClassName: 'Ux.selection.RadioModel',

  extend: 'Ext.selection.RowModel',

  mode: 'SINGLE',

  /**
   * @cfg {Number/String} [injectRadio=0]
   * The index at which to insert the checkbox column.
   * Supported values are a numeric index, and the strings 'first' and 'last'.
   */
  injectRadio: 0,

  /**
   * @cfg {Boolean} checkOnly
   * True if rows can only be selected by clicking on the checkbox column.
   */
  checkOnly: true,

  /**
   * @cfg {String} [checkSelector="x-grid-row-checker-radio"]
   * The selector for determining whether the checkbox element is clicked. This may be changed to
   * allow for a wider area to be clicked, for example, the whole cell for the selector.
   */
  checkSelector: '.' + Ext.baseCSSPrefix + 'grid-row-checker-radio',

  headerWidth: 24,

  // private
  checkerOnCls: Ext.baseCSSPrefix + 'grid-hd-checker-on',

  beforeViewRender: function (view) {
    var me = this,
        owner;

    me.callParent(arguments);

    // if we have a locked header, only hook up to the first
    if (!me.hasLockedHeader() || view.headerCt.lockedCt) {
      me.addCheckbox(view, true);
      owner = view.ownerCt;
      // Listen to the outermost reconfigure event
      if (view.headerCt.lockedCt) {
        owner = owner.ownerCt;
      }
      me.mon(owner, 'reconfigure', me.onReconfigure, me);
    }
  },

  bindComponent: function (view) {
    var me = this;
    me.sortable = false;
    me.callParent(arguments);
  },

  hasLockedHeader: function () {
    var views = this.views,
        vLen = views.length,
        v;

    for (v = 0; v < vLen; v++) {
      if (views[v].headerCt.lockedCt) {
        return true;
      }
    }
    return false;
  },

  /**
   * Add the header checkbox to the header row
   * @private
   * @param {Boolean} initial True if we're binding for the first time.
   */
  addCheckbox: function (view, initial) {
    var me = this,
        checkbox = me.injectRadio,
        headerCt = view.headerCt;

    // Preserve behaviour of false, but not clear why that would ever be done.
    if (checkbox !== false) {
      if (checkbox == 'first') {
        checkbox = 0;
      } else if (checkbox == 'last') {
        checkbox = headerCt.getColumnCount();
      }
      Ext.suspendLayouts();
      headerCt.add(checkbox, me.getHeaderConfig());
      Ext.resumeLayouts();
    }

    if (initial !== true) {
      view.refresh();
    }
  },

  /**
   * Handles the grid's reconfigure event.  Adds the checkbox header if the columns have been reconfigured.
   * @private
   * @param {Ext.panel.Table} grid
   * @param {Ext.data.Store} store
   * @param {Object[]} columns
   */
  onReconfigure: function (grid, store, columns) {
    if (columns) {
      this.addCheckbox(this.views[0]);
    }
  },

  /**
   * Toggle the ui header between checked and unchecked state.
   * @param {Boolean} isChecked
   * @private
   */
  toggleUiHeader: function (isChecked) {
    var view = this.views[0],
        headerCt = view.headerCt,
        checkHd = headerCt.child('gridcolumn[isCheckerHd]'),
        cls = this.checkerOnCls;

    if (checkHd) {
      if (isChecked) {
        checkHd.addCls(cls);
      } else {
        checkHd.removeCls(cls);
      }
    }
  },

  /**
   * Retrieve a configuration to be used in a HeaderContainer.
   * This should be used when injectRadio is set to false.
   */
  getHeaderConfig: function () {
    var me = this;

    return {
      isCheckerHd: false,
      text: '&#160;',
      clickTargetName: 'el',
      width: me.headerWidth,
      sortable: false,
      draggable: false,
      resizable: false,
      hideable: false,
      menuDisabled: true,
      dataIndex: '',
      cls: '',
      //editor:'textfield'
      renderer: Ext.Function.bind(me.renderer, me),
      editRenderer: me.editRenderer || me.renderEmpty,
      locked: me.hasLockedHeader()
    };
  },

  renderEmpty: function () {
    return '&#160;';
  },

  /**
   * Generates the HTML to be rendered in the injected checkbox column for each row.
   * Creates the standard checkbox markup by default; can be overridden to provide custom rendering.
   * See {@link Ext.grid.column.Column#renderer} for description of allowed parameters.
   */
  renderer: function (value, metaData, record, rowIndex, colIndex, store, view) {
    var baseCSSPrefix = Ext.baseCSSPrefix;
    metaData.tdCls = baseCSSPrefix + 'grid-cell-special ' + baseCSSPrefix + 'grid-cell-row-checker-radio';
    return '<div class="' + baseCSSPrefix + 'grid-row-checker-radio" role="presentation">&#160;</div>';
  },

  processSelection: function (view, record, item, index, e) {
    var me = this,
        checker = e.getTarget(me.checkSelector);

    // checkOnly set, but we didn't click on a checker.
    if (me.checkOnly && !checker) {
      return;
    }

    me.selectWithEvent(record, e);
  }

});
