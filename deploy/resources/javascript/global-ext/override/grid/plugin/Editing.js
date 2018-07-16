Ext.define('Overrides.grid.plugin.Editing', {
  override: 'Ext.grid.plugin.Editing',

  /**
   * This override adds proper keyboard support if using checkbox or radio selection models
   * Enter key will trigger start edit on current row or first row if nothing is selected
   *
   * @Sencha
   * @param e
   */
  onEnterKey: function (e) {
    var me = this,
        grid = me.grid,
        selModel = grid.getSelectionModel(),
        record,
        col = grid.initialConfig.columns,
        a = 0,
        aLen = col.length,
        pos,
        chk = selModel.injectCheckbox,
        columnHeader;

    // Calculate editing start position from SelectionModel if there is a selection
    // Note that the condition below tests the result of an assignment to the "pos" variable.
    if (selModel.getCurrentPosition && (pos = selModel.getCurrentPosition())) {
      record = pos.record;
      columnHeader = pos.columnHeader;
    }
    // RowSelectionModel
    else {
      record = selModel.getLastSelected();
      columnHeader = grid.getColumnManager().getHeaderAtIndex(0);
    }

    // @Sencha fix start editing if checkbox model used
    // handle checboxmodel and radiomodel (for latter uncomment changes below)
    // by default it's commented out because radio model is custom one and might not present in source code.(yes, we can add more checks if it exists...)
    if (selModel instanceof Ext.selection.CheckboxModel) {
      // find first editable cell position
      for (; a < aLen; a++) {
        if (col[a].editor) {
          columnHeader = chk === 0 ? a + 1 : (chk === a ? a + 1 : a);
          break;
        }
      }
      // find focused record
      record = grid.getSelectionModel().getLastFocused();
      me.startEdit(record, columnHeader);
    } else if (record && columnHeader) { // If there was a selection to provide a starting context..
      me.startEdit(record, columnHeader);
    }
  }

});
