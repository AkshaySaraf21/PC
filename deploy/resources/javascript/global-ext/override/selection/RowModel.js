/**
 * Allows tabbing out from a grid panel.
 */
Ext.define('Gw.override.selection.RowModel', {
  override: 'Ext.selection.RowModel',
  onEditorTab: function(ep, e) {
    var me = this,
      view = ep.context.view,
      record = ep.getActiveRecord(),
      header = ep.getActiveColumn(),
      position = view.getPosition(record, header),
      direction = e.shiftKey ? 'left' : 'right',
      lastPos;

    // We want to continue looping while:
    // 1) We have a valid position
    // 2) There is no editor at that position
    // 3) There is an editor, but editing has been cancelled (veto event)

    do {
      lastPos = position;
      position  = view.walkCells(position, direction, e, me.preventWrap);
      if (lastPos && lastPos.isEqual(position)) {
        // If we end up with the same result twice, it means that we weren't able to progress
        // via walkCells, for example if the remaining records are non-record rows, so gracefully
        // fall out here.
        return;
      }
    } while (position && (!position.columnHeader.getEditor(record) || !ep.startEditByPosition(position)));

    /// Override
    // details:
    // http://stackoverflow.com/questions/10179047/extjs-4-excel-style-keyboard-navigation-in-an-editable-grid
    // http://jsfiddle.net/mohammad_erdin/sDFfY/
    // don't stuck in the last/first cell -> complete editing.
    if (!position) {
      ep.completeEdit();
    }
  },

  /**
   * This override adds fix. If the grid is configured with cell editing plugin, it will select the row once you start editing
   * Must be used in conjunction with  preventSelection:true in cell editing plugin
   *
   * @Sencha Ticket : EXTJS-14092
   * @param position
   */
  selectByPosition: function (position) {
    var context = new Ext.grid.CellContext(this.view),
        plugin = this.view.editingPlugin;

    context.setPosition(position.row, position.column);
    if (!plugin || (plugin.ptype == 'cellediting' && !plugin.preventSelection)) {
      this.select(context.record);
    }
  }

});
