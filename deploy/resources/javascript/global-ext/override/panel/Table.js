Ext.define('Gw.override.panel.Table', {
  override: 'Ext.panel.Table',
  _allColInfo: {},

  /**
   * PL-29294 Newly added LV column appears at the extreme right until layout preferences are reset
   * this happens like a reload after editing the PCF, the JSON items and the state will be out of sync
   * Hence do not try to restore state, need to override here to work in rowtree and grid
   */
  initComponent: function () {

    // Grab the column state ids from the panel that we want to save the preferences for.
    // Returns an array of column state ids we're interested in.
    function _getHeaderIdsForColsToSave(panel) {
      var hdrItems = panel.headerCt.items.items;
      var colStateIds = [];
      for (var i = 0; i < hdrItems.length; i++) {
        var hdrItem = hdrItems[i];
        // If its hidden and not hideable, that means it's an internal column
        // i.e. - don't include it in the set of targeted columns.
        if ((!hdrItem.hidden) || (hdrItem.hideable)) {
          colStateIds.push(hdrItem.getStateId());
        }
      }
      return colStateIds;
    };

    // Filter out state columns based on targetedColIds
    // Returns the set of state col ids that remain after
    // the filter.
    function _filterStateCols(targetedColIds, state) {
      var stateColIds = [];
      var filteredColumns = [];
      for (var i = 0; i < state.columns.length; i++) {
        var currentCol = state.columns[i];
        var stateId    = currentCol.id;
        if (targetedColIds.indexOf(stateId) >= 0) {
          filteredColumns.push(currentCol);
          stateColIds.push(stateId);
        }
      }
      state.columns = filteredColumns;
      return stateColIds;
    }

    this.on('beforestatesave', function (panel, state) {

      var targetedColIdsFromPanel = _getHeaderIdsForColsToSave(panel);
      _filterStateCols(targetedColIdsFromPanel, state);

      // Init the associative array used to keep a handle
      // on the grid's columns.
      if (!state.allCols) {
        state.allCols = this._allColInfo || {};
      }

      // Accumulate all the currently accessible columns for a given table.
      // This allows preferences to be stored for columns that might not be
      // rendered for a given table due to visibility logic.
      for (var i = 0; i < state.columns.length; i++) {
        var currentCol = state.columns[i];
        state.allCols[currentCol.id] = currentCol;
      }
    }),

    this.on('beforestaterestore', function (panel, state) {

      // Squirrel away all cols on the table object up front.
      // This gets set when saving to "bridge" across state objects.
      this._allColInfo = state.allCols || {};

      var hdrIds = _getHeaderIdsForColsToSave(panel);
      var stateColIds = _filterStateCols(hdrIds, state);

      // Add the missing columns from the collection of columns we've squirreled away
      if (state.allCols) {
        for (var i = 0; i < hdrIds.length; i++) {
          var hdrStateId = hdrIds[i];
          if (stateColIds.indexOf(hdrStateId) == -1) {
            var colInfo = state.allCols[hdrStateId];
            if (!colInfo) {
              // Unknown column.  Kick out...
              return false;
            }
            state.columns.push(colInfo);
            stateColIds.push(state.columns[i].id);
          }
        }
      }

      // If number of saved columns and configured columns are not the same
      // returns false since columns are either deleted or added
      if (hdrIds.length !== state.columns.length) {
          return false;
      }

      // TODO: Remove this?  The above code should ensure we are dealing with the same columns
      hdrIds.sort();
      stateColIds.sort();
      if (hdrIds.join() !== stateColIds.join()) {
        return false;
      }

    });

    this.callOverridden(arguments);
  }

});