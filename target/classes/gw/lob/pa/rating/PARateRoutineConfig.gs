package gw.lob.pa.rating

uses gw.lang.reflect.IPropertyInfo
uses gw.lang.reflect.IType
uses gw.plugin.rateflow.CostDataBase
uses gw.plugin.rateflow.ICostDataWrapper
uses gw.plugin.rateflow.IRateRoutineConfig
uses gw.rating.CostData
uses gw.rating.flow.domain.CalcRoutineCostData
uses gw.rating.flow.domain.CalcRoutineCostDataWithPremiumCap

uses java.lang.Integer
uses java.math.RoundingMode
uses gw.pc.rating.flow.AvailableCoverageWrapper

@Export
class PARateRoutineConfig implements IRateRoutineConfig {

  // no-args constructor required
  construct() { }

  override function getCostDataWrapperType(paramSet : CalcRoutineParameterSet) : IType {
    if (paramSet.Parameters?.hasMatch(\ param -> param.Code == TC_PREVIOUSTERMAMOUNT)) {
      return CalcRoutineCostDataWithPremiumCap
    } else {
      return CalcRoutineCostData
    }
  }

  override function makeCostDataWrapper(
          paramSet : CalcRoutineParameterSet, 
          costData : CostDataBase, 
          defaultRoundingLevel : Integer, 
          defaultRoundingMode : RoundingMode) : ICostDataWrapper {  

    if (paramSet.Parameters?.hasMatch(\ param -> param.Code == TC_PREVIOUSTERMAMOUNT)) {
      return new CalcRoutineCostDataWithPremiumCap(costData as CostData, defaultRoundingLevel, defaultRoundingMode)
    } else {
      return new CalcRoutineCostData(costData as CostData, defaultRoundingLevel, defaultRoundingMode)                               
    }
  }

  override function worksheetsEnabledForLine(p0 : String) : boolean {
    return true
  }

  override function includeProperty(policyLinePatternCode: String, prop: IPropertyInfo): Boolean {
    return null
  }

  override function getCoverageWrappersForLine(linePatternCode: String): AvailableCoverageWrapper[] {
    return {}
  }
}
