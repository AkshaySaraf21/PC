package gw.plugin.etlprodmodloader.impl.factory

uses gw.api.productmodel.CovTermPattern
uses gw.api.productmodel.ClausePattern

/**
 * Interface for the ETLCovTermPattern creators.
 */
@Export
interface ETLCovTermPatternCreator<S extends CovTermPattern, T extends ETLCoverageTermPattern> {

  /**
   * This method creates the ETLCovTermPattern entities with the appropriate values for each column
   * of the entity. Each subtype of the ETlCovTermPattern may define columns specific for that subtype, so
   * there may be multiple creators for each subtype.
   * @return - A new instance of the {@link entity.ETLCoverageTermPattern} with the appropriate column values set
   */
  function createETLCovTermPattern(etlClausePattern : ETLClausePattern) : T
}
