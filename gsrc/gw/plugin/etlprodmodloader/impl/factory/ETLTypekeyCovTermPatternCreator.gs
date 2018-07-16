package gw.plugin.etlprodmodloader.impl.factory

uses gw.api.productmodel.TypekeyCovTermPattern

/**
 * This class creates and sets the columns on a ETLTypekeyCovTermPattern entity
 */
@Export
class ETLTypekeyCovTermPatternCreator extends ETLCovTermPatternCreatorImpl <TypekeyCovTermPattern, ETLTypekeyCovTermPattern> {

  construct(covTermPattern : TypekeyCovTermPattern) {
    super(covTermPattern)
  }

  /**
   * @return the {@link gw.api.productmodel.TypeKeyCovTermPattern} that is used to create the TypeKeyCovTermPattern
   */
  property get TypekeyCovTermPattern() : TypekeyCovTermPattern {
    return this.CovTermPattern
  }

  override function createETLCovTermPattern(etlClausePattern : ETLClausePattern): ETLTypekeyCovTermPattern {
    var etlTypekeyCovTermPattern = new ETLTypekeyCovTermPattern()
    etlTypekeyCovTermPattern = super.setCommonCovTermFields(etlTypekeyCovTermPattern, etlClausePattern)
    etlTypekeyCovTermPattern.Typelist = TypekeyCovTermPattern.TypelistName
    return etlTypekeyCovTermPattern
  }

}
