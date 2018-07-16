package gw.lob.common

uses gw.lang.Export

uses gw.api.logicalmatch.AbstractEffDatedPropertiesMatcher
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo
uses gw.entity.IEntityPropertyInfo

/**
 * Matches {@link BuildingImprovement}s based on
 * <ul>
 *   <li>The foreign key to the parent #Building</li>
 *   <li>The improvement type #BuildingImprType  e.g. Heating - note, this assumes that there can only be one improvement type per building</li>
 * </ul>
 */
@Export
class BuildingImprovementMatcher extends AbstractEffDatedPropertiesMatcher<BuildingImprovement> {

  construct(owner : BuildingImprovement) {
    super(owner)
  }
  
  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return {BuildingImprovement.Type.TypeInfo.getProperty("Building") as ILinkPropertyInfo}
  }

  override property get IdentityColumns() : Iterable<IEntityPropertyInfo> {
    return { BuildingImprovement.Type.TypeInfo.getProperty("BuildingImprType") as IEntityPropertyInfo}
  }

}
