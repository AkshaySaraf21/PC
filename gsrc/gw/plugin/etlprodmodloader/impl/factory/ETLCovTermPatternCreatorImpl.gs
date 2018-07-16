package gw.plugin.etlprodmodloader.impl.factory

uses gw.api.productmodel.CovTermPattern

/**
 * This class provides the common methods that utilized in the specific coverage term pattern creators such as
 * {@link gw.plugin.etlprodmodloader.impl.factory.ETLDirectCovTermPatternCreator}
 */
@Export
abstract class ETLCovTermPatternCreatorImpl<S extends CovTermPattern, T extends ETLCoverageTermPattern> implements ETLCovTermPatternCreator<S, T> {

  private var _covTermPattern : S as readonly CovTermPattern

  construct(covTermPattern : S) {
    _covTermPattern = covTermPattern
  }

  /**
   * Set the common coverage term pattern fields for this ETLCoverageTermPattern
   * @param etlCoverageTermPattern - the coverage term pattern that will be set
   * @return - the ETLCoverageTermPattern with the common fields set
   */
  protected function setCommonCovTermFields(etlCoverageTermPattern : T, etlClausePattern : ETLClausePattern): T {
    etlCoverageTermPattern.Code = _covTermPattern.Code
    etlCoverageTermPattern.ColumnName = _covTermPattern.CoverageColumnProperty.Name
    etlCoverageTermPattern.ModelType = _covTermPattern.ModelType.Code
    etlCoverageTermPattern.Name = _covTermPattern.Name
    etlCoverageTermPattern.PatternID = _covTermPattern.PublicID
    etlCoverageTermPattern.ClausePattern = etlClausePattern
    etlCoverageTermPattern.CovTermType = _covTermPattern.ValueTypeName
    return etlCoverageTermPattern
  }
}
