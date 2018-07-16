package gw.plugin.etlprodmodloader.impl

uses gw.api.database.Query
uses gw.api.productmodel.ClausePattern
uses gw.api.productmodel.ModifierPattern
uses gw.api.system.PCDependenciesGateway
uses gw.api.system.PCLoggerCategory
uses gw.plugin.etlprodmodloader.IETLProductModelLoaderPlugin
uses gw.plugin.etlprodmodloader.impl.factory.ETLClausePatternCreator
uses gw.plugin.etlprodmodloader.impl.factory.ETLModifierPatternCreator

/**
 * This plugin does the creation of the ETL Product Model entities which maps the publicIDs of clause
 * and clause terms to actual values. The current definitions and decoding of the product model
 * information in PolicyCenter currently resides in XML files does not currently exist at the database level.
 * This plugin performs the extraction of coverage data into meaningful business relevance that could be
 * utilized by downstream systems.
 */
@Export
class ETLProductModelLoaderPlugin implements IETLProductModelLoaderPlugin {
  override function loadProductModel() {
    PCLoggerCategory.ETL_PRODMODLOADER_PLUGIN.info("ETLProductModelLoaderPlugin starting load...")
    deleteModel()
    loadModel()
    PCLoggerCategory.ETL_PRODMODLOADER_PLUGIN.info("ETLProductModelLoaderPlugin load complete...")
  }

  /**
   * This methods deletes all of the ETL product model rows from the database
   */
  public function deleteModel() {
    var bundle = gw.transaction.Transaction.getCurrent()
    var etlClausePatterns = Query.make(ETLClausePattern).select().toList()
    for (clausePattern in etlClausePatterns) {
      clausePattern = bundle.add(clausePattern)
      bundle.delete(clausePattern)
      bundle.commit()
    }
    var etlModifierPatterns = Query.make(ETLModifierPattern).select().toList()
    for (modifierPattern in etlModifierPatterns) {
      modifierPattern = bundle.add(modifierPattern)
      bundle.delete(modifierPattern)
      bundle.commit()
    }
  }

  /**
   * This method loads the ETL product model entities into the database by calling
   * the appropriate ETL pattern creators
   */
  public function loadModel() {
    var bundle = gw.transaction.Transaction.getCurrent()
    for (clausePattern in PCDependenciesGateway.getProductModel().getAllInstances(ClausePattern).toTypedArray()) {
      var etlClausePattern = ETLClausePatternCreator.createETLClausePattern(clausePattern)
      bundle.add(etlClausePattern)
      bundle.commit()
    }

    // Load all Modifier Patterns and associated Rate Factor Patterns
    for (modifierPattern in PCDependenciesGateway.getProductModel().getAllInstances(ModifierPattern).toTypedArray()) {
      final var etlModifierPattern = ETLModifierPatternCreator.createETLModifierPattern(modifierPattern)
      bundle.add(etlModifierPattern)
      bundle.commit()
    }
  }
}