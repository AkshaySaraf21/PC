package gw.pcf.rating.flow

uses gw.search.SearchCriteria
uses gw.pc.rating.flow.AvailableCoverageWrapper
uses gw.plugin.rateflow.IRateRoutinePlugin
uses gw.plugin.Plugins

@Export
class CoverageWrapperSearchCriteria extends SearchCriteria<AvailableCoverageWrapper> {

  var _linePattern: String

  construct(linePattern: String) {
    _linePattern = linePattern
  }

  override property get HasMinimumSearchCriteria(): boolean {
    // only criterion is pattern code, and we can assume that's valid.
    return true
  }

  override property get MinimumSearchCriteriaMessage(): String {
    return ""
  }

  override function doSearch(): AvailableCoverageWrapper [] {
    return Plugins.get(IRateRoutinePlugin).getCoverageWrappersForLine(_linePattern)
  }

  function containsResult(className : String) : boolean {
    return doSearch().hasMatch(\ w -> className == w.WrapperType.Name)
  }
}