Ext.define('Overrides.selection.Model', {
  override: 'Ext.selection.Model',

  /**
   *
   * @Sencha see changes below. This enables proper keyboard navigation and won't select record during focus change.
   */
  // Private
  // Called after a new record has been navigated to by a keystroke.
  // Event is passed so that shift and ctrl can be handled.
  afterKeyNavigate: function (e, record) {
    var me = this,
        recIdx,
        fromIdx,
        isSelected = me.isSelected(record),
        from = (me.selectionStart && me.isSelected(me.lastFocused)) ? me.selectionStart : (me.selectionStart = me.lastFocused),
        key = e.getCharCode(),
        isSpace = key === e.SPACE,
        direction = key === e.UP || key === e.PAGE_UP ? 'up' : (key === e.DOWN || key === e.DOWN ? 'down' : null);

    switch (me.selectionMode) {
      case 'MULTI':

        if (isSpace) {
          // SHIFT+SPACE, select range
          if (e.shiftKey) {
            me.selectRange(from, record, e.ctrlKey);
          } else {
            // SPACE pressed on a selected item: deselect but leave it focused.
            // e.ctrlKey means "keep existing"
            if (isSelected) {
              me.doDeselect(record, e.ctrlKey);

              // This record is already focused. To get the focus effect put on it (as opposed to selected)
              // we have to focus null first.
              me.setLastFocused(null);
              me.setLastFocused(record);
            }
            // SPACE on an unselected item: select it
            else {
              me.doSelect(record, e.ctrlKey);
            }
          }
        }

        // SHIFT-navigate selects intervening rows from the last selected (or last focused) item and target item
        else if (e.shiftKey && from) {

          // If we are going back *into* the selected range, we deselect.
          fromIdx = me.store.indexOf(from);
          recIdx = me.store.indexOf(record);

          // If we are heading back TOWARDS the start rec - deselect skipped range...
          if (direction === 'up' && fromIdx <= recIdx) {
            me.deselectRange(me.lastFocused, recIdx + 1);
          }
          else if (direction === 'down' && fromIdx >= recIdx) {
            me.deselectRange(me.lastFocused, recIdx - 1);
          }

          // If we are heading AWAY from start point, or no CTRL key, so just select the range and let the CTRL control "keepExisting"...
          else if (from !== record) {
            me.selectRange(from, record, e.ctrlKey);
          }
          me.lastSelected = record;
          me.setLastFocused(record);
        }

        // CTRL-navigate onto a selected item just focuses it
        else if (e.ctrlKey && isSelected) {
          me.setLastFocused(record);
        }

        // CTRL-navigate, just move focus
        else if (e.ctrlKey) {
          me.setLastFocused(record);
        }

        // Just navigation - select the target
        else {
          /**
           * @Sencha fix awkward selection during navigation
           * introduce property for model : simpleNavigation.
           * if set to true navigation won't select record, you have to explicitly press space
           */
          if (me.simpleNavigation) {
            me.setLastFocused(record);
          } else {
            me.doSelect(record, false);
          }
        }
        break;
      case 'SIMPLE':
        if (me.simpleNavigation) {
          me.setLastFocused(record);
        } else {
          if (isSelected) {
            me.doDeselect(record);
          } else {
            me.doSelect(record, true);
          }
        }
        break;
      case 'SINGLE':
        // Space hit
        if (isSpace) {
          if (isSelected) {
            me.doDeselect(record);
            me.setLastFocused(record);
          } else {
            me.doSelect(record);
          }
        }

        // CTRL-navigation: just move focus
        else if (e.ctrlKey) {
          me.setLastFocused(record);
        }

        // if allowDeselect is on and this record isSelected, deselect it
        else if (me.allowDeselect && isSelected) {
          me.doDeselect(record);
        }

        // select the record and do NOT maintain existing selections
        /**
         * @Sencha keyboard focus fix
         */
        else {
          if (me.simpleNavigation) {
            me.setLastFocused(record);
          } else {
            me.doSelect(record, false);
          }
        }
        break;
    }

    // selectionStart is a start point for shift/mousedown to create a range from.
    // If the mousedowned record was not already selected, then it becomes the
    // start of any range created from now on.
    // If we drop to no records selected, then there is no range start any more.
    if (!e.shiftKey) {
      if (me.isSelected(record)) {
        me.selectionStart = record;
      }
    }
  }

});
