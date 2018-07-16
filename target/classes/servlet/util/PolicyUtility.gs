package servlet.util

uses gw.api.database.Query
uses servlet.exception.PortalException
uses servlet.dto.PolicyDTO
uses servlet.dto.RenewalDTO

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/20/18
 * Time: 2:58 PM
 * To change this template use File | Settings | File Templates.
 */
class PolicyUtility {
  public static function getPolicyByPolicyNumber(policyNumber: String): Policy {
    var foundPolicy = Query.make(PolicyPeriod).compare("PolicyNumber", Equals, policyNumber).select().first()
    if (foundPolicy == null){
      throw new PortalException("Policy Not pound")
    }
    return foundPolicy.Policy
  }

  public static function toDTO(policy: Policy): PolicyDTO {
    var dto = new PolicyDTO()
    dto.PolicyNumber = policy.LatestPeriod.PolicyNumber
    dto.AccountNumber = policy.Account.AccountNumber
    dto.LOB = policy.ProductCode
    dto.PeriodEndDate = policy.LatestPeriod.PeriodStart
    dto.PeriodEndDate = policy.LatestPeriod.PeriodEnd
    dto.PrimaryNamedInsured = policy.LatestPeriod.PrimaryInsuredName
    dto.TotalPremium = policy.LatestPeriod.TotalPremiumRPT_amt.toString()

    return dto
  }

  public static function getRenewalDetails(pol: Policy): RenewalDTO {
    var renewal = pol.OpenRenewalJob
    if (renewal == null){
      return new RenewalDTO(){
          : IsRenewalFound = false
      }
    }
    return new RenewalDTO(){
        : AccountNumber = renewal.Policy.Account.AccountNumber,
        : EffectiveDate = renewal.LatestPeriod.EditEffectiveDate,
        : ExpirationDate = renewal.LatestPeriod.PeriodEnd,
        : JobNumber = renewal.JobNumber,
        : TotalPremium = renewal.LatestPeriod.TotalPremiumRPT_amt.toString(),
        : PolicyNumber = renewal.LatestPeriod.PolicyNumber,
        : Status = renewal.LatestPeriod.Status.toString(),
        : IsRenewalFound = true
    }
  }
}