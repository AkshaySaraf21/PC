package gw.lob.common

uses gw.lang.Export
uses gw.api.copier.AbstractEffDatedCopyable

@Export
class BuildingImprovementEffDatedCopier extends AbstractEffDatedCopyable<BuildingImprovement> {
  construct(loc : BuildingImprovement) {
    super(loc)
  }

  override function copyBasicFieldsFromBean(aBuildingImprovement : BuildingImprovement) {
    this._bean.YearAdded = aBuildingImprovement.YearAdded
    this._bean.Notes = aBuildingImprovement.Notes
  }
}