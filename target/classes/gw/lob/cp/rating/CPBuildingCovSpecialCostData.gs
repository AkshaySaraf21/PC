package gw.lob.cp.rating

uses gw.financials.PolicyPeriodFXRateCache

@Export
class CPBuildingCovSpecialCostData extends CPBuildingCovCostData<CPBuildingCovSpecCost> {

  construct(effDate : DateTime, expDate : DateTime, covID : Key, stateArg : Jurisdiction) {
    super(effDate, expDate, covID, stateArg)
  }

  construct(effDate : DateTime, expDate : DateTime, c : Currency, rateCache : PolicyPeriodFXRateCache, covID : Key, stateArg : Jurisdiction) {
    super(effDate, expDate, c, rateCache, covID, stateArg)
  }

  construct(cost : CPBuildingCovSpecCost) {
    super(cost)
  }

  construct(cost : CPBuildingCovSpecCost, rateCache : PolicyPeriodFXRateCache) {
    super(cost, rateCache)
  }

  override function setSpecificFieldsOnCost(line : CommercialPropertyLine, cost : CPBuildingCovSpecCost) {
    super.setSpecificFieldsOnCost(line, cost)
  }
  
  override function toString() : String {
    return super.toString() + " Coverage : Special"  // no need for i18n
  }

}
