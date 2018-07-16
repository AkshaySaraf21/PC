package gw.pcf.coverage

uses gw.api.domain.covterm.DirectCovTerm

uses java.lang.Double
uses gw.api.util.PCNumberFormatUtil

@Export
class CovTermDirectInputSetHelper {

  public static function validate(covTerm : DirectCovTerm): String {
    if (covTerm == null) {
      return displaykey.Java.Validation.NonNullable(new Object[]{"Term"})
    } else {
      return covTerm.validateValueInRange(covTerm.Value);
    }
  }

  public static function convertFromString(value: String): Object {
    return PCNumberFormatUtil.parse(value)
  }

  public static function convertToString(value: Object): String {
    return PCNumberFormatUtil.render(value as Number)
  }
}
