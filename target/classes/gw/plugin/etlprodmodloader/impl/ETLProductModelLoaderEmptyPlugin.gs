package gw.plugin.etlprodmodloader.impl

uses gw.plugin.etlprodmodloader.IETLProductModelLoaderPlugin

/**
 * This plugin's implementation is purposely left empty.
 *
 * Use this class in IETLProductModelLoaderPlugin.gwp if you choose not to
 * run product model ETL at startup.
 */
@Export
class ETLProductModelLoaderEmptyPlugin implements IETLProductModelLoaderPlugin {
  override function loadProductModel() {
  }
}
