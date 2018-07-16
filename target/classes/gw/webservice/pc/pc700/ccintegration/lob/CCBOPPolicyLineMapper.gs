package gw.webservice.pc.pc700.ccintegration.lob
uses gw.webservice.pc.pc700.ccintegration.CCBasePolicyLineMapper
uses java.lang.Integer
uses gw.webservice.pc.pc700.ccintegration.CCPolicyGenerator
uses java.util.ArrayList
uses gw.webservice.pc.pc700.ccintegration.ccentities.CCPolicySummaryProperty
uses gw.webservice.pc.pc700.ccintegration.ccentities.CCBuildingRU
uses gw.webservice.pc.pc700.ccintegration.ccentities.CCPropertyCoverage
uses gw.webservice.pc.pc700.ccintegration.ccentities.CCPropertyRU
uses gw.api.domain.covterm.CovTerm
uses gw.webservice.pc.pc700.ccintegration.ccentities.CCCoverage
uses gw.webservice.pc.pc700.ccintegration.ccentities.CCCovTerm
uses gw.api.domain.covterm.TypekeyCovTerm

@Export
@Deprecated("As of 8.0 use gw.webservice.pc.pc800.ccintegration.lob.CCBOPPolicyLineMapper instead")
class CCBOPPolicyLineMapper extends CCBasePolicyLineMapper {

  var _bopLine : BOPLine;
  var _RUCount : Integer;

  construct(line : PolicyLine, policyGen : CCPolicyGenerator) {
    super(line, policyGen);
    _bopLine = line as BOPLine;
  }

  // Create a summary list of covered buildings for the PolicySummary that is returned for a search result (not a full policy mapping)
  override function mapPropertySummaries(propertyList : ArrayList<CCPolicySummaryProperty>) {
    var count = propertyList.Count;   // Use for numbering the properties across multiple lines

    for (boploc in _bopLine.BOPLocations.sortBy(\ l -> l.Location.LocationNum)) {
      if(meetsLocationFilteringCriteria(boploc.Location)) {
        for (bld in boploc.Buildings.sortBy(\ b -> b.Building.BuildingNum)) {
          if (_policyGen.meetsPolicySystemIDFilteringCriteria(bld.TypeIDString)) {
            var ccBld = new CCPolicySummaryProperty();
            ccBld.PolicySystemID = bld.TypeIDString
            propertyList.add(ccBld);

            count = count + 1
            ccBld.PropertyNumber = count;

            var loc = boploc.PolicyLocation;
            ccBld.Location = loc.LocationNum.toString();
            ccBld.BuildingNumber = bld.Building.BuildingNum.toString();
            ccBld.Address = loc.AddressLine1;
            if (loc.AddressLine2.HasContent) {
              ccBld.Address = ccBld.Address + ", " + loc.AddressLine2;
            }
            ccBld.City = loc.City;
            ccBld.Description = trimRUDescription(bld.Building.Description)
          }
        }
      }
    }
  }

  override function getLineCoverages() : List<entity.Coverage> {
    return _bopLine.BOPLineCoverages as List<entity.Coverage>
  }

//  override function setLineSpecificFields() {
//  }

  override function createRiskUnits() {
    // Keep a count as we add risk units.  This may start > 0 if other lines have been processed first.
    _RUCount = _ccPolicy.RiskUnits.Count;
    var startingCount = _RUCount;
    var skipCount = 0;   // Used to track how many "properties" were filtered out

    // Create risk units for each building
    for (boploc in _bopLine.BOPLocations.sortBy(\ l -> l.Location.LocationNum)) {
      if (meetsLocationFilteringCriteria(boploc.Location)) {
        // Get the Location
        var ccLoc = _policyGen.getOrCreateCCLocation( boploc.Location );

        // Create location-level risk units and coverages against those risk units
        // First, create the location-level risk
        var locRU = new CCPropertyRU();
        _ccPolicy.addToRiskUnits(locRU);

        _RUCount = _RUCount + 1
        locRU.RUNumber = _RUCount;

        locRU.PolicyLocation = ccLoc;
        locRU.Description = trimRUDescription(boploc.DisplayName);
        locRU.PolicySystemID = boploc.TypeIDString;

        // Create location-level coverages
        for (cov in boploc.Coverages.sortBy(\ c -> c.Pattern.Priority)) {
            var ccCov = new CCPropertyCoverage()
            populateCoverage(ccCov, cov)
            locRU.addToCoverages( ccCov )
        }

        // Process all the buildings on location
        for (bld in boploc.Buildings.sortBy(\ b -> b.Building.BuildingNum)) {
          if (_policyGen.meetsPolicySystemIDFilteringCriteria(bld.TypeIDString)) {
            var ccBuilding = _policyGen.getOrCreateCCBuilding(bld.Building);

            // Create a new risk unit
            var ru = new CCBuildingRU();
            _ccPolicy.addToRiskUnits(ru);

            _RUCount = _RUCount + 1
            ru.RUNumber = _RUCount;
            ru.Building = ccBuilding;
            ru.PolicyLocation = ccLoc;
            ru.Description = trimRUDescription(bld.Building.Description)
            ru.PolicySystemID = bld.TypeIDString;

            // Process building-level coverages
            for (cov in bld.Coverages.sortBy(\ c -> c.Pattern.Priority)) {
              var ccCov = new CCPropertyCoverage()
              populateCoverage(ccCov, cov)
              ru.addToCoverages( ccCov )
            }

            // For building-level additional interests (e.g., lienholders), add a location-level contact in CC
            for (addInterest in bld.AdditionalInterests) {
              addRULevelAdditionalInterest(ru, addInterest.PolicyAddlInterest.ContactDenorm);
            }
          } else { // Filtered out the building so add 1 to the number skipped
            skipCount = skipCount + 1
          }
        } // End of each building
      } else {  // Filtered out the location
        skipCount = skipCount + boploc.Buildings.Count + 1;  // Count buildings + 1 for the location-level risk
      }
    } // end of each location

    addToPropertiesCount(_RUCount - startingCount + skipCount);
  }

  override function handleCovTermSpecialCases(pcCov : Coverage, pcCovTerm : CovTerm, ccCov : CCCoverage, ccCovTerms : CCCovTerm[]) {

    super.handleCovTermSpecialCases(pcCov, pcCovTerm, ccCov, ccCovTerms);

    // Handle coinsurance
    if (((pcCov.PatternCode == "BOPBuildingCov") and (pcCovTerm.PatternCode == "BOPBuildingCoin")) or
        ((pcCov.PatternCode == "BOPPersonalPropCov") and (pcCovTerm.PatternCode == "BOPPersonalPropCoin")))
    {
      (ccCov as CCPropertyCoverage).Coinsurance = mapCoinsurance(pcCovTerm.ValueAsString);
    }

    // Handle valuation method (Actual Cash Value vs. Replacement Cost)
    if (((pcCov.PatternCode == "BOPBuildingCov") and (pcCovTerm.PatternCode == "BOPBldgValuation")) or
        ((pcCov.PatternCode == "BOPPersonalPropCov") and (pcCovTerm.PatternCode == "BOPBPPValuation")))
    {
      // Map the values in PC that have corresponding values in CC
      (ccCov as CCPropertyCoverage).CoverageBasis = mapValuationMethod((pcCovTerm as TypekeyCovTerm).Value.Code);
    }

  }
}
