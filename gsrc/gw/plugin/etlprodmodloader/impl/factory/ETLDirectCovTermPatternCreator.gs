package gw.plugin.etlprodmodloader.impl.factory

uses java.util.HashSet
uses java.util.HashSet
uses gw.api.productmodel.DirectCovTermPattern
uses gw.api.productmodel.Offering
uses gw.api.productmodel.ProductLookup
uses gw.api.productmodel.Offering
uses gw.api.productmodel.ClausePattern

/**
 * This class creates and sets the columns on a ETLDirectCovTermPattern entity
 */
@Export
class ETLDirectCovTermPatternCreator extends ETLCovTermPatternCreatorImpl<DirectCovTermPattern, ETLDirectCovTermPattern> {
  construct(covTermPattern : DirectCovTermPattern) {
    super(covTermPattern)
  }

  /**
   * @return the {@link gw.api.productmodel.DirectCovTermPattern} that is used to create the ETLDirectCovTermPattern
   */
  property get DirectCovTermPattern() : DirectCovTermPattern {
    return this.CovTermPattern
  }

  override function createETLCovTermPattern(etlClausePattern : ETLClausePattern): ETLDirectCovTermPattern {
    var etlDirectCovTermPattern = new ETLDirectCovTermPattern()
    etlDirectCovTermPattern = super.setCommonCovTermFields(etlDirectCovTermPattern, etlClausePattern)
    etlDirectCovTermPattern.ValueType = DirectCovTermPattern.ValueType.Code
    return etlDirectCovTermPattern
  }
}
