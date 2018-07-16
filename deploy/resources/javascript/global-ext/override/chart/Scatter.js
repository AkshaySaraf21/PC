/**
 * @SenchaUpgrade
 * PL-28784 Sencha Scatter charts when hiding different data axes
 */
Ext.define('Gw.override.chart.Scatter', {
  override: 'Ext.chart.series.Scatter',
  drawSeries: function () {
    var me = this,
      chart = me.chart,
      store = chart.getChartStore(),
      group = me.group,
      enableShadows = chart.shadow,
      shadowGroups = me.shadowGroups,
      shadowAttributes = me.shadowAttributes,
      lnsh = shadowGroups.length,
      sprite, attrs, attr, ln, i, endMarkerStyle, shindex, type, shadows,
      rendererAttributes, shadowAttribute;
    endMarkerStyle = Ext.clone(Ext.apply(me.markerStyle, me.markerConfig));
    type = endMarkerStyle.type || 'circle';
    delete endMarkerStyle.type;
    if (!store || !store.getCount()) {
      me.hide();
      me.items = [];
      return;
    }
    me.unHighlightItem();
    me.cleanHighlights();
    attrs = me.getPaths();
    ln = attrs.length;
    for (i = 0; i < ln; i++) {
      attr = attrs[i];
      sprite = group.getAt(i);
      Ext.apply(attr, endMarkerStyle);
      if (!sprite) {
        sprite = me.createPoint(attr, type);
        if (enableShadows) {
          me.createShadow(sprite, endMarkerStyle, type);
        }
      }
      shadows = sprite.shadows;
      if (chart.animate) {
        rendererAttributes = me.renderer(sprite, store.getAt(i), {
          translate: attr
        }, i, store);
        sprite._to = rendererAttributes;
        me.onAnimate(sprite, {
          to: rendererAttributes
        });
        for (shindex = 0; shindex < lnsh; shindex++) {
          shadowAttribute = Ext.apply({}, shadowAttributes[shindex]);
          rendererAttributes = me.renderer(shadows[shindex], store.getAt(i), Ext.apply({}, {
            hidden: false,
            translate: {
              x: attr.x + (shadowAttribute.translate ? shadowAttribute.translate.x : 0),
              y: attr.y + (shadowAttribute.translate ? shadowAttribute.translate.y : 0)
            }
          }, shadowAttribute), i, store);
          me.onAnimate(shadows[shindex], {
            to: rendererAttributes
          });
        }
      } else {
        rendererAttributes = me.renderer(sprite, store.getAt(i), {
          translate: attr
        }, i, store);
        sprite._to = rendererAttributes;
        sprite.setAttributes(rendererAttributes, true);
        for (shindex = 0; shindex < lnsh; shindex++) {
          shadowAttribute = Ext.apply({}, shadowAttributes[shindex]);
          rendererAttributes = me.renderer(shadows[shindex], store.getAt(i), Ext.apply({}, {
            hidden: false,
            translate: {
              x: attr.x + (shadowAttribute.translate ? shadowAttribute.translate.x : 0),
              y: attr.y + (shadowAttribute.translate ? shadowAttribute.translate.y : 0)
            }
          }, shadowAttribute), i, store);
          shadows[shindex].setAttributes(rendererAttributes, true);
        }
      }
      me.items[i].sprite = sprite;
    }
    ln = group.getCount();
    for (i = attrs.length; i < ln; i++) {
      group.getAt(i).hide(true);
    }
    me.renderLabels();
    me.renderCallouts();
  }
});