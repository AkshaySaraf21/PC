Ext.define('Gw.override.grid.CellEditor', {
  override: 'Ext.grid.CellEditor',
  realign: function (autoSize) {
    var me = this,
        boundEl = me.boundEl,
        innerCell = boundEl.first(),
        innerCellTextNode = innerCell.dom.firstChild,
        width = boundEl.getWidth(),
        offsets = Ext.Array.clone(me.offsets),
        grid = me.grid,
        xOffset,
        menu,
        v = '',

    // innerCell is empty if there are no children, or there is one text node, and it contains whitespace
        isEmpty = !innerCellTextNode || (innerCellTextNode.nodeType === 3 && !(Ext.String.trim(v = innerCellTextNode.data).length));

    if (me.isForTree) {
      // When editing a tree, adjust the width and offsets of the editor to line
      // up with the tree cell's text element
      xOffset = me.getTreeNodeOffset(innerCell);
      width -= Math.abs(xOffset);
      offsets[0] += xOffset;
    }

    if (grid.columnLines) {
      // Subtract the column border width so that the editor displays inside the
      // borders. The column border could be either on the left or the right depending
      // on whether the grid is RTL - using the sum of both borders works in both modes.
      width -= boundEl.getBorderWidth('rl');
    }

    // @Sencha shrink editor if there is a helperIcon
    // Change visibility on icon, so it can be clicked
    var helperIcon = Ext.fly(innerCell).query('[class=g-helper-cell-icon]')[0];
    if (helperIcon) {
      // shrink
      width -= 34;
      Ext.fly(helperIcon).dom.style.visibility = 'visible';

      menu = gw.GridUtil.menuForCellInGrid(innerCell);
      if (menu) {
        // add keyboard support on Key Down
        me.cellNav = new Ext.util.KeyNav({
          target: me.el,
          down: function () {
            var rec = grid.getSelectionModel().getSelection()[0];
            grid.processMenuViaKey(rec, menu);
          },
          scope: me
        })
      } else {
        // If helperIcon but no menu object, assume there's only a single menu item
        // which acts like a button. Map help icon action to alt-enter as regular
        // enter is reserved for navigating the cell grid.
        me.cellNav = new Ext.util.KeyNav({
          target: me.el,
          'enter': function (e) {
            if (e.altKey) {
              (Ext.fly(helperIcon)).dom.children[0].click();
            }
          },
          scope: me
        })
      }
    }

    if (autoSize === true) {
      me.field.setWidth(width);
    }

    // https://sencha.jira.com/browse/EXTJSIV-10871 Ensure the data bearing element has a height from text.
    if (isEmpty) {
      innerCell.dom.innerHTML = 'X';
    }
    me.alignTo(innerCell, me.alignment, offsets);
    if (isEmpty) {
      innerCell.dom.firstChild.data = v;
    }
  }

});
