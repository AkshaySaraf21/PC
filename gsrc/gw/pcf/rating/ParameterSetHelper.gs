package gw.pcf.rating

uses gw.api.database.Query
uses gw.rating.rtm.util.ProductModelUtils

@Export
class ParameterSetHelper {

  construct() {

  }
  
  function getAllParamSets() : List<CalcRoutineParameterSet> {
    return new Query<CalcRoutineParameterSet>(CalcRoutineParameterSet).select().orderBy(\ c -> c.Name).toList()
  }

  function getParamSets(polLinePatternCode : String) : List<CalcRoutineParameterSet> {
    return getAllParamSets().where(\ ps -> ps.PolicyLinePatternCode == null or ps.PolicyLinePatternCode == polLinePatternCode)
  }

  // TODO: does this do what we want, or was param sets a heuristic for "there is Rateflow data for this LOB?"
  function getAllLOBsWithParamSets() : String[] {
    var activePolicyPatternCodes = getAllParamSets().map(\ps -> ps.PolicyLinePatternCode)
    // a parameter set with a null policy line is available on any line
    if(activePolicyPatternCodes.contains(null)) {
      return ProductModelUtils.getAllPolicyLines().toTypedArray()
    }
    return ProductModelUtils.getAllPolicyLines().where(\code -> activePolicyPatternCodes.contains(code)).toTypedArray()
  }

  function getHelpStringForParamTypes(paramSet : CalcRoutineParameterSet) : String {
    var params = paramSet.Parameters
    if (params.Count>0) {
      return params.map(\param -> param.Code.DisplayName + " (" + param.ParamType + ")").join(", ")
    } else {
      return ""
    }
  }

  function getStringForParamTypes(paramSet : CalcRoutineParameterSet) : String {
    var params = paramSet.Parameters
    if (params.Count>0) {
      return params.map(\param -> param.Code.DisplayName).join(", ")
    } else {
      return ""
    }
  }

}
