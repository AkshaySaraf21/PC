package gw.plugin.etlprodmodloader.impl.factory

uses com.guidewire.pc.api.productmodel.ClausePatternInternal
uses gw.api.productmodel.ClausePattern
uses gw.api.productmodel.CovTermPattern
uses gw.api.productmodel.CoveragePattern
uses gw.api.productmodel.DirectCovTermPattern
uses gw.api.productmodel.GenericCovTermPattern
uses gw.api.productmodel.OptionCovTermPattern
uses gw.api.productmodel.PackageCovTermPattern
uses gw.api.productmodel.TypekeyCovTermPattern

uses java.lang.RuntimeException
uses java.lang.IllegalArgumentException

/**
 * This class creates the ETL clause pattern entities using the provided product model clause pattern (condition, exclusion, coverage)
 */
@Export
abstract class ETLClausePatternCreator {
  /**
   * This method sets the fields on the clause pattern
   * @param clausePattern - the {@link gw.api.productmodel.ClausePattern} from which the fields are used to set the {@link entity.ETLClausePattern}
   */
  static function createETLClausePattern(clausePattern: ClausePattern) : ETLClausePattern {
    final var etlClausePattern = new ETLClausePattern()
    final var clausePatternInternal = (clausePattern as ClausePatternInternal)
    if (clausePattern typeis CoveragePattern) {
      etlClausePattern.CoveredPartyType = clausePattern.CoveredPartyType.Code
    }
    etlClausePattern.CoverageCategory = clausePattern.CoverageCategoryID
    etlClausePattern.OwningEntityType = clausePattern.OwningEntityType
    etlClausePattern.PatternID = clausePattern.PublicID
    etlClausePattern.CoverageSubtype = clausePatternInternal.Subtype
    etlClausePattern.Name = clausePattern.Name
    etlClausePattern.ClauseType = clausePatternInternal.ClauseType.RelativeName

    for (covTermPattern in clausePattern.CovTerms) {
      var etlCovTermPatternCreator = getETLCovTermPatternCreator(covTermPattern)
      if (etlCovTermPatternCreator == null) {
        throw new RuntimeException("There is no ETLCovTermPatternCreator for this type ${covTermPattern}")
      }
      var etlCoverageTermPattern = etlCovTermPatternCreator.createETLCovTermPattern(etlClausePattern)
      etlClausePattern.addToCoverageTermPatterns(etlCoverageTermPattern)
    }
    return etlClausePattern
  }

  private static function getETLCovTermPatternCreator(covTermPattern: CovTermPattern): ETLCovTermPatternCreatorImpl {
    if (covTermPattern typeis OptionCovTermPattern) {
      return new ETLOptionCovTermPatternCreator(covTermPattern)
    } else if (covTermPattern typeis PackageCovTermPattern) {
      return new ETLPackageCovTermPatternCreator (covTermPattern)
    } else if (covTermPattern typeis DirectCovTermPattern) {
      return new ETLDirectCovTermPatternCreator (covTermPattern)
    } else if (covTermPattern typeis GenericCovTermPattern) {
      return new ETLGenericCovTermPatternCreator (covTermPattern)
    } else if (covTermPattern typeis TypekeyCovTermPattern){
      return new ETLTypekeyCovTermPatternCreator (covTermPattern)
    }
    throw new IllegalArgumentException("No ETLCovTermPatternCreator for CovTermPattern of type: " + covTermPattern.PropertyType)
  }
}
