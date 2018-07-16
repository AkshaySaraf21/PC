package gw.rating.worksheet.treenode.builder.populator

uses gw.rating.worksheet.domain.WorksheetConstant
uses java.lang.StringBuilder

@Export
class WorksheetConstantPopulator extends WorksheetOperandContainerPopulator<WorksheetConstant> {

  override function populateOperandAndValue(operandContainer : WorksheetConstant, operandBuilder : StringBuilder, valueBuilder : StringBuilder, displayArgumentValues : boolean) {
    if (operandContainer.Value typeis List) {
      var values = operandContainer.Value.cast(gw.entity.TypeKey).map(\ tk -> tk.DisplayName)
      operandBuilder.append(displaykey.Web.Rating.Flow.CalcRoutine.Collection(
          values.join(displaykey.Web.Rating.Flow.CalcRoutine.CollectionSeparator)  ))

      valueBuilder.append(displaykey.Web.Rating.Flow.CalcRoutine.Collection(
          values.join(displaykey.Web.Rating.Flow.CalcRoutine.CollectionSeparator)  ))

    } else {
      var localizedOperandValue = super.localize(operandContainer)
      operandBuilder.append(localizedOperandValue)
      valueBuilder.append(localizedOperandValue)
    }
  }
}
