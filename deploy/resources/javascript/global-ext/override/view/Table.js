Ext.define('Gw.override.view.Table', {
  override: 'Ext.view.Table',

  /**
   * @SenchaUpgrade, Part of fix for PL-30772
   *
   * We are overriding the row template to do the following:
   * - Set the tabindex of the first row of the grid to be 0 otherwise -1.  This allows
   *   us to tab into the table
   * - Sets up an explicit onfocus handler to the gw.app.onGridRowFocus() passing the given row
   *   object & index, since nothing else in the ExtJs framework seem to be able to trap the incoming
   *   focus event on the <tr> element that happens because of the tabindex="0"
   */
  rowTpl: [
    '{%',
    'var dataRowCls = values.recordIndex === -1 ? "" : " ' + Ext.baseCSSPrefix + 'grid-data-row";',
    'var rowTabIndex = values.rowIndex === 0 ? "0" : "-1";',
    'var onFocusHandler = " onfocus=\'gw.app.onGridRowFocus(this, " + values.rowIndex + ");\'";',
    '%}',
    '<tr {[values.rowId ? ("id=\\"" + values.rowId + "\\"") : ""]} ',
    'data-boundView="{view.id}" ',
    'data-recordId="{record.internalId}" ',
    'data-recordIndex="{recordIndex}" ',
    'class="{[values.itemClasses.join(" ")]} {[values.rowClasses.join(" ")]}{[dataRowCls]}" ',
    '{rowAttr:attributes} tabIndex="{[rowTabIndex]}" {ariaRowAttr} {[onFocusHandler]}>',
    '<tpl for="columns">' +
        '{%',
    'parent.view.renderCell(values, parent.record, parent.recordIndex, parent.rowIndex, xindex - 1, out, parent)',
    '%}',
    '</tpl>',
    '</tr>',
    {
      priority: 0
    }
  ],

  initComponent: function() {
    var me = this;
    me.callParent(arguments);
    // In the case of nested iterators, when the outer table is given the focus after an event (like, say, when a menu
    // is dismissed), the row for the cell it tries to focus onto is a wrapper row.  So we listen for the cellfocus
    // event and adjust the focus down to the actual grid-row
    me.on('cellfocus', me.adjustFocusRowIfFocusIsOnRowWrapper, me);
  },

  /**
   * @SenchaUpgrade Override this method to use 'data-recordId' in favor of 'data-recordIndex', to work around a bug:
   *    When a Grid panel has row grouping enabled, editing the group-by field will cause a record to move to a different
   *    group, during the process the "data-recordIndex" may be temporarily out of sync from the store, and cause
   *    stack overflow (PL-26354)
   */
  getRecord: function (node) {
    var me = this,
        recordId,
        recordIndex;

    // If store.destroyStore has been called before some delayed event fires on a node, we must ignore the event.
    if (me.store.isDestroyed) {
      return;
    }

    node = me.getNode(node);
    if (node) {
      recordId = node.getAttribute('data-recordId');
      if (recordId) {
        var record = me.dataSource.data.get(recordId);
        if (record) {
          return record;
        }
      }

      // If we're grouping, the indexes may be off
      // because of collapsed groups, so just grab it by id
      if (!me.hasActiveGrouping()) {
        recordIndex = node.getAttribute('data-recordIndex');
        if (recordIndex) {
          recordIndex = parseInt(recordIndex, 10);
          if (recordIndex > -1) {
            // The index is the index in the original Store, not in a GroupStore
            // The Grouping Feature increments the index to skip over unrendered records in collapsed groups
            return me.store.data.getAt(recordIndex);
          }
        }
      }
      return me.store.getByInternalId(recordId);
    }
  },

  //@SenchaUpgrade: Set the target scroll element as the center panel instead of the table. Otherwise, IE will snap back to scrollLeft = 0.
  //Do not call row focus if selModel is in cell selection model
  //IE Workaround for: PL-31038 and PL-30595
  doFocus: function(rowDom) {
    var me = this,
        saveScroll = Ext.isIE,
        targetElement = Ext.get('centerPanel') || me.el,
        scrollLeft;

    if (saveScroll) {
      scrollLeft = targetElement.getScrollLeft();
      me.ignoreScroll = true;
    }

    var activeElement = Ext.Element.getActiveElement();
    var rowElement = Ext.get(rowDom);
    var alreadyFocused = activeElement && (activeElement.getAttribute('data-recordid') === rowElement.getAttribute('data-recordid'));
    //If not IE or if IE isn't already focused on the row. Focus should be minimized on IE when scrollLeft !== 0, otherwise there will be flickering
    //from the saveScroll
    if (!saveScroll || !alreadyFocused){
      (me.focusEl = rowElement).focus();
    }

    if (saveScroll) {
      targetElement.setScrollLeft(scrollLeft);
      me.ignoreScroll = false;
    }
  },

  /*
   * @SenchaUpgrade workaround cell scrolling bug by calling the native scrollIntoView() instead. Sencha scrollIntoView will compare right coordinate against
   * the container width. The container width for the table is always larger than the right width, making scrolling permanently broken.
   * Workaround for PL-30772
   */
  scrollCellIntoView: function(cell) {
    // Allow cell context object to be passed.
    // TODO: change to .isCellContext check when implement cell context class
    if (cell.row != null && cell.column != null) {
      cell = this.getCellByPosition(cell);
    }
    if (cell) {
      //Fix scrolling corner cases, scroll twice with the parent element and the centerPanel
      //please fix me when changing the centerPanel id
      var centerPanelElement = Ext.get('centerPanel');

      Ext.fly(cell).scrollIntoView(centerPanelElement, true);
      Ext.fly(cell).scrollIntoView(this.el, true);
    }
  },

  /**
   * @SenchaUpgrade Workaround cell tabbing bug: PL-31051.
   * Multiple blue focuses on the next column when typekey column values are changed. It happens when a column to the left of TypeKey is invisible.
   * Sencha provided workaround: EXTJS-11653
   */
  renderCell: function(column, record, recordIndex, rowIndex, columnIndex, out) {
    var me = this,
      selModel = me.selModel,
      cellValues = me.cellValues,
      classes = cellValues.classes,
      fieldValue = record.data[column.dataIndex],
      cellTpl = me.cellTpl,
      fullIndex, value, clsInsertPoint;

    cellValues.record = record;
    cellValues.column = column;
    cellValues.recordIndex = recordIndex;
    cellValues.rowIndex = rowIndex;
    cellValues.columnIndex = columnIndex;
    cellValues.cellIndex = columnIndex;
    cellValues.align = column.align;
    cellValues.tdCls = column.tdCls;
    cellValues.innerCls = column.innerCls;
    cellValues.style = cellValues.tdAttr = "";
    cellValues.unselectableAttr = me.enableTextSelection ? '' : 'unselectable="on"';

    if (column.renderer && column.renderer.call) {
      fullIndex = me.ownerCt.columnManager.getHeaderIndex(column);
      value = column.renderer.call(column.usingDefaultRenderer ? column : column.scope || me.ownerCt, fieldValue, cellValues, record, recordIndex, fullIndex, me.dataSource, me);
      if (cellValues.css) {
        // This warning attribute is used by the compat layer
        // TODO: remove when compat layer becomes deprecated
        record.cssWarning = true;
        cellValues.tdCls += ' ' + cellValues.css;
        delete cellValues.css;
      }
    } else {
      value = fieldValue;
    }
    cellValues.value = (value == null || value === '') ? '&#160;' : value;

    // Calculate classes to add to cell
    classes[1] = column.getCellId();

    // On IE8, array[len] = 'foo' is twice as fast as array.push('foo')
    // So keep an insertion point and use assignment to help IE!
    clsInsertPoint = 2;

    if (column.tdCls) {
      classes[clsInsertPoint++] = column.tdCls;
    }
    if (me.markDirty && record.isModified(column.dataIndex)) {
      classes[clsInsertPoint++] = me.dirtyCls;
    }
    if (column.isFirstVisible) {
      classes[clsInsertPoint++] = me.firstCls;
    }
    if (column.isLastVisible) {
      classes[clsInsertPoint++] = me.lastCls;
    }
    if (!me.enableTextSelection) {
      classes[clsInsertPoint++] = me.unselectableCls;
    }
    if (cellValues.tdCls) {
      classes[clsInsertPoint++] = cellValues.tdCls;
    }

    /**
     * Checks to see if the is technically selected. The data record IDs do not match after a POC
     * @param view
     * @param row
     * @param column
     * @param scope
     * @returns {boolean}
     * @private
     */
    function _isCellSelected(view, row, column){
      var me = view.selModel,
          testPos,
          closeEnough = false,
          pos = me.getCurrentPosition();

      if (pos && pos.view === view) {
        testPos = new Ext.grid.CellContext(view).setPosition({
          row: row,
          column: column
        });

        if (testPos.record && pos.record){
          // see if the record is close enough to the target record
          // this is to handle POC issues where various generated IDs are different
          closeEnough = (testPos.record === pos.record) ||
              ((typeof(testPos.record.data[':offset']) !== 'undefined')
                  && (typeof(pos.record.data[':offset']) !== 'undefined')
                  && (testPos.record.data[':offset'] === pos.record.data[':offset']));
        }


        //close enough, testPos.record ~== pos.record
        return closeEnough && (testPos.columnHeader === pos.columnHeader);
      }

    }


    if (selModel && selModel.isCellModel && _isCellSelected(me, recordIndex, column)) {
      classes[clsInsertPoint++] = (me.selectedCellCls);
      //actually select the position PL-31380 after a POC
      if (me.selModel.getCurrentPosition().record !== record){
        me.selModel.setCurrentPosition({row: recordIndex, column: columnIndex, columnHeader: column, record: record});
      }
    }

    // Chop back array to only what we've set
    classes.length = clsInsertPoint;
    cellValues.tdCls = classes.join(' ');
    cellTpl.applyOut(cellValues, out);

    // Dereference objects since cellValues is a persistent var in the XTemplate's scope chain
    cellValues.column = null;
  },
  /**
   * Adjusts the focus to an inner row if the current focus is on a wrapper row
   * @param record
   * @param cell
   * @param position
   * @SenchaUpgrade - depending on x-grid-wrap-row class for this behavior to work
   */
  adjustFocusRowIfFocusIsOnRowWrapper: function(record, cell, position) {
    var me = this;
    if (position && position.view) {
      var focusRow = position.view.getFocusEl();
      if (focusRow && focusRow.hasCls('x-grid-wrap-row')) {
        // If the focus element of the view is a wrapper row, then we want to refocus the view onto the real row.
        // We do this using the variant of getNode() that finds the appropriate sub-row for the current
        // position so that the focus is set to the inner row when dealing with nested row iterators
        me.doFocus(me.getNode(position.row, true));
      }
    }
  }

});
