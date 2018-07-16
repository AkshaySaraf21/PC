package gw.job.uw.types

uses gw.job.uw.UWIssueValueType
uses java.math.BigDecimal
uses java.lang.NumberFormatException
uses java.lang.NullPointerException
uses java.lang.RuntimeException
uses gw.api.util.PCNumberFormatUtil

@Export
class UWIssueBigDecimalType implements UWIssueValueType {
  override function deserialize(value : String) : BigDecimal {
    return value == null ? null : new BigDecimal(value)  
  }
  
  override function serialize(obj : Object) : String {
    var value = obj as BigDecimal
    return value == null ? null : value.toString()  
  }

  override function validate(value : String) : String {
    if (value == null) {
      return displaykey.UWIssue.BigDecimalType.InvalidDecimal
    }
    try {
      var bdValue = PCNumberFormatUtil.parse(value)
      return null 
    } catch (e : NumberFormatException) {
      return displaykey.UWIssue.BigDecimalType.InvalidDecimalValue(value)
    } catch (e: NullPointerException) {
      return displaykey.UWIssue.BigDecimalType.InvalidDecimal
    } catch (e: RuntimeException) {
      return displaykey.UWIssue.BigDecimalType.InvalidDecimalValue(value)
    }
  }
}
