package servlet.dto

uses java.lang.Integer

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/27/18
 * Time: 8:49 PM
 * To change this template use File | Settings | File Templates.
 */
class AccountDTO {
  var accountNumber: String as AccountNumber
  var noOfIssuedPolicies: Integer as NoOfIssuedPolicies
  var producerCode: String as ProducerCode
  var primaryLocation: String as PrimaryLocation
  var industryCode: String as IndustryCode
  var contactDisplayName: String as ContactDisplayName
  var isAccountFound: Boolean as IsAccountFound = true
  var underwriter: String as Underwriter
  var numberOfOpenJobs: Integer as NumberOfOpenJobs
  var organizationType: String as OrganizationType

}