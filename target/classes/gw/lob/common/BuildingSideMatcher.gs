package gw.lob.common

uses gw.api.logicalmatch.AbstractEffDatedPropertiesMatcher
uses gw.entity.IEntityPropertyInfo
uses java.lang.Iterable
uses gw.entity.ILinkPropertyInfo

/**
 * Matches {@link BuildingSide}s based on
 * <ul>
 *   <li>The foreign key to the parent #Building</li>
 *   <li>The improvement type #BuildingSideType  e.g. Front - note, this assumes that there can only be one side of each type per building</li>
 * </ul>
 */
@Export
class BuildingSideMatcher extends AbstractEffDatedPropertiesMatcher<BuildingSide> {

  construct(owner : BuildingSide) {
    super(owner)
  }

  override property get IdentityColumns() : Iterable<IEntityPropertyInfo> {
    return { BuildingSide.Type.TypeInfo.getProperty("BuildingSideType") as IEntityPropertyInfo }
  }

  override property get ParentColumns() : Iterable<ILinkPropertyInfo> {
    return { BuildingSide.Type.TypeInfo.getProperty("Building") as ILinkPropertyInfo }
  }
  
}
