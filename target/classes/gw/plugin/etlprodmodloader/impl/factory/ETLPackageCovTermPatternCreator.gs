package gw.plugin.etlprodmodloader.impl.factory

uses gw.api.productmodel.PackageCovTermPattern


/**
 * This class creates and sets the columns on a ETLTypekeyCovTermPattern entity
 */
@Export
class ETLPackageCovTermPatternCreator extends ETLCovTermPatternCreatorImpl<PackageCovTermPattern, ETLPackageCovTermPattern> {

  construct(covTermPattern : PackageCovTermPattern) {
    super(covTermPattern)
  }

  /**
   * @return the {@link gw.api.productmodel.PackageCovTermPattern} that is used to create the ETLPackageCovTermPattern
   */
  property get PackageCovTermPattern() : PackageCovTermPattern {
    return this.CovTermPattern
  }

  override function createETLCovTermPattern(etlClausePattern : ETLClausePattern) : ETLPackageCovTermPattern {
    var etlPackageCovTermPattern = new ETLPackageCovTermPattern()
    super.setCommonCovTermFields(etlPackageCovTermPattern, etlClausePattern)

    for (pack in PackageCovTermPattern.Packages){
      var etlCovTermPack = new ETLCovTermPack()
      etlCovTermPack.CoverageTermPattern = etlPackageCovTermPattern
      etlPackageCovTermPattern.addToPackages(etlCovTermPack)
      etlCovTermPack.Name = pack.DisplayName
      etlCovTermPack.PackageCode = pack.PackageCode
      etlCovTermPack.PatternID = pack.PublicID
      etlCovTermPack.Currency = pack.Currency

      for (term in pack.PackageTerms){
        var etlPackageTerm = new ETLPackageTerm()
        etlPackageTerm.CovTermPack = etlCovTermPack
        etlCovTermPack.addToPackageTerms(etlPackageTerm)
        etlPackageTerm.Name = term.Name
        etlPackageTerm.Value = term.Value
        etlPackageTerm.ValueType = term.ValueType.Code 
        etlPackageTerm.PatternID = term.PublicID
      }
    }
    return etlPackageCovTermPattern
  }

}
