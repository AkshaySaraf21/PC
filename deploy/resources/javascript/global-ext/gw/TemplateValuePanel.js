/**
 * A panel for encapsulating a template widget.
 */
Ext.define('gw.TemplateValuePanel', {
  extend: 'Ext.Container',
  alias: 'widget.templatevaluepanel',

  layout: 'anchor',
  /**
   * Handle line breaks in template panel.
   */
  initComponent: function () {
    // Look for '-' as the line break indicator.
    // Items between line breaks will be rendered as a composite field.
    var allItems = this.items;
    this.items = [];
    var curItems = [];
    var tempItems = [];
    Ext.each(allItems, function (it, index) {
      if (it == '-') {
        if (curItems.length == 1) {
          tempItems.push(curItems[0]);
        } else if (curItems.length > 1) {
          tempItems.push({ xtype: 'fieldcontainer', items: curItems});
        }
        curItems = [];
      } else {
        curItems.push(it);
      }
    }, this);

    if (curItems.length == 1) {
      tempItems.push(curItems[0]);
    } else if (curItems.length > 1) {
      tempItems.push({ xtype: 'fieldcontainer', items: curItems});
    }

    // Propagate label information for test purposes.
    // TODO: Sort out label versus fieldLabel and doc it (even with above comment)
    var label = this.fieldLabel;
    var fieldLabel = this.fieldLabel;
    var lStyle = this.labelStyle;
    var lWidth = this.labelWidth;
    var needsWrapper = false;
    var defaultFieldLabelConfig = {labelStyle: lStyle, label: label};
    if (lWidth) {
      defaultFieldLabelConfig.labelWidth = lWidth;
    }

    Ext.apply(this, {fieldLabel: fieldLabel, 'defaults': defaultFieldLabelConfig});

    Ext.each(tempItems, function (item) {
      if (item.xtype) {
        Ext.apply(item, {fieldLabel: fieldLabel, hideEmptyLabel: false})
        if (item.xtype == 'fieldcontainer') {
          Ext.apply(item, {layout: 'hbox', combineErrors: true, defaults: defaultFieldLabelConfig});
        }
        fieldLabel = "";  // only apply label to the first item
      } else {
        needsWrapper = true;
      }
    });

    // AHK - 5/31/2013 - We need to wrap everything in a fieldcontainer or we could sometimes
    // (depending on the type of child item) end up with no labels showing up
    // See PL-26317
    if (needsWrapper) {
      var containerWrapperConfig = { xtype: 'fieldcontainer', items: tempItems, fieldLabel: this.fieldLabel, vertical: true, labelStyle: this.labelStyle };
      if (this.labelWidth) {
        containerWrapperConfig.labelWidth = this.labelWidth;
      }
      this.items.push(containerWrapperConfig);
    } else {
      this.items = tempItems;
    }

    this.callParent(arguments);//initComponent on super
  }
});

