package gw.webservice.pc.pc700.ccintegration.ccentities

@Export
@Deprecated("As of 8.0 use gw.webservice.pc.pc800.ccintegration.entities.xsd instead")
class CCContactAddress
{
  var _AddressBookUID : String as AddressBookUID
  var _address : CCAddress as Address

  construct()
  {
  }
}
