package servlet.util

uses servlet.dto.AccountDTO
uses gw.api.database.Query
uses servlet.exception.PortalException

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/27/18
 * Time: 9:14 PM
 * To change this template use File | Settings | File Templates.
 */
class AccountUtil {
  public static function toDTO(acc:Account):AccountDTO {
    var dto=new AccountDTO()
    dto.AccountNumber=  acc.AccountNumber
    dto.ContactDisplayName=acc.AccountHolderContact.DisplayName
    dto.IndustryCode=acc.IndustryCode.toString()
    dto.NoOfIssuedPolicies=acc.IssuedPoliciesAsArray.length
    dto.PrimaryLocation=AddressUtil.toDTO(acc.PrimaryLocation).toString()
    dto.ProducerCode=acc.ProducerCodes.first().ProducerCode.DisplayName
    return dto
  }
  public static function getAccountByAccountNumber(accountNumber: String): Account {
    var acc = Query.make(Account).compare("AccountNumber", Equals, accountNumber).select().first()
    if (acc == null){
      throw new PortalException("account Not pound")
    }
    return acc
  }
}