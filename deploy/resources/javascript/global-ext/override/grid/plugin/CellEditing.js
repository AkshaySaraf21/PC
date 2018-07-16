Ext.define('Gw.override.grid.plugin.CellEditing', {
  override: 'Ext.grid.plugin.CellEditing',

  _isCellEditable:function (colIdx, rowIdx, column, grid) {
    var disabled = null;
    var bPrivacy = false;

    var record = grid.store.getAt(rowIdx);
    var cellValue = record.get(column.dataIndex);
    var fieldValue = cellValue;
    var dvInput = gw.GridUtil.getFirstInputInTemplateCell(fieldValue);
    if (dvInput) {
      return dvInput.editable
    }
    if (fieldValue && fieldValue.text != undefined) {
      fieldValue = fieldValue.text;
    }

    gw.GridUtil.processGridEditor(grid.store, rowIdx, column, function (editorByRow) {
      if (editorByRow[0]) {
        disabled = editorByRow[0].disabled || false;
        bPrivacy = (editorByRow[0].xtype == 'privacy');
      } else {
        disabled = true;
      }
    }, true);
    if (disabled != null) {
      if (!disabled && bPrivacy && fieldValue && Ext.isObject(cellValue) && cellValue.hasOwnProperty("item")) {
        disabled = true;
      }
      return !disabled;
    }

    if (column.getEditor && column.getEditor() != null && column.getEditor().disabled) {
      return false;
    }
  },

  init: function () {
    this.callParent(arguments);

    //PL-31403: If anyone has a better idea...
    this.on('edit', function(editor, editEvt){
      var me = this;
      var column = editEvt.column;

      //If this is Internet Explorer, fire the blur event manually on the field after receiving an edit finish event from the editor
      if (Ext.isIE){
        var field = this.getColumnField(column);
        field.fireEvent('blur', field);
      }

    });

    this.on('beforeedit', function (editor, editEvt) {
      var me = this;
      var column = editEvt.column;

      // If a Confirmation Msg Box is present, do not allow edit to continue
      if (!me._isCellEditable(editEvt.colIdx, editEvt.rowIdx, column, editEvt.grid) || Ext.Msg.isVisible()) {
        return false;
      }

      // If this is a single dv input.
      // TODO: Card 372: Server refactor for DV editors
      var fieldValue = editEvt.record.get(editEvt.field);
      var dvInput = gw.GridUtil.getFirstInputInTemplateCell(fieldValue);
      if (dvInput) {
        editEvt.grid.setRowEditor(dvInput, editEvt.rowIdx, editEvt.column.dataIndex);

        // Stop normal Ext JS editor processing if the editor is a radio cell and the column is not configured as
        // a radio column.
      } else if (column.xtype != 'radiocolumn') {
        var beginEdit = true;

        gw.GridUtil.processGridEditor(editor.grid.store, editEvt.rowIdx, column, function (editorByRow) {
          var editorCfg = editorByRow[0];
          var editorType = editorCfg.xtype;

          // If the editor is a radio input, don't add an editor configuration as an implicit
          // editor has already been created. Stop the normal Ext JS editor processing
          if (!gw.GridUtil.hasEditor(editorType)) {
            beginEdit = false;

            // TODO: Redesign: Card 372: Look into making field container editors (if any) as flyouts.
          } else if (!(editorCfg.xtype == 'fieldcontainer')) {
            editorCfg.eventParam = gw.GridUtil.getFullIdForCell(editor.grid.store, editEvt.record, editEvt.field);
            if (!(editorCfg instanceof Ext.form.Field)) {
              if (editor.editing) {
                editor.completeEdit();
              }
              column.setEditor(editorCfg);

              return false;
            }
          }
        });

        // Checking for Confirmation Msg Box again because tabbing out produces confirmation dialog later
        if (!beginEdit || Ext.Msg.isVisible()) {
          return false;
        }
      }
    })
  },

  /**
   * Special handling for ENTER key on cell editor - Some LVs are configured to navigate through rows/cells on ENTER key.
   * @SenchaUpgrade: override private method
   */
  onSpecialKey: function (ed, field, e) {
    // Let alt-enter pass through.  Used in CellEditor.js to allow
    // selecting action on single item menu.
    if (e.getKey() === e.ENTER && !e.altKey) {
      var grid = this.getCmp(),
        view = grid.getView(),
        record = this.getActiveRecord(),
        position = view.getPosition(record, this.getActiveColumn()),
        bQuickAdd = grid.gQuickAdd,
        bCellNav = bQuickAdd || grid.gCellNavOnEnter,
        bRowNav = bCellNav || grid.gRowNavOnEnter,
        bForceRowNav,
        cellData;

      var direction = bCellNav ? (e.shiftKey ? 'left' : 'right') : // navigate horizontally
        bRowNav ? (e.shiftKey ? 'up' : 'down') : // navidate vertically
          null;

      if (direction) {
        e.stopEvent();

        // @SenchaUpgrade mimic the "Tab" behavior in super class, by calling non-public methods:
        do {
          if (bCellNav &&
            (cellData = grid.getStore().getAt(position.row).get(view.headerCt.getHeaderAtIndex(position.column).dataIndex)) &&
            cellData.endOfCellNav) { // if this cell is marked as end of cell-nav, force wrapping to the next row:
            position.column = grid.headerCt.getGridColumns().length - 1;
          }

          position = view.walkCells(position, direction, e, /*preventWrap*/false);
        } while (position && (!view.headerCt.getHeaderAtIndex(position.column).getEditor(grid.getStore().getAt(position.row)) || !this.startEditByPosition(position)));

        if (position) {
          return; // we have navigated to a different row or cell
        }
      }

      if (bQuickAdd) { // No more cell to navigate to, add a new row:
        // TODO: optimize to not post form data or update entire store during quickAdd?
        gw.app.requestViewRoot(grid.id, {quickAdd: true, updateData: true}, undefined, {postCallback: function () {
          // start at the beginning of the last row:
          var position = view.getPosition(grid.getStore().last(), grid.headerCt.getGridColumns()[0]);

          while (position && (!view.headerCt.getHeaderAtIndex(position.column).getEditor(grid.getStore().getAt(position.row)) || !this.startEditByPosition(position))) {
            position = view.walkCells(position, 'right', e, /*preventWrap*/false);
          }
        }, postCallbackScope: this});

        return; // we are done
      }
    }

    return this.callParent(arguments);
  },

  showEditor: function (ed, context, value) {
    /**
     * AHK - 4/10/2013 - We want text areas to expand to fill the entire cell, while using the configured
     * number of rows as a minimum size.  The best way that I've found to do that is to override the code
     * that shows the editor so that we explicitly set the height on the textarea at that time.
     * See PL-23772
     * @SenchaUpgrade Ideally there would be some more supported way of doing this
     */
    if (ed.field && ed.field.xtype == 'textarea') {
      var configuredHeight = (ed.field.rows * 17) + 8; // AHK - line-height is 17, vertical padding is 6px total, cell border is 2px total
      var rowHeight = context.row.offsetHeight;
      ed.field.height = (rowHeight > configuredHeight ? rowHeight : configuredHeight);
    }
    // AHK - 5/30/2013
    // In some odd cases involving check boxes, the call to showEditor will fail in Table.getCell (Table.js line 522)
    // because the row can't be found.  So as a total hack, if we know the parent call will fail, just don't make it,
    // since right now the only cases it fails in are cases where we don't even have an editor to show
    // @SenchaUpgrade
    var row = this.grid.getView().getNode(context.record, true);
    if (row) {
      this.callParent(arguments);
    }
  },

  // - - - @Sencha keyboard navigation for non editable cells
  // To access any content inside the cell, it must be configured with tabindex
  /**
   *
   * @param record
   * @param column
   */
  stepIntoCell: function (record, column) {
    var me = this,
            grid = me.grid,
            model = grid.getSelectionModel(),
            pos = model.getCurrentPosition(),
            cellCfg,
            radioButtons;

    if (!pos) {
      return false;
    }

    var cell = me.getCell(record, column),
        dom = Ext.get(cell).query('*[tabindex]'),
        fieldName = grid.getView().headerCt.getHeaderAtIndex(pos.column).dataIndex,
        idx = 0,
        editNav = me.keyNav;
    // console.log('step in to cell', dom);

    if (dom.length > 0) {

      // selection model is always cellmodel here
      // listen to model selection and focus changes

      model.on('selectionchange',
          function () {
            me.keyNav.enable();
          },
          me,
          {
            single: true // will auto remove this listener once executed
          }
      );

      model.on('focuschange',
          function () {
            me.keyNav.enable();
          },
          me,
          {
            single: true // will auto remove this listener once executed
          }
      );

      editNav.disable();

      // need to focus on the selected radio button, not the first one
      cellCfg = record.get(fieldName);
      if (cellCfg.xtype === 'radiogroup') {
        radioButtons = cellCfg.items;
        for (var i = 0; i < cellCfg.items.length; i++) {
          if (cellCfg.items[i].checked) {
            idx = i;
            break;
          }
        }
      }

      dom[idx].focus(); // focus first item

      // don't forget to cancel the focus task. Otherwise it will pass the focus to the whole row.
      // Ext.Component does the same in its focus() method.
      // and don't cancel the focus task if message box is on - otherwise the different task will be cancelled.
      if (!Ext.Msg.isVisible()) {
        grid.cancelFocus();
      }

      // recreate navigation based on current cell
      if (me.cellNav) {
        me.cellNav.destroy();
      }

      me.cellNav = new Ext.util.KeyNav({
        target: cell,
        defaultEventAction: 'stopPropagation',

        left: function (e) {
          idx = me.cellNav.selectedIndex > 0 ? --me.cellNav.selectedIndex : me.cellNav.selectedIndex;
          dom[idx].focus();
          e.stopEvent();
        },
        right: function (e) {
          idx = me.cellNav.selectedIndex < dom.length - 1 ? ++me.cellNav.selectedIndex : me.cellNav.selectedIndex;
          dom[idx].focus();
          e.stopEvent();
        },

        // prevent from moving up
        up: Ext.emptyFn,

        // down
        down: function(e) {
          if (e.altKey) {
            // Handle the processing of the Alt-Down arrow key combination for dropping down menu
            // on custom cells with injected menu button
            var menu = gw.GridUtil.menuForCellInGrid(cell);
            if (menu) {
              // we stop the event since we processed it
              e.stopEvent();
              me.grid.processMenuViaKey(record, Ext.fly(menu));
            }
          }
        },

        // natural tab
        tab: function(e) {
          e.stopEvent();
          model.onKeyTab(e);
        },

        space: function (e) {
          var cellButton = dom[me.cellNav.selectedIndex],
              btnConfig = record.get(fieldName);

          var tagName = cellButton.tagName.toLowerCase();

          if (btnConfig.xtype !== 'radiogroup') {
            me.grid.processCellClickViaMouse(grid.getView(), cell, pos.column, record, grid.getView().getNode(record), pos.row, e);
          }

          if (tagName === 'button') {
            // insert any button tag logic here
          }

          // handle Guidewire specific actions
          if (tagName === 'span' || tagName === 'a') {
            // implememnt direct custom logic here
          }

          if (tagName === 'input') {
            // might be a radio implementation
            // test if there
            // insert any button tag logic here
          }

        },

        // Uncomment if you would like Enter key functionality.
        // Also would have to duplicate some of the functionality in space method to mirror actions
//                enter  : function(e){
//                    me.grid.processCellClickViaMouse(grid.getView(), cell, pos.column, record, grid.getView().getNode(record), pos.row, e);
//                },

        esc: function () {
          editNav.enable();
          // trick in to same position but gain keyboard access
          model.setCurrentPosition(null);
          model.setCurrentPosition(pos);
        },

        scope: me
      });

      // keep track of location
      me.cellNav.selectedIndex = idx;
    }
  },
  /**
   * Will blur the focus on the inner element in the cell if we are doing cell navigation
   * within the cell. If we don't do this, the focused element (which has tabindex=-1) will
   * have the focus 'stuck' to it when tab navigation is attempted.
   * @private
   */
  _blurFocusOnNonEditableCellIfNecessary: function() {
    var me = this;
    if (me.cellNav) {
      var grid = me.grid,
          model = grid.getSelectionModel(),
          pos = model.getCurrentPosition(),
          cell = me.getCell(pos.record, pos.columnHeader),
          dom = Ext.get(cell).query('*[tabindex]');
      if (dom.length > me.cellNav.selectedIndex) {
        dom[me.cellNav.selectedIndex].blur();
      }
      me.keyNav.enable();
      me.cellNav.destroy();
      me.cellNav = null;
    }
  },

  /**
   * @SenchaUpgrade workaround ExtJs4.2.1 bug to restore context after "beforeedit" returns false
   * https://support.sencha.com/index.php#ticket-12906
   */
  startEdit: function (record, columnHeader, /* private */ context) {
    var me = this,
        isEditorEditing,
        isFieldEditable,
        isRadio,
        ed,
        originalContext = me.context;

    // set the active LV so after page refresh the focus will be on the correct listView
    gw.app.setActiveLV(this.grid.id);

    if (!context) {
      me.preventBeforeCheck = true;
      /**
       * @Sencha change call, because we are overriding functionality
       */
      context = me.callSuper(arguments);
      delete me.preventBeforeCheck;
      if (context === false) {
        this.context = originalContext; // restore old context
        return false;
      }
    }

    // Cancel editing if EditingContext could not be found (possibly because record has been deleted by an intervening listener),
    // or if the grid view is not currently visible
    if (context && me.grid.view.isVisible(true)) {

      record = context.record;
      columnHeader = context.column;

      // So that we get the correct row index when complete an edit, we want to store the new
      // context into 'me'.  We will delete it later
      me.newContext = context;

      // If there is an editor for this column,
      // allow vetoing, or setting a new editor *before* we call getEditor
      isFieldEditable = (columnHeader && columnHeader.getEditor(record)) && !(me.beforeEdit(context) === false || me.fireEvent('beforeedit', me, context) === false || context.cancel);
      isRadio = columnHeader.xtype == "radiocolumn";

      if (isFieldEditable) {
        ed = me.getEditor(record, columnHeader);
        isEditorEditing = ed.editing;
      }

      // Complete the edit now, before getting the editor's target cell DOM element.
      // Completing the edit hides the editor, causes a row update and sets up a delayed focus on the row.
      // Also allows any post-edit events to take effect before continuing
      me.completeEdit();

      if (!isFieldEditable || context.field === 'booleanCell') {
        me.stepIntoCell(record, columnHeader);
      }

      // Delete the new context since it will now be the current context.
      delete me.newContext;
      // Switch to new context *after* completing the current edit
      me.context = context;

      context.originalValue = context.value = record.get(columnHeader.dataIndex);

      // Whether we are going to edit or not, ensure the edit cell is scrolled into view
      // me.grid.view.cancelFocus();
      me.view.scrollCellIntoView(me.getCell(record, columnHeader));
      if (ed) {
        if (Ext.isIE && isEditorEditing) {
          // If the editor was already in use on another cell when we began editing,
          // as is the case when editing a single-column grid and using the tab
          // key to move the editor, we need to set a flag that tells the editor
          // not to cancel editing in its blur handler (see Ext.Editor#onFieldBlur).
          // This is needed because in IE the blur event fires AFTER the new
          // editor has already been shown.  See EXTJSIV-9878
          ed.selectSameEditor = true;
        }
        me.showEditor(ed, context, context.value);
        // return false for radiocolumns since show editor does not do anything for them.
        //TODO: this method should have this: <code>return me.showEditor</code>. ShowEditor should return true if it is able to actually show the editor.
        if (isRadio) {
          return false;
        }
        return true;
      }

      this.context = originalContext; // restore old context
      return false;
    }
  },

  completeEdit : function() {
    this._blurFocusOnNonEditableCellIfNecessary();
    this.callParent(arguments);
  },

  cancelEdit : function() {
    this._blurFocusOnNonEditableCellIfNecessary();
    this.callParent(arguments);
  },

  /*
   getEditor initializes editor.  This method follows the same logic but
   does not cause any "side effects"
   */
  hasEditor : function(record, column) {
      var me = this;
      var _editor = me.editors.getByKey(column.getItemId());

      if (!_editor) {
        _editor = column.getEditor(record);
      }
      return _editor
  },

  /*
   This method checks to see if a cell is editable without
   causing side-effects.

   (This can be used instead of isCellEditable which uses me.getEditor.  me.getEditor may lazily instantiate the editor
   field causing causing inEditor to be initialized to true.
   */
  checkCellEditable : function(record, columnHeader) {
    var me = this,
        context = me.getEditingContext(record, columnHeader);

    if (me.grid.view.isVisible(true) && context) {
      columnHeader = context.column;
      record = context.record;
      if (columnHeader && me.hasEditor(record, columnHeader)) {
        return true;
      }
    }
    return false;
  },

  destroy: function () {
    var me = this;
    me.callParent();
    if (me.cellNav) {
      me.cellNav.destroy();
    }
  },

  /**
   * @SenchaUpgrade EXTJS-14420. PL-31052 The previous row checkbox is selected after pressing space or enter.
   */
  onEditComplete : function(ed, value, startValue) {
    var me = this,
      grid = me.grid,
      activeColumn = me.getActiveColumn(),
      context = me.context,
      record,
      focusRowIdx = context.rowIdx;

    if (activeColumn) {
      record = context.record;

      me.setActiveEditor(null);
      me.setActiveColumn(null);
      me.setActiveRecord(null);

      context.value = value;
      if (!me.validateEdit()) {
        me.editing = false;
        return;
      }

      // Only update the record if the new value is different than the
      // startValue. When the view refreshes its el will gain focus
      if (!record.isEqual(value, startValue)) {
        record.set(activeColumn.dataIndex, value);
      }

      if (me.newContext && me.newContext.rowIdx) {
        focusRowIdx = me.newContext.rowIdx;
      }

      // Restore focus back to the view.
      // Use delay so that if we are completing due to tabbing, we can cancel the focus task
      context.view.focusRow(focusRowIdx, 100);
      me.fireEvent('edit', me, context);
      me.editing = false;
    }
  }

});
