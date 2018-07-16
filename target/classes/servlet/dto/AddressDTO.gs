package servlet.dto

/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/27/18
 * Time: 8:55 PM
 * To change this template use File | Settings | File Templates.
 */
class AddressDTO {
  var address: String as Address
  var city: String as City
  var state: String as State
  var zip: String as Zip
  override function toString(): String {
    return this.address+" "+this.state+" "+this.zip
  }
}