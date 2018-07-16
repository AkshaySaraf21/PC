package gw.plugin.etlprodmodloader.impl.factory

uses gw.api.productmodel.GenericCovTermPattern


/**
 * This class creates and sets the column on a ETLGenericCovTermPattern entity
 */
@Export
class ETLGenericCovTermPatternCreator extends ETLCovTermPatternCreatorImpl<GenericCovTermPattern, ETLGenericCovTermPattern> {

  construct(covTermPattern : GenericCovTermPattern) {
    super(covTermPattern)
  }

  override function createETLCovTermPattern(etlClausePattern : ETLClausePattern) : ETLGenericCovTermPattern {
    var etlGenericCovTermPattern = new ETLGenericCovTermPattern()
    etlGenericCovTermPattern = super.setCommonCovTermFields(etlGenericCovTermPattern, etlClausePattern)
    return etlGenericCovTermPattern
  }

}
