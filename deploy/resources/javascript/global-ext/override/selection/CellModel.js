Ext.define('Gw.overrides.selection.CellModel', {
  override: 'Ext.selection.CellModel',

  // @Sencha add space key
  initKeyNav: function (view) {
    var me = this;

    if (!view.rendered) {
      view.on('render', Ext.Function.bind(me.initKeyNav, me, [view], 0), me, {single: true});
      return;
    }

    /**
     * Part of fix for PL-30772
     * Registers a handler for the special 'gw-focus-first-row' event so that it
     * calls the first data row focus handler
     */
    view.on('gw-focus-row', me._firstDataRowFocusHandler, me);

    me.keyNav = new Ext.util.KeyNav({
      target: view.el,
      ignoreInputFields: true,
      up: me.onKeyUp,
      down: me.onKeyDown,
      right: me.onKeyRight,
      left: me.onKeyLeft,
      space: me.onKeySpace,
      enter: me.onKeyEnter,
      tab: me.onKeyTab,
      scope: me
    });
  },
  ignoreGwFocusEventsWhileExitingEditor: false,
  /**
   * Will set the focus to the first cell in the grid view IF there is no position set
   * @param row
   * @private
   */
  _firstDataRowFocusHandler: function(row, rowIndex) {
    var me = this,
        currentPos;
    if (!me.ignoreGwFocusEventsWhileExitingEditor) {
      currentPos = me.getCurrentPosition();
      if (!currentPos) {
        // there is no position set, yet we got a focus event, so assume we want to be focusing on
        // and selecting the first row/column in the grid view
        me._selectTheFirstColumnInGridViewForRow(me, rowIndex);
      } else {
        me.setCurrentPosition(null);
        me.setCurrentPosition(currentPos);
        me._restartEditingIfNecessary(me);
      }
    }
  },
  /**
   * Will set the current position in the grid view to be the first column of the first row
   * @param me
   * @private
   */
  _selectTheFirstColumnInGridViewForRow: function(me, rowIndex) {
    me.setCurrentPosition({row: rowIndex, column: 0});
    me._restartEditingIfNecessary(me);
  },
  _restartEditingIfNecessary: function(me) {
    var currentPos = me.getCurrentPosition();
    if (me.wasEditing && currentPos) {
      var editingPlugin = currentPos.view.editingPlugin;
      if (editingPlugin.startEdit(currentPos.record, currentPos.columnHeader)) {
        me.wasEditing = false;
      }
    }
  },

  onKeySpace: function(e) {
    this._processCheckboxOrSimpleRadioCell(e);
  },

  onKeyEnter: function(e) {
    this._processCheckboxOrSimpleRadioCell(e);
  },

  _processCheckboxOrSimpleRadioCell: function (e) {
    var me = this,
        radioCls = '.' + Ext.baseCSSPrefix + 'form-radio',
        rec = me.getSelection()[0];
    // check if a cell is actually highlighted
    // summary row does not get highlighted
    if (rec) {
      var pos = me.getCurrentPosition(),
          view = pos ? pos.view : this.primaryView,
          fieldName = view.headerCt.getHeaderAtIndex(pos.column).dataIndex,
          val = rec.get(fieldName),
          cell = view.getCell(rec, pos.columnHeader);

      // from simpleGrid.js
      var newData;

      // Only invoke space bar to change value for check box cell
      // Other components have its own space bar handler (i.e., rowcheckcolumn, radiocolumn)
      // Must check for check box class existence since a check box cell can be read only
      if (fieldName !== '_Checkbox' &&  Ext.fly(cell).query('[class^=x-grid-checkcolumn]').length > 0) {
        if (Ext.isObject(val)) {
          //val is an object when the cell has a value AND a checkbox
          if (val.cb !== undefined) {
            newData = {};
            Ext.apply(newData, rec.get(fieldName));
            newData.cb = !val.cb;
          }
        } else {
          newData = !val;
        }
        gw.GridUtil.processCellClick(view.headerCt.getHeaderAtIndex(pos.column), view.panel, rec, pos.row, fieldName,
            function () {
              rec.set(fieldName, newData)
            }
        );
      } else if (pos.columnHeader.xtype !== 'radiocolumn' &&  cell.el.down(radioCls) != null && !val) {
        // complex Type that is not a radio column, just a radio inside a cell
        gw.GridUtil.processRadioCellClick(true, pos.columnHeader, view.panel, rec, pos.row, fieldName);
      }
    }
  },

  // @Sencha
  // implements key combination for dropping down menu on custom cells with injected menu button
  onKeyDown: function (e) {
    if (e.altKey) {
      var me = this,
          menu,
          rec = me.getSelection()[0],
          pos = me.getCurrentPosition(),
          view = pos ? pos.view : this.primaryView,
          grid = view.headerCt.grid,
          cell = view.getCell(rec, pos.columnHeader);

      menu = gw.GridUtil.menuForCellInGrid(cell);

      grid.processMenuViaKey(rec, Ext.fly(menu));
    } else {
      var me = this;
      me.callParent(arguments);
      this._wasPositionAdjustedForColspan(e, 'down', me);
    }
  },

  onKeyTab: function(e, t) {
    var me = this,
        colSpanInfo = this._wasPositionAdjustedForColspan(e, 'right', me);

    me.callParent(arguments);
    if (!this._restorePositionIfOverriddenCallDidNoMovement(me, colSpanInfo) &&
        this._wasPositionAdjustedForColspan(e, 'left', me).movedLeftForColSpan) {
      me.callParent(arguments);
    }
    if (colSpanInfo.startingPosition === me.getCurrentPosition()) {
      // if navigation resulted in nothing moving, exit the view and
      // finally return true to allow the navigation event to bubble up and move
      // the focus outside of the list view
      me._exitingView(me, null, e);
      return true;
    }
  },

  /**
   * @SenchaUpgrade: outside of the do-while loop should match Sencha's implementation
   * private implementation of Sencha's onEditorTab to skip over unactionable and uneditable cells
   * @param editingPlugin
   * @param e
   * @private
   */
  _handleEditableTabOnEdit: function(editingPlugin, e, startingPosition) {
    var me = this,
        direction = e.shiftKey ? 'left' : 'right',
        position,
        isCurrentPositionEditable,
        isCurrentCellActionable,
        isCurrentCellAMenu,
        isCurrentCellACheckBox;

    do {
      position = me.move(direction, e);
      if (position) {
        isCurrentPositionEditable = position.view.editingPlugin.checkCellEditable(position.row, position.columnHeader);
        var currentCell = me.view.getCellByPosition(position);

        isCurrentCellActionable = currentCell.down('.g-actionable') !== null;
        isCurrentCellAMenu = currentCell.down('.g-cell-menu') !== null;
        isCurrentCellACheckBox = currentCell.down('.x-grid-checkcolumn') !== null;
      }
    } while (position
        && !isCurrentPositionEditable
        && !isCurrentCellActionable
        && !isCurrentCellAMenu
        && !isCurrentCellACheckBox);

    // Navigation had somewhere to go.... not hit the buffers.
    if (position) {
      // If we were able to begin editing clear the wasEditing flag. It gets set during navigation off an active edit.
      if (editingPlugin.startEdit(position.record, position.columnHeader)) {
        me.wasEditing = false;
      }
      // If we could not continue editing...
      // bring the cell into view.
      // Set a flag that we should go back into editing mode upon next onKeyTab call
      else {
        position.view.scrollCellIntoView(position);
        me.wasEditing = true;
      }
    } else {
      // No new position, so revert it back to the starting position so that we can leave the
      // grid correctly.
      me.setCurrentPosition(startingPosition);
    }
  },

  //@SenchaUpgrade: Override onEditorTab to skip over colspans and call GW's implementation of onEditorTab to skip over uneditable and unactionable cells.
  onEditorTab: function(editingPlugin, e) {
    var me = this,
        colSpanInfo = this._wasPositionAdjustedForColspan(e, 'right', me);

    me._handleEditableTabOnEdit(editingPlugin, e, colSpanInfo.startingPosition);

    if (!this._restorePositionIfOverriddenCallDidNoMovement(me, colSpanInfo) &&
        this._wasPositionAdjustedForColspan(e, 'left', me).movedLeftForColSpan) {
      me._handleEditableTabOnEdit(editingPlugin, e, colSpanInfo.startingPosition);
    }
    if (colSpanInfo.startingPosition === me.getCurrentPosition()) {
      // if navigation resulted in nothing moving, exit the view and
      // finally return true to allow the navigation event to bubble up and move
      // the focus outside of the list view
      me._exitingView(me, editingPlugin, e);
      return true;
    }
  },
  onKeyRight: function(e) {
    var me = this,
        colSpanInfo = this._wasPositionAdjustedForColspan(e, 'right', me);
    me.callParent(arguments);
    this._restorePositionIfOverriddenCallDidNoMovement(me, colSpanInfo);
  },
  onKeyLeft: function(e) {
    var me = this;

    me.callParent(arguments);
    if (this._wasPositionAdjustedForColspan(e, 'left', me).movedLeftForColSpan) {
      me.callParent(arguments);
    }
  },
  onKeyUp: function(e) {
    var me = this;

    me.callParent(arguments);
    this._wasPositionAdjustedForColspan(e, 'up', me);
  },
  /**
   * Sets up the component so that it knows it is exiting the view
   * @param me
   * @param editingPlugin
   * @param event
   * @private
   */
  _exitingView: function(me, editingPlugin, event) {
    // We are exiting the view set current position to null in the grid, and remember the direction we are exiting
    if (editingPlugin) {
      // complete editing, have the grid remember it was editing,
      editingPlugin.completeEdit();
      me.wasEditing = true;
      // Now we have the super ugly hack of setting the 'ignore' flag so the focus handler
      // we added does nothing.  This is necessary so that when the tab event bubbles up from the
      // now hidden cell editor in the grid, it automatically pushes the focus back to the row that contained
      // the edited cell.  While the ignore flag is on, any gw-focus events will be ignored.  We add a
      // deferred callback to turn the flag off after enough time has passed to process the various event
      // bubbles.
      me.ignoreGwFocusEventsWhileExitingEditor = true;
      Ext.defer(function() {
        // Turn this off after a small delay so that subsequent events start paying attention to focus in again
        me.ignoreGwFocusEventsWhileExitingEditor = false;
      }, 150);
    }
    me.setCurrentPosition(null);
  },
  /**
   * Detects whether a right move that contained a colspan adjustment actually
   * did nothing when the overridden method was called, and if so restore the
   * original starting position and return true.  Otherwise just returns false
   * @param me
   * @param colSpanInfo
   * @returns {boolean}
   * @private
   */
  _restorePositionIfOverriddenCallDidNoMovement: function(me, colSpanInfo) {
    if (colSpanInfo.movedRightForColSpan &&
        colSpanInfo.adjustedPosition === me.getCurrentPosition()) {
      // if we moved the position right for the colSpan, but after the overridden
      // method was called, the position didn't move, then we want to put it back
      // to where it was
      me.setCurrentPosition(colSpanInfo.startingPosition);
      return true;
    }
    return false;
  },
  /**
   * Indicates whether (and in which direction) this method adjusted the position of the current cell in the view
   * based upon whether a cell with a colspan is active in the row and the direction of movement would require that
   * the "hidden" cells created by the Gw.override.grid.column.Column override methods were skipped over
   *
   * @param event
   * @param direction
   * @param me
   * @returns {*}
   * @private
   */
  _wasPositionAdjustedForColspan: function(event, direction, me) {
    /**
     * _columnDataForPos returns the column data from the record associated with the given columnIndex
     * @param pos
     * @param columnIndex
     * @private
     */
    function _columnDataForPos(pos, columnIndex) {
      var header = gw.GridUtil.headerForVisibleColumnAtIndex(pos.view, columnIndex),
          fieldName = header.dataIndex;
      return pos.record.data[fieldName];
    }
    /**
     * Creates a new CellContext position from the given position for the specified column index
     * @param pos
     * @param columnIndex
     * @private
     */
    function _newPosition(pos, columnIndex) {
      var view = pos.view,
          header = gw.GridUtil.headerForVisibleColumnAtIndex(view, columnIndex);
      if (header) {
        return new Ext.grid.CellContext(view).setPosition({
          row: pos.record,
          column: header
        });
      } else {
        return null;
      }
    }
    /**
     * Returns the visible column index of the row associated with the position's column
     * @param pos
     * @returns {number}
     * @private
     */
    function _visibleColumnIndexOfPosition(pos) {
      return gw.GridUtil.indexOfColumnInVisibleColumnList(pos.view, pos.column);
    }

    /**
     * Indicates whether the current position was moved left to be at(next to) the colspan
     * @param me
     * @param offset
     * @returns {boolean}
     * @private
     */
    function _adjustPositionLeftWhenInColumnHiddenByColSpan(colSpanInfo, me, offset) {
      var pos = colSpanInfo.startingPosition,
          visibleIndex = _visibleColumnIndexOfPosition(pos),
          columnData = _columnDataForPos(pos, visibleIndex);
      if (columnData === '') {
        // get the index of the column in the visible column list so that we can correctly
        // compute if the column is covered by the column span
        var colSpanColumn = -1;
        for (var i = 0; i < visibleIndex; i++) {
          var data = _columnDataForPos(pos, i);
          if (data && data.colspan && ((i + data.colspan) > visibleIndex)) {
            colSpanColumn = i;
            break;
          }
        }
        if (colSpanColumn !== -1) {
          // if we found a colspan column, set the current position to it.
          var newPos = _newPosition(pos, colSpanColumn + offset);
          adjustAndRememberPosition(colSpanInfo, me, newPos, true);
        }
      }
    }
    /**
     * Adjusts the position on me to be the new position, remembering in the colSpanInfo both whether this
     * was a left or right move AND what the new position is
     * @param colSpanInfo
     * @param me
     * @param newPos
     * @param isLeft
     */
    function adjustAndRememberPosition(colSpanInfo, me, newPos, isLeft) {
      if (newPos) {
        me.setCurrentPosition(newPos);
        colSpanInfo.movedRightForColSpan = !isLeft;
        colSpanInfo.movedLeftForColSpan = isLeft;
        colSpanInfo.adjustedPosition = newPos;
      }
    }

    /**
     * This structure is used to remember the colspan adjustment information and returned
     * from this method.  This information is helpful for detecting when we've reached the
     * end of the navigable list and it happens to be a colspan, so we want to reposition the
     * grid selection back to the colspan after attempting the navigation.
     * @type {{movedRightForColSpan: boolean, movedLeftForColSpan: boolean, startingPosition: *, adjustedPosition: null}}
     */
    var colSpanInfo = {
      movedRightForColSpan: false,
      movedLeftForColSpan: false,
      startingPosition: me.getCurrentPosition(),
      adjustedPosition: null
    };

    if (colSpanInfo.startingPosition) {
      if ((!event.shiftKey || event.keyCode !== event.TAB) && direction === 'right') {
        // if we are going to the right, then check to see if the current column has a colSpan.
        // If it does, before the key stroke is processed, set the current position to
        // be the "hidden" cell at the end of the colspan as set up by the
        // Gw.override.grid.column.Column override
        var pos = colSpanInfo.startingPosition,
            visibleIndex = _visibleColumnIndexOfPosition(pos),
            columnData = _columnDataForPos(pos, visibleIndex);
        if (columnData && columnData.colspan) {
          // Make sure the computed colspan skip amount isn't greater than the total visible columns
          var lastHiddenColumnIndex = Math.min(visibleIndex + columnData.colspan, pos.view.headerCt.getVisibleGridColumns().length);
          var newPos = _newPosition(pos, lastHiddenColumnIndex - 1);
          adjustAndRememberPosition(colSpanInfo, me, newPos, false);
        }
      } else if ((event.shiftKey || event.keyCode !== event.TAB) && direction === 'left') {
        // if we are going left, after moving to the left, see if we landed on
        // a cell that is "hidden" as part of a colspan as set up by the
        // Gw.override.grid.column.Column override
        _adjustPositionLeftWhenInColumnHiddenByColSpan(colSpanInfo, me, 1);
      } else if (direction === 'up' || direction === 'down') {
        // if we are going up or down, after moving, see if we landed on
        // a cell that is "hidden" as part of a colspan as set up by the
        // Gw.override.grid.column.Column override. If so, position
        _adjustPositionLeftWhenInColumnHiddenByColSpan(colSpanInfo, me, 0);
      }
    }
    return colSpanInfo;
  }

});
