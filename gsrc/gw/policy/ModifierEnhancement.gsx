package gw.policy

uses java.math.BigDecimal
uses gw.api.util.PCNumberFormatUtil

enhancement ModifierEnhancement : entity.Modifier
{
  /**
   * @return the sum of all rate factors on this modifier
   */
  property  get RateFactorsSum() : BigDecimal {
    var val : double
    val = 0
    for (rateFactor in this.RateFactors) {
      if (rateFactor.Assessment != null) {
        val = val + rateFactor.Assessment.doubleValue()
      }
    }
    return val
  }
  
  /**
   * The validation expression to validate the given value. Returns null if the given
   * value is in the range allowed for this modifier; Otherwise, an error message is returned.
   */
  function getModifierValidation(target : String) : String {
    return getModifierValidation(PCNumberFormatUtil.parse(target))
  }

  /**
   * The validation expression to validate the given value. Returns null if the given
   * value is in the range allowed for this modifier; Otherwise, an error message is returned.
   */
  function getModifierValidation(target : BigDecimal) : String {
    var withinRange = this.Minimum <= target and target <= this.Maximum
    return withinRange ? null : displaykey.Web.Policy.Modifiers.OutOfRange(target, this.Minimum, this.Maximum )
  }
}
