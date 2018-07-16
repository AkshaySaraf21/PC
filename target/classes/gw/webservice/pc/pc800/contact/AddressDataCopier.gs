package gw.webservice.pc.pc800.contact
uses gw.api.copy.Copier

/**
 * A nullsafe {@link Copier} that can copy {@link AddressData} into an {@link Address}
 */
@Export
class AddressDataCopier extends Copier<Address> {

  var _addressData : AddressData as readonly Source

  /**
   * If true, then null fields will be copied, otherwise they'll be ignored.
   */
  var _copyNulls : boolean as CopyNulls
  
  /**
   * @param addressData Data source to copy onto an address.
   * @param shouldCopyNulls If true, then null fields will be copied, otherwise they'll be ignored.
   */
  construct(addressData : AddressData, shouldCopyNulls : boolean) {
    _addressData = addressData
    _copyNulls = shouldCopyNulls
    shouldCopy()
  }

  override function copy(target : Address) {
    copyNullSafe(\ -> {target.AddressLine1 = _addressData.AddressLine1}, _addressData.AddressLine1)
    copyNullSafe(\ -> {target.AddressLine1Kanji = _addressData.AddressLine1Kanji}, _addressData.AddressLine1Kanji)
    copyNullSafe(\ -> {target.AddressLine2 = _addressData.AddressLine2}, _addressData.AddressLine2)
    copyNullSafe(\ -> {target.AddressLine2Kanji = _addressData.AddressLine2Kanji}, _addressData.AddressLine2Kanji)
    copyNullSafe(\ -> {target.AddressLine3 = _addressData.AddressLine3}, _addressData.AddressLine3)
    copyNullSafe(\ -> {target.City = _addressData.City}, _addressData.City)
    copyNullSafe(\ -> {target.CityKanji = _addressData.CityKanji}, _addressData.CityKanji)
    copyNullSafe(\ -> {target.State = _addressData.State}, _addressData.State)
    copyNullSafe(\ -> {target.PostalCode = _addressData.PostalCode}, _addressData.PostalCode)
    copyNullSafe(\ -> {target.Country = _addressData.Country}, _addressData.Country)
    copyNullSafe(\ -> {target.County = _addressData.County}, _addressData.County)
    copyNullSafe(\ -> {target.AddressType = _addressData.AddressType}, _addressData.AddressType)
    copyNullSafe(\ -> {target.Description = _addressData.Description}, _addressData.Description)
    copyNullSafe(\ -> {target.ValidUntil = _addressData.ValidUntil}, _addressData.ValidUntil)
    copyNullSafe(\ -> {target.CEDEX = _addressData.CEDEX}, _addressData.CEDEX)
    copyNullSafe(\ -> {target.CEDEXBureau = _addressData.CEDEXBureau}, _addressData.CEDEXBureau)
  }
  
  private function copyNullSafe(assignment(), object : Object) {
    if (_copyNulls or object != null) {
      assignment()
    }
  }
}
