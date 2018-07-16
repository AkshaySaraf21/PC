package servlet.dto

uses java.util.Date
/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/28/18
 * Time: 6:41 PM
 * To change this template use File | Settings | File Templates.
 */
class RenewalDTO {
  var policyNumber: String as PolicyNumber
  var jobNumber: String as JobNumber
  var effectiveDate: Date as EffectiveDate
  var expirationDate: Date as ExpirationDate
  var accountNumber: String as AccountNumber
  var totalPremium: String as TotalPremium
  var isRenewalFound: Boolean as IsRenewalFound
  var status: String as Status
}