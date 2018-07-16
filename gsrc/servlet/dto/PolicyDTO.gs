package servlet.dto

uses java.util.Date

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/20/18
 * Time: 2:58 PM
 * To change this template use File | Settings | File Templates.
 */
class PolicyDTO {
  var policyNumber: String as PolicyNumber
  var lob: String as LOB
  var periodStartDate: Date as PeriodStartDate
  var periodEndDate: Date as PeriodEndDate
  var accountNumber: String as AccountNumber
  var primaryNamedInsured: String as PrimaryNamedInsured
  var totalPremium: String as TotalPremium
  var isPolicyFound: Boolean as IsPolicyFound
}