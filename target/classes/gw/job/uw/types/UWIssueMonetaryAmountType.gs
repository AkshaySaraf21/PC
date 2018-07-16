package gw.job.uw.types

uses gw.job.uw.UWIssueValueType
uses gw.pl.currency.MonetaryAmount

uses java.lang.IllegalArgumentException
uses java.lang.NumberFormatException
uses gw.api.util.CurrencyUtil
uses java.math.BigDecimal

@Export
class UWIssueMonetaryAmountType implements UWIssueValueType {

  override function deserialize(value : String) : MonetaryAmount {
    try {
      return value == null ? null : new MonetaryAmount(value)
    } catch (ex : IllegalArgumentException) {
      // UW issues that were created before 8.x did not have currencies in the Value column. This is why the constructor
      // of MonetaryAmount is throwing the IllegalArgumentException. In this case, we use the default currency.
      return new MonetaryAmount(new BigDecimal(value.trim()), CurrencyUtil.getDefaultCurrency().getCode());
    }
  }
  
  override function serialize(obj : Object) : String {
    var value = obj as MonetaryAmount
    return value == null ? null : value.toString()
  }

  override function validate(value : String) : String {
    try {
      deserialize(value)
      return null
    } catch (e : NumberFormatException) {
      return displaykey.UWIssue.MonetaryAmountType.InvalidMonetaryAmount(value)
    } catch (e : IllegalArgumentException) {
      return displaykey.UWIssue.MonetaryAmountType.InvalidMonetaryAmount(value)
    }
  }
}
