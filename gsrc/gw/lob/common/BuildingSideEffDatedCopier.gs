package gw.lob.common

uses gw.lang.Export
uses gw.api.copier.AbstractEffDatedCopyable

@Export
class BuildingSideEffDatedCopier extends AbstractEffDatedCopyable<BuildingSide> {

  construct(loc : BuildingSide) {
    super(loc)
  }

  override function copyBasicFieldsFromBean(aBuildingSide : BuildingSide) {
    this._bean.Description = aBuildingSide.Description
  }
}
