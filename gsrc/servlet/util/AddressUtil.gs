package servlet.util

uses servlet.dto.AddressDTO
/**
 * Created with IntelliJ IDEA.
 * User: akssaraf
 * Date: 2/27/18
 * Time: 9:11 PM
 * To change this template use File | Settings | File Templates.
 */
class AddressUtil {
 public static function toDTO(add:Address):AddressDTO {
   var dto=new AddressDTO()
   dto.Address=add.AddressLine1
   dto.City=add.City
   dto.State=add.State.toString()
   dto.Zip=add.CityStateZip
   return dto
 }
}