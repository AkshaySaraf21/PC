package gw.webservice.pc.pc800.ccintegration.lob
uses gw.webservice.pc.pc800.ccintegration.CCBasePolicyLineMapper
uses gw.webservice.pc.pc800.ccintegration.CCPolicyGenerator
uses gw.webservice.pc.pc800.ccintegration.entities.types.complex.CCPolicySummaryVehicle
uses gw.webservice.pc.pc800.ccintegration.entities.types.complex.CCVehicle
uses gw.webservice.pc.pc800.ccintegration.entities.types.complex.CCVehicleRU
uses gw.webservice.pc.pc800.ccintegration.entities.types.complex.CCVehicleCoverage
uses gw.webservice.pc.pc800.ccintegration.entities.anonymous.elements.CCPolicy_RiskUnits
uses gw.webservice.pc.pc800.ccintegration.entities.anonymous.elements.CCRiskUnit_Coverages
uses java.util.ArrayList
uses gw.api.util.StateJurisdictionMappingUtil

@Export
class CCBAPolicyLineMapper extends CCBasePolicyLineMapper {

  var _baLine : BusinessAutoLine;
  
  construct(line : PolicyLine, policyGen : CCPolicyGenerator) {
    super(line, policyGen)
    _baLine = line as BusinessAutoLine;
  }

  // Create a summary list of vehicles for the PolicySummary that is returned for a search result (not a full policy mapping)
  override function mapVehicleSummaries(vehicleList : ArrayList<CCPolicySummaryVehicle>) {   
    for (pcVehicle in _baLine.Vehicles.sortBy(\ v -> v.VehicleNumber) ) {
      if (meetsVehicleFilteringCriteria(pcVehicle)) {
        var ccVehicle = new CCPolicySummaryVehicle();
        vehicleList.add(ccVehicle);
        ccVehicle.PolicySystemID = pcVehicle.TypeIDString;
        ccVehicle.Color = pcVehicle.Color;
        ccVehicle.LicensePlate = pcVehicle.LicensePlate;
        ccVehicle.State = StateJurisdictionMappingUtil.getJurisdictionMappingForState(pcVehicle.LicenseState).Code
        ccVehicle.Make = pcVehicle.Make;
        ccVehicle.Model = pcVehicle.Model;
        ccVehicle.Vin = pcVehicle.Vin;
        ccVehicle.VehicleNumber = pcVehicle.VehicleNumber;
      }
    }
  }

  override function getLineCoverages() : List<entity.Coverage> {
    return _baLine.BALineCoverages as List<entity.Coverage>
  }
  
  override function setLineSpecificFields() {
    _ccPolicy.TotalVehicles += _baLine.Vehicles.Count
  }

  override function createRiskUnits() {
    // Map all the vehicles and their coverages
    for( pcVehicle in _baLine.Vehicles.sortBy(\ v -> v.VehicleNumber) ) {
      if (meetsVehicleFilteringCriteria(pcVehicle)) {
        var ccVehicle = new CCVehicle()
        ccVehicle.PolicySystemID = pcVehicle.TypeIDString
        ccVehicle.Color = pcVehicle.Color
        ccVehicle.LicensePlate = pcVehicle.LicensePlate
        ccVehicle.Make = pcVehicle.Make
        ccVehicle.Model = pcVehicle.Model
        ccVehicle.State = StateJurisdictionMappingUtil.getJurisdictionMappingForState(pcVehicle.LicenseState).Code
        ccVehicle.Vin = pcVehicle.Vin
        ccVehicle.Year = pcVehicle.Year
        ccVehicle.Style = mapBodyType(pcVehicle.BodyType.Code)
        var ccVehicleRU = new CCVehicleRU()
        ccVehicleRU.RUNumber = pcVehicle.VehicleNumber
        if (pcVehicle.Location != null) {
          ccVehicleRU.VehicleLocation = _policyGen.getOrCreateCCLocation( pcVehicle.Location )
        }
        ccVehicleRU.Vehicle = new(ccVehicle)
        ccVehicleRU.Description = pcVehicle.DisplayName
        ccVehicleRU.PolicySystemID = pcVehicle.TypeIDString
        _ccPolicy.RiskUnits.add(new CCPolicy_RiskUnits( ccVehicleRU ))
      
        // Create vehicle-level coverages
        for (pcCov in pcVehicle.Coverages.sortBy(\ c -> c.Pattern.Priority))  {
          var ccCov = new CCVehicleCoverage()
          populateCoverage(ccCov, pcCov)
          ccVehicleRU.Coverages.add(new CCRiskUnit_Coverages( ccCov ))
        }
      
        // Create vehicle-level coverages for each juridiction-level coverage for the jurisdiction of the vehicle
        for (pcCov in pcVehicle.BAJurisdiction.Coverages.sortBy(\ c -> c.Pattern.Priority)) {
          var ccCov = new CCVehicleCoverage()
          populateCoverage(ccCov, pcCov)
          ccVehicleRU.Coverages.add(new CCRiskUnit_Coverages( ccCov ))
        }
      
        // Create vehicle-level lienholders
        for (pcAddInt in pcVehicle.AdditionalInterests) {
          addVehicleOwner(ccVehicle, pcAddInt.PolicyAddlInterest.ContactDenorm);
        }
      }
    }
    
    // Map all the commercial auto drivers
    for (driver in _baLine.Drivers) {
      if (_policyGen.meetsDriverFilteringCriteria(driver.LastName)) {
        var ccDriver = _contactGen.getOrCreatePersonFromCommercialDriver(driver)
        _ccPolicy.CoveredParty.add(ccDriver)
      }
    }
    
  }

  private function meetsVehicleFilteringCriteria(pcVehicle : BusinessVehicle) : boolean {
    // If there is filtering criteria for PolicySystemID, then decide based on that
    if (_policyGen.hasPolicySystemIDFilteringCriteria()) {
      return _policyGen.meetsPolicySystemIDFilteringCriteria(pcVehicle.TypeIDString)
    }
    
    // Otherwise, check if all of the other filtering are met
    return (_policyGen.meetsVINFilteringCriteria(pcVehicle.Vin) and 
            _policyGen.meetsLicensePlateFilteringCriteria(pcVehicle.LicensePlate))
  }
  
}
